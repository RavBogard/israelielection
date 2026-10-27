export const privateAnalyticsPath = (path: string) =>
  /\/(?:subscriptions)\/(?:confirm|preferences|unsubscribe)(?:\/|$)/.test(
    path,
  ) || /^\/(?:(?:he|ar|fa|de|fr|zh)\/)?match(?:\/|$)/.test(path);

/** Disable before native history updates, including when gtag wraps our wrapper.
 * The flag stays latched for this document so later page-referrer events cannot
 * disclose the previous answer/token URL. A full document load resets it.
 * https://developers.google.com/tag-platform/security/guides/privacy
 */
export function installAnalyticsPrivacyGuard(
  target: Window,
  measurementId: string,
) {
  const disable = (url?: string | URL | null) => {
    if (
      privateAnalyticsPath(
        new URL(url ?? target.location.href, target.location.href).pathname,
      )
    )
      (target as unknown as Record<string, unknown>)[
        `ga-disable-${measurementId}`
      ] = true;
  };
  disable();
  const cleanups = (["pushState", "replaceState"] as const).map((method) => {
    const original = target.history[method];
    const guarded: History[typeof method] = function (...args) {
      disable(args[2]);
      return original.apply(target.history, args);
    };
    target.history[method] = guarded;
    return () => {
      if (target.history[method] === guarded) target.history[method] = original;
    };
  });
  const pop = () => disable();
  target.addEventListener("popstate", pop, true);
  return () => {
    cleanups.forEach((cleanup) => cleanup());
    target.removeEventListener("popstate", pop, true);
  };
}
