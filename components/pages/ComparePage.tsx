import "@/components/article/article.css";
import Compare, { type CompareParty, type Preset } from "@/components/Compare";
import { matrixRows, matrixText } from "@/components/compare/model";
import PageHead from "@/components/PageHead";
import { averagePoll, blocs, parties } from "@/lib/data";
import type { Lang } from "@/lib/i18n";
import compareText from "@/lib/i18n/compare";
import { blocText, partyText } from "@/lib/i18n/overlays";
import { lettersOf } from "@/lib/letters";
import { outgoingGovernment } from "@/lib/outgoing-government";

const listed = parties.filter((p) => p.coalitionCard !== "hidden");
const ids = listed.map((p) => p.id);

/** The core opposition lists are the four Jewish-majority lists polled into the Knesset. */
const CORE_OPPOSITION = ["yashar", "byachad", "dem", "yb"];

const rows = matrixRows(ids);

/** The comparison page (/compare, /he/compare). Hebrew reads every data string through lib/i18n/overlays. */
export default function ComparePage({ lang }: { lang: Lang }) {
  const T = compareText[lang];
  const he = lang === "he";
  const pickable: CompareParty[] = listed.map((p) => ({
    id: p.id,
    name: he ? partyText(p, "name", lang) : p.name,
    bloc: p.bloc,
    letters: lettersOf[p.id] ?? null,
    seats: averagePoll.results[p.id]?.seats ?? null,
    out: p.coalitionCard === "out",
  }));
  // The column sets a reader is likely to ask about.
  const presets: Preset[] = [
    { label: T.presets.all, ids },
    { label: T.presets.net, ids: ids.filter((id) => parties.find((p) => p.id === id)!.bloc === "net") },
    { label: T.presets.opp, ids: ids.filter((id) => parties.find((p) => p.id === id)!.bloc === "opp") },
    { label: T.presets.core, ids: CORE_OPPOSITION.filter((id) => ids.includes(id)) },
    { label: T.presets.outgoing, ids: outgoingGovernment.with.filter((id) => ids.includes(id)) },
  ];
  return (
    <div className="wrap article-page">
      <PageHead title={T.title} standfirst={<>{T.standfirst}</>} />

      <Compare
        parties={pickable}
        blocs={he ? blocs.map((b) => ({ id: b.id, label: blocText(b, lang) })) : blocs}
        rows={rows}
        presets={presets}
        defaults={ids}
        text={he ? matrixText(rows, lang) : undefined}
      />
    </div>
  );
}
