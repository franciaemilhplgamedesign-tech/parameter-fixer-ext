# EC-FIX-IT v2.3.4 — structured creative checks

- Corrects redirect false positives from location.href equality comparisons. Real assignments and navigation calls remain flagged.
- Parses JavaScript without executing it to distinguish literal external dependencies, embedded assets and unresolved CSS template expressions. Unresolved expressions remain warnings rather than false external-file errors.
- Recognizes UTF-8 Base64 end-scene decoders, non-executable Base64 script blocks, variant maps and htmlId asset references. Raw HTML remains an error under the existing Base64-only project policy; unresolved loaders remain warnings.
- Inspects embedded HTML calendars and YYYYMMDD date windows. Annual month/day windows appear for the current year and next year.
- Reports JavaScript parsing gaps explicitly. Embedded-document runtime/MRAID coverage and network-use warnings remain.

Validation: all 20 supplied Jones Road Beauty MIPs retain correct MIP size limits and no longer receive false asset errors or comparison-as-redirect warnings. Regression tests retain real external-asset/redirect/raw-HTML detection and cover Base64 decoding, unknown sources, variant maps, annual dates, script data blocks, non-execution, prior Codeway/Orivelle/Popsa schedules, size switching and updater behavior. No source creative files were modified. Browser runtime certification is still separate.

Use Install latest update automatically in Updates.
