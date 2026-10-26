"use client";
import { usePathname } from "next/navigation";
import { GoogleAnalytics } from "@next/third-parties/google";
/** Private bearer-link pages never initialize analytics. Tokens in new emails are fragments. */
export default function PrivacyAwareAnalytics({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  return /\/(?:subscriptions)\/(?:confirm|preferences|unsubscribe)(?:\/|$)/.test(
    pathname ?? "",
  ) ? null : (
    <GoogleAnalytics gaId={gaId} />
  );
}
