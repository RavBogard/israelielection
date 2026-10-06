"use client";
import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { type DeskTab, initialTab } from "@/lib/polls-desk";

/**
 * The polls desk's four tabs. Without JavaScript every panel shows, stacked, under its own heading;
 * once the page runs, a tablist shows one at a time. ?tab= or a hash naming a tab (or any id inside a
 * panel, such as #browser) opens that panel, so shared links work; choosing a tab writes its hash.
 */
export default function PollTabs({ tabs }: { tabs: { id: DeskTab; label: string; content: ReactNode }[] }) {
  const [on, setOn] = useState(false), [active, setActive] = useState<DeskTab>("parties");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({}), pending = useRef<string | null>(null), [tick, setTick] = useState(0);
  // Scroll to a linked id once its panel is shown, after the stacked fallback has collapsed into tabs.
  useEffect(() => { const h = pending.current; if (!h) return; pending.current = null; document.getElementById(h)?.scrollIntoView({ block: "start" }); }, [tick]);
  useEffect(() => {
    const resolve = (scroll: boolean) => {
      const h = decodeURIComponent(location.hash.slice(1));
      const inside = h ? document.getElementById(h)?.closest<HTMLElement>("[data-desk-panel]")?.dataset.deskPanel : undefined;
      const id = (inside && inside !== h ? inside : initialTab(location.search, location.hash)) as DeskTab;
      setActive(id);
      if (scroll && h) pending.current = h;
      setTick((t) => t + 1);
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is external state read once the page runs
    setOn(true);
    resolve(!!location.hash);
    const onHash = () => resolve(true);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const choose = (id: DeskTab, focus = false) => {
    setActive(id);
    const q = new URLSearchParams(location.search);
    q.delete("tab");
    history.replaceState(history.state, "", `${location.pathname}${q.size ? `?${q}` : ""}#${id}`);
    if (focus) refs.current[id]?.focus();
  };
  const keys = (e: KeyboardEvent, i: number) => {
    const n = tabs.length, to = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    choose(tabs[to].id, true);
  };
  return (
    <div className={`pd-tabs${on ? " on" : ""}`}>
      <div className="pd-tablist" role="tablist" aria-label="Polls desk" hidden={!on}>
        {tabs.map((t, i) => (
          <button key={t.id} ref={(el) => { refs.current[t.id] = el; }} type="button" role="tab" id={`tab-${t.id}`} aria-selected={active === t.id} aria-controls={t.id} tabIndex={active === t.id ? 0 : -1} onClick={() => choose(t.id)} onKeyDown={(e) => keys(e, i)}>
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <section key={t.id} id={t.id} data-desk-panel={t.id} className="pd-panel" {...(on ? { role: "tabpanel", "aria-labelledby": `tab-${t.id}`, hidden: active !== t.id } : { "aria-label": t.label })}>
          {t.content}
        </section>
      ))}
    </div>
  );
}
