import fs from 'node:fs';
import crypto from 'node:crypto';
const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const path = 'data/live-forecast-prior.json';
if (fs.existsSync(path)) throw new Error('Prior already exists; immutable version requires a new filename');
const source = fs.readFileSync('data/forecast.json','utf8');
const prior = {version:'pre-election-2026-10-25-v3',sha256:crypto.createHash('sha256').update(source).digest('hex'),forecast:JSON.parse(source),inputs:{pollFile:read('data/polls.json'),partyFile:read('data/parties.json'),results:read('data/results.json'),calibration:read('scripts/forecast/calibration.json')}};
prior.inputSha256 = crypto.createHash('sha256').update(JSON.stringify(prior.inputs)).digest('hex');
fs.writeFileSync(path,JSON.stringify(prior,null,2)+'\n');
