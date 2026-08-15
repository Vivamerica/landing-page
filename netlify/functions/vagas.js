/**
 * GET /api/vagas
 * Retorna quantas vagas restam na campanha da quermesse e se ela esta aberta.
 *
 * Fonte da contagem, em ordem de preferencia:
 *   1. API do Netlify Forms (contagem REAL de submissoes) — exige a variavel
 *      de ambiente NETLIFY_ACCESS_TOKEN configurada no painel do Netlify.
 *   2. Se o token nao estiver configurado, devolve enviados = null. O front
 *      entao aplica apenas a janela de tempo, sem travar por quantidade.
 *
 * Nunca derruba a pagina: em qualquer erro responde 200 com enviados = null.
 */

const LIMITE       = 20;
const FORM_NAME    = 'cupom-quermesse';
const ABRE_EM_UTC  = 1786762800000; // 15/08/2026 00:00 BRT
const FECHA_EM_UTC = 1786935599000; // 16/08/2026 23:59:59 BRT

export default async (request, context) => {
  const agora = Date.now();
  const dentroDaJanela = agora >= ABRE_EM_UTC && agora <= FECHA_EM_UTC;

  const base = {
    limite: LIMITE,
    abreEm: ABRE_EM_UTC,
    fechaEm: FECHA_EM_UTC,
    dentroDaJanela,
    agora,
  };

  const headers = {
    'content-type': 'application/json; charset=utf-8',
    // 60s de cache: alivia a API do Netlify sem deixar o contador defasado
    'cache-control': 'public, max-age=60, s-maxage=60',
    'access-control-allow-origin': '*',
  };

  const token  = process.env.NETLIFY_ACCESS_TOKEN;
  const siteId = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;

  if (!token || !siteId) {
    // sem token configurado: so a janela de tempo controla
    return new Response(
      JSON.stringify({ ...base, enviados: null, restantes: null, aberto: dentroDaJanela, fonte: 'sem-token' }),
      { status: 200, headers }
    );
  }

  try {
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    const rForms = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/forms`, auth);
    if (!rForms.ok) throw new Error('forms ' + rForms.status);
    const forms = await rForms.json();

    const form = forms.find(f => f.name === FORM_NAME);
    if (!form) {
      // formulario ainda nao apareceu no painel (nenhuma submissao ate agora)
      return new Response(
        JSON.stringify({ ...base, enviados: 0, restantes: LIMITE, aberto: dentroDaJanela, fonte: 'form-inexistente' }),
        { status: 200, headers }
      );
    }

    // submission_count ja vem no objeto do form — evita paginar as submissoes
    let enviados = typeof form.submission_count === 'number' ? form.submission_count : null;

    if (enviados === null) {
      const rSubs = await fetch(`https://api.netlify.com/api/v1/forms/${form.id}/submissions?per_page=100`, auth);
      if (!rSubs.ok) throw new Error('subs ' + rSubs.status);
      enviados = (await rSubs.json()).length;
    }

    const restantes = Math.max(0, LIMITE - enviados);

    return new Response(
      JSON.stringify({
        ...base,
        enviados,
        restantes,
        aberto: dentroDaJanela && restantes > 0,
        fonte: 'netlify-api',
      }),
      { status: 200, headers }
    );
  } catch (e) {
    // erro na API: nao trava a campanha, cai para o controle so por tempo
    return new Response(
      JSON.stringify({ ...base, enviados: null, restantes: null, aberto: dentroDaJanela, fonte: 'erro', erro: String(e.message || e) }),
      { status: 200, headers }
    );
  }
};

export const config = { path: '/api/vagas' };
