"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { IndicatorDataPoint } from "@/lib/worldbank-api";
import { INDICATOR_LABELS, formatIndicatorValue } from "@/lib/worldbank-api";

const BAR_COLORS = [
  "#6480f3",
  "#4caf8a",
  "#f5a623",
  "#e07ca8",
  "#7ec8e3",
  "#f26b5b",
  "#a78bfa",
  "#fb923c",
  "#34d399",
  "#f87171",
  "#60a5fa",
  "#fbbf24",
];

interface CountryBarChartProps {
  /** Latest-value data points per country */
  data: IndicatorDataPoint[];
  indicatorId: string;
  /** The highlighted primary country code */
  primaryCountry: string;
  title?: string;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * CountryBarChart — horizontal bar chart comparing a single indicator
 * across multiple countries for the selected reference year.
 */
export function CountryBarChart({
  data,
  indicatorId,
  primaryCountry,
  title,
  isLoading,
  error,
}: CountryBarChartProps) {
  const sorted = [...data].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const formatYAxis = (val: number) => {
    if (val >= 1e12) return `${(val / 1e12).toFixed(0)}T`;
    if (val >= 1e9) return `${(val / 1e9).toFixed(0)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(0)}M`;
    return String(val.toFixed(0));
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          {title ?? `${INDICATOR_LABELS[indicatorId] ?? indicatorId} — Country Comparison`}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Latest available value per country
        </p>
      </div>

      {isLoading && (
        <div
          className="flex h-64 items-center justify-center text-sm text-muted-foreground"
          aria-live="polite"
          aria-busy="true"
          role="status"
        >
          Loading data...
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

      {!isLoading && !error && sorted.length === 0 && (
        <div
          className="flex h-64 items-center justify-center text-sm text-muted-foreground"
          role="status"
        >
          No data available.
        </div>
      )}

      {!isLoading && !error && sorted.length > 0 && (
        <div role="img" aria-label={`Bar chart comparing ${INDICATOR_LABELS[indicatorId]} across countries`}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={sorted}
              margin={{ top: 4, right: 8, left: 4, bottom: 24 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={formatYAxis}
                tick={{ fill: "#8892a4", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#2a2f3e" }}
              />
              <YAxis
                type="category"
                dataKey="country.value"
                tick={{ fill: "#8892a4", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={110}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1f2e",
                  border: "1px solid #2a2f3e",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#e2e8f0",
                }}
                formatter={(value: number) => [
                  formatIndicatorValue(value, indicatorId),
                  INDICATOR_LABELS[indicatorId] ?? indicatorId,
                ]}
                cursor={{ fill: "rgba(100,128,243,0.06)" }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {sorted.map((entry, index) => (
                  <Cell
                    key={entry.country.id}
                    fill={
                      entry.country.id === primaryCountry
                        ? "#6480f3"
                        : BAR_COLORS[index % BAR_COLORS.length]
                    }
                    opacity={entry.country.id === primaryCountry ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
