"""Run the newly approved C-only test AVD; stop before consuming the C reserve."""
from pathlib import Path
import json, os, shutil, subprocess, time

root=Path('C:/Users/Andrii/.codex/tmp/synera-android-local')
proof=Path(__file__).resolve().parents[1]/'artifacts/android-emulator-20261007'
assert json.loads((proof/'C_SETUP.json').read_text())['status']=='COPIED_HASH_VERIFIED_NOT_BOOTED'
assert shutil.disk_usage(root).free > 10*1024**3
env=os.environ.copy()
env.update(ANDROID_HOME=str(root/'sdk'),ANDROID_SDK_ROOT=str(root/'sdk'),
           ANDROID_USER_HOME=str(root/'user'),ANDROID_AVD_HOME=str(root/'avd'),
           TEMP=str(root/'tmp'),TMP=str(root/'tmp'))
adb=str(root/'sdk/platform-tools/adb.exe')
emulator=str(root/'sdk/emulator/emulator.exe')
serial='emulator-5580'
def run(args,timeout=30):
    return subprocess.run(args,env=env,capture_output=True,text=True,timeout=timeout)
devices=run([adb,'devices'])
assert devices.returncode==0 and serial not in devices.stdout, devices.stdout+devices.stderr
accel=run([emulator,'-accel-check'])
assert accel.returncode==0 and 'usable' in accel.stdout,accel.stdout+accel.stderr
(proof/'C_ACCEL.txt').write_text(accel.stdout)
args=[emulator,'-avd','Synera_Local_API36','-port','5580','-no-window','-no-audio',
      '-no-snapshot','-no-boot-anim','-no-metrics','-gpu','auto',
      '-camera-back','none','-camera-front','none','-cores','4','-memory','2048']
with (proof/'C_RUNTIME.txt').open('w',encoding='utf8') as log:
    p=subprocess.Popen(args,env=env,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
receipt={'pid':p.pid,'serial':serial,'root':str(root),'booted':False,'args':args}
(proof/'C_BOOT.json').write_text(json.dumps(receipt,indent=2))
print('Started C emulator '+str(p.pid),flush=True)
for _ in range(120):
    if shutil.disk_usage(root).free < 8*1024**3:
        run([adb,'-s',serial,'emu','kill'])
        raise SystemExit('C free-space reserve reached; own emulator stop requested')
    if p.poll() is not None: raise SystemExit('Emulator exited '+str(p.returncode))
    try: boot=run([adb,'-s',serial,'shell','getprop','sys.boot_completed'],10)
    except subprocess.TimeoutExpired:
        time.sleep(5);continue
    if boot.stdout.strip()=='1':
        receipt.update(booted=True,android=run([adb,'-s',serial,'shell','getprop','ro.build.version.release']).stdout.strip(),
                       display=run([adb,'-s',serial,'shell','wm','size']).stdout.strip(),freeBytes=shutil.disk_usage(root).free)
        (proof/'C_BOOT.json').write_text(json.dumps(receipt,indent=2))
        print(json.dumps(receipt),flush=True);break
    time.sleep(5)
else: raise SystemExit('Boot not accepted in bounded wait; inspect existing process before retry')
