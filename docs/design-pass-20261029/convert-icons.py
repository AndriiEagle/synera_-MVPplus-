from pathlib import Path
import hashlib
import json
from PIL import Image

root = Path('C:/sw/synera-design').resolve()
assert Path.cwd().resolve() == root
source = Path('C:/Users/Andrii/Desktop/synera-premium-pwa-variant/design/assets-20261027')
manifest = json.loads((source / 'MANIFEST.json').read_text(encoding='utf-8-sig'))
originals = {item['path']: item for item in manifest['assets']}
icons = {'match': 'assets/match/idle.png', 'calendar': 'assets/calendar/available.png',
         'terms': 'assets/quota/full.png', 'signature': 'assets/signature/ribbon_link.png'}
receipts = []
for name, file in icons.items():
    original = source / file
    digest = hashlib.sha256(original.read_bytes()).hexdigest()
    assert digest == originals[file]['sha256'], file
    image = Image.open(original)
    assert image.mode == 'RGBA' and image.size == (384, 384)
    # Largest display is 80px, so the reusable image is exactly 2x that size.
    image = image.resize((160, 160), Image.Resampling.LANCZOS)
    target = root / 'web_launch' / f'premium-{name}.webp'
    image.save(target, 'WEBP', quality=88, method=6)
    assert target.stat().st_size <= 40000
    assert Image.open(target).mode == 'RGBA'
    receipts.append({'source': str(original), 'source_sha256': digest,
                     'file': target.name, 'width': 160, 'height': 160,
                     'bytes': target.stat().st_size, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
(root / 'docs/design-pass-20261029/icon-receipts.json').write_text(json.dumps(receipts, indent=2), encoding='utf-8')
print(json.dumps(receipts, indent=2))
