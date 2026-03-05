"use client";

import { TrendingUp, TrendingDown, Minus, Users, DollarSign, Activity, Wifi } from "lucide-react";
import type { IndicatorDataPoint } from "@/lib/worldbank-api";
import {
  KEY_INDICATORS,
  INDICATOR_LABELS,
  formatIndicatorValue,
  FEATURED_COUNTRIES,
} from "@/lib/worldbank-api";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  change?: number | null;
  icon: React.ReactNode;
  accentColor: string;
}

function StatCard({ label, value, change, icon, accentColor }: StatCardProps) {
  const isPositive = (change ?? 0) > 0;
  const isNeutral = change === null || change === undefined || change === 0;

  return (
    <div
      className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
      role="article"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted-foreground leading-snug">{label}</p>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>

      <div>
        <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
        {!isNeutral && (
          <div
            className={cn(
              "mt-1 flex items-center gap-1 text-xs",
              isPositive ? "text-accent" : "text-destructive"
            )}
            aria-label={`${isPositive ? "Increase" : "Decrease"} of ${Math.abs(change!).toFixed(1)}% year over year`}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-3 w-3" aria-hidden="true" />
            )}
            <span>
              {isPositive ? "+" : ""}
              {change!.toFixed(1)}% YoY
            </span>
          </div>
        )}
        {isNeutral && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Minus className="h-3 w-3" aria-hidden="true" />
            <span>No change data</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatsCardsProps {
  countryCode: string;
  /** Map of indicatorId -> latest data point for the country */
  latestData: Map<string, IndicatorDataPoint | null>;
  /** Map of indicatorId -> previous year data point */
  previousData: Map<string, IndicatorDataPoint | null>;
  isLoading?: boolean;
}

/**
 * StatsCards — 4 KPI summary cards showing key indicators for the primary country.
 */
export function StatsCards({ countryCode, latestData, previousData, isLoading }: StatsCardsProps) {
  const country = FEATURED_COUNTRIES.find((c) => c.code === countryCode);

  function getYoY(indicatorId: string): number | null {
    const latest = latestData.get(indicatorId);
    const prev = previousData.get(indicatorId);
    if (!latest?.value || !prev?.value || prev.value === 0) return null;
    return ((latest.value - prev.value) / prev.value) * 100;
  }

  const cards: StatCardProps[] = [
    {
      label: INDICATOR_LABELS[KEY_INDICATORS.GDP_PER_CAPITA],
      value: formatIndicatorValue(
        latestData.get(KEY_INDICATORS.GDP_PER_CAPITA)?.value ?? null,
        KEY_INDICATORS.GDP_PER_CAPITA
      ),
      change: getYoY(KEY_INDICATORS.GDP_PER_CAPITA),
      icon: <DollarSign className="h-4 w-4" />,
      accentColor: "#6480f3",
    },
    {
      label: INDICATOR_LABELS[KEY_INDICATORS.POPULATION_TOTAL],
      value: formatIndicatorValue(
        latestData.get(KEY_INDICATORS.POPULATION_TOTAL)?.value ?? null,
        KEY_INDICATORS.POPULATION_TOTAL
      ),
      change: getYoY(KEY_INDICATORS.POPULATION_TOTAL),
      icon: <Users className="h-4 w-4" />,
      accentColor: "#4caf8a",
    },
    {
      label: INDICATOR_LABELS[KEY_INDICATORS.LIFE_EXPECTANCY],
      value: formatIndicatorValue(
        latestData.get(KEY_INDICATORS.LIFE_EXPECTANCY)?.value ?? null,
        KEY_INDICATORS.LIFE_EXPECTANCY
      ),
      change: getYoY(KEY_INDICATORS.LIFE_EXPECTANCY),
      icon: <Activity className="h-4 w-4" />,
      accentColor: "#f5a623",
    },
    {
      label: INDICATOR_LABELS[KEY_INDICATORS.INTERNET_USERS],
      value: formatIndicatorValue(
        latestData.get(KEY_INDICATORS.INTERNET_USERS)?.value ?? null,
        KEY_INDICATORS.INTERNET_USERS
      ),
      change: getYoY(KEY_INDICATORS.INTERNET_USERS),
      icon: <Wifi className="h-4 w-4" />,
      accentColor: "#e07ca8",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-busy="true" role="status">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4 h-28 animate-pulse"
            aria-hidden="true"
          />
        ))}
        <span className="sr-only">Loading statistics...</span>
      </div>
    );
  }

  return (
    <section aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="sr-only">
        Key indicators for {country?.name ?? countryCode}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>
    </section>
  );
}
