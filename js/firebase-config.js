// ==========================================
// CONFIGURAÇÃO OFICIAL DO FIREBASE (firebase-config.js)
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyDa9ztrK6VxFVeLbP0ge6-31V05gnztjJw",
  authDomain: "reuniao-d1b29.firebaseapp.com",
  projectId: "reuniao-d1b29",
  storageBucket: "reuniao-d1b29.firebasestorage.app",
  messagingSenderId: "887897617950",
  appId: "1:887897617950:web:e96cf3cce4792e7e2b600f"
};

window.firebaseConfig = firebaseConfig;

if (typeof window.firebase !== "undefined") {
  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
  }
  window.auth = window.firebase.auth();
  window.db = window.firebase.firestore();
}

// Instância secundária para o Admin cadastrar novos usuários sem encerrar a própria sessão
window.obterAuthSecundario = function () {
  const nomeAppSecundario = "AdminUserCreator";
  let secondaryApp = window.firebase.apps.find((app) => app.name === nomeAppSecundario);
  if (!secondaryApp) {
    secondaryApp = window.firebase.initializeApp(firebaseConfig, nomeAppSecundario);
  }
  return secondaryApp.auth();
};
