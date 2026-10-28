import { positionText, partyText } from "@/lib/i18n/overlays";
import compareCopy from "@/lib/i18n/compare";
import { editionPath } from "@/lib/i18n";
import { searchText } from "@/lib/i18n/search";
import { referenceText } from "@/lib/i18n/reference";
import type { Localized } from "@/lib/i18n/localize";
import { isRtl, type Lang } from "@/lib/i18n";
import { mediumDate } from "@/lib/format";
import { widgetText } from "@/lib/i18n/widgets";
import type { CSSProperties, ReactNode } from "react";
import {
  allCharts,
  allPositions,
  type Chart as ChartData,
  type ChartRow,
  type Positions,
} from "@/lib/articles";
import { averagePoll, parties } from "@/lib/data";
import { seatContextForRender } from "@/lib/seat-context-server";
import { POST_COUNT, seatBasisPhrase } from "@/lib/i18n/post-count";
import { POST_RECORDS } from "@/lib/i18n/post-records";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import { partyColor } from "@/lib/party-colors";
import { onShade, shade, UNORDERED_EDGE } from "../compare/model";
import { seatFigure } from "@/lib/polls";
import type { PositionRow } from "@/lib/compare";
import { isUnstated } from "@/lib/positions";
import { voteMapLink } from "./votemap-links";
import {
  chartText,
  type LabeledChart,
  DotPlot,
  Lines,
  Pairs,
  Sparklines,
  Stacks,
  formOf,
  heatMax,
  heatStyle,
  rowSource,
  unshaded,
} from "./ChartViz";
import { barRefs, transpose } from "@/lib/chart-form";
import SeatBar from "../SeatBar";
import MiniKey from "./MiniKey";

/*
 * The building blocks of a reference page, registered for every MDX file in
 * mdx-components.tsx. Charts and party tables are looked up by id in data/, so the
 * copy never carries a number without its source.
 */

const charts = allCharts();

/** Seats to one decimal (the One Number Rule); a total short of 61 never prints as 61.0. */
const seatsAt = (n: number) =>
  Number.isInteger(n) ? String(n) : n < 61 && seatFigure(n) === "61.0" ? "60.9" : seatFigure(n);
const majorityNote = (n: number) =>
  n >= 61 ? ", a majority" : n >= 60.5 ? ", short of 61" : "";
const positions = allPositions();

function SourceLine({
  source,
  url,
  date,
  sample,
}: {
  source: string;
  url: string;
  date: string;
  sample?: string;
}) {
  return (
    <>
      <a href={url}>{source}</a>, {date}
      {sample ? `, ${sample}` : ""}
    </>
  );
}

/** Notes are plain text; a bare URL in one becomes a short link named for its site, so it can wrap. */
function Linked({ text }: { text: string }) {
  const parts = text.split(/(https:\/\/[^\s)]+[^\s).,;:])/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? (
          <a key={i} href={part}>
            {new URL(part).hostname.replace(/^(www|en)\./, "")}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** A data/charts table as a table, with each percentage cell shaded by its size when `heat` is set. */
function NumbersTable({ c, heat }: { c: LabeledChart; heat: boolean }) {
  const top = heat ? heatMax(c) : 0;
  // Four or more shaded columns do not fit a phone: there each row becomes a card of labelled cells (article.css).
  const cards = heat && c.columns!.length >= 5;
  return (
    <div className="tw">
      <table
        dir={isRtl(c.lang ?? "en") ? "rtl" : "ltr"}
        className={heat ? `heat${cards ? " cards" : ""}` : undefined}
      >
        <caption className="sr-only">{chartText(c, c.title)}</caption>
        <thead>
          <tr>
            {c.columns!.map((h) => (
              <th key={h} scope="col">
                {chartText(c, h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {c.rows.map((r) => (
            <tr key={r.label}>
              <th scope="row">
                {chartText(c, r.label)}
                {rowSource(r)}
              </th>
              {r.cells!.map((x, i) => (
                <td
                  key={i}
                  data-col={cards ? chartText(c, c.columns![i + 1]) : undefined}
                  style={
                    heat && !unshaded(c.columns![i + 1] ?? "")
                      ? heatStyle(x, top)
                      : undefined
                  }
                >
                  {chartText(c, x)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A chart from data/charts: horizontal bars, or a table drawn as lines, a dot plot or a shaded table (see ChartViz). */
/** A section index's preview keeps a chart's first rows, plus a whole-country row, and its source; the page has the rest. */
const PREVIEW_ROWS = 4;
const NATIONAL = /whole country|all voters|israel as a whole|national/i;
function previewRows(c: ChartData, form: string) {
  if (
    form === "lines" ||
    form === "dots" ||
    form === "trend" ||
    form === "pairs" ||
    c.rows.length <= PREVIEW_ROWS + 1
  )
    return c.rows;
  const head = c.rows.slice(0, PREVIEW_ROWS);
  return [
    ...head,
    ...c.rows.slice(PREVIEW_ROWS).filter((r) => NATIONAL.test(r.label)),
  ];
}

export function Chart({
  id,
  compact,
  labels,
  lang = "en",
}: {
  id: string;
  compact?: boolean;
  labels?: Record<string, string>;
  lang?: Lang;
}) {
  const full = charts[id];
  if (!full) throw new Error(`Unknown chart "${id}" (see data/charts/)`);
  const form = formOf(full);
  const c: LabeledChart = {
    ...(compact ? { ...full, rows: previewRows(full, form) } : full),
    labels,
    lang,
  };
  const words = widgetText(lang);
  const cut = full.rows.length - c.rows.length;
  const unit = c.unit ?? "";
  const max =
    c.max ??
    (unit === "%" ? 100 : Math.max(...c.rows.map((r) => r.value ?? 0)));
  const print = (r: ChartRow) =>
    r.display
      ? chartText(c, r.display)
      : `${r.value}${unit === "%" ? "%" : unit ? ` ${chartText(c, unit)}` : ""}`;
  const bars = c.kind === "bars" ? barRefs(c, print) : null;
  const xOf = (v: number) => Math.max(0, Math.min(100, (v / max) * 100));
  const vm = compact ? null : voteMapLink(id);
  const drawn =
    form === "lines" ||
    form === "dots" ||
    form === "trend" ||
    form === "sparks" ||
    form === "pairs" ||
    form === "stack";
  return (
    <figure className="chart">
      <figcaption className="ct" dir="auto">
        {chartText(c, c.title)}
      </figcaption>
      {c.question && !compact && (
        <p className="cq">
          <Linked text={chartText(c, c.question)} />
        </p>
      )}
      {bars ? (
        <ul
          className={`bars${bars.refs.length ? " has-ref" : ""}`}
          style={
            {
              "--bv": `${Math.max(4, ...bars.rows.map((r) => print(r).length)) + 0.5}ch`,
            } as CSSProperties
          }
        >
          {bars.refs.length > 0 && (
            <li className="bref-l">
              <span className="bl" />
              <span className="bt">
                {bars.refs.map((f) => (
                  <span
                    key={f.label}
                    className={xOf(f.value) > 50 ? "to-l" : "to-r"}
                    style={
                      xOf(f.value) > 50
                        ? { right: `${100 - xOf(f.value)}%` }
                        : { left: `${xOf(f.value)}%` }
                    }
                  >
                    {f.label}
                  </span>
                ))}
              </span>
              <span className="bv" />
            </li>
          )}
          {bars.rows.map((r) => (
            <li key={r.label} title={`${chartText(c, r.label)}: ${print(r)}`}>
              <span className="bl">
                {chartText(c, r.label)}
                {rowSource(r)}
              </span>
              <span className="bt">
                <span
                  className="bf"
                  style={{ width: `${xOf(r.value ?? 0)}%` }}
                />
                {bars.refs.map((f) => (
                  <i
                    key={f.label}
                    className={`bref${f.heavy ? " heavy" : ""}`}
                    style={{ left: `${xOf(f.value)}%` }}
                    aria-hidden="true"
                  />
                ))}
              </span>
              <span className="bv">{print(r)}</span>
            </li>
          ))}
        </ul>
      ) : drawn ? (
        <>
          {form === "lines" ? (
            <Lines c={c} />
          ) : form === "trend" ? (
            <Lines c={transpose(c)} />
          ) : form === "sparks" ? (
            <Sparklines c={c} />
          ) : form === "pairs" ? (
            <Pairs c={c} />
          ) : form === "stack" ? (
            <Stacks c={c} />
          ) : (
            <DotPlot c={c} />
          )}
          {!compact && (
            <details
              className="cv-numbers"
              open={
                (form === "lines" || form === "pairs") &&
                c.rows.some((r) => !!r.source)
              }
            >
              <summary>
                {words.numbers}
                <span className="sr-only">: {chartText(c, c.title)}</span>
              </summary>
              <NumbersTable c={c} heat={false} />
            </details>
          )}
        </>
      ) : (
        <NumbersTable c={c} heat={form === "heat"} />
      )}
      {compact ? (
        <p className="fig-src cs">
          {cut > 0 &&
            `${c.rows.length} ${words.of} ${full.rows.length} ${words.rows} `}
          {words.source}: <SourceLine {...c} />
        </p>
      ) : (
        <p className="fig-src cs">
          {form === "heat" &&
            heatMax(c) > 0 &&
            `${words.strongest}: ${heatMax(c)}%${c.columns!.slice(1).some(unshaded) ? "; " + words.turnout : ""}. `}
          {words.source}: <SourceLine {...c} />
          {c.note && (
            <>
              . <Linked text={chartText(c, c.note)} />
            </>
          )}
        </p>
      )}
      {vm && (
        <p className="fig-src cs vm-link">
          <a href={vm.href} hrefLang="en">
            {lang === "en" ? vm.text : words.mapLink}
          </a>
        </p>
      )}
    </figure>
  );
}

const SEATS = 120;
type PositionRowData = Positions["rows"][number];

/**
 * What each party says on an issue, from data/positions/<issue>.json: first the Knesset split by
 * answer (each answer's lists' seats in the polling average on a 120-seat bar, shaded on the stance
 * ramp the profiles and Compare use), then each answer's lists with their words and sources.
 */
/** An issue's answers with the lists that gave each and their seats in the polling average, shared by the lead figure and the full block. */
function splitOf(issue: string, context: SharedSeatContext | null = null) {
  const p = positions[issue];
  if (!p)
    throw new Error(`Unknown positions table "${issue}" (see data/positions/)`);
  const stances = p.stances ?? [];
  const scale = issue !== "economy" && stances.length > 1;
  const at = (i: number) => (scale ? i / (stances.length - 1) : null);
  // Seat weights follow the shared seat context (the count projection, then official seats); the poll average only without one.
  const seats = (id: string) => (context ? context.pointSeats[id] ?? 0 : averagePoll.results[id]?.seats ?? 0);
  const hasText = (r: PositionRowData) =>
    !!r.text?.trim() &&
    !(r as PositionRow).declined &&
    r.status !== "declined" &&
    r.status !== "none";
  const groups = stances.map((st, i) => {
    const rows = p.rows.filter((r) => hasText(r) && r.stance === st.id);
    return {
      st,
      n: i + 1,
      pos: at(i),
      rows,
      seats: rows.reduce((a, r) => a + seats(r.party), 0),
    };
  });
  const rest = Math.max(0, SEATS - groups.reduce((a, g) => a + g.seats, 0));
  return { p, stances, scale, seats, hasText, groups, rest };
}

const onClass = (pos: number | null) => `on-${onShade(pos)}`;

/**
 * A segment's label starts at its left edge; when the 61 tick falls within its first eight seats (about
 * 20px on a phone), the label moves to just past the tick instead. Padding in percent is of the bar's
 * width, so the offset is exact at any width; a segment left without room for its label hides it
 * (sb-fit in seatbar.css), and the key under the bar carries it.
 */
function clearOfTick(start: number, seats: number) {
  const before = MAJORITY - start,
    after = start + seats - MAJORITY;
  return before > 0 && before < 8 && after > 0
    ? { paddingLeft: `calc(${(before / SEATS) * 100}% + 5px)` }
    : undefined;
}
const MAJORITY = 61;

/** The 120-seat bar: each answer's lists' seats in the polling average, shaded on the stance ramp, with the 61 tick. */
const inkOn = (pos: number | null) =>
  ({ ink: "#000", light: "#fff", dark: "#000" })[onShade(pos)];
function SplitBar({
  groups,
  rest,
  size = "l",
  basis = POST_COUNT.en.seatsInAverage,
}: Pick<ReturnType<typeof splitOf>, "groups" | "rest"> & { size?: "m" | "l"; basis?: string }) {
  return (
    <SeatBar
      className="ps-bar sb-fit"
      size={size}
      total={SEATS}
      segments={groups.map((g, i) => ({
        key: g.st.id,
        seats: g.seats,
        color: shade(g.pos, g.n),
        ink: inkOn(g.pos),
        label: g.n,
        title: `${g.st.label}: ${seatsAt(g.seats)} seats`,
        style:
          g.pos === null
            ? {
                ...clearOfTick(
                  groups.slice(0, i).reduce((a, x) => a + x.seats, 0),
                  g.seats,
                ),
                boxShadow: UNORDERED_EDGE,
              }
            : clearOfTick(
                groups.slice(0, i).reduce((a, x) => a + x.seats, 0),
                g.seats,
              ),
      }))}
      rest={{
        title: `No recorded answer, or below the threshold: ${seatFigure(rest)} seats`,
      }}
      label={`${basis[0].toUpperCase()}${basis.slice(1)} by answer: ${groups
        .filter((g) => g.seats > 0)
        .map((g) => `${g.st.label} ${seatsAt(g.seats)}`)
        .join(
          ", ",
        )}; no recorded answer or below the threshold ${seatFigure(rest)}. A majority is 61.`}
    />
  );
}

/**
 * The lead figure of an issue page, set under its title: where the Knesset splits on the issue,
 * each answer with its lists and their seats, before any prose. The full block lower on the page
 * carries each list's own words and sources.
 */
export async function PositionsLead({ issue }: { issue: string }) {
  const context = await seatContextForRender();
  const basis = seatBasisPhrase(context, "en");
  const { p, scale, groups, rest } = splitOf(issue, context);
  if (!groups.length) return null;
  const name = (id: string) => parties.find((x) => x.id === id)!.name;
  return (
    <figure className="positions ps-lead">
      <figcaption className="ct">
        Where the lists stand
        {p.question ? `: ${p.question.replace(/\?$/, "")}?` : ""}
      </figcaption>
      <SplitBar groups={groups} rest={rest} basis={basis} />
      <ul className="ps-legend">
        {groups
          .filter((g) => g.rows.length)
          .map((g) => (
            <li key={g.st.id}>
              <span
                className={`key ${onClass(g.pos)}`}
                style={{ background: shade(g.pos, g.n) }}
                aria-hidden
              >
                {g.n}
              </span>
              <span className="lab">
                <b>{g.st.label}</b>
                <span className="who">
                  {g.rows.map((r) => (
                    <a
                      key={r.party}
                      href={`/parties/${r.party}`}
                      className={
                        isUnstated(r as PositionRow) ? "unstated" : undefined
                      }
                      title={
                        isUnstated(r as PositionRow)
                          ? "Not said publicly: read from its record"
                          : undefined
                      }
                    >
                      <span
                        className="sw"
                        style={{ background: partyColor(r.party) }}
                        aria-hidden
                      />
                      {name(r.party)}
                      {isUnstated(r as PositionRow) && (
                        <span className="sr-only"> (not said publicly)</span>
                      )}
                    </a>
                  ))}
                </span>
              </span>
              <span className="gs">{seatsAt(g.seats)}</span>
            </li>
          ))}
      </ul>
      <p className="fig-note ps-note">
        {scale
          ? "Answers in order from one end of the debate to the other. "
          : "These priorities can coexist, so they are not ordered. "}
        {context ? `Figures are ${basis}; the tick is 61.` : "Seats are the current polling average; the tick is 61."}{" "}
        {groups.some((g) => g.rows.some((r) => isUnstated(r as PositionRow))) &&
          "A dotted outline marks a list that has not said its position publicly; it is read from the list's votes, deals or ministers' actions. "}
        <a href="#positions">Each list&apos;s own words and sources</a>.
      </p>
    </figure>
  );
}

/** An issue's split as a small figure for the Issues index: the bar and its largest answer. */
export async function SplitMini({ issue }: { issue: string }) {
  const context = await seatContextForRender();
  const basis = seatBasisPhrase(context, "en");
  const { groups, rest, scale } = splitOf(issue, context);
  if (!groups.length) return null;
  const top = [...groups].sort((a, b) => b.seats - a.seats)[0];
  return (
    <div className="ps-mini">
      <MiniKey
        items={groups
          .filter((g) => g.seats > 0)
          .map((g) => ({
            n: g.n,
            label: g.st.label,
            seats: `${seatsAt(g.seats)} seats`,
            color: shade(g.pos, g.n),
            ink: inkOn(g.pos),
          }))}
      >
        <SplitBar groups={groups} rest={rest} size="m" basis={basis} />
      </MiniKey>
      {scale && (
        <p className="ps-mini-ends" aria-hidden="true">
          {[groups[0], groups.at(-1)!].map((g) => (
            <span key={g.st.id}>
              <span
                className="k"
                style={{ background: shade(g.pos, g.n), color: inkOn(g.pos) }}
              >
                {g.n}
              </span>
              {g.st.label}
            </span>
          ))}
        </p>
      )}
      <p className="ps-mini-read">
        Largest answer: <b>{top.st.label}</b>, {seatsAt(top.seats)} seats
        {majorityNote(top.seats)}
      </p>
    </div>
  );
}

export async function Positions({
  issue,
  lang = "en",
}: {
  issue: string;
  lang?: Lang;
}) {
  const context = await seatContextForRender();
  const { p, stances, seats, hasText, groups } = splitOf(issue, context);
  const stamp = context ? (context.publishedAt ?? context.observedAt).slice(0, 10) : averagePoll.published;
  const T = compareCopy[lang],
    unit = searchText(lang).seats,
    words = widgetText(lang);
  const shown = (value: Localized) => (
    <span lang={value.lang} dir={value.lang === "en" ? "ltr" : undefined}>
      {value.text}
      {lang !== "en" && value.lang === "en" && (
        <small className="fig-src">. {referenceText(lang).pending}</small>
      )}
    </span>
  );
  const field = (key: string) => shown(positionText(issue, p, key, lang));
  const rowText = (r: PositionRowData) =>
    shown(positionText(issue, r, "text", lang, r.party));
  const listName = (id: string) => {
    const p = parties.find((x) => x.id === id)!;
    const v = partyText(p, "name", lang);
    return (
      <span lang={v.lang} dir={v.lang === "en" ? "ltr" : undefined}>
        {v.text}
      </span>
    );
  };
  const sorted = new Set(groups.flatMap((g) => g.rows.map((r) => r.party)));
  const unsorted = p.rows.filter((r) => hasText(r) && !sorted.has(r.party));
  const quiet = p.rows.filter((r) => !hasText(r));
  const name = (id: string) => parties.find((x) => x.id === id)!;
  const Entry = ({ r }: { r: PositionRowData }) => {
    const party = name(r.party);
    const unstated = isUnstated(r as PositionRow);
    // A list with no seats keeps its recorded position. Once the result is official it is greyed and marked as outside the Knesset; before that it only says "so far".
    const out = !!context && seats(party.id) === 0;
    const official = context?.seatStatus === "official";
    return (
      <li className={[unstated ? "unstated" : "", out && official ? "out" : ""].filter(Boolean).join(" ") || undefined}>
        <p className="pn">
          <span
            className="sw"
            style={{ background: partyColor(party.id) }}
            aria-hidden
          />
          <a
            href={
              editionPath(`/parties/${party.id}`, lang) ??
              `/parties/${party.id}`
            }
          >
            {listName(party.id)}
          </a>
          {seats(party.id) > 0 && (
            <span className="ps">
              {seatFigure(seats(party.id))} {unit}
            </span>
          )}
          {((r as PositionRow).declined || r.status === "declined") && (
            <span className="ps">{T.declined}</span>
          )}
          {out && (
            <span className="ps below" data-testid="stance-below" data-official={official ? "true" : "false"}>
              {official ? POST_RECORDS[lang].notInKnesset : POST_RECORDS[lang].belowSoFarTag}
            </span>
          )}
        </p>
        {r.text?.trim() && (
          <p className="pt">
            {unstated ? (
              <>
                <b className="pq">{T.unstatedPrefix}</b>
                {rowText(r)}
              </>
            ) : (
              rowText(r)
            )}
          </p>
        )}
        {r.source && (
          <p className="fig-src cs">
            <SourceLine source={r.source} url={r.url!} date={r.date!} />
            {r.basis === "record" ? T.recordNote : ""}
          </p>
        )}
      </li>
    );
  };
  return (
    <figure className="positions" id="positions">
      <figcaption className="ct">{field("title")}</figcaption>
      <p className="fig-src">
        {T.seatnote(seatBasisPhrase(context, lang))}{" "}
        <time dateTime={stamp}>
          {mediumDate(stamp, lang)}
        </time>
        .
      </p>
      {p.question && <p className="cq">{field("question")}</p>}
      {groups
        .filter((g) => g.rows.length)
        .map((g) => (
          <section key={g.st.id} className="ps-grp">
            <h3>
              <span
                className={`key ${onClass(g.pos)}`}
                style={{ background: shade(g.pos, g.n) }}
                aria-hidden
              >
                {g.n}
              </span>
              {field(
                `stances.${stances.findIndex((st) => st.id === g.st.id)}.label`,
              )}
              <span className="gs">
                {seatsAt(g.seats)} {unit}
              </span>
            </h3>
            <ul>
              {g.rows.map((r) => (
                <Entry key={r.party} r={r} />
              ))}
            </ul>
          </section>
        ))}
      {unsorted.length > 0 && (
        <section className="ps-grp">
          <h3>{T.unsortedHead}</h3>
          <ul>
            {unsorted.map((r) => (
              <Entry key={r.party} r={r} />
            ))}
          </ul>
        </section>
      )}
      {quiet.length > 0 && (
        <section className="ps-grp quiet">
          <h3>
            {quiet.some(
              (r) => (r as PositionRow).declined || r.status === "declined",
            )
              ? T.quietHead
              : T.quietHead}
          </h3>
          <ul>
            {quiet.map((r) =>
              r.text?.trim() ? (
                <Entry key={r.party} r={r} />
              ) : (
                <li key={r.party}>
                  <p className="pn">
                    <span
                      className="sw"
                      style={{ background: partyColor(r.party) }}
                      aria-hidden
                    />
                    <a
                      href={
                        editionPath(`/parties/${r.party}`, lang) ??
                        `/parties/${r.party}`
                      }
                    >
                      {listName(r.party)}
                    </a>
                    <span className="ps">
                      {(r as PositionRow).declined || r.status === "declined"
                        ? T.declined
                        : T.noPosition}
                    </span>
                  </p>
                </li>
              ),
            )}
          </ul>
        </section>
      )}
      {p.note && <p className="fig-src cs">{field("note")}</p>}
      <p className="fig-src cs">
        <a
          href={`${editionPath("/compare", lang)}#issue-${AXIS_OF[issue] ?? ""}`}
        >
          {words.compare}
        </a>
      </p>
    </figure>
  );
}

const AXIS_OF: Record<string, string> = {
  "haredi-draft": "draft",
  courts: "courts",
  "war-hostages": "war",
  "west-bank": "wb",
  "religion-state": "relig",
  economy: "econ",
  "palestinian-state": "pstate",
};

/** A quotation, verbatim, with who said it, where and when. */
export function Quote({
  children,
  who,
  role,
  source,
  url,
  date,
}: {
  children: ReactNode;
  who: string;
  role?: string;
  source: string;
  url: string;
  date: string;
}) {
  return (
    <figure className="quote">
      <blockquote>{children}</blockquote>
      <figcaption>
        {who}
        {role ? `, ${role}` : ""}. <a href={url}>{source}</a>, {date}
      </figcaption>
    </figure>
  );
}

/** A boxed aside: a definition, a caveat, or a group kept out of the page totals. */
export function Note({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className="callout">
      {title && <p className="nt">{title}</p>}
      {children}
    </aside>
  );
}

export function positionsTranslated(issue: string, lang: Lang) {
  const p = positions[issue];
  if (!p) return false;
  if (lang === "en") return true;
  const fields = [
    "title",
    ...(p.question ? ["question"] : []),
    ...(p.note ? ["note"] : []),
    ...(p.stances ?? []).map((_, i) => `stances.${i}.label`),
  ];
  return (
    fields.every((f) => positionText(issue, p, f, lang).lang === lang) &&
    p.rows
      .filter((r) => r.text?.trim())
      .every((r) => positionText(issue, r, "text", lang, r.party).lang === lang)
  );
}
