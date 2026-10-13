import React, { useState, useMemo } from 'react';
import { ProcessedSpectrum } from '../types/ftir';
import { Table, Download } from 'lucide-react';

interface DataTableSectionProps {
  spectra: ProcessedSpectrum[];
  commonGrid: number[];
  background: { wavenumbers: number[]; intensities: number[] } | null;
}

export const DataTableSection: React.FC<DataTableSectionProps> = ({
  spectra,
  commonGrid,
  background
}) => {
  const [selectedSampleId, setSelectedSampleId] = useState<string>('all');
  const [minWnFilter, setMinWnFilter] = useState<string>('');
  const [maxWnFilter, setMaxWnFilter] = useState<string>('');
  const [stepDownsample, setStepDownsample] = useState<number>(2);

  const currentSample = spectra.find(s => s.id === selectedSampleId);

  const filteredIndices = useMemo(() => {
    const indices: number[] = [];
    const minW = minWnFilter ? parseFloat(minWnFilter) : -Infinity;
    const maxW = maxWnFilter ? parseFloat(maxWnFilter) : Infinity;

    for (let i = 0; i < commonGrid.length; i += stepDownsample) {
      const wn = commonGrid[i];
      if (wn >= minW && wn <= maxW) {
        indices.push(i);
      }
    }
    return indices;
  }, [commonGrid, minWnFilter, maxWnFilter, stepDownsample]);

  const handleExportCSV = () => {
    if (commonGrid.length === 0 || spectra.length === 0) return;

    let headers = ['Wavenumber (cm^-1)'];
    spectra.forEach(s => {
      headers.push(`"${s.name} (Preprocessed)"`);
      headers.push(`"${s.name} (Raw)"`);
    });
    if (background) headers.push('"Background (Raw)"');

    let csv = headers.join(',') + '\n';

    for (let i = 0; i < commonGrid.length; i++) {
      const row: (string | number)[] = [commonGrid[i].toFixed(2)];
      spectra.forEach(s => {
        row.push(s.final[i]?.toFixed(5) || '0');
        row.push(s.raw[i]?.toFixed(5) || '0');
      });
      if (background) {
        row.push(background.intensities[i]?.toFixed(5) || '0');
      }
      csv += row.join(',') + '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'FTIR_Spectra_Master_Matrix.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div
        className="border rounded-lg p-5 shadow-sm"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)'
        }}
      >
        {/* Header Toolbar */}
        <div
          className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b gap-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Table className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              Unified Spectral Data Matrix Table
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Tabular wavenumber matrix showing raw, background, baseline, and preprocessed intensities.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all shadow-sm active:scale-95"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff'
            }}
          >
            <Download className="w-3.5 h-3.5" />
            Download Master Matrix CSV
          </button>
        </div>

        {/* Filters and View Options */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
              View Mode
            </label>
            <select
              value={selectedSampleId}
              onChange={(e) => setSelectedSampleId(e.target.value)}
              className="w-full border rounded px-2.5 py-1.5 text-xs outline-none"
              style={{
                backgroundColor: 'var(--bg-panel)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="all">Consolidated Multi-Sample Matrix (All)</option>
              {spectra.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} (Detailed Raw vs Baseline)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Min Wavenumber (cm⁻¹)
            </label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={minWnFilter}
              onChange={(e) => setMinWnFilter(e.target.value)}
              className="w-full border rounded px-2.5 py-1.5 text-xs font-mono outline-none"
              style={{
                backgroundColor: 'var(--bg-panel)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Max Wavenumber (cm⁻¹)
            </label>
            <input
              type="number"
              placeholder="e.g. 4000"
              value={maxWnFilter}
              onChange={(e) => setMaxWnFilter(e.target.value)}
              className="w-full border rounded px-2.5 py-1.5 text-xs font-mono outline-none"
              style={{
                backgroundColor: 'var(--bg-panel)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Resolution Downsample
            </label>
            <select
              value={stepDownsample}
              onChange={(e) => setStepDownsample(parseInt(e.target.value, 10))}
              className="w-full border rounded px-2.5 py-1.5 text-xs outline-none"
              style={{
                backgroundColor: 'var(--bg-panel)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="1">Full Resolution (Every Point)</option>
              <option value="2">Optimized 2x (Recommended)</option>
              <option value="4">Fast 4x Step</option>
              <option value="8">Overview 8x Step</option>
            </select>
          </div>
        </div>

        {/* Data Matrix Table */}
        <div className="mt-5 border rounded overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs font-mono">
              <thead
                className="font-medium border-b sticky top-0"
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)'
                }}
              >
                <tr>
                  <th className="py-2.5 px-3">Point</th>
                  <th className="py-2.5 px-3">Wavenumber (cm⁻¹)</th>
                  {selectedSampleId !== 'all' && currentSample ? (
                    <>
                      <th className="py-2.5 px-3">Raw Absorbance</th>
                      <th className="py-2.5 px-3">Background</th>
                      <th className="py-2.5 px-3">Baseline Curve</th>
                      <th className="py-2.5 px-3 font-bold" style={{ color: 'var(--accent-text)' }}>Preprocessed (Final)</th>
                    </>
                  ) : (
                    spectra.map((s) => (
                      <th key={s.id} className="py-2.5 px-3 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-sm inline-block mr-1" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                {filteredIndices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center font-sans" style={{ color: 'var(--text-muted)' }}>
                      No spectral data points loaded yet.
                    </td>
                  </tr>
                ) : (
                  filteredIndices.map(idx => (
                    <tr
                      key={`row_${idx}`}
                      className="hover:opacity-90 transition-opacity"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <td className="py-2 px-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>{idx}</td>
                      <td className="py-2 px-3 font-semibold">
                        {commonGrid[idx]?.toFixed(2)}
                      </td>
                      {selectedSampleId !== 'all' && currentSample ? (
                        <>
                          <td className="py-2 px-3" style={{ color: 'var(--text-secondary)' }}>
                            {currentSample.raw[idx]?.toFixed(4)}
                          </td>
                          <td className="py-2 px-3" style={{ color: 'var(--text-muted)' }}>
                            {background?.intensities[idx]?.toFixed(4) || '-'}
                          </td>
                          <td className="py-2 px-3" style={{ color: 'var(--text-muted)' }}>
                            {currentSample.baseline[idx]?.toFixed(4)}
                          </td>
                          <td className="py-2 px-3 font-bold" style={{ color: 'var(--accent-text)' }}>
                            {currentSample.final[idx]?.toFixed(4)}
                          </td>
                        </>
                      ) : (
                        spectra.map(s => (
                          <td key={s.id} className="py-2 px-3">
                            {s.final[idx]?.toFixed(4)}
                          </td>
                        ))
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs font-sans" style={{ color: 'var(--text-muted)' }}>
          <span>Displaying {filteredIndices.length} rows (downsample: {stepDownsample}x)</span>
          <span>Common Wavenumber Grid: {commonGrid.length} points</span>
        </div>
      </div>
    </div>
  );
};
