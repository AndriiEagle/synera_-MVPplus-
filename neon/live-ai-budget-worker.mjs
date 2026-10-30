// Deploy separately from Pages, then bind its class to the pilot Pages Worker.
// No model key belongs in this coordinator. All external requests are rejected.
export { LiveAiBudget } from './live-ai.mjs';
export default { fetch() { return new Response('Not found',{status:404}); } };
