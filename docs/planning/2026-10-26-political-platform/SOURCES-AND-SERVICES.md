# Source and service readiness

Read-only checks on October 26, 2026. These results establish access at the checking location, not production ingestion readiness or publication rights. No new paid service was provisioned.

## Existing deployment

Vercel project `israelielection`, team `ravbogards-projects`, already linked through `.vercel/repo.json`. CLI authentication works. Environment metadata for both production and preview contains existing Redis/KV, QStash and Gemini configuration. No PostgreSQL, Blob or Resend credentials are configured. Secret values were not printed.

There is no `psql`, `postgres` or Docker executable on the current PATH. Database unit tests with an injected executor must not be presented as a real migration/restore test. Production remains on the existing lifecycle store until actual database provisioning and migration validation.

## Parliamentary source

Official catalogue: https://data.gov.il/api/3/action/package_show?id=odata

- Successful structured JSON response. Dataset title: מאגר פרלמנטרי נגיש - ODATA.
- Catalogue license label: Other (Open); last metadata modification 2023-03-21. This label alone does not settle redistribution of every linked document.
- Catalogue resource: http://knesset.gov.il/Odata/ParliamentInfo.svc/.
- HTTPS legacy and v4 root requests returned HTTP 200 **text/html**, 131,618 bytes, not a usable OData response. The browser-backed web lookup redirected v4 to the official geo-maintenance page.
- Do not qualify the adapter from HTTP success or invent parliamentary records. Require validated entity responses and authoritative field semantics before enabling ingestion.
- The current Hebrew consolidated Basic Law PDF (`https://main.knesset.gov.il/Activity/Legislation/Documents/yesod6.pdf`) and National Law Database entry 2000040 also redirected to the official geo-maintenance page. New procedural deadline automation remains unqualified; search snippets are not operative legal text.

## CBS indicator pilot

Official API guidance: https://www.cbs.gov.il/en/cbsNewBrand/Pages/API-interface.aspx

Official price-index request documentation: https://www.cbs.gov.il/en/Pages/Api-Indices.aspx

Read-only request with the required User-Agent:

`https://api.cbs.gov.il/index/data/price?id=120010&format=json&download=false&last=2&lang=en`

- HTTP 200, application/json, 895 bytes. `month` contains series code 120010, Consumer Price Index - General, with dated observations; `quarter` is null; `paging.next_url` is null.
- Observations expose year/month, monthly and annual percentage changes, and current-base description/value. The adapter must preserve units, base periods and observation dates. Retrieval time is not the observation date or release date.
- This successful sample supports building a strict indicator adapter. It does not prove causal government performance or complete historical/revision coverage.

## Service proposal and approval boundary

Candidate architecture: Neon PostgreSQL; Vercel private Blob; Resend email API; existing Redis/QStash retained. Free open-source driver dependencies do not provision these services.

Vercel integration inventory confirms the project currently has only `election-night-scheduler-2026` (QStash) and `election-night-2026` (Redis). Neon is available in the marketplace but is not installed for this project. Vercel CLI supports explicitly private Blob stores; its default is public, so any approved provisioning must specify private access. No store was created.

- Neon: https://neon.com/pricing — live pricing checked October 26: Free includes 100 CU-hours/month and 1 GB storage per project; Launch lists $0.106/CU-hour and $0.35/GB-month. An illustrative continuously active 0.25 CU for 730 hours plus 1 GB storage is about $19.70/month before restore/transfer/other usage. This is a calculation, not a measured project bill. Free preview validation is an option, not production capacity proof.
- Blob: https://vercel.com/docs/vercel-blob/usage-and-pricing — checked October 26: displayed storage $0.023/GB-month, simple operations $0.40/million and advanced operations $5/million. Delivery has additional transfer/CDN charges and regional variation. Private captures stay server-side; original third-party captures are not public bulk exports. No store was provisioned.
- Resend: https://resend.com/pricing — listed transactional Pro entry is $20/month for 50,000 emails. One thousand daily digest recipients consume approximately 30,000 recipient emails in a 30-day month before alerts/corrections. Verify sending-domain configuration and current terms before activation.
- AP: https://api.ap.org/media/v/docs/Getting_Started_API.htm and Reuters: https://www.reutersconnect.com/plans-and-pricing — licensed source candidates requiring quotes and rights review. No contact, subscription or purchase has been made.

Before requesting service approval, produce concrete configuration, measured storage/capture volume, translation-token and recipient-volume estimates, rollback plan and actual acceptance checks. Until then new live capabilities must report unavailable honestly and must not imply operational delivery or durable storage.

Concrete first rehearsal configuration (not provisioned): a Neon `free_v3` resource named `political-platform-preview`, region `iad1`, built-in app authentication disabled and realtime disabled, connected only to Vercel's preview environment with the `POLITICAL_RECORD_` variable prefix. The authenticated marketplace metadata confirms these plan/region options. Use a separate Vercel Blob store with explicitly **private** access in `iad1`; the CLI's public default must not be used. Keep all public-read, collection, discovery, subscription and send flags off until the corresponding real checks pass. Sender-domain setup and test mail require approval/configuration; no contacts are imported.

Rehearsal acceptance: run exact migrations on real PostgreSQL; prove append-only app-role restrictions and rollback; restore to a separate isolated database and compare revisions/captures/outbox; verify authenticated private Blob readback and public inaccessibility; test exact reviewed publication replay and concurrent delivery deduplication; then verify an explicitly authorized test recipient, domain authentication, signed suppression webhook, unsubscribe/correction races and worker continuation. Production Redis remains authoritative through shadow comparison. Rollback disables new flags and workers while retaining records/captures and the existing live pipeline; it does not delete history or reset DNS.

## Measured reference workload

The current English reference corpus has 22 documents, 745 extracted blocks and 258,853 source bytes. Six additional languages require 132 document editions. The first four translation-only pilot attempts used 37,262 provider-reported total tokens combined; none published because validators rejected ordinal/locale formatting or quantity preservation. Independent semantic review and any repair pass add work, so this is not a completed-edition cost estimate. Measure successful end-to-end pilots before extrapolating a monetary budget.

The Gemini key is sensitive in Vercel and intentionally cannot be downloaded through environment pull. The hosted, signed, read-only generation worker successfully reaches the configured provider. No replacement key is needed. Generated candidates remain private until validation and explicit local publication into the versioned translation ledger.

Successful seats-guide pilots now include Persian, Hebrew and corrected/re-reviewed Chinese. Per-document costs vary substantially with translation, repair and thinking tokens. Current official Gemini 3.8 Flash pricing is $0.75/million input tokens and $3.75/million output including thinking through December 31, 2026; listed rates double January 1, 2027. Source: https://ai.google.dev/gemini-api/docs/pricing . Early successful pilot runs were roughly $0.07–$0.15 each before additional failed attempts; extrapolating that range to 132 editions gives roughly $9–$20 solely as an illustration. Longer documents, retries, rejected translations and later corrections prevent treating this as a budget or quote.

Early hosted briefing dry-runs acquired five of sixteen attempted article bodies and rejected unsupported claims. After independently filtering individual failures, run 40418677784 qualified three atomic claims and five translated editions; Chinese remained pending. Nothing was published. GitHub Actions provider access works; actual private-archive publication remains unconfigured. A bounded translation batch now runs at most two editions concurrently, with explicit edition/time caps and no automatic publication.

## Independent availability pilot

The official [Globalping API specification](https://github.com/jsdelivr/globalping/blob/master/public/v1/spec.yaml) supports public HTTP/TLS measurements without an account, currently limited to 250 probe tests/hour unauthenticated. A three-country trial against the public homepage produced HTTP 200 and authorized TLS from Buffalo, US and Falkenstein, Germany. Tel Aviv, Israel returned HTTP 307 to `/he`; a bounded follow-up returned HTTP 200 with authorized TLS. Measurements: `2EOTuvWjNHsVgrRkC00021OGV` and `2X2zLk7ueRXtgwIeZ00021OGW`, October 26 around 23:20 UTC.

No credentials, bypass headers or private paths were submitted. These are network/HTTP checks, not browser rendering proof. A monitor must retain actual probe locations, validate same-origin locale redirects, distinguish absent probes from failures, and remain separate from Vercel's own availability. No recurring monitor or paid service was installed by this pilot.

The subsequent GitHub Actions rehearsal [40422558173](https://github.com/RavBogard/israelielection/actions/runs/40422558173) passed all seven browser-edition checks and repeated the three-country HTTP/TLS checks, including Israel's locale redirect. Measurements: `23Mc0DDFrwjf4CqZ900021OH2` and `2AAUG4uZ5YVUQpSZR00021OH2`. Incident persistence explicitly reported unconfigured. The separate 15-minute schedule remains flag-disabled. The repository is public; [GitHub's current billing documentation](https://docs.github.com/en/actions/concepts/billing-and-usage) confirms standard hosted runners are free for public repositories. Artifact retention is bounded to seven days; source acquisition schedules and production flags were not changed.
