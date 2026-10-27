import { projectPublication } from "./publications";
import { revalidatedJson } from "./http-cache";
import { EMAIL_LOCALES, type EmailLocale } from "./email";
import { getWorkspaceRegistry } from "./workspace-server";
import { projectPublic as publicRecord } from "./public-projection";
import { createHmac, timingSafeEqual } from "node:crypto";
import parties from "../../data/parties.json";
import { getElectionLifecycle } from "../election-lifecycle/server";
import { currentElection, ELECTIONS } from "./registry";
import { configuredPoliticalRecords } from "./postgres";
import { requestLimit } from "./rate-limit";
import { recordHash } from "./hash";
import { unstable_rethrow } from "next/navigation";
import type { PoliticalEvent, SourceRef } from "../election-lifecycle/types";
const sourceBinding = (sources: SourceRef[]) =>
  recordHash(
    sources
      .map((source) => [
        source.id,
        source.url,
        source.authority,
        source.captureHash,
      ])
      .sort(),
  );
export type ApiCollection =
  "elections" | "entities" | "events" | "publications";
type Cursor = {
  collection: ApiCollection;
  electionId: string;
  view: "history" | "latest";
  asOf: string;
  after: string;
  basis: "postgres" | "bridge";
  limit: number;
  locale?: EmailLocale;
};
export const API_RIGHTS = {
  structuredData: "attribution_and_source_terms_required",
  thirdPartyContent: "rights_reserved_no_raw_capture_export",
  rawCaptures: false,
  sourceQuotes: false,
};
export function encodeCursor(cursor: Cursor, secret: string) {
  const body = Buffer.from(JSON.stringify(cursor)).toString("base64url");
  return (
    body + "." + createHmac("sha256", secret).update(body).digest("base64url")
  );
}
export function decodeCursor(value: string, secret: string): Cursor {
  if (value.length > 3000) throw new Error("invalid_cursor");
  const [body, signature, ...extra] = value.split(".");
  const expected = createHmac("sha256", secret)
    .update(body ?? "")
    .digest();
  const supplied = Buffer.from(signature ?? "", "base64url");
  if (
    extra.length ||
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  )
    throw new Error("invalid_cursor");
  let cursor: Cursor;
  try {
    cursor = JSON.parse(Buffer.from(body, "base64url").toString()) as Cursor;
  } catch {
    throw new Error("invalid_cursor");
  }
  if (
    !cursor ||
    typeof cursor !== "object" ||
    Array.isArray(cursor) ||
    !["elections", "entities", "events", "publications"].includes(
      cursor.collection,
    ) ||
    !["history", "latest"].includes(cursor.view) ||
    !["postgres", "bridge"].includes(cursor.basis) ||
    typeof cursor.asOf !== "string" ||
    typeof cursor.after !== "string" ||
    !Number.isInteger(cursor.limit) ||
    cursor.limit < 1 ||
    cursor.limit > 100
  )
    throw new Error("invalid_cursor");
  return cursor;
}
export { projectPublic as publicRecord } from "./public-projection";
export async function publicApi(request: Request, collection: string) {
  if (
    process.env.PUBLIC_V2_API_ENABLED !== "true" ||
    !["elections", "entities", "events", "publications"].includes(collection)
  )
    return Response.json({ error: "not_found" }, { status: 404 });
  const headers = {
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "X-Content-Type-Options": "nosniff",
  };
  try {
    const secret = process.env.PUBLIC_API_CURSOR_SECRET;
    if (!secret || secret.length < 32)
      return Response.json(
        { error: "api_unconfigured" },
        { status: 503, headers },
      );
    const budget = await requestLimit(
      request,
      "public-api",
      600,
      60,
      60,
      secret,
    );
    if (!budget.allowed)
      return Response.json(
        { error: "rate_limited" },
        {
          status: 429,
          headers: { ...headers, "Retry-After": String(budget.retryAfter) },
        },
      );
    if (!secret || secret.length < 32)
      return Response.json(
        { error: "api_unconfigured" },
        { status: 503, headers },
      );
    const workspace = await getWorkspaceRegistry();
    if (workspace.state === "unavailable")
      return Response.json(
        { error: "election_registry_unavailable" },
        { status: 503, headers },
      );
    const elections = [
      ...ELECTIONS,
      ...(workspace.registry?.workspaces.flatMap((item) =>
        item.definition && !ELECTIONS.some((old) => old.id === item.id)
          ? [item.definition]
          : [],
      ) ?? []),
    ];
    const url = new URL(request.url),
      electionId =
        url.searchParams.get("election") ??
        workspace.registry?.currentElectionId ??
        currentElection().id,
      view = url.searchParams.get("view") ?? "latest";
    const locale = url.searchParams.get("lang") ?? "en";
    if (!EMAIL_LOCALES.includes(locale as EmailLocale))
      return Response.json(
        { error: "invalid_locale" },
        { status: 400, headers },
      );
    if (
      !elections.some((election) => election.id === electionId) ||
      !["history", "latest"].includes(view)
    )
      return Response.json(
        { error: "invalid_selection" },
        { status: 400, headers },
      );
    const limit = Math.max(
      1,
      Math.min(
        100,
        Number(
          url.searchParams.get("limit") ??
            (collection === "publications" ? 10 : 50),
        ),
      ),
    );
    if (!Number.isInteger(limit))
      return Response.json(
        { error: "invalid_limit" },
        { status: 400, headers },
      );
    if (collection === "publications" && limit > 20)
      return Response.json(
        { error: "invalid_limit" },
        { status: 400, headers },
      );
    const encoded = url.searchParams.get("cursor"),
      cursor = encoded ? decodeCursor(encoded, secret) : null;
    if (
      cursor &&
      (cursor.collection !== collection ||
        cursor.electionId !== electionId ||
        cursor.view !== view ||
        cursor.limit !== limit ||
        (cursor.locale ?? "en") !== locale)
    )
      throw new Error("invalid_cursor");
    const repository =
      process.env.POLITICAL_RECORD_PUBLIC_READ_ENABLED === "true" &&
      ["events", "publications"].includes(collection)
        ? configuredPoliticalRecords()
        : null;
    if (repository) {
      try {
        if (cursor && cursor.basis !== "postgres")
          return Response.json(
            { error: "snapshot_changed" },
            { status: 409, headers },
          );
        const page = await repository.page({
          kind: collection === "events" ? "event" : "publication",
          electionId,
          includeGlobal: collection === "publications",
          view: view as Cursor["view"],
          after: cursor?.after ?? "0",
          asOf: cursor?.asOf,
          limit,
        });
        const next: Cursor = {
          collection: collection as ApiCollection,
          electionId,
          view: view as Cursor["view"],
          asOf: page.asOf,
          after: page.after,
          basis: "postgres",
          limit,
          locale: locale as EmailLocale,
        };
        const current =
          collection === "events" && view === "latest"
            ? await getElectionLifecycle({ electionId })
            : null;
        const records = await Promise.all(
          page.records.map(async (record) => {
            if (collection === "publications")
              return projectPublication(
                repository,
                record,
                locale as EmailLocale,
                new Date().toISOString(),
                view as "latest" | "history",
              );
            if (view === "history") return { ...record, currentState: false };
            if (collection === "events") {
              const event = (
                record.payload as { event?: Partial<PoliticalEvent> }
              ).event;
              const currentEvent = current?.politics.events.find(
                (item) =>
                  item.id === event?.id && item.revision === event?.revision,
              );
              const visible =
                record.status === "confirmed" &&
                !!event?.id &&
                !!currentEvent &&
                Array.isArray(event.sources) &&
                event.sources.length > 0 &&
                sourceBinding(event.sources) ===
                  sourceBinding(currentEvent.sources);
              return visible
                ? { ...record, currentState: true }
                : {
                    ...record,
                    payload: { withheld: true },
                    currentState: false,
                  };
            }
            return {
              ...record,
              payload: { withheld: true },
              currentState: false,
            };
          }),
        );
        return revalidatedJson(
          request,
          {
            schemaVersion: 2,
            locale,
            electionId,
            storage: "postgres",
            historyReady: true,
            projection:
              view === "history"
                ? "historical_records"
                : "qualified_current_or_withheld",
            asOfCursor: page.asOf,
            snapshotCursor: encodeCursor(
              { ...next, after: cursor?.after ?? "0" },
              secret,
            ),
            nextCursor: page.more ? encodeCursor(next, secret) : null,
            records: publicRecord(records),
            rights: API_RIGHTS,
          },
          headers,
        );
      } finally {
        try {
          await repository.close();
        } catch {
          /* Cleanup failure must not invalidate an already-formed public response. */
        }
      }
    }
    if (collection === "publications")
      return Response.json(
        {
          schemaVersion: 2,
          electionId,
          storage: "unconfigured",
          historyReady: false,
          records: [],
          rights: API_RIGHTS,
          error: "durable_publications_unavailable",
        },
        { status: 503, headers },
      );
    const lifecycle =
      collection === "events"
        ? await getElectionLifecycle({ electionId })
        : null;
    if (collection === "events" && !lifecycle)
      return Response.json(
        { error: "current_evidence_unavailable" },
        { status: 503, headers },
      );
    if (collection === "events" && view === "history")
      return Response.json(
        { error: "durable_history_unavailable" },
        { status: 503, headers },
      );
    if (collection === "entities" && electionId !== currentElection().id)
      return Response.json(
        { error: "election_entities_unqualified" },
        { status: 503, headers },
      );
    const records =
      collection === "elections"
        ? elections
        : collection === "entities"
          ? parties.parties.map((party) => ({
              id: `party:${party.id}`,
              partyId: party.id,
              name: party.name,
              short: party.short,
              recordType: "party_reference",
              electionId,
            }))
          : lifecycle!.politics.events;
    const asOf = recordHash(records);
    if (cursor && (cursor.basis !== "bridge" || cursor.asOf !== asOf))
      return Response.json(
        { error: "snapshot_changed" },
        { status: 409, headers },
      );
    const after = Number(cursor?.after ?? 0);
    if (!Number.isSafeInteger(after) || after < 0)
      throw new Error("invalid_cursor");
    const next: Cursor = {
      collection: collection as ApiCollection,
      electionId,
      view: view as Cursor["view"],
      asOf,
      after: String(after + limit),
      basis: "bridge",
      limit,
      locale: locale as EmailLocale,
    };
    return revalidatedJson(
      request,
      {
        schemaVersion: 2,
        locale,
        electionId,
        storage:
          collection === "events" ? "redis_current_only" : "reference_registry",
        historyReady: false,
        asOfCursor: asOf,
        snapshotCursor: encodeCursor({ ...next, after: String(after) }, secret),
        nextCursor:
          after + limit < records.length ? encodeCursor(next, secret) : null,
        records: publicRecord(records.slice(after, after + limit)),
        rights: API_RIGHTS,
      },
      headers,
    );
  } catch (error) {
    unstable_rethrow(error);
    return Response.json(
      {
        error:
          error instanceof Error && error.message === "invalid_cursor"
            ? "invalid_cursor"
            : "api_unavailable",
      },
      {
        status:
          error instanceof Error && error.message === "invalid_cursor"
            ? 400
            : 503,
        headers,
      },
    );
  }
}
