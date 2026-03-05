"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Menu, X } from "lucide-react";
import { DashboardFilters } from "./DashboardFilters";
import { StatsCards } from "./StatsCards";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { CountryBarChart } from "./CountryBarChart";
import { CountryRadarChart } from "./CountryRadarChart";
import { DataTable } from "./DataTable";
import {
  fetchIndicatorByCountry,
  fetchIndicatorMultipleCountries,
  getLatestPerCountry,
  KEY_INDICATORS,
  FEATURED_COUNTRIES,
  type IndicatorDataPoint,
} from "@/lib/worldbank-api";

// ─── Radar normalization helpers ─────────────────────────────────────────────

/**
 * Normalize a value to a 0-100 scale given a reference min/max.
 * For "lower is better" indicators (like infant mortality) we invert.
 */
function normalize(
  value: number | null,
  min: number,
  max: number,
  invertScale = false
): number {
  if (value === null || max === min) return 0;
  const score = ((value - min) / (max - min)) * 100;
  return invertScale ? 100 - score : score;
}

// Radar indicators with their reference ranges and inversion flags
const RADAR_INDICATORS = [
  { id: KEY_INDICATORS.GDP_PER_CAPITA, label: "GDP/capita", min: 500, max: 70000, invert: false },
  { id: KEY_INDICATORS.LIFE_EXPECTANCY, label: "Life Exp.", min: 50, max: 85, invert: false },
  { id: KEY_INDICATORS.INTERNET_USERS, label: "Internet", min: 0, max: 100, invert: false },
  { id: KEY_INDICATORS.LITERACY_RATE, label: "Literacy", min: 20, max: 100, invert: false },
  { id: KEY_INDICATORS.INFANT_MORTALITY, label: "Infant Mort.", min: 1, max: 80, invert: true },
  { id: KEY_INDICATORS.UNEMPLOYMENT, label: "Employment", min: 0, max: 30, invert: true },
];

const DEFAULT_COUNTRIES = ["US", "DE", "BR"];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * DashboardClient — the main client-side dashboard controller.
 * Manages all filter state, data fetching, and chart rendering.
 */
export function DashboardClient() {
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [selectedIndicator, setSelectedIndicator] = useState<string>(KEY_INDICATORS.GDP_PER_CAPITA);
  const [selectedYear] = useState(2022);
  const [compareCountries, setCompareCountries] = useState<string[]>(DEFAULT_COUNTRIES);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ─── Data state ───────────────────────────────────────────────────────────

  const [timeSeriesData, setTimeSeriesData] = useState<IndicatorDataPoint[]>([]);
  const [timeSeriesLoading, setTimeSeriesLoading] = useState(true);
  const [timeSeriesError, setTimeSeriesError] = useState<string | null>(null);

  const [barData, setBarData] = useState<IndicatorDataPoint[]>([]);
  const [barLoading, setBarLoading] = useState(true);
  const [barError, setBarError] = useState<string | null>(null);

  const [statsData, setStatsData] = useState<Map<string, IndicatorDataPoint | null>>(new Map());
  const [prevStatsData, setPrevStatsData] = useState<Map<string, IndicatorDataPoint | null>>(new Map());
  const [statsLoading, setStatsLoading] = useState(true);

  const [radarData, setRadarData] = useState<{ metric: string; [key: string]: number | string }[]>([]);
  const [radarLoading, setRadarLoading] = useState(true);
  const [radarError, setRadarError] = useState<string | null>(null);

  // ─── Fetch: Time-series for selected indicator + compare countries ─────────

  const fetchTimeSeries = useCallback(async () => {
    const allCountries = Array.from(new Set([selectedCountry, ...compareCountries]));
    setTimeSeriesLoading(true);
    setTimeSeriesError(null);
    try {
      const data = await fetchIndicatorMultipleCountries(allCountries, selectedIndicator);
      setTimeSeriesData(data);
    } catch (e) {
      setTimeSeriesError(e instanceof Error ? e.message : "Failed to load chart data.");
    } finally {
      setTimeSeriesLoading(false);
    }
  }, [selectedCountry, compareCountries, selectedIndicator]);

  // ─── Fetch: Bar chart — all featured countries for the indicator ───────────

  const fetchBar = useCallback(async () => {
    setBarLoading(true);
    setBarError(null);
    try {
      const codes = FEATURED_COUNTRIES.map((c) => c.code);
      const data = await fetchIndicatorMultipleCountries(codes, selectedIndicator, "2018:2023");
      setBarData(getLatestPerCountry(data));
    } catch (e) {
      setBarError(e instanceof Error ? e.message : "Failed to load comparison data.");
    } finally {
      setBarLoading(false);
    }
  }, [selectedIndicator]);

  // ─── Fetch: Stats cards — 4 KPI indicators for primary country ────────────

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const indicatorIds = [
        KEY_INDICATORS.GDP_PER_CAPITA,
        KEY_INDICATORS.POPULATION_TOTAL,
        KEY_INDICATORS.LIFE_EXPECTANCY,
        KEY_INDICATORS.INTERNET_USERS,
      ];
      const results = await Promise.allSettled(
        indicatorIds.map((id) =>
          fetchIndicatorByCountry(selectedCountry, id, "2020:2023")
        )
      );

      const latest = new Map<string, IndicatorDataPoint | null>();
      const prev = new Map<string, IndicatorDataPoint | null>();

      results.forEach((r, i) => {
        const id = indicatorIds[i];
        if (r.status === "fulfilled" && r.value.length > 0) {
          const arr = r.value;
          latest.set(id, arr[arr.length - 1]);
          prev.set(id, arr.length > 1 ? arr[arr.length - 2] : null);
        } else {
          latest.set(id, null);
          prev.set(id, null);
        }
      });

      setStatsData(latest);
      setPrevStatsData(prev);
    } finally {
      setStatsLoading(false);
    }
  }, [selectedCountry]);

  // ─── Fetch: Radar — multi-indicator for compare countries ─────────────────

  const fetchRadar = useCallback(async () => {
    const allCodes = Array.from(new Set([selectedCountry, ...compareCountries])).slice(0, 5);
    setRadarLoading(true);
    setRadarError(null);
    try {
      const results = await Promise.allSettled(
        RADAR_INDICATORS.map((ri) =>
          fetchIndicatorMultipleCountries(allCodes, ri.id, "2018:2023")
        )
      );

      // Build map: { indicatorIdx -> { countryCode -> latestValue } }
      const radarValues: Record<string, Record<string, number | null>> = {};
      RADAR_INDICATORS.forEach((ri, i) => {
        radarValues[ri.id] = {};
        if (results[i].status === "fulfilled") {
          const latest = getLatestPerCountry((results[i] as PromiseFulfilledResult<IndicatorDataPoint[]>).value);
          latest.forEach((dp) => {
            radarValues[ri.id][dp.country.id] = dp.value;
          });
        }
      });

      const rows = RADAR_INDICATORS.map((ri) => {
        const row: { metric: string; [key: string]: number | string } = { metric: ri.label };
        allCodes.forEach((code) => {
          const val = radarValues[ri.id][code] ?? null;
          row[code] = normalize(val, ri.min, ri.max, ri.invert);
        });
        return row;
      });

      setRadarData(rows);
    } catch (e) {
      setRadarError(e instanceof Error ? e.message : "Failed to load radar data.");
    } finally {
      setRadarLoading(false);
    }
  }, [selectedCountry, compareCountries]);

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => { fetchTimeSeries(); }, [fetchTimeSeries]);
  useEffect(() => { fetchBar(); }, [fetchBar]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchRadar(); }, [fetchRadar]);

  // Unique country codes for time-series lines
  const timeSeriesCountries = useMemo(
    () => Array.from(new Set([selectedCountry, ...compareCountries])),
    [selectedCountry, compareCountries]
  );

  const primaryFlag = FEATURED_COUNTRIES.find((c) => c.code === selectedCountry)?.flag ?? "";
  const primaryName = FEATURED_COUNTRIES.find((c) => c.code === selectedCountry)?.name ?? selectedCountry;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Mobile sidebar toggle ─────────────────────────────────────────── */}
      <div className="lg:hidden sticky top-16 z-40 flex items-center gap-3 border-b border-border bg-card/80 backdrop-blur-sm px-4 py-2">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          aria-expanded={sidebarOpen}
          aria-controls="filters-sidebar"
          aria-label="Toggle filters"
        >
          {sidebarOpen ? (
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Menu className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Filters
        </button>
        <span className="text-xs text-muted-foreground">
          <span aria-hidden="true">{primaryFlag}</span> {primaryName}
        </span>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-6">

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <aside
            id="filters-sidebar"
            className={`
              ${sidebarOpen ? "block" : "hidden"} lg:block
              w-full lg:w-64 shrink-0
              lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto
            `}
          >
            <DashboardFilters
              selectedCountry={selectedCountry}
              onCountryChange={(c) => { setSelectedCountry(c); setSidebarOpen(false); }}
              selectedIndicator={selectedIndicator}
              onIndicatorChange={setSelectedIndicator}
              selectedYear={selectedYear}
              onYearChange={() => {}}
              compareCountries={compareCountries}
              onCompareCountriesChange={setCompareCountries}
            />
          </aside>

          {/* ── Main content ─────────────────────────────────────────────── */}
          <main className="min-w-0 flex-1 flex flex-col gap-6" role="main" aria-label="Dashboard content">

            {/* Page title */}
            <div>
              <h2 className="text-xl font-bold text-foreground text-balance">
                <span aria-hidden="true">{primaryFlag}</span> {primaryName} — Development Indicators
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Data sourced from the{" "}
                <a
                  href="https://data.worldbank.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  World Bank Open Data API
                </a>
                . Updated annually.
              </p>
            </div>

            {/* KPI cards */}
            <StatsCards
              countryCode={selectedCountry}
              latestData={statsData}
              previousData={prevStatsData}
              isLoading={statsLoading}
            />

            {/* Time-series + Radar grid */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              <div className="xl:col-span-3">
                <TimeSeriesChart
                  data={timeSeriesData}
                  indicatorId={selectedIndicator}
                  countryCodes={timeSeriesCountries}
                  isLoading={timeSeriesLoading}
                  error={timeSeriesError}
                />
              </div>
              <div className="xl:col-span-2">
                <CountryRadarChart
                  data={radarData}
                  countryCodes={timeSeriesCountries.slice(0, 5)}
                  isLoading={radarLoading}
                  error={radarError}
                />
              </div>
            </div>

            {/* Bar chart */}
            <CountryBarChart
              data={barData}
              indicatorId={selectedIndicator}
              primaryCountry={selectedCountry}
              isLoading={barLoading}
              error={barError}
            />

            {/* Data table */}
            <DataTable
              data={barData}
              indicatorId={selectedIndicator}
              isLoading={barLoading}
              error={barError}
            />

          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-8 py-6 text-center text-xs text-muted-foreground">
        <p>
          Data provided by the{" "}
          <a
            href="https://datahelpdesk.worldbank.org/knowledgebase/articles/889392"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            World Bank Indicators API v2
          </a>
          . No authentication required. Data may be incomplete for certain countries.
        </p>
      </footer>
    </div>
  );
}
