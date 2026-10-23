# Creative Date Preview extension

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

