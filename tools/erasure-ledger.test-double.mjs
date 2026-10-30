// LOCAL TEST DOUBLE ONLY. In-memory, separate from the restored database fixture.
// Never import into the Worker or claim provider deletion / backup destruction.
import {createHmac} from 'node:crypto';
export function createErasureLedgerDouble(key) {
  if (typeof key !== 'string' || Buffer.byteLength(key) < 32) throw Error('Test ledger needs a separate key');
  const records = new Map();
  const tag = id => {
    if (typeof id !== 'string' || !id) throw Error('Invalid subject');
    return createHmac('sha256', key).update('synera-erasure-v1\0' + id).digest('hex');
  };
  return {
    intent(id) { const hash = tag(id); if (!records.has(hash)) records.set(hash, 'pending'); return hash; },
    complete(id) { const hash = tag(id); if (!records.has(hash)) throw Error('Intent required'); records.set(hash, 'accepted_test_double'); },
    snapshot() { return [...records].map(([subject_hmac, status]) => ({subject_hmac, status})); },
    assertRestoreSafe(ids) {
      // Pending intent also suppresses resurrection after an interrupted deletion.
      if (ids.some(id => records.has(tag(id)))) throw Error('Restore blocked: erasure intent present');
      return true;
    },
  };
}
