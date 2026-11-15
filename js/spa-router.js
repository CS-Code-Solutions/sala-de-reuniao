/**
 * Navegação Instantânea sem Tela Branca (Zero-Flicker SPA Router) - MeetingRoom
 * Mantém o cabeçalho e o menu inferior imóveis na tela e troca apenas o <main>.
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

      // Atualiza título e substitui APENAS o <main> (cabeçalho e menu não piscam)
      document.title = novoDoc.title || document.title;
      mainAtual.replaceWith(novoMain);

      if (empurrarHistorico) {
        window.history.pushState({ url }, '', url);
      }

      atualizarMenuAtivo(url);
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Reexecuta scripts específicos da página carregada (exceto anti-flicker e o próprio router)
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
    } catch (err) {
      window.location.href = url;
    }
  }

  // Pré-carrega as páginas do menu em segundo plano para troca em 0ms
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

  // Intercepta cliques nos links internos de navegação
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
