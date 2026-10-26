import {editionPath,type Lang} from "@/lib/i18n";
import {localizedAlternates} from "@/lib/canonical";
import {referenceText} from "@/lib/i18n/reference";
import {translatedReference} from "./catalog";
export function referenceMetadata(sourcePath:string,lang:Lang,canonicalPath=sourcePath){
 const selected=translatedReference(sourcePath,lang),ready=selected?.state==="original"||selected?.state==="ready";
 return {title:selected?.state==="ready"?selected.translation.blocks[0].text:selected?.state==="original"?selected.source.title:referenceText(lang).pending,alternates:localizedAlternates(editionPath(canonicalPath,lang)!),...(!ready?{robots:{index:false,follow:true}}:{})};
}
