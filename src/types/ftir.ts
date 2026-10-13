export interface RawSpectrum {
  id: string;
  name: string;
  filename: string;
  wavenumbers: number[]; // cm^-1
  intensities: number[]; // Absorbance or %T
  points: number;
  minWn: number;
  maxWn: number;
  isTransmittance?: boolean;
}

export type SmoothingMethod = 'savitzky-golay' | 'gaussian' | 'moving-average' | 'median' | 'whittaker' | 'none';
export type BaselineMethod = 'asls' | 'modpoly' | 'rubberband' | 'linear' | 'none';
export type NormalizationMethod = 'none' | 'minmax' | 'snv' | 'vector' | 'peak';
export type BgCorrectionMode = 'none' | 'absorbance' | 'transmission_ratio';

export interface PreprocessingConfig {
  bgMode: BgCorrectionMode;
  bgScale: number;
  smoothMethod: SmoothingMethod;
  smoothWindow: number; // Odd number (e.g., 5, 9, 15)
  smoothPolyOrder: number; // For Savitzky-Golay (2, 3, 4)
  gaussianSigma: number;
  baselineMethod: BaselineMethod;
  aslsLambda: number; // e.g., 1e5
  aslsP: number; // e.g., 0.01
  polyDegree: number; // e.g., 3
  normMethod: NormalizationMethod;
  normTargetWn?: number; // For peak normalization
}

export interface ProcessedSpectrum {
  id: string;
  name: string;
  filename: string;
  color: string;
  raw: number[];
  afterBg: number[];
  smoothed: number[];
  baseline: number[];
  final: number[]; // Final preprocessed spectrum on commonGrid
  visible: boolean;
}

export interface DetectedPeak {
  index: number;
  wavenumber: number;
  intensity: number;
  prominence: number;
  fwhm?: number;
  matches: LibraryMatch[];
}

export interface LibraryMatch {
  name: string;
  group: string;
  class: string;
  min: number;
  max: number;
  intensity: string;
  notes?: string;
  confidence: number; // 0-100%
}

export type QuantificationProtocol = 'peak-area' | 'peak-height' | 'peak-ratio' | 'calibration';

export interface QuantificationConfig {
  protocol: QuantificationProtocol;
  targetWnStart: number;
  targetWnEnd: number;
  refWnStart: number;
  refWnEnd: number;
  targetPeakWn: number;
  refPeakWn: number;
  subtractLocalBaseline: boolean;
}

export interface SampleQuantResult {
  sampleId: string;
  sampleName: string;
  color: string;
  targetValue: number;
  refValue: number;
  score: number;
  relativePercent: number; // vs Reference sample (default sample 0 = 100%)
  knownConcentration?: number;
}
