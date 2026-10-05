import { sourceAccessLabels } from "@/lib/source-access";
export default function ChangesSourceLabels({url}:{url:string}) {
  const labels=sourceAccessLabels(url);
  return labels.length ? <small className="source-access"> ({labels.join(" · ")})</small> : null;
}
