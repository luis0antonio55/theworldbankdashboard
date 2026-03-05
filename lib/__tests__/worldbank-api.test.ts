
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { fetchIndicatorByCountry, fetchIndicatorMultipleCountries, KEY_INDICATORS } from '../worldbank-api';


global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve(JSON.stringify([
      { page: 1, pages: 1, per_page: 50, total: 1 },
      [{ indicator: { id: 'SP.POP.TOTL', value: 'Population, total' }, country: { id: 'US', value: 'United States' }, countryiso3code: 'USA', date: '2022', value: 333287557, unit: '', obs_status: '', decimal: 0 }]
    ])),
  } as Response)
) as any;

describe('World Bank API', () => {
  beforeEach(() => {
    (global.fetch as any).mockClear();
  });

  it('should fetch indicator by country', async () => {
    const data = await fetchIndicatorByCountry('US', KEY_INDICATORS.POPULATION_TOTAL);
    expect(data).toBeInstanceOf(Array);
    expect(data.length).toBeGreaterThan(0);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should fetch indicator for multiple countries', async () => {
    const data = await fetchIndicatorMultipleCountries(['US', 'CN'], KEY_INDICATORS.GDP_CURRENT_USD);
    expect(data).toBeInstanceOf(Array);
    expect(data.length).toBeGreaterThan(0);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
