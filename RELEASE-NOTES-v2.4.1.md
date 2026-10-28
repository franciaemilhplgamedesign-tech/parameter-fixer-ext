# EC-FIX-IT v2.4.1 — object coercion checker crash

- Fixes Cannot convert object to primitive value while statically inspecting bundled JavaScript. Object/array arithmetic is now unresolved instead of being coerced into strings.
- Guards computed property keys and decoder encodings against unsupported object values. Non-string end-scene values remain unresolved warnings rather than crashing or passing.
- Normal primitive concatenation and supported encoded-document detection remain available. No creative code is executed by these checks.

Verified the supplied Three Bird Nest swipe MIP: the checker completes 13 findings, with 0 errors and 1 warning. Added fixtures for object concatenation, object keys, object decoder encodings, object end scenes, mixed BigInt arithmetic and normal primitive resolution. Unified-fix, structured-checker and compressed-end-scene regression tests pass. The source creative was not changed.

Install the update, reopen EC-FIX-IT and click Recheck source.
