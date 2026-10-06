import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import "@/components/interactives.css";
import "@/components/coalition.css";
import CoalitionBuilder from "@/components/CoalitionBuilder";
import EmbedFooter from "@/components/EmbedFooter";
import { mainPolls } from "@/lib/data";
import { mediumDate } from "@/lib/format";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Coalition Builder (embed)",
  robots: { index: false },
  alternates: alternates("/embed/builder"),
};

export default function Page() {
  return (
    <div className="ix">
      <CoalitionBuilder />
      <EmbedFooter dateLine={`Polls to ${mediumDate(mainPolls[0].published)}`} />
    </div>
  );
}
