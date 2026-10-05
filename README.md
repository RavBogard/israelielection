# israelielection.org

An English-language reference on Israel's October 27, 2026 election. Plan: [docs/00-PLAN.md](docs/00-PLAN.md).
Build log: [docs/planning/2026-10-04-site/STATE.md](docs/planning/2026-10-04-site/STATE.md).

## Data
Everything the site shows lives in `data/*.json`, so every change is a reviewable commit:

- `parties.json`: party profiles (who, voters, six issue axes, list names, pledges, quotes, bios). Every item carries its source.
- `polls.json`: polls. A party missing from `results` was not reported separately; `combined` holds seats a pollster gave only for a group. `inAverage: false` polls (Channel 14) are shown but not averaged.
- `pledge-rules.json`: Coalition Builder warnings as declarative rules.

## Develop
```
npm install
npm run dev        # http://localhost:3000
npm test           # unit + data-integrity tests
npm run build
```
Node 22+. Deploys to Vercel on push to `main`.
