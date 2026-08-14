#!/usr/bin/env node
/**
 * Gerador de QR Code puro (byte mode) — sem dependencias externas.
 * Implementa ISO/IEC 18004: GF(256), Reed-Solomon, mascaras, penalidades.
 * Saidas: SVG vetorial + matriz .txt (para rasterizar em qualquer resolucao).
 */

// ───────────────────────── GF(256) ─────────────────────────
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x; LOG[x] = i;
    x <<= 1; if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
const gmul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];

function rsGenPoly(deg) {
  let poly = [1];
  for (let i = 0; i < deg; i++) {
    const nx = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      nx[j] ^= poly[j];
      nx[j + 1] ^= gmul(poly[j], EXP[i]);
    }
    poly = nx;
  }
  return poly;
}

function rsEncode(data, ecLen) {
  const gen = rsGenPoly(ecLen);
  const res = new Array(ecLen).fill(0);
  for (const b of data) {
    const factor = b ^ res[0];
    res.shift(); res.push(0);
    for (let i = 0; i < ecLen; i++) res[i] ^= gmul(gen[i + 1], factor);
  }
  return res;
}

// ─────────────────── Tabelas de versao/ECC ───────────────────
// [ecPorBloco, blocosG1, dadosG1, blocosG2, dadosG2]
const ECB = {
  1:  { L:[7,1,19,0,0],   M:[10,1,16,0,0],  Q:[13,1,13,0,0],  H:[17,1,9,0,0] },
  2:  { L:[10,1,34,0,0],  M:[16,1,28,0,0],  Q:[22,1,22,0,0],  H:[28,1,16,0,0] },
  3:  { L:[15,1,55,0,0],  M:[26,1,44,0,0],  Q:[18,2,17,0,0],  H:[22,2,13,0,0] },
  4:  { L:[20,1,80,0,0],  M:[18,2,32,0,0],  Q:[26,2,24,0,0],  H:[16,4,9,0,0] },
  5:  { L:[26,1,108,0,0], M:[24,2,43,0,0],  Q:[18,2,15,2,16], H:[22,2,11,2,12] },
  6:  { L:[18,2,68,0,0],  M:[16,4,27,0,0],  Q:[24,4,19,0,0],  H:[28,4,15,0,0] },
  7:  { L:[20,2,78,0,0],  M:[18,4,31,0,0],  Q:[18,2,14,4,15], H:[26,4,13,1,14] },
  8:  { L:[24,2,97,0,0],  M:[22,2,38,2,39], Q:[22,4,18,2,19], H:[26,4,14,2,15] },
  9:  { L:[30,2,116,0,0], M:[22,3,36,2,37], Q:[20,4,16,4,17], H:[24,4,12,4,13] },
  10: { L:[18,2,68,2,69], M:[26,4,43,1,44], Q:[24,6,19,2,20], H:[28,6,15,2,16] },
  11: { L:[20,4,81,0,0],  M:[30,1,50,4,51], Q:[28,4,22,4,23], H:[24,3,12,8,13] },
  12: { L:[24,2,92,2,93], M:[22,6,36,2,37], Q:[26,4,20,6,21], H:[28,7,14,4,15] },
};

const ALIGN = {
  1:[], 2:[6,18], 3:[6,22], 4:[6,26], 5:[6,30], 6:[6,34],
  7:[6,22,38], 8:[6,24,42], 9:[6,26,46], 10:[6,28,50], 11:[6,30,54], 12:[6,32,58],
};

const ECL_BITS = { L:0b01, M:0b00, Q:0b11, H:0b10 };

function capacityBytes(version, ecl) {
  const [ec, b1, d1, b2, d2] = ECB[version][ecl];
  const dataCodewords = b1 * d1 + b2 * d2;
  const countBits = version <= 9 ? 8 : 16;
  return dataCodewords - 2 - (countBits === 16 ? 1 : 0);
}

function pickVersion(byteLen, ecl) {
  for (let v = 1; v <= 12; v++) if (capacityBytes(v, ecl) >= byteLen) return v;
  throw new Error(`Texto grande demais para v1-12 no nivel ${ecl}`);
}

// ─────────────────── Codificacao de dados ───────────────────
function encodeData(bytes, version, ecl) {
  const [ecLen, b1, d1, b2, d2] = ECB[version][ecl];
  const totalData = b1 * d1 + b2 * d2;
  const bits = [];
  const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); };

  push(0b0100, 4);                                  // modo byte
  push(bytes.length, version <= 9 ? 8 : 16);        // contador
  for (const b of bytes) push(b, 8);                // payload

  const cap = totalData * 8;
  for (let i = 0; i < 4 && bits.length < cap; i++) bits.push(0);   // terminador
  while (bits.length % 8 !== 0) bits.push(0);                       // alinha byte

  const cw = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0; for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    cw.push(v);
  }
  const PAD = [0xec, 0x11];
  let p = 0; while (cw.length < totalData) cw.push(PAD[p++ % 2]);

  // divide em blocos
  const blocks = [];
  let off = 0;
  for (let i = 0; i < b1; i++) { blocks.push(cw.slice(off, off + d1)); off += d1; }
  for (let i = 0; i < b2; i++) { blocks.push(cw.slice(off, off + d2)); off += d2; }
  const ecBlocks = blocks.map(b => rsEncode(b, ecLen));

  // intercala
  const out = [];
  const maxD = Math.max(d1, d2 || 0);
  for (let i = 0; i < maxD; i++) for (const b of blocks) if (i < b.length) out.push(b[i]);
  for (let i = 0; i < ecLen; i++) for (const e of ecBlocks) out.push(e[i]);
  return out;
}

// ─────────────────── Construcao da matriz ───────────────────
function buildMatrix(version, ecl, codewords) {
  const size = 17 + version * 4;
  const m = Array.from({ length: size }, () => new Array(size).fill(null));
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));

  const setF = (r, c, v) => { if (r >= 0 && r < size && c >= 0 && c < size) { m[r][c] = v; reserved[r][c] = true; } };

  // finders + separadores
  for (const [br, bc] of [[0,0],[0,size-7],[size-7,0]]) {
    for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
      const inRing = (r >= 0 && r <= 6 && c >= 0 && c <= 6) &&
        (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
      setF(br + r, bc + c, inRing ? 1 : 0);
    }
  }

  // timing
  for (let i = 8; i < size - 8; i++) { setF(6, i, i % 2 === 0 ? 1 : 0); setF(i, 6, i % 2 === 0 ? 1 : 0); }

  // alinhamento
  const ac = ALIGN[version];
  for (const r of ac) for (const c of ac) {
    if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8)) continue;
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      const ring = Math.max(Math.abs(dr), Math.abs(dc));
      setF(r + dr, c + dc, (ring === 1) ? 0 : 1);
    }
  }

  // modulo escuro
  setF(size - 8, 8, 1);

  // reserva area de formato
  for (let i = 0; i < 9; i++) { if (m[8][i] === null) { reserved[8][i] = true; m[8][i] = 0; } if (m[i][8] === null) { reserved[i][8] = true; m[i][8] = 0; } }
  for (let i = 0; i < 8; i++) { if (m[8][size-1-i] === null) { reserved[8][size-1-i] = true; m[8][size-1-i] = 0; } if (m[size-1-i][8] === null) { reserved[size-1-i][8] = true; m[size-1-i][8] = 0; } }
  // reserva area de versao (v>=7)
  if (version >= 7) {
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
      reserved[size - 11 + j][i] = true; m[size - 11 + j][i] = 0;
      reserved[i][size - 11 + j] = true; m[i][size - 11 + j] = 0;
    }
  }

  // placa dados em zigue-zague
  let bitIdx = 0;
  const totalBits = codewords.length * 8;
  const getBit = i => i < totalBits ? (codewords[i >> 3] >> (7 - (i & 7))) & 1 : 0;
  let up = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let k = 0; k < size; k++) {
      const row = up ? size - 1 - k : k;
      for (const c of [col, col - 1]) {
        if (!reserved[row][c]) { m[row][c] = getBit(bitIdx++); }
      }
    }
    up = !up;
  }
  return { m, reserved, size };
}

// ─────────────────── Mascaras + penalidades ───────────────────
const MASKS = [
  (r,c) => (r + c) % 2 === 0,
  (r,c) => r % 2 === 0,
  (r,c) => c % 3 === 0,
  (r,c) => (r + c) % 3 === 0,
  (r,c) => (Math.floor(r/2) + Math.floor(c/3)) % 2 === 0,
  (r,c) => ((r*c) % 2) + ((r*c) % 3) === 0,
  (r,c) => (((r*c) % 2) + ((r*c) % 3)) % 2 === 0,
  (r,c) => (((r+c) % 2) + ((r*c) % 3)) % 2 === 0,
];

function penalty(m, size) {
  let p = 0;
  // regra 1: sequencias
  for (let i = 0; i < size; i++) {
    for (const isRow of [true, false]) {
      let run = 1, prev = isRow ? m[i][0] : m[0][i];
      for (let j = 1; j < size; j++) {
        const v = isRow ? m[i][j] : m[j][i];
        if (v === prev) run++;
        else { if (run >= 5) p += 3 + (run - 5); run = 1; prev = v; }
      }
      if (run >= 5) p += 3 + (run - 5);
    }
  }
  // regra 2: blocos 2x2
  for (let r = 0; r < size - 1; r++) for (let c = 0; c < size - 1; c++) {
    const v = m[r][c];
    if (v === m[r][c+1] && v === m[r+1][c] && v === m[r+1][c+1]) p += 3;
  }
  // regra 3: padrao 1:1:3:1:1 com quiet
  const P1 = [1,0,1,1,1,0,1,0,0,0,0], P2 = [0,0,0,0,1,0,1,1,1,0,1];
  for (let i = 0; i < size; i++) for (let j = 0; j <= size - 11; j++) {
    let r1 = true, r2 = true, c1 = true, c2 = true;
    for (let k = 0; k < 11; k++) {
      if (m[i][j+k] !== P1[k]) r1 = false;
      if (m[i][j+k] !== P2[k]) r2 = false;
      if (m[j+k][i] !== P1[k]) c1 = false;
      if (m[j+k][i] !== P2[k]) c2 = false;
    }
    if (r1) p += 40; if (r2) p += 40; if (c1) p += 40; if (c2) p += 40;
  }
  // regra 4: proporcao escura
  let dark = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (m[r][c]) dark++;
  const pct = (dark * 100) / (size * size);
  p += Math.floor(Math.abs(pct - 50) / 5) * 10;
  return p;
}

function formatBits(ecl, mask) {
  let data = (ECL_BITS[ecl] << 3) | mask;
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) if ((rem >> i) & 1) rem ^= 0b10100110111 << (i - 10);
  return ((data << 10) | rem) ^ 0b101010000010010;
}

function versionBits(version) {
  let rem = version << 12;
  for (let i = 17; i >= 12; i--) if ((rem >> i) & 1) rem ^= 0b1111100100101 << (i - 12);
  return (version << 12) | rem;
}

function applyBest({ m, reserved, size }, version, ecl) {
  let best = null;
  for (let mask = 0; mask < 8; mask++) {
    const t = m.map(r => r.slice());
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++)
      if (!reserved[r][c] && MASKS[mask](r, c)) t[r][c] ^= 1;

    // formato
    // Format info — 15 bits, LSB primeiro, conforme ISO/IEC 18004 fig. 25.
    // Copia A percorre a COLUNA 8 de cima para baixo; copia B percorre a
    // LINHA 8 da direita para a esquerda. (Estavam invertidas: os bits iam
    // na ordem espelhada, o que quebrava a leitura em qualquer app real.)
    const f = formatBits(ecl, mask);
    for (let i = 0; i < 15; i++) {
      const bit = (f >> i) & 1;

      // copia A — coluna 8 (pula o timing em (6,8))
      if (i < 6)      t[i][8] = bit;
      else if (i < 8) t[i + 1][8] = bit;
      else            t[size - 15 + i][8] = bit;

      // copia B — linha 8 (pula o timing em (8,6))
      if (i < 8)        t[8][size - 1 - i] = bit;
      else if (i === 8) t[8][7] = bit;
      else              t[8][14 - i] = bit;
    }
    t[size - 8][8] = 1;

    // versao
    if (version >= 7) {
      const v = versionBits(version);
      for (let i = 0; i < 18; i++) {
        const bit = (v >> i) & 1;
        const r = Math.floor(i / 3), c = i % 3;
        t[size - 11 + c][r] = bit;
        t[r][size - 11 + c] = bit;
      }
    }

    const p = penalty(t, size);
    if (!best || p < best.p) best = { p, mask, t };
  }
  return best;
}

// ─────────────────── API ───────────────────
function makeQR(text, ecl = 'H', forceVersion = null) {
  const bytes = Array.from(Buffer.from(text, 'utf8'));
  const version = forceVersion || pickVersion(bytes.length, ecl);
  const cw = encodeData(bytes, version, ecl);
  const base = buildMatrix(version, ecl, cw);
  const best = applyBest(base, version, ecl);
  return { matrix: best.t, size: base.size, version, ecl, mask: best.mask, penalty: best.p, bytes: bytes.length };
}

// ─────────────────── SVG ───────────────────
function toSVG(qr, { quiet = 4, dark = '#000000', light = null, moduleRadius = 0, finderRadius = 0 } = {}) {
  const { matrix, size } = qr;
  const total = size + quiet * 2;
  const parts = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total * 40}" height="${total * 40}" shape-rendering="crispEdges">`);
  if (light) parts.push(`<rect width="${total}" height="${total}" fill="${light}"/>`);

  // caminho unico = arquivo menor e render mais rapido
  let d = '';
  for (let r = 0; r < size; r++) {
    let c = 0;
    while (c < size) {
      if (matrix[r][c]) {
        let len = 1;
        while (c + len < size && matrix[r][c + len]) len++;
        d += `M${c + quiet} ${r + quiet}h${len}v1h-${len}z`;
        c += len;
      } else c++;
    }
  }
  parts.push(`<path d="${d}" fill="${dark}"/>`);
  parts.push('</svg>');
  return parts.join('\n');
}

// ─────────────────── CLI ───────────────────
const fs = require('fs');
const [,, text, outBase, eclArg, quietArg] = process.argv;
if (!text || !outBase) {
  console.error('uso: node qrgen.js <texto> <saida-sem-extensao> [ECL=H] [quiet=4]');
  process.exit(1);
}
const ecl = (eclArg || 'H').toUpperCase();
const quiet = parseInt(quietArg || '4', 10);

const qr = makeQR(text, ecl);
console.log(`Texto      : ${text}`);
console.log(`Bytes      : ${qr.bytes}`);
console.log(`Versao     : ${qr.version}  (${qr.size}x${qr.size} modulos)`);
console.log(`Correcao   : nivel ${qr.ecl}`);
console.log(`Mascara    : ${qr.mask}  (penalidade ${qr.penalty})`);
console.log(`Quiet zone : ${quiet} modulos`);
console.log(`Total c/ QZ: ${qr.size + quiet*2}x${qr.size + quiet*2}`);

fs.writeFileSync(`${outBase}-branco.svg`, toSVG(qr, { quiet, light: '#FFFFFF' }));
fs.writeFileSync(`${outBase}-transparente.svg`, toSVG(qr, { quiet, light: null }));

// matriz crua para rasterizar
const lines = [`${qr.size} ${quiet}`];
for (let r = 0; r < qr.size; r++) lines.push(qr.matrix[r].join(''));
fs.writeFileSync(`${outBase}.matrix.txt`, lines.join('\n'));

console.log(`\nGerado: ${outBase}-branco.svg / ${outBase}-transparente.svg / ${outBase}.matrix.txt`);
