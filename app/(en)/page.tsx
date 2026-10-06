import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import HomePage from "@/components/pages/HomePage";
import { DESCRIPTION } from "@/lib/site";

// Every minute: on election night the hero shows the count as it comes in. Before then the page
// has nothing to fetch, so regenerating it is cheap.
export const revalidate = 60;

export const metadata: Metadata = { title: { absolute: "Israel Votes 2026" }, description: DESCRIPTION, alternates: alternates("/") };

export default function Page() {
  return <HomePage lang="en" revalidate={revalidate} />;
}
