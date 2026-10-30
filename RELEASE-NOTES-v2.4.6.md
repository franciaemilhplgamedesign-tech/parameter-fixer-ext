# EC-FIX-IT v2.4.6

- Flag openClickThrough as a reserved click identifier and rename it through Fix all & compress. Stop the MRAID fixer from injecting that alias.
- Warn on cached window.mraid variables, including renamed/minified aliases. Read the bridge live when opening a CTA; cached-reference warnings require manual review and are not silently rewritten.
- Apply these click checks to supported decoded end scenes as well as the outer creative.

Validation: inspected all 14 supplied Spoonful of Comfort files. All six MIPs contain cached bridge references; MIP 02 contains openClickThrough, and MIP 06 has clickTag overrides in decoded content. Eight SIPs pass these two click-specific checks. Regression tests cover live reads, aliases, comments/strings, embedded HTML and unified fixes. The bypassed scratch copy and original creative files were not changed. These are source checks, not proof of runtime redirect failure.
