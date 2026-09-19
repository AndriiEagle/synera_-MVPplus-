import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { StringDecoder } from 'node:string_decoder';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { profileAIPayload, profileAIPrompt, validateAIDraft } from '../profile-brief.mjs';

const adapter = path.join(os.homedir(), '.codex', 'skills', 'domovyk-local-first', 'scripts', 'domovyk_local.py');
const profileSchema = fileURLToPath(new URL('./profile-ai.schema.json', import.meta.url));
function python(args, input = '') {
  return new Promise((resolve, reject) => {
    const child = spawn('py', ['-3', adapter, ...args], { shell: false, windowsHide: true, env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', bytes = 0, ended = false; const decoder = new StringDecoder('utf8');
    const finish = (error, result) => { if (ended) return; ended = true; clearTimeout(timer); error ? reject(error) : resolve(result); };
    const timer = setTimeout(() => { child.kill(); finish(new Error('Local AI timeout')); }, 85000);
    child.stdout.on('data', chunk => { bytes += chunk.length; if (bytes > 65536) { child.kill(); finish(new Error('Output limit')); } else stdout += decoder.write(chunk); });
    child.stderr.on('data', () => {}); // Never surface or log prompts, device state or model output.
    child.on('error', error => finish(error));
    child.on('close', code => { stdout += decoder.end(); try { finish(null, { code, value: JSON.parse(stdout) }); } catch { finish(new Error('Local adapter output unavailable')); } });
    child.stdin.on('error', () => {}); child.stdin.end(input);
  });
}
export async function runLocalProfileModel(prompt) {
  // Canonical DOMOVYK adapter rechecks resource/presence gates. No provider fallback or automatic retry.
  const result = await python(['run', '--task-class', 'extraction', '--stdin', '--start', '--schema', profileSchema, '--max-tokens', '1200', '--temperature', '0'], prompt);
  if (result.code !== 0 || !result.value?.result?.content || !result.value.receipt) throw new Error('Локальний AI недоступний');
  const receipt = JSON.parse(await fs.readFile(result.value.receipt, 'utf8'));
  if (!validLocalReceipt(receipt, prompt, result.value.result.content)) throw new Error('Локальний чек недоступний');
  return {
    content: result.value.result.content,
    review: async () => {
      const reviewed = await python(['accept', '--receipt', result.value.receipt, '--verdict', 'needs_review', '--evidence', 'Synera JSON and exact source quotations validated; human confirmation in the profile editor is still required.']);
      if (![0, 2].includes(reviewed.code)) throw new Error('Чек підтвердження недоступний');
    },
  };
}
export function validLocalReceipt(receipt, prompt, output) {
  const hash = value => createHash('sha256').update(value).digest('hex');
  return receipt.schema === 'domovyk.local_execution_receipt.v1' && receipt.outcome === 'generated_needs_local_acceptance' &&
    receipt.provider?.called === false && receipt.provider?.calls === 0 && receipt.provider?.actual_or_reserved_usd === 0 &&
    receipt.prompt_sha256 === hash(prompt) && receipt.output_sha256 === hash(output);
}
export function createLocalProfileAI({ nonce, runModel = runLocalProfileModel, maxCalls = 3 } = {}) {
  let running = false, calls = 0;
  return async function handle({ method, origin, expectedOrigin, host, access, contentType, body }) {
    const fail = (status, message) => ({ status, body: { message } });
    if (method !== 'POST') return fail(405, 'Потрібен POST-запит.');
    if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(expectedOrigin) || origin !== expectedOrigin || 'http://' + host !== expectedOrigin || access !== nonce || !nonce) return fail(403, 'AI доступний лише у власній локальній вкладці Synera.');
    if (!/^application\/json(?:;|$)/i.test(contentType || '')) return fail(415, 'Потрібен JSON.');
    if (typeof body !== 'string' || Buffer.byteLength(body) > 4096) return fail(413, 'Потрібен короткий професійний опис.');
    let payload;
    try {
      const value = JSON.parse(body);
      if (!value || Array.isArray(value) || Object.keys(value).some(k => !['version','consent','offers','seeks','goal'].includes(k)) || value.version !== 1 || value.consent !== true) throw new Error('Некоректні вхідні дані');
      for (const [key, max] of [['offers',300],['seeks',300],['goal',240]]) if (typeof value[key] !== 'string' || value[key].length > max) throw new Error('Некоректні вхідні дані');
      payload = profileAIPayload(value, { consent: value.consent });
    } catch { return fail(422, 'Перевір дозвіл, довжину тексту та прибери контакти й ключі.'); }
    if (running) return fail(429, 'Один AI-запит уже виконується. Дочекайся результату.');
    if (calls >= maxCalls) return fail(429, 'Межу локальної сесії AI досягнуто. Можна продовжити вручну або через власний ChatGPT.');
    running = true; calls++;
    let stage = 'runtime';
    try {
      const result = await runModel(profileAIPrompt(payload));
      stage = 'validation';
      const draft = validateAIDraft(result.content, payload);
      stage = 'receipt';
      await result.review();
      return { status: 200, body: { draft, engine: 'local-domovyk', human_review_required: true, provider_calls: 0, actual_usd: 0 } };
    } catch { return { status: 503, body: { code: 'local_' + stage + '_unavailable', message: 'Локальний AI зараз недоступний або не пройшов перевірку відповіді. Профіль не змінено. Можна використати власний ChatGPT нижче.' } }; }
    finally { running = false; }
  };
}

export function readSmallBody(req, limit = 4096) {
  return new Promise((resolve, reject) => {
    let bytes = 0, done = false; const chunks = [];
    const finish = (error, value) => { if (done) return; done = true; clearTimeout(timer); error ? reject(error) : resolve(value); };
    const timer = setTimeout(() => finish(new Error('Body timeout')), 15000);
    req.on('data', chunk => { if (done) return; bytes += chunk.length; if (bytes > limit) finish(new Error('Body too large')); else chunks.push(chunk); });
    req.on('end', () => finish(null, Buffer.concat(chunks).toString('utf8')));
    req.on('error', error => finish(error)); req.on('aborted', () => finish(new Error('Request aborted')));
  });
}
