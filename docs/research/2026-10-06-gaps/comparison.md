# Comparison questions: evidence gaps (Oct 6, 2026)

Files: `data/comparison-questions.json`, `data/gaza-security-evidence.json`. Ruling: Daniel, Oct 6, 2026 (include clear positions a party will not say out loud, and mark them).

## Rule used
- **Stated** (`answers`): the party or its leader said it in their own words, at any date (the date is shown). New stated answers whose wording is not in the base `data/positions/*.json` row carry a citation in a new optional per-question map `answerSources: { partyId: { text, source, url, date } }`.
- **Not said publicly** (`unstated: { partyId: { stance, text, source, url, date } }`): the position rests on votes, signed coalition agreements, ministers' actions, an earlier joint-list platform, or a leader's statement on a nearby point.
- Blank: genuinely unclear. Reason given below.
- Confidence: **clear** = direct record; **likely** = inference or old evidence that Daniel should check.

## Gates logged
- GATE: added stances (user-visible wording). Proceeded because without them the coalition parties' real positions had no slot. `draft-exemptions` + "Exempt full-time yeshiva students" (`learners`); `courts-reasonableness` + "Abolish it for cabinet and ministers' decisions" (`abolish`); `relig-shabbat` + "Keep the current Shabbat rules" (`keep`); Gaza + "Israeli control, with military government or settlement" (`control`).
- GATE: relabelled `courts-override` `supermajority` from "Override with more than 72 MKs" to "Override only with a special majority (70 MKs or more)". Proceeded so Yisrael Beytenu's 70-MK proposal fits; the note keeps the 72 vs 70 difference. Reservists' answer is unchanged.
- GATE: rewrote `method` and the Gaza `note`.

## Entries

### draft-left-yeshiva (require / oppose)
| Party | Stance | Basis | Source | Conf. |
|---|---|---|---|---|
| rz | require | stated | Arutz Sheva, May 18, 2026, https://www.israelnationalnews.com/news/427254 : Smotrich, "Whoever is not studying Torah must enlist." | clear |
| yashar | require | stated | Ynet, Sep 16, 2026, https://www.ynetnews.com/article/sjph72wyzx : national service for all, only deferral is 3% for outstanding individuals | clear |
| bw | require | stated | Ynet Hebrew, Sep 16, 2026, https://www.ynet.co.il/news/elections2026/article/yokra14898966 : service framework for all, Haredim included | clear |
| res | require | stated | Ynet, Sep 16, 2026 (same): "Every citizen will report to the induction center." | clear |
| poi | require | stated | JPost, Sep 2, 2026, https://www.jpost.com/israel-election-2026/article-907373 : "Every young person of service age will report to the state. No sector is above the law." | clear |
| likud | require | unstated | ToI, Nov 15, 2025, https://www.timesofisrael.com/likud-mk-says-idf-conscription-bill-aims-to-draft-half-of-haredim-not-in-yeshiva/ : Bismuth's bill aims to enlist 50% of those not in yeshiva within five years | clear |

Blank: otzma (Ben Gvir: "I don't think coercion will help"; Son Har-Melech opposes "a method that creates antagonism"; nothing on leavers), noam (Maoz backs only a noncoercive bill with rabbinic approval), raam (declined).

### draft-exemptions (none / outstanding / learners)
| Party | Stance | Basis | Source | Conf. |
|---|---|---|---|---|
| shas, utj | learners | stated (secondary) | JPost, Sep 10, 2026, https://www.jpost.com/israel-election-2026/article-907982 : "full-time Torah study is a central religious value that should receive legal protection" | clear |
| rz | learners | stated | ToI, Jun 21, 2026, https://www.timesofisrael.com/liveblog_entry/smotrich-says-hes-open-to-compromises-with-haredim-over-enlistment-to-army/ : accepts exemptions for full-time yeshiva students if those not studying enlist | clear |
| likud | learners | unstated | ToI, Nov 15, 2025 (Bismuth, above): full-time students can keep deferring, exemption age 26 | clear |
| noam | learners | unstated | ToI, Dec 2, 2025, https://www.timesofisrael.com/liveblog_entry/likud-mk-bullish-on-haredi-conscription-bills-chances-two-far-right-mks-noncommital/ : Maoz backs only a noncoercive bill with Haredi rabbinic approval | likely |

Blank: otzma (no statement on exemptions), dem ("national and equal framework" does not set a mechanism), res and poi ("everyone reports" does not settle exemptions), jl, raam.

### courts-appointments (repeal / enacted)
| Party | Stance | Basis | Source | Conf. |
|---|---|---|---|---|
| dem, yb, bw | repeal | stated | Srugim, Mar 27, 2025 (joint statement by Lapid, Gantz, Liberman, Golan: "in the next government we will ensure the law ... is repealed"); also ToI liveblog https://www.timesofisrael.com/liveblog_entry/leaders-of-opposition-vow-to-repeal-new-judicial-selection-law-in-next-government/ | dem, yb clear; **bw likely** |
| shas, utj, rz | enacted | unstated | ToI, Mar 27, 2025, https://www.timesofisrael.com/knesset-passes-law-greatly-boosting-political-control-over-judicial-appointments/ : passed 67 to 1, opposition boycott. Ynet Sep 22, 2026 also says UTJ "supported legislation during previous term" | clear |
| otzma | enacted | unstated | Same ToI: Ben Gvir welcomed it and wants the rest of the overhaul | clear |
| res | repeal | unstated | Ynet, Sep 22, 2026, https://www.ynetnews.com/article/hkcjtk1cme : "new balanced composition" for the committee | likely |
| jl | repeal | unstated | Same Ynet: mechanism "that preserves judicial independence" | likely |

Blank: noam (Maoz had left the government in early 2025; I could not confirm his vote), poi (wants the Bar Association off the committee, which is the 2025 law's core change, but did not exist then; leaning keep, not "enacted"), raam (no current position).
Note for Daniel: Gantz's 2026 Ynet answer says the judiciary "holds too much power". His 2025 repeal pledge may not hold now.

### courts-override (oppose / special majority / 61)
| Party | Stance | Basis | Source | Conf. |
|---|---|---|---|---|
| yb | supermajority | stated | Arutz Sheva, Feb 15, 2023, https://www.inn.co.il/news/592411 : Liberman, "an override clause with a majority of 70 MKs" | likely (2023) |
| utj | 61 | unstated | ToI, Mar 31, 2023, https://www.timesofisrael.com/haredi-parties-were-at-forefront-of-overhaul-push-then-they-werent-what-changed/ (Haredi parties chief backers of a simple-majority override, then went silent); ToI Nov 8, 2022, https://www.timesofisrael.com/utj-insisting-no-government-without-high-court-override-commitment-first-reports/ (UTJ precondition) | likely |
| shas | 61 | unstated | Same ToI Mar 31, 2023; Ynet Oct 30, 2022, https://www.ynet.co.il/judaism/article/bysw00aons : Shas "will promote an override clause" to reenact the Tal law | likely |

Blank: likud (Netanyahu told the WSJ in June 2023 he had "thrown out" the override, then reportedly reassured ministers; https://www.timesofisrael.com/in-u-turn-netanyahu-said-to-reassure-ministers-override-clause-has-not-been-shelved/ not fetched; genuinely unclear), otzma ("still preparing" its platform), noam, byachad (Lapid opposed it in 2022, but Bennett sponsored an override bill in 2020), dem (no clean source found; one 2023 Golan speech page may mislabel the bill), bw (Gantz in Nov 2022 attacked a 61-MK override, JNS https://www.jns.org/column/ruthie-blum/no-the-override-clause-wont-crush-israeli-democracy ; his 2026 answer wants to limit the court; threshold unknown), poi, jl, raam.

### courts-reasonableness (narrow / abolish)
| Party | Stance | Basis | Source | Conf. |
|---|---|---|---|---|
| likud, shas, utj, rz, otzma, noam | abolish | unstated | ToI, Jul 24, 2023, https://www.timesofisrael.com/liveblog_entry/after-massive-opposition-and-failed-compromise-talks-knesset-okays-reasonableness-law/ : passed 64 to 0, all coalition MKs, opposition boycott | likely (2023 vote, not restated) |

Blank: all opposition lists except poi and res (none addressed narrowing; their 2023 votes against abolition do not answer narrowing).

### relig-marriage (allow / oppose)
| Party | Stance | Basis | Source | Conf. |
|---|---|---|---|---|
| noam | oppose | unstated | israel2026.co.il/en/parties.html (aggregator, 2026): "stronger Chief Rabbinate" | likely |
| bw | allow | unstated | ToI, Feb 15, 2021, https://www.timesofisrael.com/gantz-launches-civil-marriage-bid-as-poll-shows-him-failing-to-enter-knesset/ ; Ynet Oct 30, 2022 (National Unity pledged a civil marriage track for every couple) | likely |
| res | allow | unstated | Arutz Sheva, Sep 12, 2021, https://www.inn.co.il/news/504642 : Hendel, "We must provide an alternative for those unable to marry" | likely (narrower than an option for everyone) |
| jl | allow | unstated | israel2026.co.il (aggregator): "separation of religion and state" | likely |

Blank: **likud** (not clear. Its UTJ deal keeps the status quo, but Speaker Amir Ohana voted for a civil marriage bill on Dec 24, 2025 and MK Dan Illouz defended him: https://www.timesofisrael.com/liveblog_entry/knesset-speaker-ohana-votes-for-civil-marriage-bill-enraging-ultra-orthodox-parties/), rz and otzma (no source found that addresses marriage; almost certainly oppose, Daniel may want to fill), poi, raam.

### relig-shabbat (local / keep)
| Party | Stance | Basis | Source | Conf. |
|---|---|---|---|---|
| likud | keep | stated | Ynet Hebrew, Aug 31, 2026, https://www.ynet.co.il/news/elections2026/article/yokra14883243 : "connect Israel on the six working days, while keeping Shabbat" | clear |
| rz | keep | stated (Ynet's characterization) | Same Ynet: aligned with the 83% of its voters opposing change | clear |
| bw | local | stated | Same Ynet: transport on Shabbat via devolution to local authorities | clear |
| jl | local | stated | Same Ynet: city and intercity transport on Shabbat | clear (wants more than local) |
| shas, utj | keep | stated (secondary) | JPost Sep 10, 2026 (above) | clear |
| noam | keep | stated (aggregator) | israel2026.co.il: "A public Shabbat" | likely |
| otzma | keep | unstated | Ynet Oct 30, 2022 (above): RZ and Otzma "oppose public transport on Shabbat"; no response in 2026 | likely |

Blank: res, poi ("platform soon"), raam (no response).
Note for Daniel: Ynet Aug 31, 2026 says the Democrats want full nationwide service including Ben Gurion airport; the existing "local" answer comes from the IDI page. Consider a third stance.

### relig-conversion (extend / orthodox)
| Party | Stance | Basis | Source | Conf. |
|---|---|---|---|---|
| rz | orthodox | stated | Ynet Oct 30, 2022 (above): "anchor in law the exclusive status of state conversion under the Rabbinate"; ToI Dec 28, 2022, https://www.timesofisrael.com/religious-zionism-coalition-deal-settlement-growth-changes-to-discrimination-laws/ | clear |
| noam | orthodox | stated (aggregator) | israel2026.co.il: "conservative conversion" | clear |
| likud | orthodox | unstated | ToI Dec 28, 2022 (RZ deal) and ToI Dec 22, 2022, https://www.timesofisrael.com/likud-utj-deal-seeks-gender-segregated-public-events-review-of-law-of-return/ (UTJ deal): only Orthodox Chief Rabbinate conversions recognized | clear |
| otzma | orthodox | unstated | Ynet Oct 30, 2022 (2022 joint list with RZ) | likely |

Blank: yb (pushes conversion by municipal Orthodox rabbis, ToI Nov 8, 2021, https://www.timesofisrael.com/liveblog_entry/liberman-yisrael-beytenu-will-push-for-conversion-reform-western-wall-pluralistic-plaza/ ; neither stance fits), byachad (Yesh Atid backed Reform and Conservative recognition in 2021; Bennett's view unknown), yashar, bw, res, poi, jl, raam.

### Gaza: civilian administration (no-administration / control)
Rows are stated; the new top-level `unstated` map mirrors the comparison shape.
| Party | Stance | Basis | Source | Conf. |
|---|---|---|---|---|
| likud | no-administration | stated | Al Jazeera, Aug 7, 2025, https://www.aljazeera.com/news/2025/8/7/netanyahu-says-israel-intends-to-take-control-of-gaza-in-interview : "We don't want to govern it." | clear (pre-ceasefire) |
| rz | control | stated | JPost, Aug 18, 2026, https://www.jpost.com/israel-news/politics-and-diplomacy/article-905837 : "conquer it completely, establish a military government there" | clear |
| yb | no-administration | stated | JPost via Yahoo, Oct 5, 2026, https://www.yahoo.com/news/politics/articles/next-gov-t-hand-control-210550074.html : handover to "an external party" | clear |
| dem | no-administration | stated (paraphrase) | Bloomberg via Military.com, Sep 8, 2026, https://www.military.com/israel-left-wing-leader-golan-pledges-to-end-wars-after-october-election : technocratic Palestinian administration | likely |
| bw | no-administration | stated | ToI, May 18, 2024, https://www.timesofisrael.com/liveblog_entry/gantz-sets-out-the-6-strategic-goals-the-coalition-must-adopt-or-his-party-will-bolt/ | likely (2024) |
| otzma | control | unstated | JPost, Sep 27, 2026, https://www.jpost.com/israel-news/article-909884 : "return ... to all of Gaza," settle it | clear |

Blank: shas, utj, noam, yashar (Eisenkot attacks the Board of Peace framework but sets no administration model), res, poi; jl and raam oppose Israeli control, which neither stance describes.

## Notes for the Builder and lib owners
- `lib/positions.ts` `extractedRow` labels every courts-axis answer for dem, yb, bw etc. as "Party questionnaire answer, Sep 22, 2026". New courts answers (dem, yb, bw appointments; yb override) come from 2023 and 2025 statements: read `answerSources` for these.
- The relig override sets the JPost source for shas and utj; that matches the new Shabbat answers.
- `app/coalition-builder/page.tsx:43` fails `tsc`: casting `questions.questions` to `{ key; unstated?: Record<string, Unstated> }[]` needs `as unknown as`, because JSON inference makes missing keys `undefined`.
