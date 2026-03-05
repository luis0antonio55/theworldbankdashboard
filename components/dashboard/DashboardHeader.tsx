"use client";

import { Globe2, TrendingUp } from "lucide-react";

/**
 * DashboardHeader — top navigation bar for the World Bank dashboard.
 */
export function DashboardHeader() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md"
      role="banner"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md bg-primary"
              aria-hidden="true"
            >
              <Globe2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none text-foreground">
                World Bank
              </h1>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">
                Data Dashboard
              </p>
            </div>
          </div>

          {/* Center tagline — hidden on small screens */}
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Development Indicators · Powered by World Bank Open Data API</span>
          </div>

          {/* Right badge */}
          <div
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
            aria-label="API status"
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"
              aria-hidden="true"
            />
            Live
          </div>
        </div>
      </div>
    </header>
  );
}
