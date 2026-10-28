# EC-FIX-IT v2.3.10 — compressed end-scene packaging

- Recognizes the exporter Base64-gzip end-scene loader as encoded packaging instead of reporting its small decompression scaffold as a raw HTML scene.
- Requires the known loader structure, a Base64 payload with gzip signature and no extra rendered HTML or arbitrary loader code. Ordinary raw HTML scenes remain errors.
- Generic srcdoc bridge assignments are no longer counted as additional unknown end scenes when concrete end-scene render sources have already been identified. Multiple concrete scene variants are still checked.

Verified the supplied Ogee source now passes the packaging check. Independently decompressed its payload successfully: 1,718,091 gzip bytes to 2,352,149 HTML bytes. Regression tests cover the supported loader, generic bridge functions, raw scenes, extra content/code and invalid payload signatures, plus existing structured end-scene checks. Browser-side packaging checks validate the scaffold and encoding signature; successful decompression and decoded MRAID behavior still require runtime QA. The original file was not changed.

Install the update and click Recheck source.
