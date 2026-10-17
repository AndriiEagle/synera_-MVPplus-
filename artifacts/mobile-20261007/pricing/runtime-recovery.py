import ctypes as c
from ctypes import wintypes as w
import json
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
TMP = Path('C:/Users/Andrii/.codex/tmp/synera-mobile-pricing')
for p in [Path('C:/Users/Andrii/.codex/tmp'), Path('C:/Program Files/Google/Chrome/Application/chrome.exe')]:
    assert not p.is_symlink() and not os.path.isjunction(p), str(p)
TMP.mkdir(exist_ok=True)
assert not TMP.is_symlink() and not os.path.isjunction(TMP)
print(json.dumps({'temp': str(TMP), 'temp_link': False, 'chrome_link': False}))

class PROCESSENTRY32W(c.Structure):
    _fields_ = [('dwSize',w.DWORD),('cntUsage',w.DWORD),('th32ProcessID',w.DWORD),('th32DefaultHeapID',c.c_size_t),('th32ModuleID',w.DWORD),('cntThreads',w.DWORD),('th32ParentProcessID',w.DWORD),('pcPriClassBase',w.LONG),('dwFlags',w.DWORD),('szExeFile',w.WCHAR*260)]
class UNICODE_STRING(c.Structure):
    _fields_ = [('Length',w.USHORT),('MaximumLength',w.USHORT),('Buffer',c.c_void_p)]
k = c.WinDLL('kernel32', use_last_error=True)
n = c.WinDLL('ntdll')
k.CreateToolhelp32Snapshot.restype = w.HANDLE
k.OpenProcess.restype = w.HANDLE
k.OpenProcess.argtypes = [w.DWORD,w.BOOL,w.DWORD]
k.CloseHandle.argtypes = [w.HANDLE]
k.Process32FirstW.argtypes = [w.HANDLE,c.POINTER(PROCESSENTRY32W)]
k.Process32NextW.argtypes = [w.HANDLE,c.POINTER(PROCESSENTRY32W)]
k.TerminateProcess.argtypes = [w.HANDLE,w.UINT]
n.NtQueryInformationProcess.argtypes = [w.HANDLE,w.ULONG,c.c_void_p,w.ULONG,c.POINTER(w.ULONG)]
snap = k.CreateToolhelp32Snapshot(2,0)
entry = PROCESSENTRY32W(); entry.dwSize = c.sizeof(entry)
rows=[]
query_statuses={}
owned_chrome=[]
ok=k.Process32FirstW(snap,c.byref(entry))
while ok:
    if entry.szExeFile.lower() in ['node.exe','chrome.exe']:
        handle=k.OpenProcess(0x0410,False,entry.th32ProcessID)
        if handle:
            size=w.ULONG()
            n.NtQueryInformationProcess(handle,60,None,0,c.byref(size))
            if 0<size.value<65536:
                buf=c.create_string_buffer(size.value)
                query_status=n.NtQueryInformationProcess(handle,60,buf,size.value,c.byref(size))
                query_statuses[str(query_status)]=query_statuses.get(str(query_status),0)+1
                if query_status==0:
                    u=UNICODE_STRING.from_buffer(buf)
                    command=c.wstring_at(u.Buffer,u.Length//2)
                    # Only this task's exact abandoned runner; no broad node/browser cleanup.
                    own_runner = entry.szExeFile.lower()=='node.exe' and 'artifacts/mobile-20261007/pricing/browser-acceptance.mjs' in command
                    own_browser = entry.szExeFile.lower()=='chrome.exe' and 'synera-mobile-pricing' in command and '--user-data-dir=' in command
                    if own_runner or own_browser:
                        row={'pid':entry.th32ProcessID,'parent_pid':entry.th32ParentProcessID,'command':command}
                        if '--stop-owned' in sys.argv:
                            terminator=k.OpenProcess(1,False,entry.th32ProcessID)
                            row['terminated']=bool(terminator and k.TerminateProcess(terminator,1))
                            if terminator:k.CloseHandle(terminator)
                        rows.append(row)
            k.CloseHandle(handle)
    ok=k.Process32NextW(snap,c.byref(entry))
k.CloseHandle(snap)
result={'owned_runners':rows,'query_statuses':query_statuses,'temp':str(TMP),'chrome':'C:/Program Files/Google/Chrome/Application/chrome.exe'}
print(json.dumps(result,ensure_ascii=False))
(ROOT/('RUNTIME_RECOVERY.json' if '--stop-owned' in sys.argv else 'RUNTIME_AUDIT.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
