import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { encodeQR, qrSVG } from './qr.mjs';

test('preview URL is byte-mode M version 3 (29 modules)', () => {
  const qr = encodeQR('https://synera-phone-preview.vercel.app/');
  assert.equal(qr.version, 3);
  assert.equal(qr.modules.length, 29);
  assert.equal(createHash('sha256').update(qr.modules.map(r=>r.map(Number).join('')).join('\n')).digest('hex'),'791a789f3246d2a7485eaea6907984cc676d6045cf5f7ca7f46cc1fe246b67ba');
  assert.ok(qr.modules.every(row => row.length === 29 && row.every(cell => typeof cell === 'boolean')));
});

// Independent byte/M vectors: Project Nayuki qrcodegen.js, SHA256
// 2511bc17f40a3c41d4a0578995db956b38997334d3d20113a5d4dc5c49c69480.
test('all ten versions match independent Reed–Solomon/interleaving/matrix vectors',()=>{
  const vectors=[
    [0,3,'c30ac51df3031a0d4219aac58b58f0b82efbdb32354c067967ff9db149b16f61'],
    [15,0,'be1f4b93f39e9f2b2078c3ee1b75b380b920cf717fadc9593dca07aa7f0a32e0'],
    [27,2,'26ca721a90031f183fce0a0d53822e2e653349363900c4892064ca88290bc964'],
    [43,2,'1f4d2e04b148eb84316021d2c0135fc89d5177b03bb7e76a4190575baf7dc199'],
    [63,2,'fcc8278569d63b26ffb606f813853af872249d8da212fdd5a580b766bfea7146'],
    [85,0,'8b03df5e80a2420b68909e8417c061142f28cac4e8126a14980b3910754b7488'],
    [107,2,'f461d081f0015b88a3390a99d1ccdb1048f1451cdd5d5f11ef0b9a67f63883bb'],
    [123,2,'5926f6dcd6e9cb95c6da80988660cb86108d4c0dae2f62dc3e81b7c81f476e98'],
    [153,0,'591bbea64aed3057fdf779a510b3e83bc4cf9a26210f8a24c185eee6827d3934'],
    [181,2,'6f87f0f4e0a3a51093cf8a62ff8b28bb46b0a7c7756a60d553f619c8139228b0'],
  ];
  vectors.forEach(([length,mask,hash],i)=>{
    const qr=encodeQR('x'.repeat(length));assert.equal(qr.version,i+1);assert.equal(qr.mask,mask);
    assert.equal(createHash('sha256').update(qr.modules.map(r=>r.map(Number).join('')).join('\n')).digest('hex'),hash);
  });
});

test('finder, separators, timing, dark module and M format BCH survive masking', () => {
  for (const length of [0, 15, 27, 43, 63, 85, 107, 123, 153, 181]) {
    const { modules: m, mask } = encodeQR('x'.repeat(length)), n = m.length;
    for (const [cx, cy] of [[3, 3], [n - 4, 3], [3, n - 4]]) {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x >= 0 && y >= 0 && x < n && y < n) assert.equal(m[y][x], ![2, 4].includes(Math.max(Math.abs(dx), Math.abs(dy))));
      }
    }
    for (let i = 8; i < n - 8; i++) { assert.equal(m[6][i], i % 2 === 0); assert.equal(m[i][6], i % 2 === 0); }
    let remainder = mask;
    for (let i = 0; i < 10; i++) remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
    const bits = ((mask << 10) | remainder) ^ 0x5412;
    const positions = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
    positions.forEach(([x,y], i) => assert.equal(m[y][x], Boolean((bits >>> i) & 1)));
    assert.equal(m[n - 8][8], true);
  }
});

test('byte capacities 1–10, UTF-8, overflow and SVG quiet zone', () => {
  const capacity = [14,26,42,62,84,106,122,152,180,213];
  capacity.forEach((n,i) => assert.equal(encodeQR('x'.repeat(n)).version, i + 1));
  assert.equal(encodeQR('é'.repeat(7)).version, 1);
  assert.equal(encodeQR('é'.repeat(8)).version, 2);
  assert.throws(() => encodeQR('x'.repeat(214)), RangeError);
  assert.throws(() => encodeQR(null), TypeError);
  const svg = qrSVG('test');
  assert.match(svg, /viewBox="0 0 29 29"/);
  assert.match(svg, /shape-rendering="crispEdges"/);
  assert.doesNotMatch(qrSVG('<script>alert(1)</script>'), /<script>/);
});
