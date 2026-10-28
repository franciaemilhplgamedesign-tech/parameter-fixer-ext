# EC-FIX-IT v2.3.9 — CSV calendars and AppLovin frames

- Detects literal CSV holiday calendars with Year, Start Date, End Date and Promo columns, including quoted commas and escaped quotes. Dates and year consistency are validated without executing creative code.
- The supplied Oregano spinwheel calendar now yields 58 ranges, including October 26–31, 2026 for Halloween.
- AppLovin creative frames explicitly receive outer date/language values when created, refreshed or switched. Forwarding is limited to same-origin /phaser/ frames and preserves unrelated parameters; the visible preview URL still needs only one shared parameter pair.
- Detection reads all hosted iteration sources first, falls back to live frames if needed, and reports source-access failures instead of silently ignoring them. The adapter can be installed into an already-open preview by refreshing detection.

Verified the supplied local source snapshot, downloaded sources for both creatives in the provided live AppLovin link (58 ranges each), CSV validation, frame src setters/attributes, origin isolation, empty overrides, idempotence/no reload loops, source-first scan/fallback and prior Birdie/Codeway/Popsa tests. Live browser interactions with the installed extension were not exercised.

Install the update, reload the AppLovin preview once, reopen EC-FIX-IT and refresh detected holidays.
