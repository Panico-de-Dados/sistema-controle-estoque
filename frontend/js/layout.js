const ICONES = {
  painel: '<svg class="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
  produtos: '<svg class="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z"/><path d="M12 11v10"/></svg>',
  familias: '<svg class="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h7l2 2h9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h4"/></svg>',
  etiquetas: '<svg class="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 13 11 22l-9-9V3h10l8 8a1.4 1.4 0 0 1 0 2Z"/><circle cx="7" cy="8" r="1.5"/></svg>',
  historico: '<svg class="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>',
  scanner: '<svg class="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10"/></svg>'
};

const NAV_ITEMS = [
  { href: 'index.html', label: 'Painel', icon: ICONES.painel },
  { href: 'produtos.html', label: 'Produtos', icon: ICONES.produtos },
  { href: 'familias-tipos.html', label: 'Famílias & Tipos', icon: ICONES.familias },
  { href: 'etiquetas.html', label: 'Imprimir Etiquetas', icon: ICONES.etiquetas },
  { href: 'historico.html', label: 'Histórico', icon: ICONES.historico },
  { href: 'scanner.html', label: 'Scanner Mobile', icon: ICONES.scanner }
];

function escapeHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderLayout() {
  const paginaAtual = window.location.pathname.split('/').pop() || 'index.html';
  const compacta = localStorage.getItem('sidebar-compacta') === 'true';

  const linksDesktop = NAV_ITEMS.map((item, indice) => {
    const ativo = item.href === paginaAtual;
    return `
      <a href="${item.href}" title="${item.label}"
         class="group flex animate-slide-in-left items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:translate-x-1 ${ativo
           ? 'bg-brand-400 text-slate-950 shadow-glow'
           : 'text-slate-400 hover:bg-white/10 hover:text-white'}"
         >
        <span class="h-5 w-5 shrink-0">${item.icon}</span>
        <span class="sidebar-text whitespace-nowrap transition-opacity duration-200 ${compacta ? 'pointer-events-none opacity-0' : 'opacity-100'}">${item.label}</span>
      </a>`;
  }).join('');

  const linksMobile = NAV_ITEMS
    .filter((item) => ['index.html', 'produtos.html', 'historico.html', 'scanner.html'].includes(item.href))
    .map((item) => {
      const ativo = item.href === paginaAtual;
      return `
        <a href="${item.href}" class="flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-all duration-200 ${ativo
          ? 'bg-brand-400/15 text-brand-400'
          : 'text-slate-500 hover:text-slate-200'}">
          <span class="h-5 w-5">${item.icon}</span>
          <span>${item.label.split(' ')[0]}</span>
        </a>`;
    }).join('');

  const shell = document.getElementById('layout-shell');
  if (!shell) return;
  shell.innerHTML = `
    <div class="relative flex min-h-screen bg-slate-50">
      <div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div class="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-100/60 blur-3xl"></div>
        <div class="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-100/40 blur-3xl"></div>
      </div>

      <aside id="sidebar-desktop" class="sticky top-0 z-30 hidden h-screen shrink-0 flex-col bg-slate-950 px-3 py-5 text-white shadow-2xl shadow-slate-950/20 transition-[width] duration-300 ease-out print:hidden md:flex ${compacta ? 'w-20' : 'w-72'}">
        <button id="btn-sidebar-toggle" type="button" aria-label="Recolher ou expandir menu"
          class="absolute -right-3 top-8 grid h-7 w-7 place-items-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 shadow-lg transition duration-300 hover:scale-110 hover:border-brand-400 hover:text-brand-400">
          <svg id="icone-sidebar-toggle" class="h-3.5 w-3.5 transition-transform duration-300 ${compacta ? 'rotate-180' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>
        </button>

        <div class="mb-8 flex items-center gap-3 overflow-hidden px-2">
          <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-slate-950 shadow-glow">
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z"/></svg>
          </div>
          <div class="sidebar-text min-w-0 whitespace-nowrap transition-opacity duration-200 ${compacta ? 'pointer-events-none opacity-0' : 'opacity-100'}">
            <p class="font-bold tracking-tight">Arquivo Morto</p>
            <p class="text-xs text-slate-500">Controle de estoque</p>
          </div>
        </div>

        <nav class="flex flex-col gap-1.5">${linksDesktop}</nav>

        <div class="mt-auto overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2">
          <div class="flex items-center gap-3">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-400/15 text-emerald-400">
              <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400"></span>
            </span>
            <div class="sidebar-text whitespace-nowrap transition-opacity duration-200 ${compacta ? 'pointer-events-none opacity-0' : 'opacity-100'}">
              <p class="text-xs font-semibold text-slate-200">Sistema operacional</p>
              <p class="text-[11px] text-slate-500">API conectada ao Supabase</p>
            </div>
          </div>
        </div>
      </aside>

      <div class="relative z-10 flex min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/70 bg-white/85 px-4 py-3 backdrop-blur-xl print:hidden md:hidden">
          <div class="flex items-center gap-2.5">
            <span class="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-brand-400">${ICONES.produtos}</span>
            <div><p class="text-sm font-bold text-slate-900">Arquivo Morto</p><p class="text-[10px] text-slate-500">Controle de estoque</p></div>
          </div>
          <a href="scanner.html" class="inline-flex items-center gap-2 rounded-xl bg-brand-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-glow transition hover:-translate-y-0.5 hover:bg-brand-500 active:scale-95">
            <span class="h-4 w-4">${ICONES.scanner}</span> Escanear
          </a>
        </header>

        <main class="flex-1 px-4 pb-24 pt-5 print:p-0 md:p-8 lg:p-10">
          <div id="page-content" class="animate-fade-in"></div>
        </main>

        <nav class="fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-2xl border border-white/10 bg-slate-950/95 px-2 py-1.5 shadow-2xl backdrop-blur-xl print:hidden md:hidden">
          ${linksMobile}
        </nav>
      </div>
    </div>`;

  document.getElementById('btn-sidebar-toggle')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar-desktop');
    const vaiCompactar = sidebar.classList.contains('w-72');
    sidebar.classList.toggle('w-72', !vaiCompactar);
    sidebar.classList.toggle('w-20', vaiCompactar);
    document.querySelectorAll('.sidebar-text').forEach((elemento) => {
      elemento.classList.toggle('opacity-100', !vaiCompactar);
      elemento.classList.toggle('opacity-0', vaiCompactar);
      elemento.classList.toggle('pointer-events-none', vaiCompactar);
    });
    document.getElementById('icone-sidebar-toggle').classList.toggle('rotate-180', vaiCompactar);
    localStorage.setItem('sidebar-compacta', String(vaiCompactar));
  });
}

function mostrarToast(mensagem, tipo = 'ok') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2';
    document.body.appendChild(container);
  }

  const estilos = {
    ok: { cor: 'border-emerald-200 bg-emerald-50 text-emerald-900', icone: '✓' },
    erro: { cor: 'border-red-200 bg-red-50 text-red-900', icone: '!' },
    info: { cor: 'border-slate-200 bg-white text-slate-800', icone: 'i' }
  };
  const visual = estilos[tipo] || estilos.info;
  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 text-sm font-medium shadow-soft animate-slide-in-right transition-all duration-300 ${visual.cor}`;
  const icone = document.createElement('span');
  icone.className = 'grid h-6 w-6 shrink-0 place-items-center rounded-full bg-current/10 text-xs font-black';
  icone.textContent = visual.icone;
  const texto = document.createElement('span');
  texto.className = 'pt-0.5 leading-relaxed';
  texto.textContent = mensagem;
  toast.append(icone, texto);
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('translate-x-4', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3400);
}

document.addEventListener('DOMContentLoaded', renderLayout);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    let recarregandoParaAtualizar = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (recarregandoParaAtualizar) return;
      recarregandoParaAtualizar = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registro) => registro.update())
      .catch(() => {});
  });
}
