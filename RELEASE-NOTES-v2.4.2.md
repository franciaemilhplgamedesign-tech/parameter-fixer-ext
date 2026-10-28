# EC-FIX-IT v2.4.2 — manual Add HTML in Review

- Added an Add HTML file-icon button beside the Review selection controls. It collects the original HTML from the linked local file preview, without a file chooser.
- Removed automatic HTML collection when opening tools, selecting a preview, or taking screenshots. Existing saved collection items are retained.
- Re-adding the same local source selects/updates its existing item rather than adding a duplicate. File URL access is still required.
- Image-only prompts, optional HTML, capture-order uploads with HTML last and the combined 20-file limit are unchanged.

Tests cover no automatic startup/capture collection, explicit button action, query removal and original bytes, duplicate reselect, unsupported preview feedback, placement, image-only Review/order, sequential uploads and file cap.

Install the update and reopen EC-FIX-IT.
