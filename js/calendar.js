let dataAtualObj = new Date(); // Inicia com a data de hoje
let tipoVisualizacaoAtual = 'dia'; // 'dia', 'semana', 'mes'
let db;
let unsubscribeAgenda = null;
let reservasSalaAtual = [];
let usuarioIdGlobal = null;
let apelidoUsuarioGlobal = "Utilizador";
let usuarioEmailGlobal = "";
let usuarioEhAdmin = false;

function formatarDataLocal(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

document.addEventListener("DOMContentLoaded", () => {
    // Inicialização do Firebase Firestore (Compat SDK)
    const firebaseConfig = {
        apiKey: "AIzaSyDa9ztrK6VxFVeLbP0ge6-31V05gnztjJw",
        authDomain: "reuniao-d1b29.firebaseapp.com",
        projectId: "reuniao-d1b29",
        storageBucket: "reuniao-d1b29.firebasestorage.app",
        messagingSenderId: "887897617950",
        appId: "1:887897617950:web:e96cf3cce4792e7e2b600f"
    };
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();

    atualizarTextoData();

    // Autenticação e perfil do usuário logado
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            usuarioIdGlobal = user.uid;
            usuarioEmailGlobal = user.email || "";
            const emailLower = usuarioEmailGlobal.toLowerCase();
            apelidoUsuarioGlobal = emailLower.split('@')[0];
            let cargoTexto = "Utilizador";

            try {
                const doc = await db.collection("usuarios").doc(user.uid).get();
                if (doc.exists) {
                    const dados = doc.data();
                    if (dados.apelido && dados.apelido.trim() !== "") {
                        apelidoUsuarioGlobal = dados.apelido;
                    }
                    if (dados.cargo === "Administrador") {
                        usuarioEhAdmin = true;
                        cargoTexto = "Administrador";
                    }
                }
            } catch (e) {}

            if (emailLower.includes("admin") || emailLower.includes("teste")) {
                usuarioEhAdmin = true;
                cargoTexto = "Administrador";
            }

            const nomeDisplay = document.getElementById("userNameDisplay");
            if (nomeDisplay) nomeDisplay.innerText = apelidoUsuarioGlobal;
            const roleDisplay = document.getElementById("userRoleDisplay");
            if (roleDisplay) roleDisplay.innerText = cargoTexto;

            carregarAgendaFirebase();
        } else {
            window.location.href = "../index.html";
        }
    });
});

// ==========================================
// NAVEGAÇÃO E MODOS DE VISUALIZAÇÃO
// ==========================================

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

window.resetarData = function() {
    dataAtualObj = new Date(); 
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
    }, 200);
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

// ==========================================
// SINCRONIZAÇÃO COM FIRESTORE
// ==========================================

function carregarAgendaFirebase() {
    const selectSala = document.getElementById("salaSelect");
    const sala = selectSala ? selectSala.value : "Sala 01";

    if (unsubscribeAgenda) unsubscribeAgenda();

    unsubscribeAgenda = db.collection("reservas")
        .where("sala", "==", sala)
        .onSnapshot((snapshot) => {
            reservasSalaAtual = [];
            snapshot.forEach(doc => {
                reservasSalaAtual.push({ id: doc.id, ...doc.data() });
            });
            carregarAgenda();
        }, (err) => {
            console.log("Erro ao carregar reservas do Firebase:", err);
            carregarAgenda();
        });
}

window.mudarSalaSelecionada = function() {
    carregarAgendaFirebase();
};

// ==========================================
// RENDERIZAÇÃO DAS VISTAS (DIA, SEMANA, MÊS)
// ==========================================

function carregarAgenda() {
    const gridContainer = document.getElementById("gridHorarios");
    const proxContainer = document.getElementById("listaProximas");
    const headerMain = document.querySelector(".cal-main-header");
    
    if (!gridContainer) return;

    gridContainer.innerHTML = "";
    if (proxContainer) proxContainer.innerHTML = "";

    const selectSala = document.getElementById("salaSelect");
    const nomeSala = selectSala ? selectSala.value : "Sala 01";

    if (headerMain) {
        if (tipoVisualizacaoAtual === 'dia') {
            const opcoesLonga = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
            let dataLonga = dataAtualObj.toLocaleDateString('pt-BR', opcoesLonga);
            headerMain.innerHTML = `<span>${nomeSala}</span><span>${dataLonga.charAt(0).toUpperCase() + dataLonga.slice(1)}</span>`;
        } else if (tipoVisualizacaoAtual === 'semana') {
            headerMain.innerHTML = `<span>${nomeSala}</span><span>Vista Semanal</span>`;
        } else {
            headerMain.innerHTML = `<span>${nomeSala}</span><span>Vista Mensal</span>`;
        }
    }

    if (tipoVisualizacaoAtual === 'dia') {
        renderizarVistaDia(gridContainer, proxContainer);
    } else if (tipoVisualizacaoAtual === 'semana') {
        renderizarVistaSemana(gridContainer);
    } else if (tipoVisualizacaoAtual === 'mes') {
        renderizarVistaMes(gridContainer);
    }
}

// 1. VISTA DIA COM DADOS REAIS DO FIREBASE
function renderizarVistaDia(gridContainer, proxContainer) {
    const dataStr = formatarDataLocal(dataAtualObj);
    const reservasDoDia = reservasSalaAtual.filter(r => r.data === dataStr);

    const inicioDiaMin = 7 * 60; // 07:00
    const fimDiaMin = 23 * 60;   // 23:00

    reservasDoDia.sort((a, b) => (a.horarioInicio || "00:00").localeCompare(b.horarioInicio || "00:00"));

    let cursorMin = inicioDiaMin;
    let reservasCount = 0;

    reservasDoDia.forEach(reserva => {
        const strIni = reserva.horarioInicio || "07:00";
        const strFim = reserva.horarioFim || strIni;
        
        const resIniMin = parseInt(strIni.split(':')[0]) * 60 + parseInt(strIni.split(':')[1]);
        const resFimMin = parseInt(strFim.split(':')[0]) * 60 + parseInt(strFim.split(':')[1]);

        if (cursorMin < resIniMin) {
            const slotLivreIni = String(Math.floor(cursorMin/60)).padStart(2,'0') + ":" + String(cursorMin%60).padStart(2,'0');
            const slotLivreFim = String(Math.floor(resIniMin/60)).padStart(2,'0') + ":" + String(resIniMin%60).padStart(2,'0');
            
            const rowLivre = document.createElement("div");
            rowLivre.className = "time-row";
            rowLivre.innerHTML = `
                <div class="time-label">${slotLivreIni}</div>
                <div class="event-block green" style="cursor:pointer;" onclick="abrirModalReserva('${slotLivreIni}', '${slotLivreFim}')">
                    <div class="event-time"><span>●</span> ${slotLivreIni} - ${slotLivreFim} • Disponível (Clique para agendar)</div>
                </div>
            `;
            gridContainer.appendChild(rowLivre);
        }

        const rowRes = document.createElement("div");
        rowRes.className = "time-row";
        rowRes.innerHTML = `
            <div class="time-label">${strIni}</div>
            <div class="event-block blue">
                <div class="event-time">${strIni} - ${strFim}</div>
                <div class="event-title">${reserva.titulo || 'Reunião'}</div>
                <div class="event-meta">${reserva.responsavel || 'Equipa'} • Reunião</div>
                ${usuarioEhAdmin ? `<button onclick="excluirReservaFirebase('${reserva.id}')" style="margin-top:4px; background:#fee2e2; color:#dc2626; border:none; padding:2px 6px; border-radius:4px; font-size:11px; cursor:pointer;">Excluir</button>` : ''}
            </div>
        `;
        gridContainer.appendChild(rowRes);

        if (proxContainer) {
            const upItem = document.createElement("div");
            upItem.className = "upcoming-item";
            upItem.innerHTML = `
                <div class="dot blue"></div>
                <div class="up-info">
                    <span class="up-time">${strIni} - ${strFim}</span>
                    <span class="up-title">${reserva.titulo || 'Reunião'}</span>
                    <span class="up-meta">${reserva.responsavel || 'Equipa'}</span>
                </div>
            `;
            proxContainer.appendChild(upItem);
        }

        cursorMin = Math.max(cursorMin, resFimMin + 5);
        reservasCount++;
    });

    if (cursorMin < fimDiaMin) {
        const slotLivreIni = String(Math.floor(cursorMin/60)).padStart(2,'0') + ":" + String(cursorMin%60).padStart(2,'0');
        const rowFim = document.createElement("div");
        rowFim.className = "time-row";
        rowFim.innerHTML = `
            <div class="time-label">${slotLivreIni}</div>
            <div class="event-block green" style="cursor:pointer;" onclick="abrirModalReserva('${slotLivreIni}', '23:00')">
                <div class="event-time"><span>●</span> ${slotLivreIni} - 23:00 • Disponível (Clique para agendar)</div>
            </div>
        `;
        gridContainer.appendChild(rowFim);
    }

    if (reservasCount === 0 && proxContainer) {
        proxContainer.innerHTML = `<div style="font-size: 13px; color: #94a3b8;">Sem reservas para este dia.</div>`;
    }
}

// 2. VISTA SEMANA COM DADOS REAIS
function renderizarVistaSemana(gridContainer) {
    let primeiroDia = new Date(dataAtualObj);
    primeiroDia.setDate(primeiroDia.getDate() - primeiroDia.getDay());

    let diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    let html = `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; text-align: center; padding: 10px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; color: #475569;">`;
    
    let tempDia = new Date(primeiroDia);
    for(let i=0; i<7; i++) {
        let ehHoje = tempDia.toDateString() === new Date().toDateString();
        html += `<div style="${ehHoje ? 'color: #2563eb; background: #eff6ff; padding: 4px; border-radius: 6px;' : ''}">${diasSemana[i]}<br><span style="font-size: 16px;">${tempDia.getDate()}</span></div>`;
        tempDia.setDate(tempDia.getDate() + 1);
    }
    html += `</div>`;

    html += `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; padding: 16px; min-height: 350px;">`;
    
    let loopDia = new Date(primeiroDia);
    for(let i=0; i<7; i++) {
        let diaStr = formatarDataLocal(loopDia);
        let reservasDoDia = reservasSalaAtual.filter(r => r.data === diaStr);

        html += `<div style="border-right: 1px solid #f1f5f9; padding: 4px; display: flex; flex-direction: column; gap: 8px;">`;
        if (reservasDoDia.length > 0) {
            reservasDoDia.forEach(r => {
                html += `<div style="background: #eff6ff; border-left: 3px solid #3b82f6; padding: 6px; border-radius: 6px; font-size: 11px;"><strong>${r.horarioInicio}</strong><br>${r.titulo || 'Reunião'}</div>`;
            });
        } else {
            html += `<div style="color: #cbd5e1; font-size: 11px; text-align: center; margin-top: 20px;">Livre</div>`;
        }
        html += `</div>`;
        loopDia.setDate(loopDia.getDate() + 1);
    }
    html += `</div>`;

    gridContainer.innerHTML = html;
}

// 3. VISTA MÊS COM DADOS REAIS
function renderizarVistaMes(gridContainer) {
    let ano = dataAtualObj.getFullYear();
    let mes = dataAtualObj.getMonth();
    
    let primeiroDiaMes = new Date(ano, mes, 1).getDay();
    let ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();

    let diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    let html = `<div style="display: grid; grid-template-columns: repeat(7, 1fr); background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-size: 12px; color: #64748b; padding: 10px 0;">`;
    diasSemana.forEach(d => html += `<div>${d}</div>`);
    html += `</div>`;

    html += `<div style="display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: minmax(70px, auto); gap: 1px; background: #e2e8f0; border-bottom: 1px solid #e2e8f0;">`;
    
    for(let i=0; i<primeiroDiaMes; i++) {
        html += `<div style="background: #f8fafc; padding: 8px;"></div>`;
    }

    for(let dia=1; dia<=ultimoDiaMes; dia++) {
        let diaFormatado = String(dia).padStart(2, '0');
        let mesFormatado = String(mes + 1).padStart(2, '0');
        let diaStr = `${ano}-${mesFormatado}-${diaFormatado}`;
        
        let reservasDia = reservasSalaAtual.filter(r => r.data === diaStr);
        let ehHoje = (dia === new Date().getDate() && mes === new Date().getMonth() && ano === new Date().getFullYear());

        html += `
            <div style="background: white; padding: 8px; display: flex; flex-direction: column; justify-content: space-between;">
                <span style="font-size: 13px; font-weight: ${ehHoje ? 'bold' : 'normal'}; color: ${ehHoje ? '#2563eb' : '#334155'}; ${ehHoje ? 'background: #eff6ff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;' : ''}">${dia}</span>
                ${reservasDia.length > 0 ? `<span style="font-size: 10px; background: #dbeafe; color: #1e40af; padding: 2px 4px; border-radius: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${reservasDia.length} reunião(ões)</span>` : ''}
            </div>
        `;
    }

    html += `</div>`;
    gridContainer.innerHTML = html;
}

// ==========================================
// CRIAÇÃO E EXCLUSÃO DE RESERVAS NO FIREBASE
// ==========================================

window.abrirModalReserva = async function(inicio, fim) {
    const dataFormatada = document.getElementById("dataAtualExibicao").innerText;
    const nomeReuniao = prompt(`Nova Reserva em: ${dataFormatada}\nHorário: ${inicio} às ${fim}\nQual o nome da reunião?`);
    
    if (nomeReuniao && nomeReuniao.trim() !== "") {
        const selectSala = document.getElementById("salaSelect");
        const sala = selectSala ? selectSala.value : "Sala 01";
        const dataStr = formatarDataLocal(dataAtualObj);

        try {
            await db.collection("reservas").add({
                titulo: nomeReuniao.trim(),
                horarioInicio: inicio,
                horarioFim: fim,
                sala: sala,
                data: dataStr,
                responsavel: apelidoUsuarioGlobal,
                userId: usuarioIdGlobal,
                canceladoPorAdmin: false,
                criadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Envio opcional via EmailJS se configurado
            if (window.emailjs && usuarioEmailGlobal) {
                try {
                    await emailjs.send('service_d30n93a', 'template_3uxpjzk', {
                        to_email: usuarioEmailGlobal,
                        to_name: apelidoUsuarioGlobal,
                        name: nomeReuniao.trim(),
                        message: `Sua reserva para a ${sala} no dia ${dataStr} das ${inicio} às ${fim} foi confirmada com sucesso!`
                    });
                } catch(e) {}
            }

            alert(`Sucesso! "${nomeReuniao}" foi agendada.`);
        } catch (err) {
            alert("Erro ao salvar a reserva: " + err.message);
        }
    }
};

window.excluirReservaFirebase = async function(id) {
    if (confirm("Tem certeza que deseja excluir esta reserva?")) {
        try {
            await db.collection("reservas").doc(id).delete();
            alert("Reserva excluída com sucesso!");
        } catch (err) {
            alert("Erro ao excluir: " + err.message);
        }
    }
};
