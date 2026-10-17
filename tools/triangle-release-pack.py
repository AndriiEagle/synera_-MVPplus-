"""Build/read back the owned local release and copy reviewed public bytes to the existing Site."""
from pathlib import Path
import hashlib
import json
import shutil
import sys
import re
import zipfile

root = Path(__file__).resolve().parents[1]
proof = root / 'artifacts' / 'triangle-20261002'
proof.mkdir(exist_ok=True)
release = root / 'web_launch' / 'dist-neon-triangle-20261002'
metadata = json.loads((release / 'release.json').read_text(encoding='utf-8'))
names = [entry['name'] for entry in metadata['files']] + ['release.json']
suffix = sys.argv[2] if len(sys.argv) > 2 else ''
assert suffix == '' or re.fullmatch(r'-rc[1-9][0-9]?', suffix)
zip_path = proof / ('synera-triangle-neon-20261002'+suffix+'.zip')
if zip_path.exists():
    raise SystemExit('Release archive already exists; inspect its receipt before replacing it')
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as archive:
    for name in names:
        archive.write(release / name, name)
with zipfile.ZipFile(zip_path) as archive:
    assert set(archive.namelist()) == set(names)
    assert len(archive.namelist()) == len(names)
    for name in names:
        assert archive.read(name) == (release / name).read_bytes()

site = Path(sys.argv[1]).resolve()
manifest = json.loads((site / '.openai' / 'hosting.json').read_text(encoding='utf-8'))
assert manifest['project_id'] == 'appgprj_6abe5c4d86988191821437cf779b4e9e'
assert manifest['static']['directory'] == 'dist'
target = site / 'dist'
source = root / 'web_launch' / 'dist-real-offline'
allowed = {p.name for p in source.iterdir() if p.is_file()}
assert all(p.is_file() and p.name in allowed for p in target.iterdir())
config = json.loads((source / 'config.json').read_text(encoding='utf-8'))
assert config['registrationEnabled'] is False
assert not config.get('supabaseUrl')
for name in sorted(allowed):
    shutil.copyfile(source / name, target / name)
shutil.copyfile(source / 'summit.html', target / 'index.html')
assert (target / 'index.html').read_bytes() == (source / 'summit.html').read_bytes()
assert all((target / name).read_bytes() == (source / name).read_bytes() for name in allowed - {'index.html'})
result = {'zip': str(zip_path), 'files': len(names), 'sha256': hashlib.sha256(zip_path.read_bytes()).hexdigest(),
          'byte_readback': 'PASS', 'neon_deployed': False, 'site_public_files': len(allowed),
          'site_source_readback': 'PASS', 'site_registration_enabled': False}
(proof / ('PACKAGE_RECEIPT'+suffix+'.json')).write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
print(json.dumps(result))
