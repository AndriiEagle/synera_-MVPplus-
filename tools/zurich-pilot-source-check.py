"""Read-only official-source anchor checks; no raw page archive or personal data."""
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urlparse
from urllib.request import Request, urlopen

OUT = Path(__file__).resolve().parents[1] / "artifacts/zurich-pilot-model-20261005"


class Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.chunks = []

    def handle_data(self, data):
        self.chunks.append(data)


def main():
    doc = json.loads((OUT / "sources.json").read_text(encoding="utf-8"))
    checks = []
    for source in doc["sources"]:
        if urlparse(source["url"]).hostname not in {"www.zh.ch", "www.stadt-zuerich.ch"}:
            raise ValueError("only listed official public sources allowed")
        with urlopen(Request(source["url"], headers={"User-Agent": "Synera-local-source-verification/1.0"}), timeout=20) as response:
            raw = response.read(3_000_001)
            if len(raw) > 3_000_000:
                raise ValueError("source exceeds bounded read")
            status, final_url = response.status, response.url
        parser = Text()
        parser.feed(raw.decode("utf-8"))
        visible = re.sub(r"\s+", " ", " ".join(parser.chunks))
        anchors = {a: a in visible for a in source["check_anchors"]}
        checks.append({"id": source["id"], "url": final_url, "http_status": status, "html_sha256": hashlib.sha256(raw).hexdigest(),
                       "bytes": len(raw), "anchors": anchors, "verdict": "SOURCE_ANCHORS_VERIFIED" if all(anchors.values()) else "NEEDS_REVIEW"})
    (OUT / "source-checks.json").write_text(json.dumps({"checked_on": doc["checked_on"], "checks": checks,
        "limit": "Anchor presence supports source readback; applicability and legal outcome require individual authority review."}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(checks, ensure_ascii=False, indent=2))
    if not all(c["verdict"] == "SOURCE_ANCHORS_VERIFIED" for c in checks):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
