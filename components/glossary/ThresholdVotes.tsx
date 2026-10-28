"use client";
import { useSeatContext } from "@/components/seat-context/SeatContextProvider";
import { useCountSummary } from "@/components/ResultsStrip";
import resultsConfig from "@/data/results.json";
import { currentElection } from "@/lib/political-record/elections";
import { locale, type Lang } from "@/lib/i18n";
import { SCORECARD } from "@/lib/i18n/scorecard";

/** 3.25% of valid votes (Knesset Elections Law s. 81): from the official result once certified, else from the count so far. */
export function thresholdVotes(valid: number | null | undefined, rate = resultsConfig.threshold): number | null {
  return valid && valid > 0 ? Math.ceil(valid * rate) : null;
}

export function useThresholdVotes(): { votes: number; official: boolean } | null {
  const { context } = useSeatContext();
  const certified = thresholdVotes(context?.seatStatus === "official" ? context.officialVotes?.valid : null);
  const summary = useCountSummary(currentElection().pollsClose, certified == null);
  if (certified) return { votes: certified, official: true };
  const counted = thresholdVotes(summary?.state === "open" ? summary.valid : null);
  return counted ? { votes: counted, official: false } : null;
}

/** The glossary's threshold entry: the 2026 threshold in votes, labelled provisional until the result is official. */
export function ThresholdVotesLine({ value, lang }: { value: { votes: number; official: boolean } | null; lang: Lang }) {
  if (!value) return null;
  return (
    <span className="gl-live" data-testid="glossary-threshold-votes" data-official={value.official ? "true" : "false"}>
      {" "}
      {SCORECARD[lang].thresholdVotes(value.votes.toLocaleString(locale(lang)), value.official)}
    </span>
  );
}

export default function ThresholdVotes({ lang }: { lang: Lang }) {
  return <ThresholdVotesLine value={useThresholdVotes()} lang={lang} />;
}
