# EC-FIX-IT extension — v1.9.7

EC-FIX-IT v1.9.7 is ready for Chrome and Microsoft Edge. This release brings parameter testing, HTML fixes, source checks and review collection into one extension.

## Important functions

- **Parameter testing:** Apply a date and language across all AppLovin preview iterations, local HTML files or localhost previews. Detected holiday/promo ranges populate automatically, duplicates merge, and Previous/Next helps test ranges. Optional auto-refresh applies changes as you make them.
- **Parameter Fixer:** Download a patched copy of the current HTML or process multiple files in bulk. Supports SIPs and MIPs, including supported embedded end-card structures. Language patches localize supported date formatters; they do not translate hardcoded copy.
- **Automatic Checker:** Check local HTML and localhost previews for MRAID bridge/readiness, clickthrough, media/viewability, asset packaging, networking and WebGL fallback signals. Findings include source evidence when available.
- **Creative size limits:** MIPs use 5,000,000 bytes; SIPs use 3,400,000 bytes. Changing creative type updates the size result and issue count, including after Recheck source.
- **MIP end-scene checks:** Flag detected raw HTML or external/local end-scene media that should be Base64 packaged under the project rule.
- **Fix downloads:** Generate proposed MRAID fixes, add an HTML canvas WebGL failure/context-loss fallback, or optionally block remote networking APIs. Network blocking is off by default because it can affect gameplay.
- **Compression:** Minify HTML comments and inline JavaScript, with optional embedded-image optimization. Reports the final size against the selected creative limit. Video/audio/font payloads are not transcoded.
- **Screenshots and review:** Capture the visible preview at native, preset or custom output sizes. Collect screenshots with the original local HTML, select/delete items, export a review package, or initiate upload and send to the configured ecomm checker with “check for grammar and filename”.
- **Update checks:** Check GitHub for newer versions. Unpacked extension updates still require replacing files and clicking Reload.

## Installation / update

Download the EC-FIX-IT ZIP from the GitHub release and extract it to a permanent folder. In Chrome or Edge extensions, enable Developer mode and Load unpacked using the folder containing manifest.json. To update an existing installation, replace its files, click Reload, and close/reopen any detached extension window. Enable Allow access to file URLs for local HTML inspection.

## Validation and limits

Automated regression checks cover parameter handling, detectors, source checks, fix engines, compression, review logic and creative-type switching. Static checks are review aids, not MRAID certification. Test downloaded creatives in the target ad container. Complex encoded/generated content, worker networking and OffscreenCanvas fallback may need source changes. ChatGPT upload/send depends on its current page controls, sign-in and permissions; end-to-end live submission has not been verified.

## Slack post — copy below

*EC-FIX-IT extension v1.9.7 is available for Chrome / Edge.*

• Test date and language parameters across AppLovin iterations, local HTML and localhost previews.
• Automatically detect holiday/promo date ranges and step through them.
• Fix supported date/language handling in individual or bulk SIP/MIP HTML files.
• Automatically check local creatives for MRAID requirements, asset packaging, network APIs, WebGL fallback and MIP end-scene packaging.
• Enforce the selected size limit: *MIP 5 MB / SIP 3.4 MB*, with compression and optional image optimization.
• Download proposed MRAID/WebGL fixes and optionally block remote networking.
• Capture screenshots and collect them with the original HTML for review/export. Ecomm checker transfer is available but still needs live validation.

Install/update: download the release ZIP, extract it, then Load unpacked or replace your existing extension files and click Reload. Enable file-URL access for local HTML checks. Test fixed creatives in the target ad container before delivery.

Release: https://github.com/franciaemilhplgamedesign-tech/parameter-fixer-ext/releases/tag/v1.9.7

Validation note: the historical Woofz fixture test could not rerun because its original local HTML file is unavailable. Current checker, size-selection UI, compression and safeguard regression tests passed.

