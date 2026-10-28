# tests/i18n_ch — Swiss locale formatting and negotiation

```sh
node --test tests/i18n_ch/*.test.mjs
```

Helper under test: `web_launch/i18n-ch.mjs` (pure functions, no DOM, imports only `swiss-compliance.mjs`).

| File | What it proves |
|---|---|
| `currency.test.mjs` | CHF from integer minor units for de-CH / fr-CH / it-CH (code position, U+2019 vs U+202F grouping, Italian 5-digit grouping), agreement with the engine's `Intl.NumberFormat`, rejection of bad input, ASCII variant, and the recorded divergence from the legacy `formatSwissFrancs` apostrophe |
| `date-time.test.mjs` | `dd.mm.yyyy`, 24-hour `HH:mm`, long month names per language, Zurich midnight crossing, calendar-slot ranges, DST offsets on 2026-03-29 and 2026-10-25 (M17) |
| `negotiate.test.mjs` | Accept-Language / `navigator.languages` parsing with q-values, exact → language → fallback, `gsw` → de-CH, wildcard handling, a supported set that keeps `uk` as source language |
| `canton.test.mjs` | all 26 cantons resolve to one of the three locales via their primary language |

The helper is not yet wired into `app.mjs` or `real-journey.mjs`; those still format with `uk-UA`, `de-CH` and `en-GB` (`audit/product-path-check.md` lists the call sites).
