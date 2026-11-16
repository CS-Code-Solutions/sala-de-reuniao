// ==========================================
// MÓDULO DE TERMOS DE USO E LGPD (termos.js)
// ==========================================

const VERSAO_TERMOS_ATUAL = "1.0.0";

// Injeta o HTML do modal dinamicamente na página
function injetarModalTermosHTML() {
  if (document.getElementById("modalTermosUso")) return;

  const modalHTML = `
    <!-- Modal de Termos de Uso e Condições (Obrigatório) -->
    <div class="modal-overlay" id="modalTermosUso" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(5px); z-index: 9999; justify-content: center; align-items: center; padding: 16px;">
      <div class="modal-card" style="background: white; width: 100%; max-width: 480px; border-radius: 16px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; gap: 14px;">
        
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <h3 style="font-size: 18px; font-weight: 700; color: #1e293b; margin: 0;">Termos de Uso e Condições</h3>
        </div>
        
        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
          Para garantir a segurança, transparência e o uso adequado da plataforma, atualizamos os nossos Termos de Uso e Condições.
        </p>

        <!-- Caixa de texto com os termos rolável -->
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; color: #334155; height: 130px; overflow-y: auto; line-height: 1.5;">
          <strong>1. Objeto:</strong> O sistema destina-se estritamente à gestão e agendamento de salas de reuniões corporativas.<br><br>
          <strong>2. Responsabilidades:</strong> O utilizador compromete-se a inserir informações verídicas, respeitar os horários agendados e libertar o espaço pontualmente.<br><br>
          <strong>3. Privacidade:</strong> Os dados recolhidos (nome e cargo) são tratados em conformidade com a LGPD para identificação e eventual negociação interna.<br><br>
          <strong>Versão atual dos Termos:</strong> v${VERSAO_TERMOS_ATUAL}
        </div>

        <!-- Checkbox ativo obrigatório -->
        <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; margin-top: 4px;">
          <input type="checkbox" id="checkAceiteTermos" style="margin-top: 2px; width: 18px; height: 18px; accent-color: #0d9488;">
          <span style="font-size: 13px; color: #1e293b; font-weight: 500;">
            Li e aceito os Termos de Uso e Condições da plataforma.
          </span>
        </label>

        <!-- Botão de submissão -->
        <div style="margin-top: 8px;">
          <button id="btnConfirmarTermos" onclick="confirmarAceiteTermosFirebase()" style="width: 100%; padding: 12px; font-size: 14px; background: #0d9488; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
            Continuar para o Sistema
          </button>
        </div>

      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

// Verifica no Cloud Firestore se o utilizador já aceitou a versão vigente
async function verificarAceiteTermosUtilizador(usuarioSessao) {
  const userAuth = typeof firebase !== "undefined" && firebase.auth ? firebase.auth().currentUser : null;
  const uid = (userAuth && userAuth.uid) || (usuarioSessao && usuarioSessao.uid);
  if (!uid || typeof firebase === "undefined") return;

  if (!document.getElementById("modalTermosUso")) {
    injetarModalTermosHTML();
  }

  try {
    const firestore = window.db || firebase.firestore();
    const docSnap = await firestore.collection("termos_aceites").doc(uid).get();

    if (!docSnap.exists) {
      document.getElementById("modalTermosUso").style.display = "flex";
      return;
    }

    const dadosAceite = docSnap.data();
    if (!dadosAceite.aceito || dadosAceite.versao !== VERSAO_TERMOS_ATUAL) {
      document.getElementById("modalTermosUso").style.display = "flex";
    }
  } catch (error) {
    console.error("Erro ao verificar termos de uso no Firestore:", error);
  }
}

// Regista o aceite no Cloud Firestore após o clique ativo
async function confirmarAceiteTermosFirebase() {
  const checkbox = document.getElementById("checkAceiteTermos");
  const btn = document.getElementById("btnConfirmarTermos");

  if (!checkbox || !checkbox.checked) {
    alert("Para continuar, deve ler e marcar a caixa de confirmação dos Termos de Uso.");
    return;
  }

  const userAuth = firebase.auth().currentUser;
  const sessaoStr = localStorage.getItem("meetingroom_sessao_atual");
  const usuarioSessao = sessaoStr ? JSON.parse(sessaoStr) : {};
  const uid = (userAuth && userAuth.uid) || usuarioSessao.uid;

  if (!uid) return;

  if (btn) {
    btn.disabled = true;
    btn.textContent = "A registar...";
  }

  const registroAceite = {
    aceito: true,
    dataAceite: firebase.firestore.FieldValue.serverTimestamp(),
    email: (userAuth && userAuth.email) || usuarioSessao.email || "",
    nome: usuarioSessao.apelido || usuarioSessao.nome || "Utilizador",
    userAgent: navigator.userAgent,
    versao: VERSAO_TERMOS_ATUAL
  };

  try {
    const firestore = window.db || firebase.firestore();
    await firestore.collection("termos_aceites").doc(uid).set(registroAceite, { merge: true });
    document.getElementById("modalTermosUso").style.display = "none";
  } catch (error) {
    console.error("Erro ao salvar aceite no Firestore:", error);
    alert("Ocorreu um erro ao registar o seu aceite. Por favor, tente novamente.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Continuar para o Sistema";
    }
  }
}
