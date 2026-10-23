# EC-FIX-IT Windows updater — one-time setup

This helper updates your existing unpacked extension folder. It does not install a second extension, change the extension ID, move browser profiles or delete Review data.

## Set up once

1. Extract this ZIP to a regular local folder.
2. Open chrome://extensions or edge://extensions, enable Developer mode and copy EC-FIX-IT's 32-letter extension ID. Keep the extension installed.
3. Double-click Install-Updater.cmd. Choose the EXISTING unpacked EC-FIX-IT folder containing manifest.json, then paste the ID when asked. The installer copies the helper into %LOCALAPPDATA%\EC-FIX-IT-Updater and registers it for your Windows user in Chrome and Edge. No administrator account is required for a user-writable extension folder.
4. Setup downloads the latest release into that same extension folder automatically. Click Reload on the browser extensions page ONCE after setup and reopen EC-FIX-IT. This loads v2.2.0 or later with the nativeMessaging permission. Your ID must stay the same.
5. Under Updates, confirm Windows updater connected. Automatic installation is enabled by default. You can also click Install latest update automatically.

You do NOT need to manually install the new extension ZIP before setup when upgrading from an existing EC-FIX-IT version. The helper bootstraps the newest release for you. Setup can be rerun for the same folder/ID. Do not move the folder afterward. One folder/extension ID is supported per Windows user; Chrome and Edge may both use that same ID/folder.

## Automatic behavior

The extension checks GitHub at browser startup and every six hours. It waits until EC-FIX-IT popup/tool/review-transfer pages close, asks the helper to apply the latest published release, then reloads. Use the checkbox in Updates to opt out. The manual install button updates immediately, so finish current work before clicking it.

Only the hardcoded GitHub repository's latest stable release is used. Required assets: EC-FIX-IT-extension-vVERSION.zip and the same filename plus .sha256. The ZIP must contain parameter-extension/ at its root. SHA-256 verifies integrity against the release asset; this is not an independent code signature. A draft release should be published only after both assets are uploaded.

Files are validated before writes. Backups and a restore-plan.json are kept under %LOCALAPPDATA%\EC-FIX-IT-Updater\backups. Replaced/new/previously managed files are tracked. Unknown local files are preserved. Installation identity, local paths, junctions/symlinks, archive size and traversal are checked. Failed writes trigger rollback; an interrupted transaction is recovered on the next helper call; if rollback itself fails the error includes the backup folder for manual recovery. Automatic backup deletion is not enabled.

## Permissions and storage

Setup writes ONLY helper files/configuration under your LocalAppData directory, a .ecfixit-install-id marker in the selected extension folder, and per-user NativeMessagingHosts registry entries for com.ecfixit.updater under Google\Chrome and Microsoft\Edge (both registry views). The host allows only your supplied extension ID and accepts status/update commands, not arbitrary URLs, file paths or shell commands. The helper itself is separate from the extension and is not self-updated by extension ZIPs.

Windows 10/11 with .NET Framework 4.5+ and a regular local user-writable installation folder are required. Browser minimum is Chrome/Chromium 116+. Managed browser policy may block native messaging. Source Updater.cs is included; EC-FIX-IT-Updater.exe is an unsigned internal utility compiled from it. Tests do not substitute for trying the registration/reload flow in your installed browser.

## Unregister / change installations

Run Unregister-Updater.ps1 with Windows PowerShell. It removes only this helper's matching browser registrations and archives its active config, allowing setup for a different installation. Extension files, Review data and backups remain. You can manually remove the helper folder later when no updater is running. Uninstalling the extension itself can erase browser-owned Review data, so is not part of this workflow.

## Troubleshooting

- Host not found: rerun setup and verify the ID, then Reload the extension.
- Access forbidden: the configured ID does not match. Unregister and set up with the ID of the existing installation.
- Missing SHA-256/ZIP asset: release publication is incomplete; the installed files remain unchanged. Retry after the release is ready.
- Download/API failure: confirm internet access; GitHub can rate-limit anonymous API requests. The existing extension remains usable.
- Identity marker/folder error: do not move or replace the installation directory itself. Setup must bind to its actual folder.
- Write/rollback error: close tools and inspect the reported backup; do not repeatedly overwrite a failing installation.
