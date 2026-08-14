const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

async function executar() {
  const raiz = path.join(__dirname, '..');
  const obrigatorios = [
    'backend/api/index.js',
    'backend/vercel.json',
    'functions/_middleware.js',
    'functions/api/[[path]].js',
    'frontend/_headers',
    'frontend/_routes.json',
    'frontend/vendor/qrcode.min.js',
    'frontend/vendor/html5-qrcode.min.js'
  ];

  for (const relativo of obrigatorios) {
    if (!fs.existsSync(path.join(raiz, relativo))) {
      throw new Error(`Arquivo necessario ausente: ${relativo}`);
    }
  }

  const proxyUrl = pathToFileURL(path.join(raiz, 'functions', 'api', '[[path]].js')).href;
  const middlewareUrl = pathToFileURL(path.join(raiz, 'functions', '_middleware.js')).href;
  const proxy = await import(proxyUrl);
  const middleware = await import(middlewareUrl);

  let chamada;
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    chamada = {
      url,
      authorization: init.headers.get('authorization'),
      method: init.method
    };
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };

  try {
    const resposta = await proxy.onRequest({
      request: new Request('https://estoque.pages.dev/api/health?teste=1'),
      env: {
        BACKEND_API_URL: 'https://estoque-api.vercel.app',
        BACKEND_API_TOKEN: 'segredo-teste'
      },
      params: { path: ['health'] }
    });

    if (
      resposta.status !== 200
      || chamada.url !== 'https://estoque-api.vercel.app/api/health?teste=1'
      || chamada.authorization !== 'Bearer segredo-teste'
      || chamada.method !== 'GET'
    ) {
      throw new Error('O proxy do Cloudflare nao encaminhou a requisicao corretamente.');
    }
  } finally {
    globalThis.fetch = fetchOriginal;
  }

  const basic = Buffer.from('operador:senha-forte').toString('base64');
  const contexto = {
    request: new Request('https://estoque.pages.dev/', {
      headers: { authorization: `Basic ${basic}` }
    }),
    env: { APP_USERNAME: 'operador', APP_PASSWORD: 'senha-forte' },
    next: async () => new Response('ok')
  };
  const autorizada = await middleware.onRequest(contexto);
  const negada = await middleware.onRequest({
    ...contexto,
    request: new Request('https://estoque.pages.dev/')
  });

  if (autorizada.status !== 200 || negada.status !== 401) {
    throw new Error('A autenticacao do Cloudflare nao respondeu como esperado.');
  }

  console.log('Arquivos de deploy: OK');
  console.log('Proxy Cloudflare -> Vercel: OK');
  console.log('Autenticacao do Cloudflare: OK');
}

executar().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
