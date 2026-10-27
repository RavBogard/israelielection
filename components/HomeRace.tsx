"use client";
import { isRtl,locale } from "@/lib/i18n";
import Link from "next/link";
import { useSyncExternalStore, useMemo, useRef, useState, type ReactNode } from "react";
import {
  contextRaceModel,
  homeMosaicLayout,
  homeMosaicView,
  type HomeRaceModel,
  type HomeBlocId,
} from "@/lib/home-race";
import {
  signedSeats,
  sparkPath,
  sparkRange,
  type BlocChange,
} from "@/lib/bloc-change";
import type { Forecast } from "@/lib/forecast";
import { shortDate } from "@/lib/format";
import { partyColor, PARTY_FALLBACK } from "@/lib/party-colors";
import { seatFigure } from "@/lib/polls";
import { useLang } from "@/lib/i18n/lang";
import NowSeats, { NowBlocSeats, NowSeatsKey } from "./NowSeats";
import type { Lang } from "@/lib/i18n";
import home from "@/lib/i18n/home";
import type { CadenceMetadata } from "@/lib/election-lifecycle/cadence";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import { useSeatContext } from "./seat-context/SeatContextProvider";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import { DASHBOARD } from "@/lib/i18n/election-dashboard";
import "./seatgrid.css";
const subscribeSelection=(notify:()=>void)=>{window.addEventListener("storage",notify);return()=>window.removeEventListener("storage",notify);};
const storedChoice=()=>{try{return sessionStorage.getItem("home-race-choice-v1");}catch{return null;}};
const storedPoll=()=>{try{return sessionStorage.getItem("home-race-poll-v1");}catch{return null;}};
const noSelection=()=>null;
/** A name the Hebrew overlay has not reached yet, marked as English. */
const nm = (text: string, lang?: Lang): ReactNode =>
  lang === "en" ? (
    <span lang="en" dir="ltr">
      {text}
    </span>
  ) : (
    text
  );
/**
 * The home hero's chart: the bloc list and the 120-seat mosaic. `rtl` (default: the Hebrew edition) fills the
 * mosaic from the top right with "61" left of the rule; SVG ignores dir, so the cells are placed mirrored here.
 */
/** One set of figures the hero can show: an average or the forecast, with its own header, change row and source line. */
export type RaceOption = {
  id: string;
  label: ReactNode;
  detail?: ReactNode;
  model: HomeRaceModel;
  change?: BlocChange | null;
  heading?: ReactNode;
  source?: ReactNode;
  forecast?: Pick<Forecast, "blocs" | "majority">;
  /** Figures the option switches between on a second row (each pollster's newest poll); the first is shown by default. */
  variants?: RaceOption[];
  variantsLabel?: string;
};
/**
 * `heading`: what the numbers are ("Average of 7 polls, to Oct 5"), set as the bloc list's header. `options`: several
 * sets of figures with a segmented control over the list to switch between them; the first is shown by default.
 */
export default function HomeRace({
  model: single,
  change: singleChange,
  rtl,
  heading: singleHeading,
  options,
  currentContext,
  initialCadence,
}: {
  initialCadence?: CadenceMetadata;
  currentContext?: SharedSeatContext;
  model?: HomeRaceModel;
  change?: BlocChange | null;
  rtl?: boolean;
  heading?: ReactNode;
  options?: RaceOption[];
}) {
  const lang = useLang(),
    t = home[lang].race,
    th = home[lang].hero,
    he = lang !== "en",
    flip = rtl ?? isRtl(lang);
  const shared = useSeatContext(currentContext ?? null),
    context = shared.context ?? currentContext,
    dt = DASHBOARD[lang],
    lt = LIFECYCLE[lang],
    cadence = shared.cadence ?? initialCadence;
  const stamp = (at: string | null | undefined) =>
    at
      ? new Intl.DateTimeFormat(locale(lang), {
          timeZone: "Asia/Jerusalem",
          month: "short",
          day: "numeric",
          ...(at.includes("T") ? { hour: "2-digit", minute: "2-digit" } : {}),
        }).format(new Date(at))
      : lt.noTime;
  const opts = useMemo<RaceOption[]>(() => {
    const rows = options ?? [
      {
        id: "only",
        label: null,
        model: single!,
        change: singleChange,
        heading: singleHeading,
      },
    ];
    return rows.filter((row) => row.id !== "current" || (context && context.basis !== "campaign_forecast")).map((row) =>
      row.id === "current" && context
        ? {
            ...row,
            label: lt[context.basis],
            model: contextRaceModel(row.model, context, dt.unknown),
            heading: (
              <>
                {lt[context.basis]} · {lt[context.seatStatus]}
              </>
            ),
          }
        : row,
    );
  }, [options, single, singleChange, singleHeading, context, dt.unknown, lt]);
  const savedPick=useSyncExternalStore(subscribeSelection,storedChoice,noSelection),savedPoll=useSyncExternalStore(subscribeSelection,storedPoll,noSelection);
  const [pick,setPick]=useState<string|null>(null),cur=opts.find(o=>o.id===(pick??savedPick))??opts[0];
  const [sub,setSub]=useState<string|null>(null);
  const chooseOption = (id: string) => {
    setPick(id);
    try {
      sessionStorage.setItem("home-race-choice-v1", id);
    } catch {}
  };
  const choosePoll = (id: string) => {
    setSub(id);
    try {
      sessionStorage.setItem("home-race-poll-v1", id);
    } catch {}
  };
  const variant = cur.variants
      ? (cur.variants.find((v) => v.id === (sub??savedPoll)) ?? cur.variants[0])
      : null,
    shown = variant ?? cur,
    { model, change, heading, forecast } = shown;
 // The count and the forecast give whole seats; only the polling averages keep a decimal.
 const seats=(n:number)=>model.isAverage||!Number.isInteger(n)?seatFigure(n):String(n);
 const range=change?sparkRange(change.points):0;
 const [selected,setSelected]=useState<HomeBlocId|null>(null),buttons=useRef<Partial<Record<HomeBlocId,HTMLButtonElement|null>>>({}),visual=useRef<HTMLDivElement>(null);
 const layout=useMemo(()=>homeMosaicLayout(model,lang),[model,lang]),view=homeMosaicView(layout,selected),active=model.rows.find(row=>row.id===selected);
 const profile=(id:string)=>he?`/${lang}/parties/${id}`:`/parties/${id}`;
 function choose(id:HomeBlocId,fromGrid=false){const next=selected===id?null:id;setSelected(next);if(fromGrid)buttons.current[id]?.focus({preventScroll:true});if(next&&window.innerWidth<=1000)requestAnimationFrame(()=>{const element=visual.current;if(element&&(element.getBoundingClientRect().bottom>window.innerHeight||element.getBoundingClientRect().top<0))element.scrollIntoView({block:"nearest",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});});}
 function reset(){setSelected(null);if(selected)buttons.current[selected]?.focus();}
 // Hebrew: cells from the right, the grid moved right by the label's 20 units.
 const cx=(i:number)=>flip?20+(11-i%12)*12+1:i%12*12+1;
 const rects=(indices:number[],bloc:HomeBlocId|null,color:string,label:string)=>indices.map(i=><rect key={i} data-cell={i} data-bloc={bloc??"unassigned"} className={bloc?"c":"e"} x={cx(i)} y={Math.floor(i/12)*12+1} width={10} height={10} fill={color} aria-hidden="true"><title>{t.cell(label,i+1)}</title></rect>);
 const delta=(d:number)=>he?d===0?t.noChange:<bdi dir="ltr">{signedSeats(d)}</bdi>:signedSeats(d);
 return <div className="race-chart">
  <div className="race-selectors">{opts.length>1&&<div className="race-pick" role="group" aria-label={th.pick}>{opts.map(o=><button key={o.id} type="button" aria-pressed={cur.id===o.id} onClick={()=>chooseOption(o.id)}>{o.label}{o.detail&&<small>{o.detail}</small>}</button>)}</div>}{cur.variants&&<div className="race-sub" role="group" aria-label={cur.variantsLabel??th.pickPoll}>{cur.variants.map(v=><button key={v.id} type="button" aria-pressed={shown.id===v.id} onClick={()=>choosePoll(v.id)}>{v.label}{v.detail&&<small>{v.detail}</small>}</button>)}</div>}{heading&&<p className="race-list-head">{heading}</p>}<p id="race-instruction" className="sr-only">{t.instruction}</p><ul>{model.rows.map(row=><li key={row.id}><button ref={el=>{buttons.current[row.id]=el;}} type="button" className="race-bloc-button" aria-expanded={selected===row.id} aria-controls="race-party-panel" onClick={()=>choose(row.id)}>
   <span className="race-row-label"><span className="race-group-name"><span className="sw" style={{background:`var(--b-${row.id}, var(--ink-3))`}} aria-hidden="true"/>{nm(row.label,row.labelLang)}</span><span className="race-value">{seats(row.labelSeats??row.seats)}{row.id!=="other"&&<NowBlocSeats id={row.id} lang={lang}/>}<small>{row.incomplete?t.knownSeats:t.seats}</small></span></span>
   {change&&row.id!=="other"&&<span className="race-change"><svg className="race-spark" viewBox="-2 -2 52 18" aria-hidden="true" focusable="false"><path d={sparkPath(change.points,row.id,48,14,range)} stroke={`var(--b-${row.id}, var(--ink-3))`}/></svg>{delta(change.delta[row.id])}{t.since}{shortDate(change.since,lang)}</span>}
   {forecast&&row.id!=="other"&&<span className="race-change race-range">{t.range(forecast.blocs[row.id].lo,forecast.blocs[row.id].hi)}{(row.id==="net"||row.id==="opp")&&<><span aria-hidden="true">·</span>{t.chance(row.id==="net"?forecast.majority.net:forecast.majority.oppZionist)}</>}</span>}
   <span className="race-row-caption">{(row.id==="net"||row.id==="opp")&&<span className="race-gap">{row.shortfall>0?t.short(seats(row.shortfall)):(row.labelSeats??row.seats)===61?t.at:t.above(seats((row.labelSeats??row.seats)-61))}{row.incomplete?t.known:""}</span>}<span className="race-disclosure">{selected===row.id?t.hide:t.show}<span className={`race-caret${selected===row.id?" open":""}`} aria-hidden="true"/></span></span>
  </button></li>)}</ul></div>
  <div className="race-visual" ref={visual}><svg viewBox="0 0 164 120" className="sg sg-hero home-mosaic" role="group" aria-label={t.mosaic(selected?active!.label:null)} aria-describedby="race-instruction race-rounding" onKeyDown={e=>{if(e.key==="Escape"&&selected){e.preventDefault();reset();}}}>
   {view.map(group=>group.revealed?group.partyId&&group.bloc!=="other"?<a key={group.id} href={profile(group.partyId)} tabIndex={0} className="seat-party-link" aria-label={t.open(group.label,seats(group.seats))}>{rects(group.cells,group.bloc,partyColor(group.partyId),t.group(group.label,seats(group.seats)))}</a>:<g key={group.id} role="img" aria-label={t.group(group.label,seats(group.seats))}>{rects(group.cells,group.bloc,PARTY_FALLBACK,t.group(group.label,seats(group.seats)))}</g>:<g key={group.id} className="mosaic-bloc-control" tabIndex={0} role="button" aria-label={t.reveal(group.label,seats(group.seats))} aria-controls="race-party-panel" onClick={()=>choose(group.bloc,true)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();choose(group.bloc,true);}}}>{rects(group.cells,group.bloc,`var(--b-${group.bloc}, var(--ink-3))`,t.group(group.label,seats(group.seats)))}</g>)}
   {rects(layout.empty,null,"var(--cell)",t.unassigned)}{flip?<><line className="rule" x1={17} x2={164} y1={60} y2={60} aria-hidden="true"/><text className="rl" x={15} y={62.4} dominantBaseline="middle" textAnchor="end" direction="ltr" aria-hidden="true">61</text></>:<><line className="rule" x1={0} x2={147} y1={60} y2={60} aria-hidden="true"/><text className="rl" x={149} y={62.4} dominantBaseline="middle" aria-hidden="true">61</text></>}
  </svg><p id="race-rounding" className="race-model-note">{cur.id==="current"?dt.exactMosaic:t.note}{layout.empty.length>0&&<>{t.empty(layout.empty.length)}</>}</p></div>
        {cur.id === "current" && context ? (
        <p
          className="race-source fig-src"
          data-seat-revision={context.revision}
        >
          {lt[context.basis]} · {lt[context.seatStatus]} ·{" "}
          {context.sourceRefs[0] && (
            <a href={context.sourceRefs[0].url}>
              {context.sourceRefs[0].publisher}
            </a>
          )}{" "}
          · {lt.published}:{" "}
          {context.publishedAt
            ? new Intl.DateTimeFormat(locale(lang), {
                timeZone: "Asia/Jerusalem",
                month: "short",
                day: "numeric",
                ...(context.publishedAt.includes("T")
                  ? { hour: "2-digit", minute: "2-digit" }
                  : {}),
              }).format(new Date(context.publishedAt))
            : lt.noTime}
          <br />
          {cadence?.phase==="before_close"&&!cadence.lastSuccessfulAt?<>{dt.begins}: {stamp(cadence.nextCheckAt)} · {dt.israel}</>:<>{dt.last}: {stamp(cadence?.lastSuccessfulAt??context.freshness.checkedAt)}{cadence&&<> · {dt.next}: {stamp(cadence.nextCheckAt)}</>} · {dt.israel}</>}
          {(shared.refreshFailed||cadence?.status==="failed")?<>{" "}{dt.failure}</>:cadence?.status==="overdue"?<>{" "}{dt.overdue}</>:null}
        </p>
      ) : (
        shown.source && (
          <p className="race-source fig-src" data-seat-revision={cur.id === "forecast" && context?.basis === "campaign_forecast" ? context.revision : undefined}>
            {!(cur.id === "forecast" && context?.basis === "campaign_forecast") && <>{dt.comparison} · </>}{shown.source}
          </p>
        )
      )}

  <section id="race-party-panel" className="race-party-panel" hidden={!active} aria-labelledby="race-party-heading" onKeyDown={e=>{if(e.key==="Escape"){e.preventDefault();reset();}}}>
   {active&&<><header><h2 id="race-party-heading">{t.panel(active.label)}</h2><button type="button" className="btn" onClick={reset}>{t.back}</button></header><p className="race-selection-status" role="status">{t.status(active.label)}</p>
    <ul className="race-parties">{active.members.map(p=><li key={p.id}>{active.id==="other"?<span>{p.name}</span>:<Link href={profile(p.id)}><span className="sw" style={{background:partyColor(p.id)}} aria-hidden="true"/>{nm(p.name,p.nameLang)}</Link>}<span className="race-party-seats" data-testid="race-party-seats" data-party={p.id}>{p.seats===null?p.state==="combined"?t.notSeparated:t.notReported:p.state==="below"?t.below:seats(p.seats)}{active.id!=="other"&&<NowSeats id={p.id} lang={lang}/>}{p.seats!==null&&p.state==="below"&&<small>{model.kind==="average"?t.belowAvg:model.kind==="forecast"?t.belowForecast:model.kind==="poll"?t.belowPoll:t.belowCount}</small>}</span></li>)}</ul>
    {active.combined.map(c=><p key={c.parties.join(",")} className="race-combined">{t.combined(c.names.join(" + "),seats(c.seats))}{c.withinGroup?t.within:t.across}{t.noSplit}</p>)}{active.id!=="other"&&<NowSeatsKey lang={lang}/>}<p className="race-model-note">{model.kind==="average"?t.followsAvg:model.kind==="forecast"?t.followsForecast:model.kind==="poll"?t.followsPoll:t.followsCount}{t.noInvented}</p>
   </>}
  </section>
 </div>;
}
