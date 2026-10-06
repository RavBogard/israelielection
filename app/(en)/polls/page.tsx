import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import PollsPage from "@/components/pages/PollsPage";
import POLLS from "@/lib/i18n/polls";

export const metadata: Metadata = { title: POLLS.en.meta.title, description: POLLS.en.meta.description, alternates: alternates("/polls") };

export const revalidate = 3600;

export default function Page() {
  return <PollsPage lang="en" />;
}
