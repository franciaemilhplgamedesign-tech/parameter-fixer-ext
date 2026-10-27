# EC-FIX-IT v2.3.8 — recurring Birdie promo detection

- Detects literal month/day promo ranges such as startDate: "11-01", endDate: "11-26", alongside full ISO date schedules.
- Recurring ranges are shown for the preview year and following year; fixed ISO schedules keep their declared dates. Changing the preview year refreshes the dropdown independently of auto-refresh mode.
- Keeps recurring-year context when inspecting embedded documents and AppLovin iterations. Duplicate ranges remain merged.
- Validates dates, leap days and reversed bounds. Stale scans cannot replace the latest preview-year results.

All nine supplied Birdie files were checked. Files 07–11 contain three full-date periods; files 12–15 contain the same three annual periods: November 1–26, November 27–30, December 1–31. The latter now produce six dropdown dates across the preview year and next year.

Tests cover all nine calendar fixtures, changed preview years, fixed-date preservation, invalid/mixed/reversed dates, leap day, duplicate merging, stale scans, and existing Codeway/Orivelle/Popsa schedules. Source creative files were not modified.

Use Install latest update automatically, reopen the tools and refresh detected holidays.
