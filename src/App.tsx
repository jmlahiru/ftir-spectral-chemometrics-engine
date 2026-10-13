/**
 * Copyright 2026 Jathi Munige Lahiru Kavinda
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RawSpectrum,
  ProcessedSpectrum,
  PreprocessingConfig,
  QuantificationConfig,
  DetectedPeak
} from './types/ftir';
import { FTIRAlgorithms } from './services/algorithms';
import { getSampleBackgroundSpectrum, getPolymerDegradationSeries } from './services/sampleData';
import { SpectralChart } from './components/SpectralChart';
import { UploadSection } from './components/UploadSection';
import { PreprocessingSection } from './components/PreprocessingSection';
import { PeakAnalysisSection } from './components/PeakAnalysisSection';
import { QuantificationSection } from './components/QuantificationSection';
import { DataTableSection } from './components/DataTableSection';
import {
  Activity,
  Upload,
  Sliders,
  Target,
  BarChart3,
  Table,
  BookOpen,
  Scale,
  X,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';

// Dedicated Nordic Sandstone & Verdigris Scientific Palette
const NORDIC_SAND_PALETTE = [
  '#1e5347', // Verdigris
  '#9c4132', // Terracotta
  '#2b4c6f', // Nordic blue
  '#b45309', // Ochre
  '#5b406e', // Aubergine
  '#406856', // Sage dark
  '#8a493b', // Rust
  '#315f6b', // Slate teal
  '#785331', // Bronze
  '#4e5d42', // Olive
  '#2d507b', // Prussian blue
  '#993344', // Madder red
  '#386b62', // Deep patina
  '#70446b', // Heather
  '#8c622e', // Raw sienna
  '#3b5c3e', // Forest
  '#55585b', // Granite
  '#6b4a70', // Muted violet
  '#2c5866', // Deep sea
  '#805030'  // Burnt umber
];

export interface CitationEntry {
  category: string;
  method: string;
  authors: string;
  title: string;
  source: string;
  year: string;
  doiOrRef?: string;
  usageInSystem: string;
}

export const SCIENTIFIC_CITATIONS: CitationEntry[] = [
  {
    category: "Baseline Correction Algorithm",
    method: "Asymmetric Least Squares (AsLS / Eilers Smoother)",
    authors: "Eilers, P. H. C., & Boelens, H. F. M.",
    title: "Baseline correction with asymmetric least squares smoothing",
    source: "Leiden University Medical Centre Report, 1(1), 5",
    year: "2005",
    doiOrRef: "LUMC Research Series (2005)",
    usageInSystem: "Implemented via a banded O(N) pentadiagonal Cholesky solver with smoothness penalty λ and asymmetry factor p to remove non-linear optical and scattering baselines."
  },
  {
    category: "Spectral Smoothing Protocol",
    method: "Savitzky-Golay Polynomial Filter",
    authors: "Savitzky, A., & Golay, M. J. E.",
    title: "Smoothing and differentiation of data by simplified least squares procedures",
    source: "Analytical Chemistry, 36(8), 1627–1639",
    year: "1964",
    doiOrRef: "https://doi.org/10.1021/ac60214a047",
    usageInSystem: "Utilized for local least-squares polynomial convolution (orders 2–4, odd window sizes) to attenuate random instrument detector noise without eroding peak height or broadening band FWHM."
  },
  {
    category: "Baseline Correction Algorithm",
    method: "Modified Polynomial Fitting (ModPoly)",
    authors: "Lieber, C. A., & Mahadevan-Jansen, A.",
    title: "Automated baseline indicator and fitting technique for Raman and FTIR spectroscopy",
    source: "Applied Spectroscopy, 57(11), 1363–1367",
    year: "2003",
    doiOrRef: "https://doi.org/10.1366/000370203322554518",
    usageInSystem: "Iterative least-squares polynomial fit that progressively thresholds residual values above the fitted curve to eliminate wide sloping fluorescence/scattering baselines."
  },
  {
    category: "Spectral Library & Correlation Database",
    method: "Infrared Characteristic Group Frequencies Reference",
    authors: "Socrates, G.",
    title: "Infrared and Raman Characteristic Group Frequencies: Tables and Charts (3rd ed.)",
    source: "John Wiley & Sons, Chichester",
    year: "2004",
    doiOrRef: "ISBN: 978-0-470-09307-8",
    usageInSystem: "Core reference frequency ranges (3700–400 cm⁻¹) for automated assignment of functional groups (carbonyls, hydroxyls, C-H stretches, amines, aromatics, siloxanes)."
  },
  {
    category: "Spectral Library & Correlation Database",
    method: "NIST Chemistry WebBook Infrared Spectral Database",
    authors: "Linstrom, P. J., & Mallard, W. G. (Eds.)",
    title: "NIST Chemistry WebBook, NIST Standard Reference Database Number 69",
    source: "National Institute of Standards and Technology, Gaithersburg MD",
    year: "2023",
    doiOrRef: "https://doi.org/10.18434/T4D303",
    usageInSystem: "Atmospheric CO₂ doublets (2362/2342 cm⁻¹), water vapor interference profiles, and primary organic compound infrared band verification."
  },
  {
    category: "Vibrational Spectroscopy Text",
    method: "Interpretation of Organic Infrared Spectra",
    authors: "Pavia, D. L., Lampman, G. M., Kriz, G. S., & Vyvyan, J. R.",
    title: "Introduction to Spectroscopy (5th ed.)",
    source: "Cengage Learning, Stamford CT",
    year: "2014",
    doiOrRef: "ISBN: 978-1-285-46012-3",
    usageInSystem: "Infrared group frequency correlation charts, Fermi resonance doublet assignments for aldehydes, and finger-print region criteria."
  },
  {
    category: "Comparative Quantification Standard",
    method: "General Techniques of Infrared Quantitative Analysis",
    authors: "ASTM International",
    title: "ASTM E168-16: Standard Practices for General Techniques of Infrared Quantitative Analysis",
    source: "ASTM International, West Conshohocken, PA",
    year: "2023",
    doiOrRef: "https://doi.org/10.1520/E0168-16",
    usageInSystem: "Numerical trapezoidal integration protocols, baseline-corrected peak height calculations, and internal standard band ratio algorithms (e.g. Carbonyl Index)."
  },
  {
    category: "Data Ingestion & Matrix Parser",
    method: "SheetJS Spreadsheet Computational Library",
    authors: "SheetJS Community",
    title: "SheetJS CE: Spreadsheet Data Toolkit (v0.18.5)",
    source: "Apache-2.0 Open Source Software",
    year: "2023",
    doiOrRef: "https://sheetjs.com/",
    usageInSystem: "Universal binary workbook (.xlsx, .xls) and multi-column spectral matrix parser operating client-side in the browser."
  }
];

export const APACHE_LICENSE_HEADER = `Copyright [2026] [Jathi Munige Lahiru Kavinda]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`;

export default function App() {
  const [activeTab, setActiveTab] = useState<'viewer' | 'upload' | 'preprocessing' | 'peaks' | 'quantification' | 'table'>('viewer');
  const [showCitationModal, setShowCitationModal] = useState<boolean>(false);
  const [modalActiveTab, setModalActiveTab] = useState<'citations' | 'license'>('citations');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedLicense, setCopiedLicense] = useState<boolean>(false);

  // Spectra State
  const [samples, setSamples] = useState<RawSpectrum[]>([]);
  const [background, setBackground] = useState<RawSpectrum | null>(null);
  const [visibleTraces, setVisibleTraces] = useState<{ [id: string]: boolean }>({});
  const [chartViewMode, setChartViewMode] = useState<'processed' | 'raw' | 'baseline' | 'both'>('processed');
  const [showPeaksOnChart, setShowPeaksOnChart] = useState<boolean>(true);

  // Preprocessing Configuration
  const [preprocessingConfig, setPreprocessingConfig] = useState<PreprocessingConfig>({
    bgMode: 'absorbance',
    bgScale: 1.0,
    smoothMethod: 'savitzky-golay',
    smoothWindow: 9,
    smoothPolyOrder: 2,
    gaussianSigma: 1.5,
    baselineMethod: 'asls',
    aslsLambda: 1e5,
    aslsP: 0.01,
    polyDegree: 3,
    normMethod: 'none',
    normTargetWn: 1465
  });

  // Quantification Configuration
  const [quantConfig, setQuantConfig] = useState<QuantificationConfig>({
    protocol: 'peak-ratio',
    targetWnStart: 1750,
    targetWnEnd: 1680,
    refWnStart: 1475,
    refWnEnd: 1445,
    targetPeakWn: 1715,
    refPeakWn: 1465,
    subtractLocalBaseline: true
  });

  // Peak Picking State
  const [selectedPeakSampleId, setSelectedPeakSampleId] = useState<string>('');
  const [peakProminence, setPeakProminence] = useState<number>(0.02);
  const [peakMinHeight, setPeakMinHeight] = useState<number>(0.04);
  const [peakMinDistance, setPeakMinDistance] = useState<number>(15);
  const [samplePeaks, setSamplePeaks] = useState<{ [id: string]: DetectedPeak[] }>({});

  // Load benchmark dataset on mount
  useEffect(() => {
    const demoBg = getSampleBackgroundSpectrum();
    const demoSamples = getPolymerDegradationSeries();
    setBackground(demoBg);
    setSamples(demoSamples);
    if (demoSamples.length > 0) {
      setSelectedPeakSampleId(demoSamples[0].id);
    }
  }, []);

  useEffect(() => {
    if (samples.length > 0 && (!selectedPeakSampleId || !samples.some(s => s.id === selectedPeakSampleId))) {
      setSelectedPeakSampleId(samples[0].id);
    }
  }, [samples, selectedPeakSampleId]);

  // Master Common Wavenumber Grid
  const commonGrid = useMemo(() => {
    if (samples.length > 0) {
      return [...samples[0].wavenumbers];
    }
    if (background) {
      return [...background.wavenumbers];
    }
    return [];
  }, [samples, background]);

  // Interpolated Background on commonGrid
  const interpolatedBackground = useMemo(() => {
    if (!background || commonGrid.length === 0) return null;
    const intensities = FTIRAlgorithms.interpolate(
      background.wavenumbers,
      background.intensities,
      commonGrid
    );
    return {
      wavenumbers: commonGrid,
      intensities
    };
  }, [background, commonGrid]);

  // Compute Processed Spectra
  const processedSpectra: ProcessedSpectrum[] = useMemo(() => {
    if (samples.length === 0 || commonGrid.length === 0) return [];

    return samples.map((sample, idx) => {
      // 1. Resample on grid
      const raw = FTIRAlgorithms.interpolate(sample.wavenumbers, sample.intensities, commonGrid);

      // 2. Background Subtraction
      let afterBg = [...raw];
      if (interpolatedBackground && preprocessingConfig.bgMode !== 'none') {
        const bgVals = interpolatedBackground.intensities;
        if (preprocessingConfig.bgMode === 'absorbance') {
          const scale = preprocessingConfig.bgScale || 1.0;
          afterBg = afterBg.map((v, i) => Math.max(-0.2, v - (bgVals[i] || 0) * scale));
        } else if (preprocessingConfig.bgMode === 'transmission_ratio') {
          afterBg = afterBg.map((v, i) => {
            const bg = bgVals[i] || 1e-4;
            const ratio = v / bg;
            return ratio > 0 ? -Math.log10(ratio) : 0;
          });
        }
      }

      // 3. Smoothing
      let smoothed = [...afterBg];
      const sm = preprocessingConfig.smoothMethod;
      if (sm === 'savitzky-golay') {
        smoothed = FTIRAlgorithms.savitzkyGolay(
          afterBg,
          preprocessingConfig.smoothWindow,
          preprocessingConfig.smoothPolyOrder
        );
      } else if (sm === 'gaussian') {
        smoothed = FTIRAlgorithms.gaussianSmooth(
          afterBg,
          preprocessingConfig.smoothWindow,
          preprocessingConfig.gaussianSigma
        );
      } else if (sm === 'moving-average') {
        smoothed = FTIRAlgorithms.movingAverage(afterBg, preprocessingConfig.smoothWindow);
      } else if (sm === 'median') {
        smoothed = FTIRAlgorithms.medianFilter(afterBg, preprocessingConfig.smoothWindow);
      } else if (sm === 'whittaker') {
        smoothed = FTIRAlgorithms.whittakerSmooth(afterBg, 1e4);
      }

      // 4. Baseline Correction
      let baseline = new Array(commonGrid.length).fill(0);
      let corrected = [...smoothed];
      const bm = preprocessingConfig.baselineMethod;

      if (bm === 'asls') {
        baseline = FTIRAlgorithms.aslsBaseline(
          smoothed,
          preprocessingConfig.aslsLambda,
          preprocessingConfig.aslsP
        );
        corrected = smoothed.map((v, i) => v - baseline[i]);
      } else if (bm === 'modpoly') {
        baseline = FTIRAlgorithms.modpolyBaseline(
          commonGrid,
          smoothed,
          preprocessingConfig.polyDegree
        );
        corrected = smoothed.map((v, i) => v - baseline[i]);
      } else if (bm === 'rubberband') {
        baseline = FTIRAlgorithms.rubberbandBaseline(commonGrid, smoothed);
        corrected = smoothed.map((v, i) => v - baseline[i]);
      } else if (bm === 'linear') {
        baseline = FTIRAlgorithms.linearBaseline(commonGrid, smoothed);
        corrected = smoothed.map((v, i) => v - baseline[i]);
      }

      // 5. Normalization
      const final = FTIRAlgorithms.normalize(
        corrected,
        preprocessingConfig.normMethod,
        commonGrid,
        preprocessingConfig.normTargetWn
      );

      const color = NORDIC_SAND_PALETTE[idx % NORDIC_SAND_PALETTE.length];
      const isVisible = visibleTraces[sample.id] !== undefined ? visibleTraces[sample.id] : true;

      return {
        id: sample.id,
        name: sample.name,
        filename: sample.filename,
        color,
        raw,
        afterBg,
        smoothed,
        baseline,
        final,
        visible: isVisible
      };
    });
  }, [samples, commonGrid, interpolatedBackground, preprocessingConfig, visibleTraces]);

  // Peak Detection
  const runPeakDetection = useCallback(() => {
    if (!selectedPeakSampleId || processedSpectra.length === 0) return;
    const targetSpec = processedSpectra.find(s => s.id === selectedPeakSampleId) || processedSpectra[0];
    if (!targetSpec) return;

    const detected = FTIRAlgorithms.findPeaks(commonGrid, targetSpec.final, {
      minProminence: peakProminence,
      minHeight: peakMinHeight,
      minDistance: peakMinDistance
    });

    setSamplePeaks(prev => ({
      ...prev,
      [targetSpec.id]: detected
    }));
  }, [selectedPeakSampleId, processedSpectra, commonGrid, peakProminence, peakMinHeight, peakMinDistance]);

  useEffect(() => {
    if (selectedPeakSampleId && processedSpectra.length > 0 && !samplePeaks[selectedPeakSampleId]) {
      runPeakDetection();
    }
  }, [selectedPeakSampleId, processedSpectra, samplePeaks, runPeakDetection]);

  const handleToggleTraceVisibility = (id: string) => {
    setVisibleTraces(prev => ({
      ...prev,
      [id]: prev[id] !== undefined ? !prev[id] : false
    }));
  };

  const handleAddSamples = (newSamples: RawSpectrum[]) => {
    setSamples(prev => [...prev, ...newSamples].slice(0, 20));
  };

  const handleRemoveSample = (id: string) => {
    setSamples(prev => prev.filter(s => s.id !== id));
  };

  const handleClearAll = () => {
    setSamples([]);
    setBackground(null);
    setSamplePeaks({});
  };

  const copyCitationText = (citation: CitationEntry, idx: number) => {
    const text = `${citation.authors} (${citation.year}). ${citation.title}. ${citation.source}. ${citation.doiOrRef || ''}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyLicenseText = () => {
    navigator.clipboard.writeText(APACHE_LICENSE_HEADER);
    setCopiedLicense(true);
    setTimeout(() => setCopiedLicense(false), 2000);
  };

  const currentPeaks = selectedPeakSampleId && samplePeaks[selectedPeakSampleId]
    ? samplePeaks[selectedPeakSampleId]
    : [];

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
    >
      {/* Top Navigation Bar: Strict 3-zone contract */}
      <header
        className="px-6 py-3 border-b flex items-center justify-between gap-8 sticky top-0 z-30 transition-colors"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)'
        }}
      >
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="w-7 h-7 rounded flex items-center justify-center font-bold text-xs"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff'
            }}
          >
            ν
          </div>
          <span className="text-sm font-bold tracking-tight whitespace-nowrap">
            Lahiru SpectraPulse FTIR
          </span>
          <span
            className="text-xs hidden sm:inline"
            style={{ color: 'var(--text-muted)' }}
          >
            / Analytical Spectroscopy Workstation
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium">
          {[
            { id: 'viewer', label: 'Spectral Canvas' },
            { id: 'upload', label: `Samples (${samples.length})` },
            { id: 'preprocessing', label: 'Preprocessing' },
            { id: 'peaks', label: `Peak ID (${currentPeaks.length})` },
            { id: 'quantification', label: 'Quantification' },
            { id: 'table', label: 'Data Matrix' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="py-1 border-b-2 transition-all whitespace-nowrap shrink-0"
              style={{
                borderColor: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? 600 : 500
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setModalActiveTab('license');
              setShowCitationModal(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-semibold transition-all shadow-sm"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)'
            }}
            title="View Apache 2.0 Open Source License & Copyright"
          >
            <Scale className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            Apache 2.0
          </button>
          <button
            onClick={() => {
              setModalActiveTab('citations');
              setShowCitationModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold transition-all shadow-sm"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
            title="Inspect full academic bibliography and method citations"
          >
            <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            Citations
          </button>
        </div>
      </header>

      {/* Mobile/Tablet Sub-Navigation */}
      <div
        className="lg:hidden px-4 py-2 border-b flex items-center gap-3 overflow-x-auto text-xs"
        style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)' }}
      >
        {[
          { id: 'viewer', label: 'Canvas' },
          { id: 'upload', label: `Samples (${samples.length})` },
          { id: 'preprocessing', label: 'Preprocessing' },
          { id: 'peaks', label: 'Peaks' },
          { id: 'quantification', label: 'Quantification' },
          { id: 'table', label: 'Matrix' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="px-2.5 py-1 rounded whitespace-nowrap"
            style={{
              backgroundColor: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? 600 : 500
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Workspace Frame */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Unboxed Status Metadata Strip */}
        <div
          className="flex flex-wrap items-center justify-between text-xs py-1.5 px-3 rounded border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-light)',
            color: 'var(--text-secondary)'
          }}
        >
          <div className="flex items-center gap-2">
            <span>{samples.length} Samples Ingested</span>
            <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
            <span>Background: {background ? background.name : 'None (Ambient)'}</span>
            <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
            <span>Master Grid: {commonGrid.length} points</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span>Smoothing: {preprocessingConfig.smoothMethod}</span>
            <span aria-hidden="true">·</span>
            <span>Baseline: {preprocessingConfig.baselineMethod}</span>
          </div>
        </div>

        {/* TAB 1: SPECTRAL VIEWER */}
        {activeTab === 'viewer' && (
          <div className="space-y-4">
            {/* Display Layer Controls */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Spectral Layer:
                </span>
                <div
                  className="flex rounded border p-0.5 text-xs"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-light)'
                  }}
                >
                  {[
                    { id: 'processed', label: 'Preprocessed' },
                    { id: 'raw', label: 'Raw Spectrum' },
                    { id: 'baseline', label: 'Fitted Baseline' },
                    { id: 'both', label: 'Raw + Baseline' }
                  ].map(btn => (
                    <button
                      key={btn.id}
                      onClick={() => setChartViewMode(btn.id as any)}
                      className="px-3 py-1 rounded text-xs transition-all font-medium"
                      style={{
                        backgroundColor: chartViewMode === btn.id ? 'var(--accent-primary)' : 'transparent',
                        color: chartViewMode === btn.id ? '#ffffff' : 'var(--text-secondary)'
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPeaksOnChart}
                    onChange={(e) => setShowPeaksOnChart(e.target.checked)}
                    className="rounded"
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                  Peak Markers ({currentPeaks.length})
                </label>
              </div>
            </div>

            {/* Scientific Canvas */}
            <SpectralChart
              spectra={processedSpectra}
              commonGrid={commonGrid}
              viewMode={chartViewMode}
              peaks={currentPeaks}
              showPeaks={showPeaksOnChart}
              targetWnRange={[quantConfig.targetWnStart, quantConfig.targetWnEnd]}
              refWnRange={quantConfig.protocol === 'peak-ratio' ? [quantConfig.refWnStart, quantConfig.refWnEnd] : undefined}
              onToggleVisibility={handleToggleTraceVisibility}
            />

            {/* Operational Notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div
                className="p-3.5 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-secondary)'
                }}
              >
                <span className="font-semibold block mb-1" style={{ color: 'var(--text-primary)' }}>
                  Interactive Drag-to-Zoom
                </span>
                Drag a box across any absorption band (e.g., 1800–1600 cm⁻¹) to magnify. Double click or select "Reset View" to restore 4000–400 cm⁻¹.
              </div>
              <div
                className="p-3.5 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-secondary)'
                }}
              >
                <span className="font-semibold block mb-1" style={{ color: 'var(--text-primary)' }}>
                  Calibrated Coordinate Probing
                </span>
                Hover crosshair provides real-time readout of exact wavenumber (cm⁻¹) and net absorbance (A) with tabular decimal precision.
              </div>
              <div
                className="p-3.5 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-secondary)'
                }}
              >
                <span className="font-semibold block mb-1" style={{ color: 'var(--text-primary)' }}>
                  Batch Trace Filtering
                </span>
                Click any specimen tag in the lower legend bar to selectively isolate individual samples or comparative pairs.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: UPLOAD & SAMPLES */}
        {activeTab === 'upload' && (
          <UploadSection
            samples={samples}
            background={background}
            onAddSamples={handleAddSamples}
            onRemoveSample={handleRemoveSample}
            onSetBackground={setBackground}
            onClearAll={handleClearAll}
          />
        )}

        {/* TAB 3: PREPROCESSING */}
        {activeTab === 'preprocessing' && (
          <div className="space-y-6">
            <PreprocessingSection
              config={preprocessingConfig}
              hasBackground={background !== null}
              onChangeConfig={setPreprocessingConfig}
              onApplyPipeline={() => setActiveTab('viewer')}
            />

            {/* In-situ Live Preview */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Baseline Correction & Smoothing Inspection
              </h3>
              <SpectralChart
                spectra={processedSpectra}
                commonGrid={commonGrid}
                viewMode="both"
                showPeaks={false}
                onToggleVisibility={handleToggleTraceVisibility}
              />
            </div>
          </div>
        )}

        {/* TAB 4: PEAK PICKING & IDENTIFICATION */}
        {activeTab === 'peaks' && (
          <PeakAnalysisSection
            spectra={processedSpectra}
            selectedSampleId={selectedPeakSampleId}
            peaks={currentPeaks}
            minProminence={peakProminence}
            minHeight={peakMinHeight}
            minDistance={peakMinDistance}
            onSelectSample={setSelectedPeakSampleId}
            onChangeParams={({ minProminence, minHeight, minDistance }) => {
              if (minProminence !== undefined) setPeakProminence(minProminence);
              if (minHeight !== undefined) setPeakMinHeight(minHeight);
              if (minDistance !== undefined) setPeakMinDistance(minDistance);
            }}
            onDetectPeaks={runPeakDetection}
          />
        )}

        {/* TAB 5: COMPARATIVE QUANTIFICATION */}
        {activeTab === 'quantification' && (
          <QuantificationSection
            spectra={processedSpectra}
            commonGrid={commonGrid}
            config={quantConfig}
            onChangeConfig={setQuantConfig}
          />
        )}

        {/* TAB 6: DATA TABLE */}
        {activeTab === 'table' && (
          <DataTableSection
            spectra={processedSpectra}
            commonGrid={commonGrid}
            background={interpolatedBackground}
          />
        )}
      </main>

      {/* Scientific Bottom Bar with Citations, Copyright & License */}
      <footer
        className="px-6 py-4 border-t text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)',
          color: 'var(--text-muted)'
        }}
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Scientific Citations & Primary Sources:
            </span>
            <span>AsLS: <em>Eilers & Boelens (2005)</em></span>
            <span aria-hidden="true" style={{ color: 'var(--border)' }}>·</span>
            <span>Savitzky-Golay: <em>Savitzky & Golay (1964)</em></span>
            <span aria-hidden="true" style={{ color: 'var(--border)' }}>·</span>
            <span>ModPoly: <em>Lieber & Mahadevan-Jansen (2003)</em></span>
            <span aria-hidden="true" style={{ color: 'var(--border)' }}>·</span>
            <span>Library: <em>NIST SRD 69 & Socrates (2004)</em></span>
            <span aria-hidden="true" style={{ color: 'var(--border)' }}>·</span>
            <span>Quantification: <em>ASTM E168-16</em></span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Copyright © 2026 Jathi Munige Lahiru Kavinda
            </span>
            <span aria-hidden="true" style={{ color: 'var(--border)' }}>·</span>
            <button
              onClick={() => {
                setModalActiveTab('license');
                setShowCitationModal(true);
              }}
              className="hover:underline text-[10px] font-medium"
              style={{ color: 'var(--accent-text)' }}
            >
              Licensed under Apache License 2.0
            </button>
            <span aria-hidden="true" style={{ color: 'var(--border)' }}>·</span>
            <span>Ingestion via SheetJS CE (Apache-2.0)</span>
            <span aria-hidden="true" style={{ color: 'var(--border)' }}>·</span>
            <span>Reversed FTIR standard (4000 → 400 cm⁻¹)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setModalActiveTab('license');
              setShowCitationModal(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-semibold whitespace-nowrap transition-all shadow-sm hover:opacity-90"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)'
            }}
          >
            <Scale className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            View License
          </button>
          <button
            onClick={() => {
              setModalActiveTab('citations');
              setShowCitationModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold whitespace-nowrap transition-all shadow-sm hover:opacity-90"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border)',
              color: 'var(--accent-text)'
            }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Full Citations
          </button>
        </div>
      </footer>

      {/* Comprehensive Academic Citations & Apache 2.0 License Modal */}
      {showCitationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-3xl rounded-xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            {/* Modal Header */}
            <div
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{
                backgroundColor: 'var(--bg-panel)',
                borderColor: 'var(--border)'
              }}
            >
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  {modalActiveTab === 'citations' ? (
                    <>
                      <BookOpen className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                      Lahiru SpectraPulse FTIR — Scientific Citations & Resource Attribution
                    </>
                  ) : (
                    <>
                      <Scale className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                      Lahiru SpectraPulse FTIR — Open Source Apache 2.0 License
                    </>
                  )}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {modalActiveTab === 'citations'
                    ? 'Peer-reviewed literature, standard reference databases, and open-source libraries utilized by this application.'
                    : 'Copyright © 2026 Jathi Munige Lahiru Kavinda. Licensed under the Apache License, Version 2.0.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Modal Tabs */}
                <div className="flex rounded border p-0.5 text-xs mr-2" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <button
                    onClick={() => setModalActiveTab('citations')}
                    className="px-2.5 py-1 rounded text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: modalActiveTab === 'citations' ? 'var(--accent-primary)' : 'transparent',
                      color: modalActiveTab === 'citations' ? '#ffffff' : 'var(--text-secondary)'
                    }}
                  >
                    Citations
                  </button>
                  <button
                    onClick={() => setModalActiveTab('license')}
                    className="px-2.5 py-1 rounded text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: modalActiveTab === 'license' ? 'var(--accent-primary)' : 'transparent',
                      color: modalActiveTab === 'license' ? '#ffffff' : 'var(--text-secondary)'
                    }}
                  >
                    Apache 2.0 License
                  </button>
                </div>

                <button
                  onClick={() => setShowCitationModal(false)}
                  className="p-1 rounded hover:bg-black/5 text-slate-500 hover:text-slate-800 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {modalActiveTab === 'citations' ? (
              <div className="p-6 overflow-y-auto space-y-4 text-xs divide-y" style={{ borderColor: 'var(--border-light)' }}>
                {SCIENTIFIC_CITATIONS.map((cit, idx) => (
                  <div key={idx} className={idx > 0 ? "pt-4" : ""}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-mono text-[10px] px-1.5 py-0.5 rounded border font-semibold"
                            style={{
                              backgroundColor: 'var(--bg-panel)',
                              borderColor: 'var(--border)',
                              color: 'var(--accent-primary)'
                            }}
                          >
                            {cit.category}
                          </span>
                          <strong className="text-xs">{cit.method}</strong>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                          <span className="font-semibold">{cit.authors}</span> ({cit.year}).{' '}
                          <span>"{cit.title}."</span>{' '}
                          <em>{cit.source}</em>.
                        </p>
                        {cit.doiOrRef && (
                          <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                            Reference / DOI: {cit.doiOrRef}
                          </p>
                        )}
                        <p
                          className="text-[11px] p-2 rounded mt-1.5"
                          style={{
                            backgroundColor: 'var(--bg-panel)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          <span className="font-semibold">Implementation:</span> {cit.usageInSystem}
                        </p>
                      </div>

                      <button
                        onClick={() => copyCitationText(cit, idx)}
                        className="p-1.5 rounded border transition-colors shrink-0 flex items-center gap-1 text-[11px]"
                        style={{
                          backgroundColor: 'var(--bg-panel)',
                          borderColor: 'var(--border)',
                          color: copiedIndex === idx ? 'var(--accent-primary)' : 'var(--text-secondary)'
                        }}
                        title="Copy APA Citation"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Apache 2.0 License View */
              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                {/* Copyright Notice Callout */}
                <div
                  className="p-4 rounded-lg border space-y-2"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs" style={{ color: 'var(--accent-primary)' }}>
                      Copyright Notice & License Grant
                    </span>
                    <button
                      onClick={copyLicenseText}
                      className="p-1.5 rounded border text-[11px] flex items-center gap-1 font-medium transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border)',
                        color: copiedLicense ? 'var(--accent-primary)' : 'var(--text-primary)'
                      }}
                      title="Copy Copyright & License Notice"
                    >
                      {copiedLicense ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Notice
                        </>
                      )}
                    </button>
                  </div>
                  <pre
                    className="p-3 rounded border font-mono text-[11px] whitespace-pre-wrap leading-relaxed select-all"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                  >
{APACHE_LICENSE_HEADER}
                  </pre>
                </div>

                {/* Plain-language summary & Key permissions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded border" style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-light)' }}>
                    <strong className="block text-emerald-700 dark:text-emerald-400 mb-1">✔ Commercial Use & Modification</strong>
                    <span>You may freely reproduce, modify, distribute, and sublicense this software for commercial, academic, or private projects.</span>
                  </div>
                  <div className="p-3 rounded border" style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-light)' }}>
                    <strong className="block text-sky-700 dark:text-sky-400 mb-1">✔ Patent & Copyright Grant</strong>
                    <span>Contributors grant an explicit, perpetual, worldwide patent and copyright license to all recipients.</span>
                  </div>
                  <div className="p-3 rounded border" style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-light)' }}>
                    <strong className="block text-amber-700 dark:text-amber-400 mb-1">ℹ Attribution & State Changes</strong>
                    <span>Redistributions must retain this copyright notice, the Apache 2.0 license, and prominent notices of any modifications.</span>
                  </div>
                </div>

                {/* Full Official Apache 2.0 Terms */}
                <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Full Text — Apache License, Version 2.0 (January 2004)
                    </span>
                    <a
                      href="http://www.apache.org/licenses/LICENSE-2.0"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:underline text-[11px]"
                      style={{ color: 'var(--accent-text)' }}
                    >
                      Official Webpage <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div
                    className="p-3 rounded border font-mono text-[10px] max-h-56 overflow-y-auto leading-relaxed text-slate-700 dark:text-slate-300"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-light)'
                    }}
                  >
                    <p className="font-semibold mb-2">TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION</p>
                    <p className="mb-2"><strong>1. Definitions.</strong> "License" shall mean the terms and conditions for use, reproduction, and distribution as defined by Sections 1 through 9 of this document. "Licensor" shall mean the copyright owner or entity authorized by the copyright owner that is granting the License...</p>
                    <p className="mb-2"><strong>2. Grant of Copyright License.</strong> Subject to the terms and conditions of this License, each Contributor hereby grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare Derivative Works of, publicly display, publicly perform, sublicense, and distribute the Work and such Derivative Works in Source or Object form.</p>
                    <p className="mb-2"><strong>3. Grant of Patent License.</strong> Subject to the terms and conditions of this License, each Contributor hereby grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable patent license to make, have made, use, offer to sell, sell, import, and otherwise transfer the Work...</p>
                    <p className="mb-2"><strong>4. Redistribution.</strong> You may reproduce and distribute copies of the Work or Derivative Works thereof in any medium, with or without modifications, and in Source or Object form, provided that You meet the following conditions: (a) You must give any other recipients of the Work a copy of this License; (b) You must cause any modified files to carry prominent notices stating that You changed the files; (c) You must retain, in the Source form of any Derivative Works that You distribute, all copyright, patent, trademark, and attribution notices...</p>
                    <p className="mb-2"><strong>7. Disclaimer of Warranty.</strong> Unless required by applicable law or agreed to in writing, Licensor provides the Work on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied, including, without limitation, any warranties of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A PARTICULAR PURPOSE.</p>
                    <p><strong>8. Limitation of Liability.</strong> In no event and under no legal theory shall any Contributor be liable to You for damages, including any direct, indirect, special, incidental, or consequential damages arising as a result of this License or out of the use or inability to use the Work.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div
              className="px-6 py-3 border-t flex items-center justify-between text-xs"
              style={{
                backgroundColor: 'var(--bg-panel)',
                borderColor: 'var(--border)'
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>
                {modalActiveTab === 'citations'
                  ? 'Complies with standard academic software citation formats.'
                  : 'Open Source Software under Apache-2.0 License.'}
              </span>
              <button
                onClick={() => setShowCitationModal(false)}
                className="px-4 py-1.5 rounded font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
