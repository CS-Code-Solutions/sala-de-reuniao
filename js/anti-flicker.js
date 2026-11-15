/**
 * Blindagem Anti-Piscada (Anti-Flicker Shield / Ant Pisc) - MeetingRoom
 * Hidrata tema, cabeçalho, menus, permissoes e White-Label via localStorage em 0ms
 * e aplica trava condicional apenas quando nao ha sessao em cache nas rotas privadas.
 */
(function () {
  const STORAGE_KEY = 'mr_perfil_ui';
  const THEME_KEY = 'meetingroom_theme';
  const MAX_LOCK_TIME_MS = 3000;
  let isRevealed = false;

  const root = document.documentElement;
  const path = window.location.pathname;
  const paginaAtual = path.split('/').pop() || 'index.html';
  const isLoginOrPublic =
    root.hasAttribute('data-public-page') ||
    paginaAtual === 'login.html' ||
    paginaAtual === 'index.html' ||
    path === '/' ||
    path.endsWith('/sala-de-reuniao/');

  // 1. Aplica tema salvo localmente antes da renderizacao
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) root.setAttribute('data-theme', savedTheme);
  } catch (e) {}

  // 2. Le cache de interface e permissoes do usuario
  let cachedProfile = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) cachedProfile = JSON.parse(raw);
  } catch (e) {}

  // 3. Redirecionamento imediato se a rota atual estiver bloqueada no cache
  const modulosNegados = (cachedProfile && Array.isArray(cachedProfile.modulosNegados))
    ? cachedProfile.modulosNegados
    : [];

  if (cachedProfile && cachedProfile.uid && !cachedProfile.ehAdmin && modulosNegados.includes(paginaAtual)) {
    const destinoPadrao = path.includes('/pages/') ? 'calendar.html' : 'pages/calendar.html';
    window.location.replace(cachedProfile.paginaInicial || destinoPadrao);
    return;
  }

  // 4. Injeta regras CSS via CSSOM antes do <body> existir
  let dynamicCss = `
    html.af-not-admin .admin-only-item { display: none !important; }
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

  if (cachedProfile && !cachedProfile.ehAdmin) {
    modulosNegados.forEach((rota) => {
      const rotaLimpa = String(rota).replace(/[^a-zA-Z0-9_.-]/g, '');
      if (rotaLimpa) {
        dynamicCss += `a[href$="${rotaLimpa}"], [data-route="${rotaLimpa}"] { display: none !important; }\n`;
      }
    });
  }

  // White-Label instantaneo (suporta <img> e containers com background)
  let logoSalva = null;
  try {
    logoSalva = (cachedProfile && cachedProfile.logoBase64) || localStorage.getItem('mr_logo_base64');
  } catch (e) {}

  if (logoSalva && /^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,/i.test(logoSalva)) {
    dynamicCss += `img#logo-cliente { content: url("${logoSalva}"); }\n`;
    dynamicCss += `.logo-cliente-bg { background-image: url("${logoSalva}") !important; }\n`;
  }

  const style = document.createElement('style');
  style.id = 'anti-flicker-style';
  style.textContent = dynamicCss;
  document.head.appendChild(style);

  // 5. Decide entre renderizacao instantanea (com cache) ou bloqueio preventivo (sem cache)
  if (cachedProfile && cachedProfile.uid) {
    root.classList.add('af-has-session');
    root.classList.add(cachedProfile.ehAdmin ? 'af-is-admin' : 'af-not-admin');
    isRevealed = true;

    // Hidrata nome/avatar no exato milissegundo em que surgirem no DOM
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
    root.classList.add('af-locked');
  }

  // 6. Funcao global para liberar a tela e atualizar classes apos validacao no Firebase
  function reveal(perfilAtualizado) {
    if (perfilAtualizado && typeof perfilAtualizado.ehAdmin === 'boolean') {
      root.classList.toggle('af-is-admin', perfilAtualizado.ehAdmin);
      root.classList.toggle('af-not-admin', !perfilAtualizado.ehAdmin);
    }

    if (isRevealed) return;
    isRevealed = true;

    root.classList.remove('af-locked');
    root.classList.add('af-ready');

    // Mantem #anti-flicker-style se houver regras ativas de permissao ou White-Label
    setTimeout(() => {
      const lockStyle = document.getElementById('anti-flicker-style');
      if (
        lockStyle &&
        !root.classList.contains('af-not-admin') &&
        modulosNegados.length === 0 &&
        !logoSalva
      ) {
        lockStyle.remove();
      }
    }, 250);
  }

  window.AntiFlicker = {
    reveal,
    isLocked: () => !isRevealed
  };

  // Fail-safe para evitar tela presa caso o Firebase demore ou fique offline
  setTimeout(() => {
    if (!isRevealed) reveal();
  }, MAX_LOCK_TIME_MS);
})();
