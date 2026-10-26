# EC-FIX-IT extension

Local Chrome/Edge tools for SIP/MIP parameters, HTML fixes, source checks, compression and screenshot review. No hosted dashboard.

## Automatic Windows updates — v2.2.1

Download EC-FIX-IT-Windows-Updater.zip from the [latest release](https://github.com/franciaemilhplgamedesign-tech/parameter-fixer-ext/releases/latest). Extract it and run Install-Updater.cmd. Select the EXISTING unpacked EC-FIX-IT folder and paste its ID from your browser extensions page. Setup installs the latest release into that same folder. Click Reload once, then reopen EC-FIX-IT and confirm Windows updater connected.

After setup, startup/six-hour checks install future releases automatically when EC-FIX-IT tools are closed, then reload. The Updates panel has an opt-out checkbox and an immediate install button. No manual ZIP extraction/reinstallation is needed for later updates. Existing extension ID and Review data are preserved. Windows 10/11, .NET Framework 4.5+ and Chrome/Chromium 116+ are required. See [setup, recovery and unregister instructions](windows-updater/README.md).

New users can first Load unpacked from the extension ZIP, then set up the helper. Without the helper, replace files manually in the same folder and click Reload. Enable Allow access to file URLs for local HTML previews.

## One outer date/language pair — v2.3.0

AppLovin links now use `...Preview/?h=first.html&h2=second.html&date=2026-12-01&language=de`. The fixer embeds same-origin parent inheritance; the extension supplies the adapter early in accessible AppLovin/local frames. Cross-origin hosts must forward parameters themselves. Direct HTML and localhost retain `?date=...&language=...`. See the latest notes for scope and examples.

## Tools

- Parameters: date/language testing across AppLovin iterations, local HTML and localhost, detected holiday ranges, Previous/Next and auto-refresh.
- Parameter Fixer: supported date/language patches for current/bulk HTML.
- Checker: MRAID/source/network/WebGL/end-scene checks, selected MIP 5 MB / SIP 3.4 MB caps, proposed fixes and compression.
- Review: screenshots and original HTML, max 20 files total; optional remembered task name and additional notes, export or upload with a task-aware review prompt for manual sending. Successful transfer closes its extra popup.

Static checks are review aids, not certification. Test fixed creatives in the target container. Live ChatGPT behavior depends on its current controls and needs browser validation.

## Releases

Run scripts/build-release.ps1 on Windows to compile the helper and generate the extension ZIP, setup ZIP and SHA-256 assets. Upload to a draft GitHub release first; publish only when all assets exist. The native updater requires EC-FIX-IT-extension-vVERSION.zip plus .zip.sha256 for every future release. Checksum verification uses the trusted repository release; code-signing is not provided.

[Latest release notes](RELEASE-NOTES-v2.3.3.md)

Created By: Emil Son Francia | October 2026
