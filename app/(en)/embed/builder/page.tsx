import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import { seatContextForRender } from "@/lib/seat-context-server";
import SeatBasis from "@/components/seat-context/SeatBasis";
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

export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const q=await searchParams;const revision=typeof q.context==="string"?q.context:undefined;const context=await seatContextForRender(revision);if(revision&&!context)return <SeatBasis context={null} lang="en" pinned/>;
  return (
    <div className="ix">
      <CoalitionBuilder initialContext={context} pinned={!!revision} />
      <EmbedFooter dateLine={context?`${LIFECYCLE.en[context.basis]} · ${LIFECYCLE.en[context.seatStatus]} · ${context.publishedAt??LIFECYCLE.en.noTime}`:`Polls to ${mediumDate(mainPolls[0].published)}`} />
    </div>
  );
}
