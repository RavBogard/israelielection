import source from "./source-manifest.json";
import published from "./published-translations.json";
import type { SourceDocument,TranslationDocument } from "./translations";
import { selectTranslation } from "./translations";
import type { Lang } from "@/lib/i18n";
export const referenceDocuments=source.documents as SourceDocument[];
export const sourceForPath=(path:string)=>referenceDocuments.find(s=>s.path===path)??null;
export const translatedReference=(path:string,lang:Lang)=>{const doc=sourceForPath(path);return doc?selectTranslation(doc,lang,published.documents as TranslationDocument[]):null};
export const publicReading=referenceDocuments.map(d=>({id:d.id,path:d.path,title:d.title,topic:d.id.split(":")[0]}));
