document.addEventListener('DOMContentLoaded', async () => {
  const conteudo = document.getElementById('page-content');
  conteudo.innerHTML = document.getElementById('tpl-content').innerHTML;

  let produtos = [];
  const selecionados = new Set();

  async function ensureQrCodeLibrary() {
    if (typeof window.QRCode === 'function') {
      return;
    }
    throw new Error('O gerador de QR Code não foi inicializado. Atualize a página.');
  }

  try {
    await ensureQrCodeLibrary();
    produtos = await api.listarProdutos();
    renderLista(produtos);
  } catch (err) {
    mostrarToast(err.message, 'erro');
  }

  function renderLista(lista) {
    const container = document.getElementById('lista-selecao');
    if (lista.length === 0) {
      container.innerHTML = '<p class="py-6 text-center text-sm text-slate-400">Nenhum produto cadastrado ainda.</p>';
      return;
    }
    container.innerHTML = lista.map((p) => `
      <label class="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-slate-50">
        <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400" data-id="${escapeHtml(p.id)}" ${selecionados.has(p.id) ? 'checked' : ''}>
        <span class="font-mono text-xs font-semibold text-slate-600">${escapeHtml(p.codigo_completo)}</span>
        <span class="font-medium text-slate-900">${escapeHtml(p.nome)}</span>
      </label>
    `).join('');

    container.querySelectorAll('input[type="checkbox"]').forEach((chk) => {
      chk.addEventListener('change', () => {
        if (chk.checked) selecionados.add(chk.dataset.id);
        else selecionados.delete(chk.dataset.id);
        renderPreviaEtiquetas();
      });
    });
  }

  document.getElementById('busca-etiqueta').addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    renderLista(produtos.filter((p) =>
      p.nome.toLowerCase().includes(termo) || p.codigo_completo.includes(termo)
    ));
  });

  function renderPreviaEtiquetas() {
    const area = document.getElementById('area-impressao');
    const selecionadosProdutos = produtos.filter((p) => selecionados.has(p.id));

    if (selecionadosProdutos.length === 0) {
      area.innerHTML = '<p class="text-sm text-slate-400 print:hidden">Selecione um ou mais produtos acima para pré-visualizar as etiquetas.</p>';
      return;
    }

    area.innerHTML = selecionadosProdutos.map((p, i) => `
      <div class="flex w-[260px] break-inside-avoid items-center gap-3 rounded-lg border-2 border-dashed border-slate-400 bg-white p-2.5 print:shadow-none">
        <div id="etiqueta-qr-${i}"></div>
        <div class="min-w-0">
          <p class="inline-flex rotate-[-0.6deg] rounded border-2 border-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.12em]">${escapeHtml(p.codigo_completo)}</p>
          <p class="text-sm font-semibold leading-tight mt-1 truncate">${escapeHtml(p.nome)}</p>
          <p class="text-xs text-gray-500 truncate">${escapeHtml(p.localizacao || '')}</p>
        </div>
      </div>
    `).join('');

    selecionadosProdutos.forEach((p, i) => {
      try {
        const destino = document.getElementById(`etiqueta-qr-${i}`);
        new QRCode(destino, {
          text: p.codigo_completo,
          width: 70,
          height: 70,
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch (err) {
        console.error('Erro ao gerar QR Code para etiqueta:', err);
      }
    });
  }

  document.getElementById('btn-imprimir').addEventListener('click', () => {
    if (selecionados.size === 0) {
      mostrarToast('Selecione ao menos um produto para imprimir.', 'erro');
      return;
    }
    window.print();
  });
});
