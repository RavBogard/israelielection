"""
Builds scripts/forecast/backtest/data/<yyyy-mm>.json from English Wikipedia wikitext.

Usage (from the repo root; needs python3 and network, run once, output is committed data):
    python3 -I scripts/forecast/backtest/build-data.py <dir-with-wikitext> [--fetch]

With --fetch it downloads the raw wikitext (index.php?action=raw) of the twelve pages named in
ELECTIONS into <dir>; otherwise it reads <dir>/p<key>.wiki (polling page) and <dir>/e<key>.wiki
(election article). Everything that is a judgment (list ids, blocs, pollster aliases, agreements)
is written out by hand below, so the JSON can be audited against this file.
"""
import json, os, re, sys, urllib.request, datetime

WP = "https://en.wikipedia.org/wiki/"
MON = {m: i + 1 for i, m in enumerate("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split())}

# Per election: page titles, label columns, the party columns in header order mapped to list ids
# (None = skip: Others / bloc sums), list metadata, agreements and pollster aliases.
ELECTIONS = {
 "2015-03": dict(date="2015-03-17", poll="Opinion_polling_for_the_2015_Israeli_legislative_election", article="2015_Israeli_legislative_election",
   labels=1, cols=["likud","yb","ya","zu","zu","jh","shas","utj","meretz","jl","jl","jl","yachad","yachad","kulanu"],
   lists={"likud":("Likud","net","Likud"),"zu":("Zionist Union","opp","Zionist Union"),"jl":("Joint List","arab","Joint List"),"ya":("Yesh Atid","opp","Yesh Atid"),
          "kulanu":("Kulanu","mid","Kulanu"),"jh":("The Jewish Home","net","The Jewish Home"),"shas":("Shas","net","Shas"),"yb":("Yisrael Beiteinu","net","Yisrael Beiteinu"),
          "utj":("United Torah Judaism","net","United Torah Judaism"),"meretz":("Meretz","opp","Meretz"),"yachad":("Yachad (with Otzma Yehudit)","net","Yachad")},
   agreements=[["likud","jh"],["yb","kulanu"],["zu","meretz"],["shas","utj"]],
   blocNote="Netanyahu bloc as calibration.json counts it for 2015: Likud, Jewish Home, Shas, UTJ, Yisrael Beiteinu, Yachad. Kulanu (centrist, joined the government after the vote) is 'mid'."),
 "2019-04": dict(date="2019-04-09", poll="Opinion_polling_for_the_April_2019_Israeli_legislative_election", article="April_2019_Israeli_legislative_election",
   labels=1, cols=["likud","labor","bw","kulanu","raambalad","shas","utj","urwp","yb","meretz","ht","nr","gesher","zehut",None,None],
   lists={"likud":("Likud","net","Likud"),"bw":("Blue and White","opp","Blue and White"),"shas":("Shas","net","Shas"),"utj":("United Torah Judaism","net","United Torah Judaism"),
          "ht":("Hadash–Ta'al","arab","Hadash–Ta'al"),"labor":("Labor","opp","Labor Party"),"yb":("Yisrael Beiteinu","net","Yisrael Beiteinu"),"urwp":("Union of Right-Wing Parties","net","Union of Right-Wing Parties"),
          "meretz":("Meretz","opp","Meretz"),"kulanu":("Kulanu","net","Kulanu"),"raambalad":("Ra'am–Balad","arab","United Arab List–Balad"),"nr":("New Right","net","New Right"),
          "zehut":("Zehut","net","Zehut"),"gesher":("Gesher","opp","Gesher")},
   agreements=[["urwp","likud"],["nr","yb"],["meretz","labor"],["utj","shas"],["ht","raambalad"]],
   blocNote="The right bloc as Wikipedia's 'R' column and calibration.json count it: Likud, Kulanu, Shas, UTJ, URWP, Yisrael Beiteinu, New Right, Zehut. Gesher is counted with the opposition (centre-left, Orly Levy)."),
 "2019-09": dict(date="2019-09-17", poll="Opinion_polling_for_the_September_2019_Israeli_legislative_election", article="September_2019_Israeli_legislative_election",
   labels=2, cols=["likud","bw","jl","shas","utj","yamina","lg","yb","du","zehut","otzma",None],
   lists={"bw":("Blue and White","opp","Blue and White"),"likud":("Likud","net","Likud"),"jl":("Joint List","arab","Joint List"),"shas":("Shas","net","Shas"),
          "yb":("Yisrael Beiteinu","mid","Yisrael Beiteinu"),"utj":("United Torah Judaism","net","United Torah Judaism"),"yamina":("Yamina","net","Yamina"),
          "lg":("Labor–Gesher","opp","Labor–Gesher"),"du":("Democratic Union","opp","Democratic Union"),"otzma":("Otzma Yehudit","mid","Otzma Yehudit")},
   agreements=[["yamina","likud"],["du","lg"],["utj","shas"],["bw","yb"]],
   blocNote="Netanyahu bloc as Wikipedia's 'Gov.' column and calibration.json count it: Likud, Shas, UTJ, Yamina. Yisrael Beiteinu (Lieberman, in neither bloc) is 'mid'. Otzma Yehudit is right-wing but outside the counted bloc; it is marked 'mid' so the bloc figures match calibration.json (it failed, so the result bloc totals do not depend on this)."),
 "2020-03": dict(date="2020-03-02", poll="Opinion_polling_for_the_2020_Israeli_legislative_election", article="2020_Israeli_legislative_election",
   labels=2, cols=["bw","likud","jl","lgm","shas","yb","utj","yamina","otzma",None],
   lists={"likud":("Likud","net","Likud"),"bw":("Blue and White","opp","Blue and White"),"jl":("Joint List","arab","Joint List"),"shas":("Shas","net","Shas"),
          "utj":("United Torah Judaism","net","United Torah Judaism"),"lgm":("Labor–Gesher–Meretz","opp","Labor-Gesher-Meretz"),"yb":("Yisrael Beiteinu","mid","Yisrael Beiteinu"),
          "yamina":("Yamina","net","Yamina"),"otzma":("Otzma Yehudit","mid","Otzma Yehudit")},
   agreements=[["likud","yamina"],["bw","lgm"],["utj","shas"]],
   blocNote="Netanyahu bloc as Wikipedia's 'Gov.' column and calibration.json count it: Likud, Shas, UTJ, Yamina. Yisrael Beiteinu is 'mid'; Otzma Yehudit 'mid' as in Sep 2019 (failed)."),
 "2021-03": dict(date="2021-03-23", poll="Opinion_polling_for_the_2021_Israeli_legislative_election", article="2021_Israeli_legislative_election",
   labels=2, cols=["likud","ya","bw","jl","shas","utj","yb","meretz","raam","yamina","nh","labor","rz","nep"],
   lists={"likud":("Likud","net","Likud"),"ya":("Yesh Atid","opp","Yesh Atid"),"shas":("Shas","net","Shas"),"bw":("Blue and White","opp","Blue and White"),
          "yamina":("Yamina","mid","Yamina"),"labor":("Labor","opp","Israeli Labor Party"),"utj":("United Torah Judaism","net","United Torah Judaism"),
          "yb":("Yisrael Beiteinu","opp","Yisrael Beiteinu"),"rz":("Religious Zionist Party","net","Religious Zionist Party"),"jl":("Joint List","arab","Joint List"),
          "nh":("New Hope","opp","New Hope"),"meretz":("Meretz","opp","Meretz"),"raam":("Ra'am","arab","Ra'am"),"nep":("New Economic Party","opp","New Economic Party")},
   agreements=[["yamina","nh"],["ya","yb"],["bw","nep"],["likud","rz"],["labor","meretz"],["shas","utj"]],
   blocNote="Netanyahu bloc as calibration.json counts it for 2021: Likud, Shas, UTJ, Religious Zionism. Yamina (Bennett, uncommitted) is 'mid'. New Hope is anti-Netanyahu ('opp')."),
 "2022-11": dict(date="2022-11-01", poll="Opinion_polling_for_the_2022_Israeli_legislative_election", article="2022_Israeli_legislative_election",
   labels=2, cols=["likud","ya","nu","shas","jh","labor","utj","yb","rz","ht","meretz","raam","balad",None,None,None],
   lists={"likud":("Likud","net","Likud"),"ya":("Yesh Atid","opp","Yesh Atid"),"rz":("Religious Zionism–Otzma Yehudit","net","Religious Zionism-Otzma Yehudit"),
          "nu":("National Unity","opp","National Unity"),"shas":("Shas","net","Shas"),"utj":("United Torah Judaism","net","United Torah Judaism"),
          "yb":("Yisrael Beiteinu","opp","Yisrael Beiteinu"),"raam":("Ra'am","arab","Ra'am"),"ht":("Hadash–Ta'al","arab","Hadash–Ta'al"),"labor":("Labor","opp","Israeli Labor Party"),
          "meretz":("Meretz","opp","Meretz"),"balad":("Balad","arab","Balad"),"jh":("The Jewish Home","mid","The Jewish Home")},
   agreements=[["labor","meretz"],["likud","rz"],["nu","ya"],["shas","utj"]],
   blocNote="Netanyahu bloc as calibration.json counts it for 2022: Likud, Shas, UTJ, Religious Zionism–Otzma. The Jewish Home (Shaked, uncommitted, failed) is 'mid'. The fringe Pirates–Yesh Kivun agreement is omitted (neither list is polled)."),
}

# Pollster = the outlet that published (as in data/polls.json), with spelling variants merged.
# Only spelling variants of one outlet are merged; an outlet co-publishing with another keeps its own
# label (Maariv & The Jerusalem Post), so two firms working for one outlet in one window are not merged.
ALIASES = {"HaHadashot 12": "Channel 12", "Keshet": "Channel 12",
           "The Jerusalem Post/ Maariv": "Maariv", "103fm & Maariv": "Maariv", "Israel Radio": "Reshet Bet",  # same firm, same outlet
           "Israel Hayom & i24 News": "Israel Hayom", "Israel Hayom & i24NEWS": "Israel Hayom", "Yisrael Hayom": "Israel Hayom",
           "Radio 103FM": "103fm", "Radio 103 FM": "103fm", "Walla!": "Walla", "Yediot Ahronot": "Yedioth Ahronoth", "Kan": "Kan 11",
           "Israel Army Radio (Galatz)": "Galei Tzahal", "Army Radio": "Galei Tzahal"}
OUTLETS_2015 = {"Channel 2", "Channel 10", "Channel 1", "Reshet Bet", "Yisrael Hayom", "Israel Radio", "Maariv"}

def clean(s):
    s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    s = re.sub(r'<ref[^>]*/>', '', s)
    return re.sub(r'<ref[^>]*>.*?</ref>', '', s, flags=re.S)

def split_top(s, sep):
    out, depth, i, start = [], 0, 0, 0
    while i < len(s):
        two = s[i:i+2]
        if two in ('[[', '{{'): depth += 1; i += 2; continue
        if two in (']]', '}}'): depth -= 1; i += 2; continue
        if s[i:i+len(sep)] == sep and depth == 0:
            out.append(s[start:i]); i += len(sep); start = i; continue
        i += 1
    out.append(s[start:]); return out

def attr_split(c):
    parts = split_top(c, '|')
    return ('', c) if len(parts) == 1 else (parts[0], '|'.join(parts[1:]))

def plain(s):
    s = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', s)
    s = re.sub(r"'''?", '', s); s = re.sub(r'<br\s*/?>', ' ', s); s = re.sub(r'</?small>', '', s)
    s = s.replace('&nbsp;', ' ')
    return re.sub(r'\s+', ' ', s).strip()

def rows_of(wiki):
    lines = clean(wiki).split('\n')
    start = next(i for i, l in enumerate(lines) if l.startswith('{|'))
    rows, cur = [], None
    for ln in lines[start+1:]:
        s = ln.rstrip()
        if s.startswith('|}'): break
        if s.startswith('|-'):
            if cur is not None: rows.append(cur)
            cur = {'attr': s[2:], 'cells': []}; continue
        if cur is None: cur = {'attr': '', 'cells': []}
        if s.startswith('!') or s.startswith('|'):
            body = s[1:].replace('!!', '||') if s.startswith('!') else s[1:]
            for c in split_top(body, '||'):
                a, v = attr_split(c)
                m = re.search(r'colspan\s*=\s*"?(\d+)', a)
                cur['cells'].append({'h': s.startswith('!'), 'span': int(m.group(1)) if m else 1, 'v': v.strip()})
        elif cur['cells']:
            cur['cells'][-1]['v'] += ' ' + s
    if cur: rows.append(cur)
    return rows

def parse_date(s, year):
    ms = list(re.finditer(r'(\d{1,2})\s+([A-Z][a-z]{2})[a-z]*\.?(?:\s+(\d{2,4}))?', s))
    if not ms: return None
    m = ms[-1]; y = m.group(3)
    y = int(y) + (2000 if y and len(y) == 2 else 0) if y else year
    return datetime.date(y, MON[m.group(2)], int(m.group(1)))

def value(v):
    """-> ('seats', n, pct) | ('below', pct|None) | None (not reported)"""
    t = plain(v)
    if not t or re.search(r'N/A', t): return None
    pct = re.search(r'\(?\s*(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?\s*%\s*\)?', t)
    p = None
    if pct:
        p = float(pct.group(1)) if not pct.group(2) else round((float(pct.group(1)) + float(pct.group(2))) / 2, 2)
    seat = re.match(r'^\s*(\d+)\b(?!\s*(?:\.\d|%))', t)
    if seat and int(seat.group(1)) > 0: return ('seats', int(seat.group(1)), p)
    if seat or t in ('–', '-', '—') or p is not None: return ('below', p)
    return None

def split_label(label, key):
    """'Firm/Publisher' (2015, Apr 2019) -> firm, publisher."""
    parts = [x.strip() for x in label.split('/')]
    if len(parts) == 1:
        if key == "2015-03" and label in OUTLETS_2015: return None, label
        if "Army Radio" in label: return None, label
        return label, label  # a firm publishing on its own (Miskar, Geocartography)
    return '/'.join(parts[:-1]), parts[-1]

def build(key, cfg, d):
    ed = datetime.date.fromisoformat(cfg['date'])
    rows = rows_of(open(os.path.join(d, f"p{key}.wiki")).read())
    polls, year = [], ed.year
    for r in rows:
        cells = r['cells']
        if not cells: continue
        if cells[0]['h']:
            # Year divider rows ("! colspan=20 | 2014") in the 2015 table set the year of undated rows.
            if re.fullmatch(r'\d{4}', plain(cells[0]['v'])): year = int(plain(cells[0]['v']))
            continue
        dt = parse_date(plain(cells[0]['v']), year)
        if not dt or dt >= ed or (ed - dt).days > 28: continue
        lab = cells[1:1+cfg['labels']]
        if any(c['span'] > 1 for c in lab) or len(cells) < 1 + cfg['labels'] + 5:
            continue  # event row / results row
        if cfg['labels'] == 1:
            firm, pub = split_label(plain(lab[0]['v']), key)
        else:
            firm, pub = plain(lab[0]['v']), plain(lab[1]['v'])
            if pub in ('–', '-', ''): pub = firm
        raw_pub = pub
        pollster = ALIASES.get(pub, pub)
        if 'exit poll' in (firm or '').lower() + pollster.lower(): continue
        results, combined, col = {}, [], 0
        for c in cells[1+cfg['labels']:]:
            ids = [x for x in cfg['cols'][col:col+c['span']]]
            col += c['span']
            if not ids or ids[0] is None: continue
            v = value(c['v'])
            if v is None: continue
            uniq = list(dict.fromkeys(i for i in ids if i))
            if len(uniq) > 1:
                if v[0] == 'seats': combined.append({"parties": uniq, "seats": v[1]})
                continue
            lid = uniq[0]
            if v[0] == 'seats':
                results[lid] = {"seats": v[1]} | ({"pct": f"{v[2]}%"} if v[2] is not None else {})
            else:
                results[lid] = {"seats": 0, "belowThreshold": True} | ({"pct": f"{v[1]}%"} if v[1] is not None else {})
        tot = sum(x['seats'] for x in results.values()) + sum(c['seats'] for c in combined)
        firmtxt = (firm or '') + ' ' + raw_pub
        filber = bool(re.search(r'Direct Polls|Filber|Next Data', firmtxt))
        pid = re.sub(r'[^a-z0-9]+', '-', pollster.lower()).strip('-') + '-' + dt.isoformat()
        while any(p['id'] == pid for p in polls): pid += 'b'
        polls.append({"id": pid, "pollster": pollster, "firm": firm, "fieldwork": plain(cells[0]['v']), "published": dt.isoformat(),
                      "via": "Wikipedia", "url": WP + cfg['poll'], "n": None, "margin": None,
                      "note": None if tot == 120 else f"Seats as printed sum to {tot}.", "filber": filber,
                      "results": results, "combined": combined})
    # Results from the article's {{Election results}} template.
    w = open(os.path.join(d, f"e{key}.wiki")).read()
    seg = w[w.find('{{Election results'):]; seg = re.sub(r'<!--.*?-->', '', seg[:seg.find('\n}}')], flags=re.S)
    P = {m.group(1): plain(m.group(2)) for m in re.finditer(r'\|\s*party(\d+)\s*=\s*(.*?)(?=\|\s*(?:votes|seats|sc|color)\d+|\n\|)', seg, flags=re.S)}
    V = {m.group(1): int(m.group(2)) for m in re.finditer(r'\|\s*votes(\d+)\s*=\s*(\d+)', seg)}
    S = {m.group(1): int(m.group(2)) for m in re.finditer(r'\|\s*seats(\d+)\s*=\s*(\d+)', seg)}
    valid = sum(V.values())
    byname = {P[k].split('|')[0].strip(): k for k in V}
    result, lists, blocs = {}, {}, {}
    for lid, (name, bloc, rname) in cfg['lists'].items():
        k = byname.get(rname)
        if k is None: raise SystemExit(f"{key}: no result row named {rname!r}; have {list(byname)[:15]}")
        result[lid] = {"votes": V[k], "pct": round(100 * V[k] / valid, 3), "seats": S[k], "passed": S[k] > 0}
        lists[lid] = name; blocs[lid] = bloc
    assert sum(r['seats'] for r in result.values()) == 120, key
    return {
        "election": cfg['date'], "key": key, "knesset": 120, "threshold": 0.0325,
        "sources": {"polls": WP + cfg['poll'], "result": WP + cfg['article'] + "#Results", "agreements": WP + cfg['article'] + "#Surplus-vote_agreements"},
        "lists": lists, "blocs": blocs, "blocNote": cfg['blocNote'],
        "result": {"validVotes": valid, "lists": result},
        "agreements": cfg['agreements'],
        "polls": sorted(polls, key=lambda p: (p['published'], p['pollster']), reverse=True),
    }

if __name__ == '__main__':
    d = sys.argv[1]
    if '--fetch' in sys.argv:
        for key, cfg in ELECTIONS.items():
            for pre, t in (('p', cfg['poll']), ('e', cfg['article'])):
                req = urllib.request.Request(f"https://en.wikipedia.org/w/index.php?title={t}&action=raw", headers={"User-Agent": "israelielection-backtest/1.0"})
                open(os.path.join(d, f"{pre}{key}.wiki"), 'wb').write(urllib.request.urlopen(req).read())
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
    os.makedirs(out, exist_ok=True)
    for key, cfg in ELECTIONS.items():
        data = build(key, cfg, d)
        data["retrieved"] = datetime.date.today().isoformat()
        json.dump(data, open(os.path.join(out, f"{key}.json"), 'w'), indent=1, ensure_ascii=False)
        print(key, len(data['polls']), 'polls in the last 28 days;', sum(p['filber'] for p in data['polls']), 'Filber')
