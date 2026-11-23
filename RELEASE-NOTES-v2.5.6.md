# EC-FIX-IT v2.5.6

- Add the client ACS language declaration check using <meta name="acs-languages" content="en">.
- Flag missing/duplicate declarations, uppercase codes, whitespace, duplicates, missing en, and missing/extra codes compared with resolved device-language or ?language translation dictionaries. English-only files use en.
- Inspect supported decoded HTML documents. Language readers or external/dynamic translations that cannot be resolved produce a review warning after format validation.
- Fix all & compress adds or repairs the declaration when the actual language set can be established from supported source patterns.

Validation: English-only declarations, multilingual dictionary selection, unsupported readers, missing/extra languages, formatting, existing MRAID checks and the unified fix pipeline passed automated tests. Static analysis cannot prove every dynamic language implementation.
