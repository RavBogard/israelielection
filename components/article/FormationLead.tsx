import Link from "next/link";
import "@/components/government.css";
import FormationClock from "@/components/government/FormationClock";
import formationJson from "@/data/formation.json";
import type { Formation } from "@/lib/formation";

/** The forming-a-government guide opens with the formation clock in days (before the results, so no dates): the process, step by step, on one axis. */
export default function FormationLead() {
  const steps = (formationJson as unknown as Formation).milestones.filter((m) => m.id !== "new-election");
  return (
    <div className="gov lead-gov">
      <FormationClock steps={steps} published={null} today="" numbered={false} />
      <p className="fig-src lead-more">
        Once the official results are published, the <Link href="/government">government page</Link> shows this clock with calendar dates.
      </p>
    </div>
  );
}
