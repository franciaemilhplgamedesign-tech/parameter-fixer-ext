# EC-FIX-IT v2.3.5 — Windows-style file sizes

- Uses Windows-style sizing: 1 MB = 1,048,576 bytes. The limits remain MIP 5 MB and SIP 3.4 MB.
- MIP limit: 5,242,880 bytes. SIP limit: 3,565,158 bytes, rounded down to whole bytes.
- Checker cards and summaries show Windows-style MB alongside exact bytes. Creative-type switching refreshes cached size cards using the same limits. Fixed downloads and compressor eligibility use the shared limits.
- The supplied index (2).html is 5,015,979 bytes, displays as 4.78 MB and now passes the MIP limit.

Verified the supplied file, both size boundaries at minus one/exact/plus one byte, creative-type switching and cached card updates.

Use Install latest update automatically in Updates.
