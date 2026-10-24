# EC-FIX-IT v2.3.2 — Review additional notes

- Added an optional Additional notes field in Review, remembered locally alongside the task name.
- Notes appear on a new line as `additional notes: [your notes]` after the grammar and filename prompt. Blank notes add no extra text.
- Live prompt preview, upload drafts, review ZIP exports and clipboard instructions use the same complete prompt.
- Upload still prepares a draft for manual sending; the combined 20-file limit remains.

Example:
```text
check grammar and filename for task 2026.10.16 - wuffes - MIPs, SIPs
additional notes: end scene is just a place holder, ignore it
```

Verified prompt formatting, optional fallback, notes length, local persistence without overwriting typing, ZIP prompt and upload job snapshot, plus review transfer and file-limit regressions. Live ChatGPT upload was not tested.
