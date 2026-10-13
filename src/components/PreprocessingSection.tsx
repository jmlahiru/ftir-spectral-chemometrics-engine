import React from 'react';
import { PreprocessingConfig, SmoothingMethod, BaselineMethod, NormalizationMethod, BgCorrectionMode } from '../types/ftir';
import { Sliders, Sparkles, Info } from 'lucide-react';

interface PreprocessingSectionProps {
  config: PreprocessingConfig;
  hasBackground: boolean;
  onChangeConfig: (newConfig: PreprocessingConfig) => void;
  onApplyPipeline: () => void;
}

export const PreprocessingSection: React.FC<PreprocessingSectionProps> = ({
  config,
  hasBackground,
  onChangeConfig,
  onApplyPipeline
}) => {
  const update = (patch: Partial<PreprocessingConfig>) => {
    onChangeConfig({ ...config, ...patch });
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
        <div
          className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b gap-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Sliders className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              Spectroscopic Preprocessing Pipeline
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Sequence: Background Subtraction → Spectral Smoothing → Baseline Removal → Normalization.
            </p>
          </div>
          <button
            onClick={onApplyPipeline}
            className="flex items-center gap-2 px-4 py-2 rounded text-xs font-bold transition-all shadow-sm active:scale-95"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff'
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Apply Pipeline
          </button>
        </div>

        {/* 4 Columns Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">

          {/* 1. Background Correction */}
          <div
            className="border rounded-lg p-4 flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border-light)'
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  1. Background Correction
                </span>
                {!hasBackground && (
                  <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    No scan
                  </span>
                )}
              </div>

              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Correction Mode
                </label>
                <select
                  value={config.bgMode}
                  onChange={(e) => update({ bgMode: e.target.value as BgCorrectionMode })}
                  className="w-full border rounded px-2.5 py-1.5 text-xs outline-none font-medium"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="none">Disabled (No subtraction)</option>
                  <option value="absorbance" disabled={!hasBackground}>
                    Absorbance Subtraction (Asample - Abg)
                  </option>
                  <option value="transmission_ratio" disabled={!hasBackground}>
                    Transmission Ratio (-log10(Is / Ibg))
                  </option>
                </select>
              </div>

              {config.bgMode === 'absorbance' && (
                <div>
                  <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--text-secondary)' }}>
                    <span>Scale Factor</span>
                    <span className="font-mono">{config.bgScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.0"
                    step="0.05"
                    value={config.bgScale}
                    onChange={(e) => update({ bgScale: parseFloat(e.target.value) })}
                    className="w-full h-1.5 rounded"
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                </div>
              )}
            </div>

            <div
              className="mt-4 p-2.5 rounded border text-[11px] flex items-start gap-1.5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-muted)'
              }}
            >
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
              <span>Removes atmospheric air moisture and purge CO2 doublets before smoothing.</span>
            </div>
          </div>

          {/* 2. Smoothing Protocol */}
          <div
            className="border rounded-lg p-4 flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border-light)'
            }}
          >
            <div className="space-y-3">
              <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                2. Smoothing Protocol
              </span>

              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Algorithm
                </label>
                <select
                  value={config.smoothMethod}
                  onChange={(e) => update({ smoothMethod: e.target.value as SmoothingMethod })}
                  className="w-full border rounded px-2.5 py-1.5 text-xs outline-none font-medium"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="savitzky-golay">Savitzky-Golay (Recommended)</option>
                  <option value="gaussian">Gaussian Filter</option>
                  <option value="moving-average">Moving Average (Boxcar)</option>
                  <option value="median">Median Filter (Despiking)</option>
                  <option value="whittaker">Whittaker-Eilers Smoother</option>
                  <option value="none">None (Raw noisy spectrum)</option>
                </select>
              </div>

              {config.smoothMethod !== 'none' && config.smoothMethod !== 'whittaker' && (
                <div>
                  <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--text-secondary)' }}>
                    <span>Window Size</span>
                    <span className="font-mono">{config.smoothWindow} pts</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="31"
                    step="2"
                    value={config.smoothWindow}
                    onChange={(e) => update({ smoothWindow: parseInt(e.target.value, 10) })}
                    className="w-full h-1.5 rounded"
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                </div>
              )}

              {config.smoothMethod === 'savitzky-golay' && (
                <div>
                  <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--text-secondary)' }}>
                    <span>Polynomial Order</span>
                    <span className="font-mono">Degree {config.smoothPolyOrder}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="4"
                    step="1"
                    value={config.smoothPolyOrder}
                    onChange={(e) => update({ smoothPolyOrder: parseInt(e.target.value, 10) })}
                    className="w-full h-1.5 rounded"
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                </div>
              )}

              {config.smoothMethod === 'gaussian' && (
                <div>
                  <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--text-secondary)' }}>
                    <span>Sigma (σ)</span>
                    <span className="font-mono">{config.gaussianSigma.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="4.0"
                    step="0.2"
                    value={config.gaussianSigma}
                    onChange={(e) => update({ gaussianSigma: parseFloat(e.target.value) })}
                    className="w-full h-1.5 rounded"
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                </div>
              )}
            </div>

            <div
              className="mt-4 p-2.5 rounded border text-[11px] flex items-start gap-1.5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-muted)'
              }}
            >
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
              <span>
                {config.smoothMethod === 'savitzky-golay'
                  ? 'Savitzky-Golay preserves peak apex height and bandwidth.'
                  : 'Reduces detector shot noise prior to peak picking.'}
              </span>
            </div>
          </div>

          {/* 3. Baseline Correction */}
          <div
            className="border rounded-lg p-4 flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border-light)'
            }}
          >
            <div className="space-y-3">
              <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                3. Baseline Correction
              </span>

              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Algorithm
                </label>
                <select
                  value={config.baselineMethod}
                  onChange={(e) => update({ baselineMethod: e.target.value as BaselineMethod })}
                  className="w-full border rounded px-2.5 py-1.5 text-xs outline-none font-medium"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="asls">Asymmetric Least Squares (AsLS / Eilers)</option>
                  <option value="modpoly">Modified Polynomial (ModPoly)</option>
                  <option value="rubberband">Rubberband (Convex Hull)</option>
                  <option value="linear">Linear Piecewise (2-Point)</option>
                  <option value="none">None (No Correction)</option>
                </select>
              </div>

              {config.baselineMethod === 'asls' && (
                <>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--text-secondary)' }}>
                      <span>Smoothness (λ)</span>
                      <span className="font-mono">10^{Math.round(Math.log10(config.aslsLambda))}</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="7"
                      step="0.5"
                      value={Math.log10(config.aslsLambda)}
                      onChange={(e) => update({ aslsLambda: Math.pow(10, parseFloat(e.target.value)) })}
                      className="w-full h-1.5 rounded"
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--text-secondary)' }}>
                      <span>Asymmetry Penalty (p)</span>
                      <span className="font-mono">{config.aslsP}</span>
                    </div>
                    <input
                      type="range"
                      min="0.001"
                      max="0.05"
                      step="0.002"
                      value={config.aslsP}
                      onChange={(e) => update({ aslsP: parseFloat(e.target.value) })}
                      className="w-full h-1.5 rounded"
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                  </div>
                </>
              )}

              {config.baselineMethod === 'modpoly' && (
                <div>
                  <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--text-secondary)' }}>
                    <span>Polynomial Order</span>
                    <span className="font-mono">Order {config.polyDegree}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="1"
                    value={config.polyDegree}
                    onChange={(e) => update({ polyDegree: parseInt(e.target.value, 10) })}
                    className="w-full h-1.5 rounded"
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                </div>
              )}
            </div>

            <div
              className="mt-4 p-2.5 rounded border text-[11px] flex items-start gap-1.5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-muted)'
              }}
            >
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
              <span>
                {config.baselineMethod === 'asls'
                  ? 'AsLS solves banded pentadiagonal equations to penalize positive deviations.'
                  : 'Removes optical scattering tilt across the spectrum.'}
              </span>
            </div>
          </div>

          {/* 4. Normalization */}
          <div
            className="border rounded-lg p-4 flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border-light)'
            }}
          >
            <div className="space-y-3">
              <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                4. Spectral Normalization
              </span>

              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Method
                </label>
                <select
                  value={config.normMethod}
                  onChange={(e) => update({ normMethod: e.target.value as NormalizationMethod })}
                  className="w-full border rounded px-2.5 py-1.5 text-xs outline-none font-medium"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="none">None (Absolute Beer-Lambert)</option>
                  <option value="minmax">Min-Max Scaling (0 to 1)</option>
                  <option value="snv">Standard Normal Variate (SNV)</option>
                  <option value="vector">Vector Normalization (L2)</option>
                  <option value="peak">Band Peak Normalization</option>
                </select>
              </div>

              {config.normMethod === 'peak' && (
                <div>
                  <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Reference Band (cm⁻¹)
                  </label>
                  <input
                    type="number"
                    value={config.normTargetWn || 1465}
                    onChange={(e) => update({ normTargetWn: parseFloat(e.target.value) || 1465 })}
                    className="w-full border rounded px-2.5 py-1.5 text-xs font-mono outline-none"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              )}
            </div>

            <div
              className="mt-4 p-2.5 rounded border text-[11px] flex items-start gap-1.5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-muted)'
              }}
            >
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
              <span>
                {config.normMethod === 'none'
                  ? 'Maintains linear proportional intensity for Beer-Lambert quantification.'
                  : 'Compensates for optical pathlength or ATR contact variations.'}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
