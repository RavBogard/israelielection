"use client";
import { usePathname } from "next/navigation";
import { GoogleAnalytics } from "@next/third-parties/google";
import { useCallback, useSyncExternalStore } from "react";
import {
  privateAnalyticsPath,
  privateAnalyticsReferrer,
  installAnalyticsPrivacyGuard,
} from "@/lib/analytics-privacy";
const serverSnapshot = () => false;
/** No tag mounts until the browser URL/referrer has passed the privacy boundary. */
export default function PrivacyAwareAnalytics({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const subscribe = useCallback(
    (notify: () => void) => installAnalyticsPrivacyGuard(window, gaId, notify),
    [gaId],
  );
  const snapshot = useCallback(
    () =>
      !privateAnalyticsPath(window.location.pathname) &&
      !privateAnalyticsReferrer(document.referrer, window.location.origin) &&
      !(window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`],
    [gaId],
  );
  const allowed = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return !allowed || privateAnalyticsPath(pathname ?? "") ? null : (
    <GoogleAnalytics gaId={gaId} />
  );
}
