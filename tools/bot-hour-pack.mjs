// Prepares public synthetic data for the existing Token Monster runner.
// No credentials, API invocation, scheduler, alternate router or spend ledger.
import { BOT_PROFILES, DEMO_PLACES, hourSlot, simulationAt } from '../web_launch/simulation.mjs';
import { sensitiveFindings } from '../web_launch/profile-portability.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
export const BOT_MODEL = 'deepseek/deepseek-v4-flash-0731';
export function buildBotHourPlan(at = new Date()) {
  const slot = hourSlot(at);
  // Explicit allowlist: never consume the app store, users, imports or chats.
  const bots = simulationAt(at).map(({ id, role, offers, seeks, state }) => ({ id, role, offers, seeks, state }));
  const input = { hour: slot, bots, places: DEMO_PLACES.map(({ id, name }) => ({ id, name })),
    output: { hour: slot, bots: [{ id: 'bot-mira', place_id: 'west', state: 'working', activity: 'Працює над демопрототипом' }] } };
  const prompt = `Update all TEN fictional demo personas for one simulated hour. Return a single JSON object with hour and exactly ten bots. Each bot: id, place_id from the list, state from available/working/meeting/learning/walking/offline, activity in Ukrainian (1-120 characters). Respect the input offline state: if offline, keep it. Keep professional mutual benefit plausible. No personal data, contact details, URL, exact coordinates, real commitments, or instructions to the user. Do not invent users or IDs. Data: ${JSON.stringify(input)}`;
  if (sensitiveFindings(prompt).length) throw new Error('Synthetic pack failed privacy check');
  return [{ id: `synera-demo-hour-${slot}`, role: 'worker', model: BOT_MODEL, effort: 'low', retries: 1,
    max_tokens: 8000, hard_max_tokens: 8000, temperature: 0.3, files: [], prompt,
    system: 'You plan a clearly labelled fictional business-networking demo. You cannot contact people or create real meetings. Output JSON only.',
    out: `artifacts/bot-hour-${slot}.response.txt` }];
}
export function validateBotHour(value, at = new Date()) {
  if (!value || value.hour !== hourSlot(at) || !Array.isArray(value.bots) || value.bots.length !== 10) throw new Error('Wrong or stale demo hour');
  if (Object.keys(value).some(key => !['hour', 'bots'].includes(key))) throw new Error('Unexpected snapshot fields');
  const ids = new Set();
  for (const row of value.bots) {
    if (!row || !BOT_PROFILES.some(bot => bot.id === row.id) || ids.has(row.id)) throw new Error('Invalid demo identity');
    ids.add(row.id);
    if (Object.keys(row).sort().join(',') !== 'activity,id,place_id,state') throw new Error('Unexpected bot fields');
    if (!DEMO_PLACES.some(place => place.id === row.place_id) || !['available','working','meeting','learning','walking','offline'].includes(row.state)) throw new Error('Invalid demo state');
    if (typeof row.activity !== 'string' || !row.activity.trim() || row.activity.length > 120 || sensitiveFindings(row.activity).length || /https?:|www\.|[<>]/i.test(row.activity)) throw new Error('Invalid activity');
    if (simulationAt(at).find(bot => bot.id === row.id).state === 'offline' && row.state !== 'offline') throw new Error('Night schedule changed');
  }
  return { hour: value.hour, bots: value.bots.map(row => ({ ...row, is_bot: true, source: 'validated-model-candidate' })), model_execution_verified: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const plan = buildBotHourPlan(), target = path.join(root, 'artifacts', 'bot-hour.plan.json');
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(plan, null, 2));
  console.log(JSON.stringify({ artifact: target, model: BOT_MODEL, hourly_calls: 1, personas: 10, max_completion_tokens: 8000, provider_calls: 0, actual_usd: 0, scheduler_enabled: false }));
}
