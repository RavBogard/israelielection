import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import MatchPage from "@/components/pages/MatchPage";

export const metadata: Metadata = {
  title: "Which Israeli party matches you?",
  description: "Seven questions from Israel's 2026 campaign, matched against every list's recorded positions, with what an Israeli voter would weigh next. It describes; it recommends no list.",
  alternates: alternates("/match"),
};

export default function Page() {
  return <MatchPage />;
}
