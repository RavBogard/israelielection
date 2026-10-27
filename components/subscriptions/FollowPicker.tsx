"use client";
import { useEffect, useRef, useState } from "react";
import { isLang, type Lang } from "@/lib/i18n";
import type { Follows } from "@/lib/political-record/follows";
import { followsText } from "@/lib/i18n/follows";
type Option = {
  id: string;
  label: string;
  labelLocale: Lang;
  sourceLocale: Lang;
};
export default function FollowPicker({
  lang,
  kind,
  value,
  onChange,
}: {
  lang: Lang;
  kind: keyof Follows;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const t = followsText(lang),
    [query, setQuery] = useState(""),
    [options, setOptions] = useState<Option[]>([]),
    [known, setKnown] = useState<Record<string, Option>>({}),
    [state, setState] = useState<"loading" | "ready" | "error">("loading"),
    selected = useRef(value);
  useEffect(() => {
    selected.current = value;
  }, [value]);
  useEffect(() => {
    const controller = new AbortController(),
      type = { parties: "party", issues: "issue", places: "place" }[kind];
    let active = true;
    const fetchOptions = async (q: string) => {
      const response = await fetch(
        `/api/subscriptions/catalog?${new URLSearchParams({ kind: type, q, lang })}`,
        {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(10000),
          ]),
          referrerPolicy: "no-referrer",
        },
      );
      if (!response.ok) throw Error("catalog unavailable");
      const body = await response.json();
      if (!Array.isArray(body.options)) throw Error("invalid catalog");
      return body.options
        .filter(
          (o: Option) =>
            typeof o.id === "string" &&
            typeof o.label === "string" &&
            isLang(o.labelLocale) &&
            isLang(o.sourceLocale),
        )
        .slice(0, 50) as Option[];
    };
    const timer = setTimeout(async () => {
      setState("loading");
      try {
        const found = await fetchOptions(query);
        if (!active) return;
        setOptions(found);
        const map = Object.fromEntries(found.map((o) => [o.id, o]));
        setKnown((old) => ({ ...old, ...map }));
        setState("ready");
        for (const id of selected.current.filter((id) => !map[id])) {
          const labels = await fetchOptions(id);
          if (!active) return;
          setKnown((old) => ({
            ...old,
            ...Object.fromEntries(labels.map((o) => [o.id, o])),
          }));
        }
      } catch {
        if (active) setState("error");
      }
    }, 250);
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [kind, lang, query]);
  const label = (id: string) => {
    const option = known[id];
    return option ? (
      <>
        <span lang={option.labelLocale} dir="auto">
          {option.label}
        </span>
        {option.labelLocale !== lang && (
          <>
            . <small>{t.original}</small>
          </>
        )}
      </>
    ) : (
      t.pending
    );
  };
  return (
    <fieldset className="follow-picker">
      <legend>{t[kind]}</legend>
      <label>
        {t.search}
        <input
          type="search"
          value={query}
          maxLength={100}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </label>
      {value.length > 0 && (
        <div className="follow-selected">
          <p>
            {t.selected}: {value.length}
          </p>
          <ul>
            {value.map((id) => (
              <li key={id}>
                {label(id)}{" "}
                <button
                  type="button"
                  aria-label={`${t.remove}: ${known[id]?.label ?? t.pending}`}
                  onClick={() => onChange(value.filter((v) => v !== id))}
                >
                  {t.remove}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p role="status">
        {state === "error"
          ? t.unavailable
          : state === "loading"
            ? t.loading
            : ""}
      </p>
      <div className="follow-options">
        {options.map((option) => (
          <label key={option.id}>
            <input
              type="checkbox"
              checked={value.includes(option.id)}
              disabled={!value.includes(option.id) && value.length >= 20}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...value, option.id]
                    : value.filter((v) => v !== option.id),
                )
              }
            />{" "}
            {label(option.id)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
