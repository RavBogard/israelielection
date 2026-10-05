/** Stable heading anchors and a server-rendered contents list share one traversal. */
export const headingText = (node) => node.value ?? (node.children ?? []).map(headingText).join("");
export const headingSlug = (text) => text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "section";

export default function remarkHeadings() {
  return (tree) => {
    const headings = [];
    const used = new Set();
    for (const node of tree.children) {
      const depth = node.type === "heading" ? node.depth : node.type === "mdxJsxFlowElement" && /^h[23]$/.test(node.name ?? "") ? Number(node.name[1]) : 0;
      if (depth !== 2 && depth !== 3) continue;
      const text = headingText(node).trim();
      if (!text) continue;
      const attribute = node.attributes?.find((a) => a.name === "id");
      const base = attribute?.value ?? node.data?.hProperties?.id ?? headingSlug(text);
      let id = base;
      for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
      used.add(id);
      if (node.type === "heading") node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
      else if (attribute) attribute.value = id;
      else node.attributes.push({ type: "mdxJsxAttribute", name: "id", value: id });
      headings.push({ text, id, depth, node });
    }
    if (headings.length < 2) return;
    const element = (name, attributes, children) => ({ type: "mdxJsxFlowElement", name, attributes: Object.entries(attributes).map(([name, value]) => ({ type: "mdxJsxAttribute", name, value })), children });
    const contents = element("nav", { className: "article-contents", "aria-label": "On this page" }, [
      element("p", {}, [{ type: "text", value: "On this page" }]),
      element("ul", {}, headings.map((h) => element("li", { className: h.depth === 3 ? "subsection" : "section" }, [element("a", { href: `#${h.id}` }, [{ type: "text", value: h.text }])]))),
    ]);
    tree.children.splice(tree.children.indexOf(headings[0].node), 0, contents);
  };
}
