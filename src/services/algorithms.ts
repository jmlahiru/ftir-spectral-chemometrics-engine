import { DetectedPeak } from '../types/ftir';
import { identifyPeak } from './spectralLibrary';

export const FTIRAlgorithms = {
  /**
   * Resamples / interpolates spectrum (x, y) onto target gridX.
   * Assumes gridX and x are sorted (typically descending in FTIR: 4000 -> 400 cm⁻¹).
   */
  interpolate(x: number[], y: number[], gridX: number[]): number[] {
    if (x.length === 0 || y.length === 0 || gridX.length === 0) return [];
    const n = x.length;
    const result = new Float64Array(gridX.length);
    let j = 0;

    const isDesc = x[0] > x[n - 1];

    for (let i = 0; i < gridX.length; i++) {
      const target = gridX[i];

      if (isDesc) {
        // x is descending (e.g. 4000 down to 400)
        while (j < n - 2 && x[j + 1] >= target) {
          j++;
        }
        if (target >= x[0]) {
          result[i] = y[0];
        } else if (target <= x[n - 1]) {
          result[i] = y[n - 1];
        } else {
          const x0 = x[j];
          const x1 = x[j + 1];
          const y0 = y[j];
          const y1 = y[j + 1];
          const t = (target - x0) / (x1 - x0 || 1e-12);
          result[i] = y0 + t * (y1 - y0);
        }
      } else {
        // x is ascending
        while (j < n - 2 && x[j + 1] <= target) {
          j++;
        }
        if (target <= x[0]) {
          result[i] = y[0];
        } else if (target >= x[n - 1]) {
          result[i] = y[n - 1];
        } else {
          const x0 = x[j];
          const x1 = x[j + 1];
          const y0 = y[j];
          const y1 = y[j + 1];
          const t = (target - x0) / (x1 - x0 || 1e-12);
          result[i] = y0 + t * (y1 - y0);
        }
      }
    }

    return Array.from(result);
  },

  // ==========================================
  // 1. SMOOTHING PROTOCOLS
  // ==========================================

  /**
   * Moving Average (Boxcar)
   */
  movingAverage(y: number[], windowSize = 5): number[] {
    const n = y.length;
    const half = Math.floor(windowSize / 2);
    const out = new Float64Array(n);

    for (let i = 0; i < n; i++) {
      let sum = 0;
      let count = 0;
      for (let w = -half; w <= half; w++) {
        const idx = i + w;
        if (idx >= 0 && idx < n) {
          sum += y[idx];
          count++;
        }
      }
      out[i] = count > 0 ? sum / count : y[i];
    }
    return Array.from(out);
  },

  /**
   * Gaussian Filter Smoothing
   */
  gaussianSmooth(y: number[], windowSize = 7, sigma = 1.5): number[] {
    const n = y.length;
    const half = Math.floor(windowSize / 2);
    const kernel = new Float64Array(windowSize);
    let kSum = 0;

    for (let i = -half; i <= half; i++) {
      const v = Math.exp(-(i * i) / (2 * sigma * sigma));
      kernel[i + half] = v;
      kSum += v;
    }
    for (let i = 0; i < windowSize; i++) kernel[i] /= (kSum || 1);

    const out = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      let norm = 0;
      for (let k = -half; k <= half; k++) {
        const idx = i + k;
        if (idx >= 0 && idx < n) {
          sum += y[idx] * kernel[k + half];
          norm += kernel[k + half];
        }
      }
      out[i] = norm > 0 ? sum / norm : y[i];
    }
    return Array.from(out);
  },

  /**
   * Median Filter Smoothing (Despiking)
   */
  medianFilter(y: number[], windowSize = 5): number[] {
    const n = y.length;
    const half = Math.floor(windowSize / 2);
    const out = new Float64Array(n);

    for (let i = 0; i < n; i++) {
      const win: number[] = [];
      for (let k = -half; k <= half; k++) {
        const idx = i + k;
        if (idx >= 0 && idx < n) win.push(y[idx]);
      }
      win.sort((a, b) => a - b);
      const mid = Math.floor(win.length / 2);
      out[i] = win.length % 2 !== 0 ? win[mid] : (win[mid - 1] + win[mid]) / 2;
    }
    return Array.from(out);
  },

  /**
   * Savitzky-Golay (SG) Polynomial Convolution Filter
   */
  savitzkyGolay(y: number[], windowSize = 9, polyOrder = 2): number[] {
    let win = windowSize;
    if (win % 2 === 0) win += 1;
    if (win < 3) win = 3;
    let poly = polyOrder;
    if (poly >= win) poly = win - 1;

    const m = Math.floor(win / 2);
    const n = y.length;
    const cols = poly + 1;

    // Vandermonde matrix X: shape [win, cols]
    const X: number[][] = [];
    for (let i = -m; i <= m; i++) {
      const row: number[] = [];
      for (let p = 0; p <= poly; p++) {
        row.push(Math.pow(i, p));
      }
      X.push(row);
    }

    // Transpose XT
    const XT: number[][] = [];
    for (let p = 0; p < cols; p++) {
      XT.push(X.map(r => r[p]));
    }

    // XTX = XT * X
    const XTX: number[][] = Array.from({ length: cols }, () => new Array(cols).fill(0));
    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) {
        let sum = 0;
        for (let k = 0; k < win; k++) sum += XT[r][k] * X[k][c];
        XTX[r][c] = sum;
      }
    }

    const inv = FTIRAlgorithms.matrixInverse(XTX);
    if (!inv) return FTIRAlgorithms.movingAverage(y, win);

    // Filter coefficients = first row of (inv * XT)
    const coeffs = new Float64Array(win);
    for (let i = 0; i < win; i++) {
      let sum = 0;
      for (let p = 0; p < cols; p++) {
        sum += inv[0][p] * XT[p][i];
      }
      coeffs[i] = sum;
    }

    const out = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      let wSum = 0;
      for (let k = -m; k <= m; k++) {
        const idx = i + k;
        if (idx >= 0 && idx < n) {
          sum += y[idx] * coeffs[k + m];
          wSum += coeffs[k + m];
        }
      }
      out[i] = wSum !== 0 ? sum / wSum : y[i];
    }
    return Array.from(out);
  },

  /**
   * Whittaker-Eilers Smoothing
   */
  whittakerSmooth(y: number[], lambda = 1e3): number[] {
    const n = y.length;
    const w = new Float64Array(n).fill(1);
    return Array.from(FTIRAlgorithms.solvePentadiagonalAsLS(y, w, lambda));
  },

  matrixInverse(A: number[][]): number[][] | null {
    const n = A.length;
    const M: number[][] = Array.from({ length: n }, (_, i) => [
      ...A[i],
      ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
    ]);

    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
      }
      [M[i], M[maxRow]] = [M[maxRow], M[i]];

      const pivot = M[i][i];
      if (Math.abs(pivot) < 1e-13) return null;
      for (let j = 0; j < 2 * n; j++) M[i][j] /= pivot;

      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = M[k][i];
          for (let j = 0; j < 2 * n; j++) {
            M[k][j] -= factor * M[i][j];
          }
        }
      }
    }
    return M.map(row => row.slice(n));
  },

  // ==========================================
  // 2. BASELINE CORRECTION PROTOCOLS
  // ==========================================

  /**
   * Asymmetric Least Squares (AsLS / Eilers, 2005)
   * O(N) banded pentadiagonal Cholesky solver
   */
  aslsBaseline(y: number[], lambda = 1e5, p = 0.01, maxIter = 10): number[] {
    const n = y.length;
    if (n < 5) return [...y];
    const w: Float64Array = new Float64Array(n).fill(1);
    let z: Float64Array = new Float64Array(n);

    for (let iter = 0; iter < maxIter; iter++) {
      z = FTIRAlgorithms.solvePentadiagonalAsLS(y, w, lambda);
      for (let i = 0; i < n; i++) {
        w[i] = y[i] > z[i] ? p : (1 - p);
      }
    }
    return Array.from(z);
  },

  solvePentadiagonalAsLS(y: number[], w: Float64Array, lambda: number): Float64Array {
    const n = y.length;
    const d = new Float64Array(n);
    const e = new Float64Array(n);
    const f = new Float64Array(n);
    const rhs = new Float64Array(n);

    for (let i = 0; i < n; i++) {
      rhs[i] = w[i] * y[i];
      let dd = 6;
      if (i === 0 || i === n - 1) dd = 1;
      else if (i === 1 || i === n - 2) dd = 5;

      d[i] = w[i] + lambda * dd;
      e[i] = i < n - 1 ? (i === 0 || i === n - 2 ? -2 * lambda : -4 * lambda) : 0;
      f[i] = i < n - 2 ? 1 * lambda : 0;
    }

    // LDL^T Cholesky factorization of banded pentadiagonal matrix
    const l1 = new Float64Array(n);
    const l2 = new Float64Array(n);
    const Dp = new Float64Array(n);

    for (let i = 0; i < n; i++) {
      let dVal = d[i];
      if (i >= 1) dVal -= l1[i - 1] * l1[i - 1] * Dp[i - 1];
      if (i >= 2) dVal -= l2[i - 2] * l2[i - 2] * Dp[i - 2];
      Dp[i] = Math.abs(dVal) < 1e-12 ? 1e-12 : dVal;

      if (i < n - 1) {
        let eVal = e[i];
        if (i >= 1) eVal -= l1[i - 1] * Dp[i - 1] * l2[i - 1];
        l1[i] = eVal / Dp[i];
      }

      if (i < n - 2) {
        l2[i] = f[i] / Dp[i];
      }
    }

    // Forward substitution
    const v = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let sum = rhs[i];
      if (i >= 1) sum -= l1[i - 1] * v[i - 1];
      if (i >= 2) sum -= l2[i - 2] * v[i - 2];
      v[i] = sum;
    }

    // Diagonal solve
    for (let i = 0; i < n; i++) v[i] /= Dp[i];

    // Back substitution
    const z = new Float64Array(n);
    for (let i = n - 1; i >= 0; i--) {
      let sum = v[i];
      if (i < n - 1) sum -= l1[i] * z[i + 1];
      if (i < n - 2) sum -= l2[i] * z[i + 2];
      z[i] = sum;
    }
    return z;
  },

  /**
   * Modified Polynomial (ModPoly) Baseline Fitting
   * (Lieber & Mahadevan-Jansen)
   */
  modpolyBaseline(x: number[], y: number[], degree = 3, maxIter = 15): number[] {
    const n = y.length;
    if (n < degree + 2) return [...y];
    let currentY = [...y];

    // Rescale x to [-1, 1] for conditioning
    const xMin = Math.min(...x);
    const xMax = Math.max(...x);
    const span = xMax - xMin || 1;
    const normX = x.map(v => (2 * (v - xMin)) / span - 1);

    for (let iter = 0; iter < maxIter; iter++) {
      const coeffs = FTIRAlgorithms.fitPolynomial(normX, currentY, degree);
      if (!coeffs) break;
      const polyFit = normX.map(v => FTIRAlgorithms.evalPolynomial(coeffs, v));

      for (let i = 0; i < n; i++) {
        currentY[i] = Math.min(currentY[i], polyFit[i]);
      }
    }

    const finalCoeffs = FTIRAlgorithms.fitPolynomial(normX, currentY, degree);
    if (!finalCoeffs) return new Array(n).fill(Math.min(...y));
    return normX.map(v => FTIRAlgorithms.evalPolynomial(finalCoeffs, v));
  },

  fitPolynomial(x: number[], y: number[], degree: number): Float64Array | null {
    const m = degree + 1;
    const X: number[][] = Array.from({ length: m }, () => new Array(m).fill(0));
    const Y = new Float64Array(m);

    for (let i = 0; i < x.length; i++) {
      const xi = x[i];
      const yi = y[i];
      let xp = 1;
      for (let r = 0; r < m; r++) {
        Y[r] += yi * xp;
        let xp2 = xp;
        for (let c = 0; c < m; c++) {
          X[r][c] += xp2;
          xp2 *= xi;
        }
        xp *= xi;
      }
    }

    const inv = FTIRAlgorithms.matrixInverse(X);
    if (!inv) return null;

    const coeffs = new Float64Array(m);
    for (let r = 0; r < m; r++) {
      let sum = 0;
      for (let c = 0; c < m; c++) sum += inv[r][c] * Y[c];
      coeffs[r] = sum;
    }
    return coeffs;
  },

  evalPolynomial(coeffs: Float64Array, x: number): number {
    let sum = 0;
    let xp = 1;
    for (let i = 0; i < coeffs.length; i++) {
      sum += coeffs[i] * xp;
      xp *= x;
    }
    return sum;
  },

  /**
   * Rubberband / Lower Convex Hull Baseline
   */
  rubberbandBaseline(x: number[], y: number[]): number[] {
    const n = x.length;
    if (n < 3) return [...y];

    const pts = x.map((xv, i) => ({ x: xv, y: y[i], idx: i }));
    pts.sort((a, b) => a.x - b.x);

    // Lower convex hull (Andrew's monotone chain)
    const lower: { x: number; y: number; idx: number }[] = [];
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      while (
        lower.length >= 2 &&
        FTIRAlgorithms.crossProduct(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
      ) {
        lower.pop();
      }
      lower.push(p);
    }

    lower.sort((a, b) => a.x - b.x);
    const baseline = new Float64Array(n);

    for (let i = 0; i < n; i++) {
      const curX = x[i];
      let seg = 0;
      while (seg < lower.length - 2 && lower[seg + 1].x < curX) {
        seg++;
      }
      const p0 = lower[seg];
      const p1 = lower[seg + 1] || p0;
      if (Math.abs(p1.x - p0.x) < 1e-9) {
        baseline[i] = p0.y;
      } else {
        const t = (curX - p0.x) / (p1.x - p0.x);
        baseline[i] = p0.y + t * (p1.y - p0.y);
      }
    }
    return Array.from(baseline);
  },

  crossProduct(
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number }
  ): number {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  },

  /**
   * Linear 2-point Baseline (connecting endpoints)
   */
  linearBaseline(x: number[], y: number[]): number[] {
    const n = x.length;
    if (n === 0) return [];
    const x0 = x[0];
    const y0 = y[0];
    const x1 = x[n - 1];
    const y1 = y[n - 1];
    const dx = x1 - x0 || 1;
    return x.map(xv => y0 + ((xv - x0) / dx) * (y1 - y0));
  },

  // ==========================================
  // 3. NORMALIZATION PROTOCOLS
  // ==========================================

  normalize(y: number[], method: 'none' | 'minmax' | 'snv' | 'vector' | 'peak', x?: number[], targetWn?: number): number[] {
    if (method === 'none') return [...y];
    const n = y.length;
    if (n === 0) return [];

    if (method === 'minmax') {
      const min = Math.min(...y);
      const max = Math.max(...y);
      const span = max - min || 1;
      return y.map(v => (v - min) / span);
    }

    if (method === 'snv') {
      let sum = 0;
      for (const v of y) sum += v;
      const mean = sum / n;
      let varSum = 0;
      for (const v of y) varSum += (v - mean) * (v - mean);
      const std = Math.sqrt(varSum / (n - 1 || 1)) || 1;
      return y.map(v => (v - mean) / std);
    }

    if (method === 'vector') {
      let sumSq = 0;
      for (const v of y) sumSq += v * v;
      const norm = Math.sqrt(sumSq) || 1;
      return y.map(v => v / norm);
    }

    if (method === 'peak' && x && targetWn !== undefined) {
      let nearestIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < x.length; i++) {
        const diff = Math.abs(x[i] - targetWn);
        if (diff < minDiff) {
          minDiff = diff;
          nearestIdx = i;
        }
      }
      const refIntensity = Math.abs(y[nearestIdx]) || 1;
      return y.map(v => v / refIntensity);
    }

    return [...y];
  },

  // ==========================================
  // 4. PEAK DETECTION & LIBRARY MATCHING
  // ==========================================

  findPeaks(
    x: number[],
    y: number[],
    {
      minProminence = 0.02,
      minHeight = 0.03,
      minDistance = 12
    }: {
      minProminence?: number;
      minHeight?: number;
      minDistance?: number;
    } = {}
  ): DetectedPeak[] {
    const n = y.length;
    const candidates: { index: number; wavenumber: number; intensity: number; prominence: number; fwhm: number }[] = [];

    for (let i = 2; i < n - 2; i++) {
      if (y[i] > y[i - 1] && y[i] > y[i + 1] && y[i] >= minHeight) {
        // Find prominence
        let leftMin = y[i];
        for (let l = i - 1; l >= 0; l--) {
          if (y[l] < leftMin) leftMin = y[l];
          if (y[l] > y[i]) break;
        }

        let rightMin = y[i];
        for (let r = i + 1; r < n; r++) {
          if (y[r] < rightMin) rightMin = y[r];
          if (y[r] > y[i]) break;
        }

        const baseLevel = Math.max(leftMin, rightMin);
        const prominence = y[i] - baseLevel;

        if (prominence >= minProminence) {
          // Estimate FWHM (Full Width at Half Maximum)
          const halfMax = baseLevel + prominence / 2;
          let leftWn = x[i];
          for (let l = i - 1; l >= 0; l--) {
            if (y[l] <= halfMax) {
              leftWn = x[l];
              break;
            }
          }
          let rightWn = x[i];
          for (let r = i + 1; r < n; r++) {
            if (y[r] <= halfMax) {
              rightWn = x[r];
              break;
            }
          }
          const fwhm = Math.abs(leftWn - rightWn);

          candidates.push({
            index: i,
            wavenumber: x[i],
            intensity: y[i],
            prominence,
            fwhm: fwhm > 0 ? fwhm : 10
          });
        }
      }
    }

    // Sort descending by prominence for greedy non-maximum suppression
    candidates.sort((a, b) => b.prominence - a.prominence);
    const filtered: typeof candidates = [];

    for (const cand of candidates) {
      const tooClose = filtered.some(
        p => Math.abs(p.wavenumber - cand.wavenumber) < minDistance
      );
      if (!tooClose) {
        filtered.push(cand);
      }
    }

    filtered.sort((a, b) => b.wavenumber - a.wavenumber);

    return filtered.map(p => ({
      ...p,
      matches: identifyPeak(p.wavenumber)
    }));
  },

  // ==========================================
  // 5. QUANTIFICATION ENGINE
  // ==========================================

  /**
   * Trapezoidal Peak Area Integration between wnStart and wnEnd
   * with optional local baseline subtraction
   */
  integratePeakArea(
    x: number[],
    y: number[],
    wnStart: number,
    wnEnd: number,
    subtractLocalBaseline = true
  ): number {
    const minWn = Math.min(wnStart, wnEnd);
    const maxWn = Math.max(wnStart, wnEnd);

    const indices: number[] = [];
    for (let i = 0; i < x.length; i++) {
      if (x[i] >= minWn && x[i] <= maxWn) {
        indices.push(i);
      }
    }

    if (indices.length < 2) return 0;
    indices.sort((a, b) => x[a] - x[b]); // Sort ascending by wavenumber

    const startIdx = indices[0];
    const endIdx = indices[indices.length - 1];
    const yStart = y[startIdx];
    const yEnd = y[endIdx];
    const xStart = x[startIdx];
    const xEnd = x[endIdx];

    let totalArea = 0;
    for (let k = 0; k < indices.length - 1; k++) {
      const i0 = indices[k];
      const i1 = indices[k + 1];
      const x0 = x[i0];
      const x1 = x[i1];
      const dx = Math.abs(x1 - x0);

      let val0 = y[i0];
      let val1 = y[i1];

      if (subtractLocalBaseline) {
        const base0 = yStart + ((x0 - xStart) / (xEnd - xStart || 1)) * (yEnd - yStart);
        const base1 = yStart + ((x1 - xStart) / (xEnd - xStart || 1)) * (yEnd - yStart);
        val0 = Math.max(0, val0 - base0);
        val1 = Math.max(0, val1 - base1);
      } else {
        val0 = Math.max(0, val0);
        val1 = Math.max(0, val1);
      }

      totalArea += ((val0 + val1) / 2) * dx;
    }

    return totalArea;
  },

  /**
   * Baseline-corrected peak height at targetWn
   */
  getPeakHeight(
    x: number[],
    y: number[],
    targetWn: number,
    windowWidth = 20,
    subtractLocalBaseline = true
  ): { wavenumber: number; intensity: number; baselineHeight: number; netHeight: number } {
    const minWn = targetWn - windowWidth / 2;
    const maxWn = targetWn + windowWidth / 2;

    let maxIdx = -1;
    let maxVal = -Infinity;

    for (let i = 0; i < x.length; i++) {
      if (x[i] >= minWn && x[i] <= maxWn) {
        if (y[i] > maxVal) {
          maxVal = y[i];
          maxIdx = i;
        }
      }
    }

    if (maxIdx === -1) {
      // Find single closest point
      let nearest = 0;
      let minDiff = Infinity;
      for (let i = 0; i < x.length; i++) {
        const diff = Math.abs(x[i] - targetWn);
        if (diff < minDiff) {
          minDiff = diff;
          nearest = i;
        }
      }
      return {
        wavenumber: x[nearest],
        intensity: y[nearest],
        baselineHeight: 0,
        netHeight: Math.max(0, y[nearest])
      };
    }

    if (!subtractLocalBaseline) {
      return {
        wavenumber: x[maxIdx],
        intensity: maxVal,
        baselineHeight: 0,
        netHeight: Math.max(0, maxVal)
      };
    }

    // Interpolate local baseline across window edges
    let leftIdx = 0;
    let rightIdx = x.length - 1;
    for (let i = 0; i < x.length; i++) {
      if (x[i] >= minWn) leftIdx = i;
      if (x[i] <= maxWn) {
        rightIdx = i;
        break;
      }
    }

    const yL = y[leftIdx];
    const yR = y[rightIdx];
    const xL = x[leftIdx];
    const xR = x[rightIdx];
    const baseAtPeak = yL + ((x[maxIdx] - xL) / (xR - xL || 1)) * (yR - yL);
    const netHeight = Math.max(0, maxVal - baseAtPeak);

    return {
      wavenumber: x[maxIdx],
      intensity: maxVal,
      baselineHeight: baseAtPeak,
      netHeight
    };
  },

  /**
   * Linear Regression Fit: y = slope * x + intercept
   */
  linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number; rSquared: number } {
    const n = points.length;
    if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 };

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;

    for (const p of points) {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
      sumYY += p.y * p.y;
    }

    const denom = n * sumXX - sumX * sumX;
    if (Math.abs(denom) < 1e-12) return { slope: 0, intercept: sumY / n, rSquared: 0 };

    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    // R-squared
    const meanY = sumY / n;
    let ssTot = 0;
    let ssRes = 0;
    for (const p of points) {
      const pred = slope * p.x + intercept;
      ssTot += (p.y - meanY) * (p.y - meanY);
      ssRes += (p.y - pred) * (p.y - pred);
    }

    const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 1;
    return { slope, intercept, rSquared };
  }
};
