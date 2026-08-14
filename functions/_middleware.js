export async function onRequest(context) {
  const usuarioEsperado = context.env.APP_USERNAME;
  const senhaEsperada = context.env.APP_PASSWORD;

  if (!usuarioEsperado || !senhaEsperada) {
    return new Response('Configure APP_USERNAME e APP_PASSWORD no Cloudflare Pages.', {
      status: 503,
      headers: {
        'content-type': 'text/plain; charset=UTF-8',
        'cache-control': 'no-store'
      }
    });
  }

  const authorization = context.request.headers.get('authorization') || '';
  const credenciais = lerBasicAuth(authorization);
  const autorizado = credenciais
    && comparacaoConstante(credenciais.usuario, usuarioEsperado)
    && comparacaoConstante(credenciais.senha, senhaEsperada);

  if (!autorizado) {
    return new Response('Autenticacao necessaria.', {
      status: 401,
      headers: {
        'www-authenticate': 'Basic realm="Arquivo Morto", charset="UTF-8"',
        'content-type': 'text/plain; charset=UTF-8',
        'cache-control': 'no-store'
      }
    });
  }

  return context.next();
}

function lerBasicAuth(authorization) {
  if (!authorization.startsWith('Basic ')) return null;
  try {
    const texto = atob(authorization.slice(6));
    const separador = texto.indexOf(':');
    if (separador < 0) return null;
    return {
      usuario: texto.slice(0, separador),
      senha: texto.slice(separador + 1)
    };
  } catch {
    return null;
  }
}

function comparacaoConstante(recebido, esperado) {
  const encoder = new TextEncoder();
  const a = encoder.encode(recebido);
  const b = encoder.encode(esperado);
  const tamanho = Math.max(a.length, b.length);
  let diferenca = a.length ^ b.length;
  for (let i = 0; i < tamanho; i += 1) {
    diferenca |= (a[i] || 0) ^ (b[i] || 0);
  }
  return diferenca === 0;
}
