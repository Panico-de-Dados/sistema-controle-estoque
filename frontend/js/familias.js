document.addEventListener('DOMContentLoaded', async () => {
  const conteudo = document.getElementById('page-content');
  conteudo.innerHTML = document.getElementById('tpl-content').innerHTML;

  const formFamilia = document.getElementById('form-familia');
  const formTipo = document.getElementById('form-tipo');
  const selectTipoFamilia = document.getElementById('tipo-familia');
  const selectFiltroFamilia = document.getElementById('filtro-tipo-familia');

  let familias = [];

  async function carregarFamilias() {
    try {
      familias = await api.listarFamilias();
      renderFamilias();
      const optionsHtml = familias.map((f) => `<option value="${escapeHtml(f.id)}">${escapeHtml(f.codigo)} — ${escapeHtml(f.nome)}</option>`).join('');
      selectTipoFamilia.innerHTML = `<option value="">Selecione a família…</option>${optionsHtml}`;
      selectFiltroFamilia.innerHTML = `<option value="">Todas as famílias</option>${optionsHtml}`;
    } catch (err) {
      mostrarToast(err.message, 'erro');
    }
  }

  function renderFamilias() {
    const container = document.getElementById('lista-familias');
    if (familias.length === 0) {
      container.innerHTML = '<p class="py-6 text-center text-sm text-slate-400">Nenhuma família cadastrada.</p>';
      return;
    }
    container.innerHTML = familias.map((f) => `
      <div class="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-brand-400/50 hover:bg-white hover:shadow-sm">
        <div>
          <span class="inline-flex rotate-[-0.6deg] rounded-md border-2 border-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.12em]">${escapeHtml(f.codigo)}</span>
          <span class="ml-2 font-semibold text-slate-900">${escapeHtml(f.nome)}</span>
          ${f.descricao ? `<p class="mt-1 text-xs text-slate-500">${escapeHtml(f.descricao)}</p>` : ''}
        </div>
        <div class="flex gap-3 text-sm shrink-0">
          <button data-editar="${f.id}" class="rounded-lg px-2 py-1 font-semibold text-slate-600 transition hover:bg-slate-100">Editar</button>
          <button data-excluir="${f.id}" class="rounded-lg px-2 py-1 font-semibold text-red-600 transition hover:bg-red-50">Excluir</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('[data-editar]').forEach((btn) => btn.addEventListener('click', () => {
      const f = familias.find((x) => x.id === btn.dataset.editar);
      document.getElementById('familia-id').value = f.id;
      document.getElementById('familia-nome').value = f.nome;
      document.getElementById('familia-descricao').value = f.descricao || '';
      document.getElementById('btn-cancelar-familia').classList.remove('hidden');
    }));

    container.querySelectorAll('[data-excluir]').forEach((btn) => btn.addEventListener('click', async () => {
      if (!confirm('Excluir esta família? A exclusão será impedida se houver tipos ou produtos vinculados.')) return;
      try {
        await api.excluirFamilia(btn.dataset.excluir);
        mostrarToast('Família excluída.');
        await carregarFamilias();
        await carregarTipos();
      } catch (err) {
        mostrarToast(err.message, 'erro');
      }
    }));
  }

  formFamilia.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('familia-id').value;
    const dados = {
      nome: document.getElementById('familia-nome').value.trim(),
      descricao: document.getElementById('familia-descricao').value.trim()
    };
    try {
      if (id) {
        await api.editarFamilia(id, dados);
        mostrarToast('Família atualizada.');
      } else {
        await api.criarFamilia(dados);
        mostrarToast('Família criada.');
      }
      formFamilia.reset();
      document.getElementById('familia-id').value = '';
      document.getElementById('btn-cancelar-familia').classList.add('hidden');
      await carregarFamilias();
    } catch (err) {
      mostrarToast(err.message, 'erro');
    }
  });

  document.getElementById('btn-cancelar-familia').addEventListener('click', () => {
    formFamilia.reset();
    document.getElementById('familia-id').value = '';
    document.getElementById('btn-cancelar-familia').classList.add('hidden');
  });

  // ---------------- TIPOS ----------------
  let tipos = [];

  async function carregarTipos() {
    try {
      const filtro = selectFiltroFamilia.value;
      tipos = await api.listarTipos(filtro || undefined);
      renderTipos();
    } catch (err) {
      mostrarToast(err.message, 'erro');
    }
  }

  function renderTipos() {
    const container = document.getElementById('lista-tipos');
    if (tipos.length === 0) {
      container.innerHTML = '<p class="py-6 text-center text-sm text-slate-400">Nenhum tipo cadastrado.</p>';
      return;
    }
    container.innerHTML = tipos.map((t) => `
      <div class="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-brand-400/50 hover:bg-white hover:shadow-sm">
        <div>
          <span class="inline-flex rotate-[-0.6deg] rounded-md border-2 border-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.12em]">${escapeHtml(t.familias?.codigo || '???')}.${escapeHtml(t.codigo)}</span>
          <span class="ml-2 font-semibold text-slate-900">${escapeHtml(t.nome)}</span>
          <p class="mt-1 text-xs text-slate-500">Família: ${escapeHtml(t.familias?.nome || '—')}</p>
        </div>
        <div class="flex gap-3 text-sm shrink-0">
          <button data-editar="${t.id}" class="rounded-lg px-2 py-1 font-semibold text-slate-600 transition hover:bg-slate-100">Editar</button>
          <button data-excluir="${t.id}" class="rounded-lg px-2 py-1 font-semibold text-red-600 transition hover:bg-red-50">Excluir</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('[data-editar]').forEach((btn) => btn.addEventListener('click', () => {
      const t = tipos.find((x) => x.id === btn.dataset.editar);
      document.getElementById('tipo-id').value = t.id;
      document.getElementById('tipo-familia').value = t.familia_id;
      document.getElementById('tipo-familia').disabled = true;
      document.getElementById('tipo-nome').value = t.nome;
      document.getElementById('tipo-descricao').value = t.descricao || '';
      document.getElementById('btn-cancelar-tipo').classList.remove('hidden');
    }));

    container.querySelectorAll('[data-excluir]').forEach((btn) => btn.addEventListener('click', async () => {
      if (!confirm('Excluir este tipo? A exclusão será impedida se houver produtos vinculados.')) return;
      try {
        await api.excluirTipo(btn.dataset.excluir);
        mostrarToast('Tipo excluído.');
        await carregarTipos();
      } catch (err) {
        mostrarToast(err.message, 'erro');
      }
    }));
  }

  formTipo.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('tipo-id').value;
    const dados = {
      familia_id: selectTipoFamilia.value,
      nome: document.getElementById('tipo-nome').value.trim(),
      descricao: document.getElementById('tipo-descricao').value.trim()
    };
    try {
      if (id) {
        await api.editarTipo(id, dados);
        mostrarToast('Tipo atualizado.');
      } else {
        await api.criarTipo(dados);
        mostrarToast('Tipo criado.');
      }
      resetFormTipo();
      await carregarTipos();
    } catch (err) {
      mostrarToast(err.message, 'erro');
    }
  });

  function resetFormTipo() {
    formTipo.reset();
    document.getElementById('tipo-id').value = '';
    document.getElementById('tipo-familia').disabled = false;
    document.getElementById('btn-cancelar-tipo').classList.add('hidden');
  }

  document.getElementById('btn-cancelar-tipo').addEventListener('click', resetFormTipo);
  selectFiltroFamilia.addEventListener('change', carregarTipos);

  await carregarFamilias();
  await carregarTipos();
});
