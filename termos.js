// ==========================================
// MÓDULO DE TERMOS DE USO E LGPD (js/termos.js)
// ==========================================

const VERSAO_TERMOS_ATUAL = "v1.1.0";
let usuarioTermosAtual = null;

function obterCaminhoPoliticaPrivacidade() {
  return window.location.pathname.includes("/pages/")
    ? "privacy-policy.html"
    : "pages/privacy-policy.html";
}

function mostrarFeedbackTermos(mensagem, tipo = "error") {
  const box = document.getElementById("feedbackTermosUso");
  if (!box) return;

  box.innerText = mensagem;
  box.style.display = "block";

  if (tipo === "error") {
    box.style.background = "#fef2f2";
    box.style.color = "#b91c1c";
    box.style.border = "1px solid #fecaca";
  } else {
    box.style.background = "#f0fdf4";
    box.style.color = "#15803d";
    box.style.border = "1px solid #bbf7d0";
  }
}

// Injeta o HTML do modal dinamicamente na página
function injetarModalTermosHTML() {
  if (document.getElementById("modalTermosUso")) return;

  const linkPrivacidade = obterCaminhoPoliticaPrivacidade();

  const modalHTML = `
    <!-- Modal de Termos de Uso e Condições (Obrigatório - LGPD) -->
    <div class="modal-overlay" id="modalTermosUso" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(5px); z-index: 9999; justify-content: center; align-items: center; padding: 16px;">
      <div class="modal-card" style="background: #ffffff; width: 100%; max-width: 500px; border-radius: 16px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2); display: flex; flex-direction: column; gap: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 2px;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(13, 148, 136, 0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div>
            <h3 style="font-size: 18px; font-weight: 700; color: #1e293b; margin: 0;">Termos de Uso e Privacidade</h3>
            <span style="font-size: 11px; color: #64748b; font-weight: 600;">Versão vigente: ${VERSAO_TERMOS_ATUAL}</span>
          </div>
        </div>
        
        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
          Para garantir a segurança, transparência e conformidade com a <strong>LGPD (Lei nº 13.709/2018)</strong>, leia e confirme os Termos de Uso antes de continuar:
        </p>

        <!-- Caixa de texto com os termos rolável -->
        <div style="background: #f8fafc; padding: 14px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 12.5px; color: #334155; height: 150px; overflow-y: auto; line-height: 1.55;">
          <strong>1. Objeto da Plataforma:</strong> O sistema <strong>MeetingRoom</strong> destina-se exclusivamente à gestão, consulta e agendamento de salas de reuniões corporativas.<br><br>
          <strong>2. Responsabilidades do Utilizador:</strong> O utilizador compromete-se a inserir informações verídicas, respeitar os horários agendados, liberar o espaço pontualmente e cancelar reservas que não serão utilizadas.<br><br>
          <strong>3. Tratamento de Dados (LGPD):</strong> Os dados pessoais tratados (nome, apelido, e-mail corporativo, cargo e histórico de reservas) são utilizados estritamente para autenticação, identificação interna, negociação de horários e notificações operacionais, conforme detalhado na nossa <a href="${linkPrivacidade}" target="_blank" rel="noopener noreferrer" style="color: #0d9488; font-weight: 600; text-decoration: underline;">Política de Privacidade</a>.<br><br>
          <strong>4. Auditoria e Segurança:</strong> Cada agendamento, alteração ou cancelamento fica associado ao identificador único do utilizador autenticado para rastreabilidade interna.
        </div>

        <!-- Feedback visual de validação/erro -->
        <div id="feedbackTermosUso" style="display: none; padding: 10px 12px; border-radius: 8px; font-size: 12.5px; font-weight: 500;"></div>

        <!-- Checkbox ativo obrigatório -->
        <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; margin-top: 2px; user-select: none;">
          <input type="checkbox" id="checkAceiteTermos" onchange="document.getElementById('feedbackTermosUso').style.display='none'" style="margin-top: 2px; width: 18px; height: 18px; accent-color: #0d9488; cursor: pointer; flex-shrink: 0;">
          <span style="font-size: 13px; color: #1e293b; font-weight: 500; line-height: 1.4;">
            Li e aceito os <strong>Termos de Uso</strong> e a <a href="${linkPrivacidade}" target="_blank" rel="noopener noreferrer" style="color: #0d9488; font-weight: 600; text-decoration: underline;">Política de Privacidade</a>.
          </span>
        </label>

        <!-- Botão de submissão -->
        <div style="margin-top: 4px;">
          <button type="button" id="btnConfirmarTermos" onclick="confirmarAceiteTermosFirebase()" style="width: 100%; padding: 12px; font-size: 14px; background: #0d9488; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
            Continuar para o Sistema
          </button>
        </div>

      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

// Resolve o utilizador autenticado a partir do parâmetro, Firebase Auth ou cache de perfil
function obterUsuarioAutenticadoTermos(usuarioParam = null) {
  let perfilCache = null;
  try {
    perfilCache =
      JSON.parse(localStorage.getItem("meetingroom_perfil_ui") || "null") ||
      JSON.parse(localStorage.getItem("meetingroom_sessao_atual") || "null");
  } catch (e) {
    perfilCache = null;
  }

  const firebaseUser =
    typeof firebase !== "undefined" && firebase.auth
      ? (window.auth || firebase.auth()).currentUser
      : null;

  const uid =
    (usuarioParam && usuarioParam.uid) ||
    (firebaseUser && firebaseUser.uid) ||
    (perfilCache && perfilCache.uid) ||
    null;

  if (!uid) return null;

  const email =
    (usuarioParam && usuarioParam.email) ||
    (firebaseUser && firebaseUser.email) ||
    (perfilCache && perfilCache.email) ||
    "";

  const nome =
    (usuarioParam && (usuarioParam.nome || usuarioParam.displayName)) ||
    (perfilCache && (perfilCache.nome || perfilCache.apelido)) ||
    (firebaseUser && firebaseUser.displayName) ||
    (email ? email.split("@")[0] : "Utilizador");

  return { uid, nome, email };
}

// Verifica no Cloud Firestore se o utilizador já aceitou a versão vigente
async function verificarAceiteTermosUtilizador(usuarioSessao = null) {
  const user = obterUsuarioAutenticadoTermos(usuarioSessao);
  if (!user || !user.uid) return;

  usuarioTermosAtual = user;
  injetarModalTermosHTML();

  const dbService = window.db || firebase.firestore();

  try {
    const docSnap = await dbService.collection("termos_aceites").doc(user.uid).get();
    const dadosAceite = docSnap.exists ? docSnap.data() : null;

    if (!dadosAceite || dadosAceite.versao !== VERSAO_TERMOS_ATUAL) {
      document.getElementById("modalTermosUso").style.display = "flex";
    } else {
      localStorage.setItem(`meetingroom_termos_ok_${user.uid}`, VERSAO_TERMOS_ATUAL);
    }
  } catch (error) {
    console.error("Erro ao verificar termos de uso no Firestore:", error);
  }
}

// Regista a prova de consentimento LGPD no Cloud Firestore após o clique ativo
async function confirmarAceiteTermosFirebase() {
  const checkbox = document.getElementById("checkAceiteTermos");

  if (!checkbox || !checkbox.checked) {
    mostrarFeedbackTermos("Para continuar, marque a caixa confirmando que leu e aceita os Termos de Uso e a Política de Privacidade.");
    return;
  }

  const user = usuarioTermosAtual || obterUsuarioAutenticadoTermos();
  if (!user || !user.uid) {
    mostrarFeedbackTermos("Sessão não identificada. Recarregue a página ou faça login novamente.");
    return;
  }

  const btn = document.getElementById("btnConfirmarTermos");
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = "0.7";
    btn.innerText = "A registar aceite...";
  }

  const dbService = window.db || firebase.firestore();

  const registroAceite = {
    userId: user.uid,
    nome: user.nome || "Utilizador",
    email: user.email || "",
    versao: VERSAO_TERMOS_ATUAL,
    aceito: true,
    dataHoraAceite: new Date().toISOString(),
    registradoEm: firebase.firestore.FieldValue.serverTimestamp(),
    userAgent: navigator.userAgent
  };

  try {
    await dbService
      .collection("termos_aceites")
      .doc(user.uid)
      .set(registroAceite, { merge: true });

    localStorage.setItem(`meetingroom_termos_ok_${user.uid}`, VERSAO_TERMOS_ATUAL);
    document.getElementById("modalTermosUso").style.display = "none";
  } catch (error) {
    console.error("Erro ao salvar aceite no Firestore:", error);
    mostrarFeedbackTermos("Ocorreu um erro ao registar o seu aceite. Verifique a ligação e tente novamente.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.innerText = "Continuar para o Sistema";
    }
  }
}

// Verificação automática ao carregar páginas internas que incluam js/termos.js
document.addEventListener("DOMContentLoaded", () => {
  if (window.DESATIVAR_AUTO_TERMOS) return;

  if (typeof firebase !== "undefined" && firebase.auth) {
    const authService = window.auth || firebase.auth();
    authService.onAuthStateChanged((user) => {
      if (user) {
        verificarAceiteTermosUtilizador(user);
      }
    });
  }
});
