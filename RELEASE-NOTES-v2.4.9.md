# EC-FIX-IT v2.4.9

- Optional Review filename now comes directly from the linked local file URL. No HTML attachment is required or added by this option.
- Only file:// HTML previews enable the checkbox; hosted/AppLovin/localhost pages do not supply a filename. Query parameters are excluded and URL-encoded names are decoded.
- When checked, image-only reviews request grammar and filename checks using that local name. When unchecked, image-only reviews remain grammar-only.

Validation: local URLs, no attachments, unrelated collection filenames, disabled checkbox and nonlocal previews tested.
