const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { validarCodigoCompleto, lerInteiro, textoObrigatorio, textoOpcional } = require('../utils/codigo');
const { responderErroBanco } = require('../utils/resposta');

// Historico com filtros executados pelo PostgreSQL.
router.get('/', async (req, res) => {
  const { codigo, nome, familia_id, tipo_id, tipo, data_inicio, data_fim } = req.query;
  let query = supabase
    .from('movimentacoes')
    .select('*, produtos!inner(codigo_completo, nome, familia_id, tipo_id)')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (tipo && ['entrada', 'saida'].includes(tipo)) query = query.eq('tipo', tipo);
  if (data_inicio) query = query.gte('created_at', data_inicio);
  if (data_fim) query = query.lte('created_at', data_fim);
  if (codigo) query = query.ilike('produtos.codigo_completo', `%${String(codigo).slice(0, 20)}%`);
  if (nome) query = query.ilike('produtos.nome', `%${String(nome).slice(0, 100)}%`);
  if (familia_id) query = query.eq('produtos.familia_id', familia_id);
  if (tipo_id) query = query.eq('produtos.tipo_id', tipo_id);

  const { data, error } = await query;
  if (error) return responderErroBanco(res, error, 'Nao foi possivel consultar o historico.');
  res.json(data);
});

async function registrar(req, res, tipo) {
  const codigo = typeof req.body.codigo_completo === 'string'
    ? req.body.codigo_completo.trim()
    : '';
  const quantidade = lerInteiro(req.body.quantidade, { minimo: 1 });
  const responsavel = textoObrigatorio(req.body.responsavel, 120);
  const motivo = textoOpcional(req.body.motivo, 500);

  if (!validarCodigoCompleto(codigo)) {
    return res.status(400).json({ error: 'Codigo invalido. Formato esperado: FFF.TTT.PPPP' });
  }
  if (quantidade === null) {
    return res.status(400).json({ error: 'Informe uma quantidade inteira maior que zero.' });
  }
  if (!responsavel) return res.status(400).json({ error: 'Informe o responsavel.' });
  if (tipo === 'saida' && !motivo) {
    return res.status(400).json({ error: 'Informe o motivo da retirada.' });
  }
  if (motivo === undefined) return res.status(400).json({ error: 'O motivo deve ter ate 500 caracteres.' });

  const { data, error } = await supabase.rpc('registrar_movimentacao', {
    p_codigo_completo: codigo,
    p_tipo: tipo,
    p_quantidade: quantidade,
    p_responsavel: responsavel,
    p_motivo: tipo === 'saida' ? motivo : null
  });
  if (error) return responderErroBanco(res, error, 'Nao foi possivel registrar a movimentacao.');
  res.status(201).json(data);
}

router.post('/entrada', (req, res) => registrar(req, res, 'entrada'));
router.post('/saida', (req, res) => registrar(req, res, 'saida'));

module.exports = router;
