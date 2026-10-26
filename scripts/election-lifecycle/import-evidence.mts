/** Emergency primary-capture import, not an editable seat/event upload API. Preview dry-run is the default. */
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { validatePrimaryCapture } from "../../lib/election-lifecycle/capture";
import {
  officialOptions,
  parseOfficialSeats,
} from "../../lib/election-lifecycle/official";
import { extractEvents } from "../../lib/election-lifecycle/extract";
import { mergeEvents } from "../../lib/election-lifecycle/events";
import { articleOf } from "../../lib/election-lifecycle/html";
import {
  emptyLedger,
  resolveLifecycle,
} from "../../lib/election-lifecycle/resolver";
import { appendSnapshots } from "../../lib/election-lifecycle/bridge";
import {
  healthRecord,
  sourceRecord,
} from "../../lib/election-lifecycle/acquisition";
import { lifecycleStore } from "../../lib/election-lifecycle/store";
import type {
  Authority,
  PoliticalEvent,
  SharedSeatContext,
} from "../../lib/election-lifecycle/types";
const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const file = arg("--file"),
  url = arg("--url"),
  target = arg("--target") ?? "preview",
  apply = process.argv.includes("--apply");
if (!file || !url)
  throw new Error(
    "Provide --file captured-primary.html and --url exact original HTTPS primary URL.",
  );
if (!["preview", "production", "development"].includes(target))
  throw new Error("Invalid target environment");
if (target === "production" && !process.argv.includes("--confirm-production"))
  throw new Error(
    "Production import requires --target production --confirm-production explicitly.",
  );
if (
  process.env.ELECTION_LIFECYCLE_NAMESPACE &&
  process.env.ELECTION_LIFECYCLE_NAMESPACE !== target
)
  throw new Error("Existing namespace conflicts with explicit import target");
process.env.VERCEL_ENV = target;
const { body, isCEC, registered } = validatePrimaryCapture(
  fs.readFileSync(file, "utf8"),
  url,
);
const operator = arg("--operator");
if (apply && !operator)
  throw new Error("Apply requires --operator for the private import audit");
const now = new Date().toISOString(),
  store = lifecycleStore();
const pendingSeats: SharedSeatContext[] = [],
  pendingEvents: PoliticalEvent[] = [];
let ledger = store ? ((await store.load()) ?? emptyLedger()) : emptyLedger();
// Stored ledgers normally omit raw captures; never relabel an existing audit.
ledger.captures = [];
if (isCEC) {
  const snapshot = parseOfficialSeats(body, officialOptions(now, url));
  pendingSeats.push(snapshot);
  snapshot.sourceRefs[0].title += " (captured primary evidence)";
  appendSnapshots(ledger, [snapshot]);
  ledger.captures.push({ source: snapshot.sourceRefs[0], body });
  ledger.health = [
    ...ledger.health.filter((h) => h.sourceId !== "cec-official"),
    healthRecord("cec-official", "cec", "healthy", now),
  ];
} else if (registered) {
  const article = articleOf(body);
  if (!article.body)
    throw new Error(
      "No supported primary article body; PDF/image/text-only captures need a verified adapter, never hand-entered seat claims",
    );
  const id = registered.id + ":" + Buffer.from(url).toString("base64url"),
    source = {
      ...sourceRecord(
        id,
        registered.publisher,
        url,
        registered.authority as Authority,
        body,
        now,
        article.title + " (captured primary evidence)",
      ),
      partyIds: registered.partyIds,
      publishedAt: article.publishedAt,
    };
  const events = await extractEvents(source, article.body, now, ledger.events);
  if (!events.length)
    throw new Error("No exact authoritative events passed validation");
  pendingEvents.push(...events);
  ledger.events = mergeEvents(ledger.events, events);
  ledger.captures.push({ source, body });
  ledger.health = [
    ...ledger.health.filter((h) => h.sourceId !== id),
    healthRecord(id, source.authority, "healthy", now),
  ];
}
for (const capture of ledger.captures)
  capture.importAudit = {
    operator: operator ?? "dry-run",
    capturedAt: now,
    sourceUrl: url,
    target,
    kind: "captured_primary",
  };
ledger.current = resolveLifecycle(ledger, now);
console.log(
  JSON.stringify({
    target,
    apply,
    revision: ledger.current.revision,
    seatBasis: ledger.current.seatContext.basis,
    visibleEvents: ledger.current.politics.events.length,
    captureHashes: ledger.captures.map((c) => c.source.captureHash),
  }),
);
if (apply) {
  if (!store) throw new Error("Durable credentials required for apply");
  const delivery =
    "captured:" + ledger.captures.map((c) => c.source.captureHash).join(":");
  if (await store.delivered(delivery)) {
    console.log(JSON.stringify({ status: "duplicate", target }));
    process.exit(0);
  }
  const token = randomUUID();
  if (!(await store.lock(token)))
    throw new Error("Worker currently owns publication; retry later");
  try {
    if (await store.delivered(delivery))
      throw new Error("Capture already published; no duplicate write");
    const pendingCaptures = ledger.captures,
      pendingHealth = ledger.health.filter((h) =>
        pendingCaptures.some((c) => c.source.id === h.sourceId),
      );
    const fresh = (await store.load()) ?? emptyLedger();
    appendSnapshots(fresh, pendingSeats);
    fresh.events = mergeEvents(fresh.events, pendingEvents);
    fresh.captures.push(...pendingCaptures);
    fresh.health = [
      ...fresh.health.filter(
        (h) => !pendingHealth.some((p) => p.sourceId === h.sourceId),
      ),
      ...pendingHealth,
    ];
    ledger = { ...fresh, current: resolveLifecycle(fresh, now) };
    if (!(await store.publish(token, ledger, delivery, now)))
      throw new Error("Publication lock expired");
  } finally {
    await store.unlock(token);
  }
}
