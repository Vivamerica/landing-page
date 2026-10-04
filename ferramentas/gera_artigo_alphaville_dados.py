# -*- coding: utf-8 -*-
# Monta o artigo "O que é Alphaville" reaproveitando a casca de um artigo do
# blog (head, estilos, header, rodape e o rastreio de clique nas ofertas) e
# trocando o miolo.
#
# TODO numero daqui veio de documento entregue a CVM pela Alphaville S.A. e esta
# citado no texto com o documento e a data. O site institucional da empresa foi
# usado so para o que nao e numero, porque a pagina de historico de la nao tem
# data de atualizacao e fala em "mais de 47 anos" para uma empresa de 1973.
import io, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

SLUG = 'o-que-e-alphaville'
HOJE = '2026-10-04'

TITULO = 'O que é Alphaville? História, números e o que a marca virou'
H1 = 'O que é Alphaville, afinal?'
DESC = 'Alphaville nasceu em 1973 em Barueri e hoje tem 138 empreendimentos em 23 estados, segundo documentos da CVM. E por que o nome virou sinônimo de condomínio.'

MIOLO = '''
<p class="lead">Quando alguém diz que vai morar "num alphaville", raramente está falando da empresa.
A palavra virou categoria — e isso não é impressão nossa: é o que a própria companhia escreve, com
todas as letras, num documento entregue à Comissão de Valores Mobiliários.</p>

<p>Este texto reconstrói a história da marca a partir das fontes que ela é obrigada a assinar: o
Formulário de Referência, o prospecto da abertura de capital e os resultados trimestrais entregues à
CVM. Não usamos o site institucional para número nenhum — a página de histórico de lá não tem data
de atualização e ainda fala em "mais de 47 anos" de existência para uma empresa fundada em 1973,
que hoje tem 53.</p>

<h2 id="origem">1973: dois engenheiros e uma fazenda em Barueri</h2>

<p>O Formulário de Referência descreve a origem em uma frase:</p>

<blockquote>"A origem da Alphaville data de 1973, quando Renato Albuquerque e Yojiro Takaoka
perceberam a demanda por residências de alto nível na Cidade de Barueri e desenvolveram o conceito
de Alphaville Residencial, que foi sucesso na região."
<cite>Formulário de Referência da Alphaville S.A., versão de 30/06/2026, entregue à CVM</cite></blockquote>

<p>Os dois eram sócios da construtora Albuquerque &amp; Takaoka. O terreno veio da antiga Fazenda
Tamboré, na divisa de Barueri com Santana de Parnaíba, na região metropolitana de São Paulo. O
primeiro Alphaville não é um município nem um bairro de uma cidade só: ele nasceu sobre dois
municípios, o que até hoje confunde quem procura o endereço.</p>

<h3>O nome vem de uma distopia</h3>

<p>"Alphaville" é o título de um filme de <b>Jean-Luc Godard, de 1965</b> — uma ficção científica em
que uma cidade é governada por um computador e o sentimento é proibido por lei. O maior símbolo
brasileiro de vida em condomínio foi batizado com o nome de uma cidade onde ninguém pode sentir.</p>

<p>A ironia é boa demais para passar batido, mas também explica algo do projeto: Alphaville foi
concebido como <em>cidade planejada</em>, não como bairro que cresce sozinho. O controle é o produto.</p>

<figure class="grafico">
  <img src="images/linha-do-tempo.svg" alt="Linha do tempo da Alphaville de 1973 a 2025, com os marcos registrados no Formulário de Referência" width="1180" height="560" loading="lazy">
  <figcaption>Os marcos que a companhia registra no Formulário de Referência entregue à CVM.</figcaption>
</figure>

<h2 id="escala">O tamanho da coisa hoje</h2>

<p>Os números abaixo são os da versão mais recente do Formulário de Referência:</p>

<ul class="numeros">
  <li><b>138 empreendimentos entregues</b>, em mais de 70 cidades, em 23 estados</li>
  <li><b>Mais de 78 projetos</b> entregues só nos últimos dez anos</li>
  <li><b>24 empreendimentos</b> nos últimos cinco anos, em 15 cidades</li>
  <li><b>2025 foi o ano recorde de entregas</b>: 8 empreendimentos, 2.047 lotes, R$ 1,2 bilhão em VGV</li>
</ul>

<p>Vale olhar a série, porque ela mostra o ritmo. No Formulário de 2020, a companhia declarava "mais
de 130 empreendimentos" e "mais de 46 anos de atuação". No de 2026, são 138 e mais de 50 anos. Ou
seja: oito entregas a mais em seis anos, com um 2025 que sozinho respondeu por oito delas — a
retomada depois da reformulação do modelo de negócio feita em 2019.</p>

<h2 id="estados">Em quantos estados, afinal?</h2>

<p>Aqui vale parar, porque a própria companhia dá três respostas diferentes — e nenhuma delas vem
com a lista.</p>

<p>O Formulário de Referência diz que a Alphaville "está presente em 23 estados, além do Distrito
Federal". A frase é a mesma no Formulário de 2020, no de 2024 e no de 2026. No mesmo documento em
que "mais de 130 empreendimentos" foi atualizado para 138, o número de estados não se mexeu em seis
anos. É um número cumulativo, de quem já pisou no estado algum dia — não de onde a empresa está
operando agora.</p>

<p>Os relatórios trimestrais contam outra história, e são mais recentes. O ITR do segundo trimestre
de 2026, entregue em 13 de agosto, diz que o banco de terrenos está distribuído por
<b>18 estados</b>. E o ITR do quarto trimestre de 2025 diz que as entregas daquele ano saíram em
<b>6 estados</b>. Ou seja: 23 é o acumulado de meio século, 18 é onde há terra hoje e 6 é onde a
obra saiu do papel no último ano fechado.</p>

<p>Como nenhum documento lista as praças, fomos atrás de uma por uma. Chegamos a <b>20 estados mais
o Distrito Federal</b>, em três níveis de certeza: os que têm lote à venda hoje no catálogo oficial,
os que aparecem nomeados em algum documento entregue à CVM, e os que só pudemos confirmar fora da
CVM — por registro de CEP dos Correios, por associação de moradores do próprio empreendimento ou
por imprensa local datada. Os seis que faltam para fechar os 23 estão, provavelmente, entre Acre,
Amapá, Pará, Rondônia e Roraima; de Santa Catarina o próprio site informa nenhum empreendimento.</p>

<figure class="grafico">
  <img src="images/mapa-estados.svg" alt="Mapa esquemático do Brasil em grade, com os estados coloridos em três níveis: lote à venda hoje, empreendimento nomeado em documento da CVM e empreendimento confirmado em fonte pública" width="853" height="821" loading="lazy">
  <figcaption>Vinte estados e o Distrito Federal verificados praça por praça, em três níveis de
  evidência. Passando o mouse sobre cada bloco aparece o empreendimento e a fonte. Em cinza, os seis
  que não conseguimos confirmar — o que não quer dizer que a companhia nunca tenha estado lá, apenas
  que não achamos documento que prove.</figcaption>
</figure>

<p>Dois cuidados que mudaram o resultado. O primeiro: sigla de estado solta em documento da CVM não
é empreendimento. A seção de processos judiciais do Formulário cita foro em meio país, e Porto Velho
e Bayeux entraram ali como tribunal, não como loteamento. Por isso cada praça foi conferida pelo
nome do produto. O segundo: "Alphaville" virou nome genérico de condomínio, e há empreendimento
chamado Alphaville que não é da Alphaville S.A. Belém ficou de fora por isso — existe um condomínio
com esse nome na cidade, mas não encontramos nada que o ligue à companhia.</p>

<h2 id="linhas">Nem todo Alphaville é Alphaville</h2>

<p>Esta é a parte que quase ninguém sabe, e que muda o que você está comprando. A companhia opera
<b>três linhas de produto</b>, separadas pelo tamanho do lote:</p>

<table class="tabela">
  <thead><tr><th>Linha</th><th>Lote</th><th>Posicionamento</th></tr></thead>
  <tbody>
    <tr><td><b>Alphaville</b></td><td>a partir de 360 m²</td><td>residencial de alto padrão</td></tr>
    <tr><td><b>Terras Alpha</b></td><td>250 a 360 m²</td><td>lotes médios</td></tr>
    <tr><td><b>Jardim Alpha</b></td><td>200 a 250 m²</td><td>lote de entrada</td></tr>
  </tbody>
</table>

<p class="fonte-tabela">Fonte: Formulário de Referência da Alphaville S.A., versão de 30/06/2026.
A companhia registra no INPI, entre outras, as marcas "Alphaville", "Terras Alpha", "Jardim Alpha",
"Cidade Alpha", "Alpha Inova" e "Fundação Alphaville".</p>

<p>Na prática: "Terras Alpha Uberaba" e "Alphaville Indaiatuba" carregam a mesma marca-mãe e o mesmo
padrão construtivo, mas não são o mesmo produto. Quando alguém diz que comprou "no Alphaville", a
primeira pergunta útil é <em>qual linha</em>.</p>

<p>Há ainda as <b>Cidades Alpha</b>, que o Formulário descreve como projetos que "concentram todos
os atributos de um centro urbano em uma mesma região" — residencial, comercial e empresarial no
mesmo complexo. A Cidade Alpha Ceará, em Eusébio, na região metropolitana de Fortaleza, é o exemplo
que os documentos mais citam.</p>

<h2 id="sinonimo">O que "Alphaville" quer dizer hoje</h2>

<p>A resposta está escrita pela própria empresa, num documento em que mentir é crime:</p>

<blockquote>"...sendo a única empresa do segmento a estar presente em 23 estados e em mais de 70
cidades do país, assim como conforme pesquisas realizadas pelo Instituto de Pesquisa IdeaBR em 2017
e 2018, <b>sendo a marca muitas vezes utilizada como sinônimo de condomínios fechados no
Brasil</b>."
<cite>Formulário de Referência 2020 da Alphaville S.A., entregue à CVM em 19/05/2021</cite></blockquote>

<p>É um caso raro: a marca virou o nome da categoria, como acontece com gilete e xerox. A diferença
é que aqui o fenômeno foi reconhecido pela própria titular, em documento público, e sustentado em
pesquisa de terceiro.</p>

<p>Isso tem uma consequência prática para quem compra. Muito loteamento fechado é vendido com o
argumento de ser "um alphaville" sem ter relação alguma com a empresa. Vale conferir a marca no
contrato, não no anúncio.</p>

<h2 id="juridico">Loteamento fechado não é condomínio — e isso muda a sua conta</h2>

<p>Aqui está o ponto técnico que mais confunde comprador, e que vale para qualquer empreendimento
desse tipo, com ou sem a marca Alphaville.</p>

<p><b>Loteamento</b> é regido pela <b>Lei nº 6.766/1979</b>. Nele, as ruas e as áreas públicas são
transferidas ao município: a via é pública, mesmo com portaria. O fechamento se dá por concessão ou
permissão de uso da prefeitura, e a manutenção fica com uma associação de moradores.</p>

<p><b>Condomínio de lotes</b> só passou a existir em lei com a <b>Lei nº 13.465/2017</b>, que incluiu
o art. 1.358-A no Código Civil. Nele as vias são privadas, parte da área comum, e a cobrança segue a
lógica condominial.</p>

<p>A diferença aparece no bolso em três momentos: <b>quem é dono da rua</b>, <b>como se cobra de quem
não paga</b> e <b>o que acontece se a associação quebrar</b>. O Formulário de Referência da Alphaville
descreve o modelo de gestão pós-entrega assim:</p>

<blockquote>"Após a entrega, os proprietários das unidades, por meio das Associações de Moradores,
são responsáveis por zelar e manter a preservação do condomínio e do meio ambiente, o que se tornou
um diferencial de valorização dos projetos."
<cite>Formulário de Referência da Alphaville S.A., versão de 30/06/2026</cite></blockquote>

<p>Antes de assinar, pergunte sob qual das duas leis o empreendimento foi aprovado. A resposta está
na matrícula e no memorial de incorporação, não no material de vendas.</p>

<h2 id="sentimento">O sentimento: desejo de um lado, debate do outro</h2>

<p>Falar em Alphaville desperta duas reações, e ignorar uma delas seria desonesto.</p>

<p><b>De um lado, o desejo.</b> Segurança, lazer dentro de casa, vizinhança previsível, um endereço
que comunica posição. O produto promete isso e entrega — e é por isso que a marca sustenta preço
premium há cinco décadas.</p>

<p><b>De outro, o debate acadêmico.</b> O modelo é provavelmente o caso mais estudado do urbanismo
brasileiro recente. A antropóloga <b>Teresa Pires do Rio Caldeira</b>, em <cite>Cidade de Muros:
crime, segregação e cidadania em São Paulo</cite>, cunhou o conceito de <b>"enclaves
fortificados"</b> — espaços privatizados, fechados e monitorados para morar, consumir e trabalhar,
apresentados ao comprador como o oposto da cidade. O primeiro Alphaville é o caso central do livro.
A discussão segue viva: a revista <cite>Novos Estudos</cite> publicou uma revisão do conceito 25
anos depois.</p>

<p>Não cabe a uma imobiliária arbitrar esse debate. Cabe dizer que ele existe, porque quem investe
quase R$ 1 milhão num lote merece saber que está entrando num modelo urbano com nome, história e
literatura própria — e sai mais seguro da decisão, não menos.</p>

<p>E há uma simetria difícil de ignorar: a marca nasceu com o nome de uma distopia sobre uma cidade
onde o sentimento é proibido, e virou, no Brasil, o nome do lugar onde as pessoas dizem que se
sentem em casa.</p>

<h2 id="indaiatuba">E em Indaiatuba?</h2>

<p>O <b>Alphaville Indaiatuba</b> fica no bairro do Itaici e é da <b>linha principal</b> — a de lote
a partir de 360 m². Na tabela de setembro de 2026 são 131 lotes à venda, de 511 a 1.249 m², de
R$ 888.939 a R$ 1.609.896, com ato de 20% e saldo em 60 meses sem juros.</p>

<p>Ele aparece na vitrine do site da própria marca, ao lado de praças como Guarajuba, Litoral Norte
e Dom Pedro.</p>

<p class="cta-inline"><a href="/alphaville-indaiatuba/" data-emp="alphaville-indaiatuba">Ver os lotes
do Alphaville Indaiatuba, com metragem e valor &rarr;</a></p>

<p>Se quiser comparar com os outros condomínios fechados da cidade antes de decidir, o
<a href="/mapa-lotes-indaiatuba/">mapa de lotes</a> mostra os 131 lotes do Alphaville posicionados um
a um, ao lado de mais de 2.300 lotes de outros 25 loteamentos de Indaiatuba, com preço em cada um.</p>

<h2 id="fontes">De onde saiu cada número</h2>

<p>Todos os dados de empreendimentos, estados, cidades e linhas de produto deste artigo vêm de
documentos que a Alphaville S.A. entrega à Comissão de Valores Mobiliários — a autarquia federal que
fiscaliza o mercado de capitais. São documentos auditados, datados e públicos:</p>

<ul class="fontes">
  <li><b>Formulário de Referência, versão 3</b> — entregue em 30/06/2026</li>
  <li><b>Formulário de Referência 2024</b> — entregue em 03/12/2024</li>
  <li><b>Formulário de Referência 2020</b> — entregue em 19/05/2021</li>
  <li><b>Prospecto Preliminar da Oferta Pública</b> — 05/11/2020</li>
  <li><b>ITR 2T26</b> — 13/08/2026 · <b>ITR 4T25</b> — 31/03/2026</li>
  <li><b>Releases de resultados</b> de 2020 e do 4T23</li>
</ul>

<p>A bibliografia sobre enclaves fortificados é de Teresa Pires do Rio Caldeira
(<cite>Cidade de Muros</cite>, Edusp/Editora 34) e da revisão publicada em
<cite>Novos Estudos CEBRAP</cite>.</p>
'''

FAQ = [
    ('O que significa Alphaville?',
     'Alphaville é a marca de uma empresa de loteamentos fundada em 1973 por Renato Albuquerque e '
     'Yojiro Takaoka, em Barueri (SP). O nome vem do filme homônimo de Jean-Luc Godard, de 1965. '
     'No Brasil, a palavra passou a ser usada como sinônimo de condomínio fechado — o que a própria '
     'companhia registra no Formulário de Referência entregue à CVM.'),
    ('Quantos empreendimentos a Alphaville já entregou?',
     'Mais de 138 empreendimentos, em mais de 70 cidades e 23 estados, segundo o Formulário de '
     'Referência da Alphaville S.A. na versão de 30/06/2026. Nos últimos dez anos foram mais de 78 '
     'projetos; em 2025, ano recorde de entregas, foram 8 empreendimentos e 2.047 lotes.'),
    ('Qual a diferença entre Alphaville, Terras Alpha e Jardim Alpha?',
     'É o tamanho do lote. A linha Alphaville tem lotes a partir de 360 m²; a Terras Alpha, de 250 a '
     '360 m²; e a Jardim Alpha, de 200 a 250 m². As três são da mesma companhia e seguem o mesmo '
     'padrão construtivo, mas atendem a faixas diferentes.'),
    ('Alphaville é condomínio ou loteamento fechado?',
     'Depende do empreendimento. Loteamento é regido pela Lei nº 6.766/1979 — as vias são públicas e '
     'a manutenção fica com uma associação de moradores. Condomínio de lotes só existe em lei desde '
     'a Lei nº 13.465/2017, que incluiu o art. 1.358-A no Código Civil, e nele as vias são privadas. '
     'A diferença muda quem é dono da rua e como se cobra de quem não paga. Confira na matrícula.'),
    ('De onde vem o nome Alphaville?',
     'Do filme "Alphaville", de Jean-Luc Godard, lançado em 1965 — uma distopia em que uma cidade é '
     'governada por um computador e o sentimento é proibido.'),
    ('Em quantos estados a Alphaville atua?',
     'Depende do que se pergunta, e a própria companhia dá três respostas. O Formulário de '
     'Referência diz 23 estados além do Distrito Federal, mas é um acumulado de mais de 50 anos: a '
     'frase está igual nas versões de 2020, 2024 e 2026 e não lista quais. O ITR do segundo '
     'trimestre de 2026 diz que o banco de terrenos está em 18 estados. E o ITR do quarto trimestre '
     'de 2025 diz que as entregas daquele ano saíram em 6 estados. Verificando praça por praça, '
     'chegamos a 20 estados mais o Distrito Federal, dos quais 7 mais o DF têm lote à venda hoje: '
     'São Paulo, Paraná, Ceará, Piauí, Bahia, Minas Gerais, Espírito Santo e o Distrito Federal.'),
    ('Existe Alphaville em Indaiatuba?',
     'Sim. O Alphaville Indaiatuba fica no bairro do Itaici e pertence à linha principal da marca, de '
     'lotes a partir de 360 m². Na tabela de setembro de 2026 são 131 lotes à venda, de 511 a '
     '1.249 m², a partir de R$ 888.939, com ato de 20% e saldo em 60 meses sem juros.'),
]
