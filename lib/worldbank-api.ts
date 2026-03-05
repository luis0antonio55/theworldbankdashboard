/**
 * World Bank Indicators API v2 Service
 * Base URL: https://api.worldbank.org/v2
 * Docs: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
 *
 * No authentication required. All responses are JSON with ?format=json.
 */

const BASE_URL = "https://api.worldbank.org/v2";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorldBankMeta {
  page: number;
  pages: number;
  per_page: number;
  total: number;
  sourceid?: string;
  lastupdated?: string;
}

export interface Country {
  id: string;
  iso2Code: string;
  name: string;
  region: { id: string; iso2code: string; value: string };
  adminregion: { id: string; iso2code: string; value: string };
  incomeLevel: { id: string; iso2code: string; value: string };
  lendingType: { id: string; iso2code: string; value: string };
  capitalCity: string;
  longitude: string;
  latitude: string;
}

export interface Indicator {
  id: string;
  name: string;
  unit: string;
  source: { id: string; value: string };
  sourceNote: string;
  sourceOrganization: string;
  topics: { id: string; value: string }[];
}

export interface IndicatorDataPoint {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  obs_status: string;
  decimal: number;
}

// ─── Key Indicators ───────────────────────────────────────────────────────────

export const KEY_INDICATORS = {
  GDP_CURRENT_USD: "NY.GDP.MKTP.CD",
  GDP_PER_CAPITA: "NY.GDP.PCAP.CD",
  POPULATION_TOTAL: "SP.POP.TOTL",
  LIFE_EXPECTANCY: "SP.DYN.LE00.IN",
  GDP_GROWTH: "NY.GDP.MKTP.KD.ZG",
  UNEMPLOYMENT: "SL.UEM.TOTL.ZS",
  CO2_EMISSIONS: "EN.ATM.CO2E.PC",
  INTERNET_USERS: "IT.NET.USER.ZS",
  LITERACY_RATE: "SE.ADT.LITR.ZS",
  INFANT_MORTALITY: "SP.DYN.IMRT.IN",
} as const;

export type IndicatorKey = keyof typeof KEY_INDICATORS;

export const INDICATOR_LABELS: Record<string, string> = {
  [KEY_INDICATORS.GDP_CURRENT_USD]: "GDP (current US$)",
  [KEY_INDICATORS.GDP_PER_CAPITA]: "GDP per Capita (US$)",
  [KEY_INDICATORS.POPULATION_TOTAL]: "Population",
  [KEY_INDICATORS.LIFE_EXPECTANCY]: "Life Expectancy (years)",
  [KEY_INDICATORS.GDP_GROWTH]: "GDP Growth (%)",
  [KEY_INDICATORS.UNEMPLOYMENT]: "Unemployment Rate (%)",
  [KEY_INDICATORS.CO2_EMISSIONS]: "CO₂ Emissions (metric tons per capita)",
  [KEY_INDICATORS.INTERNET_USERS]: "Internet Users (% of population)",
  [KEY_INDICATORS.LITERACY_RATE]: "Literacy Rate (% of adults)",
  [KEY_INDICATORS.INFANT_MORTALITY]: "Infant Mortality (per 1,000 live births)",
};

export const INDICATOR_UNITS: Record<string, string> = {
  [KEY_INDICATORS.GDP_CURRENT_USD]: "USD",
  [KEY_INDICATORS.GDP_PER_CAPITA]: "USD",
  [KEY_INDICATORS.POPULATION_TOTAL]: "people",
  [KEY_INDICATORS.LIFE_EXPECTANCY]: "years",
  [KEY_INDICATORS.GDP_GROWTH]: "%",
  [KEY_INDICATORS.UNEMPLOYMENT]: "%",
  [KEY_INDICATORS.CO2_EMISSIONS]: "metric tons",
  [KEY_INDICATORS.INTERNET_USERS]: "%",
  [KEY_INDICATORS.LITERACY_RATE]: "%",
  [KEY_INDICATORS.INFANT_MORTALITY]: "per 1,000",
};

// ─── Selected Countries ───────────────────────────────────────────────────────

export const FEATURED_COUNTRIES: { code: string; name: string; flag: string }[] = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
];

// ─── Regions ──────────────────────────────────────────────────────────────────

export const REGIONS: { id: string; name: string }[] = [
  { id: "EAS", name: "East Asia & Pacific" },
  { id: "ECS", name: "Europe & Central Asia" },
  { id: "LCN", name: "Latin America & Caribbean" },
  { id: "MEA", name: "Middle East & North Africa" },
  { id: "NAC", name: "North America" },
  { id: "SAS", name: "South Asia" },
  { id: "SSF", name: "Sub-Saharan Africa" },
];

// ─── Fetcher helpers ──────────────────────────────────────────────────────────

async function fetchWorldBank<T>(path: string): Promise<T[]> {
  // path may already contain a query string (e.g. "?date=2000:2023")
  const separator = path.includes("?") ? "&" : "?";
  const url = `${BASE_URL}/${path}${separator}format=json&per_page=300`;
  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (!res.ok) {
    throw new Error(`World Bank API error ${res.status}: ${res.statusText}`);
  }

  const text = await res.text();

  // Guard against XML error responses (API returns XML by default when params are wrong)
  if (text.trimStart().startsWith("<")) {
    throw new Error("World Bank API returned XML — check endpoint path and query parameters.");
  }

  const data = JSON.parse(text) as [WorldBankMeta, T[]];

  // The API returns [metadata, data]
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error("Unexpected World Bank API response format");
  }

  return data[1] ?? [];
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Fetch time-series indicator data for a specific country.
 * date range: "2000:2023"
 */
export async function fetchIndicatorByCountry(
  countryCode: string,
  indicatorId: string,
  dateRange = "2000:2023"
): Promise<IndicatorDataPoint[]> {
  const data = await fetchWorldBank<IndicatorDataPoint>(
    `country/${countryCode}/indicator/${indicatorId}?date=${dateRange}&mrv=5`
  );
  // Sort ascending by year
  return data
    .filter((d) => d.value !== null)
    .sort((a, b) => Number(a.date) - Number(b.date));
}

/**
 * Fetch latest value for multiple countries for a given indicator.
 */
export async function fetchIndicatorMultipleCountries(
  countryCodes: string[],
  indicatorId: string,
  dateRange = "2015:2023"
): Promise<IndicatorDataPoint[]> {
  const codes = countryCodes.join(";");
  const data = await fetchWorldBank<IndicatorDataPoint>(
    `country/${codes}/indicator/${indicatorId}?date=${dateRange}`
  );
  return data.filter((d) => d.value !== null);
}

/**
 * Get the most recent (non-null) value per country from a dataset.
 */
export function getLatestPerCountry(
  data: IndicatorDataPoint[]
): IndicatorDataPoint[] {
  const map = new Map<string, IndicatorDataPoint>();
  for (const point of data) {
    if (point.value === null) continue;
    const existing = map.get(point.country.id);
    if (!existing || Number(point.date) > Number(existing.date)) {
      map.set(point.country.id, point);
    }
  }
  return Array.from(map.values());
}

/**
 * Format a large number for display.
 */
export function formatIndicatorValue(
  value: number | null,
  indicatorId: string
): string {
  if (value === null) return "N/A";

  const isPercent = [
    KEY_INDICATORS.GDP_GROWTH,
    KEY_INDICATORS.UNEMPLOYMENT,
    KEY_INDICATORS.INTERNET_USERS,
    KEY_INDICATORS.LITERACY_RATE,
  ].includes(indicatorId as never);

  const isDollars = [
    KEY_INDICATORS.GDP_CURRENT_USD,
    KEY_INDICATORS.GDP_PER_CAPITA,
  ].includes(indicatorId as never);

  if (isDollars) {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
  }

  if (indicatorId === KEY_INDICATORS.POPULATION_TOTAL) {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    return value.toLocaleString();
  }

  if (isPercent) return `${value.toFixed(1)}%`;

  return value.toFixed(1);
}
