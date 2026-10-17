import { unpackArchive } from './archive-codec.mjs';
import { hashMaterialPayload, caseMaterialProblems, caseParticipantProblems } from './business-case.mjs';
import { validateOutcome } from './real-journey-client.mjs';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const exactKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));

// Local consistency checks are not a signature or a current server observation.
// This reader never creates a store, an authenticated request or an import write.
export async function readOutcomeArchive(envelope) {
  const value = JSON.parse(await unpackArchive(envelope)), item = value?.case;
  const invalid = () => { throw new Error('Це не підтримувана копія результатів Synera або її дані суперечливі.'); };
  if (!exactKeys(value, ['format', 'archiveVersion', 'authority', 'proof_scope', 'exported_by', 'case', 'outcome']) ||
      value.format !== 'synera.case-outcome.archive.v1' || value.archiveVersion !== 1 ||
      value.authority !== 'local_copy_not_live_server_state' || value.proof_scope !== 'participant_attestation' ||
      !exactKeys(item, ['case_id', 'version', 'terms_hash', 'participants', 'material']) ||
      typeof item.case_id !== 'string' || !/^[a-z0-9-]{1,64}$/.test(item.case_id) ||
      !Number.isSafeInteger(item.version) || item.version < 1 || item.version > 999999999 ||
      !/^[a-f0-9]{64}$/.test(item.terms_hash) || !Array.isArray(item.participants) || item.participants.length !== 2 ||
      new Set(item.participants).size !== 2 || item.participants.some(id => !UUID.test(id)) ||
      !item.participants.includes(value.exported_by)) invalid();
  if (caseMaterialProblems(item.material).length || caseParticipantProblems(item.material, item.participants).length ||
      await hashMaterialPayload(item.material) !== item.terms_hash) invalid();
  validateOutcome(value.outcome, { caseId: item.case_id, version: item.version, termsHash: item.terms_hash, material: item.material });
  return value;
}
