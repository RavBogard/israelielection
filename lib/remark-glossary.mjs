/**
 * Links the first use of a glossary term on each MDX page to /glossary#<anchor>.
 * Only the forms listed here are linked, so words like "list", "coalition" or
 * "president" stay plain. Never inside headings, links, quotation marks or a <Quote>
 * (quoted words are the speaker's). A term the page already links by hand counts as used.
 * lib/reference.test.ts checks every anchor against data/glossary.json.
 */

/** Surface form → glossary anchor. Case-sensitive; longer forms win over shorter ones. */
export const GLOSSARY_FORMS = {
  "Alternate prime minister": "alternate-prime-minister",
  "alternate prime minister": "alternate-prime-minister",
  "annexation": "annexation",
  "Area C": "area-c",
  "Areas A and B": "areas-a-and-b",
  "Ashkenazi": "ashkenazi",
  "Ashkenazim": "ashkenazi",
  "attorney general": "attorney-general",
  "Bader–Ofer": "bader-ofer-method",
  "Bader-Ofer": "bader-ofer-method",
  "ballot letters": "ballot-letters",
  "Basic Law": "basic-laws",
  "Basic Laws": "basic-laws",
  "Bedouin": "bedouin",
  "Central Elections Committee": "central-elections-committee",
  "Chief Rabbinate": "chief-rabbinate",
  "coalition agreement": "coalition-agreement",
  "coalition agreements": "coalition-agreement",
  "constructive no-confidence": "constructive-no-confidence",
  "dati leumi": "dati-leumi",
  "development towns": "development-towns",
  "double-envelope": "double-envelope-votes",
  "double envelopes": "double-envelope-votes",
  "Druze": "druze",
  "East Jerusalem": "east-jerusalem",
  "electoral threshold": "electoral-threshold",
  "exit poll": "exit-poll",
  "exit polls": "exit-poll",
  "disengagement from Gaza": "gaza-disengagement",
  "Gaza disengagement": "gaza-disengagement",
  "Green Line": "green-line",
  "Hamas": "hamas",
  "Haredi draft": "haredi-draft",
  "Haredim": "haredim",
  "Haredi": "haredim",
  "Hezbollah": "hezbollah",
  "High Court of Justice": "high-court-of-justice",
  "hiloni": "hiloni",
  "hilonim": "hiloni",
  "intifada": "intifada",
  "Intifada": "intifada",
  "Iron Dome": "iron-dome",
  "Judea and Samaria": "judea-and-samaria",
  "judicial overhaul": "judicial-overhaul",
  "Judicial Selection Committee": "judicial-selection-committee",
  "Law of Return": "law-of-return",
  "masorti": "masorti",
  "masortim": "masorti",
  "military rule": "military-rule",
  "Mizrahi": "mizrahi",
  "Mizrahim": "mizrahi",
  "Nakba": "nakba",
  "Nation-State Law": "nation-state-law",
  "Oslo Accords": "oslo-accords",
  "outpost": "outpost",
  "outposts": "outpost",
  "Palestinian Authority": "palestinian-authority",
  "Palestinian citizens of Israel": "palestinian-citizens-of-israel",
  "reasonableness standard": "reasonableness-standard",
  "rotation government": "rotation-government",
  "settlements": "settlement",
  "surplus-vote agreement": "surplus-vote-agreement",
  "surplus-vote agreements": "surplus-vote-agreement",
  "Torato Umanuto": "torato-umanuto",
  "transitional government": "transitional-government",
  "West Bank": "west-bank",
};

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const forms = Object.keys(GLOSSARY_FORMS).sort((a, b) => b.length - a.length);
const PATTERN = new RegExp(`(?<![\\w’'-])(${forms.map(escape).join("|")})(?![\\w’'-])`, "g");
const QUOTED = /"[^"]*"|“[^”]*”/g;

/** Node types whose text is never linked. */
const SKIP = new Set(["heading", "link", "linkReference", "code", "inlineCode", "mdxjsEsm", "mdxFlowExpression", "mdxTextExpression"]);
const SKIP_JSX = new Set(["Quote", "a"]);

function walk(node, fn, parent) {
  if (SKIP.has(node.type)) return;
  if ((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && SKIP_JSX.has(node.name)) return;
  if (node.type === "text") return fn(node, parent);
  if (!node.children) return;
  // Iterate over a copy: fn may replace a text node with several.
  for (const child of [...node.children]) walk(child, fn, node);
}

function collectLinked(node, used) {
  if (node.type === "link" && node.url.startsWith("/glossary#")) used.add(node.url.slice("/glossary#".length));
  for (const c of node.children ?? []) collectLinked(c, used);
}

/** The pieces of a text node, with the first unused term(s) turned into links. */
export function linkText(value, used) {
  const quoted = [...value.matchAll(QUOTED)].map((m) => [m.index, m.index + m[0].length]);
  const out = [];
  let last = 0;
  for (const m of value.matchAll(PATTERN)) {
    const anchor = GLOSSARY_FORMS[m[1]];
    if (used.has(anchor)) continue;
    if (quoted.some(([a, b]) => m.index >= a && m.index < b)) continue;
    used.add(anchor);
    if (m.index > last) out.push({ type: "text", value: value.slice(last, m.index) });
    out.push({ type: "link", url: `/glossary#${anchor}`, children: [{ type: "text", value: m[1] }] });
    last = m.index + m[1].length;
  }
  if (!out.length) return null;
  if (last < value.length) out.push({ type: "text", value: value.slice(last) });
  return out;
}

export default function remarkGlossary() {
  return (tree) => {
    const used = new Set();
    collectLinked(tree, used);
    walk(tree, (node, parent) => {
      const pieces = linkText(node.value, used);
      if (!pieces) return;
      const i = parent.children.indexOf(node);
      parent.children.splice(i, 1, ...pieces);
    });
  };
}
