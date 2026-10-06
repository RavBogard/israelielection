import { sourceAccessLabels } from "@/lib/source-access";
/** A source's access notes after its link; "English" is left out, since the whole site is in English. */
export default function ChangesSourceLabels({url}:{url:string}) {
  const labels=sourceAccessLabels(url).filter((l)=>l!=="English");
  return labels.length ? <small className="source-access"> ({labels.join(", ")})</small> : null;
}
