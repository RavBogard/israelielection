"use client";
import { useSeatContext } from "./SeatContextProvider";
import SeatBasis from "./SeatBasis";
import CurrentParliament from "./CurrentParliament";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import type { Lang } from "@/lib/i18n";
import type { ForecastProps } from "../live-forecast/presentation";
/** Preserve an open tab's last-good parliament if an RSC refresh cannot read storage. */
export default function CurrentUnavailable({
  lang,
  names,
  scenarios,
}: {
  lang: Lang;
  names: ForecastProps["names"];
  scenarios: ForecastProps["scenarios"];
}) {
  const { context } = useSeatContext();
  return (
    <div className="wrap">
      <p role="status">{LIFECYCLE[lang].sourceUnavailable}</p>
      {context ? (
        <CurrentParliament
          initial={context}
          lang={lang}
          names={names}
          scenarios={scenarios}
        />
      ) : (
        <SeatBasis context={null} lang={lang} />
      )}
    </div>
  );
}
