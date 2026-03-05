"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { IndicatorDataPoint } from "@/lib/worldbank-api";
import { INDICATOR_LABELS, formatIndicatorValue, FEATURED_COUNTRIES } from "@/lib/worldbank-api";

// Computed solid colors — DO NOT use CSS variables for Recharts
const CHART_COLORS = [
  "#6480f3", // blue
  "#4caf8a", // green
  "#f5a623", // amber
  "#e07ca8", // pink
  "#7ec8e3", // cyan
  "#f26b5b", // rose
];

interface TimeSeriesChartProps {
  /** Array of data points — may contain multiple countries */
  data: IndicatorDataPoint[];
  /** World Bank indicator code */
  indicatorId: string;
  /** Country codes to display (each gets its own line) */
  countryCodes: string[];
  /** Optional title override */
  title?: string;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * TimeSeriesChart — renders a multi-line Recharts chart for time-series
 * indicator data across one or more countries.
 */
export function TimeSeriesChart({
  data,
  indicatorId,
  countryCodes,
  title,
  isLoading,
  error,
}: TimeSeriesChartProps) {
  const countryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    FEATURED_COUNTRIES.forEach((c) => map.set(c.code, c.name));
    return map;
  }, []);

  // Pivot data: { year, [countryCode]: value }[]
  const chartData = useMemo(() => {
    const byYear = new Map<string, Record<string, number | null>>();

    for (const point of data) {
      if (!byYear.has(point.date)) byYear.set(point.date, { year: Number(point.date) as never });
      const row = byYear.get(point.date)!;
      row[point.country.id] = point.value;
    }

    return Array.from(byYear.entries())
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, row]) => row);
  }, [data]);

  const formatYAxis = (val: number) => {
    if (val >= 1e12) return `${(val / 1e12).toFixed(1)}T`;
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    return String(val.toFixed(1));
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          {title ?? INDICATOR_LABELS[indicatorId] ?? indicatorId}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">Time series (2000 – 2023)</p>
      </div>

      {isLoading && (
        <div
          className="flex h-64 items-center justify-center text-sm text-muted-foreground"
          aria-live="polite"
          aria-busy="true"
          role="status"
        >
          <span>Loading data...</span>
        </div>
      )}

      {error && !isLoading && (
        <div
          className="flex h-64 items-center justify-center text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {!isLoading && !error && chartData.length === 0 && (
        <div
          className="flex h-64 items-center justify-center text-sm text-muted-foreground"
          role="status"
        >
          No data available for the selected filters.
        </div>
      )}

      {!isLoading && !error && chartData.length > 0 && (
        <div role="img" aria-label={`Time series chart for ${INDICATOR_LABELS[indicatorId]}`}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
              <XAxis
                dataKey="year"
                tick={{ fill: "#8892a4", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#2a2f3e" }}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fill: "#8892a4", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1f2e",
                  border: "1px solid #2a2f3e",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#e2e8f0",
                }}
                formatter={(value: number, name: string) => [
                  formatIndicatorValue(value, indicatorId),
                  countryNameMap.get(name) ?? name,
                ]}
                labelFormatter={(label) => `Year: ${label}`}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ color: "#8892a4", fontSize: 11 }}>
                    {countryNameMap.get(value) ?? value}
                  </span>
                )}
              />
              {countryCodes.map((code, i) => (
                <Line
                  key={code}
                  type="monotone"
                  dataKey={code}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
