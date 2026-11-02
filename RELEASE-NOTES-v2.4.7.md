# EC-FIX-IT v2.4.7

- Detect raw HTML end scenes passed through endSceneHtml props and frozen configuration objects, including the supplied Wasabi MIP 01 and 03. These now report packaging errors instead of unresolved warnings.
- Add an optional, remembered Include filenames in prompt checkbox in Review. Selected filenames are added in upload order to the preview, exported prompt and ecomm checker transfer. Off by default.

Validation: both original Wasabi files report raw HTML errors; raw/encoded end-scene, Review prompt/order and unified fix regressions passed. Original creatives are unchanged.
