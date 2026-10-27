import ExportPage from "@/components/pages/ExportPage";
import { EXPORTS } from "@/lib/i18n/exports";
export const dynamic = "force-dynamic";
export const metadata = {
  title: EXPORTS.fa.download,
  robots: { index: false, follow: true },
};
export default function Page(props: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ExportPage {...props} lang="fa" />;
}
