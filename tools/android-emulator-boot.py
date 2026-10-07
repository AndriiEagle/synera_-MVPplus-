"""Boot only the isolated Synera AVD; no global settings or physical devices."""
from pathlib import Path
import json, os, subprocess, time

root = Path('D:/SyneraAndroid')
proof = Path(__file__).resolve().parents[1] / 'artifacts/android-emulator-20261007'
if (proof/'STORAGE_HOLD.json').exists():
    raise SystemExit('STORAGE_HOLD: reconcile the recorded USB write failure before any new AVD boot')
env = os.environ.copy()
env.update(ANDROID_HOME=str(root/'sdk'), ANDROID_SDK_ROOT=str(root/'sdk'),
           ANDROID_USER_HOME=str(root/'user'), ANDROID_AVD_HOME=str(root/'avd'),
           TEMP=str(root/'tmp'), TMP=str(root/'tmp'))
adb = str(root/'sdk/platform-tools/adb.exe')
emulator = str(root/'sdk/emulator/emulator.exe')
serial = 'emulator-5580'

def run(args, timeout=30):
    return subprocess.run(args, env=env, capture_output=True, text=True, timeout=timeout)

assert (root/'avd/Synera_API36.ini').is_file(), 'Create the approved AVD first'
devices = run([adb, 'devices'])
assert devices.returncode == 0, devices.stderr
assert serial not in devices.stdout, 'Existing emulator: reconcile instead of duplicating'
accel = run([emulator, '-accel-check'])
assert accel.returncode == 0 and 'usable' in accel.stdout, accel.stdout + accel.stderr
args = [emulator, '-avd', 'Synera_API36', '-port', '5580', '-no-window',
        '-no-audio', '-no-snapshot', '-camera-back', 'none', '-camera-front', 'none',
        '-cores', '2', '-memory', '2048']
with (proof/'emulator-runtime.txt').open('w', encoding='utf8') as log:
    process = subprocess.Popen(args, env=env, stdout=log, stderr=subprocess.STDOUT,
                               creationflags=subprocess.CREATE_NO_WINDOW)
receipt = {'pid': process.pid, 'serial': serial, 'args': args, 'booted': False}
(proof/'BOOT.json').write_text(json.dumps(receipt, indent=2))
print('Started owned emulator PID ' + str(process.pid), flush=True)
deadline = time.monotonic() + 600
while time.monotonic() < deadline:
    if process.poll() is not None:
        raise SystemExit('Emulator exited: ' + str(process.returncode))
    state = run([adb, '-s', serial, 'shell', 'getprop', 'sys.boot_completed'])
    if state.stdout.strip() == '1':
        receipt.update(booted=True, android=run([adb, '-s', serial, 'shell', 'getprop', 'ro.build.version.release']).stdout.strip(),
                       display=run([adb, '-s', serial, 'shell', 'wm', 'size']).stdout.strip())
        (proof/'BOOT.json').write_text(json.dumps(receipt, indent=2))
        print(json.dumps(receipt), flush=True)
        break
    time.sleep(5)
else:
    raise SystemExit('Boot timeout: preserve running emulator and inspect BOOT.json before retry')
