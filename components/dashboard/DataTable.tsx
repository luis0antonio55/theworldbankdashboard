"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { IndicatorDataPoint } from "@/lib/worldbank-api";
import {
  INDICATOR_LABELS,
  formatIndicatorValue,
  KEY_INDICATORS,
  FEATURED_COUNTRIES,
} from "@/lib/worldbank-api";

type SortField = "country" | "value" | "date";
type SortDir = "asc" | "desc";

interface DataTableProps {
  data: IndicatorDataPoint[];
  indicatorId: string;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * DataTable — sortable, accessible table listing latest indicator values
 * per country.
 */
export function DataTable({ data, indicatorId, isLoading, error }: DataTableProps) {
  const [sortField, setSortField] = useState<SortField>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const countryMeta = useMemo(
    () => new Map(FEATURED_COUNTRIES.map((c) => [c.code, c])),
    []
  );

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      let cmp = 0;
      if (sortField === "country") {
        cmp = a.country.value.localeCompare(b.country.value);
      } else if (sortField === "value") {
        cmp = (a.value ?? -Infinity) - (b.value ?? -Infinity);
      } else {
        cmp = Number(a.date) - Number(b.date);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortField, sortDir]);

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field)
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          {INDICATOR_LABELS[indicatorId] ?? indicatorId} — Data Table
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Click column headers to sort
        </p>
      </div>

      {isLoading && (
        <div
          className="flex h-40 items-center justify-center text-sm text-muted-foreground"
          aria-live="polite"
          role="status"
        >
          Loading data...
        </div>
      )}

      {error && !isLoading && (
        <div
          className="flex h-40 items-center justify-center text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label={`Data table for ${INDICATOR_LABELS[indicatorId]}`}>
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th scope="col" className="px-4 py-3 text-left">
                  <button
                    onClick={() => toggleSort("country")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                    aria-label="Sort by country"
                  >
                    Country <SortIcon field="country" />
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleSort("value")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors ml-auto"
                    aria-label="Sort by value"
                  >
                    Value <SortIcon field="value" />
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleSort("date")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors ml-auto"
                    aria-label="Sort by year"
                  >
                    Year <SortIcon field="date" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No data available for the selected filters.
                  </td>
                </tr>
              )}
              {sorted.map((row, i) => {
                const meta = countryMeta.get(row.country.id);
                return (
                  <tr
                    key={`${row.country.id}-${row.date}`}
                    className={`border-b border-border/50 transition-colors hover:bg-secondary/30 ${
                      i % 2 === 0 ? "" : "bg-secondary/10"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {meta && (
                          <span aria-hidden="true" className="text-sm">{meta.flag}</span>
                        )}
                        {row.country.value}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {formatIndicatorValue(row.value, indicatorId)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                      {row.date}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
