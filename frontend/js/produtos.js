document.addEventListener('DOMContentLoaded', async () => {
  const conteudo = document.getElementById('page-content');
  conteudo.innerHTML = document.getElementById('tpl-content').innerHTML;

  const modalProduto = document.getElementById('modal-produto');
  const modalQr = document.getElementById('modal-qr');
  const formProduto = document.getElementById('form-produto');
  const selectFamilia = document.getElementById('produto-familia');
  const selectTipo = document.getElementById('produto-tipo');
  const filtroFamilia = document.getElementById('filtro-familia');
  const filtroTipo = document.getElementById('filtro-tipo');

  let familias = [];
  let todosOsTipos = [];

  async function carregarListasBase() {
    familias = await api.listarFamilias();
    todosOsTipos = await api.listarTipos();

    const opcoesFamilia = familias.map((f) => `<option value="${escapeHtml(f.id)}">${escapeHtml(f.codigo)} — ${escapeHtml(f.nome)}</option>`).join('');
    selectFamilia.innerHTML = `<option value="">Selecione…</option>${opcoesFamilia}`;
    filtroFamilia.innerHTML = `<option value="">Todas</option>${opcoesFamilia}`;
  }

  selectFamilia.addEventListener('change', () => {
    const tiposDaFamilia = todosOsTipos.filter((t) => t.familia_id === selectFamilia.value);
    selectTipo.disabled = tiposDaFamilia.length === 0;
    selectTipo.innerHTML = tiposDaFamilia.length
      ? `<option value="">Selecione…</option>${tiposDaFamilia.map((t) => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.codigo)} — ${escapeHtml(t.nome)}</option>`).join('')}`
      : '<option value="">Cadastre um tipo para esta família</option>';
    atualizarPreviaCodigo();
  });

  filtroFamilia.addEventListener('change', () => {
    const tiposDaFamilia = todosOsTipos.filter((t) => t.familia_id === filtroFamilia.value);
    filtroTipo.innerHTML = `<option value="">Todos</option>${tiposDaFamilia.map((t) => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.codigo)} — ${escapeHtml(t.nome)}</option>`).join('')}`;
  });

  selectTipo.addEventListener('change', atualizarPreviaCodigo);

  async function atualizarPreviaCodigo() {
    const preview = document.getElementById('preview-codigo');
    const id = document.getElementById('produto-id').value;
    if (id || !selectFamilia.value || !selectTipo.value) {
      preview.classList.add('hidden');
      return;
    }
    try {
      const { proximo_codigo } = await api.proximoCodigo(selectFamilia.value, selectTipo.value);
      document.getElementById('preview-codigo-valor').textContent = proximo_codigo;
      preview.classList.remove('hidden');
    } catch {
      preview.classList.add('hidden');
    }
  }

  // ---------------- LISTAGEM ----------------
  async function carregarProdutos() {
    const params = {};
    const busca = document.getElementById('filtro-busca').value.trim();
    if (busca) params.q = busca;
    if (filtroFamilia.value) params.familia_id = filtroFamilia.value;
    if (filtroTipo.value) params.tipo_id = filtroTipo.value;
    if (document.getElementById('filtro-baixo-estoque').checked) params.baixo_estoque = 'true';

    try {
      const produtos = await api.listarProdutos(params);
      renderProdutos(produtos);
    } catch (err) {
      mostrarToast(err.message, 'erro');
    }
  }

  function renderProdutos(produtos) {
    const tabela = document.getElementById('tabela-produtos');
    const msgVazio = document.getElementById('msg-vazio-produtos');

    if (produtos.length === 0) {
      tabela.innerHTML = '';
      msgVazio.classList.remove('hidden');
      return;
    }
    msgVazio.classList.add('hidden');

    tabela.innerHTML = produtos.map((p) => {
      const baixo = p.quantidade <= p.estoque_minimo;
      return `
      <tr class="border-b border-slate-100 transition hover:bg-slate-50 last:border-0 ${baixo ? 'bg-red-50/50' : ''}">
        <td class="py-3 pr-4 font-mono text-xs font-semibold text-slate-700">${escapeHtml(p.codigo_completo)}</td>
        <td class="py-2 pr-3">
          <p class="font-semibold text-slate-900">${escapeHtml(p.nome)}</p>
          <p class="text-xs text-slate-500">${escapeHtml(p.familias?.nome || '')} / ${escapeHtml(p.tipos?.nome || '')}</p>
        </td>
        <td class="py-3 pr-4 text-slate-500">${escapeHtml(p.localizacao || '—')}</td>
        <td class="py-2 pr-3">
          <span class="rounded-full border px-2.5 py-1 text-xs font-bold ${baixo ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}">${p.quantidade}</span>
        </td>
        <td class="py-2 pr-3 text-gray-500">${p.estoque_minimo}</td>
        <td class="py-2 pr-3">
          <button type="button" data-qr="${escapeHtml(p.codigo_completo)}" data-nome="${escapeHtml(p.nome)}" class="rounded-lg px-2 py-1 font-semibold text-sky-700 transition hover:bg-sky-50">Ver QR</button>
        </td>
        <td class="py-2 pr-3">
          <div class="flex gap-3">
            <button type="button" data-editar="${p.id}" class="rounded-lg px-2 py-1 font-semibold text-slate-700 transition hover:bg-slate-100">Editar</button>
            <button type="button" data-excluir="${p.id}" class="rounded-lg px-2 py-1 font-semibold text-red-600 transition hover:bg-red-50">Excluir</button>
          </div>
        </td>
      </tr>`;
    }).join('');

    tabela.querySelectorAll('[data-qr]').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        await abrirModalQr(btn.dataset.qr, btn.dataset.nome);
      } catch (err) {
        mostrarToast(err.message || 'Erro ao gerar QR Code.', 'erro');
      }
    }));
    tabela.querySelectorAll('[data-editar]').forEach((btn) => btn.addEventListener('click', () => abrirModalProduto(btn.dataset.editar, produtos)));
    tabela.querySelectorAll('[data-excluir]').forEach((btn) => btn.addEventListener('click', async () => {
      if (!confirm('Excluir este produto? A exclusão só será permitida se ele ainda não possuir movimentações registradas.')) return;
      try {
        await api.excluirProduto(btn.dataset.excluir);
        mostrarToast('Produto excluído.');
        await carregarProdutos();
      } catch (err) {
        mostrarToast(err.message, 'erro');
      }
    }));
  }

  async function ensureQrCodeLibrary() {
    if (typeof window.QRCode === 'function') {
      return;
    }
    throw new Error('O gerador de QR Code não foi inicializado. Atualize a página.');
  }

  // ---------------- MODAL DE CADASTRO/EDIÇÃO ----------------
  function abrirModalNovo() {
    formProduto.reset();
    document.getElementById('produto-id').value = '';
    document.getElementById('modal-titulo').textContent = 'Novo Produto';
    selectFamilia.disabled = false;
    selectTipo.disabled = true;
    selectTipo.innerHTML = '<option value="">Selecione a família</option>';
    document.getElementById('preview-codigo').classList.add('hidden');
    modalProduto.classList.remove('hidden');
  }

  function abrirModalProduto(id, produtosCache) {
    const p = produtosCache.find((x) => x.id === id);
    if (!p) return;
    document.getElementById('produto-id').value = p.id;
    document.getElementById('modal-titulo').textContent = `Editar Produto — ${p.codigo_completo}`;
    selectFamilia.value = p.familia_id;
    selectFamilia.disabled = true; // não é permitido trocar família/tipo depois de gerado o código
    const tiposDaFamilia = todosOsTipos.filter((t) => t.familia_id === p.familia_id);
    selectTipo.innerHTML = tiposDaFamilia.map((t) => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.codigo)} — ${escapeHtml(t.nome)}</option>`).join('');
    selectTipo.value = p.tipo_id;
    selectTipo.disabled = true;
    document.getElementById('produto-nome').value = p.nome;
    document.getElementById('produto-descricao').value = p.descricao || '';
    document.getElementById('produto-localizacao').value = p.localizacao || '';
    document.getElementById('produto-quantidade').value = p.quantidade;
    document.getElementById('produto-quantidade').disabled = true; // quantidade só muda via entrada/saída
    document.getElementById('produto-estoque-minimo').value = p.estoque_minimo;
    document.getElementById('preview-codigo').classList.add('hidden');
    modalProduto.classList.remove('hidden');
  }

  document.getElementById('btn-novo-produto').addEventListener('click', abrirModalNovo);
  document.getElementById('btn-fechar-modal').addEventListener('click', () => {
    modalProduto.classList.add('hidden');
    document.getElementById('produto-quantidade').disabled = false;
  });

  formProduto.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('produto-id').value;
    const dados = {
      familia_id: selectFamilia.value,
      tipo_id: selectTipo.value,
      nome: document.getElementById('produto-nome').value.trim(),
      descricao: document.getElementById('produto-descricao').value.trim(),
      localizacao: document.getElementById('produto-localizacao').value.trim(),
      quantidade: document.getElementById('produto-quantidade').value,
      estoque_minimo: document.getElementById('produto-estoque-minimo').value
    };

    try {
      if (id) {
        const { familia_id, tipo_id, quantidade, ...dadosEdicao } = dados;
        await api.editarProduto(id, dadosEdicao);
        mostrarToast('Produto atualizado.');
      } else {
        const criado = await api.criarProduto(dados);
        mostrarToast(`Produto criado com o código ${criado.codigo_completo}.`);
        modalProduto.classList.add('hidden');
        document.getElementById('produto-quantidade').disabled = false;
        await carregarProdutos();
        await abrirModalQr(criado.codigo_completo, criado.nome);
        return;
      }
      modalProduto.classList.add('hidden');
      document.getElementById('produto-quantidade').disabled = false;
      await carregarProdutos();
    } catch (err) {
      mostrarToast(err.message, 'erro');
    }
  });

  // ---------------- MODAL DE QR CODE ----------------
  async function abrirModalQr(codigo, nome) {
    await ensureQrCodeLibrary();

    document.getElementById('qr-codigo-texto').textContent = codigo;
    document.getElementById('qr-nome-produto').textContent = nome;
    const container = document.getElementById('qr-canvas-container');
    container.innerHTML = '';
    modalQr.classList.remove('hidden');

    try {
      new QRCode(container, {
        text: codigo,
        width: 200,
        height: 200,
        correctLevel: QRCode.CorrectLevel.M
      });
    } catch (err) {
      console.error('Erro ao gerar QR Code:', err);
      container.innerHTML = '<div class="text-sm text-red-600">Erro ao gerar QR Code. Recarregue a página.</div>';
      throw err;
    }
  }

  document.getElementById('btn-fechar-qr').addEventListener('click', () => modalQr.classList.add('hidden'));

  document.getElementById('btn-filtrar').addEventListener('click', carregarProdutos);
  document.getElementById('filtro-busca').addEventListener('keydown', (e) => { if (e.key === 'Enter') carregarProdutos(); });

  await carregarListasBase();
  await carregarProdutos();
});
