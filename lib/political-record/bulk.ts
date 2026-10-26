import { createHash } from "node:crypto";
import { publicApi } from "./public-api";
import { revalidatedJson, revalidatedResponse } from "./http-cache";
const sha = (body: string) => createHash("sha256").update(body).digest("hex");
/** A bounded archive part with a frozen cursor and explicit historical/current semantics. */
export async function bulkApi(request: Request, collection: string) {
  const url = new URL(request.url),
    format = url.searchParams.get("format") ?? "manifest",
    expected = url.searchParams.get("digest");
  if (
    !["manifest", "ndjson"].includes(format) ||
    (expected && !/^[a-f0-9]{64}$/.test(expected))
  )
    return Response.json({ error: "invalid_export" }, { status: 400 });
  const sourceUrl = new URL(`/api/v2/${collection}`, url.origin);
  for (const key of ["election", "view", "limit", "cursor", "lang"]) {
    const value = url.searchParams.get(key);
    if (value !== null) sourceUrl.searchParams.set(key, value);
  }
  const headers = new Headers(request.headers);
  headers.delete("if-none-match");
  const response = await publicApi(
    new Request(sourceUrl, { headers }),
    collection,
  );
  if (response.status !== 200) return response;
  const page = (await response.json()) as {
    records: unknown[];
    asOfCursor: string;
    nextCursor: string | null;
    electionId: string;
    rights: unknown;
    storage: string;
    historyReady: boolean;
  };
  const metadata = {
    schemaVersion: 2,
    collection,
    electionId: page.electionId,
    asOfCursor: page.asOfCursor,
    view: url.searchParams.get("view") ?? "latest",
    locale: url.searchParams.get("lang") ?? "en",
    storage: page.storage,
    historyReady: page.historyReady,
    rights: page.rights,
    recordCount: page.records.length,
    nextCursor: page.nextCursor,
    scope: "archive_part",
    visibility:
      url.searchParams.get("view") === "history"
        ? "historical_as_of_with_current_correction_labels"
        : "revalidated_current",
  };
  const ndjson =
      [
        JSON.stringify({ manifest: metadata }),
        ...page.records.map((record) => JSON.stringify(record)),
      ].join("\n") + "\n",
    digest = sha(ndjson);
  // Live withdrawals may change even an old as-of view's current visibility: never silently serve different bytes.
  if (expected && expected !== digest)
    return Response.json(
      { error: "export_changed_rebuild_manifest" },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  const download = new URL(url);
  download.searchParams.set("format", "ndjson");
  download.searchParams.set("digest", digest);
  if (format === "manifest")
    return revalidatedJson(
      request,
      {
        ...metadata,
        sha256: digest,
        byteLength: Buffer.byteLength(ndjson),
        downloadUrl: download.href,
        nextManifestUrl: page.nextCursor
          ? (() => {
              const next = new URL(url);
              next.searchParams.set("cursor", page.nextCursor);
              next.searchParams.set("format", "manifest");
              next.searchParams.delete("digest");
              return next.href;
            })()
          : null,
      },
      {
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",
      },
    );
  return revalidatedResponse(request, ndjson, {
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Content-Disposition": `attachment; filename="${["elections", "entities", "events", "publications"].includes(collection) ? collection : "records"}-${page.asOfCursor}.ndjson"`,
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": "*",
  });
}
