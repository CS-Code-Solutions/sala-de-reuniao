/**
 * Blindagem Anti-Piscada (Anti-Flicker Shield) - MeetingRoom
 * Bloqueia a renderização inicial até a validação de sessão/permissões (Firebase Auth)
 * e aplica transições suaves na liberação da interface.
 */
(function () {
  const MAX_LOCK_TIME_MS = 3500;
  let isRevealed = false;

  const style = document.createElement('style');
  style.id = 'anti-flicker-style';
  style.textContent = `
    html.af-locked body {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
    html.af-ready body {
      opacity: 1 !important;
      visibility: visible !important;
      transition: opacity 0.22s ease-out;
    }
  `;
  document.head.appendChild(style);

  document.documentElement.classList.add('af-locked');

  function reveal() {
    if (isRevealed) return;
    isRevealed = true;

    const root = document.documentElement;
    root.classList.remove('af-locked');
    root.classList.add('af-ready');

    setTimeout(() => {
      const lockStyle = document.getElementById('anti-flicker-style');
      if (lockStyle) lockStyle.remove();
    }, 300);
  }

  window.AntiFlicker = {
    reveal,
    isLocked: () => !isRevealed
  };

  setTimeout(() => {
    if (!isRevealed) {
      reveal();
    }
  }, MAX_LOCK_TIME_MS);

  document.addEventListener('DOMContentLoaded', () => {
    if (document.documentElement.hasAttribute('data-public-page')) {
      reveal();
    }
  });
})();
