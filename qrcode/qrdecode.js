/**
 * DECODIFICADOR INDEPENDENTE — le uma matriz QR como um leitor real leria.
 * Nao assume nada do encoder: descobre mascara e nivel ECC lendo o FORMAT INFO
 * da propria matriz, desmascara, extrai, desintercala e checa a sindrome RS.
 */
const fs = require('fs');

// ── GF(256) ──
const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
(() => { let x=1; for(let i=0;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&0x100)x^=0x11d;} for(let i=255;i<512;i++)EXP[i]=EXP[i-255]; })();
const gmul=(a,b)=>(a===0||b===0)?0:EXP[LOG[a]+LOG[b]];

const ECB = {
  1:{L:[7,1,19,0,0],M:[10,1,16,0,0],Q:[13,1,13,0,0],H:[17,1,9,0,0]},
  2:{L:[10,1,34,0,0],M:[16,1,28,0,0],Q:[22,1,22,0,0],H:[28,1,16,0,0]},
  3:{L:[15,1,55,0,0],M:[26,1,44,0,0],Q:[18,2,17,0,0],H:[22,2,13,0,0]},
  4:{L:[20,1,80,0,0],M:[18,2,32,0,0],Q:[26,2,24,0,0],H:[16,4,9,0,0]},
  5:{L:[26,1,108,0,0],M:[24,2,43,0,0],Q:[18,2,15,2,16],H:[22,2,11,2,12]},
  6:{L:[18,2,68,0,0],M:[16,4,27,0,0],Q:[24,4,19,0,0],H:[28,4,15,0,0]},
  7:{L:[20,2,78,0,0],M:[18,4,31,0,0],Q:[18,2,14,4,15],H:[26,4,13,1,14]},
};
const ALIGN = {1:[],2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34],7:[6,22,38]};
const MASKS = [
  (r,c)=>(r+c)%2===0, (r,c)=>r%2===0, (r,c)=>c%3===0, (r,c)=>(r+c)%3===0,
  (r,c)=>(Math.floor(r/2)+Math.floor(c/3))%2===0, (r,c)=>((r*c)%2)+((r*c)%3)===0,
  (r,c)=>(((r*c)%2)+((r*c)%3))%2===0, (r,c)=>(((r+c)%2)+((r*c)%3))%2===0,
];
const ECL_FROM_BITS = {0b01:'L',0b00:'M',0b11:'Q',0b10:'H'};

// ── le a matriz ──
const file = process.argv[2];
const lines = fs.readFileSync(file,'utf8').trim().split('\n');
const [sizeStr] = lines[0].split(' ');
const size = parseInt(sizeStr,10);
const M = [];
for (let r=0;r<size;r++) M.push(lines[r+1].trim().split('').map(Number));
const version = (size - 17) / 4;
console.log(`Matriz ${size}x${size} → versao ${version}\n`);

let problemas = [];

// ── 1. FORMAT INFO: le as duas copias e corrige por BCH ──
function validFormats() {
  const out = [];
  for (let d=0; d<32; d++) {
    let rem = d << 10;
    for (let i=14;i>=10;i--) if ((rem>>i)&1) rem ^= 0b10100110111 << (i-10);
    out.push({ data:d, full: ((d<<10)|rem) ^ 0b101010000010010 });
  }
  return out;
}
const VALID = validFormats();
const hamming = (a,b) => { let x=a^b,n=0; while(x){n+=x&1;x>>=1;} return n; };

// copia A — coluna 8, de cima para baixo (ISO/IEC 18004 fig. 25)
let c1 = 0;
for (let i=0;i<15;i++) {
  const bit = (i<6) ? M[i][8] : (i<8) ? M[i+1][8] : M[size-15+i][8];
  c1 |= bit << i;
}
// copia B — linha 8, da direita para a esquerda
let c2 = 0;
for (let i=0;i<15;i++) {
  const bit = (i<8) ? M[8][size-1-i] : (i===8) ? M[8][7] : M[8][14-i];
  c2 |= bit << i;
}

const best1 = VALID.map(v=>({...v,d:hamming(v.full,c1)})).sort((a,b)=>a.d-b.d)[0];
const best2 = VALID.map(v=>({...v,d:hamming(v.full,c2)})).sort((a,b)=>a.d-b.d)[0];

console.log(`FORMAT INFO copia 1: ${c1.toString(2).padStart(15,'0')}  → ${best1.d} bit(s) de erro`);
console.log(`FORMAT INFO copia 2: ${c2.toString(2).padStart(15,'0')}  → ${best2.d} bit(s) de erro`);
if (best1.d > 0) problemas.push(`copia 1 do format info com ${best1.d} bit(s) errado(s)`);
if (best2.d > 3) problemas.push(`copia 2 do format info IRRECUPERAVEL (${best2.d} bits errados, BCH corrige ate 3)`);
else if (best2.d > 0) problemas.push(`copia 2 do format info com ${best2.d} bit(s) errado(s)`);

const ecl = ECL_FROM_BITS[(best1.data >> 3) & 0b11];
const mask = best1.data & 0b111;
console.log(`  → nivel ECC lido da matriz: ${ecl}`);
console.log(`  → mascara lida da matriz  : ${mask}\n`);

// ── 2. reconstroi mapa de reservados (independente) ──
const res = Array.from({length:size},()=>new Array(size).fill(false));
const mk=(r,c)=>{if(r>=0&&r<size&&c>=0&&c<size)res[r][c]=true;};
for (const [br,bc] of [[0,0],[0,size-7],[size-7,0]])
  for(let r=-1;r<=7;r++) for(let c=-1;c<=7;c++) mk(br+r,bc+c);
for(let i=0;i<size;i++){mk(6,i);mk(i,6);}
for (const r of ALIGN[version]) for (const c of ALIGN[version]) {
  if ((r<=8&&c<=8)||(r<=8&&c>=size-9)||(r>=size-9&&c<=8)) continue;
  for(let dr=-2;dr<=2;dr++) for(let dc=-2;dc<=2;dc++) mk(r+dr,c+dc);
}
for(let i=0;i<9;i++){mk(8,i);mk(i,8);}
for(let i=0;i<8;i++){mk(8,size-1-i);mk(size-1-i,8);}
mk(size-8,8);
if (version>=7) for(let i=0;i<6;i++) for(let j=0;j<3;j++){mk(size-11+j,i);mk(i,size-11+j);}

// ── 3. desmascara e le em zigue-zague ──
const bits=[];
let up=true;
for(let col=size-1;col>0;col-=2){
  if(col===6)col--;
  for(let k=0;k<size;k++){
    const row = up ? size-1-k : k;
    for(const c of [col,col-1]) if(!res[row][c]) bits.push(M[row][c] ^ (MASKS[mask](row,c)?1:0));
  }
  up=!up;
}
const cw=[];
for(let i=0;i+8<=bits.length;i+=8){let v=0;for(let j=0;j<8;j++)v=(v<<1)|bits[i+j];cw.push(v);}
console.log(`Codewords extraidos: ${cw.length}`);

// ── 4. desintercala ──
const [ecLen,b1,d1,b2,d2] = ECB[version][ecl];
const nBlocks=b1+b2, totalData=b1*d1+b2*d2;
const dataBlocks=[], ecBlocks=[];
for(let i=0;i<nBlocks;i++){dataBlocks.push([]);ecBlocks.push([]);}
let idx=0;
const maxD=Math.max(d1,d2||0);
for(let i=0;i<maxD;i++) for(let b=0;b<nBlocks;b++){
  const cap = b<b1?d1:d2;
  if(i<cap) dataBlocks[b].push(cw[idx++]);
}
for(let i=0;i<ecLen;i++) for(let b=0;b<nBlocks;b++) ecBlocks[b].push(cw[idx++]);
console.log(`Blocos: ${nBlocks} (${b1}x${d1}${b2?` + ${b2}x${d2}`:''} dados, ${ecLen} EC cada)`);

// ── 5. SINDROME REED-SOLOMON: prova real de que o ECC esta correto ──
let syndOK = true, syndDetail = [];
for (let b=0;b<nBlocks;b++) {
  const full = dataBlocks[b].concat(ecBlocks[b]);
  let bad = 0;
  for (let s=0;s<ecLen;s++) {
    let acc = 0;
    for (let i=0;i<full.length;i++) acc ^= gmul(full[i], EXP[(s*(full.length-1-i))%255]);
    if (acc !== 0) bad++;
  }
  if (bad) { syndOK=false; syndDetail.push(`bloco ${b}: ${bad}/${ecLen} sindromes != 0`); }
}
console.log(`\nSindrome Reed-Solomon: ${syndOK ? 'TODAS ZERO (ECC integro)' : 'FALHOU'}`);
if (!syndOK) { syndDetail.forEach(d=>console.log('  '+d)); problemas.push('ECC Reed-Solomon invalido'); }

// ── 6. decodifica a mensagem ──
const flat=[].concat(...dataBlocks);
let bp=0;
const rd=n=>{let v=0;for(let i=0;i<n;i++){const by=flat[bp>>3],bit=(by>>(7-(bp&7)))&1;v=(v<<1)|bit;bp++;}return v;};
const mode=rd(4);
const modeName={1:'numerico',2:'alfanumerico',4:'byte',7:'ECI'}[mode]||`desconhecido(${mode})`;
console.log(`\nModo: ${modeName}`);
if (mode!==4) problemas.push(`modo deveria ser byte(4), veio ${mode}`);
const len=rd(version<=9?8:16);
console.log(`Tamanho declarado: ${len} bytes`);
const chars=[];
for(let i=0;i<len && bp+8<=flat.length*8;i++) chars.push(rd(8));
const msg=Buffer.from(chars).toString('utf8');
console.log(`Mensagem: "${msg}"`);

console.log('\n' + '='.repeat(60));
if (problemas.length===0) console.log('>>> QR VALIDO — um leitor real conseguiria ler.');
else { console.log('>>> PROBLEMAS ENCONTRADOS:'); problemas.forEach(p=>console.log('    - '+p)); }
process.exit(problemas.length===0?0:1);
