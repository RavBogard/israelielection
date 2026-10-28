import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { campaignContext } from "@/lib/election-lifecycle/resolver";
import { LANGS, type Lang } from "@/lib/i18n";
import { partyDirectoryText } from "@/lib/i18n/party-directory";
const state = vi.hoisted(() => ({
  lang: "en" as Lang,
  election: "2026-10-27" as string | null,
}));
vi.mock("@/lib/i18n/lang", () => ({ useLang: () => state.lang }));
vi.mock("@/components/seat-context/SeatContextProvider", () => ({
  useSeatContext: () => ({
    context: state.election
      ? {
          ...campaignContext(),
          election: state.election,
          ...(state.election === "il-knesset-27"
            ? {
                pointSeats: { likud: 100, mystery: 20 },
                parties: [
                  { id: "likud", label: "Likud", profiled: true },
                  { id: "mystery", label: "Future list", profiled: false },
                ],
              }
            : {}),
        }
      : null,
    refreshFailed: false,
  }),
}));
vi.mock("@/lib/list-shares-server", () => ({ listSharesForRender: async () => null }));
import { POST_RECORDS } from "@/lib/i18n/post-records";
import { fill } from "@/lib/i18n/post-count";
import BallotPage from "./BallotPage";
import PartiesIndexPage from "./PartiesIndexPage";
describe("seven-edition party and ballot routes", () => {
  it("never attaches another election's seats or unknown lists to the saved26 roster", async () => {
    for (const election of ["il-knesset-27", null]) {
      state.election = election;
      const html = renderToStaticMarkup(await BallotPage({ lang: "he" }));
      expect(html).toContain("bd-snapshot-note");
      expect(html).not.toContain('class="bd-seats"');
      expect(html).not.toContain('class="election-record"');
      expect(html).not.toContain("Future list");
      expect(html).toContain(POST_RECORDS.he.ballotNote);
    }
    state.election = "2026-10-27";
  });
  it("renders localized controls, official records and explicit original-source navigation", async () => {
    for (const lang of LANGS) {
      state.lang = lang;
      const ballot = renderToStaticMarkup(await BallotPage({ lang })),
        map = renderToStaticMarkup(await PartiesIndexPage({ lang })),
        t = partyDirectoryText(lang);
      expect(ballot).toContain(fill(POST_RECORDS[lang].ballotTitle, { n: 38 }));
      expect(ballot).toContain(t.coverage);
      expect(ballot).toContain(t.seatsFirst);
      expect(ballot).toContain(
        "https://www.gov.il/he/pages/candidates-lists-26",
      );
      expect(ballot).toContain(
        "https://www.gov.il/BlobFolder/guide/candidates-lists-26/he/Approved%20Voting%20Slips.pdf",
      );
      expect(ballot).toContain('lang="he"');
      expect(map).toContain(t.map);
      expect(map).toContain(t.method);
      if (lang !== "en") {
        expect(ballot).toContain("/ballot?original=en");
        expect(map).toContain("/parties?original=en");
        expect(map).toContain(`/${lang}/ballot`);
      }
    }
  });
});

describe("ballot: votes and share per list from the count", () => {
  it("shows votes and percent by ballot letters, including lists with no profile, and says so when a list has none", async () => {
    const { createElement } = await import("react");
    const { ListSharesProvider } = await import("@/components/list-status/ListSharesProvider");
    const BallotDirectory = (await import("@/components/BallotDirectory")).default;
    const { ballotLists } = await import("@/lib/ballot");
    const unprofiled = ballotLists.find((l) => !l.profile)!;
    const profiled = ballotLists.find((l) => l.profile)!;
    state.election = "2026-10-27";
    const shares = { byParty: {}, byLetters: { [unprofiled.letters]: 0.0123 }, votesByLetters: { [unprofiled.letters]: 54321 } };
    const html = renderToStaticMarkup(createElement(ListSharesProvider, { shares, children: createElement(BallotDirectory, { lang: "en" }) }));
    expect(html).toContain("54,321 votes, 1.2%, count so far");
    expect(html).toContain('data-testid="ballot-votes"');
    expect(html).toContain("No votes in the count so far");
    expect(profiled.letters).toBeTruthy();
  });
});
