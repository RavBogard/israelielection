import CoalitionBuilder from "../CoalitionBuilder";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  ElectionLifecycleSnapshot,GeographySnapshot,
  SharedSeatContext,
} from "@/lib/election-lifecycle/types";
import { LANGS } from "@/lib/i18n";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import { FORMATION } from "@/lib/i18n/formation-live";
import CurrentParliament from "./CurrentParliament";
import GovernmentLive from "../government/GovernmentLive";
import { geographyToElection } from "@/lib/geography-view";
const context: SharedSeatContext = {
  schemaVersion: 1,
  election: "2026-10-27",
  revision: "a".repeat(64),
  snapshotRevision: "b".repeat(64),
  sequence: 3,
  updatedAt: "2026-10-29T00:00:00Z",
  evidenceStage: "official",
  basis: "official_seats",
  seatStatus: "official",
  pointMethod: "published_official_allocation",
  pointSeats: { a: 50, b: 40, new: 30 },
  parties: [
    { id: "a", label: "Alpha", profiled: true },
    { id: "b", label: "Beta", profiled: true },
    { id: "new", label: "Unprofiled list", profiled: false },
  ],
  sourceRefs: [],
  publishedAt: "2026-10-29",
  observedAt: "2026-10-29T00:00:00Z",
  correctionOf: null,
  freshness: { status: "complete", checkedAt: null, lastAttemptAt: null },
  reasonCodes: [],
};
const scenarios = [
  {
    id: "s",
    title: "Hypothetical path",
    titleLang: "en" as const,
    href: "/coalition-builder?with=a&support=new&abstain=b",
    roles: [],
    warnings: [],
    sourceUrl: "https://example.org",
  },
];
const snapshot: ElectionLifecycleSnapshot = {
  selection: {
    mode: "current",
    seatRevision: context.revision,
    politics: "current",
  },
  schemaVersion: 1,
  election: context.election,
  revision: "c".repeat(64),
  sequence: 3,
  updatedAt: context.updatedAt,
  seatContext: context,
  alternatives: [],
  health: [],
  archive: { electionForecast: "complete", completedAt: context.updatedAt },
  geographyRevision: null,
  politics: {
    activeProposalId: "A",
    proposals: [
      {
        id: "A",
        person: "Nominee Alpha",
        decisions: [{ partyId: "a", decision: "support", sourceEventIds: [] }],
      },
    ],
    activeStages: [],
    events: [],
    decisions: [],
    clock: null,
    withheldCount: 0,
    status: "active",
  },
};
describe("lifecycle views", () => {
  it("shows exact all120-seat scenario arithmetic with a pinned role-preserving link", () => {
    const html = renderToStaticMarkup(
      createElement(CurrentParliament, {
        initial: context,
        lang: "en",
        names: {},
        scenarios,
      }),
    );
    expect(html).toContain("Unprofiled list");
    expect(html).toContain("<b>80</b> Yes");
    expect(html).toContain("<b>0</b> No");
    expect(html).toContain("40 Abstaining");
    expect(html).toContain(`context=${context.revision}`);
    expect(html).toContain("support=new");
    expect(html).not.toContain("80%");
  });
  it("orders confirmed proposal positions before hypothetical scenarios, keeps undecided separate", () => {
    const html = renderToStaticMarkup(
      createElement(GovernmentLive, {
        initial: snapshot,
        lang: "en",
        names: {},
        scenarios,
      }),
    );
    expect(html.indexOf("Nominee Alpha")).toBeLessThan(
      html.indexOf("Hypothetical path"),
    );
    expect(html).toContain("Outside confidence support");
    expect(html).toContain("Undecided / no confirmed position");
    expect(html).toContain("Unprofiled list (30)");
  });
  it("does not present stored claims or a clock while sources are unavailable", () => {
    const unavailable = {
      ...snapshot,
      politics: {
        ...snapshot.politics,
        status: "source_unavailable" as const,
        clock: {
          kind: "mandate" as const,
          anchorAt: context.observedAt,
          deadlineAt: "2026-11-26T00:00:00Z",
          sourceEventIds: [],
          holder: "Hidden holder",
        },
      },
    };
    const html = renderToStaticMarkup(
      createElement(GovernmentLive, {
        initial: unavailable,
        lang: "en",
        names: {},
        scenarios,
      }),
    );
    expect(html).toContain(LIFECYCLE.en.noClaims);
    expect(html).not.toContain("Nominee Alpha");
    expect(html).not.toContain("Hidden holder");
    expect(html).toContain("Unprofiled list");
  });
  it("renders every edition's same official status and negotiation question", () => {
    for (const lang of LANGS) {
      const html = renderToStaticMarkup(
        createElement(GovernmentLive, {
          initial: snapshot,
          lang,
          names: {},
          scenarios,
        }),
      );
      expect(html).toContain(LIFECYCLE[lang].officialResult);
      expect(html).toContain(LIFECYCLE[lang].negotiations);
      expect(html).toContain(FORMATION[lang].hypothesis);
    }
  });
  it("shows a formerly inactive profiled list with new official seats and no campaign status substitute", () => {
    const c = { ...context, pointSeats: { likud: 55, yashar: 60, bw: 5 } };
    const html = renderToStaticMarkup(
      createElement(CoalitionBuilder, { initialContext: c }),
    );
    expect(html).toContain("Blue and White");
    expect(html).not.toContain("Below the threshold in every recent poll");
    expect(html).toContain("CEC-published seats");
  });
  it("resolves national seat metadata from the matching official revision instead of inventing zero",()=>{const geo:GeographySnapshot={schemaVersion:1,election:context.election,revision:"g",observedAt:context.observedAt,source:{id:"cec",publisher:"CEC",title:"Current localities",url:"https://example.org",authority:"cec",publishedAt:context.publishedAt,observedAt:context.observedAt,captureHash:"g"},complete:true,coverage:"documented_complete",officialSeatRevision:context.revision,lists:Object.keys(context.pointSeats).map(id=>({id,letters:id,name:id})),rows:[{code:1,eligible:330,voted:300,valid:300,votes:{a:100,b:100,new:100}}],envelopes:{valid:0,votes:{a:0,b:0,new:0}},totals:{eligible:330,voted:300,valid:300}};expect(geographyToElection(geo)).toBeNull();expect(geographyToElection(geo,{...context,revision:"other"})).toBeNull();expect(geographyToElection(geo,context)?.lists.map(p=>p.seats)).toEqual([50,40,30]);});
  it("never supplies2026map geometry from an incomplete or unreconciled count", () => {
    expect(
      geographyToElection({
        schemaVersion: 1,
        election: "2026-10-27",
        revision: "x",
        observedAt: context.observedAt,
        source: {
          id: "x",
          publisher: "CEC",
          title: "CSV",
          url: "https://example.org",
          authority: "cec",
          publishedAt: null,
          observedAt: context.observedAt,
          captureHash: "x",
        },
        complete: false,
        coverage: "unknown",
        lists: [],
        rows: [],
        envelopes: { valid: 0, votes: {} },
        totals: { eligible: 0, voted: 0, valid: 0 },
        officialSeatRevision: null,
      }),
    ).toBeNull();
  });
});
