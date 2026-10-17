// Gzip preserves original UTF-8 bytes. Digest detects corruption, not an author's identity.
const LIMIT = 1024 * 1024;
const encoder = new TextEncoder();
async function readBounded(stream) {
  const reader = stream.getReader(), chunks=[]; let total=0;
  try { while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>LIMIT)throw new Error('Архів більший за 1 MiB.');chunks.push(value);} }
  finally { await reader.cancel().catch(()=>{}); reader.releaseLock(); }
  const bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return bytes;
}
async function sha(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');}
function to64(bytes){let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);}
function from64(value){if(typeof value!=='string'||value.length>LIMIT*1.4||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))throw new Error('Неправильний формат архіву.');return Uint8Array.from(atob(value),c=>c.charCodeAt(0));}
export async function packArchive(json, compress=false) {
  if(typeof json!=='string')throw new Error('Потрібен JSON.');const raw=encoder.encode(json);if(raw.length>LIMIT)throw new Error('Архів більший за 1 MiB.');
  const payload=compress?await readBounded(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))):raw;
  const envelope={format:'synera-portable-envelope',version:1,encoding:compress?'gzip-base64':'utf8-base64',sha256:await sha(raw),payload:to64(payload)};
  return {json:JSON.stringify(envelope),originalBytes:raw.length,payloadBytes:payload.length,envelopeBytes:encoder.encode(JSON.stringify(envelope)).length};
}
export async function unpackArchive(json) {
  if(typeof json!=='string'||encoder.encode(json).length>LIMIT*1.5)throw new Error('Файл завеликий.');
  const value=JSON.parse(json);
  if(!value||Object.keys(value).sort().join(',')!=='encoding,format,payload,sha256,version'||value.format!=='synera-portable-envelope'||value.version!==1||!['utf8-base64','gzip-base64'].includes(value.encoding)||! /^[a-f0-9]{64}$/.test(value.sha256))throw new Error('Невідома версія архіву.');
  let bytes=from64(value.payload);if(value.encoding==='gzip-base64')bytes=await readBounded(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')));
  if(bytes.length>LIMIT||await sha(bytes)!==value.sha256)throw new Error('Цілісність файлу порушена.');
  return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
