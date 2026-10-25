import Link from "next/link";
export default function NotFound() { return <div className="wrap article-page"><h1>找不到页面</h1><p>此地址没有对应的页面。</p><Link href="/zh">首页</Link></div>; }
