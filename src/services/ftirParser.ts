import * as XLSX from 'xlsx';
import { RawSpectrum } from '../types/ftir';

/**
 * Parses user-uploaded FTIR files (.xlsx, .xls, .csv, .txt, .dat)
 */
export async function parseFTIRFile(file: File): Promise<RawSpectrum[]> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'xlsx' || ext === 'xls') {
    const arrayBuffer = await file.arrayBuffer();
    return parseExcelBuffer(arrayBuffer, file.name);
  } else {
    const text = await file.text();
    return parseTextContent(text, file.name);
  }
}

/**
 * Universal Excel Parser: supports both 2-column format (wn, A)
 * and multi-sample matrix format (wn, sampleA, sampleB, sampleC...)
 */
function parseExcelBuffer(buffer: ArrayBuffer, filename: string): RawSpectrum[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, { header: 1 });

  if (!rawRows || rawRows.length < 5) {
    throw new Error(`File "${filename}" has too few data rows.`);
  }

  // Find header row or first numeric row
  let headerRowIdx = -1;
  let firstNumericRowIdx = -1;

  for (let i = 0; i < Math.min(rawRows.length, 30); i++) {
    const row = rawRows[i];
    if (!row || row.length < 2) continue;

    const num1 = parseNum(row[0]);
    const num2 = parseNum(row[1]);

    if (!isNaN(num1) && !isNaN(num2)) {
      firstNumericRowIdx = i;
      if (i > 0) headerRowIdx = i - 1;
      break;
    }
  }

  if (firstNumericRowIdx === -1) {
    throw new Error(`Could not find spectral numeric data in "${filename}".`);
  }

  // Extract column headers if available
  const headers: string[] = [];
  if (headerRowIdx >= 0 && rawRows[headerRowIdx]) {
    for (let c = 0; c < rawRows[headerRowIdx].length; c++) {
      headers.push(String(rawRows[headerRowIdx][c] || `Col_${c}`));
    }
  }

  // Determine number of columns
  const numCols = rawRows[firstNumericRowIdx].length;
  const results: RawSpectrum[] = [];

  // Case 1: Multiple sample columns (wavenumber in col 0, samples in cols 1, 2, 3...)
  for (let col = 1; col < numCols; col++) {
    const wavenumbers: number[] = [];
    const intensities: number[] = [];

    for (let r = firstNumericRowIdx; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.length <= col) continue;
      const x = parseNum(row[0]);
      const y = parseNum(row[col]);
      if (!isNaN(x) && !isNaN(y)) {
        wavenumbers.push(x);
        intensities.push(y);
      }
    }

    if (wavenumbers.length >= 10) {
      const sampleColName = headers[col] && !headers[col].startsWith('Col_')
        ? headers[col]
        : (numCols > 2 ? `${filename.replace(/\.[^/.]+$/, "")}_Col${col}` : filename);

      results.push(cleanAndPackageSpectrum(wavenumbers, intensities, filename, sampleColName));
    }
  }

  if (results.length === 0) {
    throw new Error(`No valid spectral columns found in "${filename}".`);
  }

  return results;
}

/**
 * Universal Text / CSV / DAT Parser
 */
function parseTextContent(text: string, filename: string): RawSpectrum[] {
  const lines = text.split(/\r?\n/);
  const rows: number[][] = [];
  let headerNames: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Comments or spectrometer header lines
    if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('@') || trimmed.startsWith(';')) {
      continue;
    }

    // Split on comma, semicolon, tab, or whitespace
    let parts = trimmed.split(/[\t,;]+/);
    if (parts.length === 1) {
      parts = trimmed.split(/\s+/);
    }
    parts = parts.map(p => p.trim()).filter(Boolean);

    if (parts.length >= 2) {
      const nums = parts.map(p => parseNum(p));
      const hasNaN = nums.some(n => isNaN(n));

      if (hasNaN && rows.length === 0) {
        // This is a column title header line
        headerNames = parts;
      } else if (!hasNaN) {
        rows.push(nums);
      }
    }
  }

  if (rows.length < 10) {
    throw new Error(`File "${filename}" contains fewer than 10 valid spectral data points.`);
  }

  const numCols = rows[0].length;
  const results: RawSpectrum[] = [];

  for (let col = 1; col < numCols; col++) {
    const wavenumbers: number[] = [];
    const intensities: number[] = [];

    for (let r = 0; r < rows.length; r++) {
      const x = rows[r][0];
      const y = rows[r][col];
      wavenumbers.push(x);
      intensities.push(y);
    }

    const colName = headerNames[col]
      ? headerNames[col]
      : (numCols > 2 ? `${filename.replace(/\.[^/.]+$/, "")}_Sample${col}` : filename);

    results.push(cleanAndPackageSpectrum(wavenumbers, intensities, filename, colName));
  }

  return results;
}

function parseNum(val: unknown): number {
  if (typeof val === 'number') return val;
  if (!val) return NaN;
  const str = String(val).trim().replace(',', '.');
  return parseFloat(str);
}

function cleanAndPackageSpectrum(
  wavenumbers: number[],
  intensities: number[],
  filename: string,
  sampleName: string
): RawSpectrum {
  // Pair and sort descending (standard FTIR: 4000 down to 400 cm⁻¹)
  const pairs = wavenumbers.map((wn, i) => ({ wn, val: intensities[i] }));
  pairs.sort((a, b) => b.wn - a.wn); // Descending

  const sortedWn = pairs.map(p => p.wn);
  let sortedInt = pairs.map(p => p.val);

  // Auto-detect if data is %Transmittance (%T: maximum > 50, minimum > 0)
  const maxVal = Math.max(...sortedInt);
  const minVal = Math.min(...sortedInt);
  let isTransmittance = false;

  if (maxVal > 20 && minVal >= 0 && maxVal <= 130) {
    isTransmittance = true;
    // Auto-convert %T to Absorbance: A = 2 - log10(%T)
    sortedInt = sortedInt.map(t => {
      const clampedT = Math.max(0.01, Math.min(100, t));
      return 2 - Math.log10(clampedT);
    });
  }

  return {
    id: `spec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: sampleName,
    filename,
    wavenumbers: sortedWn,
    intensities: sortedInt,
    points: sortedWn.length,
    minWn: sortedWn[sortedWn.length - 1],
    maxWn: sortedWn[0],
    isTransmittance
  };
}
