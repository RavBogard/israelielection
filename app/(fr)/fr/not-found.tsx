import Link from "next/link";
export default function NotFound() { return <div className="wrap article-page"><h1>Page introuvable</h1><p>Cette adresse ne correspond à aucune page du site.</p><Link href="/fr">Accueil</Link></div>; }
