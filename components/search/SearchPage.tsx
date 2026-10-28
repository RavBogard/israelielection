import { Suspense } from "react";
import { seatContextForRender } from "@/lib/seat-context-server";
import { referenceReadModel } from "@/lib/reference/read-model";
import {
  referenceDocuments,
  translatedReference,
  translatedTool,
} from "@/lib/reference/catalog";
import { parties, blocs } from "@/lib/data";
import { TOOL_LANGS, editionPath, locale, type Lang } from "@/lib/i18n";
import { partyText, blocText } from "@/lib/i18n/overlays";
import { ui } from "@/lib/i18n/ui";
import { searchText } from "@/lib/i18n/search";
import { referenceText } from "@/lib/i18n/reference";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import { FORMATION } from "@/lib/i18n/formation-live";
import { HE_NAV_GROUPS, HE_NAV_UTILITIES } from "@/lib/i18n/chrome";
import { enPath } from "@/lib/i18n";
import { NAV, NAV_TOOLS } from "@/lib/site";
import { BLOC_ORDER } from "@/lib/polls";
import { anchorOf, type Glossary } from "@/lib/glossary";
import glossaryJson from "@/data/glossary.json";
import aliasesJson from "@/data/search-aliases.json";
import { currentSeatFigure, type SearchEntry } from "@/lib/search";
import SiteSearch from "@/components/SiteSearch";
import SeatBasis from "@/components/seat-context/SeatBasis";
import PageHead from "@/components/PageHead";
import "@/components/interactives.css";
export default async function SearchPage({ lang }: { lang: Lang }) {
  const context = await seatContextForRender(),
    model = await referenceReadModel(),
    t = searchText(lang),
    r = referenceText(lang),
    aliases = aliasesJson as Record<string, string[]>,
    href = (path: string) => editionPath(path, lang) ?? path;
  const basis = context
    ? `${LIFECYCLE[lang][context.basis]}. ${LIFECYCLE[lang][context.seatStatus]}. ${context.publishedAt ? new Intl.DateTimeFormat(locale(lang), { timeZone: "Asia/Jerusalem", dateStyle: "medium", timeStyle: "short" }).format(new Date(context.publishedAt)) : LIFECYCLE[lang].noTime}`
    : LIFECYCLE[lang].sourceUnavailable;
  const entries: SearchEntry[] = parties.map((p) => ({
    href: href("/parties/" + p.id),
    title: partyText(p, "name", lang).text,
    description: partyText(p, "leader", lang).text,
    kind: "party",
    aliases: [
      p.name,
      p.short,
      p.leader,
      ...(p.names ?? []).map((n) => n.name),
      ...TOOL_LANGS.flatMap((l) =>
        ["name", "short", "leader"].map((f) => partyText(p, f, l).text),
      ),
      ...(aliases["/parties/" + p.id] ?? []),
    ],
    figure: currentSeatFigure(
      partyText(p, "name", lang).text,
      context?.pointSeats[p.id],
      basis,
      t.seats,
      t.unknown,
    ),
  }));
  for (const p of context?.parties.filter(
    (p) =>
      (context.pointSeats[p.id] ?? 0) > 0 &&
      !parties.some((known) => known.id === p.id),
  ) ?? [])
    entries.push({
      href: href("/parliament") + "#list-" + encodeURIComponent(p.id),
      title: p.label ?? p.id,
      description: t.unprofiled,
      kind: "party",
      aliases: [p.id, p.label ?? p.id],
      figure: currentSeatFigure(
        p.label ?? p.id,
        context!.pointSeats[p.id],
        basis,
        t.seats,
        t.unknown,
      ),
    });
  for (const id of BLOC_ORDER) {
    const bloc = blocs.find((b) => b.id === id)!,
      name = blocText(bloc, lang).text;
    const seats = context
      ? parties
          .filter((p) => p.bloc === id)
          .reduce((sum, p) => sum + (context.pointSeats[p.id] ?? 0), 0)
      : undefined;
    entries.push({
      href: href("/results"),
      title: name,
      description: t.grouping,
      kind: "bloc",
      aliases: [
        bloc.label,
        ...TOOL_LANGS.map((l) => blocText(bloc, l).text),
        ...(aliases["bloc:" + id] ?? []),
      ],
      figure: currentSeatFigure(name, seats, basis, t.seats, t.unknown),
    });
  }
  for (const source of referenceDocuments) {
    const selected = translatedReference(source.path, lang),
      ready = selected?.state === "ready",
      blocks = ready ? selected.translation.blocks : source.blocks;
    const title = blocks[0].text,
      description =
        blocks.find(
          (b) => b.id === source.blocks.find((s) => s.kind === "summary")?.id,
        )?.text ??
        blocks[1]?.text ??
        "";
    entries.push({
      href: href(source.path),
      title,
      description: description.slice(0, 400),
      kind: source.path.startsWith("/issues/")
        ? "issue"
        : source.path.startsWith("/communities/")
          ? "community"
          : source.path.startsWith("/how-it-works/")
            ? "guide"
            : "resource",
      aliases: [source.title, ...(aliases[source.path] ?? [])],
      contentLang: lang !== "en" && !ready ? "en" : lang,
      translationPending: lang !== "en" && !ready,
    });
  }
  for (const event of model.lifecycle?.politics.events.filter(
    (e) => e.status === "confirmed",
  ) ?? [])
    entries.push({
      href: href("/changes") + "#event-" + event.id,
      title:
        FORMATION[lang][event.templateKey] +
        (event.person ? ": " + event.person : ""),
      description: t.event + ". " + event.effectiveAt,
      kind: "resource",
      aliases: [event.person ?? "", ...event.partyIds, event.type],
    });
  for (const election of model.elections)
    entries.push({
      href: href("/elections/" + election.id),
      title: `${r.term} ${election.termNumber}`,
      description: t.edition + ". " + election.electionDay,
      kind: "resource",
      aliases: [election.id, String(election.termNumber), election.electionDay],
    });
  // The edition's own glossary terms come from the published tool translation; the English
  // term stays searchable as an alias, and an unpublished edition keeps English with a pending note.
  const glossary = translatedTool("tools:glossary", lang, glossaryJson),
    glossaryReady = lang === "en" || glossary.state === "ready";
  for (const [i, term] of (glossary.data as Glossary).terms.entries()) {
    const original = (glossaryJson as Glossary).terms[i];
    entries.push({
      href: href("/glossary") + "#" + anchorOf(original.term),
      title: term.term,
      description: term.def,
      kind: "glossary",
      aliases: [
        ...(term.term === original.term ? [] : [original.term]),
        term.hebrew ?? "",
        term.say ?? "",
      ],
      contentLang: glossaryReady ? lang : "en",
      translationPending: !glossaryReady,
    });
  }
  const localNav = (path: string) =>
    lang === "he"
      ? [...HE_NAV_GROUPS.flatMap((g) => g.items), ...HE_NAV_UTILITIES].find(
          (n) => enPath(n.href) === path,
        )
      : undefined;
  const special: Record<string, string> = {
    "/elections": r.elections,
    "/parliament": r.parliament,
    "/policies": r.policies,
    "/changes": r.changes,
    "/reference": r.reference,
    "/search": t.title,
  };
  for (const nav of NAV)
    entries.push({
      href: href(nav.href),
      title:
        special[nav.href] ?? localNav(nav.href)?.label ?? ui(lang, nav.label),
      description: special[nav.href]
        ? r.evidence
        : (localNav(nav.href)?.description ?? ui(lang, nav.description)),
      kind: "resource",
      aliases: [
        nav.label,
        ...(aliases[nav.href] ?? []),
        ...(nav.aliases ?? []),
      ],
    });
  return (
    <div className="wrap ix">
      <PageHead title={t.title} standfirst={t.intro} />
      <SeatBasis context={context} lang={lang} />
      <Suspense fallback={<p>{t.browse}</p>}>
        <SiteSearch
          entries={entries}
          lang={lang}
          tools={NAV_TOOLS.map((n) => ({
            href: href(n.href),
            label: localNav(n.href)?.label ?? ui(lang, n.label),
          }))}
        />
      </Suspense>
    </div>
  );
}
