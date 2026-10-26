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

- Neon: https://neon.com/pricing — compute, storage, restore and transfer vary with usage; no fixed total inferred from a headline tier.
- Blob: https://vercel.com/docs/vercel-blob/usage-and-pricing — private captures, request volume and transfer must be included in estimates; original third-party captures are not public bulk exports by default.
- Resend: https://resend.com/pricing — listed transactional Pro entry is $20/month for 50,000 emails. One thousand daily digest recipients consume approximately 30,000 recipient emails in a 30-day month before alerts/corrections. Verify sending-domain configuration and current terms before activation.
- AP: https://api.ap.org/media/v/docs/Getting_Started_API.htm and Reuters: https://www.reutersconnect.com/plans-and-pricing — licensed source candidates requiring quotes and rights review. No contact, subscription or purchase has been made.

Before requesting service approval, produce concrete configuration, measured storage/capture volume, translation-token and recipient-volume estimates, rollback plan and actual acceptance checks. Until then new live capabilities must report unavailable honestly and must not imply operational delivery or durable storage.
