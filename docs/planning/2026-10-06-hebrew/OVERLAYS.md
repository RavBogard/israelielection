# Hebrew data overlays: the contract

Pages read Hebrew data only through `lib/i18n/overlays.ts`. Writers fill `data/he/**`. Each entry:

```json
{ "<item key>": { "<field path>": { "text": "עברית", "src": "<srcHash(English field)>", "translated": true } } }
```

- `src` is `srcHash(english)` from `lib/i18n/localize.ts` over the exact English field text. Compute it with a script; never by hand. A wrong hash means the page shows English.
- `translated: true` only on a quote whose original Hebrew was not found (shown with "(תרגום)"). An original Hebrew quote carries no flag. Record the Hebrew source in the writer's research log (docs/research/2026-10-06-hebrew/), not in the overlay.
- `machine: true` only for job output (the daily briefing, party-proposals refreshes).
- Field paths are dotted, as `fieldAt` reads them: `who.0.text`, `issues.draft.text`, `answerSources.shas.text`.
- Hebrew is written fresh in Israeli political-media Hebrew (STYLE.md), doing the English field's job. It does not mirror the English sentence by sentence.

| Overlay | Item key | Fields |
|---|---|---|
| `data/he/parties.json` | party id | `name`, `short`, `leader`, `surplusLine`, `who.N.text`, `voters.N.text`, `issues.<key>.text`, `names.N.name`, `names.N.note`, `pledges.N.text`, `surplusPartner.text`, `quote.text`, `bios.N.name`, `bios.N.text`, `status.*` text fields, `thin.*` text fields |
| same file | `bloc:<id>` | `label` |
| same file | `issue:<key>` | `label` |
| `data/he/positions/<issue>.json` | `_` (file) | `title`, `question`, `note`, `stances.N.label` |
| same file | party id (row) | `text` |
| `data/he/comparison-questions.json` | question `key` | `label`, `question`, `note`, `stances.N.label`, `answerSources.<party>.text`, `unstated.<party>.text` |
| `data/he/gaza-security-evidence.json` | `_` / party id | as positions files, plus `unstated.<party>.text` under `_` |
| `data/he/pledge-rules.json` | rule `id` | `message` |
| `data/he/coalition-scenarios.json` | scenario `id` | `title`, `agenda`, `obstacles`, `leadership` (and any other prose field) |
| `data/he/outgoing-government.json` | `_` | `title`, `seatsNote`, `status`, `events.N.*` text, `noam` text |
| `data/he/pollsters.json` | English outlet or firm name ("Channel 12", "Midgam") | `name` |
| `data/he/voter-base.json` | party id | the rendered text fields |
| `data/he/results.json` | `_` | rendered labels |

Pages: when a `Localized` comes back with `lang: "en"`, render it in `<span lang="en" dir="ltr">`; when `translated`, append " (תרגום)".
