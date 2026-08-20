/* ═══════════════════════════════════════════════════════════════════════════
   APLICADOR — põe <script src="/atrib.js"></script> nas páginas que têm
   botão de WhatsApp.  Salvar como: landing-page/aplica-atrib.js
   ───────────────────────────────────────────────────────────────────────────
   Mesmo padrão do aplica-mapas.js que já está na raiz do repositório.

   COMO USAR (na pasta landing-page):
       node aplica-atrib.js            <- ENSAIO: só mostra o que faria
       node aplica-atrib.js --gravar   <- grava de verdade

   REGRAS QUE ELE SEGUE
   - só mexe em .html que tenha "wa.me" (49 arquivos; os outros 5 ficam fora);
   - insere a linha logo DEPOIS do <meta charset>, SEM defer, de propósito
     (ver o cabeçalho do atrib.js: com defer, o toque antes do fim do parse
     abre o WhatsApp sem o código);
   - é IDEMPOTENTE: rodar duas vezes não duplica nada;
   - preserva o BOM (EF BB BF) dos 43 arquivos que começam com ele;
   - preserva a quebra de linha do arquivo (CRLF continua CRLF).

   Pela regra de "rota de migração descartável": depois de validado, apague
   este arquivo. Ele não faz parte do site.
   ═══════════════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const GRAVAR = process.argv.indexOf('--gravar') !== -1;
const LINHA = '<script src="/atrib.js"></script>';
const BOM = '﻿';

function varrer(dir, acc) {
  acc = acc || [];
  for (const nome of fs.readdirSync(dir)) {
    if (nome === 'node_modules' || nome === '.git' || nome === 'images') continue;
    const p = path.join(dir, nome);
    if (fs.statSync(p).isDirectory()) varrer(p, acc);
    else if (/\.html$/i.test(nome)) acc.push(p);
  }
  return acc;
}

let vaiMudar = 0, jaTinha = 0, foraDeEscopo = 0, semHead = 0;

for (const f of varrer(RAIZ)) {
  const rel = path.relative(RAIZ, f).split(path.sep).join('/');
  let txt = fs.readFileSync(f, 'utf8');
  const temBom = txt.charCodeAt(0) === 0xFEFF;
  const corpo = temBom ? txt.slice(1) : txt;

  if (corpo.indexOf('wa.me') === -1) { foraDeEscopo++; console.log('  -    ' + rel + '  (sem botao de WhatsApp)'); continue; }
  if (corpo.indexOf('/atrib.js') !== -1) { jaTinha++; console.log('  =    ' + rel + '  (ja tem)'); continue; }

  const m = /<head\b[^>]*>/i.exec(corpo);
  if (!m) { semHead++; console.log('  !    ' + rel + '  (SEM <head> — pulado)'); continue; }

  const quebra = corpo.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
  // Entra logo DEPOIS do <meta charset>, não antes: o navegador precisa saber
  // a codificação da página antes de buscar um script sem charset próprio.
  // Conferido: os 49 arquivos têm o <meta charset> nos primeiros 200 bytes
  // depois do <head>.
  let corte = m.index + m[0].length;
  const cabeca = corpo.slice(corte, corte + 400);
  const mc = /<meta[^>]*charset[^>]*>/i.exec(cabeca);
  if (mc) corte += mc.index + mc[0].length;
  const novo = corpo.slice(0, corte) + quebra + LINHA + corpo.slice(corte);

  vaiMudar++;
  console.log('  +    ' + rel);
  if (GRAVAR) fs.writeFileSync(f, (temBom ? BOM : '') + novo, 'utf8');
}

console.log('');
console.log(GRAVAR ? 'GRAVADO.' : 'ENSAIO (nada foi gravado). Rode com --gravar para valer.');
console.log('  recebem a linha ......... ' + vaiMudar);
console.log('  ja tinham ............... ' + jaTinha);
console.log('  fora de escopo .......... ' + foraDeEscopo);
console.log('  sem <head> (pulados) .... ' + semHead);
