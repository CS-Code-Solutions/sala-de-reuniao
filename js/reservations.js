import { db } from "./firebase-config.js";
import { verificarAutenticacao } from "./auth.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let usuarioLogado = null;

document.addEventListener("DOMContentLoaded", () => {
  verificarAutenticacao((user) => {
    usuarioLogado = user;
    carregarMinhasReservas();
  });
});

function carregarMinhasReservas() {
  const container = document.getElementById("listaMinhasReservas");
  if (!container || !usuarioLogado) return;

  container.innerHTML = `<p style="color: var(--text-muted); font-size: 14px;">A carregar suas reservas...</p>`;

  const q = usuarioLogado.ehAdmin
    ? query(collection(db, "reservas"))
    : query(collection(db, "reservas"), where("userId", "==", usuarioLogado.uid));

  onSnapshot(
    q,
    (snapshot) => {
      const lista = [];
      snapshot.forEach((docSnap) => {
        lista.push({ id: docSnap.id, ...docSnap.data() });
      });

      lista.sort((a, b) => `${a.data} ${a.inicio}`.localeCompare(`${b.data} ${b.inicio}`));

      if (lista.length === 0) {
        container.innerHTML = `
          <div class="slot-item">
            <div>
              <strong>Nenhuma reserva encontrada</strong>
              <p style="font-size: 13px; color: var(--text-muted);">Você ainda não possui reuniões agendadas.</p>
            </div>
            <a href="calendar.html" style="padding: 8px 16px; background: var(--primary); color: white; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 500;">Agendar agora</a>
          </div>
        `;
        return;
      }

      container.innerHTML = "";
      lista.forEach((res) => {
        const dataBr = res.data ? res.data.split("-").reverse().join("/") : "";
        const div = document.createElement("div");
        div.className = "slot-item reservado";
        div.innerHTML = `
          <div>
            <strong>${res.titulo}</strong>
            <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
              ${dataBr} • ${res.inicio} - ${res.fim} (${res.sala || "Sala de Reuniões 01"})
              ${usuarioLogado.ehAdmin ? ` • <em>Resp: ${res.responsavel || res.emailResponsavel}</em>` : ""}
            </p>
          </div>
          <button onclick="cancelarReserva('${res.id}')">Cancelar Reserva</button>
        `;
        container.appendChild(div);
      });
    },
    (error) => {
      console.error("Erro ao carregar reservas:", error);
      container.innerHTML = `<p style="color: #ef4444;">Erro ao carregar reservas do servidor.</p>`;
    }
  );
}

window.cancelarReserva = async function (id) {
  if (!confirm("Tem certeza que deseja cancelar esta reserva? O horário ficará livre para outros usuários.")) {
    return;
  }

  try {
    await deleteDoc(doc(db, "reservas", id));
    alert("Reserva cancelada com sucesso!");
  } catch (error) {
    console.error("Erro ao cancelar reserva:", error);
    alert("Não foi possível cancelar a reserva.");
  }
};
