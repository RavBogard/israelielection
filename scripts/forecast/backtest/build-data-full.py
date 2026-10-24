"""
Builds scripts/forecast/backtest/data-full/<yyyy-mm>.json: every poll on English Wikipedia's polling page for
seven elections (2013-01, 2015-03, 2019-04, 2019-09, 2020-03, 2021-03, 2022-11), from the day after the previous
election to the day before the vote, in the schema of data/<yyyy-mm>.json (see README.md).

Usage (from the repo root; python3, run once):
    python3 -I scripts/forecast/backtest/build-data-full.py <dir-with-wikitext> [--fetch]

It reads <dir>/p<key>.wiki (polling page) and <dir>/e<key>.wiki (election article), the same raw wikitext
build-data.py reads (index.php?action=raw), and with --fetch downloads them first. The six elections reuse
build-data.py's ELECTIONS (list ids, names, blocs, agreements, blocNote, result rows) unchanged, so lists, blocs,
agreements and result objects are identical to data/<key>.json; 2013 is configured here.

Differences from build-data.py:
- every polling table of the campaign is read (Wikipedia splits a campaign into several tables as lists merge
  and split), each with its own hand-written column map in TABLES below; scenario, student and prime-minister
  tables are not read;
- rowspans are expanded, so a cell spanning rows does not shift later columns; a row whose date and pollster
  cells are both carried from the row above is a variant (another scenario) of that poll and is dropped (the
  kept poll gets a note saying how many variants Wikipedia prints);
- an undated year (most tables print "8 Jan") is inferred from the year-divider rows when the table has them,
  otherwise from the table order (newest first): the latest year that keeps the date on or before the row above;
- a column may hold a party that later merged into a final list, or one that split, withdrew or was renamed.
  Those get ids of their own, documented in `otherLists` ({name, bloc, into, note}); `into` is the final list
  the party merged into (null if none). A cell spanning several columns whose parties all merge into one final
  list is that final list; a cell spanning parties of different lists is a `combined` cell, as before. A column
  printing a joint run of two lists (a tuple in the column map) is a `combined` cell;
- fractional seats printed by a pollster (Geocartography 2013: 16.5) are kept as fractional seats.
"""
import json, os, re, sys, urllib.request, datetime, hashlib, importlib.util, collections

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("build_data", os.path.join(HERE, "build-data.py"))
bd = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(bd)
WP, MON = bd.WP, bd.MON
J = tuple  # a column printing a joint run of two lists -> combined cell

# ---------------------------------------------------------------------------------------------------------------
# 2013 (19th Knesset, 22 Jan 2013, threshold 2%). Judgments written out here.
# Lists: every list the final polls report separately. Likud Yisrael Beiteinu is one list (merged 25 Oct 2012);
# The Jewish Home ran with the National Union (Tkuma) as one list. The three Arab lists ran separately (Ra'am-Ta'al,
# Hadash, Balad), and several pollsters print them as one cell (a combined cell).
# Blocs: the 'net' bloc is the right-religious bloc that won 61 seats and recommended Netanyahu: Likud Yisrael
# Beiteinu, Jewish Home, Shas, UTJ, plus Otzma LeYisrael (far right, failed with 1.76%). Yesh Atid (centrist, first
# run, uncommitted, joined Netanyahu's government after the vote) is 'mid', as Kulanu 2015 is; Am Shalem (Haim
# Amsalem's moderate Haredi split from Shas, failed) is 'mid'. Labor, Hatnuah, Meretz and Kadima are 'opp'.
# Agreements: the article's surplus-vote list; the fringe Dor Bonei Haaretz-Tzedek Hevrati pair is omitted.
# ---------------------------------------------------------------------------------------------------------------
E2013 = dict(date="2013-01-22", poll="Opinion_polling_for_the_2013_Israeli_legislative_election", article="2013_Israeli_legislative_election",
  threshold=0.02,
  lists={"likud": ("Likud Yisrael Beiteinu", "net", "Likud Yisrael Beiteinu"), "ya": ("Yesh Atid", "mid", "Yesh Atid"),
         "labor": ("Labor", "opp", "Labor Party"), "jh": ("The Jewish Home", "net", "The Jewish Home"), "shas": ("Shas", "net", "Shas"),
         "utj": ("United Torah Judaism", "net", "United Torah Judaism"), "hatnuah": ("Hatnuah", "opp", "Hatnua"), "meretz": ("Meretz", "opp", "Meretz"),
         "raam": ("Ra'am–Ta'al", "arab", "Ra'am"), "hadash": ("Hadash", "arab", "Hadash"), "balad": ("Balad", "arab", "Balad"),
         "kadima": ("Kadima", "opp", "Kadima"), "otzma": ("Otzma LeYisrael", "net", "Otzma LeYisrael"), "amshalem": ("Am Shalem", "mid", "Am Shalem")},
  agreements=[["likud", "jh"], ["hatnuah", "meretz"], ["labor", "ya"], ["amshalem", "kadima"], ["hadash", "balad"], ["utj", "shas"]],
  blocNote="2013 judgments (made for this file; no calibration.json entry): the Netanyahu bloc is the right-religious bloc that won 61 seats and recommended Netanyahu: Likud Yisrael Beiteinu, Jewish Home, Shas, UTJ, plus Otzma LeYisrael (far right, failed). Yesh Atid (centrist, first run, uncommitted, joined the government after the vote) is 'mid' as Kulanu 2015 is; Am Shalem (moderate Haredi split from Shas, failed) is 'mid'. Labor, Hatnuah, Meretz and Kadima are 'opp'; Ra'am-Ta'al, Hadash and Balad 'arab'. Counting Yesh Atid as 'opp' instead gives the usual 61-59 split; the 'net' total is the same either way.",
)

# Dissolution (the law dissolving the outgoing Knesset, or the date it was dissolved by failure to form a government
# / pass a budget), recorded so a consumer can cut the record to the campaign proper. Polls before it are kept.
DISSOLVED = {"2013-01": "2012-10-15", "2015-03": "2014-12-08", "2019-04": "2018-12-26", "2019-09": "2019-05-30",
             "2020-03": "2019-12-12", "2021-03": "2020-12-23", "2022-11": "2022-06-30"}
PREVIOUS = {"2013-01": "2009-02-10", "2015-03": "2013-01-22", "2019-04": "2015-03-17", "2019-09": "2019-04-09",
            "2020-03": "2019-09-17", "2021-03": "2020-03-02", "2022-11": "2021-03-23"}

# Ids for parties that are not final lists: {id: (name, bloc, into, note)}.
OTHER = {
 "2013-01": {
  "likud_likud": ("Likud (before the merger with Yisrael Beiteinu, 25 Oct 2012)", "net", "likud", None),
  "likud_yb": ("Yisrael Beiteinu (before the merger with Likud, 25 Oct 2012)", "net", "likud", None),
  "jh_jh": ("The Jewish Home (before the joint list with the National Union)", "net", "jh", None),
  "jh_nu": ("National Union (before the joint list with the Jewish Home)", "net", "jh", "Its Otzma LeYisrael faction left on 12 Oct 2012."),
 },
 "2015-03": {
  "zu_labor": ("Labor (before the Zionist Union, 10 Dec 2014)", "opp", "zu", None),
  "zu_hatnuah": ("Hatnuah (before the Zionist Union, 10 Dec 2014)", "opp", "zu", None),
  "jl_hadash": ("Hadash (before the Joint List, Jan 2015)", "arab", "jl", None),
  "jl_raamtaal": ("Ra'am–Ta'al (before the Joint List, Jan 2015)", "arab", "jl", None),
  "jl_balad": ("Balad (before the Joint List, Jan 2015)", "arab", "jl", None),
  "yachad_yachad": ("Yachad (Eli Yishai, before Otzma Yehudit joined, 29 Jan 2015)", "net", "yachad", None),
  "yachad_otzma": ("Otzma Yehudit (before it joined Yachad, 29 Jan 2015)", "net", "yachad", None),
 },
 "2019-04": {
  "bw_ya": ("Yesh Atid (before Blue and White, 21 Feb 2019)", "opp", "bw", None),
  "bw_hosen": ("Israel Resilience (Gantz; with Telem from 19 Jan 2019; before Blue and White)", "opp", "bw", None),
  "zu": ("Zionist Union (Labor and Hatnuah, until the split of 1 Jan 2019)", "opp", None, "Labor ran alone; Hatnuah withdrew in Feb 2019."),
  "hatnuah": ("Hatnuah (withdrew 20 Feb 2019)", "opp", None, None),
  "jl": ("Joint List (until the 2019 split; without Ta'al where Ta'al has its own column)", "arab", None, "Split into Hadash–Ta'al and Ra'am–Balad."),
  "ht_taal": ("Ta'al (alone, Jan–Feb 2019, before joining Hadash)", "arab", "ht", None),
  "urwp_jh": ("The Jewish Home (before the Union of Right-Wing Parties, 20 Feb 2019)", "net", "urwp", "Includes Bennett and Shaked until they left to found New Right on 29 Dec 2018."),
 },
 "2019-09": {
  "zehut": ("Zehut (withdrew 29 Aug 2019)", "net", None, None),
  "likud_likud": ("Likud (before Kulanu merged into it, May 2019)", "net", "likud", None),
  "likud_kulanu": ("Kulanu (before it merged into Likud, May 2019)", "net", "likud", None),
  "yamina_urwp": ("Union of Right-Wing Parties (before Yamina, 29 Jul 2019)", "net", "yamina", None),
  "yamina_nr": ("New Right (before Yamina, 29 Jul 2019)", "net", "yamina", None),
  "du_meretz": ("Meretz (before the Democratic Union, 25 Jul 2019)", "opp", "du", None),
  "du_idp": ("Israel Democratic Party (Barak; before the Democratic Union)", "opp", "du", None),
  "lg_labor": ("Labor (before Labor–Gesher, 18 Jul 2019)", "opp", "lg", None),
  "lg_gesher": ("Gesher (before Labor–Gesher, 18 Jul 2019)", "opp", "lg", None),
  "jl_ht": ("Hadash–Ta'al (before the Joint List re-formed, 27 Jul 2019)", "arab", "jl", None),
  "jl_rb": ("Ra'am–Balad (before the Joint List re-formed, 27 Jul 2019)", "arab", "jl", None),
 },
 "2020-03": {
  "yamina_nr": ("New Right (before Yamina re-formed, Jan 2020)", "net", "yamina", None),
  "yamina_nu": ("National Union–Tkuma (before Yamina re-formed, Jan 2020)", "net", "yamina", None),
  "yamina_jh": ("The Jewish Home (before Yamina re-formed, Jan 2020)", "net", "yamina", None),
  "yamina_jhnu": ("Jewish Home–National Union (the URWP remainder, before Yamina re-formed)", "net", "yamina", None),
  "lgm_lg": ("Labor–Gesher (before Labor–Gesher–Meretz, 13 Jan 2020)", "opp", "lgm", None),
  "du": ("Democratic Union (Meretz, Israel Democratic Party, Green Movement)", "opp", None, "Meretz joined Labor–Gesher–Meretz; Stav Shaffir's Green Movement left."),
  "green": ("Green Movement (Stav Shaffir; withdrew)", "opp", None, None),
 },
 "2021-03": {
  "bw2020": ("Blue and White (Gantz–Lapid alliance, before the split of 29 Mar 2020)", "opp", None, "Split into Blue and White and Yesh Atid–Telem."),
  "jl4": ("Joint List with Ra'am (before Ra'am left, 28 Jan 2021)", "arab", None, "Split into the Joint List and Ra'am."),
  "jl_hb": ("Joint List without Ta'al and Ra'am (Hadash and Balad), late Jan 2021", "arab", "jl", None),
  "jl_taal": ("Ta'al (polled alone, late Jan 2021)", "arab", "jl", None),
  "yamina2020": ("Yamina with National Union–Tkuma (before Smotrich left, Jan 2021)", "net", None, "Bennett's Yamina ran 'mid'; Smotrich's party ran in Religious Zionism."),
  "rz_rz": ("Religious Zionist Party alone (before Otzma Yehudit and Noam joined, 3 Feb 2021)", "net", "rz", None),
  "rz_otzma": ("Otzma Yehudit (before joining Religious Zionism, 3 Feb 2021)", "net", "rz", None),
  "yamina_jh": ("The Jewish Home (joined Yamina's slate, Feb 2021)", "net", "yamina", None),
  "likud_gesher": ("Gesher (Orly Levy; joined Likud's slate, Feb 2021)", "opp", "likud", None),
  "telem": ("Telem (Ya'alon; withdrew)", "opp", None, None),
  "israelis": ("The Israelis (Huldai; withdrew)", "opp", None, None),
  "tnufa": ("Tnufa (Shelah; withdrew)", "opp", None, None),
  "derekheretz": ("Derekh Eretz (Hendel and Hauser)", "mid", None, "Joined New Hope's slate."),
 },
 "2022-11": {
  "yamina": ("Yamina (Bennett, until July 2022)", "mid", None, "Bennett retired; Shaked's remnant became Zionist Spirit, then joined the Jewish Home."),
  "zs": ("Yamina under Shaked / Zionist Spirit (Jul–Sep 2022)", "mid", None, "Shaked then ran on the Jewish Home's list."),
  "jl": ("Joint List (Hadash, Ta'al and Balad, before Balad left, 15 Sep 2022)", "arab", None, "Split into Hadash–Ta'al and Balad."),
  "nu_bw": ("Blue and White (before National Unity, 10 Jul 2022)", "opp", "nu", None),
  "nu_nh": ("New Hope (before National Unity, 10 Jul 2022)", "opp", "nu", None),
  "rz_rz": ("Religious Zionist Party (column as Wikipedia labels it, before the Otzma Yehudit joint list of 26 Aug 2022)", "net", "rz", None),
  "rz_otzma": ("Otzma Yehudit (polled alone, Aug 2022)", "net", "rz", None),
 },
}

# Polling tables read, by index among the page's tables (0 = first `{|` table): (index, label columns, column map).
# A column map entry is a list id, an id from OTHER, a J(...) joint run (combined cell), or None (skip).
N = None
TABLES = {
 "2013-01": [(0, 1, ["kadima", "likud_likud", "likud_yb", "labor", "shas", "utj", "jh_nu", "jh_jh", "raam", "hadash", "balad", "meretz", "ya", "otzma", "amshalem", "hatnuah"])],
 "2015-03": [(0, 1, ["likud", "yb", "ya", "zu_labor", "zu_hatnuah", "jh", "shas", "utj", "meretz", "jl_hadash", "jl_raamtaal", "jl_balad", "yachad_otzma", "yachad_yachad", "kulanu"])],
 "2019-04": [
  (0, 1, ["likud", "labor", "bw", "kulanu", "raambalad", "shas", "utj", "urwp", "yb", "meretz", "ht", "nr", "gesher", "zehut", N, N]),
  (1, 1, ["likud", "labor", "jl", "bw_ya", "kulanu", "shas", "utj", "hatnuah", "urwp_jh", "yb", "meretz", "nr", "ht_taal", "gesher", "zehut", "bw_hosen", N, N]),
  (2, 1, ["likud", "labor", "jl", "bw_ya", "kulanu", "shas", "utj", "hatnuah", "urwp_jh", "yb", "meretz", "nr", "gesher", "bw_hosen", N, N]),
  (3, 1, ["likud", "zu", "jl", "bw_ya", "kulanu", "shas", "utj", "urwp_jh", "yb", "meretz", "nr", "gesher", "bw_hosen", N, N]),
  (5, 1, ["likud", "zu", "jl", "bw_ya", "kulanu", "urwp_jh", "shas", "utj", "yb", "meretz", "gesher", N, N]),
 ],
 "2019-09": [
  (0, 2, ["likud", "bw", "jl", "shas", "utj", "yamina", "lg", "yb", "du", "zehut", "otzma", N]),
  (1, 2, ["likud", "bw", "jl", "shas", "utj", "lg", "yb", "yamina_urwp", "du", "yamina_nr", "zehut", N]),
  (2, 2, ["likud", "bw", "jl", "shas", "utj", "lg", "yb", "yamina_urwp", "du_meretz", "yamina_nr", "zehut", "du_idp", N]),
  (3, 2, ["likud", "bw", "jl", "shas", "utj", "lg_labor", "yb", "yamina_urwp", "du_meretz", "yamina_nr", "zehut", "lg_gesher", "du_idp", N]),
  (4, 2, ["likud", "bw", "shas", "utj", "lg_labor", "jl_ht", "yb", "yamina_urwp", "du_meretz", "jl_rb", "yamina_nr", "zehut", "lg_gesher", N]),
  (5, 2, ["likud_likud", "bw", "shas", "utj", "lg_labor", "jl_ht", "yb", "yamina_urwp", "likud_kulanu", "du_meretz", "jl_rb", "yamina_nr", "zehut", "lg_gesher", N]),
 ],
 "2020-03": [
  (0, 2, ["bw", "likud", "jl", "lgm", "shas", "yb", "utj", "yamina", "otzma", N]),
  (1, 2, ["bw", "likud", "jl", "lgm", "shas", "yb", "utj", "yamina_nr", "yamina_nu", J(("yamina_jh", "otzma")), "green", N]),
  (2, 2, ["bw", "likud", "jl", "shas", "yb", "utj", "lgm_lg", "du", "yamina_nr", "yamina_nu", "yamina_jh", "otzma", "green", N]),
  (3, 2, ["bw", "likud", "jl", "shas", "yb", "utj", "lgm_lg", "du", "yamina_jhnu", "yamina_nr", "otzma", N]),
  (4, 2, ["bw", "likud", "jl", "shas", "yb", "utj", "yamina", "lgm_lg", "du", "otzma", N]),
 ],
 "2021-03": [
  (0, 2, ["likud", "ya", "bw", "jl", "shas", "utj", "yb", "meretz", "raam", "yamina", "nh", "labor", "rz", "nep"]),
  (1, 2, ["likud", "ya", "bw", "jl_hb", "jl_taal", "raam", "shas", "utj", "yb", "meretz", "yamina", "labor", "nh", "rz_rz", "rz_otzma", "yamina_jh", "israelis", "nep"]),
  (2, 2, ["likud", "ya", "jl4", "bw", "shas", "utj", "yb", "yamina", "meretz", "labor", "telem", "nh", "rz_rz", "yamina_jh", "likud_gesher", "rz_otzma", "israelis", "tnufa", "nep"]),
  (3, 2, ["likud", "ya", "jl4", "bw", "shas", "utj", "yb", "yamina2020", "nh", "meretz", "labor", "yamina_jh", "likud_gesher", "rz_otzma", "israelis", "tnufa", "nep"]),
  (4, 2, ["likud", "ya", "jl4", "bw", "shas", "utj", "yb", "yamina2020", "nh", "meretz", "labor", "yamina_jh", "likud_gesher", "rz_otzma"]),
  (5, 2, ["likud", "ya", "jl4", "bw", "shas", "utj", "yb", "yamina2020", "meretz", "labor", "derekheretz", "yamina_jh", "likud_gesher", "rz_otzma", N]),
  (6, 2, ["likud", "ya", "bw", "jl4", "shas", "utj", "yb", "yamina2020", "labor", "meretz", "derekheretz", "likud_gesher", "rz_otzma"]),
  (7, 2, ["likud", "bw2020", "jl4", "shas", "utj", J(("labor", "meretz")), "likud_gesher", "yb", "yamina2020", "rz_otzma", N]),
 ],
 "2022-11": [
  (0, 2, ["likud", "ya", "nu", "shas", "jh", "labor", "utj", "yb", "rz", "ht", "meretz", "raam", "balad", N, N, N]),
  (1, 2, ["likud", "ya", "nu", "shas", "jh", "labor", "utj", "yb", "rz", "jl", "meretz", "raam", N, N, N]),
  (2, 2, ["likud", "ya", "nu", "shas", "zs", "labor", "utj", "yb", "rz", "jl", "meretz", "raam", N, N, N]),
  (3, 2, ["likud", "ya", "nu", "shas", "zs", "labor", "utj", "yb", "rz_rz", "rz_otzma", "jl", "meretz", "raam", N, N, N]),
  (4, 2, ["likud", "ya", "nu", "shas", "zs", "labor", "utj", "yb", "rz_rz", "jl", "meretz", "raam", N, N, N]),
  (5, 2, ["likud", "ya", "shas", "nu_bw", "yamina", "labor", "utj", "yb", "rz_rz", "jl", "nu_nh", "meretz", "raam", N, N]),
 ],
}

# Names. `pollster` is the outlet, `firm` the polling company, as in data/<key>.json. build-data.py's ALIASES are
# applied first and unchanged; POLLSTER_NORM then merges further spelling variants of one outlet only (an outlet
# co-publishing with another keeps its own label, e.g. "103fm/Maariv", "Maariv & The Jerusalem Post"). FIRM_NORM
# merges spelling variants of one firm; firm lineages (Teleseker -> TNS -> Kantar; Midgam's panels) are NOT merged.
POLLSTER_NORM = {"Channel1": "Channel 1", "Channel 2 News": "Channel 2", "Channel2": "Channel 2", "MAKO": "Mako",
                 "JPost": "Jerusalem Post", "The Jerusalem Post": "Jerusalem Post", "Yediot": "Yedioth Ahronoth",
                 "Yediot Aharonot": "Yedioth Ahronoth", "Yedioth Ahronot": "Yedioth Ahronoth", "Walla! News": "Walla",
                 "Walla News": "Walla", "Walla Poll": "Walla", "Galay Israel Radio": "Galei Israel", "Galay Israel": "Galei Israel",
                 "Kol Brama": "Kol Bramah Radio", "Knesset": "Knesset Channel", "Israel Beitenu": "Yisrael Beiteinu (party)",
                 "Labor": "Labor (party)", "Mako & Channel2": "Mako & Channel 2", "Arutz 7": "Arutz Sheva",
                 "The Times of Israel": "Times of Israel",
                 "Radio 103FM & Maariv": "Maariv",  # as build-data.py's "103fm & Maariv" (same Maagar Mochot series)
                 # 2015's Maariv–Jerusalem Post co-publication, printed three ways
                 "Jerusalem Post and Maariv": "Maariv-Jerusalem Post", "Maariv Panels": "Maariv-Jerusalem Post"}
FIRM_NORM = {"Maagar Mohot": "Maagar Mochot", "Ma'agar Mochot": "Maagar Mochot", "Maagar": "Maagar Mochot", "KANTAR": "Kantar",
             "Dialogue": "Dialog", "Direct polls": "Direct Polls", "Panels": "Panels Politics", "Panel Politics": "Panels Politics",
             "PanelPolitics": "Panels Politics", "Panel Polls": "Panels Politics", "Smith poll": "Smith", "Smith Poll": "Smith",
             "Rafi Smith": "Smith", "Smith Research": "Smith", "GeoCartography": "Geocartography", "Geocartographia": "Geocartography",
             "Tns-Teleseker": "TNS-Teleseker", "Panel HaMidgam Project": "Panel Project HaMidgam", "Midgam Panel + Statnet": "Panel Project HaMidgam/Statnet",
             "Meno Geva": "Midgam", "Machon Sarid": "Sarid", "The New Wave": "New Wave", "Midgam & iPanel": "Midgam/iPanel",
             "Panel Project HaMidgam & Statnet": "Panel Project HaMidgam/Statnet", "Midgam/Statnet": "Panel Project HaMidgam/Statnet",
             "Old Dialog": "Dialog"}
FIRMS = {"Dialog", "Dialogue", "Old Dialog", "Dahaf", "Smith", "Rafi Smith", "Smith Research", "Smith poll", "Smith Poll", "Maagar",
         "Maagar Mochot", "Maagar Mohot", "Ma'agar Mochot", "Teleseker", "TNS", "TNS-Teleseker", "Tns-Teleseker", "Kantar", "KANTAR",
         "Panels", "Panels Politics", "Panel Politics", "PanelPolitics", "Panel Polls", "New Wave", "The New Wave", "Geocartography",
         "GeoCartography", "Geocartographia", "Midgam", "iPanel", "Statnet", "Panel HaMidgam Project", "Panel Project HaMidgam",
         "Midgam Panel + Statnet", "Sarid", "Machon Sarid", "Meno Geva", "TRI", "Miskar", "Direct Polls", "Direct polls",
         "Shvakim Panorama", "Number 10 Strategies", "202 Strategies", "Camil Fuchs"}
# Labels the rules below get wrong, by raw label text: (firm, outlet).
LABEL_FIX = {"NRG/Makor Rishon Maagar Mochot": ("Maagar Mochot", "NRG"), "Knesset/Panel Polls": ("Panels Politics", "Knesset Channel"),
             "Jerusalem Post/Maariv Panels": ("Panels Politics", "Maariv-Jerusalem Post"),
             "Jerusalem Post and Maariv/Panels": ("Panels Politics", "Maariv-Jerusalem Post"),
             "Midgam/iPanel": ("Midgam/iPanel", "Channel 2")}  # 2 Dec 2016: no outlet printed; the cited article is a Channel 2 poll

def is_firm(x): return x.strip() in FIRMS

def norm_firm(firm):
    if not firm: return None
    firm = FIRM_NORM.get(firm.strip(), firm)
    parts = [FIRM_NORM.get(x.strip(), x.strip()) for x in re.split(r'/|,| \+ ', firm) if x.strip()]
    parts = [x for x in dict.fromkeys(parts) if is_firm(x) or x in FIRM_NORM.values()]
    return '/'.join(parts) or None

def label_one(lt, key):
    """A one-column label -> (firm, outlet). 2013 prints Outlet/Firm; 2015 and April 2019 mostly Firm/Outlet, sometimes
    the reverse. build-data.py's split_label is kept for the outlet (so the 28-day polls keep their pollster), the order
    is fixed when the outlet slot holds a firm, and the firm keeps only the parts that are firms."""
    lt = lt.strip()
    if lt in LABEL_FIX: return LABEL_FIX[lt]
    if key == "2013-01":
        parts = [x.strip() for x in re.split(r'/|,', lt) if x.strip()]
        firm = [x for x in parts if is_firm(x)]; outl = [x for x in parts if not is_firm(x)]
        if not outl: return '/'.join(firm), firm[0]          # a firm publishing on its own
        return ('/'.join(firm) or None), ' & '.join(outl)
    firm, pub = bd.split_label(lt, key)
    if firm and firm != pub and is_firm(pub.strip()) and not any(is_firm(x) for x in firm.split('/')):
        firm, pub = pub, firm                                # "Channel 2/Dahaf": outlet first
    if firm == pub and not is_firm(pub): firm = None         # an outlet alone ("Channel 10")
    return firm, pub.strip()

def tables_of(wiki):
    """Top-level `{| ... |}` tables, in page order (nested tables stay inside their parent)."""
    lines = bd.clean(wiki).split('\n'); out, i = [], 0
    while i < len(lines):
        if lines[i].startswith('{|'):
            j, depth = i + 1, 1
            while j < len(lines):
                if lines[j].startswith('{|'): depth += 1
                elif lines[j].startswith('|}'):
                    depth -= 1
                    if depth == 0: break
                j += 1
            out.append('\n'.join(lines[i:j + 1])); i = j + 1
        else: i += 1
    return out

def grid_rows(table):
    """bd.rows_of plus rowspan expansion for data rows: carried cells are marked 'carried'."""
    rows = bd.rows_of(table)
    # re-read rowspans: rows_of keeps only colspan, so parse attrs again from the raw lines
    raw = bd.clean(table).split('\n')[1:]
    spans, cur = [], None
    for ln in raw:
        s = ln.rstrip()
        if s.startswith('|}'): break
        if s.startswith('|-'):
            if cur is not None: spans.append(cur)
            cur = []; continue
        if cur is None: cur = []
        if s.startswith('!') or s.startswith('|'):
            body = s[1:].replace('!!', '||') if s.startswith('!') else s[1:]
            for c in bd.split_top(body, '||'):
                a, _ = bd.attr_split(c)
                m = re.search(r'rowspan\s*=\s*"?(\d+)', a)
                cur.append(int(m.group(1)) if m else 1)
    if cur is not None: spans.append(cur)
    assert len(spans) == len(rows), (len(spans), len(rows))
    pending, out = {}, []
    for r, rs in zip(rows, spans):
        cells = r['cells']
        if not cells or cells[0]['h']:
            out.append(r); continue
        new, col, k = [], 0, 0
        while k < len(cells) or col in pending:
            if col in pending:
                c, left = pending[col]
                new.append(dict(c, carried=True)); col += c['span']
                if left <= 1: del pending[col - c['span']]
                else: pending[col - c['span']] = (c, left - 1)
                continue
            c = cells[k]
            if rs[k] > 1: pending[col] = (c, rs[k] - 1)
            new.append(dict(c, carried=False)); col += c['span']; k += 1
        out.append({'attr': r['attr'], 'cells': new})
    return out

def ptext(v):
    """bd.plain plus template cleanup for label cells: {{nowrap|X}} -> X; {{refn..}}, {{efn..}}, {{dead url..}} dropped."""
    t = v
    for _ in range(3):
        t = re.sub(r'\{\{\s*(?:refn|efn|dead url|cn|citation needed|sfn)[^{}]*\}\}', '', t, flags=re.I)
        t = re.sub(r'\{\{\s*(?:nowrap|small)\s*\|([^{}]*)\}\}', r'\1', t, flags=re.I)
    return bd.plain(t)

def value(v):
    t = bd.plain(v)
    m = re.fullmatch(r"\s*(\d+\.5)\s*", t)
    if m: return ('seats', float(m.group(1)), None)
    return bd.value(v)

def resolve(ids, into):
    """Column ids under one cell -> ('list', id) | ('combined', [ids])."""
    flat = []
    for i in ids:
        flat.extend(i if isinstance(i, tuple) else (i,))
    uniq = list(dict.fromkeys(flat))
    if len(uniq) == 1 and not isinstance(ids[0], tuple): return ('list', uniq[0])
    finals = {into.get(i) or i for i in uniq}
    if len(finals) == 1 and not any(isinstance(i, tuple) for i in ids): return ('list', finals.pop())
    return ('combined', uniq)

def build(key, d, log):
    if key == "2013-01":
        cfg = E2013
    else:
        cfg = dict(bd.ELECTIONS[key], threshold=0.0325)
    ed = datetime.date.fromisoformat(cfg['date']); prev = datetime.date.fromisoformat(PREVIOUS[key])
    other = OTHER.get(key, {})
    into = {k: v[2] for k, v in other.items()}
    known = set(cfg['lists']) | set(other)
    wiki = open(os.path.join(d, f"p{key}.wiki")).read()
    tabs = tables_of(wiki)
    polls, last = [], ed + datetime.timedelta(days=14)  # results rows dated after the vote must not set the year back
    variants = collections.Counter()
    stats = collections.Counter()
    for ti, labels, cols in TABLES[key]:
        for c in cols:
            for i in (c if isinstance(c, tuple) else (c,)):
                assert i is None or i in known, (key, ti, i)
        rows = grid_rows(tabs[ti])
        year = None
        for r in rows:
            cells = r['cells']
            if not cells: continue
            first = bd.plain(cells[0]['v'])
            if re.fullmatch(r"'*\d{4}'*", first.strip("'")) and (len(cells) == 1 or cells[0]['span'] > 3):
                year = int(first.strip("'")); continue
            if cells[0]['h']:
                continue
            lab = cells[1:1 + labels]
            if len(lab) < labels or any(c['span'] > 1 for c in lab) or sum(c['span'] for c in cells) < 1 + labels + 5:
                stats['event/result rows skipped'] += 1; log.append(f"{key} T{ti}: EVENT {first!r} " + ' | '.join(bd.plain(c['v'])[:25] + ('*%d' % c['span'] if c['span'] > 1 else '') for c in cells[1:4])); continue  # event / results / divider row
            if cells[0].get('carried') and all(c.get('carried') for c in lab):
                variants[id(polls[-1]) if polls else None] += 1; stats['variant rows dropped'] += 1
                if polls: polls[-1]['_variants'] = polls[-1].get('_variants', 0) + 1
                continue
            # date
            ms = list(re.finditer(r'(\d{1,2})\s+([A-Z][a-z]{2})[a-z]*\.?(?:\s+(\d{4}|\d{2})\b)?', first))
            if not ms:
                stats['undated rows skipped'] += 1; log.append(f"{key} T{ti}: no date in {first!r}"); continue
            m = ms[-1]; y = m.group(3)
            mon, day = MON[m.group(2)], int(m.group(1))
            if y:
                y = int(y) + (2000 if len(y) == 2 else 0)
            elif year:
                y = year
            else:
                y = last.year
                if datetime.date(y, mon, day) > last: y -= 1
            dt = datetime.date(y, mon, day)
            if dt > last + datetime.timedelta(days=3):
                log.append(f"{key} T{ti}: out of order {first!r} -> {dt} after {last}")
            last = min(last, dt) if dt <= ed else last
            if dt >= ed or dt <= prev:
                stats['outside the campaign'] += 1; continue
            rawrow = ' '.join(c['v'] for c in cells if not c.get('carried'))
            if re.search(r'scenario|hypothetical', rawrow, flags=re.I):
                stats['scenario rows dropped'] += 1; log.append(f"{key} T{ti}: SCENARIO {first!r} " + re.sub(r'\s+', ' ', rawrow)[:160]); continue
            # labels
            if labels == 1:
                lt = ptext(lab[0]['v'])
                firm, pub = label_one(lt, key)
            else:
                firm, pub = ptext(lab[0]['v']), ptext(lab[1]['v'])
                if pub in ('–', '-', ''): pub = firm
            raw_pub, raw_firm = pub or '', firm
            pollster = bd.ALIASES.get(pub, pub)
            pollster = POLLSTER_NORM.get(pollster, pollster)
            if is_firm(pollster): pollster = FIRM_NORM.get(pollster, pollster)   # a firm publishing on its own
            firm = norm_firm(firm)
            if 'exit poll' in ((firm or '') + ' ' + (pollster or '')).lower():
                stats['exit polls'] += 1; continue
            results, combined, col = {}, [], 0
            for c in cells[1 + labels:]:
                ids = cols[col:col + c['span']]; col += c['span']
                ids = [i for i in ids if i is not None]
                if not ids: continue
                v = value(c['v'])
                if v is None: continue
                kind, x = resolve(ids, into)
                if kind == 'combined':
                    if v[0] == 'seats': combined.append({"parties": x, "seats": v[1]})
                    else: stats['below-threshold cells spanning several lists (no schema slot; dropped)'] += 1
                    continue
                if v[0] == 'seats':
                    results[x] = {"seats": v[1]} | ({"pct": f"{v[2]}%"} if v[2] is not None else {})
                else:
                    results[x] = {"seats": 0, "belowThreshold": True} | ({"pct": f"{v[1]}%"} if v[1] is not None else {})
            if not results and not combined:
                stats['rows with no figures skipped'] += 1; continue
            tot = sum(x['seats'] for x in results.values()) + sum(c['seats'] for c in combined)
            tot = int(tot) if float(tot).is_integer() else tot
            firmtxt = (raw_firm or '') + ' ' + raw_pub
            filber = bool(re.search(r'Direct Polls|Filber|Next Data', firmtxt, flags=re.I))
            pid = re.sub(r'[^a-z0-9]+', '-', pollster.lower()).strip('-') + '-' + dt.isoformat()
            while any(p['id'] == pid for p in polls): pid += 'b'
            polls.append({"id": pid, "pollster": pollster, "firm": firm, "fieldwork": first, "published": dt.isoformat(),
                          "via": "Wikipedia", "url": WP + cfg['poll'], "n": None, "margin": None,
                          "note": None if tot == 120 else f"Seats as printed sum to {tot}.", "filber": filber,
                          "results": results, "combined": combined, "_table": ti})
    for p in polls:
        nv = p.pop('_variants', 0)
        if nv:
            extra = f"Wikipedia prints {nv} more scenario row{'s' if nv > 1 else ''} for this poll; the first row is kept."
            p['note'] = extra if p['note'] is None else p['note'] + ' ' + extra
    # Results from the article's {{Election results}} template (as build-data.py).
    w = open(os.path.join(d, f"e{key}.wiki")).read()
    seg = w[w.find('{{Election results'):]; seg = re.sub(r'<!--.*?-->', '', seg[:seg.find('\n}}')], flags=re.S)
    P = {m.group(1): bd.plain(m.group(2)) for m in re.finditer(r'\|\s*party(\d+)\s*=\s*(.*?)(?=\|\s*(?:votes|seats|sc|color)\d+|\n\|)', seg, flags=re.S)}
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
    used = {i for p in polls for i in p['results']} | {i for p in polls for c in p['combined'] for i in c['parties']}
    unknown = used - known
    assert not unknown, (key, unknown)
    polls.sort(key=lambda p: (p['published'], p['pollster']), reverse=True)
    for p in polls: p.pop('_table')
    pc = collections.Counter(p['pollster'] for p in polls)
    about = (f"Every poll in Wikipedia's polling tables for the {cfg['date']} election, from the day after the previous election "
             f"({PREVIOUS[key]}) to the day before the vote, newest first: {len(polls)} polls by {len(pc)} pollsters "
             f"({sum(p['filber'] for p in polls)} by Shlomo Filber's firms). The outgoing Knesset was dissolved on {DISSOLVED[key]} "
             f"({sum(p['published'] >= DISSOLVED[key] for p in polls)} polls since). Same schema as the 28-day files in data/"
             + (" (2013 has no 28-day file; its lists, blocs and agreements are judgments written out in the build script)" if key == "2013-01" else f", with the same lists, blocs, agreements and result as data/{key}.json") +
             "; parties that merged, split or withdrew during the campaign have their own ids, listed in otherLists "
             "(`into` names the final list they merged into). Built by scripts/forecast/backtest/build-data-full.py; "
             "memo docs/research/polls-method/round2/D1-data-full.md.")
    return {
        "election": cfg['date'], "key": key, "knesset": 120, "threshold": cfg['threshold'],
        "about": about,
        "previousElection": PREVIOUS[key], "dissolved": DISSOLVED[key],
        "sources": {"polls": WP + cfg['poll'], "result": WP + cfg['article'] + "#Results", "agreements": WP + cfg['article'] + "#Surplus-vote_agreements"},
        "lists": lists, "blocs": blocs, "blocNote": cfg['blocNote'],
        "otherLists": {k: {"name": v[0], "bloc": v[1], "into": v[2], "note": v[3]} for k, v in other.items() if k in used},
        "result": {"validVotes": valid, "lists": result},
        "agreements": cfg['agreements'],
        "polls": polls,
    }, stats

PAGES = dict({k: (v['poll'], v['article']) for k, v in bd.ELECTIONS.items()}, **{"2013-01": (E2013['poll'], E2013['article'])})

if __name__ == '__main__':
    d = sys.argv[1]
    if '--fetch' in sys.argv:
        for key, (pt, at) in PAGES.items():
            for pre, t in (('p', pt), ('e', at)):
                req = urllib.request.Request(f"https://en.wikipedia.org/w/index.php?title={t}&action=raw", headers={"User-Agent": "israelielection-backtest/1.0"})
                open(os.path.join(d, f"{pre}{key}.wiki"), 'wb').write(urllib.request.urlopen(req).read())
    out = os.path.join(HERE, 'data-full')
    os.makedirs(out, exist_ok=True)
    log = []
    for key in ["2013-01", "2015-03", "2019-04", "2019-09", "2020-03", "2021-03", "2022-11"]:
        data, stats = build(key, d, log)
        data["retrieved"] = "2026-10-23"
        data["wikitextSha256"] = {pre: hashlib.sha256(open(os.path.join(d, f"{pre}{key}.wiki"), 'rb').read()).hexdigest()[:16] for pre in ('p', 'e')}
        json.dump(data, open(os.path.join(out, f"{key}.json"), 'w'), indent=1, ensure_ascii=False)
        print(key, len(data['polls']), 'polls;', sum(p['filber'] for p in data['polls']), 'Filber;', dict(stats))
    for l in log: print('  ', l)
