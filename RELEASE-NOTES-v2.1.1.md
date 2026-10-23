# EC-FIX-IT v2.1.1 — local extension, no hosted dashboard

- Restored the complete local toolbar popup. Removed the hosted dashboard, container UI, bridge code, external messaging allowance and remote-frame permission.
- GitHub Pages hosting is disabled. GitHub continues to host extension source, release ZIPs and version metadata.
- Keeps the combined Review limit of 20 HTML/image files, atomic insertion checks, replacement at capacity and export/send guards. Existing oversized collections are preserved; delete files to free slots.
- Includes Orivelle holiday detection: all ten supplied SIPs expose 37 ranges. Positional tuples, multiline/trailing-comma rows, promo labels and original local-source fallback are supported.
- Keeps all existing parameter, checker, fixer, compression, screenshot and review functions locally.

## Update

Replace files in the existing unpacked extension folder and click Reload. Close any old container/extension windows and reopen with the toolbar icon. Do not uninstall if you want to retain Review items. Enable Allow access to file URLs for local HTML.

The existing download button downloads an update; it does not overwrite the installation. Automatic replacement is not implemented in this release. Browser-managed distribution or an external installed updater is needed for unattended full-file updates. A user-granted folder workflow would also need separate implementation and validation.

Regression tests passed for local popup wiring, combined Review cap, export/send guards, Orivelle/source fallback, selected size limits and existing parameters/compression/screenshots. Live installed-browser and ChatGPT transfer testing remain necessary.
