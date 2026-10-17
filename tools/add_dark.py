import re
from pathlib import Path

# Load tokens
tokens_path = Path("web_launch/tokens.css")
content = tokens_path.read_text("utf-8")

dark_vars = """
html.dark, html:not(.light) {
  @media (prefers-color-scheme: dark) {
    --color-fff: #121212;
    --color-f5f7f4: #080808;
    --color-f8faf8: #0a0a0a;
    --color-fafcf9: #0c0c0c;
    --color-fffefa: #0d0d0d;
    --color-f0f5ef: #111512;
    --color-eaf3ed: #131a16;
    --color-eaf0eb: #141c18;
    --color-f2f7f2: #161c18;
    --color-f0f2e8: #181a14;
    --color-eef4ef: #151a17;
    --color-edf0e8: #161814;
    --color-f4f5ef: #191a16;
    
    --color-19513e: #dce4de;
    --color-425644: #b0c0b4;
    --color-21694c: #8da679;
    --color-1d3628: #a8b8ae;
    --color-2d6147: #9caf61;
    --color-24533d: #839f60;
    --color-23583b: #7b8c80;
    --color-204832: #61704f;
    --color-174c36: #688143;
    --color-184a33: #78836a;
    
    --color-dce4de: #2a382f;
    --color-d9e3dc: #2c3a32;
    --color-d8e5db: #28362d;
    --color-d7decb: #323b2c;
    --color-d0e2d5: #203026;
    --color-ccdbd1: #1e2e24;
    --color-cdd5c7: #2a3528;
    --color-cce0d2: #1c2b22;
    
    --color-ffffff80: #00000080;
    --color-fffffff0: #121212f0;
    
    --shadow-0: 0 10px 40px #00000050;
    --shadow-1: 0 1px 4px #00000080;
    --shadow-2: 0 24px 100px #000000a0;
    --shadow-3: 0 2px 5px #00000060;
    --shadow-4: 0 2px 6px #00000070;
    --shadow-5: 0 2px 8px #00000090;
    --shadow-6: 0 3px 16px #00000080;
  }
}

html.dark {
    --color-fff: #121212;
    --color-f5f7f4: #080808;
    --color-f8faf8: #0a0a0a;
    --color-fafcf9: #0c0c0c;
    --color-fffefa: #0d0d0d;
    --color-f0f5ef: #111512;
    --color-eaf3ed: #131a16;
    --color-eaf0eb: #141c18;
    --color-f2f7f2: #161c18;
    --color-f0f2e8: #181a14;
    --color-eef4ef: #151a17;
    --color-edf0e8: #161814;
    --color-f4f5ef: #191a16;
    
    --color-19513e: #dce4de;
    --color-425644: #b0c0b4;
    --color-21694c: #8da679;
    --color-1d3628: #a8b8ae;
    --color-2d6147: #9caf61;
    --color-24533d: #839f60;
    --color-23583b: #7b8c80;
    --color-204832: #61704f;
    --color-174c36: #688143;
    --color-184a33: #78836a;
    
    --color-dce4de: #2a382f;
    --color-d9e3dc: #2c3a32;
    --color-d8e5db: #28362d;
    --color-d7decb: #323b2c;
    --color-d0e2d5: #203026;
    --color-ccdbd1: #1e2e24;
    --color-cdd5c7: #2a3528;
    --color-cce0d2: #1c2b22;
    
    --color-ffffff80: #00000080;
    --color-fffffff0: #121212f0;
    
    --shadow-0: 0 10px 40px #00000050;
    --shadow-1: 0 1px 4px #00000080;
    --shadow-2: 0 24px 100px #000000a0;
    --shadow-3: 0 2px 5px #00000060;
    --shadow-4: 0 2px 6px #00000070;
    --shadow-5: 0 2px 8px #00000090;
    --shadow-6: 0 3px 16px #00000080;
}
"""

if "html.dark" not in content:
    content += "\n" + dark_vars
    tokens_path.write_text(content, "utf-8")
    print("Dark mode tokens appended")
else:
    print("Dark mode already present")
