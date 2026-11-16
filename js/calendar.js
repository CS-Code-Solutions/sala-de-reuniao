let dataAtualObj = new Date();
let tipoVisualizacaoAtual = 'dia';
let unsubscribeAgenda = null;
let reservasSalaAtual = [];
let usuarioIdGlobal = null;
let apelidoUsuarioGlobal = "Utilizador";
let usuarioEhAdmin = false;

function formatarDataLocal(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

document.addEventListener("DOMContentLoaded", () => {
    atualizarTextoData();
    setTimeout(() => {
        if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
            usuarioIdGlobal = firebase.auth().currentUser.uid;
        }
        carregarAgendaFirebase();
    }, 200);
});

window.mudarData = function(dias) {
    if (tipoVisualizacaoAtual === 'dia') {
        dataAtualObj.setDate(dataAtualObj.getDate() + dias);
    } else if (tipoVisualizacaoAtual === 'semana') {
        dataAtualObj.setDate(dataAtualObj.getDate() + (dias * 7));
    } else if (tipoVisualizacaoAtual === 'mes') {
        dataAtualObj.setMonth(dataAtualObj.getMonth() + dias);
    }
    atualizarTextoData();
    carregarAgendaComAnimacao();
};

window.mudarVisualizacao = function(tipo, btnClicado) {
    const botoes = document.querySelectorAll("#viewTogglesGroup button");
    botoes.forEach(btn => btn.classList.remove("active"));
    if (btnClicado) btnClicado.classList.add("active");
    tipoVisualizacaoAtual = tipo;
    atualizarTextoData();
    carregarAgendaComAnimacao();
};

function carregarAgendaComAnimacao() {
    const grid = document.getElementById("gridHorarios");
    if(grid) grid.style.opacity = "0.3";
    setTimeout(() => {
        carregarAgenda();
        if(grid) grid.style.opacity = "1";
    }, 150);
}

function atualizarTextoData() {
    const spanData = document.getElementById("dataAtualExibicao");
    if (!spanData) return;

    if (tipoVisualizacaoAtual === 'mes') {
        const opcoesMes = { month: 'long', year: 'numeric' };
        let txt = dataAtualObj.toLocaleDateString('pt-BR', opcoesMes);
        spanData.innerText = txt.charAt(0).toUpperCase() + txt.slice(1);
    } else if (tipoVisualizacaoAtual === 'semana') {
        let primeiroDia = new Date(dataAtualObj);
        let dia = primeiroDia.getDay();
        primeiroDia.setDate(primeiroDia.getDate() - dia);
        let ultimoDia = new Date(primeiroDia);
        ultimoDia.setDate(ultimoDia.getDate() + 6);
        spanData.innerText = `${primeiroDia.getDate()} de ${primeiroDia.toLocaleDateString('pt-BR', {month:'short'})} - ${ultimoDia.getDate()} de ${ultimoDia.toLocaleDateString('pt-BR', {month:'short'})} de ${ultimoDia.getFullYear()}`;
    } else {
        const opcoesCurta = { day: '2-digit', month: 'short', year: 'numeric' };
        spanData.innerText = dataAtualObj.toLocaleDateString('pt-BR', opcoesCurta).replace('.', '');
    }
}

function carregarAgendaFirebase() {
    const selectSala = document.getElementById("salaSelect");
    const sala = selectSala ? selectSala.value : "Sala 01";

    if (unsubscribeAgenda) unsubscribeAgenda();

    const db = firebase.firestore();
    unsubscribeAgenda = db.collection("reservas")
        .where("sala", "==", sala)
        .onSnapshot((snapshot) => {
            reservasSalaAtual = [];
            snapshot.forEach(doc => {
                reservasSalaAtual.push({ id: doc.id, ...doc.data() });
            });
            carregarAgenda();
        }, (err) => {
            console.log("Erro ao carregar reservas:", err);
            carregarAgenda();
        });
}

window.mudarSalaSelecionada = function() {
    carregarAgendaFirebase();
};

function carregarAgenda() {
    const gridContainer = document.getElementById("gridHorarios");
    if (!gridContainer) return;
    gridContainer.innerHTML = "";

    if (tipoVisualizacaoAtual === 'dia') {
        renderizarVistaDia(gridContainer);
    } else if (tipoVisualizacaoAtual === 'semana') {
        renderizarVistaSemana(gridContainer);
    } else if (tipoVisualizacaoAtual === 'mes') {
        renderizarVistaMes(gridContainer);
    }
}

// VISTA DIA COM LAYOUT LIMPO E ALINHADO (Sem texto flutuante estranho)
function renderizarVistaDia(gridContainer) {
    const dataStr = formatarDataLocal(dataAtualObj);
    const reservasDoDia = reservasSalaAtual.filter(r => r.data === dataStr);

    const inicioDiaMin = 7 * 60; // 07:00
    const fimDiaMin = 23 * 60;   // 23:00

    reservasDoDia.sort((a, b) => (a.horarioInicio || "07:00").localeCompare(b.horarioInicio || "07:00"));

    let cursorMin = inicioDiaMin;
    let reservasCount = 0;

    reservasDoDia.forEach(reserva => {
        const strIni = reserva.horarioInicio || "07:00";
        const strFim = reserva.horarioFim || strIni;
        
        const resIniMin = parseInt(strIni.split(':')[0]) * 60 + parseInt(strIni.split(':')[1]);
        const resFimMin = parseInt(strFim.split(':')[0]) * 60 + parseInt(strFim.split(':')[1]);

        // Intervalo livre antes da reserva
        if (cursorMin < resIniMin) {
            const slotLivreIni = String(Math.floor(cursorMin/60)).padStart(2,'0') + ":" + String(cursorMin%60).padStart(2,'0');
            const slotLivreFim = String(Math.floor(resIniMin/60)).padStart(2,'0') + ":" + String(resIniMin%60).padStart(2,'0');
            
            const rowLivre = document.createElement("div");
            rowLivre.className = "slot-row available";
            rowLivre.onclick = () => abrirModalReserva(slotLivreIni, slotLivreFim);
            rowLivre.innerHTML = `
                <div>
                    <span style="font-size: 13px; font-weight: 700; color: #16a34a;">${slotLivreIni} às ${slotLivreFim} - Disponível</span>
                    <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">Clique para agendar neste intervalo livre.</p>
                </div>
                <button style="background: #22c55e; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer;">Agendar</button>
            `;
            gridContainer.appendChild(rowLivre);
        }

        // Bloco da Reserva Ocupada (Perfeitamente estruturado)
        const rowRes = document.createElement("div");
        rowRes.className = "slot-row reserved";
        rowRes.innerHTML = `
            <div>
                <span style="font-size: 12px; font-weight: 700; color: var(--accent-color);">${strIni} - ${strFim}</span>
                <h4 style="font-size: 15px; color: var(--text-main); margin: 2px 0;">${reserva.titulo || 'Reunião'}</h4>
                <p style="font-size: 12px; color: var(--text-muted); margin: 0;">Responsável: ${reserva.responsavel || 'Equipa'}</p>
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
                ${(usuarioEhAdmin || reserva.userId === usuarioIdGlobal) ? `<button onclick="excluirReservaFirebase('${reserva.id}')" style="background: #fee2e2; color: #dc2626; border: none; padding: 4px 10px; font-size: 11px; border-radius: 4px; font-weight: 600; cursor: pointer;">Excluir</button>` : ''}
            </div>
        `;
        gridContainer.appendChild(rowRes);

        cursorMin = Math.max(cursorMin, resFimMin + 5);
        reservasCount++;
    });

    // Intervalo livre restante até o fim do dia
    if (cursorMin < fimDiaMin) {
        const slotLivreIni = String(Math.floor(cursorMin/60)).padStart(2,'0') + ":" + String(cursorMin%60).padStart(2,'0');
        const rowFim = document.createElement("div");
        rowFim.className = "slot-row available";
        rowFim.onclick = () => abrirModalReserva(slotLivreIni, "23:00");
        rowFim.innerHTML = `
            <div>
                <span style="font-size: 13px; font-weight: 700; color: #16a34a;">${slotLivreIni} às 23:00 - Disponível</span>
                <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">Clique para agendar no restante do dia.</p>
            </div>
            <button style="background: #22c55e; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer;">Agendar</button>
        `;
        gridContainer.appendChild(rowFim);
    }

    if (reservasCount === 0 && gridContainer.children.length === 0) {
        gridContainer.innerHTML = `
            <div class="slot-row available" onclick="abrirModalReserva('08:00', '18:00')">
                <div>
                    <span style="font-size: 13px; font-weight: 700; color: #16a34a;">08:00 às 18:00 - Disponível</span>
                    <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">Sem reuniões agendadas. Clique para agendar.</p>
                </div>
                <button style="background: #22c55e; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer;">Agendar</button>
            </div>
        `;
    }
}

function renderizarVistaSemana(gridContainer) {
    gridContainer.innerHTML = `<p style="padding: 16px; color: var(--text-muted);">Vista semanal sincronizada com o Firebase em desenvolvimento.</p>`;
}

function renderizarVistaMes(gridContainer) {
    gridContainer.innerHTML = `<p style="padding: 16px; color: var(--text-muted);">Vista mensal sincronizada com o Firebase em desenvolvimento.</p>`;
}

window.abrirModalReserva = function(inicio, fim) {
    const nomeReuniao = prompt(`Nova Reserva\nHorário: ${inicio} às ${fim}\nQual o nome da reunião?`);
    if (nomeReuniao && nomeReuniao.trim() !== "") {
        const selectSala = document.getElementById("salaSelect");
        const sala = selectSala ? selectSala.value : "Sala 01";
        const dataStr = formatarDataLocal(dataAtualObj);
        const user = firebase.auth().currentUser;

        firebase.firestore().collection("reservas").add({
            titulo: nomeReuniao.trim(),
            horarioInicio: inicio,
            horarioFim: fim,
            sala: sala,
            data: dataStr,
            responsavel: user ? (user.email.split('@')[0]) : "Utilizador",
            userId: user ? user.uid : "",
            canceladoPorAdmin: false,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            alert("Reserva criada com sucesso!");
        }).catch(err => {
            alert("Erro ao criar reserva: " + err.message);
        });
    }
};

window.excluirReservaFirebase = function(id) {
    if (confirm("Tem certeza que deseja excluir esta reserva?")) {
        firebase.firestore().collection("reservas").doc(id).delete().then(() => {
            alert("Reserva excluída com sucesso!");
        }).catch(err => {
            alert("Erro ao excluir: " + err.message);
        });
    }
};
