"""Verify official Android downloads and extract only into the approved D: folder."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path('D:/SyneraAndroid')
items = [
    ('studio.zip', '6e83e7ce3e0a76c4e8e78d98eb5ef538cbc9fb386c745bda425fc0bacb9de6d4', root),
    ('tools.zip', '90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a', root / 'sdk-tools'),
]
for name, expected, dest in items:
    with (root / name).open('rb') as f:
        actual = hashlib.file_digest(f, 'sha256').hexdigest()
    assert actual == expected, (name, actual)
    print(name + ' SHA256 verified', flush=True)
    with zipfile.ZipFile(root / name) as archive:
        for info in archive.infolist():
            target = (dest / info.filename).resolve()
            assert target.is_relative_to(dest.resolve()), target
            assert not target.exists(), 'Existing target; reconcile before retry: ' + str(target)
        archive.extractall(dest)
    print(name + ' extracted', flush=True)
(root / 'download-receipt.json').write_text(json.dumps({
    'official_source': 'https://developer.android.com/studio',
    'studio_sha256': items[0][1], 'tools_sha256': items[1][1],
    'global_path_changed': False,
}, indent=2))
