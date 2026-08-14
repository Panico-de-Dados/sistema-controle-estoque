// ===========================================================
// Configuração central da API.
// Se o backend estiver em outro endereço, ajuste API_BASE_URL
// (por exemplo, ao publicar em produção).
// ===========================================================
const API_BASE_URL = '/api';

async function apiRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  let body = null;
  const texto = await res.text();
  if (texto) {
    try { body = JSON.parse(texto); } catch { body = texto; }
  }

  if (!res.ok) {
    const mensagem = body?.error || body?.erro || `Erro ${res.status} ao chamar ${path}`;
    throw new Error(mensagem);
  }
  return body;
}

const api = {
  // Famílias
  listarFamilias: () => apiRequest('/familias'),
  criarFamilia: (dados) => apiRequest('/familias', { method: 'POST', body: JSON.stringify(dados) }),
  editarFamilia: (id, dados) => apiRequest(`/familias/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  excluirFamilia: (id) => apiRequest(`/familias/${id}`, { method: 'DELETE' }),

  // Tipos
  listarTipos: (familiaId) => apiRequest(`/tipos${familiaId ? `?familia_id=${familiaId}` : ''}`),
  criarTipo: (dados) => apiRequest('/tipos', { method: 'POST', body: JSON.stringify(dados) }),
  editarTipo: (id, dados) => apiRequest(`/tipos/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  excluirTipo: (id) => apiRequest(`/tipos/${id}`, { method: 'DELETE' }),

  // Produtos
  listarProdutos: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/produtos${qs ? `?${qs}` : ''}`);
  },
  buscarProdutoPorCodigo: (codigo) => apiRequest(`/produtos/codigo/${encodeURIComponent(codigo)}`),
  proximoCodigo: (familiaId, tipoId) => apiRequest(`/produtos/proximo-codigo?familia_id=${familiaId}&tipo_id=${tipoId}`),
  criarProduto: (dados) => apiRequest('/produtos', { method: 'POST', body: JSON.stringify(dados) }),
  editarProduto: (id, dados) => apiRequest(`/produtos/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  excluirProduto: (id) => apiRequest(`/produtos/${id}`, { method: 'DELETE' }),

  // Movimentações
  listarMovimentacoes: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/movimentacoes${qs ? `?${qs}` : ''}`);
  },
  registrarEntrada: (dados) => apiRequest('/movimentacoes/entrada', { method: 'POST', body: JSON.stringify(dados) }),
  registrarSaida: (dados) => apiRequest('/movimentacoes/saida', { method: 'POST', body: JSON.stringify(dados) })
};
