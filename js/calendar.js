import { db } from "./firebase-config.js";
import { verificarAutenticacao } from "./auth.js";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let dataAtual = new Date();
let tipoVisualizacaoAtual = "dia";
let salaSelecionada = "Sala de Reuniões 01";
let reservasCache = [];
let usuarioAtual = null;
let unsubscribeReservas = null;
let tempoAntecedenciaMinutos = 10;

document.addEventListener("DOMContentLoaded", () => {
  if (window.emailjs) {
    window.emailjs.init({ publicKey: "X6E_oavkyc9MgyxTc" });
  }

  verificarAutenticacao(async (user) => {
    usuarioAtual = user;
    await carregarPreferenciasUsuario();
    atualizarTextoData();
    iniciarEscutaReservas();
  });

  const seletorSala = document.getElementById("seletorSala");
  if (seletorSala) {
    seletorSala.addEventListener("change", (e) => {
      salaSelecionada = e.target.value;
      carregarAgendaComAnimacao();
    });
  }
});

async function carregarPreferenciasUsuario() {
  if (!usuarioAtual) return;
  try {
    const snap = await getDoc(doc(db, "usuarios", usuarioAtual.uid));
    if (snap.exists()) {
      const dados = snap.data();
      if (dados.apelido && dados.apelido.trim() !== "") {
        usuarioAtual.nome = dados.apelido.trim();
      }
      if (dados.notificacoes && dados.notificacoes.tempoAntecedencia) {
        tempoAntecedenciaMinutos = Number(dados.notificacoes.tempoAntecedencia) || 10;
      }
    }
  } catch (e) {
    console.error("Erro ao carregar preferências:", e);
  }
}

function formatarDataISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function horarioParaMinutos(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function iniciarEscutaReservas() {
  if (unsubscribeReservas) unsubscribeReservas();

  const q = query(collection(db, "reservas"));
  unsubscribeReservas = onSnapshot(
    q,
    (snapshot) => {
      reservasCache = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        reservasCache.push({
          id: docSnap.id,
          ...d,
          inicio: d.inicio || d.horarioInicio || "08:00",
          fim: d.fim || d.horarioFim || "09:00"
        });
      });
      verificarAvisosProximidade();
      carregarAgenda();
    },
    (error) => {
      console.error("Erro ao sincronizar reservas:", error);
    }
  );
}

function verificarAvisosProximidade() {
  if (!usuarioAtual) return;
  const hojeISO = formatarDataISO(new Date());
  const agora = new Date();

  reservasCache.forEach((r) => {
    if (r.data !== hojeISO) return;
    const ehMinha = r.userId === usuarioAtual.uid || r.responsavel === usuarioAtual.nome;
    if (!ehMinha) return;

    if (r.canceladoPorAdmin) {
      mostrarToastFlutuante(
        "Reunião Cancelada",
        `A sua reserva "${r.titulo}" na ${r.sala} (${r.inicio}) foi cancelada pela administração.`,
        "danger"
      );
    } else if (r.inicio) {
      const [h, m] = r.inicio.split(":").map(Number);
      const dataReuniao = new Date();
      dataReuniao.setHours(h, m, 0, 0);
      const diffMin = (dataReuniao - agora) / 60000;

      if (diffMin >= 0 && diffMin <= tempoAntecedenciaMinutos) {
        mostrarToastFlutuante(
          "Reunião Próxima",
          `A reunião "${r.titulo}" (${r.sala}) começa às ${r.inicio} (em ${Math.round(diffMin)} min).`,
          "warning"
        );
      }
    }
  });
}

window.mostrarToastFlutuante = function (titulo, mensagem, tipo = "info") {
  const container = document.getElementById("floatingToastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast-alert ${tipo}`;
  let icone = "📢";
  if (tipo === "warning") icone = "⏰";
  if (tipo === "danger") icone = "⚠️";

  toast.innerHTML = `
    <div style="font-size: 20px;">${icone}</div>
    <div style="flex: 1;">
      <h4 style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 2px 0;">${titulo}</h4>
      <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.4;">${mensagem}</p>
    </div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 6000);
};

window.mudarData = function (dias) {
  if (tipoVisualizacaoAtual === "dia") {
    dataAtual.setDate(dataAtual.getDate() + dias);
  } else if (tipoVisualizacaoAtual === "semana") {
    dataAtual.setDate(dataAtual.getDate() + dias * 7);
  } else if (tipoVisualizacaoAtual === "mes") {
    dataAtual.setMonth(dataAtual.getMonth() + dias);
  }
  atualizarTextoData();
  carregarAgendaComAnimacao();
};

window.resetarData = function () {
  dataAtual = new Date();
  atualizarTextoData();
  carregarAgendaComAnimacao();
};

window.mudarVisualizacao = function (tipo, btnClicado) {
  document.querySelectorAll("#viewTogglesGroup button").forEach((b) => b.classList.remove("active"));
  if (btnClicado) btnClicado.classList.add("active");
  tipoVisualizacaoAtual = tipo;
  atualizarTextoData();
  carregarAgendaComAnimacao();
};

function carregarAgendaComAnimacao() {
  const grid = document.getElementById("gridHorarios");
  if (grid) grid.style.opacity = "0.3";
  setTimeout(() => {
    carregarAgenda();
    if (grid) grid.style.opacity = "1";
  }, 150);
}

function atualizarTextoData() {
  const spanData = document.getElementById("dataAtualExibicao");
  if (!spanData) return;

  if (tipoVisualizacaoAtual === "mes") {
    const txt = dataAtual.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    spanData.innerText = txt.charAt(0).toUpperCase() + txt.slice(1);
  } else if (tipoVisualizacaoAtual === "semana") {
    const primeiroDia = new Date(dataAtual);
    primeiroDia.setDate(primeiroDia.getDate() - primeiroDia.getDay());
    const ultimoDia = new Date(primeiroDia);
    ultimoDia.setDate(ultimoDia.getDate() + 6);
    spanData.innerText = `${primeiroDia.getDate()} de ${primeiroDia.toLocaleDateString("pt-BR", { month: "short" })} - ${ultimoDia.getDate()} de ${ultimoDia.toLocaleDateString("pt-BR", { month: "short" })} de ${ultimoDia.getFullYear()}`;
  } else {
    spanData.innerText = dataAtual.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");
  }
}

function carregarAgenda() {
  const gridContainer = document.getElementById("gridHorarios");
  const proxContainer = document.getElementById("listaProximas");
  const headerMain = document.querySelector(".cal-main-header");
  if (!gridContainer) return;

  gridContainer.innerHTML = "";
  if (proxContainer) proxContainer.innerHTML = "";

  if (headerMain) {
    if (tipoVisualizacaoAtual === "dia") {
      const dataLonga = dataAtual.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
      headerMain.innerHTML = `<span>${salaSelecionada}</span><span>${dataLonga.charAt(0).toUpperCase() + dataLonga.slice(1)}</span>`;
    } else if (tipoVisualizacaoAtual === "semana") {
      headerMain.innerHTML = `<span>${salaSelecionada}</span><span>Vista Semanal</span>`;
    } else {
      headerMain.innerHTML = `<span>${salaSelecionada}</span><span>Vista Mensal</span>`;
    }
  }

  if (tipoVisualizacaoAtual === "dia") {
    renderizarVistaDia(gridContainer, proxContainer);
  } else if (tipoVisualizacaoAtual === "semana") {
    renderizarVistaSemana(gridContainer);
  } else {
    renderizarVistaMes(gridContainer);
  }
}

async function renderizarVistaDia(gridContainer, proxContainer) {
  const dataISO = formatarDataISO(dataAtual);
  const agora = new Date();
  const hojeISO = formatarDataISO(agora);
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

  const reservasDoDia = reservasCache
    .filter((r) => r.data === dataISO && (r.sala || "Sala de Reuniões 01") === salaSelecionada)
    .sort((a, b) => a.inicio.localeCompare(b.inicio));

  const faixasBase = [
    "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00"
  ].map((h) => {
    const [hh] = h.split(":");
    const fim = `${String(Number(hh) + 1).padStart(2, "0")}:00`;
    return { hora: h, inicio: h, fim };
  });

  for (const faixa of faixasBase) {
    const fIni = horarioParaMinutos(faixa.inicio);
    const fFim = horarioParaMinutos(faixa.fim);

    const reservaConflito = reservasDoDia.find((r) => {
      const rIni = horarioParaMinutos(r.inicio);
      const rFim = horarioParaMinutos(r.fim);
      return rIni < fFim && rFim > fIni;
    });

    const row = document.createElement("div");
    row.className = "time-row";

    if (reservaConflito) {
      let whatsappResp = "";
      if (reservaConflito.userId) {
        try {
          const uDoc = await getDoc(doc(db, "usuarios", reservaConflito.userId));
          if (uDoc.exists() && uDoc.data().whatsapp) {
            whatsappResp = uDoc.data().whatsapp;
          }
        } catch (e) {}
      }

      const btnAdmin = usuarioAtual?.ehAdmin
        ? `<button onclick="excluirReservaAdmin('${reservaConflito.id}')" style="background:#fee2e2; color:#dc2626; border:none; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer;">🗑️ Excluir</button>`
        : "";

      row.innerHTML = `
        <div class="time-label">${faixa.hora}</div>
        <div class="event-block ${reservaConflito.cor || "blue"}" style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <div>
            <div class="event-time">${reservaConflito.inicio} - ${reservaConflito.fim}</div>
            <div class="event-title">${reservaConflito.titulo}</div>
            <div class="event-meta">Responsável: ${reservaConflito.responsavel || "Equipa"}</div>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button onclick="abrirModalNegociacao('${salaSelecionada}', '${reservaConflito.data}', '${reservaConflito.inicio}', '${reservaConflito.responsavel || "Colega"}', '${whatsappResp}')" style="background:#ffffff; color:#0d9488; border:1px solid #99f6e4; padding:5px 10px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;">💬 Negociar</button>
            ${btnAdmin}
          </div>
        </div>
      `;
    } else {
      const passado = dataISO < hojeISO || (dataISO === hojeISO && fFim <= minutosAgora);
      if (passado) {
        row.innerHTML = `
          <div class="time-label">${faixa.hora}</div>
          <div class="event-block" style="background:#f1f5f9; border-left:4px solid #cbd5e1; color:#94a3b8; cursor:not-allowed;">
            <div class="event-time">${faixa.inicio} - ${faixa.fim} • Horário encerrado</div>
          </div>
        `;
      } else {
        row.innerHTML = `
          <div class="time-label">${faixa.hora}</div>
          <div class="event-block green" style="cursor:pointer;" onclick="abrirModalReserva('${faixa.inicio}', '${faixa.fim}')">
            <div class="event-time"><span>●</span> ${faixa.inicio} - ${faixa.fim} • Disponível (Clique para reservar)</div>
          </div>
        `;
      }
    }
    gridContainer.appendChild(row);
  }

  if (proxContainer) {
    if (reservasDoDia.length === 0) {
      proxContainer.innerHTML = `<div style="font-size: 13px; color: #94a3b8;">Sem reservas para este dia.</div>`;
    } else {
      reservasDoDia.forEach((res) => {
        const upItem = document.createElement("div");
        upItem.className = "upcoming-item";
        upItem.innerHTML = `
          <div class="dot ${res.cor || "blue"}"></div>
          <div class="up-info">
            <span class="up-time">${res.inicio} - ${res.fim}</span>
            <span class="up-title">${res.titulo}</span>
            <span class="up-meta">${res.responsavel || "Colaborador"}</span>
          </div>
        `;
        proxContainer.appendChild(upItem);
      });
    }
  }
}

function renderizarVistaSemana(gridContainer) {
  const primeiroDia = new Date(dataAtual);
  primeiroDia.setDate(primeiroDia.getDate() - primeiroDia.getDay());
  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  let html = `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; text-align: center; padding: 10px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; color: #475569;">`;
  const tempDia = new Date(primeiroDia);
  for (let i = 0; i < 7; i++) {
    const ehHoje = tempDia.toDateString() === new Date().toDateString();
    html += `<div style="${ehHoje ? "color: #2563eb; background: #eff6ff; padding: 4px; border-radius: 6px;" : ""}">${diasSemana[i]}<br><span style="font-size: 16px;">${tempDia.getDate()}</span></div>`;
    tempDia.setDate(tempDia.getDate() + 1);
  }
  html += `</div><div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; padding: 16px; min-height: 350px;">`;

  const diaIter = new Date(primeiroDia);
  for (let i = 0; i < 7; i++) {
    const iso = formatarDataISO(diaIter);
    const resDia = reservasCache
      .filter((r) => r.data === iso && (r.sala || "Sala de Reuniões 01") === salaSelecionada)
      .sort((a, b) => a.inicio.localeCompare(b.inicio));

    html += `<div style="border-right: 1px solid #f1f5f9; padding: 4px; display: flex; flex-direction: column; gap: 8px;">`;
    if (resDia.length > 0) {
      resDia.forEach((r) => {
        html += `<div style="background: #eff6ff; border-left: 3px solid #3b82f6; padding: 8px; border-radius: 6px; font-size: 11px;"><strong>${r.inicio} - ${r.fim}</strong><br>${r.titulo}</div>`;
      });
    } else {
      html += `<div style="color: #cbd5e1; font-size: 11px; text-align: center; margin-top: 20px;">Livre</div>`;
    }
    html += `</div>`;
    diaIter.setDate(diaIter.getDate() + 1);
  }
  html += `</div>`;
  gridContainer.innerHTML = html;
}

function renderizarVistaMes(gridContainer) {
  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();
  const primeiroDiaMes = new Date(ano, mes, 1).getDay();
  const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();
  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  let html = `<div style="display: grid; grid-template-columns: repeat(7, 1fr); background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-size: 12px; color: #64748b; padding: 10px 0;">`;
  diasSemana.forEach((d) => (html += `<div>${d}</div>`));
  html += `</div><div style="display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: minmax(75px, auto); gap: 1px; background: #e2e8f0; border-bottom: 1px solid #e2e8f0;">`;

  for (let i = 0; i < primeiroDiaMes; i++) {
    html += `<div style="background: #f8fafc; padding: 8px;"></div>`;
  }

  for (let dia = 1; dia <= ultimoDiaMes; dia++) {
    const dataCelula = new Date(ano, mes, dia);
    const iso = formatarDataISO(dataCelula);
    const resCelula = reservasCache.filter(
      (r) => r.data === iso && (r.sala || "Sala de Reuniões 01") === salaSelecionada
    );
    const ehHoje = dataCelula.toDateString() === new Date().toDateString();

    const badges = resCelula
      .slice(0, 2)
      .map((r) => `<span style="font-size: 10px; background: #dbeafe; color: #1e40af; padding: 2px 4px; border-radius: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px;">${r.inicio} ${r.titulo}</span>`)
      .join("");

    html += `
      <div style="background: white; padding: 8px; display: flex; flex-direction: column;">
        <span style="font-size: 13px; font-weight: ${ehHoje ? "bold" : "normal"}; color: ${ehHoje ? "#2563eb" : "#334155"};">${dia}</span>
        ${badges}
      </div>
    `;
  }
  html += `</div>`;
  gridContainer.innerHTML = html;
}

window.abrirModalReserva = function (inicio = "08:00", fim = "09:00") {
  const modal = document.getElementById("modalNovaReserva");
  if (modal) {
    document.getElementById("resData").value = formatarDataISO(dataAtual);
    document.getElementById("resSala").value = salaSelecionada;
    document.getElementById("resInicio").value = inicio;
    document.getElementById("resFim").value = fim;
    modal.style.display = "flex";
  }
};

window.abrirModalNegociacao = function (sala, data, horario, responsavel, whatsapp) {
  const modal = document.getElementById("modalNegociacao");
  if (!modal) return;

  const msgPronta = `Olá ${responsavel}! Vi que reservaste a ${sala} no dia ${data} às ${horario}. Gostaria de negociar a utilização deste horário contigo. Seria possível?`;
  const inputMsg = document.getElementById("inputMsgWhatsapp");
  const btnWhatsapp = document.getElementById("linkEnviarWhatsapp");
  inputMsg.value = msgPronta;

  if (!whatsapp) {
    btnWhatsapp.href = "#";
    btnWhatsapp.onclick = (e) => {
      e.preventDefault();
      alert("Este utilizador não tem um número de WhatsApp registado no perfil.");
    };
  } else {
    const atualizarLink = () => {
      btnWhatsapp.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(inputMsg.value)}`;
    };
    atualizarLink();
    inputMsg.oninput = atualizarLink;
    btnWhatsapp.onclick = null;
  }

  modal.style.display = "flex";
};

window.excluirReservaAdmin = async function (id) {
  if (!confirm("Deseja excluir esta reserva e notificar o utilizador?")) return;
  try {
    await updateDoc(doc(db, "reservas", id), { canceladoPorAdmin: true });
    await deleteDoc(doc(db, "reservas", id));
    mostrarToastFlutuante("Reserva Excluída", "A reserva foi removida com sucesso.", "info");
  } catch (e) {
    await deleteDoc(doc(db, "reservas", id));
  }
};

window.salvarReservaFirestore = async function ({ titulo, data, inicio, fim, sala, tipo = "Reunião" }) {
  if (!usuarioAtual) {
    alert("Sessão expirada. Faça login novamente.");
    return false;
  }

  const iniMin = horarioParaMinutos(inicio);
  const fimMin = horarioParaMinutos(fim);

  if (fimMin <= iniMin) {
    alert("O horário de término deve ser maior que o horário de início.");
    return false;
  }

  const conflito = reservasCache.find((r) => {
    if (r.data !== data) return false;
    if ((r.sala || "Sala de Reuniões 01") !== sala) return false;
    const rIni = horarioParaMinutos(r.inicio);
    const rFim = horarioParaMinutos(r.fim);
    return iniMin < rFim && fimMin > rIni;
  });

  if (conflito) {
    alert(`Conflito de horário! Já existe a reunião "${conflito.titulo}" das ${conflito.inicio} às ${conflito.fim}.`);
    return false;
  }

  try {
    await addDoc(collection(db, "reservas"), {
      titulo,
      data,
      inicio,
      fim,
      horarioInicio: inicio,
      horarioFim: fim,
      sala,
      tipo,
      cor: "blue",
      userId: usuarioAtual.uid,
      responsavel: usuarioAtual.nome,
      emailResponsavel: usuarioAtual.email,
      canceladoPorAdmin: false,
      criadoEm: serverTimestamp()
    });

    // Busca e-mail real de notificação configurado pelo utilizador
    let emailDestino = usuarioAtual.email;
    let nomeDestino = usuarioAtual.nome;
    let emailAtivo = true;

    try {
      const userDoc = await getDoc(doc(db, "usuarios", usuarioAtual.uid));
      if (userDoc.exists()) {
        const dados = userDoc.data() || {};
        if (dados.emailRealNotificacao && dados.emailRealNotificacao.trim() !== "") {
          emailDestino = dados.emailRealNotificacao.trim();
        }
        if (dados.apelido && dados.apelido.trim() !== "") {
          nomeDestino = dados.apelido.trim();
        }
        if (dados.notificacoes && typeof dados.notificacoes.email === "boolean") {
          emailAtivo = dados.notificacoes.email;
        }
      }
    } catch (profileErr) {
      console.error("Erro ao carregar perfil para e-mail:", profileErr);
    }

    // Disparo via EmailJS
    if (emailAtivo && emailDestino && emailDestino.includes("@") && window.emailjs) {
      try {
        await window.emailjs.send("service_d30n93a", "template_3uxpjzk", {
          to_email: emailDestino,
          to_name: nomeDestino,
          name: titulo,
          message: `A sua reserva para a ${sala} no dia ${data} das ${inicio} às ${fim} foi confirmada com sucesso!`
        });
        mostrarToastFlutuante("Reserva Confirmada", `Reserva salva e e-mail enviado para ${emailDestino}.`, "info");
      } catch (emailErr) {
        const motivo = emailErr?.text || emailErr?.message || "Falha no serviço de e-mail";
        mostrarToastFlutuante("Reserva Salva", `A reserva foi salva, mas o e-mail falhou: ${motivo}`, "warning");
      }
    } else {
      mostrarToastFlutuante("Reserva Confirmada", "Agendamento registado com sucesso!", "info");
    }

    return true;
  } catch (error) {
    console.error("Erro ao gravar reserva:", error);
    alert("Erro ao salvar reserva. Verifique a sua ligação.");
    return false;
  }
};
