import React, { useRef } from 'react';
import { RawSpectrum } from '../types/ftir';
import { parseFTIRFile } from '../services/ftirParser';
import { getSampleBackgroundSpectrum, getPolymerDegradationSeries, getBiodieselBlendSeries } from '../services/sampleData';
import { Upload, FileSpreadsheet, Trash2, Sparkles, CheckCircle2, FileText } from 'lucide-react';

interface UploadSectionProps {
  samples: RawSpectrum[];
  background: RawSpectrum | null;
  onAddSamples: (newSamples: RawSpectrum[]) => void;
  onRemoveSample: (id: string) => void;
  onSetBackground: (bg: RawSpectrum | null) => void;
  onClearAll: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  samples,
  background,
  onAddSamples,
  onRemoveSample,
  onSetBackground,
  onClearAll
}) => {
  const sampleInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleSampleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = 20 - samples.length;
    if (remainingSlots <= 0) {
      alert("Maximum 20 samples limit reached. Please remove some samples first.");
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const parsedList: RawSpectrum[] = [];

    for (const file of filesToProcess) {
      try {
        const parsed = await parseFTIRFile(file);
        parsedList.push(...parsed);
      } catch (err: any) {
        alert(`Error parsing ${file.name}: ${err.message || err}`);
      }
    }

    if (parsedList.length > 0) {
      onAddSamples(parsedList.slice(0, remainingSlots));
    }
  };

  const handleBgFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const parsed = await parseFTIRFile(file);
      if (parsed.length > 0) {
        onSetBackground(parsed[0]);
      }
    } catch (err: any) {
      alert(`Error reading background ${file.name}: ${err.message || err}`);
    }
  };

  const loadPolymerDemo = () => {
    const demoBg = getSampleBackgroundSpectrum();
    const demoSamples = getPolymerDegradationSeries();
    onSetBackground(demoBg);
    onAddSamples(demoSamples);
  };

  const loadBiodieselDemo = () => {
    const demoSamples = getBiodieselBlendSeries();
    onAddSamples(demoSamples);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Benchmark Loaders */}
      <div
        className="border rounded-lg p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)'
        }}
      >
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FileSpreadsheet className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            FTIR Data Ingestion & Batch Management
          </h2>
          <p className="text-xs mt-1 max-w-2xl" style={{ color: 'var(--text-muted)' }}>
            Ingest up to 20 samples plus an optional background (.xlsx, .xls, .csv, .txt, .dat).
            Supports multiple sample columns in one sheet, European comma decimals, and automatic %T to Absorbance conversion.
          </p>
        </div>

        {/* 1-Click Benchmark Loaders */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadPolymerDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold transition-all shadow-sm"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border)',
              color: 'var(--accent-text)'
            }}
            title="Load 5 Polyethylene UV Oxidation samples with Air background"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Polymer Degradation (5)
          </button>
          <button
            onClick={loadBiodieselDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold transition-all shadow-sm"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
            title="Load 5 Biodiesel blend calibration samples"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Biodiesel Blend (5)
          </button>
          {samples.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 px-3 py-1.5 rounded border text-xs font-semibold transition-all"
              style={{
                backgroundColor: 'transparent',
                borderColor: 'var(--border)',
                color: '#dc2626'
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Grid: Samples Upload & Background Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sample Dropzone */}
        <div
          className="lg:col-span-2 border rounded-lg p-5 shadow-sm flex flex-col"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Sample Spectra Batch ({samples.length} / 20)
            </span>
            <span style={{ color: 'var(--text-muted)' }}>Maximum 20 specimens</span>
          </div>

          {/* Drag & Drop Area */}
          <div
            onClick={() => sampleInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleSampleFiles(e.dataTransfer.files);
            }}
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border)'
            }}
          >
            <input
              ref={sampleInputRef}
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.txt,.dat"
              className="hidden"
              onChange={(e) => handleSampleFiles(e.target.files)}
            />
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent-primary)'
              }}
            >
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Drag & drop sample files here, or <span style={{ color: 'var(--accent-primary)' }} className="underline">browse</span>
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Supported: Excel (.xlsx, .xls), CSV (.csv), Text (.txt, .dat)
              </p>
            </div>
          </div>

          {/* Sample Table */}
          {samples.length > 0 && (
            <div
              className="mt-4 border rounded-lg overflow-hidden max-h-64 overflow-y-auto text-xs"
              style={{ borderColor: 'var(--border)' }}
            >
              <table className="w-full text-left">
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
                    <th className="py-2 px-3">File Name</th>
                    <th className="py-2 px-3">Wavenumber Range</th>
                    <th className="py-2 px-3">Points</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                  {samples.map((s, idx) => (
                    <tr
                      key={s.id}
                      className="hover:opacity-90 transition-opacity"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <td className="py-2 px-3 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-medium flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                        <span className="truncate max-w-[200px]" title={s.name}>{s.name}</span>
                        {s.isTransmittance && (
                          <span className="text-[10px] font-mono px-1 rounded border">
                            %T→A
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        {Math.round(s.maxWn)} → {Math.round(s.minWn)} cm⁻¹
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        {s.points}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => onRemoveSample(s.id)}
                          className="hover:text-rose-600 p-1 rounded transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          title="Remove Sample"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Background Spectrum Dropzone */}
        <div
          className="border rounded-lg p-5 shadow-sm flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border)'
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Background Spectrum
              </span>
              <span style={{ color: background ? 'var(--accent-text)' : 'var(--text-muted)' }}>
                {background ? 'Active' : 'Optional'}
              </span>
            </div>

            <div
              onClick={() => bgInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleBgFile(e.dataTransfer.files);
              }}
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--bg-panel)',
                borderColor: 'var(--border)'
              }}
            >
              <input
                ref={bgInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.txt,.dat"
                className="hidden"
                onChange={(e) => handleBgFile(e.target.files)}
              />
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--accent-light)',
                  color: 'var(--accent-primary)'
                }}
              >
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Drop Background / Blank here
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Air blank, KBr pellet, solvent, or substrate
              </p>
            </div>

            {background ? (
              <div
                className="mt-4 p-3 rounded border text-xs space-y-1"
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  borderColor: 'var(--border)'
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }} title={background.name}>
                    {background.name}
                  </span>
                  <button
                    onClick={() => onSetBackground(null)}
                    className="hover:underline text-[11px]"
                    style={{ color: '#dc2626' }}
                  >
                    Remove
                  </button>
                </div>
                <div className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  Points: {background.points} ({Math.round(background.maxWn)} → {Math.round(background.minWn)} cm⁻¹)
                </div>
              </div>
            ) : (
              <div
                className="mt-4 p-3 rounded border text-[11px]"
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-muted)'
                }}
              >
                Background scans capture ambient air CO2 (~2350 cm⁻¹) and spectrometer optical transmission curves for subtraction.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
