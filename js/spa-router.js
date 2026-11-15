/**
 * Navegação Instantânea SPA Router (Atualizado) - MeetingRoom
 * Troca apenas o <main> e reinicia os scripts de dados da página correspondente.
 */
(function () {
  const PAGE_CACHE = new Map();

  function atualizarMenuAtivo(urlDestino) {
    const arquivoDestino = new URL(urlDestino, window.location.href).pathname.split('/').pop();
    document.querySelectorAll('nav a, .bottom-nav a, header a').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
      const arquivoLink = new URL(href, window.location.href).pathname.split('/').pop();
      const ativo = arquivoLink === arquivoDestino;
      link.classList.toggle('active', ativo);
      if (ativo) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  // Dispara funções globais de inicialização dependendo da página carregada
  function reexecutarLogicaDaPagina(url) {
    if (url.includes('calendar.html')) {
      if (typeof window.carregarAgenda === 'function') window.carregarAgenda();
    } else if (url.includes('reservations.html')) {
      if (typeof window.carregarReservas === 'function') window.carregarReservas();
    } else if (url.includes('rooms.html')) {
      if (typeof window.carregarSalas === 'function') window.carregarSalas();
    } else if (url.includes('notifications.html')) {
      if (typeof window.carregarNotificacoes === 'function') window.carregarNotificacoes();
    } else if (url.includes('admin-users.html')) {
      if (typeof window.carregarUsuariosAdmin === 'function') window.carregarUsuariosAdmin();
    }
  }

  async function carregarPagina(url, empurrarHistorico = true) {
    const mainAtual = document.querySelector('main');
    if (!mainAtual) {
      window.location.href = url;
      return;
    }

    try {
      let htmlTexto = PAGE_CACHE.get(url);
      if (!htmlTexto) {
        const resp = await fetch(url, { credentials: 'same-origin' });
        if (!resp.ok) throw new Error('Falha ao carregar rota');
        htmlTexto = await resp.text();
        PAGE_CACHE.set(url, htmlTexto);
      }

      const parser = new DOMParser();
      const novoDoc = parser.parseFromString(htmlTexto, 'text/html');
      const novoMain = novoDoc.querySelector('main');

      if (!novoMain) {
        window.location.href = url;
        return;
      }

      document.title = novoDoc.title || document.title;
      mainAtual.replaceWith(novoMain);

      if (empurrarHistorico) {
        window.history.pushState({ url }, '', url);
      }

      atualizarMenuAtivo(url);
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Executa scripts inline ou externos da nova página
      const scripts = novoDoc.querySelectorAll('body script');
      for (const oldScript of scripts) {
        const src = oldScript.getAttribute('src') || '';
        if (src.includes('anti-flicker') || src.includes('spa-router')) continue;

        const newScript = document.createElement('script');
        if (oldScript.type) newScript.type = oldScript.type;
        if (src) {
          newScript.src = src + (src.includes('?') ? '&' : '?') + '_v=' + Date.now();
        } else {
          newScript.textContent = oldScript.textContent;
        }
        document.body.appendChild(newScript);
        newScript.remove();
      }

      // Garante chamada das funções de dados
      setTimeout(() => reexecutarLogicaDaPagina(url), 100);

    } catch (err) {
      window.location.href = url;
    }
  }

  function preCarregarAbas() {
    document.querySelectorAll('nav a, .bottom-nav a').forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href.endsWith('.html') && !PAGE_CACHE.has(link.href)) {
        fetch(link.href, { credentials: 'same-origin' })
          .then((r) => (r.ok ? r.text() : null))
          .then((txt) => {
            if (txt) PAGE_CACHE.set(link.href, txt);
          })
          .catch(() => {});
      }
    });
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      link.target === '_blank' ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }

    const destino = new URL(link.href, window.location.href);
    if (destino.origin !== window.location.origin || !destino.pathname.endsWith('.html')) return;
    if (destino.pathname.endsWith('index.html') || destino.pathname.endsWith('login.html')) return;

    e.preventDefault();
    if (destino.href !== window.location.href) {
      carregarPagina(destino.href, true);
    }
  });

  window.addEventListener('popstate', () => {
    carregarPagina(window.location.href, false);
  });

  document.addEventListener('DOMContentLoaded', () => {
    PAGE_CACHE.set(window.location.href, document.documentElement.outerHTML);
    setTimeout(preCarregarAbas, 300);
  });
})();
