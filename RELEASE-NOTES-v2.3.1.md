# EC-FIX-IT v2.3.1 — task name in Review

- Added an optional Task name field in the Review collection. The field is remembered locally and shows a live prompt preview.
- When provided, the upload draft uses exactly: check grammar and filename for task [task_name]. The square brackets are a placeholder and are not included in the actual prompt. No terminal period is added automatically.
- Example: check grammar and filename for task 2026.10.13 - Jones Road Beauty - MIPs, SIPs
- Without a task name, the prompt is check grammar and filename.
- Review ZIP exports and clipboard instructions use the same task-aware prompt. Upload jobs retain a prompt snapshot during transfer.
- Existing draft-only upload, successful transfer popup closure and combined 20-file limit remain unchanged. Users still click Send manually.

Install latest update automatically in Updates, or let the Windows updater apply this release after EC-FIX-IT tools close. Manual ZIP replacement remains available.

Tests cover exact prompt text, trimming and optional fallback, remembered field/live preview, async restore not overwriting typing, upload job prompt, review ZIP contents and existing transfer/limit behavior. Live ChatGPT behavior still depends on the installed browser/page controls.
