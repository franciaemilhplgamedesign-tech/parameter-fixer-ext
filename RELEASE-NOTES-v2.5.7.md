# EC-FIX-IT v2.5.7

- Add an optional manual Channel field in Parameters, for example tiktok. Applying uses channel=tiktok on local, localhost and hosted preview URLs.
- Read existing channel values from the preview URL. A blank field removes the parameter. Auto-refresh follows the existing setting.
- AppLovin uses one outer channel value and forwards it to accessible creative frames, alongside date and language. Channel is added independently of the date/language URL toggle.

Validation: local and localhost URLs, AppLovin deduplication, clearing, encoded values, parameter inheritance and existing preview overrides passed automated tests.
