import { RawSpectrum } from '../types/ftir';

/**
 * Generates synthetic FTIR spectra simulating real vibrational bands
 * via Lorentzian/Gaussian Voigt approximations.
 */
function generateFTIRGrid(startWn = 4000, endWn = 500, step = 2): number[] {
  const grid: number[] = [];
  for (let w = startWn; w >= endWn; w -= step) {
    grid.push(w);
  }
  return grid;
}

interface Band {
  center: number;
  height: number;
  fwhm: number;
}

function computeSpectrum(
  grid: number[],
  bands: Band[],
  baselineSlope = 0.05,
  curvature = 0.02,
  noiseLevel = 0.003
): number[] {
  const minW = grid[grid.length - 1];
  const maxW = grid[0];
  const span = maxW - minW;

  return grid.map(w => {
    // Scattering baseline (Rayleigh/Mie baseline slope in FTIR)
    const norm = (w - minW) / span;
    let y = 0.04 + baselineSlope * (1 - norm) + curvature * Math.pow(1 - norm, 2);

    // Sum of bands (Lorentzian profile)
    for (const b of bands) {
      const gamma = b.fwhm / 2;
      const dx = w - b.center;
      const lorentzian = b.height * (gamma * gamma) / (dx * dx + gamma * gamma);
      y += lorentzian;
    }

    // High frequency detector noise
    const noise = (Math.random() - 0.5) * 2 * noiseLevel;
    return Math.max(0, y + noise);
  });
}

/**
 * Synthetic Air Background Spectrum (Ambient CO2 doublet at 2360/2340 and H2O vapor bands)
 */
export function getSampleBackgroundSpectrum(): RawSpectrum {
  const grid = generateFTIRGrid(4000, 500, 2);
  const bgBands: Band[] = [
    // Water vapor bands
    { center: 3850, height: 0.06, fwhm: 40 },
    { center: 3740, height: 0.08, fwhm: 35 },
    { center: 3620, height: 0.05, fwhm: 30 },
    // CO2 doublet
    { center: 2362, height: 0.28, fwhm: 14 },
    { center: 2342, height: 0.24, fwhm: 14 },
    // Water bending
    { center: 1650, height: 0.04, fwhm: 60 }
  ];

  const intensities = computeSpectrum(grid, bgBands, 0.03, 0.01, 0.002);

  return {
    id: 'sample_bg_air',
    name: 'Air_Background_Scan.csv',
    filename: 'Air_Background_Scan.csv',
    wavenumbers: grid,
    intensities,
    points: grid.length,
    minWn: 500,
    maxWn: 4000
  };
}

/**
 * Polyethylene Accelerated Weathering & Degradation Series (5 Samples)
 * Demonstrates Carbonyl Index comparative quantification:
 * Target band: Carbonyl (C=O) at 1715 cm⁻¹ (increasing with UV oxidation)
 * Reference band: Methylene (CH2) scissor at 1465 cm⁻¹ (constant polymer backbone)
 */
export function getPolymerDegradationSeries(): RawSpectrum[] {
  const grid = generateFTIRGrid(4000, 500, 2);

  const sampleConfigs = [
    { name: 'PE_0h_Virgin', hours: 0, carbonylH: 0.012 },
    { name: 'PE_50h_UV_Exposed', hours: 50, carbonylH: 0.085 },
    { name: 'PE_100h_UV_Exposed', hours: 100, carbonylH: 0.175 },
    { name: 'PE_200h_UV_Exposed', hours: 200, carbonylH: 0.320 },
    { name: 'PE_400h_Severe_Degradation', hours: 400, carbonylH: 0.540 }
  ];

  return sampleConfigs.map((cfg, idx) => {
    const bands: Band[] = [
      // Hydroxyl formation from hydroperoxides during oxidation
      { center: 3420, height: 0.02 + cfg.carbonylH * 0.25, fwhm: 140 },
      // Aliphatic C-H stretch (asymmetric CH2)
      { center: 2920, height: 0.85, fwhm: 35 },
      // Aliphatic C-H stretch (symmetric CH2)
      { center: 2850, height: 0.65, fwhm: 30 },
      // Atmospheric CO2 residual
      { center: 2362, height: 0.04, fwhm: 12 },
      { center: 2342, height: 0.035, fwhm: 12 },
      // Carbonyl C=O oxidation band (target)
      { center: 1715, height: cfg.carbonylH, fwhm: 32 },
      // Conjugated alkene formation (secondary degradation product)
      { center: 1640, height: cfg.carbonylH * 0.15, fwhm: 25 },
      // CH2 scissoring (Internal standard reference band ~1465 cm⁻¹)
      { center: 1465, height: 0.42, fwhm: 22 },
      // CH3 umbrella
      { center: 1375, height: 0.15, fwhm: 18 },
      // Ester C-O secondary oxidation
      { center: 1170, height: cfg.carbonylH * 0.22, fwhm: 45 },
      // CH2 rocking crystalline doublet
      { center: 730, height: 0.35, fwhm: 12 },
      { center: 720, height: 0.38, fwhm: 12 }
    ];

    const baselineTilt = 0.04 + idx * 0.01;
    const curvature = 0.015;
    const intensities = computeSpectrum(grid, bands, baselineTilt, curvature, 0.0035);

    return {
      id: `pe_sample_${idx}`,
      name: `${cfg.name}.csv`,
      filename: `${cfg.name}.csv`,
      wavenumbers: grid,
      intensities,
      points: grid.length,
      minWn: 500,
      maxWn: 4000
    };
  });
}

/**
 * Biodiesel in Petroleum Diesel Blend Series (B0 to B20)
 * Target band: FAME Ester Carbonyl C=O at 1745 cm⁻¹
 * Reference band: Hydrocarbon C-H bending at 1460 cm⁻¹
 */
export function getBiodieselBlendSeries(): RawSpectrum[] {
  const grid = generateFTIRGrid(4000, 500, 2);

  const blends = [
    { name: 'B0_Pure_Diesel', fame: 0, esterH: 0.005 },
    { name: 'B5_5pct_Biodiesel', fame: 5, esterH: 0.125 },
    { name: 'B10_10pct_Biodiesel', fame: 10, esterH: 0.245 },
    { name: 'B15_15pct_Biodiesel', fame: 15, esterH: 0.365 },
    { name: 'B20_20pct_Biodiesel', fame: 20, esterH: 0.490 }
  ];

  return blends.map((b, idx) => {
    const bands: Band[] = [
      // Aliphatic C-H stretch
      { center: 2955, height: 0.45, fwhm: 25 },
      { center: 2924, height: 0.90, fwhm: 35 },
      { center: 2854, height: 0.65, fwhm: 30 },
      // Atmospheric CO2
      { center: 2360, height: 0.03, fwhm: 12 },
      // Ester C=O band (Target for FAME quantification)
      { center: 1745, height: b.esterH, fwhm: 26 },
      // Aromatic C=C (diesel components)
      { center: 1605, height: 0.12, fwhm: 20 },
      // CH2 / CH3 bending (Reference standard)
      { center: 1460, height: 0.48, fwhm: 24 },
      { center: 1377, height: 0.22, fwhm: 18 },
      // Ester C-O stretch
      { center: 1172, height: b.esterH * 0.75, fwhm: 30 },
      // Aromatic out-of-plane
      { center: 810, height: 0.08, fwhm: 18 },
      { center: 724, height: 0.22, fwhm: 16 }
    ];

    const intensities = computeSpectrum(grid, bands, 0.03, 0.01, 0.003);

    return {
      id: `biodiesel_${idx}`,
      name: `${b.name}.xlsx`,
      filename: `${b.name}.xlsx`,
      wavenumbers: grid,
      intensities,
      points: grid.length,
      minWn: 500,
      maxWn: 4000
    };
  });
}
