"use client";

import Link from "next/link";
import { compareHref, dependence, dependenceText, type StanceMap } from "@/lib/cohesion";
import { governing, governingSummary, rowText, type GovRow, type Unstated, type UnstatedMap } from "@/lib/coalition-governing";
import { AXES } from "@/lib/compare";
import type { Party, Poll } from "@/lib/types";
import { partyColor } from "@/lib/party-colors";
import builder from "@/lib/i18n/builder";
import { useLang } from "@/lib/i18n/lang";
import { partyText } from "@/lib/i18n/overlays";
import StanceSlots, { type SlotColumn } from "../StanceSlots";
import { En, Loc } from "./Loc";

/*
 * Can they govern together? In the Builder's panel: one line on the questions every chosen party has
 * answered, then (folded) each question with two or more answers as a stance strip and its reading, the
 * thin ones in one quiet line, then how much a majority depends on each partner. Nothing here is a score.
 * In the Hebrew edition the page passes the map and the unstated notes already localized (lib/cohesion
 * localizeStanceMap); each label carries the language it is in.
 */

/** The strip at thumbnail scale: stance slots in the issue's order, parties as squares (faded when not said publicly), the unanswered at the end. */
function Glyph({ r, map }: { r: GovRow; map: StanceMap }) {
  const cols: SlotColumn[] = map[r.key].stances.map((s) => ({
    marks: r.answers.filter((a) => a.stance === s.id).map((a) => ({ key: a.id, color: a.unstated ? `color-mix(in srgb, ${partyColor(a.id)} 40%, transparent)` : partyColor(a.id) })),
  }));
  if (r.missing.length) cols.push({ quiet: true, marks: r.missing.map((id) => ({ key: id, color: "" })) });
  return <StanceSlots cols={cols} />;
}

const basis = (u: Unstated) => `${u.text} ${u.source}${u.date ? `, ${u.date}` : ""}`;

export default function Governing({ sel, parties, poll, map, unstated = {}, withOutsideSupport = false }: { sel: Set<string>; parties: Party[]; poll: Poll; map: StanceMap; unstated?: UnstatedMap; withOutsideSupport?: boolean }) {
  const lang = useLang();
  const T = builder[lang];
  const ids = parties.filter((p) => sel.has(p.id)).map((p) => p.id);
  const nameOf = (id: string) => { const p = parties.find((x) => x.id === id); return p ? partyText(p, "name", lang).text : id; };
  const labelOf = (key: string) => map[key].label ?? AXES.find((a) => a.key === key)?.label ?? key;
  /** An issue label, marked when it fell back to English in the Hebrew edition. */
  const label = (k: string) => <Loc v={{ text: labelOf(k), lang: map[k].labelLang ?? lang }} page={lang} />;
  if (ids.length < 2) {
    return (
      <section className="together" aria-labelledby="together-h">
        <h3 id="together-h" className="sec-h3">{T.govHead}</h3>
        <p className="empty">{T.govEmpty}</p>
      </section>
    );
  }
  const g = governing(map, unstated, ids);
  const shown = g.rows.filter((r) => r.reach === "every" || r.reach === "some").sort((a, b) => (a.reach === "every" ? 0 : 1) - (b.reach === "every" ? 0 : 1));
  const thin = g.rows.filter((r) => r.reach === "thin");
  const unsorted = g.rows.filter((r) => r.reach === "unsorted");
  const dep = dependenceText(dependence(sel, parties, poll), nameOf, T);
  return (
    <section className="together" aria-labelledby="together-h">
      <h3 id="together-h" className="sec-h3">{T.govHead}</h3>
      <details className="gov-fold">
        <summary><span className="sum">{governingSummary(g, T)}</span><span className="hint">{T.govHint}</span></summary>
        {withOutsideSupport && <p className="note">{T.govWithSupport}</p>}
        {shown.length > 0 && (
          <ol className="rows">
            {shown.map((r) => {
              const quiet = r.answers.filter((a) => a.unstated);
              return (
                <li key={r.key} className={r.reach}>
                  <Link href={`${compareHref(ids, lang)}#issue-${r.key}`}>
                    <span className="lbl">{label(r.key)}</span>
                    <Glyph r={r} map={map} />
                    <span className="read">{rowText(r, nameOf, ids.length, T)}</span>
                  </Link>
                  {quiet.map((a) => (
                    <details key={a.id} className="uns" title={basis(a.unstated!)}>
                      <summary>{T.govUnstated(nameOf(a.id))}</summary>
                      <p>
                        <Loc v={{ text: a.unstated!.text, lang: a.unstated!.lang ?? lang }} page={lang} />{" "}
                        <En page={lang}>{a.unstated!.url ? <a href={a.unstated!.url}>{a.unstated!.source}</a> : a.unstated!.source}</En>
                        {a.unstated!.date ? `, ${a.unstated!.date}` : ""}
                      </p>
                    </details>
                  ))}
                </li>
              );
            })}
          </ol>
        )}
        {thin.length > 0 && <p className="thin">{T.govThin(thin.length, thin.map((r) => labelOf(r.key)))}</p>}
        {unsorted.length > 0 && <p className="thin">{T.govUnsorted(unsorted.map((r) => labelOf(r.key)))}</p>}
        <p className="fig-note">{T.govNote}</p>
      </details>
      {dep && <p className="dep">{T.govDep(dep)}</p>}
      <p className="more">
        <Link href={compareHref(ids, lang)}>{T.govCompare}</Link>
      </p>
    </section>
  );
}
