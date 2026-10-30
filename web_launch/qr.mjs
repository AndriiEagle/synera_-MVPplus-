/* QR Model 2, byte mode, M, versions 1–10. Adapted from Project Nayuki.
 * Copyright (c) Project Nayuki. MIT License:
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to
 * do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE. https://www.nayuki.io/page/qr-code-generator-library
 */
const ECC = [0,10,16,26,18,24,16,18,22,22,26];
const BLOCKS = [0,1,1,1,2,2,4,4,4,5,5];
function rawModules(v) {
  let n = (16 * v + 128) * v + 64;
  if (v >= 2) { const a = Math.floor(v / 7) + 2; n -= (25 * a - 10) * a - 55; if (v >= 7) n -= 36; }
  return n;
}
function multiply(x, y) {
  let result = 0;
  for (let i = 7; i >= 0; i--) result = ((result << 1) ^ ((result >>> 7) * 0x11d)) ^ (((y >>> i) & 1) * x);
  return result;
}
function remainder(data, degree) {
  const divisor = Array(degree).fill(0); divisor[degree - 1] = 1;
  for (let i = 0, root = 1; i < degree; i++, root = multiply(root, 2)) {
    for (let j = 0; j < degree; j++) { divisor[j] = multiply(divisor[j], root); if (j + 1 < degree) divisor[j] ^= divisor[j + 1]; }
  }
  const result = Array(degree).fill(0);
  for (const byte of data) { const factor = byte ^ result.shift(); result.push(0); for (let i = 0; i < degree; i++) result[i] ^= multiply(divisor[i], factor); }
  return result;
}
function interleave(data, version) {
  const count = BLOCKS[version], ecc = ECC[version], total = Math.floor(rawModules(version) / 8);
  const short = Math.floor(total / count), shortCount = count - total % count, blocks = [];
  for (let i = 0, offset = 0; i < count; i++) {
    const length = short - ecc + (i < shortCount ? 0 : 1), part = data.slice(offset, offset + length);
    offset += length; blocks.push({ data: part, ecc: remainder(part, ecc) });
  }
  const result = [];
  for (let i = 0; i <= short - ecc; i++) for (const b of blocks) if (i < b.data.length) result.push(b.data[i]);
  for (let i = 0; i < ecc; i++) for (const b of blocks) result.push(b.ecc[i]);
  return result;
}
const MASK = [
  (x,y)=>(x+y)%2===0, (x,y)=>y%2===0, x=>x%3===0, (x,y)=>(x+y)%3===0,
  (x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0, (x,y)=>x*y%2+x*y%3===0,
  (x,y)=>(x*y%2+x*y%3)%2===0, (x,y)=>((x+y)%2+x*y%3)%2===0,
];
function penalty(m) {
  const n = m.length; let score = 0, dark = 0;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    dark += Number(m[y][x]);
    if (x && y && m[y][x] === m[y][x-1] && m[y][x] === m[y-1][x] && m[y][x] === m[y-1][x-1]) score += 3;
  }
  for (let i = 0; i < n; i++) for (const row of [m[i], m.map(r => r[i])]) {
    let run = 1;
    for (let j = 1; j < n; j++) { if (row[j] === row[j-1]) { run++; if (run === 5) score += 3; else if (run > 5) score++; } else run = 1; }
    const line = '0000' + row.map(Number).join('') + '0000';
    for (let j = 0; j <= line.length - 11; j++) if (['00001011101','10111010000'].includes(line.slice(j,j+11))) score += 40;
  }
  return score + Math.floor(Math.abs(dark * 20 - n * n * 10) / (n * n)) * 10;
}

export function encodeQR(text) {
  if (typeof text !== 'string') throw new TypeError('QR payload must be a string');
  const bytes = new TextEncoder().encode(text);
  let version = 1;
  for (; version <= 10; version++) {
    const capacity = Math.floor(rawModules(version) / 8) - ECC[version] * BLOCKS[version];
    if (4 + (version < 10 ? 8 : 16) + bytes.length * 8 <= capacity * 8) break;
  }
  if (version > 10) throw new RangeError('QR payload exceeds version 10-M');
  const bits = [], append = (value,count) => { for (let i = count - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
  const capacity = Math.floor(rawModules(version) / 8) - ECC[version] * BLOCKS[version];
  append(4,4); append(bytes.length,version < 10 ? 8 : 16); for (const byte of bytes) append(byte,8);
  append(0,Math.min(4,capacity * 8 - bits.length)); while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i,i+8).reduce((a,b)=>(a<<1)|b,0));
  for (let pad = 0; data.length < capacity; pad++) data.push(pad % 2 ? 0x11 : 0xec);
  const codewords = interleave(data,version), n = version * 4 + 17;
  const base = Array.from({length:n},()=>Array(n).fill(false)), reserved = base.map(r=>r.slice());
  const set = (x,y,value) => { base[y][x] = Boolean(value); reserved[y][x] = true; };
  for (let i = 0; i < n; i++) { set(6,i,i%2===0); set(i,6,i%2===0); }
  for (const [cx,cy] of [[3,3],[n-4,3],[3,n-4]]) for (let dy=-4;dy<=4;dy++) for(let dx=-4;dx<=4;dx++) {
    const x=cx+dx,y=cy+dy;
    if(x>=0&&y>=0&&x<n&&y<n)set(x,y,![2,4].includes(Math.max(Math.abs(dx),Math.abs(dy))));
  }
  if(version>=2) {
    const count=Math.floor(version/7)+2,step=Math.floor((version*4+count*2+1)/(count*2-2))*2, positions=[6];
    for(let pos=n-7;positions.length<count;pos-=step)positions.splice(1,0,pos);
    for(let i=0;i<count;i++)for(let j=0;j<count;j++) {
      if((i===0&&j===0)||(i===0&&j===count-1)||(i===count-1&&j===0))continue;
      for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(positions[i]+dx,positions[j]+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);
    }
  }
  function format(m,mask) {
    let r=mask;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);
    const value=((mask<<10)|r)^0x5412, bit=i=>Boolean((value>>>i)&1);
    for(let i=0;i<=5;i++)m[i][8]=bit(i);
    m[7][8]=bit(6);m[8][8]=bit(7);m[8][7]=bit(8);
    for(let i=9;i<15;i++)m[8][14-i]=bit(i);
    for(let i=0;i<8;i++)m[8][n-1-i]=bit(i);
    for(let i=8;i<15;i++)m[n-15+i][8]=bit(i);
    m[n-8][8]=true;
  }
  format(base,0);
  for(let i=0;i<9;i++) { if(i!==6){reserved[i][8]=reserved[8][i]=true;} }
  for(let i=0;i<8;i++){reserved[8][n-1-i]=true;reserved[n-1-i][8]=true;}
  if(version>=7) {
    let r=version;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1f25);
    const value=(version<<12)|r;
    for(let i=0;i<18;i++){const a=n-11+i%3,b=Math.floor(i/3);set(a,b,(value>>>i)&1);set(b,a,(value>>>i)&1);}
  }
  for(let right=n-1,index=0;right>=1;right-=2) {
    if(right===6)right=5;
    for(let vertical=0;vertical<n;vertical++)for(let j=0;j<2;j++) {
      const x=right-j,y=((right+1)&2)===0?n-1-vertical:vertical;
      if(!reserved[y][x]){base[y][x]=index<codewords.length*8&&Boolean((codewords[index>>>3]>>>(7-(index&7)))&1);index++;}
    }
  }
  let modules,mask=0,best=Infinity;
  for(let candidate=0;candidate<8;candidate++) {
    const m=base.map((row,y)=>row.map((cell,x)=>cell!==(!reserved[y][x]&&MASK[candidate](x,y))));
    format(m,candidate);const score=penalty(m);
    if(score<best){best=score;modules=m;mask=candidate;}
  }
  return {version,mask,modules};
}

export function qrSVG(text) {
  const {modules}=encodeQR(text),size=modules.length+8,paths=[];
  modules.forEach((row,y)=>row.forEach((dark,x)=>{if(dark)paths.push(`M${x+4},${y+4}h1v1h-1z`);}));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" aria-hidden="true"><path fill="#fff" d="M0 0h${size}v${size}H0z"/><path fill="#000" d="${paths.join('')}"/></svg>`;
}
