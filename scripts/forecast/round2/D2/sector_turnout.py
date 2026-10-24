"""Sector turnout from the official per-locality results (round 2, agent D2).

    python3 -I scripts/forecast/round2/D2/sector_turnout.py CACHE_DIR [--write]

Downloads (once, into CACHE_DIR) the Central Elections Committee's final results by locality for the 19th-25th
Knesset from data.gov.il (dataset votes-knesset, CKAN datastore API) and the Central Bureau of Statistics locality
file (bycode2022.xlsx), then computes per election:
  - national: registered (בזב), voters (מצביעים), valid (כשרים), with the double-envelope row (code 9999 / 0) kept;
  - Arab and Druze localities: CBS 'דת יישוב' (locality religion) 2 (non-Jewish locality) or 3 (Bedouin tribe).
    This is the Dayan Center / IDI (Rudnitzky) definition: it reproduces their 2022 figures exactly
    (938,401 registered, 498,894 voters, 53.2%). Mixed cities (code 4: Haifa, Jerusalem, Lod, Ramla, Akko, Tel
    Aviv-Jaffa, Nof HaGalil, Ma'alot-Tarshiha) and double envelopes are outside it;
  - Haredi cities: Bnei Brak, Modi'in Illit, Beitar Illit, El'ad, Immanuel, Rechasim, Kiryat Ye'arim (the IDI's
    Haredi-locality set; Jerusalem's and other cities' Haredi neighbourhoods are not in it);
  - the rest ('general'): national minus the two sectors, double envelopes included (all assigned here).
Turnout is voters / registered. Registered includes ~10% living abroad (almost all in the general sector), so
every official turnout figure understates resident turnout. Writes scripts/forecast/round2/data/turnout-cec.json
with --write (merged into turnout.json by hand-curated fields; see the memo).
"""
import json, os, sys, urllib.request, collections

API = "https://data.gov.il/api/3/action/datastore_search?resource_id={}&limit=5000"
RES = {  # knesset: (date, resource id, Arab-list ballot letters, Shas, UTJ)
    19: ("2013-01-22", "c20cdcef-4d42-4241-a41b-6ca7ae51002d", ["עם", "ו", "ד"]),
    20: ("2015-03-17", "929b50c6-f455-4be2-b438-ec6af01421f2", ["ודעם"]),
    21: ("2019-04-09", "1a1c7b2b-e819-4ba9-b159-d68e3566c58b", ["ום", "דעם"]),
    22: ("2019-09-17", "bd22cd14-138c-4917-931a-ef628c2a5a30", ["ודעם"]),
    23: ("2020-03-02", "3dc36e20-25d6-4496-ba6a-71d9bc917349", ["ודעם"]),
    24: ("2021-03-23", "9921a347-8466-4ef4-81f9-22523c5c4632", ["ודעם", "עם"]),
    25: ("2022-11-01", "b392b8ee-ba45-4ea0-bfed-f03a1a36e99c", ["עם", "ום", "ד"]),
}
CBS = "https://www.cbs.gov.il/he/publications/doclib/2019/ishuvim/bycode2022.xlsx"
HAREDI = {6100: "Bnei Brak", 3797: "Modi'in Illit", 3780: "Beitar Illit", 1309: "El'ad", 3660: "Immanuel", 922: "Rechasim", 1137: "Kiryat Ye'arim"}
# Official national totals (registered, voters = valid + invalid, valid) from the {{Election results}} templates of the
# English Wikipedia election articles (read 2026-10-23), which cite the CEC. Used for the national row because the
# 2013 locality file has no double-envelope row; for 2015-2022 the file's own sum agrees with these.
OFFICIAL = {19: (5656705, 3833646, 3792742), 20: (5881696, 4254738, 4210884), 21: (6339729, 4340253, 4309270),
            22: (6394030, 4465168, 4436806), 23: (6453255, 4615135, 4590062), 24: (6578084, 4436365, 4410052),
            25: (6788804, 4794593, 4764742)}
UA = {"User-Agent": "Mozilla/5.0 (research script)"}


def get(url, path):
    if not os.path.exists(path):
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180) as r, open(path, "wb") as f:
            f.write(r.read())
    return path


def main():
    cache = sys.argv[1]
    os.makedirs(cache, exist_ok=True)
    import openpyxl
    wb = openpyxl.load_workbook(get(CBS, os.path.join(cache, "bycode2022.xlsx")), read_only=True)
    rows = list(wb.active.iter_rows(values_only=True))[1:]
    rel = {r[1]: r[11] for r in rows}
    out = {}
    rowsByK = {}
    for k, (date, rid, arab) in RES.items():
        d = json.load(open(get(API.format(rid), os.path.join(cache, f"k{k}.json")), encoding="utf-8"))
        recs = d["result"]["records"]
        rowsByK[k] = recs
        assert len(recs) == d["result"]["total"], k
        n = lambda r, c: int(float(r.get(c) or 0))
        acc = collections.defaultdict(lambda: collections.Counter())
        unmatched = []
        for r in recs:
            code = n(r, "סמל ישוב")
            g = "arab" if rel.get(code) in (2, 3) else "haredi" if code in HAREDI else "envelopes" if code in (0, 9999, 99999) else "general"
            if code not in rel and code not in (0, 9999):
                unmatched.append((code, r.get("שם ישוב"), n(r, "בזב")))
            a = acc[g]
            a["registered"] += n(r, "בזב"); a["voters"] += n(r, "מצביעים"); a["valid"] += n(r, "כשרים")
            a["arabLists"] += sum(n(r, c) for c in arab); a["shas"] += n(r, "שס"); a["utj"] += n(r, "ג")
        filesum = sum(acc.values(), collections.Counter())
        reg, vot, val = OFFICIAL[k]
        # Votes not in any locality row (2013: the double envelopes are missing from the file) go to 'envelopes'.
        acc["envelopes"]["voters"] += vot - filesum["voters"]; acc["envelopes"]["valid"] += val - filesum["valid"]
        acc["envelopes"]["registered"] += reg - filesum["registered"]
        nat = sum(acc.values(), collections.Counter())
        gen = acc["general"] + acc["envelopes"]
        pct = lambda a, b: round(100 * a / b, 2) if b else None
        sec = lambda a: {"registered": a["registered"], "voters": a["voters"], "valid": a["valid"], "turnout": pct(a["voters"], a["registered"]),
                         "arabListsShareOfValid": pct(a["arabLists"], a["valid"]), "shasUtjShareOfValid": pct(a["shas"] + a["utj"], a["valid"])}
        out[date] = {
            "knesset": k, "national": sec(nat), "arabDruzeLocalities": sec(acc["arab"]), "harediCities": sec(acc["haredi"]),
            "generalImplied": sec(gen), "generalLocalitiesOnly": sec(acc["general"]), "doubleEnvelopes": {"voters": acc["envelopes"]["voters"], "valid": acc["envelopes"]["valid"]},
            "arabListVotesFromArabLocalities": pct(acc["arab"]["arabLists"], nat["arabLists"]),
            "shasUtjVotesFromHarediCities": pct(acc["haredi"]["shas"] + acc["haredi"]["utj"], nat["shas"] + nat["utj"]),
            "utjVotesFromHarediCities": pct(acc["haredi"]["utj"], nat["utj"]), "shasVotesFromHarediCities": pct(acc["haredi"]["shas"], nat["shas"]),
            "arabLocalitiesShareOfRegistered": pct(acc["arab"]["registered"], nat["registered"]),
            "harediCitiesShareOfRegistered": pct(acc["haredi"]["registered"], nat["registered"]),
            "unmatchedLocalities": unmatched,
            "source": f"https://data.gov.il/dataset/votes-knesset (resource {rid})",
        }
        o = out[date]
        print(f"{date} K{k}: national {o['national']['turnout']}% | Arab&Druze loc {o['arabDruzeLocalities']['turnout']}% "
              f"(reg {o['arabDruzeLocalities']['registered']:,}, Arab lists {o['arabDruzeLocalities']['arabListsShareOfValid']}% of valid) | "
              f"Haredi cities {o['harediCities']['turnout']}% (Shas+UTJ {o['harediCities']['shasUtjShareOfValid']}%) | general implied {o['generalImplied']['turnout']}% "
              f"| Arab-list votes from Arab loc {o['arabListVotesFromArabLocalities']}% | Shas+UTJ from Haredi cities {o['shasUtjVotesFromHarediCities']}% | unmatched {len(unmatched)} {sum(u[2] for u in unmatched)}")
    # Shas strongholds: Jewish (CBS religion 1), non-Haredi localities with at least 5,000 registered where Shas won at
    # least 12% of the valid vote in 2015 (a fixed set chosen on the first election under the 3.25% threshold, so it
    # is not defined by the outcomes it is used to explain).
    n = lambda r, c: int(float(r.get(c) or 0))
    strong = {n(r, "סמל ישוב") for r in rowsByK[20] if rel.get(n(r, "סמל ישוב")) == 1 and n(r, "סמל ישוב") not in HAREDI
              and n(r, "בזב") >= 5000 and n(r, "כשרים") and n(r, "שס") / n(r, "כשרים") >= 0.12}
    for k, (date, rid, arab) in RES.items():
        a = collections.Counter()
        for r in rowsByK[k]:
            if n(r, "סמל ישוב") in strong:
                a["registered"] += n(r, "בזב"); a["voters"] += n(r, "מצביעים"); a["valid"] += n(r, "כשרים"); a["shas"] += n(r, "שס")
        o = out[date]
        o["shasStrongholds"] = {"localities": len(strong), "registered": a["registered"], "voters": a["voters"], "turnout": round(100 * a["voters"] / a["registered"], 2),
                                "shasShareOfValid": round(100 * a["shas"] / a["valid"], 2),
                                "turnoutMinusGeneralLocalities": round(100 * a["voters"] / a["registered"] - o["generalLocalitiesOnly"]["turnout"], 2)}
        print(date, "Shas strongholds", o["shasStrongholds"])
    print("strongholds:", sorted(r[24] for r in rows if r[1] in strong))
    names = {r[1]: r[24] for r in rows}
    print("Haredi codes ->", {c: names.get(c) for c in HAREDI})
    if "--write" in sys.argv:
        here = os.path.dirname(os.path.abspath(__file__))
        dest = os.path.join(here, "..", "data", "turnout-cec.json")
        json.dump({"about": __doc__.strip(), "sources": {"results": "https://data.gov.il/dataset/votes-knesset (Central Elections Committee final results by locality, 19th-25th Knesset)", "localities": CBS},
                   "elections": out}, open(dest, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print("wrote", os.path.relpath(dest))


main()
