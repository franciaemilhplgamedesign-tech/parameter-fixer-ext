# EC-FIX-IT v2.1.2 — upload review draft, send manually

- Replaced Upload & send with Upload to ecomm checker. The extension attaches the selected HTML/screenshots and inserts “check for grammar and filename”; it never clicks Send.
- Fixed an overbroad upload wait: unrelated composer-wide progress/aria-busy states no longer block completion. The adapter checks selected attachments, attachment-specific upload indicators, and a stable enabled Send control.
- Once readiness is confirmed, the transfer window closes automatically and focuses the checker tab. The user reviews the attachments and sends the draft manually.
- Errors, existing drafts or unverified attachments keep the transfer window open for inspection. Do not retry against a staged draft without checking for duplicates.
- Preserves the combined 20-file Review limit and saved review items.

Update the files in the existing extension folder, click Reload, close old transfer/extension windows and retry. Do not uninstall to preserve Review storage.

DOM regression tests cover normal and paste uploads, permanent unrelated busy indicators, actual attachment-progress waits, prompt preservation, missing attachments, and no Send clicks. Runner tests cover successful close after cleanup, checker focus, timer cleanup and keeping errors open. Live ChatGPT upload behavior still needs validation in the installed browser.
