document.addEventListener('DOMContentLoaded', async () => {
  const conteudo = document.getElementById('page-content');
  conteudo.innerHTML = document.getElementById('tpl-content').innerHTML;

  try {
    const [produtos, movimentacoes] = await Promise.all([
      api.listarProdutos(),
      api.listarMovimentacoes()
    ]);

    const totalItens = produtos.length;
    const totalQuantidade = produtos.reduce((soma, p) => soma + p.quantidade, 0);
    const baixoEstoque = produtos.filter((p) => p.quantidade <= p.estoque_minimo);

    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    const movRecentes = movimentacoes.filter((m) => new Date(m.created_at) >= seteDiasAtras);

    document.getElementById('stat-total').textContent = totalItens;
    document.getElementById('stat-quantidade').textContent = totalQuantidade;
    document.getElementById('stat-baixo').textContent = baixoEstoque.length;
    document.getElementById('stat-mov').textContent = movRecentes.length;

    const tabelaBaixo = document.getElementById('tabela-baixo-estoque');
    if (baixoEstoque.length === 0) {
      document.getElementById('msg-vazio-baixo').classList.remove('hidden');
    } else {
      tabelaBaixo.innerHTML = baixoEstoque.map((p) => `
        <tr class="border-b border-slate-100 bg-red-50/50 transition hover:bg-red-50 last:border-0">
          <td class="py-3 pr-4 font-mono text-xs font-semibold text-slate-700">${escapeHtml(p.codigo_completo)}</td>
          <td class="py-3 pr-4 font-medium text-slate-900">${escapeHtml(p.nome)}</td>
          <td class="py-3 pr-4 text-slate-500">${escapeHtml(p.localizacao || '—')}</td>
          <td class="py-3 pr-4"><span class="rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">${p.quantidade}</span></td>
          <td class="py-3 pr-4 text-slate-500">${p.estoque_minimo}</td>
        </tr>
      `).join('');
    }

    const tabelaMov = document.getElementById('tabela-ultimas-mov');
    tabelaMov.innerHTML = movimentacoes.slice(0, 10).map((m) => `
      <tr class="border-b border-slate-100 transition hover:bg-slate-50 last:border-0">
        <td class="py-3 pr-4 whitespace-nowrap text-slate-500">${new Date(m.created_at).toLocaleString('pt-BR')}</td>
        <td class="py-2 pr-3">
          <span class="rounded-full border px-2.5 py-1 text-xs font-bold ${m.tipo === 'entrada' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}">
            ${m.tipo === 'entrada' ? '↓ Entrada' : '↑ Saída'}
          </span>
        </td>
        <td class="py-3 pr-4 font-mono text-xs font-semibold">${escapeHtml(m.produtos?.codigo_completo || '—')}</td>
        <td class="py-3 pr-4 font-medium text-slate-900">${escapeHtml(m.produtos?.nome || '—')}</td>
        <td class="py-2 pr-3">${m.quantidade}</td>
        <td class="py-2 pr-3">${escapeHtml(m.responsavel)}</td>
      </tr>
    `).join('') || '<tr><td colspan="6" class="py-6 text-center text-gray-400">Nenhuma movimentação registrada ainda.</td></tr>';
  } catch (err) {
    mostrarToast(err.message, 'erro');
  }
});
