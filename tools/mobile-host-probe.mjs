import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
for(const p of ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Users/Andrii/AppData/Local/ms-playwright']){
 try{const s=fs.lstatSync(p);console.log(JSON.stringify({path:p,symlink:s.isSymbolicLink(),target:s.isSymbolicLink()?fs.readlinkSync(p):null}));}catch(e){console.log(p+': '+e.code);}
}
for(const id of [48724,70932,55268,107884,90964]){
 console.log(execFileSync('tasklist',['/FI',`PID eq ${id}`],{encoding:'utf8',timeout:5000}));
}
