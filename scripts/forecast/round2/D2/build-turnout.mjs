/**
 * Builds scripts/forecast/round2/data/turnout.json (round 2, agent D2) from
 *   scripts/forecast/round2/data/turnout-cec.json   (sector_turnout.py: CEC per-locality results, 2013-2022)
 *   scripts/forecast/round2/data/sector-gaps.json   (gaps.mjs: final-week field vs result by sector)
 * plus the published figures and 2026 expectations written out below with their URLs.
 *
 *   node scripts/forecast/round2/D2/build-turnout.mjs
 *
 * Also prints the turnout-change vs Arab-list-poll-miss table and the "mechanical" turnout effect: the Arab lists'
 * vote share had Arab-locality turnout stayed at the previous election's level, everything else fixed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "../data");
const read = (f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf8"));
const cec = read("turnout-cec.json"), gaps = read("sector-gaps.json");
const r2 = (x) => Math.round(x * 100) / 100;

// Published Arab-sector series (Rudnitzky / Konrad Adenauer Program, Dayan Center; IDI; INSS): Arab and Druze
// localities, voters / registered, double envelopes and mixed cities excluded. 2009 is needed for 2013's change.
const LIT_ARAB = {
  "2009-02-10": { turnout: 53.4, src: "https://dayan.org/file-download/download/public/17864" },
  "2013-01-22": { turnout: 56.5, src: "https://dayan.org/file-download/download/public/15451" },
  "2015-03-17": { turnout: 63.5, registered: 747658, voters: 474844, src: "https://dayan.org/file-download/download/public/15393" },
  "2019-04-09": { turnout: 49.2, src: "https://dayan.org/file-download/download/public/16721" },
  "2019-09-17": { turnout: 59.2, src: "https://en.idi.org.il/articles/28660" },
  "2020-03-02": { turnout: 64.8, src: "https://en.idi.org.il/articles/34420" },
  "2021-03-23": { turnout: 44.6, registered: 897184, voters: 399954, src: "https://dayan.org/file-download/download/public/17378" },
  "2022-11-01": { turnout: 53.2, registered: 938401, voters: 498894, src: "https://dayan.org/file-download/download/public/17864" },
};
// Share of the Arab vote (Arab and Druze localities) won by the Arab lists, Rudnitzky, Dayan Center issue 28, Figure 3.
const LIT_ARAB_LISTS_SHARE = { "2013-01-22": 77.2, "2015-03-17": 83.2, "2019-04-09": 71.6, "2019-09-17": 81.6, "2020-03-02": 87.6, "2021-03-23": 80.1, "2022-11-01": 85.8 };
const OFFICIAL_SRC = {
  "2013-01-22": "https://en.wikipedia.org/wiki/2013_Israeli_legislative_election#Results",
  "2015-03-17": "https://en.wikipedia.org/wiki/2015_Israeli_legislative_election#Results",
  "2019-04-09": "https://en.wikipedia.org/wiki/April_2019_Israeli_legislative_election#Results",
  "2019-09-17": "https://en.wikipedia.org/wiki/September_2019_Israeli_legislative_election#Results",
  "2020-03-02": "https://en.wikipedia.org/wiki/2020_Israeli_legislative_election#Results",
  "2021-03-23": "https://en.wikipedia.org/wiki/2021_Israeli_legislative_election#Results",
  "2022-11-01": "https://en.wikipedia.org/wiki/2022_Israeli_legislative_election#Results",
};

const dates = Object.keys(cec.elections).sort();
const gapByDate = Object.fromEntries(gaps.elections.map((e) => [e.election, e]));
const elections = {};
const analysis = [];
for (const [i, d] of dates.entries()) {
  const c = cec.elections[d], g = gapByDate[d];
  const prevArab = i ? cec.elections[dates[i - 1]].arabDruzeLocalities.turnout : LIT_ARAB["2009-02-10"].turnout;
  const prevHar = i ? cec.elections[dates[i - 1]].harediCities.turnout : null;
  const prevStrong = i ? cec.elections[dates[i - 1]].shasStrongholds.turnoutMinusGeneralLocalities : null;
  // Mechanical effect: scale the Arab electorate's votes by prevTurnout/turnout.
  const a = c.arabDruzeLocalities, V = c.national.valid;
  const Lloc = (a.arabListsShareOfValid / 100) * a.valid, L = Lloc / (c.arabListVotesFromArabLocalities / 100);
  const Ea = a.valid + (L - Lloc); // Arab electorate's valid votes: Arab localities + Arab-list votes cast elsewhere
  const k = prevArab / a.turnout;
  const share = (100 * L) / V, cf = (100 * L * k) / (V - Ea * (1 - k));
  const row = {
    election: d, arabTurnout: a.turnout, arabChange: r2(a.turnout - prevArab), arabListsShare: r2(share), atPreviousTurnout: r2(cf), mechanicalEffectPts: r2(share - cf),
    arabPollMissPts: g ? g.groups.arab.pctGap : null, arabPollMissSeats: g ? g.groups.arab.seatGap : null,
    harediCitiesTurnout: c.harediCities.turnout, harediChange: prevHar == null ? null : r2(c.harediCities.turnout - prevHar), harediPollMissPts: g ? g.groups.haredi.pctGap : null,
    shasPollMissPts: g ? g.lists.shas.pctGap : null, utjPollMissPts: g ? g.lists.utj.pctGap : null,
    shasStrongholdRelTurnout: c.shasStrongholds.turnoutMinusGeneralLocalities, shasStrongholdRelChange: prevStrong == null ? null : r2(c.shasStrongholds.turnoutMinusGeneralLocalities - prevStrong),
  };
  analysis.push(row);
  elections[d] = {
    overall: { registered: c.national.registered, voters: c.national.voters, valid: c.national.valid, turnout: c.national.turnout, source: OFFICIAL_SRC[d] },
    arab: {
      turnout: a.turnout, registered: a.registered, voters: a.voters, changeFromPrevious: row.arabChange,
      arabListsShareOfArabLocalityVote: a.arabListsShareOfValid, arabListVotesCastInArabLocalities: c.arabListVotesFromArabLocalities,
      published: { turnout: LIT_ARAB[d].turnout, ...(LIT_ARAB[d].registered ? { registered: LIT_ARAB[d].registered, voters: LIT_ARAB[d].voters } : {}), arabListsShareOfArabVote: LIT_ARAB_LISTS_SHARE[d], source: LIT_ARAB[d].src },
      source: c.source,
    },
    haredi: {
      harediCitiesTurnout: c.harediCities.turnout, registered: c.harediCities.registered, voters: c.harediCities.voters, shasUtjShareOfValid: c.harediCities.shasUtjShareOfValid,
      shasUtjVotesCastInHarediCities: c.shasUtjVotesFromHarediCities, utjVotesCastInHarediCities: c.utjVotesFromHarediCities, shasVotesCastInHarediCities: c.shasVotesFromHarediCities,
      source: c.source, note: "Haredi cities only (Bnei Brak, Modi'in Illit, Beitar Illit, El'ad, Immanuel, Rechasim, Kiryat Ye'arim). Jerusalem, Beit Shemesh and other cities' Haredi neighbourhoods are not included; no published per-election Haredi-sector turnout series was found.",
    },
    shasStrongholds: { ...c.shasStrongholds, note: "11 Jewish non-Haredi localities, >=5,000 registered, Shas >=12% of valid votes in 2015: Beit She'an, Beit Shemesh, Dimona, Migdal HaEmek, Netivot, Ofakim, Or Yehuda, Kiryat Malachi, Tiberias, Yeruham, Safed. Beit Shemesh has a large Haredi population. turnoutMinusGeneralLocalities = stronghold turnout minus the general-sector locality turnout." },
    generalImplied: { turnout: c.generalImplied.turnout, registered: c.generalImplied.registered, voters: c.generalImplied.voters, note: "National minus Arab and Druze localities minus Haredi cities, with every double-envelope vote (soldiers, diplomats, prisoners, hospitals...) assigned to the general sector. Registered includes about 10% of voters living abroad, nearly all in this sector, so resident general-sector turnout is several points higher." },
    generalLocalitiesOnly: { turnout: c.generalLocalitiesOnly.turnout, note: "The same without double envelopes (locality ballot boxes only)." },
  };
}

// Least squares through the six/seven points: pollMiss = a + b * change.
function ols(xs, ys) { const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n; const b = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0); const a = my - b * mx; const r = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0)); return { a: r2(a), b: Math.round(b * 1000) / 1000, r: r2(r) }; }
const fitArab = ols(analysis.map((x) => x.arabChange), analysis.map((x) => x.arabPollMissPts));
const fitMech = ols(analysis.map((x) => x.mechanicalEffectPts), analysis.map((x) => x.arabPollMissPts));
const six = analysis.filter((x) => x.election >= "2015");
const fitArab6 = ols(six.map((x) => x.arabChange), six.map((x) => x.arabPollMissPts));
const fitShas = ols(six.map((x) => x.shasStrongholdRelChange), six.map((x) => x.shasPollMissPts));
const fitHar = ols(six.map((x) => x.harediChange), six.map((x) => x.harediPollMissPts));
// Leave-one-out prediction of the Arab miss from the turnout change (six elections under 3.25%).
const loo = six.map((x, i) => { const rest = six.filter((_, j) => j !== i); const f = ols(rest.map((y) => y.arabChange), rest.map((y) => y.arabPollMissPts)); return { election: x.election, predicted: r2(f.a + f.b * x.arabChange), actual: x.arabPollMissPts }; });
const looMAE = r2(loo.reduce((s, x) => s + Math.abs(x.predicted - x.actual), 0) / loo.length);
const zeroMAE = r2(six.reduce((s, x) => s + Math.abs(x.arabPollMissPts), 0) / six.length);
console.table(analysis);
console.log("Arab miss (pts) ~ Arab turnout change (pts), 7 elections:", fitArab, " 6 elections (2015-2022):", fitArab6);
console.log("Arab miss ~ mechanical effect:", fitMech);
console.log("Shas miss ~ change in stronghold relative turnout (6):", fitShas, " Shas+UTJ miss ~ Haredi-city turnout change (6):", fitHar);
console.table(loo); console.log("LOO MAE", looMAE, "vs predicting 0:", zeroMAE);

const doc = {
  about: "Turnout by sector, Knesset elections 2013-2022, and 2026 expectations published before 2026-10-23 that are not vote-intention polls. Turnout = voters / registered. 'arab' = Arab and Druze localities (CBS locality religion code 2 or 3), the Dayan Center / IDI definition used in the literature (recomputed here from the CEC locality files; it matches the published 2022 counts exactly and the published percentages to 0.2 points). 'haredi' = Haredi cities only. 'generalImplied' = the rest. Built by scripts/forecast/round2/D2/build-turnout.mjs from turnout-cec.json (sector_turnout.py) and sector-gaps.json (gaps.mjs). See docs/research/polls-method/round2/D2-sector-data.md.",
  sources: {
    cecLocalityResults: "https://data.gov.il/dataset/votes-knesset (Central Elections Committee final results by locality, 19th-25th Knesset)",
    cbsLocalities: "https://www.cbs.gov.il/he/publications/doclib/2019/ishuvim/bycode2022.xlsx",
    arabSeries: ["https://dayan.org/file-download/download/public/17864", "https://www.inss.org.il/wp-content/uploads/2022/11/No.-1661.pdf", "https://en.idi.org.il/articles/47297", "https://en.idi.org.il/articles/28660", "https://en.idi.org.il/articles/34420", "https://dayan.org/file-download/download/public/15393", "https://dayan.org/file-download/download/public/16721", "https://dayan.org/file-download/download/public/17378", "https://dayan.org/file-download/download/public/15451"],
    overall: "English Wikipedia election articles, {{Election results}} templates (CEC figures)",
  },
  definitions: {
    arab: "Arab and Druze localities: registered voters and voters in localities the CBS classes as non-Jewish (2) or Bedouin tribes (3). Excludes mixed cities (Haifa, Jerusalem, Lod, Ramla, Akko, Tel Aviv-Jaffa, Nof HaGalil, Ma'alot-Tarshiha), Arabs living in Jewish localities and double envelopes. Druze localities are included (they vote mostly for Zionist lists). About 83-87% of all Arab-list votes are cast in these localities.",
    haredi: "Haredi cities: Bnei Brak, Modi'in Illit, Beitar Illit, El'ad, Immanuel, Rechasim, Kiryat Ye'arim. About 3% of registered voters; 35-40% of UTJ's votes and 11-16% of Shas's are cast there.",
    general: "Everything else, double envelopes included.",
  },
  elections,
  analysis: { rows: analysis, arabMissOnTurnoutChange_7: fitArab, arabMissOnTurnoutChange_6: fitArab6, arabMissOnMechanicalEffect_7: fitMech, shasMissOnStrongholdRelTurnoutChange_6: fitShas, harediMissOnHarediCityTurnoutChange_6: fitHar, leaveOneOutArab: { rows: loo, mae: looMAE, maeOfZero: zeroMAE } },
  expectations2026: {
    note: "Published before 2026-10-23. None is an official forecast (the CEC publishes none). Items marked survey-based come from survey questions on turnout intention, not from vote-intention seat polls.",
    overall: [
      { what: "Registered voters about 7.3 million; about 810,000 live abroad", source: "https://www.ynetnews.com/article/hk5ryml3fl ; https://www.aljazeera.com/amp/news/2026/10/20/israels-elections-2026-explained-in-maps-and-charts", kind: "official count via press" },
      { what: "Diplomatic-mission voting 86.7% (4,218 voters), up 17.1 points from 2022", source: "https://www.timesofisrael.com/israeli-emissaries-abroad-end-voting-with-turnout-17-percentage-points-higher-than-2022/", kind: "official, tiny n" },
      { what: "Polymarket turnout market: 74%+ at 37%, 72-74% at 25% (thin market)", source: "https://polymarket.com/politics/israel-election", kind: "prediction market (via round1/E-context.md)" },
      { what: "Next Data's CEC filings project 67.8% turnout by scaling 2022's 69.6%", source: "https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election126/he/Surveyl_4236-4233.pdf", kind: "pollster assumption (round1/D-pollsters.md)" },
    ],
    arab: [
      { what: "Stat-Net projects Arab turnout of 63% (vs 56% in 2022 on its own measure; 53.2% on the definition used here)", source: "https://www.timesofisrael.com/turnout-among-israels-arab-voters-could-make-or-break-hopes-to-unseat-netanyahu/", date: "2026-10-21", kind: "survey-based projection" },
      { what: "Konrad Adenauer Program (Dayan Center), May 2026: 53% expected as things stood, 67% if the Joint List reunited (Hadash-Ta'al-Balad did reunite in August; Ra'am runs separately)", source: "https://www.acitaskforce.org/resource/arab-society-and-israels-2026-elections-between-electoral-power-and-political-influence/", kind: "survey-based projection" },
      { what: "Konrad Adenauer Program, Nov 2025: 52.4%, or 61.8% with a reunified list", source: "https://dayan.org/content/integration-and-influence-survey-arab-citizens-israel", kind: "survey-based projection" },
      { what: "Pre-election projections in 2022 were 40.5% (Makan), 49% (Konrad Adenauer Program) and below 40% (Al-Monitor); the result was 53.2%. Projections have missed by 4-13 points.", source: "https://www.al-monitor.com/originals/2022/09/polls-predict-new-lows-arab-israeli-voter-turnout ; https://www.inss.org.il/wp-content/uploads/2022/11/No.-1661.pdf", kind: "track record" },
    ],
    haredi: [
      { what: "Gerrer Rebbe's directive to vote UTJ is a bare request, no mobilisation; UTJ officials fear Ger abstention (Ger is a large Hasidic court)", source: "https://www.israelnationalnews.com/news/434775", date: "2026-10-18", kind: "qualitative" },
      { what: "Shas rabbis campaign against defections to Likud and Otzma; UTJ builds a workaround for the ban on turnout data (booths, Agudah tents)", source: "https://www.ynetnews.com/article/sk400k2v2ml", date: "2026-10-22", kind: "qualitative" },
      { what: "No numeric Haredi turnout projection was found. Haredi-city turnout has been 76-83% in every election since 2013 (this file).", source: null, kind: "absence" },
    ],
  },
};
fs.writeFileSync(path.join(dataDir, "turnout.json"), JSON.stringify(doc, null, 1) + "\n");
console.log("wrote scripts/forecast/round2/data/turnout.json");
