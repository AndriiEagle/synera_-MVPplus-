import { loadConfig } from './config.mjs';
import { SupabaseStore, ServiceError } from './data.mjs';
const config = await loadConfig();
if (!config.supabaseUrl) throw new Error('Потрібна онлайн конфігурація');
try {
  await new SupabaseStore(config).availability();
  console.log(JSON.stringify({ checked_at: new Date().toISOString(), auth_gateway: 'reachable', authentication_tested: false, ready_for_launch: false }));
} catch (error) {
  console.log(JSON.stringify({ checked_at: new Date().toISOString(), auth_gateway: error instanceof ServiceError && error.status === 402 ? 'restricted' : 'unavailable', http_status: error.status ?? null, ready_for_launch: false }));
  process.exitCode = 2;
}
