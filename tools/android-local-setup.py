"""Approved compact Android copy on C:, preserving USB originals and failed AVD."""
from pathlib import Path
import hashlib, json, os, shutil

repo = Path(__file__).resolve().parents[1]
proof = repo/'artifacts/android-emulator-20261007'
plan = json.loads((proof/'C_RECOVERY_PLAN.json').read_text(encoding='utf-8-sig'))
root = Path('C:/Users/Andrii/.codex/tmp/synera-android-local')
source = Path('D:/SyneraAndroid/sdk')
reserve = 8 * 1024**3
working_reserve = 3 * 1024**3
assert not root.exists(), 'Existing target: reconcile receipt before any retry'
for base in [root.parent, source]:
    for p in [base, *base.parents]:
        assert not p.is_symlink() and not p.is_junction(), f'Reparse path: {p}'
files = []
for item in plan['files']:
    rel = Path(item['relative'])
    assert not rel.is_absolute() and '..' not in rel.parts
    src = source/rel
    assert src.is_file() and not src.is_symlink() and not src.is_junction()
    assert src.stat().st_size == item['bytes'], f'Source changed: {rel}'
    files.append((src, rel, item['bytes']))
remaining = sum(x[2] for x in files)
assert remaining + working_reserve < 7*1024**3, 'Exceeds approved total envelope'
assert shutil.disk_usage(root.parent).free > reserve + remaining + working_reserve, 'Insufficient C reserve'
root.mkdir()
records = []
for n, (src, rel, size) in enumerate(files, 1):
    assert shutil.disk_usage(root).free > reserve + remaining + working_reserve, 'C reserve reached'
    dst = root/'sdk'/rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    before = src.stat()
    digest = hashlib.sha256()
    with src.open('rb') as inp, dst.open('xb') as out:
        while chunk := inp.read(4*1024**2):
            digest.update(chunk); out.write(chunk)
        out.flush(); os.fsync(out.fileno())
    after = src.stat()
    assert (before.st_size, before.st_mtime_ns) == (after.st_size, after.st_mtime_ns), 'Source changed during copy'
    with dst.open('rb') as f: copied = hashlib.file_digest(f, 'sha256').hexdigest()
    assert copied == digest.hexdigest() and dst.stat().st_size == size, f'Copy mismatch: {rel}'
    records.append({'path':str(rel),'bytes':size,'sha256':copied})
    remaining -= size
    if n%100 == 0: print(f'Copied and hashed {n}/{len(files)}', flush=True)
for name in ['user','tmp','avd']: (root/name).mkdir()
avd = root/'avd/Synera_Local_API36.avd'
avd.mkdir()
config = dict(line.split('=',1) for line in (proof/'avd-created.ini').read_text(encoding='utf-8-sig').splitlines() if '=' in line)
config.update({'image.sysdir.1':str(root/'sdk/system-images/android-36/google_apis_playstore/x86_64')+os.sep,
               'disk.dataPartition.size':'2G','disk.dataPartition.path':'<temp>',
               'avd.id':'Synera_Local_API36','avd.name':'Synera Local API36',
               'firstboot.bootFromDownloadableSnapshot':'no','firstboot.bootFromLocalSnapshot':'no',
               'firstboot.saveToLocalSnapshot':'no','fastboot.forceFastBoot':'no',
               'fastboot.forceColdBoot':'yes','hw.cpu.ncore':'2','hw.ramSize':'2G'})
(avd/'config.ini').write_text(''.join(f'{k}={v}\n' for k,v in config.items()),encoding='utf8')
(root/'avd/Synera_Local_API36.ini').write_text(f'avd.ini.encoding=UTF-8\npath={avd}\ntarget=android-36\n',encoding='utf8')
receipt = {'status':'COPIED_HASH_VERIFIED_NOT_BOOTED','root':str(root),'files':records,
           'freeBytes':shutil.disk_usage(root).free,'originalsPreserved':True,'avdDataReused':False}
(proof/'C_SETUP.json').write_text(json.dumps(receipt,indent=2),encoding='utf8')
print(json.dumps({k:v for k,v in receipt.items() if k!='files'}),flush=True)
