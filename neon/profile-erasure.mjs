export function profileErasureReady(env) {
  return env.SYNERA_PILOT_READY === 'true' && env.SYNERA_PROFILE_ERASURE_READY === 'true';
}
export function profileErasureResult(value) {
  if (!value || value.status !== 'application_data_erased' || value.providerDeletion !== 'pending' ||
      value.retainedScope !== 'bilateral_records_and_safety_evidence' || typeof value.repeated !== 'boolean') {
    throw new Error('Unconfirmed profile erasure');
  }
  return { status:value.status, providerDeletion:value.providerDeletion, retainedScope:value.retainedScope, repeated:value.repeated };
}
