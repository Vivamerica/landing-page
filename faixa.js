/* faixa.js - faixa da campanha Alpha Week Alphaville (15 a 30/11/2026). Criado em 13/11/2026.
   Quem carrega: o gancho no fim do /corretor.js (script.async), que todas as paginas ja' trazem. Assim a faixa
   nao depende de editar o HTML das paginas do Alphaville, que sao regeradas por outro processo.

   O que faz, pelo caminho da pagina (location.pathname) e pela hora de Brasilia:
   - ate' 30/11/2026 23:59:59 (Brasilia, UTC-3); depois disso nao mostra nada, em pagina nenhuma.
   - paginas que PARTICIPAM (/alphaville-indaiatuba/, a pagina do Parque Alphaville Alvorada, caminho com
     "alphaville" e "alvorada", e desde 17/11/2026 as do Alphaville Guarajuba 4, Alphaville Ceara 5 e Terras
     Alphaville Ceara 6, que estao na pagina 4 do folder oficial): faixa + secao id="alpha-week" com as regras oficiais, inserida logo depois do hero
     (se a pagina ainda nao tiver um elemento com esse id). Com #alpha-week na URL, rola ate' a secao.
     No Alphaville Indaiatuba o desconto e' 20% FIXO em qualquer lote residencial (arte da Alphaville para ele,
     13/11/2026); no Alvorada, nos da Bahia e do Ceara e nas paginas gerais fica o "ate' 20%" do folder nacional dos
     11 empreendimentos (o folder nao da' percentual proprio para nenhum deles).
   - /alphaville/ (hub, desde 17/11/2026): faixa geral + secao id="alpha-week" com a LISTA dos 11 participantes do
     folder (nome e cidade/UF; link para a pagina deste site quando ela existe), o "ate' 20%" (no Alphaville
     Indaiatuba, 20% em qualquer lote residencial), 5 unidades participantes por empreendimento e as regras.
     Entra logo depois do topo (.topo, o hero desta pagina), se a pagina ainda nao tiver um #alpha-week. O "Ver
     condicoes" da faixa e o "Ver as regras" da janela levam a essa secao (#alpha-week, na propria pagina).
     Motivo: a campanha Google "Alphaville Brasil" manda buscas genericas para /alphaville/ e o anuncio promete
     "ate' 20%", "5 lotes por empreendimento", contrato ate' 30/11 e "nao soma"; a pagina de destino tem de
     mostrar isso e dizer quais sao os participantes (CDC art. 30 e 31; regra do Google para a pagina de destino).
   - /blog/o-que-e-alphaville/ e mapa (#alphaville): faixa geral, com link para /alphaville/#alpha-week (as regras e
     a lista dos 11, nao so' as do Alphaville Indaiatuba: o texto dessas paginas fala dos 11 empreendimentos).
   - /casas-alphaville-dom-pedro-0-campinas/: faixa dizendo que as casas do Dom Pedro 0 NAO participam.
   - /mapa-lotes-indaiatuba/: faixa geral so' enquanto o endereco tiver "alphaville" depois do #.
   - qualquer outra pagina: nada.
   A faixa entra como primeiro elemento do <body>, no fluxo (nao fica fixa por cima de nada); o botao de fechar
   vale para a sessao (sessionStorage). Teste local: ?faixa-data=AAAA-MM-DD (ou AAAA-MM-DDTHH:MM, hora de
   Brasilia), aceito so' em localhost/127.0.0.1, como o LOCAL do corretor.js.

   DESTAQUE (17/11/2026, pedido do Fabio: "algo saltando na tela ALPHA WEEK 20% OFF para pagamento a vista"),
   nas mesmas paginas da faixa (no mapa, so' com #alphaville):
   - janela (role=dialog, aria-modal) que abre sozinha ~1,5 s depois do load, UMA vez por sessao (sessionStorage
     vm-aw-janela-vista; com o sessionStorage bloqueado, so' na chegada ao site, nunca de pagina em pagina):
     selo ALPHA WEEK, "20% OFF" (so' no Alphaville Indaiatuba) ou "ATE' 20% OFF" (demais e
     paginas gerais), "para pagamento a' vista", periodo, 5 lotes, contagem ate' 30/11/2026 23:59 (Brasilia),
     WhatsApp com a mesma mensagem da secao #alpha-week e botao para as regras. No Dom Pedro 0 diz que as casas
     nao participam e oferece os lotes do Alphaville Indaiatuba. Fecha no X, no Esc e no clique fora; foco preso
     dentro e devolvido ao fechar. Nao abre sozinha por cima de outra janela (Sou corretor), do menu aberto, de
     campo em edicao, nem quando o endereco ja' traz #alpha-week (a pessoa veio ler as regras).
   - selo flutuante "20% OFF" / "ATE' 20% OFF" no canto inferior ESQUERDO (o WhatsApp fica a' direita), acima das
     barras fixas do celular, que reabre a janela.
   - animacao (entrada da janela e pulsacao curta do selo) so' sem prefers-reduced-motion; tudo some depois de
     30/11/2026 23:59:59 (Brasilia), inclusive com a pagina aberta.

   PARCELAMENTO (17/11/2026, pedido da coordenadora da Alphaville: valorizar o "parcelamento em ate' 60 vezes sem juros,
   com correcao mensal pelo IPCA"), SO' no Alphaville Indaiatuba, cuja condicao normal da tabela a pagina ja' publica
   (ato de 20% em ate' 3x; saldo em 60 mensais sem juros, corrigidas pelo IPCA). Nao tem o desconto da Alpha Week, que
   e' so' para pagamento integral a' vista. Nas outras paginas (gerais, Alvorada, Guarajuba 4, Ceara 5, Terras Ceara 6,
   Dom Pedro, mapa): nada, porque o pedido da coordenadora foi so' para o Alphaville Indaiatuba (Alvorada, Guarajuba 4
   e Ceara 5 ja' publicam, na propria pagina, a condicao da tabela de cada um).
   O texto mostrado NAO repete o "20%" da entrada ("entrada em ate' 3x"): logo acima esta' o "20% OFF" e o cliente
   confundia os dois numeros (mesma decisao dos anuncios do Google, onde "Ato de 20%" virou "Entrada + 60x").
   - janela: bloco discreto "Prefere parcelar?" depois do botao principal e do "Ver as regras", antes da nota, com o
     link secundario "Simular parcelamento no WhatsApp" (GA4 whatsapp_click com cta_pos "janela-parcelamento").
   - secao #alpha-week: paragrafo "Nao vai pagar a' vista?" logo depois do botao de WhatsApp da secao, com o link
     "Simule o seu lote pelo WhatsApp" (cta_pos "secao-parcelamento"). Os dois links: mesmo numero, mesma mensagem
     de simulacao; o atrib.js carimba o codigo de campanha como nos outros.
   ES5, sem biblioteca; os textos usam \u para nao depender da codificacao com que o navegador le o arquivo. */
(function () {
  'use strict';
  if (window.__vmFaixa) return;
  window.__vmFaixa = true;

  // 30/11/2026 23:59:59.999 em Brasilia = 01/12/2026 02:59:59.999 UTC (Brasilia nao tem horario de verao desde 2019)
  var FIM = Date.UTC(2026, 11, 1, 2, 59, 59, 999);
  var CHAVE = 'vm-faixa-alphaweek-fechada';
  var ID_FAIXA = 'vm-faixa';
  var ID_SECAO = 'alpha-week';
  var DESTINO = '/alphaville-indaiatuba/#alpha-week';
  // secao com a lista dos 11 participantes e as regras (17/11/2026): destino do "Ver condicoes" das paginas gerais
  var HUB = '/alphaville/#alpha-week';
  var REGULAMENTO = 'https://alphaville.com.br/regulamento/alphaville/';
  // so' se a pagina nao tiver link de WhatsApp nenhum: e' o numero de todos os 575 links wa.me do site (13/11/2026)
  var WA_SITE = '5519989769457';
  // destaque (janela + selo flutuante), 17/11/2026
  var CHAVE_JANELA = 'vm-aw-janela-vista';
  var ID_JANELA = 'vm-aw-janela';
  var ID_SELO = 'vm-aw-selo';
  var ESPERA_JANELA = 1500;   // depois do load
  var ESPERA_MAXIMA = 6000;   // load lento (fotos, mapa): abre assim mesmo 6 s depois de o HTML estar pronto
  // icone do WhatsApp (o mesmo desenho do botao flutuante das paginas), preto, como imagem do CSS
  var ICONE_WA = 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27%23161616%27 d=%27M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z%27/%3E%3C/svg%3E")';

  // o mesmo icone em dourado, para o link secundario (parcelamento) da janela
  var ICONE_WA_OURO = ICONE_WA.replace('%23161616', '%23F7D77E');
  // parcelamento: so' nesta pagina (a condicao normal da tabela e' a que a propria pagina publica)
  var PARCELA_EM = 'Alphaville Indaiatuba';

  var HOST = String(location.hostname || '').toLowerCase();
  var LOCAL = HOST === '' || HOST === 'localhost' || HOST === '127.0.0.1' || HOST === '[::1]' || HOST === '::1' || /\.localhost$/.test(HOST);

  // outros empreendimentos da campanha com pagina neste site (folder oficial, p. 4): caminho -> nome
  var PARTICIPA_OUTROS = {
    'alphaville-guarajuba-4-camacari': 'Alphaville Guarajuba 4',
    'alphaville-ceara-5-eusebio': 'Alphaville Cear\u00E1 5',
    'terras-alphaville-ceara-6-eusebio': 'Terras Alphaville Cear\u00E1 6'
  };

  // os 11 participantes, com o nome do folder oficial (texto da campanha) e a cidade/UF da lista "cidades
  // participantes" do mesmo folder; caminho = pagina deste site ('' = sem pagina aqui, so' texto).
  // Ordem: o Alphaville Indaiatuba primeiro (e' o unico com percentual proprio, 20% em qualquer lote, pela arte da
  // Alphaville para ele); depois a ordem do folder. O Dom Pedro 0 nao esta' no folder e nao entra.
  var PARTICIPANTES = [
    ['Alphaville Indaiatuba', 'Indaiatuba (SP)', 'alphaville-indaiatuba'],
    ['Alphaville Cear\u00E1 5', 'Eus\u00E9bio (CE)', 'alphaville-ceara-5-eusebio'],
    ['Terras Alphaville Cear\u00E1 6', 'Eus\u00E9bio (CE)', 'terras-alphaville-ceara-6-eusebio'],
    ['Alphaville Guarajuba 4', 'Guarajuba (BA)', 'alphaville-guarajuba-4-camacari'],
    ['Alphaville Litoral Norte 4', 'Cama\u00E7ari (BA)', ''],
    ['Terras Alpha Uberaba', 'Uberaba (MG)', ''],
    ['Parque Alphaville Alvorada', 'Votorantim (SP)', 'parque-alphaville-alvorada-votorantim'],
    ['Terras Alpha Cascavel 3', 'Cascavel (PR)', ''],
    ['Jardim Alpha Ponta Grossa', 'Ponta Grossa (PR)', ''],
    ['Alphaville Planalto Central 2', 'Bras\u00EDlia (DF)', ''],
    ['Terras Alpha Campo Grande', 'Campo Grande (MS)', '']
  ];

  var T_FORTE = 'Alpha Week Alphaville';
  var TEXTOS = {
    // "selecionados" como o folder ("unidades residenciais selecionadas") e o titulo da propria secao
    participa: {
      resto: ', 15 a 30/11/2026: at\u00E9 20% de desconto \u00E0 vista em lotes residenciais selecionados, para os 5 primeiros vendidos neste empreendimento.',
      link: 'Ver condi\u00E7\u00F5es',
      href: '#' + ID_SECAO
    },
    // Alphaville Indaiatuba: a arte da Alphaville para ele diz "5 lotes (qualquer lote) com 20% de desconto para
    // pagamento a' vista"; o "ate' 20%" do folder nacional fica para as outras paginas
    indaiatuba: {
      resto: ', 15 a 30/11/2026: 20% de desconto \u00E0 vista para os 5 primeiros lotes residenciais vendidos neste empreendimento.',
      link: 'Ver condi\u00E7\u00F5es',
      href: '#' + ID_SECAO
    },
    // /alphaville/: a secao com a lista e as regras esta' na propria pagina
    hub: {
      resto: ', 15 a 30/11/2026: at\u00E9 20% de desconto \u00E0 vista em lotes residenciais selecionados de 11 empreendimentos, entre eles o Alphaville Indaiatuba.',
      link: 'Ver condi\u00E7\u00F5es',
      href: '#' + ID_SECAO
    },
    // artigo e mapa: o mesmo texto (11 empreendimentos), com as regras de todos na secao do /alphaville/
    geral: {
      resto: ', 15 a 30/11/2026: at\u00E9 20% de desconto \u00E0 vista em lotes residenciais selecionados de 11 empreendimentos, entre eles o Alphaville Indaiatuba.',
      link: 'Ver condi\u00E7\u00F5es',
      href: HUB
    },
    dompedro: {
      resto: ' (15 a 30/11/2026): at\u00E9 20% de desconto \u00E0 vista em lotes residenciais selecionados. As casas do Dom Pedro 0 n\u00E3o participam.',
      link: 'Ver lotes do Alphaville Indaiatuba',
      href: DESTINO
    }
  };

  var CSS = [
    '#vm-faixa,#vm-faixa :where(*),#vm-faixa :where(*)::before,#vm-faixa :where(*)::after{all:revert;box-sizing:border-box}',
    '#vm-faixa{display:block;flex:none;position:relative;margin:0;padding:0;background:#161616;color:#fff;border-bottom:2px solid #F7D77E;font-family:\'Josefin Sans\',system-ui,-apple-system,\'Segoe UI\',sans-serif;font-size:14px;font-weight:400;font-style:normal;line-height:1.45;letter-spacing:normal;text-transform:none;text-align:left}',
    '#vm-faixa .vm-faixa-in{display:flex;align-items:center;gap:8px;max-width:1200px;margin:0 auto;padding:4px 8px 4px 16px}',
    '#vm-faixa .vm-faixa-txt{flex:1 1 auto;min-width:0;margin:0;padding:5px 0;text-align:center}',
    '#vm-faixa strong{font-weight:700;color:#F7D77E}',
    '#vm-faixa a{color:#F7D77E;font-weight:600;text-decoration:underline;text-underline-offset:2px;white-space:nowrap;border-radius:2px}',
    '#vm-faixa a:hover{color:#fff}',
    '#vm-faixa a:focus-visible{outline:2px solid #F7D77E;outline-offset:2px}',
    '#vm-faixa .vm-faixa-fechar{position:relative;flex:none;width:36px;height:36px;margin:0;padding:0;border:0;border-radius:4px;background:transparent;color:#fff;cursor:pointer}',
    '#vm-faixa .vm-faixa-fechar::before,#vm-faixa .vm-faixa-fechar::after{content:\'\';position:absolute;left:50%;top:50%;width:16px;height:2px;margin:-1px 0 0 -8px;background:currentColor;border-radius:2px;transform:rotate(45deg)}',
    '#vm-faixa .vm-faixa-fechar::after{transform:rotate(-45deg)}',
    '#vm-faixa .vm-faixa-fechar:hover{color:#F7D77E}',
    '#vm-faixa .vm-faixa-fechar:focus-visible{outline:2px solid #F7D77E;outline-offset:-2px}',
    '@media (max-width:600px){#vm-faixa{font-size:13px;line-height:1.4}#vm-faixa .vm-faixa-in{align-items:flex-start;padding:2px 4px 2px 16px}#vm-faixa .vm-faixa-txt{padding:9px 0 8px;text-align:left}#vm-faixa .vm-faixa-fechar{width:40px;height:40px}}',
    '@media (prefers-reduced-motion:no-preference){#vm-faixa a,#vm-faixa .vm-faixa-fechar{transition:color .15s}}',
    '@media print{#vm-faixa{display:none}}',
    // secao com as regras (so' nas paginas que participam e so' quando a pagina nao tem a sua propria)
    '#alpha-week.vm-aw,#alpha-week.vm-aw :where(*),#alpha-week.vm-aw :where(*)::before,#alpha-week.vm-aw :where(*)::after{all:revert;box-sizing:border-box}',
    '#alpha-week.vm-aw{display:block;margin:0;padding:40px 0;background:#F7F5F0;color:#161616;border-top:3px solid #C9A227;border-bottom:1px solid #E6E1D6;font-family:\'Josefin Sans\',system-ui,-apple-system,\'Segoe UI\',sans-serif;font-size:16px;font-weight:400;font-style:normal;line-height:1.65;letter-spacing:normal;text-transform:none;text-align:left;scroll-margin-top:calc(var(--menu-h, 70px) + 12px)}',
    '#alpha-week.vm-aw .vm-aw-in{display:block;max-width:1120px;margin:0 auto;padding:0 5%}',
    '#alpha-week.vm-aw .vm-aw-rotulo{display:block;margin:0;font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6E5300}',
    '#alpha-week.vm-aw h2{display:block;margin:8px 0 16px;font-family:\'Poiret One\',\'Josefin Sans\',system-ui,sans-serif;font-size:clamp(26px,3.2vw,40px);font-weight:400;line-height:1.2;color:#161616;text-wrap:balance}',
    '#alpha-week.vm-aw p{display:block;max-width:60rem;margin:0 0 16px}',
    '#alpha-week.vm-aw b{font-weight:700}',
    '#alpha-week.vm-aw ul{display:block;max-width:60rem;margin:0 0 24px;padding:0 0 0 1.2em;list-style:disc outside}',
    '#alpha-week.vm-aw li{display:list-item;margin:0 0 8px}',
    '#alpha-week.vm-aw li::marker{color:#8A6D1F}',
    '#alpha-week.vm-aw .vm-aw-btn{display:inline-block;padding:14px 26px;background:#C9A227;color:#161616;font-size:14px;font-weight:700;line-height:1.3;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;border-radius:4px;cursor:pointer}',
    '#alpha-week.vm-aw .vm-aw-btn:hover{background:#F7D77E}',
    '#alpha-week.vm-aw a:focus-visible{outline:3px solid #161616;outline-offset:2px}',
    '#alpha-week.vm-aw .vm-aw-nota{margin:18px 0 0;font-size:14px;line-height:1.55;color:#5C5C5C}',
    '#alpha-week.vm-aw .vm-aw-nota a{color:#161616;text-decoration:underline;overflow-wrap:anywhere}',
    '@media (max-width:600px){#alpha-week.vm-aw{padding:32px 0}#alpha-week.vm-aw .vm-aw-btn{display:block;text-align:center}}',
    // parcelamento na secao (so' no Alphaville Indaiatuba): caixa clara e discreta, depois do botao de WhatsApp
    '#alpha-week.vm-aw .vm-aw-parcela{max-width:60rem;margin:24px 0 0;padding:14px 18px 12px;background:#fff;border:1px solid #E6E1D6;border-left:3px solid #C9A227;border-radius:0 6px 6px 0;font-size:15px;line-height:1.6;color:#2B2B2B}',
    '#alpha-week.vm-aw .vm-aw-parcela b{color:#161616}',
    '#alpha-week.vm-aw .vm-aw-parcela a{color:#161616;font-weight:700;text-decoration:underline;text-decoration-color:#8A6D1F;text-decoration-thickness:2px;text-underline-offset:3px;border-radius:2px}',
    '#alpha-week.vm-aw .vm-aw-parcela a:hover{color:#6E5300}',
    '@media (max-width:600px){#alpha-week.vm-aw .vm-aw-parcela{padding:12px 14px 10px}}',
    // secao do /alphaville/ (hub): lista dos 11 participantes em cartoes claros; o Alphaville Indaiatuba (20% em
    // qualquer lote) com o fio dourado a' esquerda
    '#alpha-week.vm-aw h3{display:block;margin:28px 0 12px;font-size:18px;font-weight:700;line-height:1.3;color:#161616}',
    '#alpha-week.vm-aw ul.vm-aw-lista{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;max-width:none;margin:0 0 14px;padding:0;list-style:none}',
    '#alpha-week.vm-aw .vm-aw-lista li{display:block;margin:0;padding:11px 14px 9px;background:#fff;border:1px solid #E6E1D6;border-radius:6px;line-height:1.35}',
    '#alpha-week.vm-aw .vm-aw-lista li.vm-aw-fixo{border-color:#C9A227;box-shadow:inset 3px 0 0 #C9A227}',
    '#alpha-week.vm-aw .vm-aw-emp-nome{display:block;margin:0;font-size:16px;font-weight:700;color:#161616}',
    '#alpha-week.vm-aw a.vm-aw-emp-nome{text-decoration:underline;text-decoration-color:#8A6D1F;text-decoration-thickness:2px;text-underline-offset:3px;border-radius:2px}',
    '#alpha-week.vm-aw a.vm-aw-emp-nome:hover{color:#6E5300}',
    '#alpha-week.vm-aw .vm-aw-emp-info{display:block;margin:3px 0 0;font-size:14px;color:#5C5C5C}',
    '#alpha-week.vm-aw .vm-aw-emp-pct{font-weight:700;color:#6E5300}',
    '#alpha-week.vm-aw .vm-aw-fora{margin:0 0 8px;font-size:14px;line-height:1.55;color:#5C5C5C}',
    // destaque: janela (#vm-aw-janela) e selo flutuante (#vm-aw-selo). Mesmo isolamento da faixa (all:revert)
    '#vm-aw-janela,#vm-aw-janela :where(*),#vm-aw-janela :where(*)::before,#vm-aw-janela :where(*)::after,#vm-aw-selo,#vm-aw-selo :where(*){all:revert;box-sizing:border-box}',
    '#vm-aw-janela{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147482000;display:flex;align-items:center;justify-content:center;margin:0;padding:16px;background:rgba(8,8,8,.8);color:#fff;font-family:\'Josefin Sans\',system-ui,-apple-system,\'Segoe UI\',sans-serif;font-size:16px;font-weight:400;font-style:normal;line-height:1.4;letter-spacing:normal;text-transform:none;text-align:center;-webkit-tap-highlight-color:transparent}',
    '#vm-aw-janela[hidden]{display:none}',
    '#vm-aw-janela .vm-awj-caixa{position:relative;display:block;width:100%;max-width:480px;max-height:100%;margin:auto;padding:30px 28px 22px;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;background-color:#161616;background-image:radial-gradient(130% 70% at 50% -12%,#3D3214 0%,rgba(22,22,22,0) 64%);border:1px solid #C9A227;border-radius:16px;box-shadow:0 0 0 4px rgba(201,162,39,.14),0 24px 80px rgba(0,0,0,.6),0 0 70px rgba(201,162,39,.22);color:#fff;text-align:center}',
    '#vm-aw-janela .vm-awj-caixa:focus{outline:none}',
    '#vm-aw-janela .vm-awj-caixa::after{content:\'\';position:absolute;top:0;bottom:0;left:-60%;width:50%;background:linear-gradient(100deg,rgba(247,215,126,0) 0%,rgba(247,215,126,.24) 50%,rgba(247,215,126,0) 100%);transform:skewX(-18deg);opacity:0;pointer-events:none}',
    '#vm-aw-janela .vm-awj-marca{display:inline-block;margin:0;padding:10px 16px 7px 21px;background:linear-gradient(135deg,#F7D77E 0%,#C9A227 100%);background-color:#C9A227;color:#161616;border-radius:999px;font-size:18px;font-weight:700;line-height:1.1;letter-spacing:.26em;text-transform:uppercase;box-shadow:0 4px 18px rgba(201,162,39,.35)}',
    '#vm-aw-janela .vm-awj-oferta{display:block;margin:12px 0 0;padding:0;font-family:inherit;font-size:16px;font-weight:700;line-height:1;letter-spacing:-.01em;color:#F7D77E;white-space:nowrap;text-shadow:0 0 28px rgba(247,215,126,.35)}',
    '#vm-aw-janela .vm-awj-ate{display:block;margin:0 0 4px;padding-left:.3em;font-size:26px;letter-spacing:.3em;text-transform:uppercase;color:#fff;text-shadow:none}',
    '#vm-aw-janela .vm-awj-num{display:inline-block;font-size:clamp(78px,23vw,120px);line-height:.95}',
    '#vm-aw-janela .vm-awj-off{display:inline-block;margin-left:.1em;font-size:clamp(36px,10.5vw,52px);letter-spacing:.04em;color:#fff;text-shadow:none}',
    '#vm-aw-janela .vm-awj-vista{display:block;margin:10px 0 0;font-size:20px;font-weight:600;line-height:1.25;letter-spacing:.12em;text-transform:uppercase;color:#fff}',
    '#vm-aw-janela .vm-awj-alvo{display:block;margin:6px 0 0;font-size:16px;line-height:1.4;color:#E8E2D0}',
    '#vm-aw-janela .vm-awj-aviso{display:block;margin:14px 0 0;padding:10px 12px 8px;border:1px solid #C9A227;border-radius:8px;background:#221D0F;font-size:15px;line-height:1.45;color:#fff;text-align:left}',
    '#vm-aw-janela .vm-awj-aviso b{font-weight:700;color:#F7D77E}',
    '#vm-aw-janela .vm-awj-fichas{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:14px 0 0;padding:0;list-style:none}',
    '#vm-aw-janela .vm-awj-fichas li{display:block;margin:0;padding:7px 12px 5px;border:1px solid #8A6D1F;border-radius:999px;font-size:13px;font-weight:600;line-height:1.2;letter-spacing:.05em;text-transform:uppercase;color:#F7D77E}',
    '#vm-aw-janela .vm-awj-conta{display:block;margin:16px 0 0}',
    '#vm-aw-janela .vm-awj-conta-rot{display:block;margin:0 0 8px;font-size:12px;font-weight:600;line-height:1.2;letter-spacing:.18em;text-transform:uppercase;color:#BDBDBD}',
    '#vm-aw-janela .vm-awj-conta-rot b{font-weight:700;color:#F7D77E}',
    '#vm-aw-janela .vm-awj-caixas{display:flex;justify-content:center;gap:8px;margin:0}',
    '#vm-aw-janela .vm-awj-cx{display:flex;flex-direction:column;align-items:center;min-width:72px;margin:0;padding:9px 6px 6px;background:#0D0D0D;border:1px solid #4A3F1E;border-radius:8px}',
    '#vm-aw-janela .vm-awj-cx b{display:block;font-size:30px;font-weight:700;line-height:1;color:#fff;font-variant-numeric:tabular-nums}',
    '#vm-aw-janela .vm-awj-cx small{display:block;margin-top:5px;font-size:11px;font-weight:600;line-height:1;letter-spacing:.14em;text-transform:uppercase;color:#BDBDBD}',
    '#vm-aw-janela .vm-awj-so-leitor{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}',
    '#vm-aw-janela .vm-awj-wa{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:54px;margin:18px 0 0;padding:14px 16px 12px;background:linear-gradient(135deg,#F7D77E 0%,#C9A227 100%);background-color:#C9A227;color:#161616;border-radius:10px;font-size:16px;font-weight:700;line-height:1.2;letter-spacing:.05em;text-transform:uppercase;text-decoration:none;cursor:pointer;box-shadow:0 8px 24px rgba(201,162,39,.35)}',
    '#vm-aw-janela .vm-awj-wa::before{content:\'\';display:block;flex:none;width:22px;height:22px;margin-top:-3px;background:' + ICONE_WA + ' center/contain no-repeat}',
    '#vm-aw-janela .vm-awj-wa:hover{background:#F7D77E}',
    '#vm-aw-janela .vm-awj-regras{display:inline-flex;align-items:center;justify-content:center;min-height:44px;margin:6px 0 0;padding:6px 12px;color:#F7D77E;font-size:15px;font-weight:600;letter-spacing:.04em;text-decoration:underline;text-underline-offset:3px;border-radius:4px;cursor:pointer}',
    '#vm-aw-janela .vm-awj-regras:hover{color:#fff}',
    '#vm-aw-janela .vm-awj-nota{display:block;margin:6px 0 0;font-size:12px;line-height:1.5;color:#A8A8A8}',
    '#vm-aw-janela .vm-awj-nota a{color:#D9D9D9;text-decoration:underline;border-radius:2px}',
    // parcelamento (so' no Alphaville Indaiatuba): bloco compacto, separado por um fio, abaixo do botao principal
    // medidas apertadas de proposito: com o bloco, a caixa (745 px) ainda cabe inteira em 1280 x 800, sem barra de rolagem
    '#vm-aw-janela .vm-awj-parc{display:block;margin:4px 0 0;padding:10px 0 0;border-top:1px solid #3A3220;text-align:center}',
    '#vm-aw-janela .vm-awj-parc-tit{display:block;margin:0;font-size:13px;font-weight:700;line-height:1.3;letter-spacing:.14em;text-transform:uppercase;color:#E8E2D0}',
    '#vm-aw-janela .vm-awj-parc-txt{display:block;margin:2px 0 0;font-size:13px;line-height:1.4;color:#CFCFCF}',
    '#vm-aw-janela .vm-awj-parc-wa{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;margin:6px 0 0;padding:8px 16px 6px;border:1px solid #8A6D1F;border-radius:8px;background:transparent;color:#F7D77E;font-size:14px;font-weight:700;line-height:1.2;letter-spacing:.04em;text-decoration:none;cursor:pointer}',
    '#vm-aw-janela .vm-awj-parc-wa::before{content:\'\';display:block;flex:none;width:18px;height:18px;margin-top:-2px;background:' + ICONE_WA_OURO + ' center/contain no-repeat}',
    '#vm-aw-janela .vm-awj-parc-wa:hover{background:#221D0F;border-color:#C9A227;color:#fff}',
    // celular: o "Simular parcelamento no WhatsApp" numa linha so'
    '@media (max-width:400px){#vm-aw-janela .vm-awj-parc{padding-top:8px}#vm-aw-janela .vm-awj-parc-wa{padding:8px 12px 6px;font-size:13px;letter-spacing:.02em}}',
    // quando a caixa precisa rolar por dentro (tela baixa), barra fina e escura em vez da barra clara do sistema
    '#vm-aw-janela .vm-awj-caixa{scrollbar-width:thin;scrollbar-color:#5C4E22 transparent}',
    '#vm-aw-janela .vm-awj-fechar{position:absolute;top:8px;right:8px;z-index:1;display:block;width:44px;height:44px;margin:0;padding:0;border:0;border-radius:50%;background:#262626;color:#fff;cursor:pointer}',
    '#vm-aw-janela .vm-awj-fechar::before,#vm-aw-janela .vm-awj-fechar::after{content:\'\';position:absolute;left:50%;top:50%;width:18px;height:2px;margin:-1px 0 0 -9px;background:currentColor;border-radius:2px;transform:rotate(45deg)}',
    '#vm-aw-janela .vm-awj-fechar::after{transform:rotate(-45deg)}',
    '#vm-aw-janela .vm-awj-fechar:hover{color:#F7D77E;background:#333}',
    '#vm-aw-janela a:focus-visible,#vm-aw-janela button:focus-visible{outline:3px solid #F7D77E;outline-offset:2px}',
    '#vm-aw-janela .vm-awj-wa:focus-visible{outline:3px solid #fff;outline-offset:3px}',
    '@media (max-width:400px){#vm-aw-janela{padding:12px}#vm-aw-janela .vm-awj-caixa{padding:26px 18px 18px}#vm-aw-janela .vm-awj-marca{font-size:16px}#vm-aw-janela .vm-awj-vista{font-size:18px}#vm-aw-janela .vm-awj-cx{min-width:66px}#vm-aw-janela .vm-awj-wa{font-size:15px;letter-spacing:.03em}}',
    '@media (max-height:600px){#vm-aw-janela .vm-awj-caixa{padding-top:22px}#vm-aw-janela .vm-awj-num{font-size:72px}#vm-aw-janela .vm-awj-conta{margin-top:10px}}',
    '#vm-aw-selo{position:fixed;left:16px;bottom:16px;z-index:1100;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:112px;min-height:56px;margin:0;padding:8px 14px 6px;border:2px solid #161616;border-radius:999px;background:linear-gradient(135deg,#F7D77E 0%,#C9A227 100%);background-color:#C9A227;color:#161616;font-family:\'Josefin Sans\',system-ui,-apple-system,\'Segoe UI\',sans-serif;font-size:16px;font-weight:700;font-style:normal;line-height:1;letter-spacing:normal;text-transform:uppercase;text-align:center;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.35);-webkit-tap-highlight-color:transparent}',
    '#vm-aw-selo[hidden]{display:none}',
    '#vm-aw-selo .vm-aw-selo-a{display:block;font-size:10px;font-weight:700;letter-spacing:.2em}',
    '#vm-aw-selo .vm-aw-selo-b{display:block;margin-top:4px;font-size:20px;font-weight:700;letter-spacing:.02em;white-space:nowrap}',
    '#vm-aw-selo .vm-aw-selo-b small{font-size:13px;font-weight:700;letter-spacing:.06em}',
    '#vm-aw-selo:hover{background:#F7D77E}',
    '#vm-aw-selo:focus-visible{outline:3px solid #161616;outline-offset:2px;box-shadow:0 0 0 7px #F7D77E}',
    '@media (prefers-reduced-motion:no-preference){' +
      '#vm-aw-janela{animation:vm-awj-fundo .25s ease-out both}' +
      '#vm-aw-janela .vm-awj-caixa{animation:vm-awj-entra .55s cubic-bezier(.2,1.35,.4,1) both}' +
      '#vm-aw-janela .vm-awj-caixa::after{animation:vm-awj-brilho 1.2s .5s ease-in-out both}' +
      '#vm-aw-janela .vm-awj-num{animation:vm-awj-luz 1.5s .35s ease-out both}' +
      '#vm-aw-selo.vm-aw-pulsa{animation:vm-aw-pulsa 1.6s ease-in-out 3}' +
      '#vm-aw-janela .vm-awj-wa,#vm-aw-janela .vm-awj-regras,#vm-aw-janela .vm-awj-fechar,#vm-aw-selo{transition:background-color .15s,color .15s}' +
      '#vm-aw-janela .vm-awj-parc-wa{transition:background-color .15s,color .15s,border-color .15s}' +
    '}',
    '@keyframes vm-awj-fundo{from{opacity:0}to{opacity:1}}',
    '@keyframes vm-awj-entra{from{opacity:0;transform:scale(.78)}to{opacity:1;transform:scale(1)}}',
    '@keyframes vm-awj-brilho{from{opacity:1;transform:skewX(-18deg) translateX(0)}to{opacity:1;transform:skewX(-18deg) translateX(440%)}}',
    '@keyframes vm-awj-luz{0%{text-shadow:0 0 0 rgba(247,215,126,0)}40%{text-shadow:0 0 38px rgba(247,215,126,.95)}100%{text-shadow:0 0 28px rgba(247,215,126,.35)}}',
    '@keyframes vm-aw-pulsa{0%,100%{transform:scale(1);box-shadow:0 6px 20px rgba(0,0,0,.35),0 0 0 0 rgba(247,215,126,.75)}50%{transform:scale(1.08);box-shadow:0 6px 20px rgba(0,0,0,.35),0 0 0 14px rgba(247,215,126,0)}}',
    '@media print{#vm-aw-janela,#vm-aw-selo{display:none}}'
  ].join('\n');

  function agora() {
    if (LOCAL) {
      var m = /[?&]faixa-data=(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?(?:&|$)/.exec(String(location.search || ''));
      // hora de Brasilia = UTC-3; sem hora, meio-dia
      if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3], (m[4] ? +m[4] : 12) + 3, m[5] ? +m[5] : 0, 0, 0);
    }
    return new Date().getTime();
  }

  function caminho() {
    var p = String(location.pathname || '/').toLowerCase();
    try { p = decodeURIComponent(p); } catch (e) {}
    p = p.replace(/index\.html?$/, '');
    if (p.charAt(p.length - 1) !== '/') p += '/';
    return p;
  }

  function tipoDaPagina(p) {
    if (p === '/casas-alphaville-dom-pedro-0-campinas/') return 'dompedro';
    if (p === '/alphaville/') return 'hub';
    if (p === '/blog/o-que-e-alphaville/') return 'geral';
    if (p === '/mapa-lotes-indaiatuba/') return 'mapa';
    // so' a raiz da pagina do empreendimento (um nivel): um 404 em /alphaville-indaiatuba/xyz/ nao ganha secao.
    // "alvorada" so' junto com "alphaville": ha' um bairro Alvorada em Indaiatuba que NAO e' da Alphaville.
    var m = /^\/([a-z0-9-]+)\/$/.exec(p);
    if (m && (m[1].indexOf('alphaville-indaiatuba') >= 0 || (m[1].indexOf('alphaville') >= 0 && m[1].indexOf('alvorada') >= 0))) return 'participa';
    // so' chave propria do objeto: /constructor/ (404) nao pode virar pagina "participa" com o nome Object
    if (m && Object.prototype.hasOwnProperty.call(PARTICIPA_OUTROS, m[1])) return 'participa';
    return '';
  }

  function nomeDoEmpreendimento(p) {
    var m = /^\/([a-z0-9-]+)\/$/.exec(p);
    if (m && Object.prototype.hasOwnProperty.call(PARTICIPA_OUTROS, m[1])) return PARTICIPA_OUTROS[m[1]];
    return p.indexOf('alvorada') >= 0 ? 'Parque Alphaville Alvorada' : 'Alphaville Indaiatuba';
  }

  // 20% fixo so' no Alphaville Indaiatuba (arte especifica dele); nos demais, "ate' 20%"
  function descontoFixo(nome, p) {
    return nome === 'Alphaville Indaiatuba' || String(p || '').indexOf('alphaville-indaiatuba') >= 0;
  }

  function fechada() {
    try { return window.sessionStorage.getItem(CHAVE) === '1'; } catch (e) { return false; }
  }

  function gravaFechada() {
    try { window.sessionStorage.setItem(CHAVE, '1'); } catch (e) {}
  }

  function focar(el) {
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (e2) {} }
  }

  function el(tag, atributos, filhos) {
    var n = document.createElement(tag);
    var k, i;
    if (atributos) for (k in atributos) if (Object.prototype.hasOwnProperty.call(atributos, k)) n.setAttribute(k, atributos[k]);
    if (filhos) {
      for (i = 0; i < filhos.length; i++) {
        if (filhos[i] == null) continue;
        n.appendChild(typeof filhos[i] === 'string' ? document.createTextNode(filhos[i]) : filhos[i]);
      }
    }
    return n;
  }

  function injetaCss() {
    if (document.getElementById('vm-faixa-css')) return;
    var s = document.createElement('style');
    s.id = 'vm-faixa-css';
    s.appendChild(document.createTextNode(CSS));
    (document.head || document.documentElement).appendChild(s);
  }

  // numero do WhatsApp: o mesmo que a pagina ja' usa (botao flutuante primeiro, depois qualquer link wa.me)
  function numeroWhats() {
    var candidatos = [document.querySelector('a.wa-float[href]'), document.querySelector('a[href*="wa.me/"]')];
    for (var i = 0; i < candidatos.length; i++) {
      var a = candidatos[i];
      var m = a && /wa\.me\/(\d{10,15})/.exec(a.getAttribute('href') || '');
      if (m) return m[1];
    }
    return WA_SITE;
  }

  function tiraFaixa() {
    var f = document.getElementById(ID_FAIXA);
    if (f && f.parentNode) f.parentNode.removeChild(f);
  }

  function mostraFaixa(t) {
    if (!t || fechada() || !document.body) return;
    if (document.getElementById(ID_FAIXA)) return;
    var botao = el('button', { type: 'button', 'class': 'vm-faixa-fechar', 'aria-label': 'Fechar aviso da Alpha Week' });
    var faixa = el('div', { id: ID_FAIXA, role: 'region', 'aria-label': 'Campanha Alpha Week Alphaville' }, [
      el('div', { 'class': 'vm-faixa-in' }, [
        el('p', { 'class': 'vm-faixa-txt' }, [
          el('strong', null, [T_FORTE]), t.resto + ' ',
          el('a', { href: t.href }, [t.link])
        ]),
        botao
      ])
    ]);
    botao.addEventListener('click', function () {
      try {
        gravaFechada();
        var tinhaFoco = faixa.contains(document.activeElement);
        tiraFaixa();
        if (tinhaFoco) focar(document.querySelector('#menu-site .ms-logo, a[href], button'));
      } catch (e) {}
    });
    document.body.insertBefore(faixa, document.body.firstChild);
  }

  // onde entra a secao: logo depois do hero; sem hero, depois do topo (.topo, o hero do /alphaville/); sem os dois,
  // no comeco do <main>; sem main, depois do primeiro <header> que nao seja o menu do site; por ultimo, logo depois
  // do menu
  function pontoDaSecao() {
    var menu = document.getElementById('menu-site');
    var hero = document.querySelector('section.hero, .hero, #hero') || document.querySelector('section.topo');
    if (hero && hero.parentNode && !(menu && menu.contains(hero))) return [hero.parentNode, hero.nextSibling];
    var main = document.querySelector('main');
    if (main) return [main, main.firstChild];
    var hs = document.getElementsByTagName('header');
    for (var i = 0; i < hs.length; i++) {
      if (hs[i] !== menu && hs[i].parentNode) return [hs[i].parentNode, hs[i].nextSibling];
    }
    if (menu && menu.parentNode) return [menu.parentNode, menu.nextSibling];
    return [document.body, document.body.firstChild];
  }

  // mensagem do WhatsApp para simular o parcelamento (janela e secao usam a mesma)
  function msgParcela(nome) {
    return 'Ol\u00E1! Quero simular o parcelamento em 60x do ' + nome + '.';
  }

  function garanteSecao(nome, fixo) {
    var existente = document.getElementById(ID_SECAO);
    if (existente) return existente;
    var wa = 'https://wa.me/' + numeroWhats() + '?text=' +
      encodeURIComponent('Ol\u00E1! Quero consultar as condi\u00E7\u00F5es \u00E0 vista da Alpha Week no ' + nome + '.');
    var secao = el('section', { id: ID_SECAO, 'class': 'vm-aw', 'aria-labelledby': 'alpha-week-h2' }, [
      el('div', { 'class': 'vm-aw-in' }, [
        el('p', { 'class': 'vm-aw-rotulo' }, ['Campanha da Alphaville \u00B7 15 a 30/11/2026']),
        el('h2', { id: 'alpha-week-h2' }, [fixo ?
          'Alpha Week Alphaville, de 15 a 30/11/2026: 20% de desconto \u00E0 vista nos 5 primeiros lotes residenciais vendidos' :
          'Alpha Week Alphaville, de 15 a 30/11/2026: at\u00E9 20% de desconto \u00E0 vista em lotes selecionados']),
        fixo ? el('p', null, [
          'Na Alpha Week da Alphaville, o ' + nome + ' tem desconto de ',
          el('b', null, ['20% sobre o valor total']),
          ' em qualquer lote residencial, com pagamento integral \u00E0 vista, para os 5 primeiros lotes vendidos. As regras, conforme a arte e o folder oficiais da Alphaville:'
        ]) : el('p', null, [
          'Na Alpha Week da Alphaville, lotes residenciais selecionados de 11 empreendimentos t\u00EAm desconto de ',
          el('b', null, ['at\u00E9 20% sobre o valor total']),
          ', com pagamento integral \u00E0 vista. O ' + nome + ' est\u00E1 entre eles. As regras, conforme o folder oficial da campanha:'
        ]),
        el('ul', null, [
          el('li', null, [fixo ?
            'Desconto de 20% sobre o valor total, em qualquer lote residencial do ' + nome + ', com pagamento integral \u00E0 vista.' :
            'Desconto de at\u00E9 20% sobre o valor total; o percentual depende da unidade, da disponibilidade e da confirma\u00E7\u00E3o de elegibilidade pela Alphaville.']),
          // no Indaiatuba a arte diz "qualquer lote": falar em "5 unidades participantes" sugeriria 5 lotes ja' escolhidos
          el('li', null, ['Vale para os 5 primeiros lotes vendidos no ' + nome + ' durante a campanha' +
            (fixo ? '.' : ' (s\u00E3o as 5 unidades participantes do folder).')]),
          el('li', null, ['\u00C9 preciso formalizar o Compromisso de Compra e Venda at\u00E9 30/11/2026, com pagamento integral \u00E0 vista, em parcela \u00FAnica, conforme as condi\u00E7\u00F5es contratuais.']),
          // o "desconto por prazo" so' existe na ficha do Alphaville Indaiatuba; nas outras fica so' a regra do folder
          el('li', null, ['N\u00E3o se soma a outras condi\u00E7\u00F5es comerciais especiais' +
            (nome === 'Alphaville Indaiatuba' ? ', inclusive ao desconto por prazo da condi\u00E7\u00E3o normal da tabela.' : '.')]),
          el('li', null, ['Vale de 15 a 30/11/2026 ou at\u00E9 serem vendidos os 5 primeiros lotes, o que ocorrer primeiro.'])
        ]),
        el('p', null, [
          el('a', { 'class': 'vm-aw-btn', href: wa, target: '_blank', rel: 'noopener' }, ['Consultar condi\u00E7\u00F5es \u00E0 vista no WhatsApp'])
        ]),
        // parcelamento: so' no Alphaville Indaiatuba; depois do botao a' vista, para nao disputar com ele
        nome === PARCELA_EM ? el('p', { 'class': 'vm-aw-parcela' }, [
          el('b', null, ['N\u00E3o vai pagar \u00E0 vista?']),
          ' Na condi\u00E7\u00E3o normal da tabela, a entrada pode ser paga em at\u00E9 3x e o saldo vai em at\u00E9 60x sem juros, corrigido mensalmente pelo IPCA \u2014 sem o desconto da Alpha Week. ',
          el('a', { href: 'https://wa.me/' + numeroWhats() + '?text=' + encodeURIComponent(msgParcela(nome)), target: '_blank', rel: 'noopener',
            'data-cta': 'secao-parcelamento' }, ['Simule o seu lote pelo WhatsApp']),
          '.'
        ]) : null,
        el('p', { 'class': 'vm-aw-nota' }, [
          (fixo ? 'Fonte: arte do ' + nome + ' e folder oficial da campanha Alpha Week da Alphaville, recebidos em 13/11/2026.' :
            'Fonte: folder oficial da campanha Alpha Week da Alphaville, recebido em 13/11/2026.') +
          ' Regulamento completo no site oficial da Alphaville: ',
          el('a', { href: REGULAMENTO, target: '_blank', rel: 'noopener' }, ['alphaville.com.br/regulamento/alphaville']),
          '.'
        ])
      ])
    ]);
    var ponto = pontoDaSecao();
    ponto[0].insertBefore(secao, ponto[1]);
    return secao;
  }

  // mensagem do WhatsApp da secao do /alphaville/ (nenhum empreendimento escolhido ainda)
  var MSG_HUB = 'Ol\u00E1! Quero consultar as condi\u00E7\u00F5es \u00E0 vista da Alpha Week Alphaville.';

  // secao do /alphaville/: quais sao os 11 participantes e as regras, versao "ate' 20%" (o Alphaville Indaiatuba, com
  // 20% em qualquer lote pela arte dele, aparece assim na lista e na 1a regra)
  function garanteSecaoHub() {
    var existente = document.getElementById(ID_SECAO);
    if (existente) return existente;
    var lista = el('ul', { 'class': 'vm-aw-lista' });
    for (var i = 0; i < PARTICIPANTES.length; i++) {
      var pt = PARTICIPANTES[i];
      var fixo = descontoFixo(pt[0], pt[2]);
      lista.appendChild(el('li', fixo ? { 'class': 'vm-aw-fixo' } : null, [
        pt[2] ? el('a', { 'class': 'vm-aw-emp-nome', href: '/' + pt[2] + '/' }, [pt[0]]) : el('b', { 'class': 'vm-aw-emp-nome' }, [pt[0]]),
        el('span', { 'class': 'vm-aw-emp-info' }, [
          el('span', { 'class': 'vm-aw-emp-cid' }, [pt[1]]), ' \u00B7 ',
          el('b', { 'class': 'vm-aw-emp-pct' }, [fixo ? '20% em qualquer lote residencial' : 'at\u00E9 20%'])
        ])
      ]));
    }
    var wa = 'https://wa.me/' + numeroWhats() + '?text=' + encodeURIComponent(MSG_HUB);
    var secao = el('section', { id: ID_SECAO, 'class': 'vm-aw vm-aw-hub', 'aria-labelledby': 'alpha-week-h2' }, [
      el('div', { 'class': 'vm-aw-in' }, [
        el('p', { 'class': 'vm-aw-rotulo' }, ['Campanha da Alphaville \u00B7 15 a 30/11/2026']),
        el('h2', { id: 'alpha-week-h2' }, ['Alpha Week Alphaville, de 15 a 30/11/2026: at\u00E9 20% de desconto \u00E0 vista em lotes selecionados']),
        el('p', null, [
          'Na Alpha Week da Alphaville, lotes residenciais selecionados dos empreendimentos participantes t\u00EAm desconto de ',
          el('b', null, ['at\u00E9 20% sobre o valor total']),
          ', com pagamento integral \u00E0 vista. S\u00E3o 5 unidades participantes por empreendimento, e o percentual depende do lote.'
        ]),
        el('h3', null, ['Os 11 empreendimentos participantes']),
        lista,
        el('p', { 'class': 'vm-aw-fora' }, ['Os demais empreendimentos desta p\u00E1gina, como as Casas Alphaville Dom Pedro 0, n\u00E3o participam.']),
        el('h3', null, ['As regras, conforme o folder oficial da campanha']),
        el('ul', { 'class': 'vm-aw-regras' }, [
          el('li', null, ['Desconto de at\u00E9 20% sobre o valor total; o percentual depende do lote, da disponibilidade e da confirma\u00E7\u00E3o de elegibilidade pela Alphaville. No Alphaville Indaiatuba, 20% em qualquer lote residencial.']),
          el('li', null, ['Pagamento integral \u00E0 vista, em parcela \u00FAnica, conforme as condi\u00E7\u00F5es contratuais.']),
          el('li', null, ['\u00C9 preciso formalizar o Compromisso de Compra e Venda at\u00E9 30/11/2026.']),
          el('li', null, ['N\u00E3o se soma a outras condi\u00E7\u00F5es comerciais especiais.']),
          el('li', null, ['Vale de 15 a 30/11/2026 ou at\u00E9 acabarem as 5 unidades participantes de cada empreendimento, o que ocorrer primeiro.'])
        ]),
        el('p', null, [
          el('a', { 'class': 'vm-aw-btn', href: wa, target: '_blank', rel: 'noopener', 'data-cta': 'secao-hub' }, ['Consultar condi\u00E7\u00F5es \u00E0 vista no WhatsApp'])
        ]),
        el('p', { 'class': 'vm-aw-nota' }, [
          'Fonte: folder oficial da campanha Alpha Week da Alphaville, recebido em 13/11/2026; no Alphaville Indaiatuba, tamb\u00E9m a arte da Alphaville para ele, recebida na mesma data.' +
          ' Regulamento completo no site oficial da Alphaville: ',
          el('a', { href: REGULAMENTO, target: '_blank', rel: 'noopener' }, ['alphaville.com.br/regulamento/alphaville']),
          '.'
        ])
      ])
    ]);
    var ponto = pontoDaSecao();
    ponto[0].insertBefore(secao, ponto[1]);
    return secao;
  }

  // a secao entra depois do carregamento, entao o navegador pode nao ter rolado ate' o #alpha-week sozinho
  function rolaParaSecao(secao, mexeu) {
    if (!secao || mexeu() || String(location.hash || '').toLowerCase() !== '#' + ID_SECAO) return;
    try { secao.scrollIntoView({ block: 'start', behavior: 'auto' }); } catch (e) { try { secao.scrollIntoView(true); } catch (e2) {} }
  }

  // paginas com secao (as que participam e o /alphaville/): secao, faixa e, com #alpha-week no endereco, rola ate' ela
  function iniciaComSecao(criaSecao, textos) {
    var mexido = false;
    function marca() { mexido = true; }
    function mexeu() { return mexido; }
    var secao = criaSecao();
    mostraFaixa(textos);
    rolaParaSecao(secao, mexeu);
    if (document.readyState !== 'complete') {
      var tipos = ['wheel', 'touchstart', 'keydown', 'mousedown'];
      for (var i = 0; i < tipos.length; i++) window.addEventListener(tipos[i], marca, { passive: true, capture: true });
      window.addEventListener('load', function () {
        try { rolaParaSecao(document.getElementById(ID_SECAO), mexeu); } catch (e) {}
      });
    }
  }

  function iniciaParticipa(p) {
    var nome = nomeDoEmpreendimento(p);
    var fixo = descontoFixo(nome, p);
    iniciaComSecao(function () { return garanteSecao(nome, fixo); }, fixo ? TEXTOS.indaiatuba : TEXTOS.participa);
  }

  // mapa: a faixa acompanha o #. A lista do mapa troca o # por history.replaceState, que nao dispara
  // hashchange; por isso tambem se confere logo depois de cada clique.
  function iniciaMapa() {
    function confere() {
      try {
        if (agora() > FIM) { expira(); return; }
        if (mapaNoAlphaville()) { mostraFaixa(TEXTOS.geral); mostraSelo(true); }
        else { tiraFaixa(); mostraSelo(false); }
      } catch (e) {}
    }
    window.addEventListener('hashchange', confere);
    window.addEventListener('popstate', confere);
    document.addEventListener('click', function () { setTimeout(confere, 0); });
    confere();
  }

  // ======== DESTAQUE: janela que abre sozinha 1 vez por sessao + selo flutuante que a reabre ========
  var TIPO = '';          // participa | hub | geral | dompedro | mapa
  var CFG = null;         // textos da janela e do selo desta pagina
  var J = null;           // a janela, criada na primeira abertura
  var timerJanela = 0, timerRelogio = 0, timerSelo = 0, tentativas = 0, esperandoVisivel = false;
  var ultimoToque = -1e9;   // performance.now() do ultimo toque/tecla: a janela nao salta no meio de um clique

  function relogioMs() {
    try { return window.performance.now(); } catch (e) { return new Date().getTime(); }
  }

  function marcaToque() { ultimoToque = relogioMs(); }

  function mapaNoAlphaville() {
    return /alphaville/i.test(String(location.hash || ''));
  }

  // o navegador guarda a marca da sessao? Com cookies bloqueados o sessionStorage da' erro (e no Safari privado antigo
  // so' a gravacao da' erro): sem isso a janela abriria em toda pagina
  var LEMBRA = null;
  function podeLembrar() {
    if (LEMBRA === null) {
      try {
        window.sessionStorage.setItem(CHAVE_JANELA + '-t', '1');
        window.sessionStorage.removeItem(CHAVE_JANELA + '-t');
        LEMBRA = true;
      } catch (e) { LEMBRA = false; }
    }
    return LEMBRA;
  }

  // chegou agora ao site (endereco digitado, anuncio, outro site), e nao de outra pagina daqui
  function chegouDeFora() {
    var m = /^https?:\/\/([^\/?#]+)/i.exec(String(document.referrer || ''));
    return !m || m[1].toLowerCase() !== String(location.host || '').toLowerCase();
  }

  // sem como lembrar, a janela so' abre sozinha na chegada ao site, nunca de pagina em pagina
  function vista() {
    if (!podeLembrar()) return !chegouDeFora();
    try { return window.sessionStorage.getItem(CHAVE_JANELA) === '1'; } catch (e) { return true; }
  }

  function gravaVista() {
    try { window.sessionStorage.setItem(CHAVE_JANELA, '1'); } catch (e) {}
  }

  // 20% so' no Alphaville Indaiatuba (arte dele); Alvorada, Guarajuba 4, Ceara 5, Terras Ceara 6, paginas gerais, mapa e
  // Dom Pedro: "ate' 20%" do folder.
  // A mensagem do WhatsApp e' a mesma da secao #alpha-week (garanteSecao).
  function configDestaque(tipo, p) {
    var periodo = 'De 15 a 30/11/2026';
    var msgNo = 'Ol\u00E1! Quero consultar as condi\u00E7\u00F5es \u00E0 vista da Alpha Week no ';
    // o folder vale "de 15 a 30/11/2026 ou ate' o esgotamento das unidades participantes": a contagem so' mostra a data,
    // entao a nota diz que acaba antes se os 5 lotes forem vendidos (como a nota do Indaiatuba)
    var notaAte = function (limite) {
      return 'O percentual depende da unidade, da disponibilidade e da confirma\u00E7\u00E3o de elegibilidade pela Alphaville. ' +
        'Pagamento integral \u00E0 vista, em parcela \u00FAnica, com Compromisso de Compra e Venda at\u00E9 30/11/2026. ' + limite +
        ' N\u00E3o se soma a outras condi\u00E7\u00F5es. ';
    };
    var limiteCada = 'Vale at\u00E9 acabarem os 5 lotes de cada empreendimento.';
    if (tipo === 'participa') {
      var nome = nomeDoEmpreendimento(p);
      var fixo = descontoFixo(nome, p);
      return {
        ate: !fixo,
        // "selecionados" como o folder e o titulo da secao; no Indaiatuba a arte diz qualquer lote
        alvo: fixo ? 'em qualquer lote residencial do ' + nome : 'em lotes residenciais selecionados do ' + nome,
        fichas: [periodo, '5 primeiros lotes vendidos'],
        msg: msgNo + nome + '.',
        regras: '#' + ID_SECAO, regrasTxt: 'Ver as regras',
        parcela: nome === PARCELA_EM ? msgParcela(nome) : '',
        nota: fixo ? 'Desconto sobre o valor total, com pagamento integral \u00E0 vista, em parcela \u00FAnica, e Compromisso de Compra e Venda at\u00E9 30/11/2026. ' +
          'Vale at\u00E9 serem vendidos os 5 primeiros lotes. N\u00E3o se soma a outras condi\u00E7\u00F5es, inclusive ao desconto por prazo da tabela. ' :
          notaAte('Vale at\u00E9 serem vendidos os 5 primeiros lotes.')
      };
    }
    if (tipo === 'dompedro') {
      return {
        ate: true,
        alvo: 'em lotes residenciais selecionados de 11 empreendimentos da Alphaville',
        aviso: ['As casas do Dom Pedro 0 n\u00E3o participam', ' da Alpha Week. O desconto vale para lotes, como os do Alphaville Indaiatuba.'],
        fichas: [periodo, '5 lotes por empreendimento'],
        msg: msgNo + 'Alphaville Indaiatuba.',
        regras: DESTINO, regrasTxt: 'Ver lotes do Alphaville Indaiatuba',
        nota: notaAte(limiteCada)
      };
    }
    return {   // /alphaville/, artigo e mapa (#alphaville)
      ate: true,
      alvo: 'em lotes residenciais selecionados de 11 empreendimentos da Alphaville, entre eles o Alphaville Indaiatuba',
      fichas: [periodo, '5 lotes por empreendimento'],
      msg: 'Ol\u00E1! Quero consultar as condi\u00E7\u00F5es \u00E0 vista da Alpha Week da Alphaville.',
      // as regras de todos (lista dos 11) ficam na secao do /alphaville/: no proprio hub, so' rola ate' ela
      regras: tipo === 'hub' ? '#' + ID_SECAO : HUB, regrasTxt: 'Ver as regras',
      nota: notaAte(limiteCada)
    };
  }

  function restante() {
    var r = Math.max(0, FIM - agora());
    return { d: Math.floor(r / 864e5), h: Math.floor((r % 864e5) / 36e5), m: Math.floor((r % 36e5) / 6e4) };
  }

  function dois(n) { return (n < 10 ? '0' : '') + n; }

  function criaJanela(cfg) {
    var cx = function (rotulo) {
      var b = el('b', null, ['00']), s = el('small', null, [rotulo]);
      return { el: el('span', { 'class': 'vm-awj-cx' }, [b, s]), num: b, rot: s };
    };
    var cd = cx('dias'), ch = cx('horas'), cm = cx('min');
    var rotConta = el('p', { 'class': 'vm-awj-conta-rot', 'aria-hidden': 'true' }, ['Termina em']);
    var leitor = el('span', { 'class': 'vm-awj-so-leitor' }, ['']);
    var conta = el('div', { 'class': 'vm-awj-conta', role: 'timer', 'aria-live': 'off', 'aria-atomic': 'true' }, [
      rotConta, leitor, el('div', { 'class': 'vm-awj-caixas', 'aria-hidden': 'true' }, [cd.el, ch.el, cm.el])
    ]);
    var fichas = el('ul', { 'class': 'vm-awj-fichas' });
    for (var i = 0; i < cfg.fichas.length; i++) fichas.appendChild(el('li', null, [cfg.fichas[i]]));
    var wa = el('a', { 'class': 'vm-awj-wa', href: 'https://wa.me/' + numeroWhats() + '?text=' + encodeURIComponent(cfg.msg),
      target: '_blank', rel: 'noopener', 'data-cta': 'janela' }, ['Quero o desconto no WhatsApp']);
    var regras = el('a', { 'class': 'vm-awj-regras', href: cfg.regras }, [cfg.regrasTxt]);
    // parcelamento (so' no Alphaville Indaiatuba): bloco discreto depois do botao principal e das regras, antes da nota
    var parcWa = null, parc = null;
    if (cfg.parcela) {
      parcWa = el('a', { 'class': 'vm-awj-parc-wa', href: 'https://wa.me/' + numeroWhats() + '?text=' + encodeURIComponent(cfg.parcela),
        target: '_blank', rel: 'noopener', 'data-cta': 'janela-parcelamento' }, ['Simular parcelamento no WhatsApp']);
      parc = el('div', { 'class': 'vm-awj-parc' }, [
        el('p', { 'class': 'vm-awj-parc-tit' }, ['Prefere parcelar?']),
        el('p', { 'class': 'vm-awj-parc-txt' }, ['Na condi\u00E7\u00E3o normal da tabela: entrada em at\u00E9 3x e saldo em at\u00E9 60x sem juros, corrigido pelo IPCA. Sem o desconto da Alpha Week.']),
        parcWa
      ]);
    }
    var fechar = el('button', { type: 'button', 'class': 'vm-awj-fechar', 'aria-label': 'Fechar' });
    var caixa = el('div', { 'class': 'vm-awj-caixa', role: 'dialog', 'aria-modal': 'true', tabindex: '-1',
      'aria-labelledby': 'vm-awj-marca vm-awj-oferta', 'aria-describedby': 'vm-awj-vista vm-awj-alvo' + (cfg.aviso ? ' vm-awj-aviso' : '') }, [
      el('p', { id: 'vm-awj-marca', 'class': 'vm-awj-marca' }, ['Alpha Week']),
      el('h2', { id: 'vm-awj-oferta', 'class': 'vm-awj-oferta' }, [
        cfg.ate ? el('span', { 'class': 'vm-awj-ate' }, ['at\u00E9']) : null, cfg.ate ? ' ' : null,
        el('span', { 'class': 'vm-awj-num' }, ['20%']), ' ', el('span', { 'class': 'vm-awj-off' }, ['OFF'])
      ]),
      el('p', { id: 'vm-awj-vista', 'class': 'vm-awj-vista' }, ['para pagamento \u00E0 vista']),
      el('p', { id: 'vm-awj-alvo', 'class': 'vm-awj-alvo' }, [cfg.alvo]),
      cfg.aviso ? el('p', { id: 'vm-awj-aviso', 'class': 'vm-awj-aviso' }, [el('b', null, [cfg.aviso[0]]), cfg.aviso[1]]) : null,
      fichas, conta, wa, regras, parc,
      el('p', { 'class': 'vm-awj-nota' }, [cfg.nota, el('a', { href: REGULAMENTO, target: '_blank', rel: 'noopener' }, ['Regulamento da Alphaville']), '.']),
      fechar
    ]);
    var raiz = el('div', { id: ID_JANELA, hidden: 'hidden' }, [caixa]);
    var j = { raiz: raiz, caixa: caixa, aberta: false, antes: null, cd: cd, ch: ch, cm: cm, rotConta: rotConta, leitor: leitor, foraDown: false };

    fechar.addEventListener('click', function () { fechaJanela(true); });
    // clique fora: so' quando o toque comecou e terminou no fundo (arrastar uma selecao de dentro para fora nao fecha)
    var desce = function (e) { j.foraDown = e.target === raiz; };
    raiz.addEventListener(window.PointerEvent ? 'pointerdown' : 'mousedown', desce);
    raiz.addEventListener('click', function (e) { if (e.target === raiz && j.foraDown) fechaJanela(true); j.foraDown = false; });
    // regras: fecha antes de o navegador seguir o link (no proprio empreendimento, rola ate' a secao)
    regras.addEventListener('click', function () { fechaJanela(false); });
    // WhatsApp: deixa o clique seguir inteiro (atrib.js carimba o codigo, GA4 conta whatsapp_click) e fecha depois
    wa.addEventListener('click', function () { setTimeout(function () { fechaJanela(true); }, 0); });
    if (parcWa) parcWa.addEventListener('click', function () { setTimeout(function () { fechaJanela(true); }, 0); });
    document.body.appendChild(raiz);
    return j;
  }

  function atualizaContagem() {
    if (!J) return;
    var r = restante();
    J.cd.num.textContent = String(r.d); J.cd.rot.textContent = r.d === 1 ? 'dia' : 'dias';
    J.ch.num.textContent = dois(r.h); J.ch.rot.textContent = r.h === 1 ? 'hora' : 'horas';
    J.cm.num.textContent = dois(r.m);
    while (J.rotConta.firstChild) J.rotConta.removeChild(J.rotConta.firstChild);
    if (r.d === 0) J.rotConta.appendChild(el('b', null, ['\u00DAltimo dia!']));
    J.rotConta.appendChild(document.createTextNode((r.d === 0 ? ' ' : '') + 'Termina em'));
    J.leitor.textContent = (r.d === 0 ? '\u00DAltimo dia! ' : '') + 'Faltam ' + r.d + (r.d === 1 ? ' dia, ' : ' dias, ') +
      r.h + (r.h === 1 ? ' hora e ' : ' horas e ') + r.m + (r.m === 1 ? ' minuto' : ' minutos') + ' para o fim da campanha.';
  }

  function focaveis() {
    var l = J.caixa.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'), r = [];
    for (var i = 0; i < l.length; i++) if (l[i].getClientRects().length) r.push(l[i]);
    return r;
  }

  function teclaJanela(e) {
    if (!J || !J.aberta) return;
    var k = e.key || '';
    if (k === 'Escape' || k === 'Esc' || e.keyCode === 27) { e.preventDefault(); fechaJanela(true); return; }
    if (k !== 'Tab' && e.keyCode !== 9) return;
    var f = focaveis(), at = document.activeElement;
    if (!f.length) { e.preventDefault(); focar(J.caixa); return; }
    var dentro = J.caixa.contains(at);
    if (e.shiftKey) {
      if (!dentro || at === J.caixa || at === f[0]) { e.preventDefault(); focar(f[f.length - 1]); }
    } else if (!dentro || at === f[f.length - 1]) { e.preventDefault(); focar(f[0]); }
  }

  function focoJanela(e) {
    if (J && J.aberta && e.target && !J.caixa.contains(e.target)) focar(J.caixa);
  }

  // trava a rolagem da pagina por baixo da janela; com barra de rolagem fixa (computador), reserva o espaco dela
  // para a pagina nao pular para o lado
  function travaRolagem(sim) {
    var h = document.documentElement;
    try {
      if (sim) {
        J.ov = h.style.overflow;
        J.sg = h.style.getPropertyValue('scrollbar-gutter');
        var barra = (window.innerWidth || 0) - h.clientWidth > 0;
        h.style.overflow = 'hidden';
        if (barra) h.style.setProperty('scrollbar-gutter', 'stable');
      } else {
        h.style.overflow = J.ov || '';
        if (J.sg) h.style.setProperty('scrollbar-gutter', J.sg); else h.style.removeProperty('scrollbar-gutter');
        if (!h.getAttribute('style')) h.removeAttribute('style');
      }
    } catch (e) {}
  }

  function abreJanela(origem) {
    if (!CFG || !document.body) return;
    if (agora() > FIM) { expira(); return; }
    if (!J) J = criaJanela(CFG);
    if (J.aberta) return;
    J.antes = origem || document.activeElement;
    atualizaContagem();
    travaRolagem(true);
    J.raiz.hidden = false;
    J.aberta = true;
    gravaVista();
    document.addEventListener('keydown', teclaJanela, true);
    document.addEventListener('focusin', focoJanela, true);
    focar(J.caixa);
  }

  function fechaJanela(devolveFoco) {
    if (!J || !J.aberta) return;
    J.aberta = false;
    document.removeEventListener('keydown', teclaJanela, true);
    document.removeEventListener('focusin', focoJanela, true);
    J.raiz.hidden = true;
    travaRolagem(false);
    var a = J.antes;
    J.antes = null;
    if (devolveFoco && a && a !== document.body && document.documentElement.contains(a)) focar(a);
    var s = document.getElementById(ID_SELO);
    if (s && !s.hidden) pulsa(s);
  }

  // pulsacao curta (3 x 1,6 s, menos de 5 s): na chegada e quando a janela fecha, para mostrar onde reabrir
  function pulsa(s) {
    s.classList.remove('vm-aw-pulsa');
    void s.offsetWidth;
    s.classList.add('vm-aw-pulsa');
  }

  function criaSelo(cfg) {
    var s = el('button', { type: 'button', id: ID_SELO, 'aria-haspopup': 'dialog',
      'aria-label': 'Alpha Week ' + (cfg.ate ? 'at\u00E9 ' : '') + '20% OFF: ver a oferta para pagamento \u00E0 vista' }, [
      el('span', { 'class': 'vm-aw-selo-a' }, ['Alpha Week']),
      el('span', { 'class': 'vm-aw-selo-b' }, cfg.ate ? [el('small', null, ['at\u00E9']), ' 20% OFF'] : ['20% OFF'])
    ]);
    s.addEventListener('click', function () { abreJanela(s); });
    return s;
  }

  // o selo fica no canto inferior esquerdo, acima do que ja' esta' fixo ali (barra do WhatsApp do celular no artigo e
  // no mapa, botao "Bairros e lotes" e escala do mapa); no mapa do computador, dentro da area do mapa (a lista e o
  // rodape dela ficam a' esquerda)
  var EVITAR = '.bo-barra, .barra-wa, .btn-lista, .solar-rodape, .wa-float, .wa-float-home, .float-wpp, .whats-flutuante, ' +
    '.leaflet-bottom.leaflet-left .leaflet-control';
  // visivel de fato: o rodape do modo "sol" do mapa fica no DOM com o pai em opacity:0
  function aparece(n) {
    for (; n && n.nodeType === 1 && n !== document.body; n = n.parentNode) {
      var cs = window.getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    }
    return true;
  }

  function posicionaSelo() {
    var s = document.getElementById(ID_SELO);
    if (!s || s.hidden) return;
    var esq = 16;
    var mapa = TIPO === 'mapa' && document.getElementById('mapa');
    if (mapa) {
      var rm = mapa.getBoundingClientRect();
      if (rm.width > 0 && rm.left > 0) esq = Math.round(rm.left) + 12;
    }
    var larg = s.offsetWidth || 120;
    var alt = window.innerHeight || document.documentElement.clientHeight;
    var fundo = 0;
    var l = document.querySelectorAll(EVITAR);
    for (var i = 0; i < l.length; i++) {
      var r = l[i].getBoundingClientRect();
      if (!r.width || !r.height || r.top < alt * 0.5 || r.top >= alt) continue;
      if (r.right <= esq - 6 || r.left >= esq + larg + 6) continue;
      if (!aparece(l[i])) continue;
      fundo = Math.max(fundo, Math.ceil(alt - r.top) + 10);
    }
    s.style.left = esq + 'px';
    s.style.bottom = fundo ? fundo + 'px' : 'calc(16px + env(safe-area-inset-bottom, 0px))';
  }

  function posicionaSeloDepois() {
    if (timerSelo) return;
    timerSelo = setTimeout(function () { timerSelo = 0; try { posicionaSelo(); } catch (e) {} }, 60);
  }

  function mostraSelo(sim) {
    var s = document.getElementById(ID_SELO);
    if (!s) return;
    if (!sim) {
      fechaJanela(false);
      s.hidden = true;
      return;
    }
    if (s.hidden) {
      s.hidden = false;
      pulsa(s);
    }
    posicionaSeloDepois();
  }

  // nao abre sozinha por cima de outra coisa que a pessoa esta' usando
  function ocupado() {
    if (relogioMs() - ultimoToque < 1200) return true;   // acabou de tocar em algo (WhatsApp, Sou corretor, menu, link)
    if (document.querySelector('dialog[open]')) return true;
    var menu = document.getElementById('menu-site');
    if (menu && menu.classList.contains('ms-aberto')) return true;
    if (document.body.classList.contains('gaveta')) return true;   // lista do mapa aberta no celular
    var a = document.activeElement;
    if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) return true;
    var m = document.querySelectorAll('[aria-modal="true"]');
    for (var i = 0; i < m.length; i++) if (!(J && J.raiz.contains(m[i])) && m[i].getClientRects().length) return true;
    return false;
  }

  function agendaJanela(ms) {
    clearTimeout(timerJanela);
    timerJanela = setTimeout(tentaAbrir, ms);
  }

  function tentaAbrir() {
    try {
      if (vista() || (J && J.aberta) || agora() > FIM) return;
      var s = document.getElementById(ID_SELO);
      if (!s || s.hidden) return;   // mapa fora do #alphaville
      // veio direto para as regras (link "Ver condicoes", anuncio): a janela nao cobre o que a pessoa quer ler
      if ((TIPO === 'participa' || TIPO === 'hub') && String(location.hash || '').toLowerCase() === '#' + ID_SECAO) return;
      if (document.hidden) {
        if (!esperandoVisivel) {
          esperandoVisivel = true;
          document.addEventListener('visibilitychange', function volta() {
            if (document.hidden) return;
            document.removeEventListener('visibilitychange', volta);
            esperandoVisivel = false;
            agendaJanela(ESPERA_JANELA);
          });
        }
        return;
      }
      if (ocupado()) { if (++tentativas <= 10) agendaJanela(2000); return; }
      abreJanela(null);
    } catch (e) {}
  }

  function tique() {
    try {
      if (agora() > FIM) expira();
      else if (J && J.aberta) atualizaContagem();
    } catch (e) {}
  }

  // passou de 30/11/2026 23:59:59 com a pagina aberta: tira janela, selo e faixa
  function expira() {
    clearInterval(timerRelogio);
    clearTimeout(timerJanela);
    fechaJanela(false);
    var s = document.getElementById(ID_SELO);
    if (s && s.parentNode) s.parentNode.removeChild(s);
    if (J && J.raiz.parentNode) J.raiz.parentNode.removeChild(J.raiz);
    J = null;
    tiraFaixa();
  }

  function iniciaDestaque(tipo, p) {
    if (document.getElementById(ID_SELO)) return;
    TIPO = tipo;
    CFG = configDestaque(tipo, p);
    var s = criaSelo(CFG);
    if (tipo === 'mapa' && !mapaNoAlphaville()) s.hidden = true;
    document.body.appendChild(s);
    if (!s.hidden) pulsa(s);
    posicionaSeloDepois();
    window.addEventListener('resize', posicionaSeloDepois);
    window.addEventListener('load', posicionaSeloDepois);
    // mapa: o modo "sol" liga um rodape por cima do mapa (com transicao de .22s); confere de novo depois de cada clique
    // ou tecla (em captura: o controle do Leaflet nao deixa o clique subir ate' o documento)
    if (tipo === 'mapa') {
      var depois = function () { setTimeout(function () { try { posicionaSelo(); } catch (e) {} }, 350); };
      document.addEventListener('click', depois, true);
      document.addEventListener('keyup', depois, true);
    }
    timerRelogio = setInterval(tique, 15000);
    // no mapa, so' abre sozinha se a pagina ja' chegou no Alphaville; escolher o Alphaville depois mostra so' o selo
    if (vista() || s.hidden) return;
    document.addEventListener(window.PointerEvent ? 'pointerdown' : 'mousedown', marcaToque, true);
    document.addEventListener('keydown', marcaToque, true);
    if (document.readyState === 'complete') agendaJanela(ESPERA_JANELA);
    else window.addEventListener('load', function () { agendaJanela(ESPERA_JANELA); });
    setTimeout(tentaAbrir, ESPERA_MAXIMA);
  }

  function inicia() {
    try {
      if (!document.body || agora() > FIM) return;
      var p = caminho();
      var tipo = tipoDaPagina(p);
      if (!tipo) return;
      injetaCss();
      // destaque primeiro (o mapa ja' o usa ao conferir o #); em try proprio: um erro nele nao derruba a faixa
      try { iniciaDestaque(tipo, p); } catch (e) {}
      if (tipo === 'participa') iniciaParticipa(p);
      else if (tipo === 'hub') iniciaComSecao(garanteSecaoHub, TEXTOS.hub);
      else if (tipo === 'mapa') iniciaMapa();
      else mostraFaixa(TEXTOS[tipo]);
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia);
  else inicia();
})();
