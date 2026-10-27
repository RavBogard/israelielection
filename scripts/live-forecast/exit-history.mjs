/**
 * Derives the exit-poll calibration from docs/research/exit-polls/history.json:
 * per broadcaster and election, the Netanyahu-bloc error (final minus exit), the party-level mean absolute
 * seat error and the threshold calls that went wrong; then the field (main channels averaged, checks left
 * out) per election, which is what the live model averages tonight. Writes docs/research/exit-polls/summary.json
 * and data/exit-poll-calibration.json. Run: node scripts/live-forecast/exit-history.mjs
 */
import fs from "node:fs";
import { createHash } from "node:crypto";

const history = JSON.parse(fs.readFileSync("docs/research/exit-polls/history.json", "utf8"));
const r2 = (x) => Math.round(x * 100) / 100;
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const blocOf = (e, seats) => e.parties.reduce((s, id, i) => s + (e.bloc.includes(id) ? seats[i] : 0), 0);
const thresholdMisses = (e, seats) => e.parties.filter((_, i) => (seats[i] > 0) !== (e.final[i] > 0));

const elections = [];
const byChannel = {};
for (const e of history.elections) {
  if (e.verified === false || !e.exits.length) continue;
  const resultBloc = blocOf(e, e.final);
  const rows = e.exits.map((x) => {
    const exitBloc = blocOf(e, x.seats);
    const row = {
      channel: x.channel,
      check: !!x.check,
      exitBloc,
      blocError: resultBloc - exitBloc,
      partyMeanAbsSeats: r2(mean(e.parties.map((_, i) => Math.abs(x.seats[i] - e.final[i])))),
      thresholdMisses: thresholdMisses(e, x.seats),
      seatSum: x.seats.reduce((a, b) => a + b, 0),
    };
    (byChannel[x.channel] ??= []).push({ election: e.id, ...row });
    return row;
  });
  const main = rows.filter((r) => !r.check);
  // The field: the main channels' seats averaged per party, as the live model averages publishers.
  const fieldSeats = e.parties.map((_, i) => mean(e.exits.filter((x) => !x.check).map((x) => x.seats[i])));
  elections.push({
    id: e.id,
    date: e.date,
    resultBloc,
    fieldBloc: r2(mean(main.map((r) => r.exitBloc))),
    fieldBlocError: r2(resultBloc - mean(main.map((r) => r.exitBloc))),
    fieldPartyMeanAbsSeats: r2(mean(fieldSeats.map((s, i) => Math.abs(s - e.final[i])))),
    channels: rows,
  });
}
const errs = elections.map((e) => e.fieldBlocError);
const n = errs.length, m = mean(errs);
const summary = {
  about: "Derived by scripts/live-forecast/exit-history.mjs from history.json; the field is the main channels averaged per party. Positive bloc error means the final result gave the Netanyahu-aligned bloc more seats than the exit polls did.",
  elections,
  field: {
    elections: n,
    meanBlocError: r2(m),
    sdBlocError: r2(Math.sqrt(errs.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, n - 1))),
    rmsBlocError: r2(Math.sqrt(mean(errs.map((x) => x * x)))),
    underAndOver: { under: errs.filter((x) => x > 0.5).length, over: errs.filter((x) => x < -0.5).length, within: errs.filter((x) => Math.abs(x) <= 0.5).length },
    partyMeanAbsSeats: r2(mean(elections.map((e) => e.fieldPartyMeanAbsSeats))),
    electionsWithAThresholdMiss: elections.filter((e) => e.channels.some((c) => !c.check && c.thresholdMisses.length)).length,
  },
  byChannel: Object.fromEntries(
    Object.entries(byChannel).map(([ch, rows]) => [
      ch,
      {
        elections: rows.length,
        meanBlocError: r2(mean(rows.map((r) => r.blocError))),
        meanAbsBlocError: r2(mean(rows.map((r) => Math.abs(r.blocError)))),
        partyMeanAbsSeats: r2(mean(rows.map((r) => r.partyMeanAbsSeats))),
        thresholdMisses: rows.reduce((s, r) => s + r.thresholdMisses.length, 0),
      },
    ]),
  ),
};
fs.writeFileSync("docs/research/exit-polls/summary.json", JSON.stringify(summary, null, 2) + "\n");

const calibration = {
  about: "Exit-poll likelihood for the live model, fitted to the record in docs/research/exit-polls/history.json (main channels averaged per party, Channel 14 left out as a check). 'field' is the averaged exit polls' Netanyahu-bloc seats, 'result' the final bloc, so result minus field is the exit polls' miss; the model's swing is the shrunk mean miss plus a Student-t with the record's own scale. 'partyMeanAbsSeats' is the averaged exit polls' mean absolute seat error per list. 'shrinkagePseudoElections' is the weight of a no-bias prior, in elections, applied to the mean miss.",
  sourceSha256: createHash("sha256").update(fs.readFileSync("docs/research/exit-polls/history.json")).digest("hex"),
  elections: elections.map((e) => ({ date: e.date, field: e.fieldBloc, result: e.resultBloc })),
  partyMeanAbsSeats: summary.field.partyMeanAbsSeats,
  shrinkagePseudoElections: 4,
};
fs.writeFileSync("data/exit-poll-calibration.json", JSON.stringify(calibration, null, 2) + "\n");
console.log(JSON.stringify({ field: summary.field, byChannel: summary.byChannel }, null, 1));
