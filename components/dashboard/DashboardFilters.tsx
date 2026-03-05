"use client";

import {
  FEATURED_COUNTRIES,
  KEY_INDICATORS,
  INDICATOR_LABELS,
} from "@/lib/worldbank-api";
import { cn } from "@/lib/utils";

export interface DashboardFiltersProps {
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  selectedIndicator: string;
  onIndicatorChange: (indicator: string) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  compareCountries: string[];
  onCompareCountriesChange: (countries: string[]) => void;
}

const YEAR_OPTIONS = Array.from({ length: 24 }, (_, i) => 2023 - i);

const AVAILABLE_INDICATORS = [
  KEY_INDICATORS.GDP_PER_CAPITA,
  KEY_INDICATORS.GDP_CURRENT_USD,
  KEY_INDICATORS.GDP_GROWTH,
  KEY_INDICATORS.POPULATION_TOTAL,
  KEY_INDICATORS.LIFE_EXPECTANCY,
  KEY_INDICATORS.UNEMPLOYMENT,
  KEY_INDICATORS.CO2_EMISSIONS,
  KEY_INDICATORS.INTERNET_USERS,
  KEY_INDICATORS.LITERACY_RATE,
  KEY_INDICATORS.INFANT_MORTALITY,
];

/**
 * DashboardFilters — sidebar control panel for all dashboard interactions.
 */
export function DashboardFilters({
  selectedCountry,
  onCountryChange,
  selectedIndicator,
  onIndicatorChange,
  selectedYear,
  onYearChange,
  compareCountries,
  onCompareCountriesChange,
}: DashboardFiltersProps) {
  function toggleCompareCountry(code: string) {
    if (compareCountries.includes(code)) {
      onCompareCountriesChange(compareCountries.filter((c) => c !== code));
    } else if (compareCountries.length < 5) {
      onCompareCountriesChange([...compareCountries, code]);
    }
  }

  return (
    <aside
      className="flex flex-col gap-6"
      aria-label="Dashboard filters"
      role="complementary"
    >
      {/* ── Primary Country ──────────────────────────────────── */}
      <section aria-labelledby="country-filter-heading">
        <h2
          id="country-filter-heading"
          className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Primary Country
        </h2>
        <div className="flex flex-col gap-1" role="radiogroup" aria-label="Select primary country">
          {FEATURED_COUNTRIES.map((c) => (
            <button
              key={c.code}
              role="radio"
              aria-checked={selectedCountry === c.code}
              onClick={() => onCountryChange(c.code)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors text-left",
                selectedCountry === c.code
                  ? "bg-primary/20 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <span aria-hidden="true" className="text-base">{c.flag}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Indicator ────────────────────────────────────────── */}
      <section aria-labelledby="indicator-filter-heading">
        <h2
          id="indicator-filter-heading"
          className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Indicator
        </h2>
        <div className="flex flex-col gap-1" role="radiogroup" aria-label="Select indicator">
          {AVAILABLE_INDICATORS.map((id) => (
            <button
              key={id}
              role="radio"
              aria-checked={selectedIndicator === id}
              onClick={() => onIndicatorChange(id)}
              className={cn(
                "rounded-md px-3 py-2 text-xs text-left transition-colors leading-snug",
                selectedIndicator === id
                  ? "bg-accent/20 text-accent font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {INDICATOR_LABELS[id]}
            </button>
          ))}
        </div>
      </section>

    

      {/* ── Compare Countries ────────────────────────────────── */}
      <section aria-labelledby="compare-filter-heading">
        <h2
          id="compare-filter-heading"
          className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Compare Countries
          <span className="ml-1 text-muted-foreground font-normal normal-case">
            (up to 5)
          </span>
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {FEATURED_COUNTRIES.map((c) => {
            const isActive = compareCountries.includes(c.code);
            return (
              <button
                key={c.code}
                onClick={() => toggleCompareCountry(c.code)}
                aria-pressed={isActive}
                title={c.name}
                className={cn(
                  "rounded border px-2 py-1 text-xs transition-colors",
                  isActive
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                <span aria-hidden="true">{c.flag}</span>{" "}
                <span className="sr-only">{c.name}</span>
                <span aria-hidden="true">{c.code}</span>
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
