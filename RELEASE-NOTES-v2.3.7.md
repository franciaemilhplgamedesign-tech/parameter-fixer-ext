# EC-FIX-IT v2.3.7 — screenshot access in persistent views

- Fixes screenshot capture after temporary activeTab access is lost in the side panel or detached tools.
- The Take screenshot click requests optional all-URL host access before any awaited work, as required by the browser captureVisibleTab API. The browser prompts on the first grant; access is remembered unless revoked.
- Shows specific messages for denied access and disabled file-URL access.
- Checks that the linked preview remains the active tab before and after capture; switched-tab images are discarded rather than saved against the wrong creative.

Verified permission ordering, successful capture/gallery save for both views, denial and local-file guards, switched-tab handling, screenshot geometry, Review file cap and updater behavior with automated fixtures. Live browser permission/capture interaction was not exercised.

Install the update, reopen the tools and click Take screenshot. Allow the browser permission prompt. Local HTML also requires Allow access to file URLs.
