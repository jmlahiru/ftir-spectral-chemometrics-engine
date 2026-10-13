import React, { useState } from 'react';
import { ProcessedSpectrum, DetectedPeak } from '../types/ftir';
import { Target, Search, BookOpen, CheckCircle2, AlertTriangle } from 'lucide-react';

interface PeakAnalysisSectionProps {
  spectra: ProcessedSpectrum[];
  selectedSampleId: string;
  peaks: DetectedPeak[];
  minProminence: number;
  minHeight: number;
  minDistance: number;
  onSelectSample: (id: string) => void;
  onChangeParams: (params: { minProminence?: number; minHeight?: number; minDistance?: number }) => void;
  onDetectPeaks: () => void;
}

export const PeakAnalysisSection: React.FC<PeakAnalysisSectionProps> = ({
  spectra,
  selectedSampleId,
  peaks,
  minProminence,
  minHeight,
  minDistance,
  onSelectSample,
  onChangeParams,
  onDetectPeaks
}) => {
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allGroups = Array.from(
    new Set(
      peaks.flatMap(p => p.matches.map(m => m.group))
    )
  ).sort();

  const filteredPeaks = peaks.filter(p => {
    const topMatch = p.matches[0];
    if (filterGroup !== 'all') {
      const hasGroup = p.matches.some(m => m.group.toLowerCase() === filterGroup.toLowerCase());
      if (!hasGroup) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = (topMatch?.name || '') + (topMatch?.class || '') + p.wavenumber.toFixed(1);
      if (!matchText.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
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
              <Target className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              Automated Peak Picking & Infrared Library Identification
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Local prominence picker mapped against NIST and Socrates vibrational frequency correlation tables.
            </p>
          </div>

          <button
            onClick={onDetectPeaks}
            className="flex items-center gap-2 px-4 py-2 rounded text-xs font-bold transition-all shadow-sm active:scale-95"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff'
            }}
          >
            <Search className="w-3.5 h-3.5" />
            Pick & Correlate Peaks
          </button>
        </div>

        {/* Sliders and Sample Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Target Specimen
            </label>
            <select
              value={selectedSampleId}
              onChange={(e) => onSelectSample(e.target.value)}
              className="w-full border rounded px-2.5 py-1.5 text-xs outline-none font-medium"
              style={{
                backgroundColor: 'var(--bg-panel)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              {spectra.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--text-secondary)' }}>
              <span>Min Prominence</span>
              <span className="font-mono">{minProminence.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.005"
              max="0.2"
              step="0.005"
              value={minProminence}
              onChange={(e) => onChangeParams({ minProminence: parseFloat(e.target.value) })}
              className="w-full h-1.5 rounded"
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <span className="text-[10px] block mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Height above local baseline valley
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--text-secondary)' }}>
              <span>Min Peak Height (A)</span>
              <span className="font-mono">{minHeight.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.3"
              step="0.01"
              value={minHeight}
              onChange={(e) => onChangeParams({ minHeight: parseFloat(e.target.value) })}
              className="w-full h-1.5 rounded"
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <span className="text-[10px] block mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Absolute noise suppression threshold
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--text-secondary)' }}>
              <span>Peak Distance</span>
              <span className="font-mono">{minDistance} cm⁻¹</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="5"
              value={minDistance}
              onChange={(e) => onChangeParams({ minDistance: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 rounded"
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <span className="text-[10px] block mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Resolves doublet shoulders
            </span>
          </div>
        </div>
      </div>

      {/* Identified Peaks Table */}
      <div
        className="border rounded-lg p-5 shadow-sm"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)'
        }}
      >
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b gap-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              Annotated Bands & Assigned Functional Groups ({filteredPeaks.length})
            </h3>
          </div>

          {/* Table Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search functional groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border rounded pl-7 pr-3 py-1 text-xs outline-none w-44"
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              />
              <Search className="w-3.5 h-3.5 absolute left-2 top-2" style={{ color: 'var(--text-muted)' }} />
            </div>

            {allGroups.length > 0 && (
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="border rounded px-2.5 py-1 text-xs outline-none"
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="all">All Groups ({allGroups.length})</option>
                {allGroups.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Results Table */}
        <div className="mt-4 border rounded overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="overflow-x-auto max-h-[460px]">
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
                  <th className="py-2.5 px-3">Band (cm⁻¹)</th>
                  <th className="py-2.5 px-3">Absorbance (A)</th>
                  <th className="py-2.5 px-3">Prominence</th>
                  <th className="py-2.5 px-3">FWHM</th>
                  <th className="py-2.5 px-4">Assigned Functional Group</th>
                  <th className="py-2.5 px-3">Chemical Class</th>
                  <th className="py-2.5 px-3">Ref Range</th>
                  <th className="py-2.5 px-3">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                {filteredPeaks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                      No peaks detected matching criteria. Try lowering prominence threshold.
                    </td>
                  </tr>
                ) : (
                  filteredPeaks.map((p, idx) => {
                    const topMatch = p.matches && p.matches.length > 0 ? p.matches[0] : null;
                    return (
                      <tr
                        key={`pk_${idx}`}
                        className="hover:opacity-90 transition-opacity"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold" style={{ color: 'var(--accent-text)' }}>
                          {p.wavenumber.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {p.intensity.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-3 font-mono" style={{ color: 'var(--text-secondary)' }}>
                          {p.prominence.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-3 font-mono" style={{ color: 'var(--text-secondary)' }}>
                          {p.fwhm ? `~${p.fwhm.toFixed(0)}` : '-'}
                        </td>
                        <td className="py-2.5 px-4">
                          {topMatch ? (
                            <div>
                              <span className="font-semibold block">
                                {topMatch.name}
                              </span>
                              {topMatch.notes && (
                                <span className="text-[11px] block mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }} title={topMatch.notes}>
                                  {topMatch.notes}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Unassigned band</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {topMatch ? topMatch.class : '-'}
                        </td>
                        <td className="py-2.5 px-3 font-mono whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                          {topMatch ? `${topMatch.min} - ${topMatch.max}` : '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          {topMatch ? (
                            <span
                              className="font-mono text-[11px] font-semibold"
                              style={{
                                color: topMatch.confidence >= 75 ? '#059669' : (topMatch.confidence >= 50 ? '#d97706' : 'var(--text-muted)')
                              }}
                            >
                              {topMatch.confidence}%
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
