import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';
import { securityHeaders } from '../web_launch/config.mjs';
import { createSimulation, simulationAction, SIMULATION_PEOPLE } from '../web_launch/simulation-session.mjs';

const webRoot = fileURLToPath(new URL('../web_launch/', import.meta.url));
const sameSecret = (a, b) => typeof a === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const json = (res, status, value, extra = {}) => {
  res.writeHead(status, { ...securityHeaders({}), 'Content-Type': 'application/json; charset=utf-8', ...extra });
  res.end(JSON.stringify(value));
};
async function body(req) {
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw Error('Потрібен JSON');
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 32768) throw Error('Запит завеликий; чернетку не змінено'); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function createSimulationServer({ directory, publicOrigin = '', runner = null, port = 0 } = {}) {
  if (!directory) throw Error('A private state directory is required');
  if (publicOrigin && (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(publicOrigin) || new URL(publicOrigin).origin !== publicOrigin)) throw Error('Exact HTTPS public origin required');
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('Invalid local port');
  await fs.mkdir(directory, { recursive: true });
  const statePath = path.join(directory, 'sessions.json');
  let sessions = {}, queue = Promise.resolve(), runnerBusy = false, stopped = true, epoch = 0, closed = false;
  let runtimeMessage = 'AI зупинено. Можна оглянути учасників і підготувати чернетку.';
  try {
    sessions = JSON.parse(await fs.readFile(statePath, 'utf8'));
    if (!sessions || Array.isArray(sessions) || Object.entries(sessions).some(([id, s]) =>
      !SIMULATION_PEOPLE.some(p => p.id === id) || s.personId !== id || s.format !== 'synera.ai-simulation.v1')) throw Error('Invalid saved simulation state');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const ownerKey = randomBytes(32).toString('hex'), ownerCookie = randomBytes(32).toString('hex');
  const roles = new Map([[ownerCookie, { actor: 'owner' }]]);
  const consentedPairs = new Set();
  const auth = req => roles.get(/(?:^|;\s*)synera_sim=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1]);
  const personExists = id => SIMULATION_PEOPLE.some(p => p.id === id);
  const originAllowed = req => req.headers.origin === localOrigin || (publicOrigin && req.headers.origin === publicOrigin);
  let localOrigin;
  const persist = async next => {
    await fs.writeFile(statePath + '.pending', JSON.stringify(next), { mode: 0o600 });
    await fs.rename(statePath + '.pending', statePath);
  };
  async function session(id) {
    if (!personExists(id)) throw Error('Невідомий AI-учасник');
    return sessions[id] || createSimulation(id);
  }
  async function mutate(id, action, identity) {
    const operation = queue.then(async () => {
      const { actor } = identity;
      if (actor !== 'owner' && (stopped || closed || !identity.frame || identity.frame.used ||
          identity.frame.revision !== action.revision)) throw Error('STOP або застарілий екран AI');
      const current = await session(id);
      const updated = await simulationAction(current, { ...action, actor });
      if (actor !== 'owner') updated.events.at(-1).evidence = identity.frame.evidence;
      const next = { ...sessions, [id]: updated };
      await persist(next); sessions = next;
      if (actor !== 'owner') identity.frame.used = true;
      return updated;
    });
    queue = operation.catch(() => {});
    return operation;
  }
  const snapshot = async (id, actor) => ({ actor, state: await session(id), runtime: {
    enabled: Boolean(runner), busy: runnerBusy, stopped, message: runtimeMessage,
  } });
  async function startRun(id) {
    if (!runner || runnerBusy || stopped || closed || !consentedPairs.has(id)) return;
    runnerBusy = true;
    const runEpoch = epoch;
    runtimeMessage = 'AI переглядає екран своєї пари. Можна зупинити.';
    try {
      const result = await runner({ id, origin: localOrigin, directory,
        cookie: () => { const token = randomBytes(32).toString('hex'); roles.set(token, { actor: id }); return token; },
        authorizeFrame: (token, frame) => {
          const identity = roles.get(token);
          if (!identity || identity.actor !== id || stopped || epoch !== runEpoch) throw Error('AI authorization expired');
          identity.frame = { ...frame, used: false };
        },
        revokeCookie: token => roles.delete(token),
        snapshot: () => session(id), valid: () => !stopped && !closed && epoch === runEpoch,
      });
      if (!stopped) runtimeMessage = result?.message || 'AI завершив цей хід. Перевір відповідь і наступну дію.';
    } catch (error) {
      stopped = true; epoch++; consentedPairs.clear();
      runtimeMessage = 'AI зупинено: ' + error.message + '. Чернетки й історія збережені.';
    } finally { runnerBusy = false; }
  }
  const server = http.createServer(async (req, res) => {
    try {
      if (req.headers.host !== new URL(localOrigin).host && (!publicOrigin || req.headers.host !== new URL(publicOrigin).host)) return json(res, 403, { message: 'Host не дозволений' });
      const url = new URL(req.url, localOrigin);
      if (url.pathname.startsWith('/api/sim/')) {
        if (!['GET', 'POST'].includes(req.method)) return json(res, 405, { message: 'Метод не дозволений' });
        if (req.method === 'POST' && !originAllowed(req)) return json(res, 403, { message: 'Origin не дозволений' });
        if (url.pathname === '/api/sim/login' && req.method === 'POST') {
          const value = await body(req);
          if (!sameSecret(value.key, ownerKey)) return json(res, 403, { message: 'Неправильний ключ підключення' });
          return json(res, 200, { ok: true }, { 'Set-Cookie': `synera_sim=${ownerCookie}; Path=/api/sim/; HttpOnly; SameSite=Strict${req.headers.origin.startsWith('https:') ? '; Secure' : ''}` });
        }
        const identity = auth(req), actor = identity?.actor;
        if (!actor) return json(res, 401, { message: 'Відкрий приватне посилання з комп’ютера, на якому запущено симулятор.' });
        if (url.pathname === '/api/sim/people' && req.method === 'GET') return json(res, 200, { people: SIMULATION_PEOPLE.filter(p => actor === 'owner' || p.id === actor) });
        if (url.pathname === '/api/sim/stop' && req.method === 'POST') {
          if (actor !== 'owner') return json(res, 403, { message: 'Керує лише власник' });
          stopped = true; epoch++; consentedPairs.clear(); runtimeMessage = 'STOP. Нові AI-виклики й застосування запізнілої відповіді заблоковано.';
          return json(res, 200, { ok: true });
        }
        const value = req.method === 'POST' ? await body(req) : null;
        const id = value?.personId || url.searchParams.get('person');
        if (!personExists(id) || (actor !== 'owner' && actor !== id)) return json(res, 403, { message: 'Чужа пара' });
        if (url.pathname === '/api/sim/session' && req.method === 'GET') return json(res, 200, await snapshot(id, actor));
        if (url.pathname === '/api/sim/export' && req.method === 'GET' && actor === 'owner') return json(res, 200,
          { format: 'synera.ai-simulation-export.v1', simulation: true, customerEvidence: false, state: await session(id) },
          { 'Content-Disposition': 'attachment; filename="synera-simulation.json"' });
        if (url.pathname === '/api/sim/run' && req.method === 'POST' && actor === 'owner') {
          if (value.consent !== true) return json(res, 422, { message: 'Потрібна згода на передавання тексту й екранів цієї симуляції AI-провайдеру.' });
          if (!runner) return json(res, 503, { message: 'AI backend не налаштований. Сценарні відповіді не підставляються.' });
          if (runnerBusy) return json(res, 409, { message: 'Попередній хід ще завершується.' });
          stopped = false; consentedPairs.add(id);
          json(res, 202, { ok: true }); void startRun(id); return;
        }
        if (url.pathname === '/api/sim/action' && req.method === 'POST') {
          if (actor !== 'owner' && stopped) return json(res, 409, { message: 'STOP блокує AI-дії' });
          await mutate(id, value, identity);
          json(res, 200, await snapshot(id, actor));
          // One human change wakes one finite actor turn; no hidden overnight loop.
          if (actor === 'owner' && value.kind !== 'stop') void startRun(id);
          return;
        }
        return json(res, 404, { message: 'Немає такого API' });
      }
      if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { message: 'Метод не дозволений' });
      const name = url.pathname === '/' ? 'simulation.html' : url.pathname.slice(1);
      if (!Object.hasOwn(PUBLIC_ASSETS, name)) return json(res, 404, { message: 'Not found' });
      const bytes = await fs.readFile(path.join(webRoot, name));
      res.writeHead(200, { ...securityHeaders({}), 'Content-Type': PUBLIC_ASSETS[name] });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch (error) { json(res, /змінився/.test(error.message) ? 409 : 422, { message: error.message }); }
  });
  server.requestTimeout = 20000; server.headersTimeout = 10000;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  localOrigin = `http://127.0.0.1:${server.address().port}`;
  return { origin: localOrigin, ownerKey, server, publicOrigin,
    url: `${publicOrigin || localOrigin}/simulation.html#key=${ownerKey}`,
    close: async () => { closed = true; stopped = true; epoch++; roles.clear(); await queue; await new Promise(resolve => server.close(resolve)); } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(process.argv.slice(2).map(value => { const i = value.indexOf('='); return [value.slice(0, i), value.slice(i + 1)]; }));
  if (!args['--state']) throw Error('Use --state=<private directory>; optionally --tm=<existing Token Monster directory> --authority=<approved stage JSON> --public-origin=https://exact-host');
  const runner = args['--tm'] && args['--authority']
    ? (await import('./simulation-runner.mjs')).createScreenshotRunner({ tm: args['--tm'], authority: args['--authority'] }) : null;
  const app = await createSimulationServer({ directory: path.resolve(args['--state']), publicOrigin: args['--public-origin'] || '', runner,
    port: args['--port'] === undefined ? 0 : Number(args['--port']) });
  await fs.writeFile(path.join(args['--state'], 'connection.json'), JSON.stringify({ url: app.url, localOrigin: app.origin }), { mode: 0o600 });
  console.log(`Synera simulation: ${app.origin}/simulation.html\nPrivate phone connection saved in ${path.resolve(args['--state'], 'connection.json')}`);
  process.on('SIGINT', () => void app.close());
  process.on('SIGTERM', () => void app.close());
}
