# EC-FIX-IT v2.5.0

- Parameters now offers preview clock/language overrides alongside existing URL parameters. Both are enabled by default; disable Add date and language parameters to URL to test creatives without parameter readers.
- Current date, promo range, Previous/Next, language and auto-refresh controls apply the same selections to either mode. Applying reloads the linked preview, including when its URL stays unchanged.
- Preview overrides are restored from the linked preview session and installed before page scripts in matching local, localhost and accessible AppLovin frames. Supported same-origin srcdoc/about/blob frames inherit the top preview configuration.
- Date changes affect zero-argument Date, Date.now and Date() while explicit dates and performance/animation clocks stay native. Selected locale affects browser language signals and locale formatters. Existing creative translations are required; hardcoded text and baked image/video text are not translated.
- Disable preview overrides and apply to return to native clock/locale behavior. Real-date clearing remains available; URL parameter mode is retained.

Requires Chrome/Edge 119+ for origin-fallback frame matching. Local files still require Allow access to file URLs. Restricted/cross-origin frames without accessible preview settings are not overridden. These are extension preview settings; original HTML files are not modified.

Validation: isolated runtime tests cover date constructor/static semantics, explicit dates, locale mapping, invalid dates/locales, path isolation, accessible child frames, idempotence, and parameter/no-parameter application. Existing global-parameter, AppLovin and SPRT SIP regressions passed. Live browser/container verification remains necessary for creative-specific behavior.
