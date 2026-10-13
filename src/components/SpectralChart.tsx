import React, { useRef, useState, useMemo } from 'react';
import { ProcessedSpectrum, DetectedPeak } from '../types/ftir';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, ArrowLeftRight, Eye, EyeOff } from 'lucide-react';

interface SpectralChartProps {
  spectra: ProcessedSpectrum[];
  commonGrid: number[];
  viewMode: 'processed' | 'raw' | 'baseline' | 'both';
  peaks?: DetectedPeak[];
  showPeaks: boolean;
  targetWnRange?: [number, number];
  refWnRange?: [number, number];
  onToggleVisibility?: (id: string) => void;
}

export const SpectralChart: React.FC<SpectralChartProps> = ({
  spectra,
  commonGrid,
  viewMode,
  peaks = [],
  showPeaks,
  targetWnRange,
  refWnRange,
  onToggleVisibility
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [invertX, setInvertX] = useState<boolean>(true); // Standard FTIR: 4000 -> 400 cm^-1
  const [zoomRange, setZoomRange] = useState<{ xMin: number; xMax: number; yMin: number; yMax: number } | null>(null);
  const [hoverData, setHoverData] = useState<{ x: number; y: number; mouseX: number; mouseY: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; curX: number; curY: number } | null>(null);

  // Default extent
  const defaultExtent = useMemo(() => {
    if (commonGrid.length === 0) return { xMin: 400, xMax: 4000, yMin: 0, yMax: 1 };
    const xMin = Math.min(...commonGrid);
    const xMax = Math.max(...commonGrid);

    let yMin = Infinity;
    let yMax = -Infinity;

    spectra.filter(s => s.visible).forEach(s => {
      const arr = viewMode === 'raw' ? s.raw : (viewMode === 'baseline' ? s.baseline : s.final);
      for (const val of arr) {
        if (val < yMin) yMin = val;
        if (val > yMax) yMax = val;
      }
    });

    if (yMin === Infinity) {
      yMin = 0;
      yMax = 1;
    } else {
      const ySpan = yMax - yMin || 0.1;
      yMin = Math.max(-0.2, yMin - ySpan * 0.05);
      yMax = yMax + ySpan * 0.1;
    }

    return { xMin, xMax, yMin, yMax };
  }, [commonGrid, spectra, viewMode]);

  const currentExtent = zoomRange || defaultExtent;

  // Chart dimensions inside SVG
  const width = 1000;
  const height = 520;
  const padding = { top: 30, right: 30, bottom: 50, left: 70 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Coordinate transforms
  const scaleX = (xVal: number) => {
    const { xMin, xMax } = currentExtent;
    const span = xMax - xMin || 1;
    if (invertX) {
      return padding.left + ((xMax - xVal) / span) * plotWidth;
    } else {
      return padding.left + ((xVal - xMin) / span) * plotWidth;
    }
  };

  const invertScaleX = (px: number) => {
    const { xMin, xMax } = currentExtent;
    const span = xMax - xMin || 1;
    const norm = Math.max(0, Math.min(1, (px - padding.left) / plotWidth));
    if (invertX) {
      return xMax - norm * span;
    } else {
      return xMin + norm * span;
    }
  };

  const scaleY = (yVal: number) => {
    const { yMin, yMax } = currentExtent;
    const span = yMax - yMin || 1;
    return padding.top + (1 - (yVal - yMin) / span) * plotHeight;
  };

  const invertScaleY = (py: number) => {
    const { yMin, yMax } = currentExtent;
    const span = yMax - yMin || 1;
    const norm = 1 - (py - padding.top) / plotHeight;
    return yMin + norm * span;
  };

  // Generate ticks
  const xTicks = useMemo(() => {
    const { xMin, xMax } = currentExtent;
    const step = (xMax - xMin) > 2000 ? 500 : ((xMax - xMin) > 800 ? 200 : 50);
    const ticks: number[] = [];
    const first = Math.ceil(xMin / step) * step;
    for (let v = first; v <= xMax; v += step) {
      ticks.push(v);
    }
    return ticks;
  }, [currentExtent]);

  const yTicks = useMemo(() => {
    const { yMin, yMax } = currentExtent;
    const span = yMax - yMin;
    const step = span > 2 ? 0.5 : (span > 0.5 ? 0.1 : (span > 0.1 ? 0.02 : 0.005));
    const ticks: number[] = [];
    const first = Math.ceil(yMin / step) * step;
    for (let v = first; v <= yMax; v += step) {
      ticks.push(Number(v.toFixed(4)));
    }
    return ticks;
  }, [currentExtent]);

  // Mouse interaction for box zoom
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;

    if (x >= padding.left && x <= width - padding.right && y >= padding.top && y <= height - padding.bottom) {
      setIsSelecting(true);
      setSelectionBox({ startX: x, startY: y, curX: x, curY: y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;

    if (isSelecting && selectionBox) {
      setSelectionBox({ ...selectionBox, curX: x, curY: y });
    }

    if (x >= padding.left && x <= width - padding.right && y >= padding.top && y <= height - padding.bottom) {
      const wn = invertScaleX(x);
      const intensity = invertScaleY(y);
      setHoverData({ x: wn, y: intensity, mouseX: x, mouseY: y });
    } else {
      setHoverData(null);
    }
  };

  const handleMouseUp = () => {
    if (isSelecting && selectionBox) {
      setIsSelecting(false);
      const dx = Math.abs(selectionBox.curX - selectionBox.startX);
      const dy = Math.abs(selectionBox.curY - selectionBox.startY);

      if (dx > 20 && dy > 20) {
        const x1 = invertScaleX(selectionBox.startX);
        const x2 = invertScaleX(selectionBox.curX);
        const y1 = invertScaleY(selectionBox.startY);
        const y2 = invertScaleY(selectionBox.curY);

        setZoomRange({
          xMin: Math.min(x1, x2),
          xMax: Math.max(x1, x2),
          yMin: Math.min(y1, y2),
          yMax: Math.max(y1, y2)
        });
      }
      setSelectionBox(null);
    }
  };

  const resetZoom = () => {
    setZoomRange(null);
  };

  const zoomStep = (factor: number) => {
    const { xMin, xMax, yMin, yMax } = currentExtent;
    const xMid = (xMin + xMax) / 2;
    const yMid = (yMin + yMax) / 2;
    const xHalf = ((xMax - xMin) / 2) * factor;
    const yHalf = ((yMax - yMin) / 2) * factor;

    setZoomRange({
      xMin: Math.max(350, xMid - xHalf),
      xMax: Math.min(4100, xMid + xHalf),
      yMin: yMid - yHalf,
      yMax: yMid + yHalf
    });
  };

  // Convert (x, y) into SVG path
  const createPathD = (yData: number[]): string => {
    if (commonGrid.length === 0 || yData.length === 0) return '';
    const points: string[] = [];
    const step = Math.max(1, Math.floor(commonGrid.length / 1400));

    for (let i = 0; i < commonGrid.length; i += step) {
      const px = scaleX(commonGrid[i]);
      const py = scaleY(yData[i]);
      points.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)},${py.toFixed(1)}`);
    }
    return points.join(' ');
  };

  const renderRangeShading = (range: [number, number], color: string, label: string) => {
    const minWn = Math.min(range[0], range[1]);
    const maxWn = Math.max(range[0], range[1]);
    const x1 = scaleX(minWn);
    const x2 = scaleX(maxWn);
    const leftPx = Math.min(x1, x2);
    const widthPx = Math.abs(x2 - x1);

    return (
      <g key={label}>
        <rect
          x={leftPx}
          y={padding.top}
          width={widthPx}
          height={plotHeight}
          fill={color}
          opacity={0.16}
          stroke={color}
          strokeWidth={1}
          strokeDasharray="4 2"
        />
        <text
          x={leftPx + widthPx / 2}
          y={padding.top + 16}
          textAnchor="middle"
          fill={color}
          fontSize="10"
          fontWeight="bold"
        >
          {label}
        </text>
      </g>
    );
  };

  return (
    <div
      className="border rounded-lg overflow-hidden shadow-sm flex flex-col transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border)'
      }}
    >
      {/* Chart Toolbar */}
      <div
        className="flex flex-wrap items-center justify-between px-4 py-2.5 border-b gap-2 text-xs"
        style={{
          backgroundColor: 'var(--bg-panel)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5 text-xs">
            <Crosshair className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            Spectrogram
          </span>
          <span
            className="text-[11px] font-mono px-2 py-0.5 rounded border"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)'
            }}
          >
            {spectra.filter(s => s.visible).length} / {spectra.length} Traces
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Invert Axis Toggle */}
          <button
            onClick={() => setInvertX(!invertX)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors font-medium text-xs"
            style={{
              backgroundColor: invertX ? 'var(--accent-light)' : 'var(--bg-surface)',
              borderColor: invertX ? 'var(--accent-primary)' : 'var(--border)',
              color: invertX ? 'var(--accent-text)' : 'var(--text-secondary)'
            }}
            title="Toggle FTIR standard inverted wavenumber axis (4000 -> 400 cm⁻¹)"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            {invertX ? 'Inverted (4000→400)' : 'Standard (400→4000)'}
          </button>

          {/* Zoom controls */}
          <button
            onClick={() => zoomStep(0.7)}
            className="p-1 rounded border transition-colors"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)'
            }}
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => zoomStep(1.4)}
            className="p-1 rounded border transition-colors"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)'
            }}
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetZoom}
            className="flex items-center gap-1 px-2.5 py-1 rounded border transition-colors font-medium"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)'
            }}
            title="Reset to Full View"
          >
            <RotateCcw className="w-3 h-3" />
            Reset View
          </button>
        </div>
      </div>

      {/* SVG Spectrum Renderer */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/9] max-h-[580px] select-none transition-colors"
        style={{ backgroundColor: 'var(--chart-bg)' }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setIsSelecting(false);
            setSelectionBox(null);
            setHoverData(null);
          }}
        >
          <defs>
            <clipPath id="plot-clip">
              <rect x={padding.left} y={padding.top} width={plotWidth} height={plotHeight} />
            </clipPath>
          </defs>

          {/* Grid lines */}
          <g className="grid-lines" opacity={0.65}>
            {xTicks.map(t => (
              <line
                key={`xt-${t}`}
                x1={scaleX(t)}
                y1={padding.top}
                x2={scaleX(t)}
                y2={padding.top + plotHeight}
                stroke="var(--chart-grid)"
                strokeDasharray="2 3"
              />
            ))}
            {yTicks.map(t => (
              <line
                key={`yt-${t}`}
                x1={padding.left}
                y1={scaleY(t)}
                x2={padding.left + plotWidth}
                y2={scaleY(t)}
                stroke="var(--chart-grid)"
                strokeDasharray="2 3"
              />
            ))}
          </g>

          {/* Shaded Integration Regions */}
          <g clipPath="url(#plot-clip)">
            {targetWnRange && renderRangeShading(targetWnRange, 'var(--metric-target)', 'Target Band')}
            {refWnRange && renderRangeShading(refWnRange, 'var(--metric-ref)', 'Reference Band')}
          </g>

          {/* Spectral Traces */}
          <g clipPath="url(#plot-clip)">
            {spectra
              .filter(s => s.visible)
              .map((spec) => {
                if (viewMode === 'raw') {
                  return (
                    <path
                      key={`${spec.id}_raw`}
                      d={createPathD(spec.raw)}
                      fill="none"
                      stroke={spec.color}
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                } else if (viewMode === 'baseline') {
                  return (
                    <path
                      key={`${spec.id}_base`}
                      d={createPathD(spec.baseline)}
                      fill="none"
                      stroke={spec.color}
                      strokeWidth={2}
                      strokeDasharray="4 3"
                    />
                  );
                } else if (viewMode === 'both') {
                  return (
                    <React.Fragment key={`${spec.id}_both`}>
                      <path
                        d={createPathD(spec.raw)}
                        fill="none"
                        stroke={spec.color}
                        strokeWidth={1.5}
                        opacity={0.8}
                      />
                      <path
                        d={createPathD(spec.baseline)}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth={1.8}
                        strokeDasharray="3 3"
                      />
                    </React.Fragment>
                  );
                } else {
                  // Final preprocessed
                  return (
                    <path
                      key={`${spec.id}_final`}
                      d={createPathD(spec.final)}
                      fill="none"
                      stroke={spec.color}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                }
              })}
          </g>

          {/* Peak Pick Markers */}
          {showPeaks && peaks.length > 0 && (
            <g clipPath="url(#plot-clip)">
              {peaks.map((p, idx) => {
                const px = scaleX(p.wavenumber);
                const py = scaleY(p.intensity);
                if (px < padding.left || px > width - padding.right || py < padding.top || py > height - padding.bottom) {
                  return null;
                }
                return (
                  <g key={`peak_${idx}`}>
                    <circle cx={px} cy={py} r={4.5} fill="#dc2626" stroke="#ffffff" strokeWidth={1.5} />
                    <line x1={px} y1={py} x2={px} y2={py - 14} stroke="#dc2626" strokeWidth={1} strokeDasharray="2 2" />
                    <rect
                      x={px - 22}
                      y={py - 28}
                      width={44}
                      height={14}
                      rx={2}
                      fill="var(--bg-surface)"
                      stroke="#dc2626"
                      strokeWidth={1}
                    />
                    <text
                      x={px}
                      y={py - 18}
                      textAnchor="middle"
                      fill="var(--text-primary)"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {Math.round(p.wavenumber)}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Selection Box for Drag Zoom */}
          {isSelecting && selectionBox && (
            <rect
              x={Math.min(selectionBox.startX, selectionBox.curX)}
              y={Math.min(selectionBox.startY, selectionBox.curY)}
              width={Math.abs(selectionBox.curX - selectionBox.startX)}
              height={Math.abs(selectionBox.curY - selectionBox.startY)}
              fill="var(--accent-primary)"
              fillOpacity={0.15}
              stroke="var(--accent-primary)"
              strokeWidth={1.5}
              strokeDasharray="4 2"
            />
          )}

          {/* Crosshair Cursor */}
          {hoverData && (
            <g>
              <line
                x1={hoverData.mouseX}
                y1={padding.top}
                x2={hoverData.mouseX}
                y2={padding.top + plotHeight}
                stroke="var(--chart-axis)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <line
                x1={padding.left}
                y1={hoverData.mouseY}
                x2={padding.left + plotWidth}
                y2={hoverData.mouseY}
                stroke="var(--chart-axis)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            </g>
          )}

          {/* Axes lines & Ticks */}
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight}
            stroke="var(--chart-axis)"
            strokeWidth={1.5}
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + plotHeight}
            stroke="var(--chart-axis)"
            strokeWidth={1.5}
          />

          {/* X Ticks & Labels */}
          {xTicks.map(t => {
            const px = scaleX(t);
            return (
              <g key={`xlabel-${t}`}>
                <line x1={px} y1={padding.top + plotHeight} x2={px} y2={padding.top + plotHeight + 5} stroke="var(--chart-axis)" />
                <text
                  x={px}
                  y={padding.top + plotHeight + 18}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {t}
                </text>
              </g>
            );
          })}

          {/* Y Ticks & Labels */}
          {yTicks.map(t => {
            const py = scaleY(t);
            return (
              <g key={`ylabel-${t}`}>
                <line x1={padding.left - 5} y1={py} x2={padding.left} y2={py} stroke="var(--chart-axis)" />
                <text
                  x={padding.left - 8}
                  y={py + 3.5}
                  textAnchor="end"
                  fill="var(--text-muted)"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {t}
                </text>
              </g>
            );
          })}

          {/* Axis Titles */}
          <text
            x={padding.left + plotWidth / 2}
            y={height - 12}
            textAnchor="middle"
            fill="var(--text-primary)"
            fontSize="12"
            fontWeight="600"
          >
            Wavenumber (cm⁻¹)
          </text>

          <text
            x={-height / 2}
            y={20}
            textAnchor="middle"
            transform="rotate(-90)"
            fill="var(--text-primary)"
            fontSize="12"
            fontWeight="600"
          >
            {viewMode === 'raw' ? 'Raw Absorbance' : 'Preprocessed Absorbance (A)'}
          </text>
        </svg>

        {/* Live Hover Readout Box */}
        {hoverData && (
          <div
            className="absolute top-3 right-4 pointer-events-none border px-3 py-1.5 rounded text-xs shadow-md flex items-center gap-3 font-mono"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>ν: </span>
              <span className="font-bold">{hoverData.x.toFixed(1)} cm⁻¹</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>A: </span>
              <span className="font-bold" style={{ color: 'var(--accent-primary)' }}>
                {hoverData.y.toFixed(4)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Trace Legend */}
      <div
        className="flex flex-wrap items-center gap-2 p-3 border-t text-xs overflow-x-auto max-h-24"
        style={{
          backgroundColor: 'var(--bg-panel)',
          borderColor: 'var(--border)'
        }}
      >
        <span
          className="font-semibold uppercase text-[10px] tracking-wider mr-1"
          style={{ color: 'var(--text-muted)' }}
        >
          Traces:
        </span>
        {spectra.map(s => (
          <button
            key={s.id}
            onClick={() => onToggleVisibility?.(s.id)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-all"
            style={{
              backgroundColor: s.visible ? 'var(--bg-surface)' : 'transparent',
              borderColor: s.visible ? 'var(--border)' : 'transparent',
              color: s.visible ? 'var(--text-primary)' : 'var(--text-muted)'
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: s.visible ? s.color : '#94a3b8' }}
            />
            <span className="truncate max-w-[140px]">{s.name}</span>
            {s.visible ? <Eye className="w-3 h-3 opacity-60" /> : <EyeOff className="w-3 h-3 opacity-40" />}
          </button>
        ))}
      </div>
    </div>
  );
};
