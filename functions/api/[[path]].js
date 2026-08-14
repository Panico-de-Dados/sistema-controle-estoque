export async function onRequest({ request, env, params }) {
  if (!env.BACKEND_API_URL || !env.BACKEND_API_TOKEN) {
    return respostaJson(503, 'O proxy da API ainda nao foi configurado no Cloudflare Pages.');
  }

  let backendUrl;
  try {
    backendUrl = new URL(env.BACKEND_API_URL);
  } catch {
    return respostaJson(503, 'BACKEND_API_URL possui um valor invalido.');
  }

  if (backendUrl.protocol !== 'https:') {
    return respostaJson(503, 'BACKEND_API_URL deve utilizar HTTPS.');
  }

  const partes = Array.isArray(params.path)
    ? params.path
    : String(params.path || '').split('/').filter(Boolean);
  const caminhoSeguro = partes.map((parte) => encodeURIComponent(parte)).join('/');
  backendUrl.pathname = `${backendUrl.pathname.replace(/\/$/, '')}/api/${caminhoSeguro}`;
  backendUrl.search = new URL(request.url).search;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const accept = request.headers.get('accept');
  if (contentType) headers.set('content-type', contentType);
  if (accept) headers.set('accept', accept);
  headers.set('authorization', `Bearer ${env.BACKEND_API_TOKEN}`);

  const init = {
    method: request.method,
    headers,
    redirect: 'manual'
  };
  if (!['GET', 'HEAD'].includes(request.method)) init.body = request.body;

  try {
    const respostaBackend = await fetch(backendUrl.toString(), init);
    const respostaHeaders = new Headers(respostaBackend.headers);
    respostaHeaders.set('cache-control', 'no-store');
    return new Response(respostaBackend.body, {
      status: respostaBackend.status,
      statusText: respostaBackend.statusText,
      headers: respostaHeaders
    });
  } catch (error) {
    console.error('Falha ao acessar o backend:', error);
    return respostaJson(502, 'Nao foi possivel acessar o backend da aplicacao.');
  }
}

function respostaJson(status, error) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store'
    }
  });
}
