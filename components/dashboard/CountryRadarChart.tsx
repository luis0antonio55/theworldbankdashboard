"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { FEATURED_COUNTRIES } from "@/lib/worldbank-api";

const RADAR_COLORS = ["#6480f3", "#4caf8a", "#f5a623", "#e07ca8", "#7ec8e3"];

interface RadarDataPoint {
  metric: string;
  [country: string]: number | string;
}

interface CountryRadarChartProps {
  data: RadarDataPoint[];
  countryCodes: string[];
  isLoading?: boolean;
  error?: string | null;
}

/**
 * CountryRadarChart — spider/radar chart for multi-dimensional country
 * comparison across normalized indicators.
 */
export function CountryRadarChart({
  data,
  countryCodes,
  isLoading,
  error,
}: CountryRadarChartProps) {
  const countryNameMap = new Map(FEATURED_COUNTRIES.map((c) => [c.code, c.name]));

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Multi-Indicator Radar
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Normalized scores across key development indicators
        </p>
      </div>

      {isLoading && (
        <div
          className="flex h-72 items-center justify-center text-sm text-muted-foreground"
          aria-live="polite"
          role="status"
        >
          Loading data...
        </div>
      )}

      {error && !isLoading && (
        <div
          className="flex h-72 items-center justify-center text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div role="img" aria-label="Radar chart comparing countries across multiple indicators">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="#2a2f3e" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: "#8892a4", fontSize: 10 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "#8892a4", fontSize: 9 }}
                tickCount={4}
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
                  `${value.toFixed(1)} / 100`,
                  countryNameMap.get(name) ?? name,
                ]}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ color: "#8892a4", fontSize: 11 }}>
                    {countryNameMap.get(value) ?? value}
                  </span>
                )}
              />
              {countryCodes.map((code, i) => (
                <Radar
                  key={code}
                  name={code}
                  dataKey={code}
                  stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                  fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
