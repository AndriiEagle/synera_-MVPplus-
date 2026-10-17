# Verification record

This record preserves the earlier documentation/source audit. The subsequent browser launch has its own [scope and acceptance record](../web_launch/README.md). Supabase SQL acceptance has passed; Auth/REST and real browser persistence are blocked by the organization's HTTP 402 quota restriction.

Date: 2026-09-04. Source: `ba4e07567dc06139c336f9ad9262af88f31c5e7d`. Local branch: `codex/synera-documentation-refresh`.

## Evidence boundaries

- Remote repository read was exercised; GitHub reported push/admin permissions. No remote write was attempted.
- A fresh shallow, sparse checkout preserves the remote source. Assets, generated output, and browser-profile contents were omitted from the working tree. This is not a complete build checkout or a Git-history security audit.
- Inventory: 3,171 tracked files; 2,754 classified as generated/editor files; 220 checked-out tracked text files scanned for bounded credential patterns. This does not establish absence of other secrets.
- Candidate counts: 3 distinct AI-provider secret-like values and 4 Google API key values. The report contains locations only. No key validity probe was performed.
- Web/Android/iOS Firebase project identifiers match; the Android application ID matches a configured Firebase Android client. These checks do not prove account access or working authentication.
- Firebase Console had an authenticated browser session. Opening the project's overview returned the missing-project-or-insufficient-permission page. No alternate account was selected and no setting was changed.
- Six Firebase JavaScript source files passed `node --check` with local Node 24.16.0. This proves syntax parsing, not compatibility with the declared Node 18 runtime or installed dependencies.
- All three custom HTTP handlers reached a stubbed Admin database call with an anonymous request. The local stub deliberately throws at that boundary; the observed 500 status is a probe artifact, not a production response. A control handler returning 401 did not reach the stub.
- Flutter/Dart/Firebase CLI/gcloud were not available on PATH. No application build, emulator test, deployed endpoint test, billing read, or live user-data query was run.

## Repeat the local checks

From the repository root, using an existing Python/Node installation:

```powershell
python tools/readiness_audit.py --output ../source-audit.json
node tools/probe_handler_auth.cjs ../handler-auth-probe.json
```

The inventory command returning 0 means the inventory ran; it is not a security pass. The handler probe currently exits 1 because it reproduces the anonymous access failure. Exit 2 means the probe could not execute. A future result without database access still requires review of the response and valid-user behavior.

The Python inventory uses only local files and Git metadata. The Node probe loads local handler code in a restricted VM with Firebase modules stubbed in memory; it does not install packages, execute network requests, or load credentials. These tools are for the inspected trusted source and are not a sandbox for arbitrary hostile JavaScript.

## Source findings

See [security and accounts](SECURITY_AND_ACCOUNTS.md) for file/line evidence and the [acceptance checklist](ACCEPTANCE.md) for remaining gates. Documentation links and changed-file scope are checked as part of the local handoff.

The original audit changed Markdown and two local audit utilities only. Subsequent authorized work added the browser implementation, created the dedicated Supabase project/schema, removed seven old AI-key literals from local Flutter source and added a direct-AI guard. The original audit receipts are historical snapshots. The original Firebase cloud settings, remote Git history and older Supabase projects were not changed. See the browser acceptance record for current results; do not interpret the historical credential count as the post-remediation local count.
