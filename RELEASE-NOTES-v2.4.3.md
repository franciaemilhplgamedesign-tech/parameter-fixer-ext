# EC-FIX-IT v2.4.3

- Detect recurring promo ranges defined through nested month/day conditions, including the Rhoback MIP calendar.
- The same detection applies to local HTML, localhost source and AppLovin iteration source.
- Rhoback ranges: November 11–26, November 27–29 and November 30, shown for the preview year and following year.

Validation: checked the supplied local HTML and identical AppLovin-hosted source; regression tests cover date boundaries, unsupported predicates and embedded calendars. No creative JavaScript is executed during inspection.
