import type { MatrixCell } from "@/components/compare/model";
import type { BlocId } from "@/lib/types";

/** What the server hands the Party match client: quiz questions joined to the Compare matrix, and each list's facts. */
export type MatchOption = { id: string; label: string; position: number | null; n: number; color: string };
export type MatchQuestion = {
  key: string;
  round: "core" | "deeper";
  /** The issue's short name (Compare's row label). */
  label: string;
  prompt: string;
  context: string;
  scale: boolean;
  /** Every stance on the row in scale order; `label` is the reader's wording where the quiz offers it. */
  stances: MatchOption[];
  /** The stance ids the reader can pick, in scale order. */
  offered: string[];
  /** The row's original stance labels, for the lists' answers in the breakdown. */
  stanceLabels: Record<string, string>;
  cells: Record<string, MatrixCell>;
  /** Party id → the list's own words on this row. */
  said: Record<string, { text: string; source: string; url?: string; date?: string }>;
};
export type MatchParty = {
  id: string;
  name: string;
  short: string;
  leader: string;
  bloc: BlocId;
  color: string;
  ink: string;
  /** "Seats, polling average" as the site prints it, or null when not polled. */
  seatsText: string | null;
  seats: number;
  below: boolean;
  /** Current polls in which the list passes the threshold, of all current polls. */
  passing: [number, number];
  surplus: string | null;
  pledge: { text: string; source: string } | null;
};
export type MatchBloc = { id: BlocId; label: string; seats: number };
export type MatchData = { questions: MatchQuestion[]; parties: MatchParty[]; blocs: MatchBloc[]; asOf: string };
