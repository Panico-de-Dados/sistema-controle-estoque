const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { textoObrigatorio, textoOpcional } = require('../utils/codigo');
const { dadoUnico, responderErroBanco } = require('../utils/resposta');

// GET /api/tipos?familia_id=xxx -> lista tipos (opcionalmente filtrados por família)
router.get('/', async (req, res) => {
  let query = supabase.from('tipos').select('*, familias(codigo, nome)').order('codigo');

  if (req.query.familia_id) {
    query = query.eq('familia_id', req.query.familia_id);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/tipos -> cria tipo com próximo código disponível DENTRO da família (001, 002...)
router.post('/', async (req, res) => {
  const { familia_id } = req.body;
  const nome = textoObrigatorio(req.body.nome, 120);
  const descricao = textoOpcional(req.body.descricao);
  if (!familia_id || !nome) {
    return res.status(400).json({ error: 'Os campos "familia_id" e "nome" são obrigatórios.' });
  }
  if (descricao === undefined) return res.status(400).json({ error: 'A descricao deve ter ate 500 caracteres.' });
  const { data, error } = await supabase.rpc('criar_tipo', {
    p_familia_id: familia_id,
    p_nome: nome,
    p_descricao: descricao
  });
  if (error) return responderErroBanco(res, error, 'Nao foi possivel criar o tipo.');
  res.status(201).json(dadoUnico(data));
});

// PUT /api/tipos/:id
router.put('/:id', async (req, res) => {
  const nome = textoObrigatorio(req.body.nome, 120);
  const descricao = textoOpcional(req.body.descricao);
  if (!nome || descricao === undefined) {
    return res.status(400).json({ error: 'Informe um nome valido e uma descricao de ate 500 caracteres.' });
  }
  const { data, error } = await supabase
    .from('tipos')
    .update({ nome, descricao })
    .eq('id', req.params.id)
    .select()
    .maybeSingle();

  if (error) return responderErroBanco(res, error, 'Nao foi possivel atualizar o tipo.');
  if (!data) return res.status(404).json({ error: 'Tipo nao encontrado.' });
  res.json(data);
});

// DELETE /api/tipos/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('tipos').delete().eq('id', req.params.id);
  if (error) return responderErroBanco(res, error, 'Nao foi possivel excluir o tipo.');
  res.status(204).send();
});

module.exports = router;
