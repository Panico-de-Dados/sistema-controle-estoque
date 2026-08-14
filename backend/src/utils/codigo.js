/** Preenche um número com zeros à esquerda até o tamanho desejado. Ex: pad(7, 3) -> "007" */
function pad(numero, tamanho) {
  return String(numero).padStart(tamanho, '0');
}

/** Valida o formato completo FFF.TTT.PPPP */
function validarCodigoCompleto(codigo) {
  return typeof codigo === 'string' && /^\d{3}\.\d{3}\.\d{4}$/.test(codigo);
}

function lerInteiro(valor, { minimo = 0, maximo = Number.MAX_SAFE_INTEGER } = {}) {
  const numero = typeof valor === 'number' ? valor : Number(valor);
  return Number.isInteger(numero) && numero >= minimo && numero <= maximo ? numero : null;
}

function textoObrigatorio(valor, maximo = 160) {
  if (typeof valor !== 'string') return null;
  const texto = valor.trim();
  return texto && texto.length <= maximo ? texto : null;
}

function textoOpcional(valor, maximo = 500) {
  if (valor === undefined || valor === null || valor === '') return null;
  if (typeof valor !== 'string') return undefined;
  const texto = valor.trim();
  return texto.length <= maximo ? (texto || null) : undefined;
}

module.exports = { pad, validarCodigoCompleto, lerInteiro, textoObrigatorio, textoOpcional };
