"""Cross-check of sector turnout from the CEC per-locality result files (round 2, agent B).

    python3 -I scripts/forecast/round2/B/cec-sectors.py CACHE_DIR [--fetch]

--fetch downloads https://media{21..25}.bechirot.gov.il/files/expc.csv into CACHE_DIR (the 20th Knesset's file was
not reachable from this environment). Prints, per election: national turnout; Haredi-city turnout (Bnei Brak,
Modi'in Illit, Beitar Illit, El'ad, Immanuel, Rekhasim); turnout and Arab-list share in localities where the Arab
lists won 50%+ of the valid vote. Agent D2's scripts/forecast/round2/data/turnout-cec.json is the fuller table.
"""
import csv, io, os, sys, urllib.request

D = sys.argv[1]
HAREDI = ["בני ברק", "מודיעין עילית", "ביתר עילית", "אלעד", "עמנואל", "רכסים"]
ARAB = {21: ["ום", "דעם"], 22: ["ודעם"], 23: ["ודעם"], 24: ["ודעם", "עם"], 25: ["ום", "עם", "ד"]}
if "--fetch" in sys.argv:
    os.makedirs(D, exist_ok=True)
    for k in ARAB:
        req = urllib.request.Request(f"https://media{k}.bechirot.gov.il/files/expc.csv", headers={"User-Agent": "generic-research-bot/1.0"})
        open(f"{D}/expc{k}.csv", "wb").write(urllib.request.urlopen(req, timeout=60).read())

def load(k):
    raw = open(f"{D}/expc{k}.csv", "rb").read()
    try:
        t = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        t = raw.decode("cp1255")
    return list(csv.DictReader(io.StringIO(t)))

for k in ARAB:
    rows = load(k)
    n = lambda r, c: int(float(r.get(c) or 0))
    name = lambda r: r["שם ישוב"].strip()
    reg = sum(n(r, "בזב") for r in rows); vot = sum(n(r, "מצביעים") for r in rows)
    h = [r for r in rows if name(r) in HAREDI]
    hreg = sum(n(r, "בזב") for r in h); hv = sum(n(r, "מצביעים") for r in h)
    areg = av = aval = al = 0
    for r in rows:
        if name(r) == "מעטפות חיצוניות":
            continue
        kv = n(r, "כשרים"); a = sum(n(r, c) for c in ARAB[k])
        if kv and a / kv >= 0.5:
            areg += n(r, "בזב"); av += n(r, "מצביעים"); aval += kv; al += a
    print(f"Knesset {k}: national {100*vot/reg:.2f}%, Haredi cities {100*hv/hreg:.2f}%, Arab-majority localities {100*av/areg:.1f}% (Arab lists {100*al/aval:.1f}% of their valid vote)")
