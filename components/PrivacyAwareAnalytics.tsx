"use client";
import { usePathname } from "next/navigation";
import { GoogleAnalytics } from "@next/third-parties/google";
import { useLayoutEffect } from "react";
import {
  privateAnalyticsPath,
  installAnalyticsPrivacyGuard,
} from "@/lib/analytics-privacy";
/** Sensitive direct loads omit GA; SPA entry disables an earlier tag for this document. */
export default function PrivacyAwareAnalytics({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  useLayoutEffect(() => installAnalyticsPrivacyGuard(window, gaId), [gaId]);
  return privateAnalyticsPath(pathname ?? "") ? null : (
    <GoogleAnalytics gaId={gaId} />
  );
}
