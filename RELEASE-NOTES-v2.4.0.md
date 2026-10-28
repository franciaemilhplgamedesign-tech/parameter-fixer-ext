# EC-FIX-IT v2.4.0 — unified fixes and ordered Review

- Click tracking now flags reserved clickTag1, clickthrough and clickThrough identifiers, local clickTag declarations and writes to the platform-injected window.clickTag. The unified fixer renames supported local aliases and preserves window.clickTag as the primary injected target. Missing alias fallbacks are no longer requested.
- Replaced separate safeguard, MRAID-fix and compression actions with Fix all & compress HTML. It runs MRAID patches, click-name cleanup, supported asset inlining and HTML/Base64 packaging (including supported encoded end scenes), optional WebGL/network safeguards, compression, and all final checker rules. Errors or unresolved fixes block download. Original source files stay unchanged.
- WebGL fallback and remote-network blocking remain selectable. Lossy embedded-image optimization remains optional; HTML compression always runs.
- Review HTML is optional while automatic local HTML collection is preserved. Without selected HTML, the prompt begins check grammar; with HTML it begins check grammar and filename. Optional task name and notes still append to either prompt.
- Review screenshots are ordered by capture time, with HTML files always last, for both ZIP exports and checker transfers. Each upload is staged and verified before the next file to preserve that sequence. Transfers still prepare a draft for manual Send and close their extra window after success.
- The combined 20-file cap remains. Task/notes fields keep local persistence; their requested placeholder text is updated.

Validation: unified pipeline, real compression, reserved-name checks and renaming, literal asset inlining, raw/encoded HTML packaging, existing Base64 preservation/UTF-8 text, unresolved-fix blocking conditions, image-only/mixed Review prompts, capture order, HTML-last ZIP/upload order, sequential file-input/paste uploads, optional image-only controls, manual Send, transfer cleanup, file cap, screenshot access, calendars and updater regression fixtures. Live browser/ChatGPT UI interaction was not exercised. Unsupported dynamic dependencies or packaging require source review; final output warnings and gameplay still need QA.

Use Install latest update automatically in Updates, then reopen EC-FIX-IT.
