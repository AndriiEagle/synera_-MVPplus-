"""Owned Studio release: preserve previous packages; read back all copied public bytes."""
from pathlib import Path
import hashlib
import json
import shutil
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
proof = root / 'artifacts' / 'ecosystem-20261002'
release = root / 'web_launch' / 'dist-neon-studio-20261002'
names = [v['name'] for v in json.loads((release / 'release.json').read_text(encoding='utf-8'))['files']] + ['release.json']
package = proof / 'synera-studio-neon-20261002.zip'
if package.exists():
    raise SystemExit('Existing package preserved; reconcile before replacing')
with zipfile.ZipFile(package, 'w', zipfile.ZIP_DEFLATED) as z:
    for name in names:
        assert Path(name).name == name
        z.write(release / name, name)
with zipfile.ZipFile(package) as z:
    assert set(z.namelist()) == set(names) and len(z.namelist()) == len(names)
    assert all(z.read(name) == (release / name).read_bytes() for name in names)
site = Path(sys.argv[1]).resolve()
hosting = json.loads((site / '.openai' / 'hosting.json').read_text(encoding='utf-8'))
assert hosting['project_id'] == 'appgprj_6abe5c4d86988191821437cf779b4e9e' and hosting['static']['directory'] == 'dist'
source, target = root / 'web_launch' / 'dist-real-offline', site / 'dist'
allowed = {p.name for p in source.iterdir() if p.is_file()}
assert all(p.is_file() and p.name in allowed for p in target.iterdir())
config = json.loads((source / 'config.json').read_text(encoding='utf-8'))
assert config['registrationEnabled'] is False and not config.get('supabaseUrl')
manifest = json.loads((source / 'studio.webmanifest').read_text(encoding='utf-8'))
assert manifest['id'] == manifest['start_url'] == '/studio.html' and manifest['scope'] == '/studio'
for name in sorted(allowed):
    shutil.copyfile(source / name, target / name)
shutil.copyfile(source / 'summit.html', target / 'index.html')
assert (target / 'index.html').read_bytes() == (source / 'summit.html').read_bytes()
assert all((target / name).read_bytes() == (source / name).read_bytes() for name in allowed - {'index.html'})
result = {'zip': str(package), 'files': len(names), 'sha256': hashlib.sha256(package.read_bytes()).hexdigest(),
          'byte_readback': 'PASS', 'neon_deployed': False, 'site_public_files': len(allowed),
          'site_source_readback': 'PASS', 'site_registration_enabled': False, 'studio_start_url': manifest['start_url']}
(proof / 'PACKAGE_RECEIPT.json').write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
print(json.dumps(result))
