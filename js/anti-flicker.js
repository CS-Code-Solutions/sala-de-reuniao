/**
 * Blindagem Anti-Piscada (Anti-Flicker Shield) - MeetingRoom
 * Bloqueia a renderização inicial até a validação de sessão/permissões (Firebase Auth)
 * e aplica transições suaves na liberação da interface.
 */
(function () {
  const MAX_LOCK_TIME_MS = 3500; // Fail-safe: libera a tela em no máximo 3.5s
  let isRevealed = false;

  // 1. Injeta o estilo de bloqueio imediatamente antes do primeiro paint
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

  // 2. Ativa o bloqueio na tag <html>
  document.documentElement.classList.add('af-locked');

  // 3. Aplica tema salvo localmente antes da renderização (evita piscada de cores)
  try {
    const savedTheme = localStorage.getItem('meetingroom_theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  } catch (e) {
    // Ignora bloqueios de storage em modo privado restrito
  }

  // 4. Função global para liberar a tela após validação de Auth/Firestore
  function reveal() {
    if (isRevealed) return;
    isRevealed = true;

    const root = document.documentElement;
    root.classList.remove('af-locked');
    root.classList.add('af-ready');

    // Remove o <style> temporário após a transição para manter o DOM limpo
    setTimeout(() => {
      const lockStyle = document.getElementById('anti-flicker-style');
      if (lockStyle) lockStyle.remove();
    }, 300);
  }

  // 5. API pública para o auth.js e demais módulos
  window.AntiFlicker = {
    reveal,
    isLocked: () => !isRevealed
  };

  // 6. Fail-safe: garante desbloqueio caso o Firebase demore ou fique offline
  setTimeout(() => {
    if (!isRevealed) {
      console.warn('[AntiFlicker] Tempo limite atingido. Liberando interface por segurança.');
      reveal();
    }
  }, MAX_LOCK_TIME_MS);

  // 7. Páginas marcadas como públicas liberam assim que o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', () => {
    if (document.documentElement.hasAttribute('data-public-page')) {
      reveal();
    }
  });
})();
