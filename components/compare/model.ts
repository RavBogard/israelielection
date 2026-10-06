import { standingOf, type Issue, type Stance } from "@/lib/cohesion";
import { AXES, type AxisKey, type PositionRow } from "@/lib/compare";
import questions from "@/data/comparison-questions.json";
import gaza from "@/data/gaza-security-evidence.json";
import type { Lang } from "@/lib/i18n";
import compareText from "@/lib/i18n/compare";
import type { Localized } from "@/lib/i18n/localize";
import { OVERLAYS, overlayText, positionText, questionText } from "@/lib/i18n/overlay-text";
import { comparisonIssues, isRecord, isUnstated, ISSUES } from "@/lib/positions";
import { CATEGORY_TINTS, rampColor, whiteOn } from "./ramp";

/** Where a stance sits on its row's scale, 0 to 1, or null when the options are not a scale. */
export type MatrixStance = Stance & { n: number; position: number | null; count: number };

export type MatrixCell =
  | { kind: "stance"; stance: string; n: number; position: number | null; record: boolean; unstated: boolean }
  | { kind: "declined" }
  /** The sources hold the list's words, but they do not match one of the question's options. */
  | { kind: "unsorted" }
  | { kind: "none" };

export type MatrixRow = {
  key: string;
  label: string;
  question: string | null;
  /** 0: one of the seven issues; 1: a narrower question under the issue above it. */
  depth: 0 | 1;
  /** The options are ordered from one end to the other; false for priorities that can coexist. */
  scale: boolean;
  stances: MatrixStance[];
  cells: Record<string, MatrixCell>;
  issue: Issue;
  /** The issue page, for the seven issues. */
  page: string | null;
};

const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const PAGES: Record<AxisKey, string> = {
  draft: "haredi-draft", courts: "courts", war: "war-hostages", wb: "west-bank", relig: "religion-state", econ: "economy", pstate: "palestinian-state",
};

function cellsOf(rows: PositionRow[], stances: MatrixStance[], ids: string[]): Record<string, MatrixCell> {
  const out: Record<string, MatrixCell> = {};
  for (const id of ids) {
    const row = rows.find((r) => r.party === id);
    const s = standingOf(row, stances);
    if (s.kind === "stance") {
      const st = stances.find((x) => x.id === s.stance)!;
      out[id] = { kind: "stance", stance: st.id, n: st.n, position: st.position, record: isRecord(row), unstated: isUnstated(row) };
    } else out[id] = { kind: s.kind };
  }
  return out;
}

const count = (rows: PositionRow[], id: string, ids: string[]) => rows.filter((r) => r.stance === id && ids.includes(r.party) && standingOf(r, [{ id, label: "" }]).kind === "stance").length;

/**
 * The comparison as a matrix: the seven issues in the order the profile tiles use, each followed by
 * the narrower questions classified under it, then Gaza. An issue's options are ordered in its file
 * from one end of the debate to the other, so a stance's shade is its place in that order, the same
 * shade the party profiles draw. A narrower question has no order of its own: its options are ranked
 * by where the lists holding them sit on the issue above, so the shades keep the parent's direction.
 * A question with one recorded option takes its holders' average place. An option none of whose
 * holders has a place on the parent issue goes last rather than being guessed into the middle.
 */
export function matrixRows(ids: string[]): MatrixRow[] {
  const narrow = comparisonIssues();
  const out: MatrixRow[] = [];
  for (const axis of AXES) {
    const file = ISSUES[axis.key];
    const scale = axis.key !== "econ";
    const base = file.stances ?? [];
    const stances: MatrixStance[] = base.map((s, i) => ({ ...s, n: i + 1, position: scale && base.length > 1 ? i / (base.length - 1) : null, count: count(file.rows, s.id, ids) }));
    const cells = cellsOf(file.rows, stances, ids);
    out.push({ key: axis.key, label: axis.label, question: file.question?.trim() || null, depth: 0, scale, stances, cells, issue: { key: axis.key, label: axis.label, file }, page: `/issues/${PAGES[axis.key]}` });

    for (const q of narrow.filter((i) => i.key !== axis.key && i.key.startsWith(`${axis.key}-`))) {
      const qs = q.file.stances ?? [];
      // Each option's average place on the parent issue, over the lists that hold it.
      const place = (sid: string) => {
        const ps = q.file.rows.filter((r) => r.stance === sid).map((r) => cells[r.party]).filter((c): c is Extract<MatrixCell, { kind: "stance" }> => c?.kind === "stance" && c.position !== null).map((c) => c.position!);
        return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : Infinity;
      };
      const ranked = qs.map((s, i) => ({ s, i, p: place(s.id) })).sort((a, b) => a.p - b.p || a.i - b.i);
      const sub: MatrixStance[] = ranked.map(({ s, p }, i) => ({ ...s, n: i + 1, position: !scale ? null : ranked.length > 1 ? i / (ranked.length - 1) : Number.isFinite(p) ? p : 0.5, count: count(q.file.rows, s.id, ids) }));
      out.push({ key: q.key, label: sentence(q.label.replace(/^[^:]+:\s*/, "")), question: q.file.question?.trim() || null, depth: 1, scale, stances: sub, cells: cellsOf(q.file.rows, sub, ids), issue: q, page: null });
    }
  }
  const gaza = narrow.find((i) => i.key === "gaza-civilian");
  if (gaza) {
    const stances: MatrixStance[] = (gaza.file.stances ?? []).map((s, i) => ({ ...s, n: i + 1, position: null, count: count(gaza.file.rows, s.id, ids) }));
    out.push({ key: gaza.key, label: gaza.label, question: gaza.file.question?.trim() || null, depth: 0, scale: false, stances, cells: cellsOf(gaza.file.rows, stances, ids), issue: gaza, page: null });
  }
  return out;
}

/**
 * Fill for a stance: its place on the issue's scale (components/compare/ramp.ts: pomegranate at the first option to
 * forest at the last), fixed so light and dark modes agree. Options that are not a scale (priorities that can coexist)
 * take a light category tint by their number, with a 1px ink outline (UNORDERED_EDGE) and an ink numeral, so no tint
 * reads as a step of the scale. Hatched (declined) keeps its meaning. It is a background value, so set it as `background`.
 */
export function shade(position: number | null, n = 1): string {
  return position === null ? CATEGORY_TINTS[(Math.max(1, n) - 1) % CATEGORY_TINTS.length] : rampColor(position);
}
/** The outline every unordered mark carries, as an inset box-shadow so it does not change the mark's size. */
export const UNORDERED_EDGE = "inset 0 0 0 1px var(--ink)";

/** The numeral on a shaded cell: "light" (white) on the dark stretches of the scale, "dark" (black) on the light ones, ink on an unordered tint (each at least 4.5:1, pinned in ramp.test.ts). */
export const onShade = (position: number | null) => (position === null ? "ink" : whiteOn(rampColor(position)) ? "light" : "dark");

/** A row's words in one edition: what the matrix and the open row print. Each carries the language it is actually in. */
export type RowText = {
  label: Localized;
  question: Localized | null;
  /** The note under the open row, in parts (a narrower question adds its own note before the issue's). */
  note: Localized[];
  /** Stance id → label. */
  stances: Record<string, Localized>;
  /** Party id → the party's words (the row text the panel quotes). */
  said: Record<string, Localized>;
};

/** The data/positions file each of the seven issues reads (its overlay is data/he/positions/<file>.json). */
const FILES: Record<AxisKey, string> = { ...PAGES, econ: "economy" };

const local = (text: string): Localized => ({ text, lang: "he" });
const subLabel = (s: string) => s.replace(/^[^:]+:\s*/, "");

/**
 * The matrix's data text in Hebrew, read through lib/i18n/overlays: labels, questions, stance labels, notes and every
 * party's words. A field with no current Hebrew comes back as English (lang "en"), for the page to mark. The seven
 * issue labels are the comparison's own (lib/i18n/compare axes); the narrower questions and Gaza take theirs from data.
 */
export function matrixText(rows: MatrixRow[], lang: Lang): Record<string, RowText> {
  const T = compareText[lang];
  const out: Record<string, RowText> = {};
  for (const row of rows) {
    const axis = AXES.find((a) => a.key === row.key);
    const parent = AXES.find((a) => row.key.startsWith(`${a.key}-`));
    const q = questions.questions.find((x) => x.key === row.key);
    const stances: Record<string, Localized> = {};
    const said: Record<string, Localized> = {};
    let label: Localized, question: Localized | null = null;
    const note: Localized[] = [];
    if (axis) {
      const file = FILES[axis.key];
      const data = ISSUES[axis.key];
      label = local(T.axes[axis.key]);
      if (data.question?.trim()) question = positionText(file, data, "question", lang);
      (data.stances ?? []).forEach((s, i) => (stances[s.id] = positionText(file, data, `stances.${i}.label`, lang)));
      for (const r of data.rows) if (r.text?.trim()) said[r.party] = positionText(file, r, "text", lang, r.party);
      if (data.note) note.push(positionText(file, data, "note", lang));
    } else if (q && parent) {
      const file = FILES[parent.key];
      const data = ISSUES[parent.key];
      const l = questionText(q, "label", lang);
      label = l.lang === "en" ? { ...l, text: row.label } : { ...l, text: subLabel(l.text) };
      if (q.question?.trim()) question = questionText(q, "question", lang);
      q.stances.forEach((s, i) => (stances[s.id] = questionText(q, `stances.${i}.label`, lang)));
      for (const r of data.rows) if (r.text?.trim()) said[r.party] = positionText(file, r, "text", lang, r.party);
      note.push(questionText(q, "note", lang));
      if (data.note) note.push(positionText(file, data, "note", lang));
    } else {
      // Gaza: the evidence file is its own positions file, keyed "_" for its header and by party for its rows.
      const head = OVERLAYS.gaza["_"];
      label = overlayText(gaza.title, head?.title, lang);
      if (gaza.question?.trim()) question = overlayText(gaza.question, head?.question, lang);
      gaza.stances.forEach((s, i) => (stances[s.id] = overlayText(s.label, head?.[`stances.${i}.label`], lang)));
      for (const r of gaza.rows) if (r.text?.trim()) said[r.party] = overlayText(r.text, OVERLAYS.gaza[r.party]?.text, lang);
      if (gaza.note) note.push(overlayText(gaza.note, head?.note, lang));
    }
    out[row.key] = { label, question, note, stances, said };
  }
  return out;
}
