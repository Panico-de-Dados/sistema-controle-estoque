document.addEventListener('DOMContentLoaded', async () => {
  const conteudo = document.getElementById('page-content');
  conteudo.innerHTML = document.getElementById('tpl-content').innerHTML;

  const etapaScanner = document.getElementById('etapa-scanner');
  const etapaProduto = document.getElementById('etapa-produto');
  const etapaSucesso = document.getElementById('etapa-sucesso');
  const statusScanner = document.getElementById('scanner-status');
  const selectCamera = document.getElementById('select-camera');
  const controlesCamera = document.getElementById('controles-camera');
  const inputImagem = document.getElementById('input-qr-imagem');

  let html5QrCode = null;
  let produtoAtual = null;
  let cameras = [];
  let cameraSelecionadaId = null;
  let cameraEmExecucao = false;
  let iniciandoCamera = false;
  let leituraEmAndamento = false;

  function atualizarStatus(mensagem, tipo = 'info') {
    const estilos = {
      info: 'mb-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600 shadow-soft',
      ok: 'mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700 shadow-soft',
      erro: 'mb-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 shadow-soft'
    };
    statusScanner.className = estilos[tipo] || estilos.info;
    statusScanner.textContent = mensagem;
  }

  function mensagemErroCamera(erro) {
    const texto = `${erro?.name || ''} ${erro?.message || erro || ''}`.toLowerCase();
    if (texto.includes('notallowed') || texto.includes('permission') || texto.includes('denied')) {
      return 'Permissão da câmera negada. Libere a câmera nas configurações do navegador ou use uma imagem/código manual.';
    }
    if (texto.includes('notfound') || texto.includes('devicesnotfound')) {
      return 'Nenhuma câmera foi encontrada neste aparelho. Use uma imagem ou digite o código.';
    }
    if (texto.includes('notreadable') || texto.includes('trackstarterror') || texto.includes('could not start')) {
      return 'A câmera está sendo usada por outro aplicativo. Feche-o e toque em “Reiniciar câmera”.';
    }
    if (texto.includes('overconstrained')) {
      return 'A câmera selecionada não está disponível. Escolha outra câmera.';
    }
    return 'Não foi possível iniciar a câmera. Tente reiniciar ou use uma imagem/código manual.';
  }

  function renderizarCameras() {
    selectCamera.innerHTML = cameras.map((camera, indice) =>
      `<option value="${escapeHtml(camera.id)}">${escapeHtml(camera.label || `Câmera ${indice + 1}`)}</option>`
    ).join('');
    if (cameraSelecionadaId) selectCamera.value = cameraSelecionadaId;
    controlesCamera.classList.toggle('hidden', cameras.length < 2);
  }

  async function carregarCameras() {
    cameras = await Html5Qrcode.getCameras();
    if (!cameras.length) throw new Error('NotFoundError: nenhuma câmera encontrada');

    if (!cameraSelecionadaId || !cameras.some((camera) => camera.id === cameraSelecionadaId)) {
      const traseira = cameras.find((camera) =>
        /back|rear|environment|traseira|posterior/i.test(camera.label || '')
      );
      cameraSelecionadaId = (traseira || cameras[cameras.length - 1]).id;
    }
    renderizarCameras();
  }

  async function pararCamera() {
    const instancia = html5QrCode;
    html5QrCode = null;
    cameraEmExecucao = false;
    if (!instancia) return;
    try {
      if (instancia.isScanning) await instancia.stop();
    } catch (erro) {
      console.debug('A câmera já estava parada.', erro);
    }
    try {
      instancia.clear();
    } catch (erro) {
      console.debug('O leitor já estava limpo.', erro);
    }
  }

  function criarLeitor() {
    return new Html5Qrcode('reader', {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false
    });
  }

  async function processarCodigo(codigo) {
    const normalizado = String(codigo || '').trim();
    if (!/^\d{3}\.\d{3}\.\d{4}$/.test(normalizado)) {
      leituraEmAndamento = false;
      atualizarStatus('O QR Code lido não contém um código no formato FFF.TTT.PPPP.', 'erro');
      mostrarToast('QR Code inválido para este sistema.', 'erro');
      setTimeout(() => iniciarCamera(cameraSelecionadaId), 900);
      return;
    }

    try {
      produtoAtual = await api.buscarProdutoPorCodigo(normalizado);
      mostrarEtapaProduto();
    } catch (erro) {
      leituraEmAndamento = false;
      atualizarStatus(erro.message, 'erro');
      mostrarToast(erro.message, 'erro');
      setTimeout(() => iniciarCamera(cameraSelecionadaId), 1000);
    }
  }

  async function codigoDetectado(codigo) {
    if (leituraEmAndamento) return;
    leituraEmAndamento = true;
    atualizarStatus('Código reconhecido. Buscando o produto…', 'ok');
    if (navigator.vibrate) navigator.vibrate(120);
    await pararCamera();
    await processarCodigo(codigo);
  }

  async function iniciarCamera(cameraId = null) {
    if (iniciandoCamera || document.hidden || !etapaProduto.classList.contains('hidden')) return;

    if (typeof window.Html5Qrcode !== 'function') {
      atualizarStatus('O leitor de QR Code não foi carregado. Reinicie o servidor e atualize a página.', 'erro');
      return;
    }
    if (!window.isSecureContext) {
      atualizarStatus('A câmera exige HTTPS. Em computador, use localhost; no celular, publique ou use um túnel HTTPS.', 'erro');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      atualizarStatus('Este navegador não oferece acesso à câmera. Use uma imagem ou digite o código.', 'erro');
      return;
    }

    iniciandoCamera = true;
    leituraEmAndamento = false;
    await pararCamera();
    atualizarStatus('Solicitando acesso à câmera…');

    try {
      if (!cameras.length) await carregarCameras();
      if (cameraId && cameras.some((camera) => camera.id === cameraId)) cameraSelecionadaId = cameraId;

      html5QrCode = criarLeitor();
      await html5QrCode.start(
        cameraSelecionadaId || { facingMode: 'environment' },
        {
          fps: 10,
          qrbox(viewfinderWidth, viewfinderHeight) {
            const lado = Math.max(180, Math.min(260, viewfinderWidth - 40, viewfinderHeight - 40));
            return { width: lado, height: lado };
          },
          aspectRatio: 1,
          disableFlip: false
        },
        codigoDetectado,
        () => {}
      );
      cameraEmExecucao = true;
      atualizarStatus('Câmera ativa. Centralize o QR Code dentro do quadrado.', 'ok');
    } catch (erro) {
      await pararCamera();
      atualizarStatus(mensagemErroCamera(erro), 'erro');
    } finally {
      iniciandoCamera = false;
    }
  }

  async function lerImagem(arquivo) {
    if (!arquivo) return;
    if (!arquivo.type.startsWith('image/')) {
      mostrarToast('Selecione um arquivo de imagem.', 'erro');
      return;
    }
    if (arquivo.size > 10 * 1024 * 1024) {
      mostrarToast('A imagem deve ter no máximo 10 MB.', 'erro');
      return;
    }

    leituraEmAndamento = true;
    await pararCamera();
    atualizarStatus('Procurando um QR Code na imagem…');
    try {
      html5QrCode = criarLeitor();
      const codigo = await html5QrCode.scanFile(arquivo, true);
      leituraEmAndamento = false;
      await codigoDetectado(codigo);
    } catch (erro) {
      leituraEmAndamento = false;
      await pararCamera();
      atualizarStatus('Nenhum QR Code válido foi encontrado na imagem.', 'erro');
      mostrarToast('Não foi possível ler o QR Code da imagem.', 'erro');
    } finally {
      inputImagem.value = '';
    }
  }

  function mostrarEtapaProduto() {
    etapaScanner.classList.add('hidden');
    etapaSucesso.classList.add('hidden');
    etapaProduto.classList.remove('hidden');
    document.getElementById('prod-codigo').textContent = produtoAtual.codigo_completo;
    document.getElementById('prod-nome').textContent = produtoAtual.nome;
    document.getElementById('prod-localizacao').textContent = produtoAtual.localizacao
      ? `📍 ${produtoAtual.localizacao}`
      : 'Sem localização';
    document.getElementById('prod-saldo').textContent = produtoAtual.quantidade;
    document.getElementById('form-entrada').classList.add('hidden');
    document.getElementById('form-saida').classList.add('hidden');
    document.getElementById('form-entrada').reset();
    document.getElementById('form-saida').reset();
    document.querySelectorAll('#form-entrada button[type="submit"], #form-saida button[type="submit"]')
      .forEach((botao) => { botao.disabled = false; });
  }

  document.getElementById('btn-modo-entrada').addEventListener('click', () => {
    document.getElementById('form-entrada').classList.remove('hidden');
    document.getElementById('form-saida').classList.add('hidden');
    document.getElementById('entrada-quantidade').focus();
  });

  document.getElementById('btn-modo-saida').addEventListener('click', () => {
    document.getElementById('form-saida').classList.remove('hidden');
    document.getElementById('form-entrada').classList.add('hidden');
    document.getElementById('saida-quantidade').focus();
  });

  document.getElementById('form-entrada').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const botao = evento.submitter;
    botao.disabled = true;
    try {
      const resultado = await api.registrarEntrada({
        codigo_completo: produtoAtual.codigo_completo,
        quantidade: document.getElementById('entrada-quantidade').value,
        responsavel: document.getElementById('entrada-responsavel').value.trim()
      });
      mostrarSucesso('Entrada registrada!', `Saldo: ${resultado.saldo_novo} un.`);
    } catch (erro) {
      mostrarToast(erro.message, 'erro');
      botao.disabled = false;
    }
  });

  document.getElementById('form-saida').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const botao = evento.submitter;
    botao.disabled = true;
    try {
      const resultado = await api.registrarSaida({
        codigo_completo: produtoAtual.codigo_completo,
        quantidade: document.getElementById('saida-quantidade').value,
        motivo: document.getElementById('saida-motivo').value.trim(),
        responsavel: document.getElementById('saida-responsavel').value.trim()
      });
      mostrarSucesso('Saída registrada!', `Saldo: ${resultado.saldo_novo} un.`);
    } catch (erro) {
      mostrarToast(erro.message, 'erro');
      botao.disabled = false;
    }
  });

  function mostrarSucesso(titulo, detalhe) {
    etapaProduto.classList.add('hidden');
    etapaSucesso.classList.remove('hidden');
    document.getElementById('sucesso-titulo').textContent = titulo;
    document.getElementById('sucesso-detalhe').textContent = detalhe;
  }

  function voltarParaScanner() {
    produtoAtual = null;
    leituraEmAndamento = false;
    etapaProduto.classList.add('hidden');
    etapaSucesso.classList.add('hidden');
    etapaScanner.classList.remove('hidden');
    atualizarStatus('Preparando a câmera…');
    setTimeout(() => iniciarCamera(cameraSelecionadaId), 150);
  }

  document.getElementById('btn-escanear-outro').addEventListener('click', voltarParaScanner);
  document.getElementById('btn-nova-leitura').addEventListener('click', voltarParaScanner);
  document.getElementById('btn-reiniciar-scanner').addEventListener('click', () => iniciarCamera(cameraSelecionadaId));
  selectCamera.addEventListener('change', () => {
    cameraSelecionadaId = selectCamera.value;
    iniciarCamera(cameraSelecionadaId);
  });
  inputImagem.addEventListener('change', () => lerImagem(inputImagem.files?.[0]));

  document.getElementById('form-codigo-manual').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const codigo = document.getElementById('codigo-manual').value.trim();
    if (!codigo) return;
    leituraEmAndamento = true;
    await pararCamera();
    await processarCodigo(codigo);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pararCamera();
    } else if (!etapaScanner.classList.contains('hidden') && !produtoAtual) {
      iniciarCamera(cameraSelecionadaId);
    }
  });
  window.addEventListener('pagehide', () => { pararCamera(); });

  await iniciarCamera();
});
