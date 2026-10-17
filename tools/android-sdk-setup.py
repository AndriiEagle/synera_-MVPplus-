"""Finite, explicit SDK actions inside the user's approved D:/SyneraAndroid."""
from pathlib import Path
import os, subprocess, sys, json

ROOT=Path('D:/SyneraAndroid')
PROOF=Path(__file__).resolve().parents[1]/'artifacts/android-emulator-20261007'
ENV=os.environ.copy()
ENV.update(JAVA_HOME=str(ROOT/'android-studio/jbr'),ANDROID_HOME=str(ROOT/'sdk'),ANDROID_SDK_ROOT=str(ROOT/'sdk'),ANDROID_USER_HOME=str(ROOT/'user'),ANDROID_AVD_HOME=str(ROOT/'avd'),JAVA_TOOL_OPTIONS='-Duser.home=D:/SyneraAndroid/user')
ENV['PATH']=str(ROOT/'android-studio/jbr/bin')+os.pathsep+ENV.get('PATH','')
ENV['TEMP']=ENV['TMP']=str(ROOT/'tmp')
for p in [ROOT/'tmp',ROOT/'user',ROOT/'avd',ROOT/'sdk',PROOF]:p.mkdir(exist_ok=True,parents=True)
assert json.loads((ROOT/'download-receipt.json').read_text())['global_path_changed'] is False
action=sys.argv[1]
sdk=ROOT/'sdk-tools/cmdline-tools/bin/sdkmanager.bat'
if action=='list':
    cmd=[str(sdk),'--sdk_root='+str(ROOT/'sdk'),'--list','--channel=0']; data=''; limit=300
elif action=='install':
    packages=['platform-tools','emulator','system-images;android-36;google_apis_playstore;x86_64']
    cmd=[str(sdk),'--sdk_root='+str(ROOT/'sdk'),'--install',*packages,'--channel=0']; data='y\n'*12; limit=1800
elif action=='accel':
    cmd=[str(ROOT/'sdk/emulator/emulator.exe'),'-accel-check']; data=''; limit=60
elif action=='devices':
    cmd=[str(ROOT/'sdk-tools/cmdline-tools/bin/avdmanager.bat'),'list','device']; data=''; limit=60
elif action=='create':
    assert not (ROOT/'avd/Synera_API36.ini').exists(),'AVD already exists; inspect before retry'
    cmd=[str(ROOT/'sdk-tools/cmdline-tools/bin/avdmanager.bat'),'create','avd','-n','Synera_API36','-k','system-images;android-36;google_apis_playstore;x86_64','-d','pixel_7','-p',str(ROOT/'avd/Synera_API36.avd')]; data='no\n'; limit=120
else:raise SystemExit('Unknown action')
print('Action '+action+'; process-local environment; D: only',flush=True)
log=PROOF/(action+'.txt')
with log.open('w',encoding='utf8') as out:
    result=subprocess.run(cmd,input=data,text=True,stdout=out,stderr=subprocess.STDOUT,env=ENV,timeout=limit)
text=log.read_text(encoding='utf8',errors='replace')
if action=='list':
    print('\n'.join(s for s in text.splitlines() if any(x in s for x in ['platform-tools ','emulator ','system-images;android-36;google_apis_playstore;x86_64'])))
elif action=='devices':print('\n'.join(s for s in text.splitlines() if 'pixel_7' in s or 'Pixel 7' in s))
else:print(text[-5000:])
print('Exit '+str(result.returncode),flush=True)
raise SystemExit(result.returncode)
