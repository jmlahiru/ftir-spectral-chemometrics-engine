import React, { useState, useMemo } from 'react';
import { ProcessedSpectrum, QuantificationConfig, SampleQuantResult, QuantificationProtocol } from '../types/ftir';
import { FTIRAlgorithms } from '../services/algorithms';
import { BarChart3, TrendingUp, Download, LineChart } from 'lucide-react';

interface QuantificationSectionProps {
  spectra: ProcessedSpectrum[];
  commonGrid: number[];
  config: QuantificationConfig;
  onChangeConfig: (newConfig: QuantificationConfig) => void;
  onUpdateRanges?: (target: [number, number], ref: [number, number]) => void;
}

export const QuantificationSection: React.FC<QuantificationSectionProps> = ({
  spectra,
  commonGrid,
  config,
  onChangeConfig,
  onUpdateRanges
}) => {
  const [knownConcentrations, setKnownConcentrations] = useState<{ [id: string]: string }>({});

  const update = (patch: Partial<QuantificationConfig>) => {
    const next = { ...config, ...patch };
    onChangeConfig(next);
    if (onUpdateRanges) {
      onUpdateRanges(
        [next.targetWnStart, next.targetWnEnd],
        [next.refWnStart, next.refWnEnd]
      );
    }
  };

  const applyPreset = (presetName: string) => {
    if (presetName === 'carbonyl_pe') {
      update({
        protocol: 'peak-ratio',
        targetWnStart: 1750,
        targetWnEnd: 1680,
        refWnStart: 1475,
        refWnEnd: 1445,
        targetPeakWn: 1715,
        refPeakWn: 1465,
        subtractLocalBaseline: true
      });
    } else if (presetName === 'biodiesel_fame') {
      update({
        protocol: 'peak-ratio',
        targetWnStart: 1760,
        targetWnEnd: 1730,
        refWnStart: 1475,
        refWnEnd: 1440,
        targetPeakWn: 1745,
        refPeakWn: 1460,
        subtractLocalBaseline: true
      });
    } else if (presetName === 'hydroxyl_index') {
      update({
        protocol: 'peak-ratio',
        targetWnStart: 3550,
        targetWnEnd: 3200,
        refWnStart: 2950,
        refWnEnd: 2830,
        targetPeakWn: 3380,
        refPeakWn: 2920,
        subtractLocalBaseline: true
      });
    } else if (presetName === 'amide_ratio') {
      update({
        protocol: 'peak-ratio',
        targetWnStart: 1690,
        targetWnEnd: 1630,
        refWnStart: 1570,
        refWnEnd: 1515,
        targetPeakWn: 1650,
        refPeakWn: 1540,
        subtractLocalBaseline: true
      });
    }
  };

  const results: SampleQuantResult[] = useMemo(() => {
    if (spectra.length === 0 || commonGrid.length === 0) return [];

    const computed = spectra.map((s) => {
      let targetVal = 0;
      let refVal = 1;
      let score = 0;

      if (config.protocol === 'peak-area') {
        targetVal = FTIRAlgorithms.integratePeakArea(
          commonGrid,
          s.final,
          config.targetWnStart,
          config.targetWnEnd,
          config.subtractLocalBaseline
        );
        refVal = 1;
        score = targetVal;
      } else if (config.protocol === 'peak-height') {
        const h = FTIRAlgorithms.getPeakHeight(
          commonGrid,
          s.final,
          config.targetPeakWn,
          Math.abs(config.targetWnStart - config.targetWnEnd),
          config.subtractLocalBaseline
        );
        targetVal = h.netHeight;
        refVal = 1;
        score = targetVal;
      } else if (config.protocol === 'peak-ratio') {
        const areaTarget = FTIRAlgorithms.integratePeakArea(
          commonGrid,
          s.final,
          config.targetWnStart,
          config.targetWnEnd,
          config.subtractLocalBaseline
        );
        const areaRef = FTIRAlgorithms.integratePeakArea(
          commonGrid,
          s.final,
          config.refWnStart,
          config.refWnEnd,
          config.subtractLocalBaseline
        );
        targetVal = areaTarget;
        refVal = areaRef;
        score = areaRef > 0 ? areaTarget / areaRef : 0;
      } else if (config.protocol === 'calibration') {
        targetVal = FTIRAlgorithms.integratePeakArea(
          commonGrid,
          s.final,
          config.targetWnStart,
          config.targetWnEnd,
          config.subtractLocalBaseline
        );
        refVal = 1;
        score = targetVal;
      }

      const knownConc = knownConcentrations[s.id] !== undefined && knownConcentrations[s.id] !== ''
        ? parseFloat(knownConcentrations[s.id])
        : undefined;

      return {
        sampleId: s.id,
        sampleName: s.name,
        color: s.color,
        targetValue: targetVal,
        refValue: refVal,
        score,
        relativePercent: 100,
        knownConcentration: knownConc
      };
    });

    const baseScore = computed[0]?.score || 1;
    computed.forEach(r => {
      r.relativePercent = baseScore !== 0 ? (r.score / baseScore) * 100 : 0;
    });

    return computed;
  }, [spectra, commonGrid, config, knownConcentrations]);

  const calibrationFit = useMemo(() => {
    if (config.protocol !== 'calibration') return null;
    const pts = results
      .filter(r => r.knownConcentration !== undefined && !isNaN(r.knownConcentration))
      .map(r => ({ x: r.knownConcentration!, y: r.score }));

    if (pts.length < 2) return null;
    return FTIRAlgorithms.linearRegression(pts);
  }, [results, config.protocol]);

  const handleExportCSV = () => {
    if (results.length === 0) return;
    let csv = 'Sample Name,Target Metric,Reference Metric,Score/Ratio,Relative Percentage (%)\n';
    results.forEach(r => {
      csv += `"${r.sampleName}",${r.targetValue.toFixed(5)},${r.refValue.toFixed(5)},${r.score.toFixed(5)},${r.relativePercent.toFixed(2)}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FTIR_Quantification_${config.protocol}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxScore = Math.max(...results.map(r => r.score), 0.001);

  return (
    <div className="space-y-6">
      {/* Top Configuration Card */}
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
              <BarChart3 className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              Comparative Quantification Protocols
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Integrate band areas, calculate internal standard ratios (e.g., Carbonyl Index), or compute linear calibration curves.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold transition-all shadow-sm"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>

        {/* Quick Presets */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider mr-1" style={{ color: 'var(--text-muted)' }}>
            Protocols:
          </span>
          {[
            { id: 'carbonyl_pe', label: 'Carbonyl Index (PE 1715 / 1465)' },
            { id: 'biodiesel_fame', label: 'Biodiesel FAME (1745 / 1460)' },
            { id: 'hydroxyl_index', label: 'Hydroxyl Index (3400 / 2920)' },
            { id: 'amide_ratio', label: 'Protein Amide I / II (1650 / 1540)' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className="text-xs px-2.5 py-1 rounded border transition-colors font-medium"
              style={{
                backgroundColor: 'var(--bg-panel)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Protocol & Range Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {/* Protocol Selection */}
          <div
            className="border rounded-lg p-4"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border-light)'
            }}
          >
            <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Quantification Protocol
            </label>
            <select
              value={config.protocol}
              onChange={(e) => update({ protocol: e.target.value as QuantificationProtocol })}
              className="w-full border rounded px-2.5 py-2 text-xs outline-none font-medium"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="peak-area">Protocol A: Peak Area Integration</option>
              <option value="peak-height">Protocol B: Baseline-Corrected Peak Height</option>
              <option value="peak-ratio">Protocol C: Internal Standard Two-Band Ratio</option>
              <option value="calibration">Protocol D: Linear Calibration Curve (R²)</option>
            </select>

            <div className="mt-3">
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={config.subtractLocalBaseline}
                  onChange={(e) => update({ subtractLocalBaseline: e.target.checked })}
                  className="rounded"
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                Subtract local 2-point baseline
              </label>
              <span className="text-[10px] block mt-1" style={{ color: 'var(--text-muted)' }}>
                Isolates net band absorbance from broad baseline tilt.
              </span>
            </div>
          </div>

          {/* Target Analyte Band */}
          <div
            className="border rounded-lg p-4"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border-light)'
            }}
          >
            <span className="text-xs font-bold block mb-2" style={{ color: 'var(--metric-target)' }}>
              Target Analyte Band Range
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] block mb-1" style={{ color: 'var(--text-secondary)' }}>Start (cm⁻¹)</label>
                <input
                  type="number"
                  value={config.targetWnStart}
                  onChange={(e) => update({ targetWnStart: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded px-2.5 py-1.5 text-xs font-mono outline-none"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <div>
                <label className="text-[11px] block mb-1" style={{ color: 'var(--text-secondary)' }}>End (cm⁻¹)</label>
                <input
                  type="number"
                  value={config.targetWnEnd}
                  onChange={(e) => update({ targetWnEnd: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded px-2.5 py-1.5 text-xs font-mono outline-none"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Reference Standard Band */}
          <div
            className="border rounded-lg p-4"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border-light)'
            }}
          >
            <span className="text-xs font-bold block mb-2" style={{ color: 'var(--metric-ref)' }}>
              Reference / Internal Standard Band
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] block mb-1" style={{ color: 'var(--text-secondary)' }}>Start (cm⁻¹)</label>
                <input
                  type="number"
                  disabled={config.protocol !== 'peak-ratio'}
                  value={config.refWnStart}
                  onChange={(e) => update({ refWnStart: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded px-2.5 py-1.5 text-xs font-mono outline-none disabled:opacity-40"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <div>
                <label className="text-[11px] block mb-1" style={{ color: 'var(--text-secondary)' }}>End (cm⁻¹)</label>
                <input
                  type="number"
                  disabled={config.protocol !== 'peak-ratio'}
                  value={config.refWnEnd}
                  onChange={(e) => update({ refWnEnd: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded px-2.5 py-1.5 text-xs font-mono outline-none disabled:opacity-40"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Bar Chart & Detailed Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Bar Chart */}
        <div
          className="border rounded-lg p-5 shadow-sm flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border)'
          }}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-xs font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                Batch Comparison
              </h3>
              <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                {config.protocol === 'peak-ratio' ? 'Ratio (Target / Ref)' : 'Integrated Area'}
              </span>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="mt-4 h-64 flex items-end gap-3 px-2 pb-6 border-b select-none" style={{ borderColor: 'var(--border)' }}>
              {results.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  Upload samples to generate comparative bar chart.
                </div>
              ) : (
                results.map((r, i) => {
                  const heightPercent = Math.max(5, (r.score / maxScore) * 100);
                  return (
                    <div key={r.sampleId} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] font-mono font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {r.score.toFixed(3)}
                      </span>
                      <div
                        className="w-full rounded-t transition-all duration-300"
                        style={{
                          height: `${heightPercent}%`,
                          backgroundColor: r.color
                        }}
                      />
                      <span
                        className="text-[10px] font-mono truncate w-full text-center mt-2"
                        style={{ color: 'var(--text-muted)' }}
                        title={r.sampleName}
                      >
                        S{i + 1}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Calibration Regression Summary */}
            {config.protocol === 'calibration' && calibrationFit && (
              <div
                className="mt-4 p-3 rounded border text-xs space-y-1"
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              >
                <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--accent-text)' }}>
                  <LineChart className="w-3.5 h-3.5" /> Linear Calibration:
                </span>
                <div className="font-mono">
                  y = {calibrationFit.slope.toFixed(4)}x + {calibrationFit.intercept.toFixed(4)}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  R² = <strong className="font-mono">{calibrationFit.rSquared.toFixed(4)}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Results Table */}
        <div
          className="border rounded-lg p-5 shadow-sm flex flex-col"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              Quantitative Summary
            </h3>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Sample 1 = 100.0%
            </span>
          </div>

          <div className="mt-4 border rounded overflow-hidden flex-1 max-h-80 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-left text-xs">
              <thead
                className="font-medium border-b sticky top-0"
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)'
                }}
              >
                <tr>
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Specimen</th>
                  <th className="py-2 px-3 text-right">Target</th>
                  {config.protocol === 'peak-ratio' && (
                    <th className="py-2 px-3 text-right">Ref Standard</th>
                  )}
                  <th className="py-2 px-3 text-right">Score</th>
                  <th className="py-2 px-3 text-right">Rel %</th>
                  {config.protocol === 'calibration' && (
                    <th className="py-2 px-2 text-right">Conc.</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center" style={{ color: 'var(--text-muted)' }}>
                      No sample data available.
                    </td>
                  </tr>
                ) : (
                  results.map((r, i) => (
                    <tr
                      key={r.sampleId}
                      className="hover:opacity-90 transition-opacity"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: r.color }} />
                        <span className="truncate max-w-[150px]" title={r.sampleName}>{r.sampleName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono" style={{ color: 'var(--metric-target)' }}>
                        {r.targetValue.toFixed(4)}
                      </td>
                      {config.protocol === 'peak-ratio' && (
                        <td className="py-2.5 px-3 text-right font-mono" style={{ color: 'var(--metric-ref)' }}>
                          {r.refValue.toFixed(4)}
                        </td>
                      )}
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {r.score.toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-[11px]">
                        {r.relativePercent.toFixed(1)}%
                      </td>
                      {config.protocol === 'calibration' && (
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            placeholder="conc"
                            value={knownConcentrations[r.sampleId] ?? ''}
                            onChange={(e) => setKnownConcentrations({ ...knownConcentrations, [r.sampleId]: e.target.value })}
                            className="w-16 border rounded px-1.5 py-0.5 text-xs text-right font-mono outline-none"
                            style={{
                              backgroundColor: 'var(--bg-panel)',
                              borderColor: 'var(--border)',
                              color: 'var(--text-primary)'
                            }}
                          />
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
