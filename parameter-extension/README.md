# EC-FIX-IT extension

## Version 1.1 additions

- Localhost roots and extensionless routes are supported: `http://localhost:5173/`, `http://127.0.0.1:3000/preview`, and IPv6 loopback.
- Enter an optional language code, such as `en`, to apply `?language=en` alongside the preview date across all AppLovin iterations or a local preview. Blank removes the language override; Use real date preserves the language selection.
- Click **Check holidays & language support** to inspect accessible loaded frames for literal holiday ranges and a language-parameter reader. This is a static check, not proof that translations exist. Cross-origin, compressed and not-yet-loaded end cards may be unavailable. Open an iteration/end card first, or use the fixer upload checker for source HTML.
- File-content inspection requires **Allow access to file URLs** in extension settings. Parameter-only navigation does not read file contents.
- Version 1.1 adds the `scripting` permission for this user-triggered inspection.
- To update, replace your unpacked extension folder with this version and click **Reload** on the browser's extensions page.

For Chrome and Microsoft Edge. Set one date across all `h`, `h2`, `h3`, … HTML entries in an AppLovin Preview URL, or on a direct local/hosted HTML file.

## Install

1. Extract the ZIP to a permanent folder.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extracted folder containing `manifest.json`.
5. Pin **Creative Date Preview** from the extensions menu.

## Use

1. Open your AppLovin preview or local HTML file in the browser.
2. Open the extension and select a date.
3. Click **Apply to current preview**.

Every AppLovin iteration receives the selected date, including iterations you switch to later. This reloads the preview and restarts gameplay. The extension remembers your last selected date; apply it again when opening another preview URL. It does not automatically modify unrelated tabs.

Click **Use real date** to remove `date` from all iteration references or the direct HTML URL.

## Local previews

Open the actual `.html` file in Chrome/Edge, then apply the date. The extension navigates the current tab to the same file with a query parameter. It does not read or modify file contents or inject scripts, so no file-content access is requested.

## Requirements and limits

- Creatives must already implement `?date=YYYY-MM-DD`, either natively or using the SIP & MIP fixer. Adding a URL parameter alone cannot change a creative that ignores it.
- AppLovin iteration references are encoded safely as outer query values, preserving filenames with spaces, inner query parameters, hashes, and iteration labels.
- Real-date mode removes the preview override; it does not restore the previous per-iteration preview dates.
- Applying a date changes the preview URL only. Uploaded HTML files remain unchanged.
- Permissions: `activeTab` reads the tab you explicitly invoke the extension on; `storage` saves your last selected date. No server, analytics, or external dependencies.
- Automated URL tests cover the supplied three-iteration pattern and local HTML. Installation and interactive behavior require a manual check in your browser.

## Version 1.2
Holiday/promo ranges populate a dropdown automatically when the popup opens. Select a range and Start date or End date, then Apply. You may still enter any custom date. Refresh detected holidays after opening a new end card. The AppLovin host permission allows reading same-origin iteration HTML for automatic detection, including unloaded iterations. Localhost uses the active tab. Encoded/compressed ranges may remain undetected; no-range results do not prove absence. The fixer also detects ranges automatically after selecting files.


## Version 1.4
Auto-refresh on change is optional and remembered. When checked, Apply is hidden and changing the date, holiday range, preview boundary, or language automatically updates the preview after a short debounce. Selecting Custom waits for the custom code field to be committed. Opening the popup or enabling the checkbox does not itself reload the page. Disable auto-refresh to use Apply manually. The language dropdown includes common codes plus Other/custom. br is passed literally for creatives using that code; pt-BR is also available for Brazilian Portuguese. Available translations depend on the creative.


## Version 1.5
Previous and Next buttons below the holiday dropdown step through detected date ranges in date order. They respect Start/End selection and auto-refresh mode, stop at the first/last range, and restore the selected range from the current preview date after a reload.


## Version 1.6 — detached checker and screenshots
Click Detach to browser window to keep the checker open beside the preview. The window stays linked to the preview tab from which it was opened, including during date/language reloads. To target another preview, open the extension from that tab.

Screenshot steps: choose the preview device and orientation, wait for the SIP to display, choose Visible creative/SIP or Full visible page, choose an output size, and click Take screenshot. Review the thumbnail and click Download PNG. Native output uses captured device pixels (including high DPI); preset/custom sizes scale proportionally with black padding rather than changing the creative layout. Capture records only visible content at the current animation frame. Off-screen previews must be fitted inside the browser viewport first. The target preview must remain the active tab of its browser window. Local file capture requires Allow access to file URLs. No screenshot is uploaded. If tab access is lost after navigation, reopen from the preview's extension toolbar icon.

Automated checks cover capture geometry, high DPI, proportional output, size limits, previous/next, and auto-refresh. Installed-extension capture and detached-window interaction still require manual browser testing.


## Version 1.6.1 — Foodvisor image promos
Fixed automatic holiday detection for large image-backed promo entries. Inspection ignores embedded data-URL payloads and no longer limits range objects to 1800 characters. Both supplied Foodvisor variants expose 28 ranges; duplicate ranges across iterations merge. Date support already exists in these files; language support does not. Overlapping literal date ranges are reported as warnings. Both files include November 30, 2027 in two ranges; their own selector displays the first matching entry.


## Version 1.6.2
Removed the frame diagnostics panel and capture-area selector. Screenshots always capture the full visible browser page. PNG output sizing and the holiday dropdown remain available.


## Version 1.6.3
Removed Preview point. Preview date is the sole date control. Selecting a range (including Previous/Next) keeps that date when it falls within the range; otherwise it selects the first date. Manually changing Preview date updates the matching range selection. Dates outside the ranges remain allowed for fallback testing. Auto-refresh applies actual date changes.


## Version 1.6.4 — computed Popsa promo dates
Automatic dropdown detection now recognizes constrained literal date-comparison branches in addition to range tables: numeric year/month/day conditions and ISO date-string comparisons with inclusive/exclusive bounds. No uploaded JavaScript is executed during detection. The six supplied Popsa creatives yield Nov 30, Dec 1–21, and Dec 22, 2026. Their Black Friday fallback is unbounded and is not presented as a fabricated finite range. More complex computed schedules may still require additional detectors. Tests compare all 365 days of 2026 against each of the six actual creative selectors, and retain Foodvisor image-range detection.


## Version 1.7 — GitHub update checks
The extension checks main/parameter-extension/manifest.json in franciaemilhplgamedesign-tech/parameter-fixer-ext at install, browser startup, and every six hours. A higher manifest version sets a NEW toolbar badge. Check GitHub for updates runs a manual check; Download latest files opens the repository ZIP. Extract it, copy the contents of parameter-extension over the installed unpacked folder, then click Reload. Only version metadata is fetched; remote code is never executed. This is automatic update detection, not automatic code installation.

Maintainers: commit the latest files inside parameter-extension/ and increase manifest.json version for every release. Changes without a higher version do not trigger the update badge. Chrome/Edge store publication is needed for normal end-user automatic installation. If the repository becomes private, unauthenticated update checks will fail; no GitHub tokens are embedded.


## Version 1.7.1 — update-check connection fix
Manual update checks now run directly in the checker window, so they work without a background message receiver. Opening the checker also retries stale or failed checks. Cached update availability is compared with the installed version. After replacing extension files, click Reload on chrome://extensions or edge://extensions and close/reopen any previously detached checker windows; an old window can retain an invalid extension context.


## Local test v1.8.0 — review gallery (not published)
Screenshots are saved in IndexedDB and survive closing the popup or detached checker. The collection offers individual deletion, checkbox selection, Select all/none, Delete selected and Delete all. Add original HTML files with the file picker to retain their original filenames/content; the extension does not silently download or reconstruct HTML. Captures include source URL, preview date, language, dimensions and capture time in capture-details.json. Only selected items are exported.

Download selected review package creates a binary-safe ZIP with HTML, PNG, capture metadata and review-prompt.txt containing exactly: check for grammar and filename. Prepare & open ecomm checker also opens the requested ChatGPT conversation and copies that prompt to the clipboard when available. Extract the ZIP, attach HTML and PNG files in ChatGPT, paste the prompt, and send. No automatic attachment upload or message submission is performed. Clipboard access is used only for copying the review prompt during export. The gallery is local to this extension installation and is lost if the extension is removed; export before uninstalling. Storage quota errors are reported. Large batches may be limited by browser memory during export.


## Local test v1.8.1 — collect original local HTML automatically
Removed the HTML file chooser. The checker reads the original HTML from the linked file:// preview when the checker connects and when a screenshot is captured. Query parameters and fragments are removed only from the file-read URL; the original basename and file bytes are retained. Repeated previews of the same file at different dates/languages update one stored HTML entry, preserving its selection. Enable Allow access to file URLs on the extension details page, then Reload and reopen detached windows. This version adds file:///* host access for the requested source collection. It does not reconstruct HTML from the live DOM, and hosted previews are not treated as local files. Everything remains local until you export and manually attach the package in ChatGPT. GitHub has not been updated.


## Local test v1.8.2 — automatic checker upload and send
Upload & send to ecomm checker queues selected HTML and PNG files locally, opens the requested ChatGPT conversation, attaches them through the page file input and submits exactly: check for grammar and filename. The background worker owns this job so the toolbar popup may close. Status is stored and shown when the checker window reopens. Adds chatgpt.com host access; use your signed-in browser session. No ChatGPT credentials are stored. The action stops on existing drafts, missing controls or unverifiable filenames and will not deliberately send a partial review. If an upload/send error occurs, inspect the ChatGPT composer before retrying; staged attachments may remain. Selected gallery files remain available after sending. Failed job payloads are deleted; nothing is automatically retried. The extension relies on ChatGPT UI controls, which may change. Automated checks validate job preparation and guards; actual browser attachment upload and submission have not been verified in the user's session. Local testing only; GitHub is unchanged.


## Local test v1.8.3 — visible durable transfer runner
Replaces the background-only send job with a dedicated Ecomm review transfer window. Starting a job now requires acknowledgement that the runner window opened; the UI no longer overwrites progress or failures with Review queued. The runner keeps attachment work alive when a toolbar popup closes and exposes loading/upload/submission progress, stopped states and a Show checker tab button. Keep the transfer window and checker tab open. Submission errors are returned explicitly from the injected page routine. A four-minute watchdog reports unknown status rather than automatically retrying. After any timeout, inspect the ChatGPT conversation before retrying. Automated handoff and reporting checks passed; actual ChatGPT UI upload/send remains unverified. This build is local only; GitHub is unchanged.


## Local test v1.8.4 — composer compatibility and collection layout
Expands visible ChatGPT composer detection, reuses the existing requested checker conversation tab, distinguishes missing composer from file-input failures, and supports a clipboard file-paste fallback when a compatible input is absent. Image upload verification can use newly loaded thumbnails because ChatGPT may hide image filenames. HTML filenames must still be verified. Timeout errors now name the missing control and page title/path, instead of incorrectly assuming the user is logged out. The signed-in browser page was not available to inspect from this session; file-input and paste paths were verified against DOM fixtures, not the live ChatGPT UI.

Collection actions are accessible icon buttons with tooltips. Screenshots appear in a two-column thumbnail gallery without visible filenames. HTML files appear as themed file cards with a code icon, filename and HTML type. Per-item selection and deletion remain available. Existing saved collection data is preserved. No GitHub update was performed.


## Local test v1.8.5 — screenshot viewer and light/dark themes
Click a gallery thumbnail to view its full saved image inside the extension. The viewer uses a dark translucent blurred backdrop in both themes. Close with the X button, click outside the image panel, or press Escape. Closing restores thumbnail focus and releases the temporary image URL. Images stay contained without stretching.

Adds saved light/dark modes inspired by the reference: warm white surfaces and muted gold in light mode, charcoal panels and yellow-gold accents in dark mode. The toggle also appears in the transfer window; theme changes synchronize between extension windows. On first use, the extension follows the browser system color preference. Layout and workflow are preserved. Theme/viewer DOM tests passed; visual appearance should be checked in the installed browser. GitHub remains unchanged.


## Local test v1.8.6 — slim scrollbars and toolbar icons
Adds slim theme-aware scrollbars: warm gray in light mode and muted gold/olive on charcoal in dark mode. Detach now appears as an icon beside the sun/moon theme toggle in the top toolbar. Both controls retain accessible labels and hover tooltips. Detached windows continue to hide Detach. No workflow changes and no GitHub update.


## Local test v1.8.7 — dark background refinement
Dark mode now uses a neutral near-black canvas with a faint warm top glow and charcoal surfaces to match the latest reference. Light mode and functionality are unchanged. Local test only; no GitHub update.


## Local test v1.9.0 — EC checker tools and automatic MRAID inspection
Three tabs: Parameters (default), MRAID with an error/warning count, and Date Fixer. The EC logo is used in the header and browser extension icons. Theme, screenshot collection, image viewer, and local HTML collection are retained.

Local HTML files and http/https localhost or 127.0.0.1 pages automatically trigger read-only MRAID source checks at document idle/pageshow. Enable Allow access to file URLs and allow extension access to localhost; Reload the extension AND reload existing preview tabs after installing so the new content observer is injected. Background reports are cached per browser tab in session storage and the MRAID notification count includes both errors and warnings. Opening the extension also requests a fresh check. Hosted remote previews do not receive automatic source access from this feature.

The improved checker checks bridge declarations, state/ready signals, direct/aliased clickthrough, browser fallback and redirects, media viewability, click-target aliases, touch duplication, asset packaging, network API calls, a 5 MB project size profile, and embedded-document coverage. It distinguishes errors, warnings and pass signals and shows source evidence/lines. These are static heuristics, not MRAID or ad-network certification. Aliased/minified/dynamically generated code may need manual review; encoded end cards are flagged as coverage gaps. A source helper or a pass signal does not prove the initialization or click path is correct.

The Download proposed MRAID-fixed HTML action uses the engine adapted from https://hpl-mip.github.io/mraid-fixer/index.html (retrieved 2026-10-23). It only creates a downloaded copy on an explicit click; it never rewrites the source being viewed. The reference engine checks and patches its original rule set; proposed output must be reviewed and tested before upload. Downloads are blocked if its external/unbundled asset blockers or the 5 MB profile remain. The date fixer supports the current local preview or bulk HTML files, with the existing date patch engine and native-reader preservation.

Automated checks passed for source-read triggering/caching, clean and failing fixtures, issue counts, reference patch engine, source preservation, tab navigation, existing gallery/themes and date behavior. Browser extension installation and real MRAID container QA still require testing. This is a local test build only; GitHub has not been updated.


## Local test v1.9.1 — EC-FIX-IT branding and tool organization
Renamed the extension and header to EC-FIX-IT. Transparent vector header logos replace the white-backed image; the dark variant uses white EC-FIX-IT text. Tabs are ordered Parameters, Parameter Fixer, MRAID, Review. Screenshot controls and the saved collection are in Review. Updates is a common bottom section outside every tab panel and is visible regardless of the selected tool.

Parameter Fixer has independent date/language options for current-preview and bulk exports. Native language readers are preserved. For supported SIP/date formatters, the language patch adds a validated ?language= locale helper, with br mapped to pt-BR for formatting. Existing static copy is not translated; missing translation dictionaries cannot be generated by the fixer. Embedded MIP language patching is explicitly reported unsupported rather than inserting an unsafe helper into encoded documents. The date engine remains available for supported MIP structures.

Automated checks passed for language formatting/native preservation/fallback, tab order and Review placement, default tab navigation, common Updates markup, MRAID checks, image gallery/viewer, themes and local HTML collection. Header logo assets are code-native SVGs. GitHub remains unchanged.


## Local test v1.9.2 — responsive detached window and supplied white-text icon
Detached checker and transfer windows use a full-width canvas and centered fluid content shell capped at 808px including padding. Narrow windows shrink responsively; wider windows increase spacing and gallery columns. The toolbar popup remains compact. The image viewer stays outside the centered shell so it can use the full window.

Uses the exact supplied ec-logo-w.png for manifest icons, browser action icons and extension-page favicons. Browser/Windows taskbar grouping may still display the browser's icon; an extension cannot force the OS to use a separate application identity. Theme-aware transparent header logos are preserved. No GitHub update.


## Local test v1.9.3 — Checker naming, MIP end-scene packaging and copyright
Renamed the MRAID tab and panel to Checker. Adds © Created By: Emil Son Francia | October 2026 below the shared Updates section and in the transfer window.

Adds a MIP end-scene Base64 project-policy check. It applies to identified end-scene sources, not a plain SIP or a gameplay-only MIP. Supported evidence includes React End Scene srcDoc references, end-scene DOM attributes/assignments, configured end-scene sources and end video portrait/landscape source pairs. It resolves supported direct string variables. Raw HTML is an error even when its nested images/media are Base64. Valid Base64 media or HTML data URLs can pass; remote/local/unencoded references and malformed data payloads fail. Dynamic decoder/blob/asset-indirection paths that cannot be resolved are warned, never silently approved. Embedded document coverage remains a separate warning because Base64 packaging alone does not certify decoded contents. The explicit MRAID fix download is blocked when this check finds noncompliant raw end-scene packaging; it does not silently re-encode end scenes. Badges include the new errors/warnings. Static heuristics may require manual review for unfamiliar compiler structures. No GitHub update.


## Local test v1.9.4 — MIP/SIP limits and browser-local compressor
Checker now uses decimal limits: MIP 5,000,000 bytes, SIP 3,400,000 bytes. Filenames are the primary type signal; known interactive/end-scene structures can identify MIPs. An unresolved type raises a warning and uses the conservative SIP cap. Select Auto/MIP/SIP in Checker to correct ambiguity; the selection is saved per source URL and used by future automatic checks. The explicit MRAID-fixed download uses the same selected limit.

Compressor operates on the current local/localhost HTML and downloads a copy, never overwriting source. It bundles html-minifier-terser 7.2.0 locally with its license notices. It removes ordinary HTML comments and minifies inline JavaScript with variable mangling and logic compression disabled; rendered HTML whitespace and CSS remain unchanged. Embedded image optimization is opt-in and lossy: converts supported static images to WebP at selected quality, optionally reduces dimensions, and only replaces a URL when its encoded length shrinks. Duplicate image URLs are processed once. GIF and recognized animated WebP/APNG are skipped. Video/audio/font payloads and encoded end scenes are not transcoded. The resulting HTML is checked again, with original/output byte counts, savings and remaining findings. An over-limit download is explicitly labeled still over limit, never described as compliant. Files dominated by MP4 payloads may require source-video re-encoding in an authoring tool. Test playback, layout, clickthrough, date/language and WebView image support before uploading.

Tests passed at exact limit boundaries, manual/unknown type selection, CSP-safe library execution, JavaScript/date behavior, public names, Base64/video preservation, image replacement/animation safeguards and existing Checker tests. Smoke tests minified the earlier Noom, Herbodhi and Evolv exports and verified output script syntax. Runtime ad-container behavior still needs browser testing. Local test only; GitHub is unchanged.


### Local test 1.9.5
- Checker reports WebSocket and other networking API presence, with errors for detected literal remote endpoints.
- WebGL checks cover missing context-loss/visible fallback signals. Fix downloads can add an HTML canvas failure/loss fallback.
- Optional remote-network blocker covers fetch, XMLHttpRequest, WebSocket, EventSource and sendBeacon. Disabled by default because it may affect gameplay. It does not bundle remote assets or cover worker networking.
- Safeguards-only download preserves other source behavior and reports remaining issues; it is not certification. Test in the target container. OffscreenCanvas/worker rendering needs source handling.


### Local test 1.9.6
Creative-type changes queue a fresh check after any running automatic check. Stale results cannot reset the pending selection. MIP uses 5,000,000 bytes; SIP uses 3,400,000 bytes.


### Local test 1.9.7
The displayed size card and issue counts recalculate from selected type even for older cached reports. Manual Recheck explicitly passes the dropdown selection. Added UI regression for the legacy fixed 5 MB card, 4,440,822-byte SIP error, and switching back to MIP.


### Version 2.1.1
Hosted dashboard/container removed. The complete UI runs in the local extension popup. Review has a combined 20-file HTML/image limit with atomic checks and export/send guards. Orivelle positional schedules and original source fallback are included. ZIP update downloads still require installation-folder replacement and Reload.

### Version 2.1.2
Review transfer prepares attachments and the prompt for manual sending. Successful transfer closes its extra popup; errors stay open. Upload readiness ignores unrelated composer busy indicators. No automatic Send click.

### Version 2.2.0 — automatic Windows updates
A one-time native helper setup binds your existing folder and extension ID. Future startup/six-hour updates replace verified release files with backups/rollback and reload after tools close. Install latest update automatically is available in Updates; ZIP download remains a manual fallback. See the Windows updater README and release notes for setup, integrity checks, requirements and unregistering.
