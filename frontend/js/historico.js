document.addEventListener('DOMContentLoaded', async () => {
  const conteudo = document.getElementById('page-content');
  conteudo.innerHTML = document.getElementById('tpl-content').innerHTML;

  const filtroFamilia = document.getElementById('filtro-familia');
  const filtroTipo = document.getElementById('filtro-tipo');
  let tipos = [];

  try {
    const [familias, tiposCarregados] = await Promise.all([api.listarFamilias(), api.listarTipos()]);
    tipos = tiposCarregados;
    filtroFamilia.innerHTML = `<option value="">Todas</option>${familias.map((f) => `<option value="${escapeHtml(f.id)}">${escapeHtml(f.codigo)} — ${escapeHtml(f.nome)}</option>`).join('')}`;
  } catch (err) {
    mostrarToast(err.message, 'erro');
  }

  async function carregarHistorico() {
    const params = {};
    const codigo = document.getElementById('filtro-codigo').value.trim();
    const nome = document.getElementById('filtro-nome').value.trim();
    const tipoMov = document.getElementById('filtro-movimento').value;

    if (codigo) params.codigo = codigo;
    if (nome) params.nome = nome;
    if (filtroFamilia.value) params.familia_id = filtroFamilia.value;
    if (filtroTipo.value) params.tipo_id = filtroTipo.value;
    if (tipoMov) params.tipo = tipoMov;

    try {
      const movimentacoes = await api.listarMovimentacoes(params);
      renderHistorico(movimentacoes);
    } catch (err) {
      mostrarToast(err.message, 'erro');
    }
  }

  function renderHistorico(movimentacoes) {
    const tabela = document.getElementById('tabela-historico');
    const msgVazio = document.getElementById('msg-vazio-historico');

    if (movimentacoes.length === 0) {
      tabela.innerHTML = '';
      msgVazio.classList.remove('hidden');
      return;
    }
    msgVazio.classList.add('hidden');

    tabela.innerHTML = movimentacoes.map((m) => `
      <tr class="border-b border-slate-100 transition hover:bg-slate-50 last:border-0">
        <td class="whitespace-nowrap py-3 pr-4 text-slate-500">${new Date(m.created_at).toLocaleString('pt-BR')}</td>
        <td class="py-2 pr-3">
          <span class="rounded-full border px-2.5 py-1 text-xs font-bold ${m.tipo === 'entrada' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}">
            ${m.tipo === 'entrada' ? '↓ Entrada' : '↑ Saída'}
          </span>
        </td>
        <td class="py-3 pr-4 font-mono text-xs font-semibold">${escapeHtml(m.produtos?.codigo_completo || '—')}</td>
        <td class="py-3 pr-4 font-medium text-slate-900">${escapeHtml(m.produtos?.nome || '—')}</td>
        <td class="py-2 pr-3 font-semibold">${m.quantidade}</td>
        <td class="py-2 pr-3 text-gray-500">${m.saldo_anterior} → ${m.saldo_novo}</td>
        <td class="py-2 pr-3">${escapeHtml(m.responsavel)}</td>
        <td class="py-2 pr-3 text-gray-500">${escapeHtml(m.motivo || '—')}</td>
      </tr>
    `).join('');
  }

  document.getElementById('btn-filtrar-historico').addEventListener('click', carregarHistorico);
  filtroFamilia.addEventListener('change', () => {
    const lista = filtroFamilia.value ? tipos.filter((t) => t.familia_id === filtroFamilia.value) : tipos;
    filtroTipo.innerHTML = `<option value="">Todos</option>${lista.map((t) =>
      `<option value="${escapeHtml(t.id)}">${escapeHtml(t.codigo)} — ${escapeHtml(t.nome)}</option>`
    ).join('')}`;
  });
  filtroFamilia.dispatchEvent(new Event('change'));
  await carregarHistorico();
});
