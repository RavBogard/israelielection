# Pledge rules: Netanyahu refusals and outside support (2026-10-06)

Gap: data/pledge-rules.json had 7 rules and none of the opposition leaders' refusals of Netanyahu, so Paths to 61 led with "Likud, Yashar!, B'Yachad, The Democrats: No pledge conflict".

## Schema
- New leaf `{ "cabinet": id }`: the list is in the cabinet; never matched by outside support.
- New flag `support: true`: the pledge also rules out outside support (not to rely on, or prop up, such a government); `party` and `tag` then read cabinet plus outside support. Without it a rule reads the cabinet only (a pledge not to sit with).
- The schema cannot tell a Netanyahu-led Likud from another Likud. `{cabinet: "likud"}` is read as Netanyahu-led and each message says so.

## Rules added or changed
| id | lists | covers outside support | source fetched |
|---|---|---|---|
| yashar-no-netanyahu | Yashar! + Likud cabinet | yes (Yashar! backing it); Likud backing Eisenkot is not flagged, since he has asked Likud to back him | Times of Israel, Sep 17, 2026 ("unfit to lead", no rotation; Yoram Cohen on a post-Netanyahu Likud); Zman Yisrael, Oct 6, 2026 (aim is Netanyahu's retirement; would call on Likud to support him) |
| byachad-no-netanyahu | B'Yachad + Likud cabinet | yes | Ynet (Hebrew), Jul 3, 2026 ("ברור שלא. אני הולך להחליף אותו"); Times of Israel, Feb 17, 2026 ("nor will I be part of it") |
| dem-no-likud-rz-otzma | The Democrats + Likud, RZ or Otzma | yes, both directions (party leaves) | Ynet, Aug 23, 2026 ("fundamentally and decisively unacceptable"; Likud under another leader: "No") |
| dem-no-haredi | The Democrats + Haredi list | no ("will be outside [the government]"; the leaked clip has him voting for such a government) | Times of Israel, May 27, 2026 |
| yb-no-netanyahu | Yisrael Beiteinu + Likud cabinet | yes ("he must go home") | Liberman on X via JFeed, Sep 17, 2026; Jerusalem Post, May 6, 2026 (open to a post-Netanyahu Likud) |
| bw-no-netanyahu | Blue and White + Likud cabinet | yes ("I will not give him his 61st vote") | Jerusalem Post, Aug 20, 2026 |
| res-zionist-unity-only | Reservists + Arab or Haredi list | no | Times of Israel, Nov 20, 2025; Jerusalem Post, Jul 23, 2026 ("Netanyahu is not my red line") |
| rz-no-arab-parties | RZ cabinet + Arab list | yes ("ruled out relying on") | Jerusalem Post, Aug 18, 2026; Times of Israel, May 5, 2026 |
| otzma-no-eisenkot | Otzma + Yashar! | yes | Jerusalem Post, Aug 29, 2026 |
| joint-list-no-netanyahu (changed) | Joint List + Likud cabinet | yes (its offered outside backing is to oust Netanyahu) | Times of Israel, Aug 19, 2026; Haaretz, Oct 6, 2026 |
| byachad-zionist-only (changed) | B'Yachad cabinet + Arab or Haredi list | yes ("will only rely on Zionist parties") | Times of Israel, Apr 26, 2026 |
| utj-yeshiva-status-law (flag only) | UTJ | yes ("support or enter") | unchanged |

Unchanged, cabinet only: zionist-opp-no-arab-parties, eisenkot-no-raam (Eisenkot's "won't ask anything of them" leaves outside support open), lieberman-no-arab-no-haredi.

## Not encoded
- Ra'am: open to any coalition, including Likud. No rule.
- Gantz: earlier (2025) said he would join Netanyahu if the opposition fell short; the Aug 20, 2026 statement is the latest found.
- People of Israel: Ynet (Oct 4) says Winter won't partner with Bennett or Eisenkot; JPost reports the opposite and an INN candidate is open to the center-left. Conflicting; held.
- Otzma on Ra'am: Ben-Gvir calls Ra'am "Hamas-supporting terrorists" and petitioned to bar it, but no fetched statement pledges not to sit with it. Held.
- Shas: "We support Netanyahu, period." No refusal of a partner found.
- Eisenkot on Haredi parties: "no Haredi party currently meets his criteria" (not a refusal). Held.
