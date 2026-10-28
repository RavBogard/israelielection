export const SITE_ORIGIN = "https://www.israelvotes.org";
export type Correction = {
  id: string;
  date: string;
  page: string;
  before: string;
  after: string;
  explanation: string;
  evidence: { title: string; url: string }[];
  reviewedBy: string;
};
export type CorrectionReport = {
  page: string;
  claim: string;
  proposed: string;
  evidence: string;
};

/** Only this site's page address can be prefilled, never an arbitrary recipient or script URL. */
export function reportPage(input: string) {
  try {
    const url = new URL(input.slice(0, 2048), SITE_ORIGIN);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      ![
        "israelvotes.org",
        "www.israelvotes.org",
        "israelielection.org",
        "www.israelielection.org",
        "localhost",
        "127.0.0.1",
      ].includes(url.hostname)
    )
      return SITE_ORIGIN;
    return `${SITE_ORIGIN}${url.pathname}${url.search}${url.hash}`;
  } catch {
    return SITE_ORIGIN;
  }
}
export const correctionHref = (page: string, lang: Lang = "en") =>
  editionPath(
    `/corrections?url=${encodeURIComponent(reportPage(page))}#report`,
    lang,
  ) ?? `/corrections?url=${encodeURIComponent(reportPage(page))}#report`;
export function reportText(report: CorrectionReport, lang: Lang = "en") {
  const t = correctionText(lang);
  return `${t.header}\n\n${t.page}: ${reportPage(report.page)}\n\n${t.claim}:\n${report.claim.trim()}\n\n${t.proposed}:\n${report.proposed.trim()}\n\n${t.evidence}:\n${report.evidence.trim()}\n\n${t.draftNotice}`;
}
export function correctionEmail(
  email: unknown,
  report: CorrectionReport,
  lang: Lang = "en",
) {
  if (
    typeof email !== "string" ||
    !/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email)
  )
    return null;
  return `mailto:${email}?subject=${encodeURIComponent(correctionText(lang).subject)}&body=${encodeURIComponent(reportText(report, lang))}`;
}

/** A manual address belongs to its original prefill; a new contextual link takes precedence. */
export function reportAddress(
  prefill: string,
  edited: { from: string; page: string } | null,
): string {
  const source = reportPage(prefill);
  return edited?.from === source ? edited.page : source;
}
import { editionPath, type Lang } from "@/lib/i18n";
import { correctionText } from "@/lib/i18n/corrections";
