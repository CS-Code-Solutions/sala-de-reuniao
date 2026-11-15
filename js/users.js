import { db } from "./firebase-config.js";
import { verificarAutenticacao } from "./auth.js";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  verificarAutenticacao((user) => {
    if (user.ehAdmin) {
      carregarUtilizadores();
    }
  });
});

function carregarUtilizadores() {
  const container = document.getElementById("listaUtilizadores");
  if (!container) return;

  container.innerHTML = `<p style="color: var(--text-muted); font-size: 14px;">A carregar utilizadores...</p>`;

  onSnapshot(
    collection(db, "usuarios"),
    (snapshot) => {
      container.innerHTML = "";

      if (snapshot.empty) {
        container.innerHTML = `<p style="color: var(--text-muted);">Nenhum utilizador registado no Firestore.</p>`;
        return;
      }

      snapshot.forEach((docSnap) => {
        const user = { id: docSnap.id, ...docSnap.data() };
        const perfil = user.cargo || "Usuário";
        let corPerfil = "var(--text-muted)";
        if (perfil === "Administrador") corPerfil = "var(--primary)";
        if (perfil === "Recepcionista") corPerfil = "#10b981";

        const div = document.createElement("div");
        div.className = "slot-item";
        div.innerHTML = `
          <div>
            <strong>${user.nome || user.apelido || "Sem nome"}</strong>
            <p style="font-size: 13px; color: var(--text-muted);">${user.email || ""}</p>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: ${corPerfil}; font-weight: 600; font-size: 13px;">${perfil}</span>
            <button onclick="alterarCargoUtilizador('${user.id}', '${perfil}')" style="padding: 6px 12px; background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">Alterar Cargo</button>
            <button onclick="removerUtilizadorFirestore('${user.id}', '${user.email || ""}')" style="padding: 6px 12px; background: #fee2e2; color: #b91c1c; border: none; border-radius: 6px; cursor: pointer;">Remover</button>
          </div>
        `;
        container.appendChild(div);
      });
    },
    (error) => {
      console.error("Erro ao listar utilizadores:", error);
    }
  );
}

window.alterarCargoUtilizador = async function (uid, cargoAtual) {
  const novoCargo = prompt(
    `Cargo atual: ${cargoAtual}\nDigite o novo cargo (Administrador, Usuário ou Recepcionista):`,
    cargoAtual
  );
  if (!novoCargo) return;

  const cargosValidos = ["Administrador", "Usuário", "Recepcionista"];
  if (!cargosValidos.includes(novoCargo.trim())) {
    alert("Cargo inválido. Utilize: Administrador, Usuário ou Recepcionista.");
    return;
  }

  try {
    await updateDoc(doc(db, "usuarios", uid), {
      cargo: novoCargo.trim()
    });
    alert("Cargo atualizado com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar cargo:", error);
    alert("Erro ao atualizar cargo no Firestore.");
  }
};

window.removerUtilizadorFirestore = async function (uid, email) {
  if (!confirm(`Deseja remover o registo de perfil de ${email}?`)) return;

  try {
    await deleteDoc(doc(db, "usuarios", uid));
    alert("Perfil removido da base de dados.");
  } catch (error) {
    console.error("Erro ao remover perfil:", error);
    alert("Erro ao remover perfil.");
  }
};
