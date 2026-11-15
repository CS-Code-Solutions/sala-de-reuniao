import { db } from "./firebase-config.js";
import { verificarAutenticacao } from "./auth.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let dataAtual = new Date();
let tipoVisualizacaoAtual = "dia";
let salaSelecionada = "Sala de Reuniões 01";
let reservasCache = [];
let usuarioAtual = null;
let unsubscribeReservas = null;

document.addEventListener("DOMContentLoaded", () => {
  verificarAutenticacao((user) => {
    usuarioAtual = user;
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

function formatarDataISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function iniciarEscutaReservas() {
  if (unsubscribeReservas) unsubscribeReservas();

  const q = query(collection(db, "reservas"));
  unsubscribeReservas = onSnapshot(
    q,
    (snapshot) => {
      reservasCache = [];
      snapshot.forEach((docSnap) => {
        reservasCache.push({ id: docSnap.id, ...docSnap.data() });
      });
      carregarAgenda();
    },
    (error) => {
      console.error("Erro ao sincronizar reservas com Firestore:", error);
    }
  );
}

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
  const botoes = document.querySelectorAll("#viewTogglesGroup button");
  botoes.forEach((btn) => btn.classList.remove("active"));
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
    const opcoesMes = { month: "long", year: "numeric" };
    const txt = dataAtual.toLocaleDateString("pt-BR", opcoesMes);
    spanData.innerText = txt.charAt(0).toUpperCase() + txt.slice(1);
  } else if (tipoVisualizacaoAtual === "semana") {
    const primeiroDia = new Date(dataAtual);
    primeiroDia.setDate(primeiroDia.getDate() - primeiroDia.getDay());

    const ultimoDia = new Date(primeiroDia);
    ultimoDia.setDate(ultimoDia.getDate() + 6);

    spanData.innerText = `${primeiroDia.getDate()} de ${primeiroDia.toLocaleDateString("pt-BR", { month: "short" })} - ${ultimoDia.getDate()} de ${ultimoDia.toLocaleDateString("pt-BR", { month: "short" })} de ${ultimoDia.getFullYear()}`;
  } else {
    const opcoesCurta = { day: "2-digit", month: "short", year: "numeric" };
    spanData.innerText = dataAtual.toLocaleDateString("pt-BR", opcoesCurta).replace(".", "");
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
      const opcoesLonga = { weekday: "long", day: "2-digit", month: "long", year: "numeric" };
      const dataLonga = dataAtual.toLocaleDateString("pt-BR", opcoesLonga);
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
  } else if (tipoVisualizacaoAtual === "mes") {
    renderizarVistaMes(gridContainer);
  }
}

function horarioParaMinutos(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function renderizarVistaDia(gridContainer, proxContainer) {
  const dataISO = formatarDataISO(dataAtual);
  const agora = new Date();
  const hojeISO = formatarDataISO(agora);
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

  const reservasDoDia = reservasCache
    .filter((r) => r.data === dataISO && (r.sala || "Sala de Reuniões 01") === salaSelecionada)
    .sort((a, b) => a.inicio.localeCompare(b.inicio));

  const faixasBase = [
    { hora: "07:00", inicio: "07:00", fim: "08:00" },
    { hora: "08:00", inicio: "08:00", fim: "09:00" },
    { hora: "09:00", inicio: "09:00", fim: "10:00" },
    { hora: "10:00", inicio: "10:00", fim: "11:00" },
    { hora: "11:00", inicio: "11:00", fim: "12:00" },
    { hora: "12:00", inicio: "12:00", fim: "13:00" },
    { hora: "13:00", inicio: "13:00", fim: "14:00" },
    { hora: "14:00", inicio: "14:00", fim: "15:00" },
    { hora: "15:00", inicio: "15:00", fim: "16:00" },
    { hora: "16:00", inicio: "16:00", fim: "17:00" },
    { hora: "17:00", inicio: "17:00", fim: "18:00" }
  ];

  faixasBase.forEach((faixa) => {
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
      const cor = reservaConflito.cor || "blue";
      row.innerHTML = `
        <div class="time-label">${faixa.hora}</div>
        <div class="event-block ${cor}">
          <div class="event-time">${reservaConflito.inicio} - ${reservaConflito.fim}</div>
          <div class="event-title">${reservaConflito.titulo}</div>
          <div class="event-meta">${reservaConflito.responsavel || "Colaborador"} • ${reservaConflito.tipo || "Reunião"}</div>
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
  });

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
  html += `</div>`;

  html += `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; padding: 16px; min-height: 350px;">`;
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
  html += `</div>`;

  html += `<div style="display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: minmax(75px, auto); gap: 1px; background: #e2e8f0; border-bottom: 1px solid #e2e8f0;">`;

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
      .map(
        (r) =>
          `<span style="font-size: 10px; background: #dbeafe; color: #1e40af; padding: 2px 4px; border-radius: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px;">${r.inicio} ${r.titulo}</span>`
      )
      .join("");

    html += `
      <div style="background: white; padding: 8px; display: flex; flex-direction: column;">
        <span style="font-size: 13px; font-weight: ${ehHoje ? "bold" : "normal"}; color: ${ehHoje ? "#2563eb" : "#334155"}; ${ehHoje ? "background: #eff6ff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;" : ""}">${dia}</span>
        ${badges}
      </div>
    `;
  }

  html += `</div>`;
  gridContainer.innerHTML = html;
}

window.abrirModalReserva = async function (inicio = "08:00", fim = "09:00") {
  const modal = document.getElementById("modalNovaReserva");
  if (modal) {
    document.getElementById("resData").value = formatarDataISO(dataAtual);
    document.getElementById("resInicio").value = inicio;
    document.getElementById("resFim").value = fim;
    modal.style.display = "flex";
    return;
  }

  const dataISO = formatarDataISO(dataAtual);
  const titulo = prompt(`Nova Reserva em ${dataISO} (${salaSelecionada})\nHorário: ${inicio} às ${fim}\nTítulo da reunião:`);
  if (!titulo || !titulo.trim()) return;

  await salvarReservaFirestore({
    titulo: titulo.trim(),
    data: dataISO,
    inicio,
    fim,
    sala: salaSelecionada,
    tipo: "Reunião"
  });
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

  // Bloqueio inteligente de conflito de horário na mesma sala e data
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
      sala,
      tipo,
      cor: "blue",
      userId: usuarioAtual.uid,
      responsavel: usuarioAtual.nome,
      emailResponsavel: usuarioAtual.email,
      criadoEm: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Erro ao gravar reserva no Firestore:", error);
    alert("Erro ao salvar reserva. Verifique sua conexão.");
    return false;
  }
};
