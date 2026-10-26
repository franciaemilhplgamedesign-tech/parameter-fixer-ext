# EC-FIX-IT v2.3.3 — Codeway Finrise holiday detection

- Detects ISO date schedule rows with numeric banner IDs.
- Detects bundled calendars grouped by year, using numeric month/day boundaries and literal artwork/offer values.
- All five supplied Codeway Finrise MIPs now return their 32 scheduled ranges. AppLovin iterations merge duplicate date ranges into one dropdown option. Gaps remain unscheduled.
- Parsing reads literals only and validates dates; it does not execute creative JavaScript.

Validation: all five original files, extracted calendar fixtures, leap-year/invalid/reversed/computed inputs, duplicate rows, merged dropdown, ten Orivelle and six Popsa files, and previous/next navigation.

Use Install latest update automatically in Updates.
