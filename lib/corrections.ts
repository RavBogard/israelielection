export const SITE_ORIGIN = "https://www.israelielection.org";
export type Correction = { id: string; date: string; page: string; before: string; after: string; explanation: string; evidence: { title: string; url: string }[]; reviewedBy: string };
export type CorrectionReport = { page: string; claim: string; proposed: string; evidence: string };

/** Only this site's page address can be prefilled, never an arbitrary recipient or script URL. */
export function reportPage(input: string) {
  try {
    const url = new URL(input.slice(0, 2048), SITE_ORIGIN);
    if (!['https:', 'http:'].includes(url.protocol) || !["israelielection.org", "www.israelielection.org", "localhost", "127.0.0.1"].includes(url.hostname)) return SITE_ORIGIN;
    return `${SITE_ORIGIN}${url.pathname}${url.search}${url.hash}`;
  } catch { return SITE_ORIGIN; }
}
export const correctionHref = (page: string) => `/corrections?url=${encodeURIComponent(reportPage(page))}#report`;
export function reportText(report: CorrectionReport) {
  return `Election-site correction\n\nPage: ${reportPage(report.page)}\n\nClaim or number in question:\n${report.claim.trim()}\n\nSuggested correction:\n${report.proposed.trim()}\n\nSupporting evidence:\n${report.evidence.trim()}\n\nPrepared by a reader; the claim has not yet been reviewed.`;
}
export function correctionEmail(email: unknown, report: CorrectionReport) {
  if (typeof email !== "string" || !/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email)) return null;
  return `mailto:${email}?subject=${encodeURIComponent("Correction: Israel Votes 2026")}&body=${encodeURIComponent(reportText(report))}`;
}

/** A manual address belongs to its original prefill; a new contextual link takes precedence. */
export function reportAddress(prefill:string,edited:{from:string;page:string}|null):string {const source=reportPage(prefill);return edited?.from===source?edited.page:source;}
