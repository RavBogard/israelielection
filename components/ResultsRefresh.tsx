"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function ResultsRefresh({ pollsClose, button = true }: { pollsClose: string; button?: boolean }) {
  const router = useRouter();
  useEffect(() => { const timer = setInterval(() => { if (Date.now() >= Date.parse(pollsClose) && document.visibilityState === "visible") router.refresh(); }, 60_000); return () => clearInterval(timer); }, [router, pollsClose]);
  return button ? <button type="button" className="rs-refresh" onClick={() => router.refresh()}>Check for an update</button> : null;
}
