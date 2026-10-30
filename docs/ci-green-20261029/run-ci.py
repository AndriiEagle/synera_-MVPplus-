"""Local reproduction of the requested CI steps; Chrome/dependency adapters only."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
assert ROOT == Path('C:/sw/synera-design').resolve(), ROOT
NODE = ['node']
BROWSER = ['node', '--require', 'C:/sw/task1601-header-chrome.cjs']
STEPS = [
    ('01-main', NODE + ['--test', 'web_launch/*.test.mjs', 'web_launch/iceberg/*.test.mjs', 'neon/*.test.mjs', 'plan/v6/workflow/approval-boundary.test.mjs']),
    ('02-simulation', NODE + ['--import', 'file:///C:/Users/Andrii/.codex/outputs/synera-gilbert-readiness-20261021/dependency-resolution.mjs', '--test', 'tools/simulation-server.test.mjs', 'tools/simulation-runner.test.mjs']),
    ('03-pwa', NODE + ['--test', 'tests/pwa/*.test.mjs']),
    ('04-i18n', NODE + ['--test', 'tests/i18n_ch/*.test.mjs']),
    ('05-python', ['py', '-3', '-B', '-m', 'unittest', 'discover', '-s', 'tools', '-p', 'test_simulation_provider.py']),
    ('06-e2e', NODE + ['node_modules/@playwright/test/cli.js', 'test', '--config', 'C:/sw/pw-chrome.config.mjs', '--output', str(ROOT / 'docs/ci-green-20261029/e2e-output'), 'tests/browser-e2e.spec.mjs', 'tests/studio-e2e.spec.mjs', 'tests/privacy-e2e.spec.mjs', 'tests/graphics-e2e.spec.mjs', 'tests/graphics2-e2e.spec.mjs', 'tests/integrate-e2e.spec.mjs', 'tests/simulation-living.spec.mjs', 'tests/product-access.spec.mjs', 'tests/secure-e2e.spec.mjs', 'tests/live-ai.spec.mjs', 'tests/adapt-e2e.spec.mjs', 'tests/radar-e2e.spec.mjs', 'tests/secfix-e2e.spec.mjs']),
    ('07-header', BROWSER + ['tools/header-layout-acceptance-20261013.mjs']),
    ('08a-build', NODE + ['neon/build.mjs', 'dist-neon-ci']),
    ('08b-offline', BROWSER + ['tools/offline-shell-acceptance.mjs', '--candidate=web_launch/dist-neon-ci']),
    ('09-location', BROWSER + ['tools/location-browser-acceptance.mjs']),
    ('10-social', BROWSER + ['tools/case-social-draft-browser.mjs']),
    ('11-erasure', BROWSER + ['tools/profile-erasure-browser.mjs']),
    ('12-cookie', BROWSER + ['tools/audit-session-cookie-browser.mjs']),
    ('13-paid', BROWSER + ['tools/audit-paid-journey-browser.mjs']),
    ('14-simulation-browser', BROWSER + ['tools/simulation-browser-acceptance.mjs']),
    ('15-a11y', BROWSER + ['web_launch/a11y_audit.mjs']),
    ('16-android', NODE + ['--test', 'android/*.test.mjs']),
]

parser = argparse.ArgumentParser()
parser.add_argument('phase')
parser.add_argument('--only', nargs='*')
args = parser.parse_args()
out = (Path(__file__).resolve().parent / args.phase).resolve()
if out.parent != Path(__file__).resolve().parent:
    parser.error('phase must be one directory below this evidence directory')
out.mkdir(parents=True, exist_ok=True)
env = os.environ.copy()
env['PYTHONDONTWRITEBYTECODE'] = '1'
env['SYNERA_TEST_OUTPUT_ROOT'] = str(out / 'header')
env['SYNERA_CHROMIUM_EXECUTABLE'] = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
tmp = ROOT / 'docs/ci-green-20261029/tmp'
tmp.mkdir(exist_ok=True)
env['TEMP'] = env['TMP'] = str(tmp)
results = []
for name, command in STEPS:
    if args.only and name not in args.only:
        continue
    command = list(command)
    if name == '06-e2e':
        command[command.index('--output') + 1] = str(out / 'e2e-output')
    print(f'START {name}', flush=True)
    start = time.monotonic()
    log = out / f'{name}.txt'
    with log.open('w', encoding='utf-8') as handle:
        result = subprocess.run(command, cwd=ROOT, env=env, stdout=handle, stderr=subprocess.STDOUT)
    row = dict(step=name, exit=result.returncode, seconds=round(time.monotonic() - start, 2), command=command, log=str(log.relative_to(ROOT)))
    results.append(row)
    (out / 'results.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
    print(f'END {name} exit={result.returncode} seconds={row["seconds"]}', flush=True)
    if result.returncode:
        print('\n'.join(log.read_text(encoding='utf-8', errors='replace').splitlines()[-35:]), flush=True)
print(json.dumps(results, indent=2), flush=True)
raise SystemExit(1 if any(row['exit'] != 0 for row in results) else 0)
