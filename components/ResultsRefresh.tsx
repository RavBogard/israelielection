"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/lang";
import resultsText from "@/lib/i18n/results";
export default function ResultsRefresh({ pollsClose, button = true }: { pollsClose: string; button?: boolean }) {
  const router = useRouter();
  const lang = useLang();
  useEffect(() => { const timer = setInterval(() => { if (Date.now() >= Date.parse(pollsClose) && document.visibilityState === "visible") router.refresh(); }, 60_000); return () => clearInterval(timer); }, [router, pollsClose]);
  return button ? <button type="button" className="rs-refresh" onClick={() => router.refresh()}>{resultsText[lang].refresh}</button> : null;
}
