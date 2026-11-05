# EC-FIX-IT v2.4.11

- Support SPRT SIP holiday maps stored in encoded HTML attributes, including explicit custom date windows and supported New Year, Christmas and Thanksgiving-weekend offsets. Merge duplicate ranges across surfaces and iterations.
- Parameter Fixer now supports the SPRT dynamic-text clock used by the five Freebird SIPs. Date previews apply inside rehydrated surfaces while animation clocks and click handling remain intact. Invalid/missing dates use the real clock.
- Correct false external-asset errors for HTML-encoded internal SVG mask fragments, allowing the existing checker/fix pipeline to process these exports. Actual remote references still fail.

Validation: all five supplied files were patched under their original filenames after backup; date boundaries were exercised with their actual HolidayLens/dynamic-text runtimes in isolated VM fixtures. Original stored layouts and animation clock assets are unchanged. Fixed files have zero checker errors and remain below the SIP size limit. Unified fix/compression, existing calendar/AppLovin and new SPRT regression tests passed. Browser/container visual QA remains recommended.
