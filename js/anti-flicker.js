/**
 * Blindagem Anti-Piscada (Anti-Flicker Shield) - MeetingRoom
 * Hidrata cabeçalho, menus e tema via localStorage em 0ms (sem tela branca)
 * e mantém a trava apenas quando não há sessão em cache nas rotas privadas.
 */
(function () {
  const STORAGE_KEY = 'mr_perfil_ui';
  const THEME_KEY = 'meetingroom_theme';
  const MAX_LOCK_TIME_MS = 3000;
  let isRevealed = false;

  const root = document.documentElement;
  const path = window.location.pathname;
  const isLoginOrPublic =
    root.hasAttribute('data-public-page') ||
    path.endsWith('login.html') ||
    path.endsWith('index.html') ||
    path === '/' ||
    path.endsWith('/sala-de-reuniao/');

  // 1. Aplica tema salvo localmente antes da renderização
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      root.setAttribute('data-theme', savedTheme);
    }
  } catch (e) {}

  // 2. Lê cache de interface do usuário logado
  let cachedProfile = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) cachedProfile = JSON.parse(raw);
  } catch (e) {}

  // 3. Injeta regras CSS de controle instantâneo (menus admin e proteção sem sessão)
  const style = document.createElement('style');
  style.id = 'anti-flicker-style';
  style.textContent = `
    /* Oculta itens admin imediatamente se o perfil em cache não for Administrador */
    html.mr-not-admin .admin-only-item {
      display: none !important;
    }
    /* Bloqueia o body APENAS se for rota privada sem sessão em cache */
    html.af-locked body {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
    html.af-ready body {
      opacity: 1 !important;
      visibility: visible !important;
      transition: opacity 0.15s ease-out;
    }
  `;
  document.head.appendChild(style);

  // 4. Decide entre renderização instantânea (com cache) ou bloqueio preventivo (sem cache)
  if (cachedProfile && cachedProfile.uid) {
    root.classList.add('mr-has-session');
    root.classList.add(cachedProfile.ehAdmin ? 'mr-is-admin' : 'mr-not-admin');
    isRevealed = true; // Não esconde o body: cabeçalho e menus abrem na hora

    // Preenche nome/avatar assim que os elementos surgirem no DOM (antes de piscar)
    const aplicarDadosCache = () => {
      if (!cachedProfile.nome) return;
      const userNameDisplay = document.getElementById('userNameDisplay');
      const userAvatarMobile = document.getElementById('userAvatarMobile');

      if (userNameDisplay && userNameDisplay.textContent.trim() !== cachedProfile.nome) {
        userNameDisplay.textContent = cachedProfile.nome;
      }
      if (userAvatarMobile && !userAvatarMobile.textContent.includes(cachedProfile.nome)) {
        userAvatarMobile.textContent = 'Olá, ' + cachedProfile.nome;
      }
    };

    const observer = new MutationObserver(() => {
      aplicarDadosCache();
      if (document.getElementById('userNameDisplay') && document.getElementById('userAvatarMobile')) {
        observer.disconnect();
      }
    });
    observer.observe(root, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', () => {
      aplicarDadosCache();
      observer.disconnect();
    });
  } else if (!isLoginOrPublic) {
    // Sem sessão salva em página protegida: oculta até o Firebase confirmar ou redirecionar
    root.classList.add('af-locked');
  }

  // 5. Função global para liberar a tela e atualizar classes de permissão
  function reveal(perfilAtualizado) {
    if (perfilAtualizado && typeof perfilAtualizado.ehAdmin === 'boolean') {
      root.classList.toggle('mr-is-admin', perfilAtualizado.ehAdmin);
      root.classList.toggle('mr-not-admin', !perfilAtualizado.ehAdmin);
    }

    if (isRevealed) return;
    isRevealed = true;

    root.classList.remove('af-locked');
    root.classList.add('af-ready');

    setTimeout(() => {
      const lockStyle = document.getElementById('anti-flicker-style');
      if (lockStyle && !root.classList.contains('mr-not-admin')) {
        lockStyle.remove();
      }
    }, 250);
  }

  window.AntiFlicker = {
    reveal,
    isLocked: () => !isRevealed
  };

  // Fail-safe caso o Firebase demore ou fique offline
  setTimeout(() => {
    if (!isRevealed) {
      reveal();
    }
  }, MAX_LOCK_TIME_MS);
})();
