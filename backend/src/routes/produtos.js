const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { pad, validarCodigoCompleto, lerInteiro, textoObrigatorio, textoOpcional } = require('../utils/codigo');
const { dadoUnico, responderErroBanco } = require('../utils/resposta');

const SELECT_COMPLETO = '*, familias(nome), tipos(nome)';

// GET /api/produtos -> lista com filtros opcionais
// query params: q (busca por nome ou código), familia_id, tipo_id, baixo_estoque=true
router.get('/', async (req, res) => {
  const { q, familia_id, tipo_id, baixo_estoque } = req.query;

  let query = supabase.from('produtos').select(SELECT_COMPLETO).order('codigo_completo');

  if (familia_id) query = query.eq('familia_id', familia_id);
  if (tipo_id) query = query.eq('tipo_id', tipo_id);
  if (q) {
    const termo = String(q).trim().slice(0, 100).replace(/[,()*%_\\]/g, '');
    if (termo) query = query.or(`nome.ilike.%${termo}%,codigo_completo.ilike.%${termo}%`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const resultado = baixo_estoque === 'true'
    ? data.filter((p) => p.quantidade <= p.estoque_minimo)
    : data;

  res.json(resultado);
});

// GET /api/produtos/proximo-codigo?familia_id=&tipo_id= -> pré-visualização do próximo código (DEVE VIR ANTES de /codigo/:codigo!)
router.get('/proximo-codigo', async (req, res) => {
  const { familia_id, tipo_id } = req.query;
  if (!familia_id || !tipo_id) {
    return res.status(400).json({ error: 'Informe familia_id e tipo_id.' });
  }

  try {
    const codigo = await gerarProximoCodigoProduto(familia_id, tipo_id);
    res.json({ proximo_codigo: codigo.codigo_completo, produto_codigo: codigo.produto_codigo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/produtos/codigo/:codigo -> busca por código completo (usado pelo scanner)
router.get('/codigo/:codigo', async (req, res) => {
  const codigo = req.params.codigo.trim();
  if (!validarCodigoCompleto(codigo)) {
    return res.status(400).json({ error: 'Código inválido. Formato esperado: FFF.TTT.PPPP' });
  }

  const { data, error } = await supabase
    .from('produtos')
    .select(SELECT_COMPLETO)
    .eq('codigo_completo', codigo)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Nenhum produto encontrado com esse código.' });
  res.json(data);
});

// POST /api/produtos -> cadastra produto e gera automaticamente o código FFF.TTT.PPPP
router.post('/', async (req, res) => {
  const { familia_id, tipo_id } = req.body;
  const nome = textoObrigatorio(req.body.nome, 160);
  const descricao = textoOpcional(req.body.descricao, 1000);
  const localizacao = textoOpcional(req.body.localizacao, 250);
  const quantidade = lerInteiro(req.body.quantidade ?? 0);
  const estoque_minimo = lerInteiro(req.body.estoque_minimo ?? 0);

  if (!familia_id || !tipo_id || !nome) {
    return res.status(400).json({ error: 'Os campos "familia_id", "tipo_id" e "nome" são obrigatórios.' });
  }
  if (descricao === undefined || localizacao === undefined || quantidade === null || estoque_minimo === null) {
    return res.status(400).json({ error: 'Revise descricao, localizacao, quantidade e estoque minimo.' });
  }

  const { data: criado, error } = await supabase.rpc('criar_produto', {
    p_familia_id: familia_id,
    p_tipo_id: tipo_id,
    p_nome: nome,
    p_descricao: descricao,
    p_localizacao: localizacao,
    p_quantidade: quantidade,
    p_estoque_minimo: estoque_minimo
  });
  if (error) return responderErroBanco(res, error, 'Nao foi possivel criar o produto.');

  const produto = dadoUnico(criado);
  const { data: completo, error: erroBusca } = await supabase
    .from('produtos').select(SELECT_COMPLETO).eq('id', produto.id).single();
  if (erroBusca) return responderErroBanco(res, erroBusca, 'Produto criado, mas nao foi possivel consulta-lo.');
  res.status(201).json(completo);
});

// PUT /api/produtos/:id -> edita dados cadastrais (não altera o código nem a quantidade)
router.put('/:id', async (req, res) => {
  const nome = textoObrigatorio(req.body.nome, 160);
  const descricao = textoOpcional(req.body.descricao, 1000);
  const localizacao = textoOpcional(req.body.localizacao, 250);
  const estoque_minimo = lerInteiro(req.body.estoque_minimo);
  if (!nome || descricao === undefined || localizacao === undefined || estoque_minimo === null) {
    return res.status(400).json({ error: 'Revise os dados do produto.' });
  }

  const { data, error } = await supabase
    .from('produtos')
    .update({ nome, descricao, localizacao, estoque_minimo })
    .eq('id', req.params.id)
    .select(SELECT_COMPLETO)
    .maybeSingle();

  if (error) return responderErroBanco(res, error, 'Nao foi possivel atualizar o produto.');
  if (!data) return res.status(404).json({ error: 'Produto nao encontrado.' });
  res.json(data);
});

// DELETE /api/produtos/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('produtos').delete().eq('id', req.params.id);
  if (error?.code === '23503') {
    return res.status(409).json({
      error: 'Este produto possui movimentacoes registradas e nao pode ser excluido, pois o historico precisa ser preservado.'
    });
  }
  if (error) return responderErroBanco(res, error, 'Nao foi possivel excluir o produto.');
  res.status(204).send();
});

// --- helper interno: calcula o próximo PPPP dentro de uma família+tipo ---
async function gerarProximoCodigoProduto(familia_id, tipo_id) {
  const { data: familia, error: errFamilia } = await supabase
    .from('familias').select('codigo').eq('id', familia_id).single();
  if (errFamilia || !familia) throw new Error('Família não encontrada.');

  const { data: tipo, error: errTipo } = await supabase
    .from('tipos').select('codigo').eq('id', tipo_id).eq('familia_id', familia_id).single();
  if (errTipo || !tipo) throw new Error('Tipo não encontrado.');

  const { data: ultimos, error: errBusca } = await supabase
    .from('produtos')
    .select('produto_codigo')
    .eq('familia_id', familia_id)
    .eq('tipo_id', tipo_id)
    .order('produto_codigo', { ascending: false })
    .limit(1);
  if (errBusca) throw new Error(errBusca.message);

  const proximoNumero = ultimos.length ? parseInt(ultimos[0].produto_codigo, 10) + 1 : 1;
  const produto_codigo = pad(proximoNumero, 4);

  return {
    familia,
    tipo,
    produto_codigo,
    codigo_completo: `${familia.codigo}.${tipo.codigo}.${produto_codigo}`
  };
}

module.exports = router;
