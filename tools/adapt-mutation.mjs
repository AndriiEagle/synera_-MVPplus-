// Bounded adversarial check. Mutates a disposable copy, never the lane source.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url)),temp=path.resolve(root,'tmp/adapt-mutation');
assert.ok(temp.startsWith(path.resolve(root,'tmp')+path.sep));await fs.mkdir(temp,{recursive:true});
const source=await fs.readFile(path.join(root,'web_launch/adapt-observer.mjs'),'utf8');
assert.ok(source.includes('s.sessions%3'));
await fs.writeFile(path.join(temp,'adapt-observer.mjs'),source.replace('s.sessions%3','false'));
await fs.copyFile(path.join(root,'web_launch/adapt-observer.test.mjs'),path.join(temp,'adapt-observer.test.mjs'));
const result=spawnSync(process.execPath,['--test',path.join(temp,'adapt-observer.test.mjs')],{cwd:root,encoding:'utf8'});
await fs.writeFile(path.join(temp,'red.txt'),result.stdout+result.stderr);
assert.equal(result.status,1,'disabling the third-session guard must fail the same semantic tests');
assert.match(result.stdout,/opt-in, coarse allowlisted signals, third real session/);
assert.equal(await fs.readFile(path.join(root,'web_launch/adapt-observer.mjs'),'utf8'),source);
console.log('PASS: disposable mutation rejected (exit 1); original source unchanged; tmp/adapt-mutation/red.txt');
