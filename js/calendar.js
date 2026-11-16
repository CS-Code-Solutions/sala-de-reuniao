let dataAtual = new Date(); // Inicia com a data de hoje
let tipoVisualizacaoAtual = 'dia'; // 'dia', 'semana', 'mes'

document.addEventListener("DOMContentLoaded", () => {
    atualizarTextoData();
    setTimeout(() => { carregarAgenda(); }, 300);
});

// ==========================================
// NAVEGAÇÃO E MODOS DE VISUALIZAÇÃO
// ==========================================

window.mudarData = function(dias) {
    if (tipoVisualizacaoAtual === 'dia') {
        dataAtual.setDate(dataAtual.getDate() + dias);
    } else if (tipoVisualizacaoAtual === 'semana') {
        dataAtual.setDate(dataAtual.getDate() + (dias * 7));
    } else if (tipoVisualizacaoAtual === 'mes') {
        dataAtual.setMonth(dataAtual.getMonth() + dias);
    }
    
    atualizarTextoData();
    carregarAgendaComAnimacao();
};

window.resetarData = function() {
    dataAtual = new Date(); 
    atualizarTextoData();
    carregarAgendaComAnimacao();
};

window.mudarVisualizacao = function(tipo, btnClicado) {
    const botoes = document.querySelectorAll("#viewTogglesGroup button");
    botoes.forEach(btn => btn.classList.remove("active"));
    btnClicado.classList.add("active");
    
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
        let txt = dataAtual.toLocaleDateString('pt-BR', opcoesMes);
        spanData.innerText = txt.charAt(0).toUpperCase() + txt.slice(1);
    } else if (tipoVisualizacaoAtual === 'semana') {
        // Pega o domingo da semana atual
        let primeiroDia = new Date(dataAtual);
        let dia = primeiroDia.getDay();
        primeiroDia.setDate(primeiroDia.getDate() - dia);
        
        let ultimoDia = new Date(primeiroDia);
        ultimoDia.setDate(ultimoDia.getDate() + 6);

        spanData.innerText = `${primeiroDia.getDate()} de ${primeiroDia.toLocaleDateString('pt-BR', {month:'short'})} - ${ultimoDia.getDate()} de ${ultimoDia.toLocaleDateString('pt-BR', {month:'short'})} de ${ultimoDia.getFullYear()}`;
    } else {
        const opcoesCurta = { day: '2-digit', month: 'short', year: 'numeric' };
        spanData.innerText = dataAtual.toLocaleDateString('pt-BR', opcoesCurta).replace('.', '');
    }
}

// ==========================================
// RENDERIZAÇÃO DAS VISTAS (DIA, SEMANA, MÊS)
// ==========================================

function carregarAgenda() {
    const gridContainer = document.getElementById("gridHorarios");
    const proxContainer = document.getElementById("listaProximas");
    const headerMain = document.querySelector(".cal-main-header");
    
    if (!gridContainer || !proxContainer) return;

    gridContainer.innerHTML = "";
    proxContainer.innerHTML = "";

    // Atualiza o subtítulo da grelha dependendo da aba
    if (headerMain) {
        if (tipoVisualizacaoAtual === 'dia') {
            const opcoesLonga = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
            let dataLonga = dataAtual.toLocaleDateString('pt-BR', opcoesLonga);
            headerMain.innerHTML = `<span>Sala de Reuniões 01</span><span>${dataLonga.charAt(0).toUpperCase() + dataLonga.slice(1)}</span>`;
        } else if (tipoVisualizacaoAtual === 'semana') {
            headerMain.innerHTML = `<span>Sala de Reuniões 01</span><span>Vista Semanal</span>`;
        } else {
            headerMain.innerHTML = `<span>Sala de Reuniões 01</span><span>Vista Mensal</span>`;
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

// 1. VISTA DIA (O formato padrão que já tínhamos)
function renderizarVistaDia(gridContainer, proxContainer) {
    const horarios = [
        { hora: "07:00", inicio: "07:00", fim: "07:30", status: "disponivel", cor: "green" },
        { hora: "08:00", inicio: "07:30", fim: "10:00", status: "reservado", titulo: "Planejamento Estratégico", responsavel: "Alex", tipo: "Reunião", cor: "blue" },
        { hora: "10:00", inicio: "10:00", fim: "11:00", status: "disponivel", cor: "green" },
        { hora: "11:00", inicio: "11:00", fim: "12:00", status: "reservado", titulo: "Reunião de equipe", responsavel: "Bruna", tipo: "Reunião", cor: "blue" },
        { hora: "12:00", inicio: "12:00", fim: "13:30", status: "disponivel", cor: "green" },
        { hora: "14:00", inicio: "13:30", fim: "15:00", status: "reservado", titulo: "Projeto Alfa", responsavel: "Carlos", tipo: "Reunião", cor: "purple" },
        { hora: "16:00", inicio: "15:00", fim: "16:00", status: "disponivel", cor: "green" },
        { hora: "17:00", inicio: "16:00", fim: "17:00", status: "reservado", titulo: "Revisão de resultados", responsavel: "Fernanda", tipo: "Reunião", cor: "blue" }
    ];

    let reservasCount = 0;
    horarios.forEach(slot => {
        const row = document.createElement("div");
        row.className = "time-row";
        
        if (slot.status === "reservado") {
            row.innerHTML = `
                <div class="time-label">${slot.hora}</div>
                <div class="event-block ${slot.cor}">
                    <div class="event-time">${slot.inicio} - ${slot.fim}</div>
                    <div class="event-title">${slot.titulo}</div>
                    <div class="event-meta">${slot.responsavel} • ${slot.tipo}</div>
                </div>
            `;
            
            const upItem = document.createElement("div");
            upItem.className = "upcoming-item";
            upItem.innerHTML = `
                <div class="dot ${slot.cor}"></div>
                <div class="up-info">
                    <span class="up-time">${slot.inicio} - ${slot.fim}</span>
                    <span class="up-title">${slot.titulo}</span>
                    <span class="up-meta">${slot.responsavel}</span>
                </div>
            `;
            proxContainer.appendChild(upItem);
            reservasCount++;
        } else {
            row.innerHTML = `
                <div class="time-label">${slot.hora}</div>
                <div class="event-block ${slot.cor}" style="cursor:pointer;" onclick="abrirModalReserva('${slot.inicio}', '${slot.fim}')">
                    <div class="event-time"><span>●</span> ${slot.inicio} - ${slot.fim} • Disponível</div>
                </div>
            `;
        }
        gridContainer.appendChild(row);
    });

    if (reservasCount === 0) {
        proxContainer.innerHTML = `<div style="font-size: 13px; color: #94a3b8;">Sem reservas para este dia.</div>`;
    }
}

// 2. VISTA SEMANA (Estilo Outlook: Colunas de Domingo a Sábado)
function renderizarVistaSemana(gridContainer) {
    let primeiroDia = new Date(dataAtual);
    primeiroDia.setDate(primeiroDia.getDate() - primeiroDia.getDay()); // Domingo

    let diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    let html = `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; text-align: center; padding: 10px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; color: #475569;">`;
    
    let tempDia = new Date(primeiroDia);
    for(let i=0; i<7; i++) {
        let ehHoje = tempDia.toDateString() === new Date().toDateString();
        html += `<div style="${ehHoje ? 'color: #2563eb; background: #eff6ff; padding: 4px; border-radius: 6px;' : ''}">${diasSemana[i]}<br><span style="font-size: 16px;">${tempDia.getDate()}</span></div>`;
        tempDia.setDate(tempDia.getDate() + 1);
    }
    html += `</div>`;

    // Grelha de horários simplificada por colunas da semana
    html += `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; padding: 16px; min-height: 350px;">`;
    for(let i=0; i<7; i++) {
        html += `<div style="border-right: 1px solid #f1f5f9; padding: 4px; display: flex; flex-direction: column; gap: 8px;">`;
        if (i === 1 || i === 3) {
            html += `<div style="background: #eff6ff; border-left: 3px solid #3b82f6; padding: 8px; border-radius: 6px; font-size: 11px;"><strong>09:00</strong><br>Reunião</div>`;
        } else {
            html += `<div style="color: #cbd5e1; font-size: 11px; text-align: center; margin-top: 20px;">Livre</div>`;
        }
        html += `</div>`;
    }
    html += `</div>`;

    gridContainer.innerHTML = html;
}

// 3. VISTA MÊS (Grelha tradicional de calendário mensal)
function renderizarVistaMes(gridContainer) {
    let ano = dataAtual.getFullYear();
    let mes = dataAtual.getMonth();
    
    let primeiroDiaMes = new Date(ano, mes, 1).getDay();
    let ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();

    let diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    let html = `<div style="display: grid; grid-template-columns: repeat(7, 1fr); background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-size: 12px; color: #64748b; padding: 10px 0;">`;
    diasSemana.forEach(d => html += `<div>${d}</div>`);
    html += `</div>`;

    html += `<div style="display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: minmax(70px, auto); gap: 1px; background: #e2e8f0; border-bottom: 1px solid #e2e8f0;">`;
    
    // Espaços vazios antes do dia 1
    for(let i=0; i<primeiroDiaMes; i++) {
        html += `<div style="background: #f8fafc; padding: 8px;"></div>`;
    }

    // Dias do mês
    for(let dia=1; dia<=ultimoDiaMes; dia++) {
        let ehHoje = (dia === new Date().getDate() && mes === new Date().getMonth() && ano === new Date().getFullYear());
        html += `
            <div style="background: white; padding: 8px; display: flex; flex-direction: column; justify-content: space-between;">
                <span style="font-size: 13px; font-weight: ${ehHoje ? 'bold' : 'normal'}; color: ${ehHoje ? '#2563eb' : '#334155'}; ${ehHoje ? 'background: #eff6ff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;' : ''}">${dia}</span>
                ${(dia === 10 || dia === 15 || dia === 21) ? '<span style="font-size: 10px; background: #dbeafe; color: #1e40af; padding: 2px 4px; border-radius: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Reunião</span>' : ''}
            </div>
        `;
    }

    html += `</div>`;
    gridContainer.innerHTML = html;
}

window.abrirModalReserva = function(inicio, fim) {
    const dataFormatada = document.getElementById("dataAtualExibicao").innerText;
    const nomeReuniao = prompt(`Nova Reserva em: ${dataFormatada}\nHorário: ${inicio} às ${fim}\nQual o nome da reunião?`);
    if (nomeReuniao) {
        alert(`Sucesso! "${nomeReuniao}" foi agendada.`);
    }
};
