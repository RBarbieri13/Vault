import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
  showDots?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 48,
  height = 16,
  strokeWidth = 1.5,
  strokeColor = '#3b82f6',
  fillColor,
  showDots = false,
  className,
}: SparklineProps) {
  const { path, fillPath, points } = useMemo(() => {
    if (!data || data.length === 0) {
      return { path: '', fillPath: '', points: [] };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Add padding to prevent clipping
    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const pointsArray = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return { x, y };
    });

    // Create SVG path
    const pathData = pointsArray
      .map((point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;

        // Use smooth curves for better visualization
        const prev = pointsArray[index - 1];
        const controlX = (prev.x + point.x) / 2;
        return `C ${controlX} ${prev.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
      })
      .join(' ');

    // Create fill path (closes the area under the line)
    const fillPathData = fillColor
      ? `${pathData} L ${pointsArray[pointsArray.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`
      : '';

    return {
      path: pathData,
      fillPath: fillPathData,
      points: pointsArray,
    };
  }, [data, width, height]);

  // Determine trend color based on last vs first value
  const trendColor = useMemo(() => {
    if (!data || data.length < 2) return strokeColor;
    const first = data[0];
    const last = data[data.length - 1];
    if (last > first) return '#22c55e'; // green for upward
    if (last < first) return '#ef4444'; // red for downward
    return '#94a3b8'; // gray for flat
  }, [data, strokeColor]);

  if (!data || data.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        className={cn("inline-block", className)}
        viewBox={`0 0 ${width} ${height}`}
      >
        <line
          x1={2}
          y1={height / 2}
          x2={width - 2}
          y2={height / 2}
          stroke="#94a3b8"
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      </svg>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className={cn("inline-block", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Fill area under the line */}
      {fillPath && (
        <path
          d={fillPath}
          fill={trendColor}
          opacity={0.1}
        />
      )}

      {/* Main line */}
      <path
        d={path}
        fill="none"
        stroke={trendColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Optional dots at data points */}
      {showDots && points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={1.5}
          fill={trendColor}
        />
      ))}

      {/* End dot (always show last point) */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={2}
          fill={trendColor}
        />
      )}
    </svg>
  );
}

// Mini sparkline for ultra-compact grids
export function MiniSparkline({
  data,
  className,
}: {
  data: number[];
  className?: string;
}) {
  return (
    <Sparkline
      data={data}
      width={40}
      height={12}
      strokeWidth={1}
      showDots={false}
      className={className}
    />
  );
}

// Usage bar for percentage visualization
interface UsageBarProps {
  value: number; // 0-100
  width?: number;
  height?: number;
  showLabel?: boolean;
  className?: string;
}

export function UsageBar({
  value,
  width = 48,
  height = 4,
  showLabel = false,
  className,
}: UsageBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  // Color based on usage level
  const getColor = (val: number) => {
    if (val >= 80) return '#22c55e'; // green - high usage
    if (val >= 50) return '#3b82f6'; // blue - medium usage
    if (val >= 25) return '#f59e0b'; // amber - low usage
    return '#94a3b8'; // gray - very low usage
  };

  const color = getColor(clampedValue);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div
        className="relative bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
        style={{ width, height }}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
          style={{
            width: `${clampedValue}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {showLabel && (
        <span className="text-[9px] text-slate-500 tabular-nums min-w-[24px]">
          {clampedValue}%
        </span>
      )}
    </div>
  );
}

// Combined trend and usage indicator
interface TrendIndicatorProps {
  trend: number[];
  usage: number;
  className?: string;
}

export function TrendIndicator({ trend, usage, className }: TrendIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <MiniSparkline data={trend} />
      <UsageBar value={usage} showLabel />
    </div>
  );
}
