# EC-FIX-IT v2.2.1 — automatic Windows updates

## One-time setup

Download EC-FIX-IT-Windows-Updater.zip and extract it. Copy EC-FIX-IT's ID from chrome://extensions or edge://extensions with Developer mode enabled. Run Install-Updater.cmd, choose the EXISTING unpacked extension folder containing manifest.json, and paste its ID.

The installer registers a per-user native helper, downloads/verifies the latest release and replaces files in that existing folder. Click Reload on the browser extensions page ONCE after setup, then reopen EC-FIX-IT and confirm Windows updater connected in Updates. Do not uninstall or change folders; your extension ID and Review storage stay intact. There is no need to manually extract the new extension ZIP before this bootstrap step.

## Future updates

- Automatic installation is enabled by default, with a checkbox to turn it off.
- Startup and six-hour checks detect updates. Installation waits while extension popup/tool/transfer pages are open, retries after they close, and reloads after successful replacement.
- Install latest update automatically applies an available published release immediately without manual extraction/reinstallation. Finish current work before clicking it.
- The manual ZIP download remains a fallback if the helper is unavailable.

## Validation and recovery

The compiled Windows helper accepts only status/update from its configured extension ID. The installation folder is bound by a marker; request messages cannot specify arbitrary paths, URLs or commands. Downloads are restricted to GitHub and its asset hosts, using the fixed repository's latest published release. The extension ZIP/version/required files, archive limits, safe paths, identity key and SHA-256 checksum are verified before writes.

Backups and a restore plan are kept under %LOCALAPPDATA%\EC-FIX-IT-Updater\backups. Files are replaced atomically, manifest last; write failures trigger rollback, and interrupted transactions are recovered on the next helper call. Only previously managed obsolete files are removed; unknown files and browser-owned Review data are preserved. Incomplete rollback is reported with the backup path. SHA-256 here is an integrity check against the repository release, not an independent code signature.

## Requirements / scope

Windows 10/11, .NET Framework 4.5+, Chrome/Chromium 116+ and a regular user-writable local folder. The helper registers only for the current Windows user under Chrome/Edge NativeMessagingHosts; it does not require admin access for such an installation. One folder/extension ID is supported per Windows user. The helper is separate from extension ZIPs and is not automatically replaced by them. Unregister-Updater.ps1 removes the matching registrations without deleting extension or Review data.

All existing local Parameters, Fixer, Checker, screenshots and Review functions remain, including the combined 20-file cap and manual-send ecomm draft transfer.

Tests cover real native EXE framing/origin/identity, archive/checksum validation, rollback on a forced write failure, successful replacements, managed cleanup and unknown-file preservation, plus extension-side idle deferral, opt-out, concurrency, error handling and reload decisions. Registration/reload in the user's installed browser still requires the one-time setup and local verification.

This release includes helper 1.0.1, which accepts Windows and standard ZIP separators while preserving traversal/duplicate checks. The initial 2.2.0 package was held as a draft after the live packaging test found a separator mismatch.
