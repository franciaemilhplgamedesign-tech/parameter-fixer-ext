# EC-FIX-IT v2.3.0 — one outer preview URL parameter pair

## URL format

Use one date/language pair at the end of the preview query, before any #fragment:

- AppLovin: https://playable.applovindemo.com/Preview/?h=first.html&n=First&h2=second.html&n2=Second&date=2026-12-01&language=de
- Localhost: http://localhost:5173/preview?date=2026-12-01&language=de
- Direct HTML: https://your-host.example/creative.html?date=2026-12-01&language=de
- Local file: file:///C:/Creatives/creative.html?date=2026-12-01&language=de

If the URL already has a query, append &date=...&language=... rather than a second ?. Hash fragments remain at the end. Names and other preview parameters are preserved.

## Changes

- Parameters now writes a single outer AppLovin date/language pair instead of repeating it inside h, h2, h3 creative filenames. Old nested overrides for the explicitly controlled parameters are removed.
- The popup reads outer values first, with old nested links retained as an input fallback. Hosted extensionless routes are supported for parameter navigation.
- Parameter Fixer exports include an early same-origin parent-query inheritance helper. Each enabled parameter resolves independently from the creative through accessible ancestors; the outermost explicit value wins. For duplicate keys at a given level the last value wins. Native readers continue to use their existing location.search parsing after the frame's own query is synchronized, without a reload.
- The extension installs that adapter at document_start in accessible AppLovin/local preview frames, before creative scripts. No new host permission is requested.
- Supported SIP/MIP date helpers and language date formatters read inherited values even when their own frame has unrelated query parameters. Evolv's gameplay/end-card flow was tested with a single outer date. Compressed payloads and holiday schedules are preserved.
- Scope helper upgrades stay before the native/date/language readers; repeated fixing does not duplicate it. Language parameters still require existing translations or supported locale formatters.

## Hosting boundary

Fixed HTML can inherit a wrapper's query only where browser origin/sandbox rules allow access. A different-origin or origin-isolated host must forward date/language into the creative URL or provide an explicit integration; the HTML cannot read every arbitrary hosting page's URL. Direct HTML/localhost query support remains unchanged. The adapter does not bypass cross-origin restrictions or modify browser-wide URLSearchParams/Date implementations.

## Updates / validation

The Windows updater can install this release automatically after tools close, or use Install latest update automatically. Manual fallback: replace extension files in the same folder and Reload. Re-fix exported HTML to give it standalone outer-URL inheritance without the extension.

Tests cover outer AppLovin query placement and nested cleanup, old link migration, unrelated parameters/fragments, localhost/hosted routes, parent/native/srcdoc helper inheritance, explicit empty reset, duplicate keys, cross-origin isolation, idempotence/script ordering, language formatting and real Evolv date handling. Live AppLovin/container behavior should still be checked in the installed browser.
