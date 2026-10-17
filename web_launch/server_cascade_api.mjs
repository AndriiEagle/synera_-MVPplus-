import { loadCascadeState, saveCascadeState, rollbackCascade } from './cascade.mjs';
import { readSmallBody } from './server/local-profile-ai.mjs';

const cascadeClients = new Set();
loadCascadeState(); // initialize

function broadcastCascade(state) {
  const message = `data: ${JSON.stringify(state)}\n\n`;
  for (const client of cascadeClients) {
    client.write(message);
  }
}

export async function handleCascadeAPI(req, res, headers) {
  const requestPath = new URL(req.url, 'http://localhost').pathname;
  
  if (requestPath === '/api/cascade/stream') {
    res.writeHead(200, {
      ...headers,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    cascadeClients.add(res);
    req.on('close', () => cascadeClients.delete(res));
    // Send current state immediately
    const state = await loadCascadeState();
    res.write(`data: ${JSON.stringify(state)}\n\n`);
    return true;
  }
  
  if (requestPath === '/api/cascade/deploy' && req.method === 'POST') {
    try {
      const body = await readSmallBody(req);
      const newState = JSON.parse(body);
      const state = await saveCascadeState(newState);
      broadcastCascade(state);
      res.writeHead(200, { ...headers, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'deployed', version: state.version }));
    } catch (e) {
      res.writeHead(400, { ...headers, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return true;
  }

  if (requestPath === '/api/cascade/rollback' && req.method === 'POST') {
    try {
      const state = await rollbackCascade();
      broadcastCascade(state);
      res.writeHead(200, { ...headers, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'rolled_back', version: state.version }));
    } catch (e) {
      res.writeHead(400, { ...headers, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return true;
  }
  
  return false;
}
