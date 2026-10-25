import Link from "next/link";
import { ui } from "@/lib/i18n/ui";
export default function NotFound() { const lang = "fa"; return <div className="wrap article-page"><h1>{ui(lang,"Page not found")}</h1><p>{ui(lang,"This address does not match a page on the site.")}</p><Link href="/fa">{ui(lang,"Home")}</Link></div>; }
