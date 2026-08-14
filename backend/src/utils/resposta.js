function dadoUnico(data) {
  return Array.isArray(data) ? data[0] : data;
}

function statusDoErroBanco(error) {
  if (!error) return 500;
  if (error.code === 'P0002') return 404;
  if (error.code === 'P0001' || error.code === '23503' || error.code === '23505') return 409;
  if (error.code === '22023' || error.code === '22003' || error.code === '22P02') return 400;
  return 500;
}

function responderErroBanco(res, error, mensagemPadrao = 'Nao foi possivel concluir a operacao.') {
  const status = statusDoErroBanco(error);
  const mensagem = status === 500 ? mensagemPadrao : error.message;
  if (status === 500) console.error(error);
  return res.status(status).json({ error: mensagem });
}

module.exports = { dadoUnico, responderErroBanco };
