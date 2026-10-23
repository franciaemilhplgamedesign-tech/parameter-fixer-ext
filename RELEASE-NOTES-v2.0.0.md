# EC-FIX-IT v2.0.0 — hosted dashboard and installed companion

## What changed

- Clicking the extension on an AppLovin, local HTML or localhost preview opens the GitHub Pages dashboard linked to that preview.
- Hosted Parameters applies date and language to the linked preview, including all AppLovin iterations.
- Hosted Checker automatically requests local-source checks on connection, displays findings and counts, and rechecks using the selected MIP/SIP size profile.
- Full holiday/range controls, Parameter Fixer, MRAID fixes/compression, screenshots and Review open in installed companion windows. Their processing and stored collection stay inside the extension.
- Hosted dashboard UI files can be updated through GitHub Pages without replacing the extension package. Checker/fixer engines, browser automation and permission changes still require an extension update.

## Install / update once to enable the dashboard

1. Download and extract EC-FIX-IT-extension-v2.0.0.zip.
2. Replace your existing unpacked extension files in the same folder and click Reload on the browser extensions page. Do not uninstall if you want to preserve your saved review collection.
3. Enable Allow access to file URLs for local HTML checks.
4. Open the creative preview and click the extension icon. It opens the dashboard and binds it to that tab.
5. Use the dashboard buttons to open the installed companion for full controls and Review. Keep the creative active in its browser window when capturing screenshots.

Dashboard: https://franciaemilhplgamedesign-tech.github.io/parameter-fixer-ext/

A direct visit without a linked session shows connection instructions. A session is restricted to its dashboard tab and preview tab and expires after 24 hours or browser-session storage is cleared. Reopen from the extension icon to reconnect. Existing active sessions do not automatically refresh when the hosted site is redeployed; reload the dashboard for the latest UI.

## Data and security

The dashboard is static and has no upload server or analytics. Parameters and redacted checker results are exchanged through fixed extension commands. Raw HTML, source snippets, screenshots, downloads and Review storage stay in the installed companion; the existing explicit ChatGPT transfer remains available there. GitHub Pages receives normal website requests, not creative file uploads. The bridge validates the exact dashboard URL, top-level sender, session, dashboard tab, linked preview and command inputs. There is no remote script execution or generic browser-API proxy.

## Limits and validation

This is a hosted dashboard with an installed companion, not a permanently update-free extension. New engines and permissions need extension updates. Hosted interface requires internet; the installed companion can still be opened directly at chrome-extension://YOUR_EXTENSION_ID/popup.html?targetTab=PREVIEW_TAB_ID if Pages is unavailable. Installed automatic local source checking remains active.

Regression tests cover the bridge trust boundaries, expired/mismatched sessions, parameter validation, tool routing, selected size profile, redacted reports and existing Checker behavior. Live installed-extension dashboard communication and screenshot/ChatGPT transfer still need user browser validation. Static Checker results are not certification.
