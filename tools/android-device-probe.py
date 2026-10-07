"""Bounded ADB probes against only the Synera emulator, never attached phones."""
from pathlib import Path
import subprocess, sys

adb = 'C:/Users/Andrii/.codex/tmp/synera-android-local/sdk/platform-tools/adb.exe'
target = [adb, '-s', 'emulator-5580']
proof = Path(__file__).resolve().parents[1] / 'artifacts/android-emulator-20261007'
action = sys.argv[1]
if action == 'capture':
    label = sys.argv[2]
    assert label.replace('-', '').isalnum()
    result = subprocess.run(target+['exec-out', 'screencap', '-p'], capture_output=True, timeout=45, check=True)
    assert result.stdout.startswith(b'\x89PNG'), result.stderr
    (proof/(label+'.png')).write_bytes(result.stdout)
    subprocess.run(target+['shell', 'uiautomator', 'dump', '/sdcard/synera-window.xml'], timeout=45, check=True)
    result = subprocess.run(target+['exec-out', 'cat', '/sdcard/synera-window.xml'], capture_output=True, timeout=30, check=True)
    (proof/(label+'.xml')).write_bytes(result.stdout)
    print(result.stdout.decode('utf8', errors='replace'))
elif action == 'shell':
    subprocess.run(target+['shell', *sys.argv[2:]], timeout=45, check=True)
else:
    raise SystemExit('Unknown probe')
