"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { editionPath, LANGS, type Lang } from "@/lib/i18n";
import "./subscriptions.css";
import { subscriptionText } from "@/lib/i18n/subscriptions";
import { followsText } from "@/lib/i18n/follows";
import type { Follows, DeliveryChannels } from "@/lib/political-record/follows";
import FollowPicker from "./FollowPicker";
import {
  privateToken,
  emptyFollows,
  readDistribution,
  hasSubscriptionSelection,
  tokenFreeUrl,
  TOPICS,
  validTopics,
  type Topic,
  type SubscriptionMode,
} from "./model";
export default function SubscriptionControls({
  lang,
  mode = "signup",
}: {
  lang: Lang;
  mode?: SubscriptionMode;
}) {
  const t = subscriptionText(lang),
    f = followsText(lang),
    token = useRef<string | null>(null),
    captured = useRef<SubscriptionMode | null>(null);
  const [email, setEmail] = useState(""),
    [selectedLang, setLang] = useState(lang),
    [topics, setTopics] = useState<Topic[]>(["digest"]),
    [follows, setFollows] = useState<Follows>(emptyFollows),
    [delivery, setDelivery] = useState<DeliveryChannels>({
      dailyDigest: true,
      majorEvents: false,
      corrections: true,
    }),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [ready, setReady] = useState(mode === "signup"),
    [loaded, setLoaded] = useState(false),
    [links, setLinks] = useState<{
      preferences: string;
      unsubscribe: string;
    } | null>(null);
  useEffect(() => {
    if (mode === "signup") return;
    if (captured.current === mode) return;
    captured.current = mode;
    token.current = privateToken(window.location.href);
    window.history.replaceState(
      window.history.state,
      "",
      tokenFreeUrl(window.location.href),
    );
    setReady(!!token.current);
    if (!token.current) setMessage(t.invalid);
  }, [mode, t.invalid]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (
      (mode === "signup" || (mode === "preferences" && loaded)) &&
      !hasSubscriptionSelection(topics, follows)
    ) {
      setMessage(f.choose);
      return;
    }
    if (
      (mode === "signup" || (mode === "preferences" && loaded)) &&
      !Object.values(delivery).some(Boolean)
    ) {
      setMessage(f.chooseDelivery);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const body =
        mode === "signup"
          ? { email, locale: selectedLang, topics, follows, delivery, consent }
          : mode === "preferences" && loaded
            ? {
                token: token.current,
                locale: selectedLang,
                topics,
                follows,
                delivery,
              }
            : { token: token.current };
      const response = await fetch(
        mode === "signup" ? "/api/subscriptions" : `/api/subscriptions/${mode}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          referrerPolicy: "no-referrer",
          cache: "no-store",
          signal: AbortSignal.timeout(20000),
        },
      );
      if (!response.ok) {
        setMessage(
          response.status === 503 || response.status === 404
            ? t.unavailable
            : t.invalid,
        );
        return;
      }
      const data = await response.json();
      if (mode === "preferences" && !loaded) {
        const restoredTopics = validTopics(data.topics),
          restored = readDistribution(data, restoredTopics);
        if (!restored) {
          setMessage(t.unavailable);
          return;
        }
        setTopics(restoredTopics);
        setFollows(restored.follows);
        setDelivery(restored.delivery);
        if (LANGS.includes(data.locale)) setLang(data.locale);
        setLoaded(true);
        return;
      }
      if (
        mode === "confirm" &&
        typeof data.preferencesToken === "string" &&
        typeof data.unsubscribeToken === "string"
      )
        setLinks({
          preferences: data.preferencesToken,
          unsubscribe: data.unsubscribeToken,
        });
      setMessage(
        mode === "signup"
          ? t.accepted
          : mode === "confirm"
            ? t.confirmed
            : mode === "unsubscribe"
              ? t.unsubscribed
              : t.saved,
      );
      if (mode !== "preferences") {
        setReady(false);
        token.current = null;
      }
    } catch {
      setMessage(t.unavailable);
    } finally {
      setBusy(false);
    }
  }
  const choices = mode === "signup" || (mode === "preferences" && loaded);
  return (
    <section
      className="wrap subscription-page"
      aria-labelledby="subscription-title"
    >
      <header className="page-head">
        <h1 id="subscription-title" className="ph-title">
          {mode === "signup" ? t.title : t[mode]}
        </h1>
      </header>
      <p>{mode === "signup" ? t.intro : t.privateLink}</p>
      <form onSubmit={submit}>
        {mode === "signup" && (
          <p>
            <label>
              {t.email}
              <br />
              <input
                name="email"
                type="email"
                autoComplete="email"
                dir="ltr"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          </p>
        )}
        {choices && (
          <>
            <p>
              <label>
                {t.language}
                <br />
                <select
                  value={selectedLang}
                  onChange={(e) => setLang(e.target.value as Lang)}
                >
                  {LANGS.map((l) => (
                    <option key={l} value={l}>
                      {
                        {
                          en: "English",
                          he: "עברית",
                          ar: "العربية",
                          fa: "فارسی",
                          de: "Deutsch",
                          fr: "Français",
                          zh: "中文",
                        }[l]
                      }
                    </option>
                  ))}
                </select>
              </label>
            </p>
            <fieldset>
              <legend>{f.topics}</legend>
              {TOPICS.map((topic) => (
                <label
                  key={topic}
                  style={{ display: "block", paddingBlock: ".4rem" }}
                >
                  <input
                    type="checkbox"
                    checked={topics.includes(topic)}
                    onChange={(e) =>
                      setTopics((old) =>
                        e.target.checked
                          ? [...old, topic]
                          : old.filter((v) => v !== topic),
                      )
                    }
                  />{" "}
                  {topic === "digest" ? f.general : t[topic]}
                </label>
              ))}
            </fieldset>
            <h2>{f.follows}</h2>
            <p>{f.explanation}</p>
            <p>{f.limit}</p>
            {(["parties", "issues", "places"] as const).map((kind) => (
              <FollowPicker
                key={kind}
                kind={kind}
                lang={lang}
                value={follows[kind]}
                onChange={(ids) =>
                  setFollows((old) => ({ ...old, [kind]: ids }))
                }
              />
            ))}
            <fieldset>
              <legend>{f.delivery}</legend>
              {(["dailyDigest", "majorEvents", "corrections"] as const).map(
                (key) => (
                  <label className="delivery-choice" key={key}>
                    <input
                      type="checkbox"
                      checked={delivery[key]}
                      onChange={(e) =>
                        setDelivery((old) => ({
                          ...old,
                          [key]: e.target.checked,
                        }))
                      }
                    />{" "}
                    {f[key]}
                  </label>
                ),
              )}
            </fieldset>
          </>
        )}
        {mode === "signup" && (
          <p>
            <label>
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />{" "}
              {t.consent}
            </label>
          </p>
        )}
        <p>
          <button className="btn" disabled={busy || !ready} type="submit">
            {busy
              ? t.busy
              : mode === "signup"
                ? t.request
                : mode === "confirm"
                  ? t.confirmAction
                  : mode === "unsubscribe"
                    ? t.unsubscribeAction
                    : loaded
                      ? t.save
                      : t.continueAction}
          </button>
        </p>
        <p role="status" aria-live="polite">
          {message}
        </p>
      </form>
      {links && (
        <p>
          <a
            rel="noreferrer"
            href={`${editionPath("/subscriptions/preferences", lang) ?? "/subscriptions/preferences"}#token=${encodeURIComponent(links.preferences)}`}
          >
            {t.preferences}
          </a>
          {". "}
          <a
            rel="noreferrer"
            href={`${editionPath("/subscriptions/unsubscribe", lang) ?? "/subscriptions/unsubscribe"}#token=${encodeURIComponent(links.unsubscribe)}`}
          >
            {t.unsubscribe}
          </a>
        </p>
      )}
    </section>
  );
}
