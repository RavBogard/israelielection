// Loads the Hebrew interface words before this module reads them (lib/i18n/he-text.ts).
import "@/lib/i18n/he/register";
import type { Metadata } from "next";
import { heAlternates } from "@/lib/canonical";
import PollsPage from "@/components/pages/PollsPage";
import POLLS from "@/lib/i18n/polls";

export const metadata: Metadata = { title: POLLS.he.meta.title, description: POLLS.he.meta.description, alternates: heAlternates("/he/polls") };

export const revalidate = 3600;

export default function Page() {
  return <PollsPage lang="he" />;
}
