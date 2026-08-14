const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { textoObrigatorio, textoOpcional } = require('../utils/codigo');
const { dadoUnico, responderErroBanco } = require('../utils/resposta');

// GET /api/familias -> lista todas as famílias
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('familias')
    .select('*')
    .order('codigo', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/familias -> cria família com o próximo código disponível (001, 002, ...)
router.post('/', async (req, res) => {
  const nome = textoObrigatorio(req.body.nome, 120);
  const descricao = textoOpcional(req.body.descricao);
  if (!nome || descricao === undefined) {
    return res.status(400).json({ error: 'Informe um nome valido e uma descricao de ate 500 caracteres.' });
  }
  const { data, error } = await supabase.rpc('criar_familia', {
    p_nome: nome,
    p_descricao: descricao
  });
  if (error) return responderErroBanco(res, error, 'Nao foi possivel criar a familia.');
  res.status(201).json(dadoUnico(data));
});

// PUT /api/familias/:id -> edita nome/descrição (o código não muda)
router.put('/:id', async (req, res) => {
  const nome = textoObrigatorio(req.body.nome, 120);
  const descricao = textoOpcional(req.body.descricao);
  if (!nome || descricao === undefined) {
    return res.status(400).json({ error: 'Informe um nome valido e uma descricao de ate 500 caracteres.' });
  }
  const { data, error } = await supabase
    .from('familias')
    .update({ nome, descricao })
    .eq('id', req.params.id)
    .select()
    .maybeSingle();

  if (error) return responderErroBanco(res, error, 'Nao foi possivel atualizar a familia.');
  if (!data) return res.status(404).json({ error: 'Familia nao encontrada.' });
  res.json(data);
});

// DELETE /api/familias/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('familias').delete().eq('id', req.params.id);
  if (error) return responderErroBanco(res, error, 'Nao foi possivel excluir a familia.');
  res.status(204).send();
});

module.exports = router;
