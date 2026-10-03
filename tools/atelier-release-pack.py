"""Copy an accepted, closed public demo to its existing Site checkout."""
from pathlib import Path
import hashlib
import json
import shutil
import sys

root = Path(__file__).resolve().parents[1]
source = root / "web_launch" / "dist-real-offline"
site = Path(sys.argv[1]).resolve()
hosting = json.loads((site / ".openai" / "hosting.json").read_text(encoding="utf-8"))
assert hosting == {"static": {"directory": "dist"}, "project_id": "appgprj_6abe5c4d86988191821437cf779b4e9e"}
config = json.loads((source / "config.json").read_text(encoding="utf-8"))
assert config["registrationEnabled"] is False
assert not config.get("supabaseUrl") and not config.get("neonDataApiUrl")
assert not config.get("googleMapsApiKey") and not config.get("groupRoomsEnabled")
release = json.loads((source / "release.json").read_text(encoding="utf-8"))
for entry in release["files"]:
    assert Path(entry["name"]).name == entry["name"]
    data = (source / entry["name"]).read_bytes()
    assert len(data) == entry["bytes"]
    assert hashlib.sha256(data).hexdigest() == entry["sha256"]
names = {p.name for p in source.iterdir() if p.is_file()}
assert len(names) == len(list(source.iterdir()))
target = site / "dist"
assert target.resolve().parent == site
assert all(p.is_file() and p.name in names for p in target.iterdir())
for name in names:
    shutil.copyfile(source / name, target / name)
shutil.copyfile(source / "summit.html", target / "index.html")
assert (target / "index.html").read_bytes() == (source / "summit.html").read_bytes()
assert all((target / name).read_bytes() == (source / name).read_bytes() for name in names - {"index.html"})
receipt = dict(status="PASS", scope="Closed public demo only", site_id=hosting["project_id"], files=len(names),
               registration_enabled=False, group_rooms_enabled=False, embedded_maps=False, embedded_ai=False,
               byte_readback="PASS", published=False, source_files=release["files"])
out = root / "artifacts" / "design-20261003" / "release"
out.mkdir(parents=True, exist_ok=True)
(out / "PACKAGE.json").write_text(json.dumps(receipt, indent=2), encoding="utf-8")
print(json.dumps({k: v for k, v in receipt.items() if k != "source_files"}))
