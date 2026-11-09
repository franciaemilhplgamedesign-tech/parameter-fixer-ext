# EC-FIX-IT v2.5.1

- Fixed holiday detection for annual Comfrt SIP promotions that cross New Year, including December 26 through January 7.
- Cross-year end dates use the following year. Unsupported reversed ranges in other creative formats remain excluded.

- Detect fixed-year promo selectors that guard by year and month and return promo objects for specific days. Black Girl Vitamins SIPs 09–16 show Black Friday (November 27–29, 2026) and Cyber Monday (November 30, 2026).

Validation: all 26 Comfrt SIPs return three promotions, including the End of Season Sale, with no overlapping ranges. All eight Black Girl Vitamins files return both fixed ranges even with a different preview year selected.
