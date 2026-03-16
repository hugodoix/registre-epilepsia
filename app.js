// Referències al DOM
const btnLogSeizure = document.getElementById('btn-log-seizure');
const modalSeizure = document.getElementById('modal-seizure');
const btnCancel = document.getElementById('btn-cancel');
const btnSave = document.getElementById('btn-save');
const intensityButtons = document.querySelectorAll('#intensity-buttons button');
const notesInput = document.getElementById('seizure-notes');
const treatmentDisplay = document.getElementById('current-treatment');

let currentSeizureData = {
    timestamp: null,
    intensity: null,
    notes: '',
    treatmentAtTime: treatmentDisplay.innerText
};

// Funcions de UI (Transicions suaus)
function openModal() {
    currentSeizureData.timestamp = new Date().toISOString(); // Captura l'hora exacta del clic
    modalSeizure.classList.remove('pointer-events-none');
    modalSeizure.classList.add('visible');
}

function closeModal() {
    modalSeizure.classList.remove('visible');
    setTimeout(() => {
        modalSeizure.classList.add('pointer-events-none');
        resetForm();
    }, 400); // Espera que acabi la transició CSS
}

function resetForm() {
    currentSeizureData.intensity = null;
    notesInput.value = '';
    intensityButtons.forEach(btn => {
        btn.classList.remove('bg-indigo-600');
        btn.classList.add('bg-slate-700');
    });
}

// Event Listeners
btnLogSeizure.addEventListener('click', openModal);
btnCancel.addEventListener('click', closeModal);

intensityButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Netejar selecció anterior
        intensityButtons.forEach(b => {
            b.classList.remove('bg-indigo-600');
            b.classList.add('bg-slate-700');
        });
        // Marcar la nova
        e.target.classList.remove('bg-slate-700');
        e.target.classList.add('bg-indigo-600');
        currentSeizureData.intensity = parseInt(e.target.getAttribute('data-val'));
    });
});

btnSave.addEventListener('click', () => {
    if (!currentSeizureData.intensity) {
        alert('Si us plau, selecciona una intensitat per poder registrar-ho.');
        return;
    }
    
    currentSeizureData.notes = notesInput.value;
    
    // Guardar a LocalStorage (Com a pas previ o backup de Firebase)
    saveToLocal(currentSeizureData);
    
    // Aquí cridarem a Firebase més endavant
    // syncWithFirebase(currentSeizureData);
    
    closeModal();
});

function saveToLocal(data) {
    let history = JSON.parse(localStorage.getItem('seizureHistory')) || [];
    history.push(data);
    localStorage.setItem('seizureHistory', JSON.stringify(history));
    console.log('Guardat localment:', data);
}

// --- LÒGICA D'HISTORIAL I GRÀFIQUES ---

const viewRegister = document.getElementById('view-register');
const viewHistory = document.getElementById('view-history');
const btnTabRegister = document.getElementById('btn-tab-register');
const btnTabHistory = document.getElementById('btn-tab-history');

let chartInstance = null;

// Gestió de pestanyes
btnTabRegister.addEventListener('click', () => {
    viewHistory.classList.add('hidden');
    viewHistory.classList.remove('visible');
    viewRegister.classList.remove('hidden');
    
    btnTabRegister.classList.replace('bg-slate-700', 'bg-indigo-600');
    btnTabHistory.classList.replace('bg-indigo-600', 'bg-slate-700');
});

btnTabHistory.addEventListener('click', () => {
    viewRegister.classList.add('hidden');
    viewHistory.classList.remove('hidden');
    
    // Petit delay per activar la transició d'opacitat
    setTimeout(() => viewHistory.classList.add('visible'), 50);
    
    btnTabHistory.classList.replace('bg-slate-700', 'bg-indigo-600');
    btnTabRegister.classList.replace('bg-indigo-600', 'bg-slate-700');
    
    loadHistoryData();
});

// Carregar i pintar dades
function loadHistoryData() {
    // Si fas servir Firebase, aquí canviaràs per fer getDocs() a Firestore
    let history = JSON.parse(localStorage.getItem('seizureHistory')) || [];
    
    renderList(history);
    renderChart(history);
}

function renderList(history) {
    const listEl = document.getElementById('history-list');
    listEl.innerHTML = ''; 
    
    if(history.length === 0) {
        listEl.innerHTML = '<p class="text-slate-400 italic text-center py-4">Encara no hi ha cap registre.</p>';
        return;
    }

    // Ordenar de més recent a més antic
    const sortedHistory = [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    sortedHistory.forEach(item => {
        const dateObj = new Date(item.timestamp);
        const dateStr = dateObj.toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' });
        const timeStr = dateObj.toLocaleTimeString('ca-ES', { hour: '2-digit', minute:'2-digit' });
        
        const li = document.createElement('li');
        li.className = 'p-4 bg-slate-900/50 rounded-xl flex justify-between items-center border border-slate-700';
        li.innerHTML = `
            <div>
                <p class="font-bold text-slate-200 text-lg">${dateStr} <span class="text-sm font-normal text-slate-400 ml-2">${timeStr}</span></p>
                <p class="text-sm text-slate-400 mt-1">Tractament: <span class="text-indigo-300">${item.treatmentAtTime}</span></p>
                ${item.notes ? `<p class="text-sm text-slate-500 mt-2 italic">"${item.notes}"</p>` : ''}
            </div>
            <div class="flex-shrink-0 ml-4">
                <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border-2 border-indigo-500">
                    <span class="text-xl font-bold text-indigo-400">${item.intensity}</span>
                </div>
            </div>
        `;
        listEl.appendChild(li);
    });
}

function renderChart(history) {
    const ctx = document.getElementById('seizureChart').getContext('2d');
    
    // Comptar crisis per tractament
    const treatmentCounts = history.reduce((acc, curr) => {
        const tractament = curr.treatmentAtTime || 'Desconegut';
        acc[tractament] = (acc[tractament] || 0) + 1;
        return acc;
    }, {});

    const labels = Object.keys(treatmentCounts);
    const data = Object.values(treatmentCounts);

    if (chartInstance) {
        chartInstance.destroy();
    }

    // Configuració de colors per a mode fosc
    Chart.defaults.color = '#cbd5e1'; 
    Chart.defaults.font.family = 'ui-sans-serif, system-ui, sans-serif';

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : ['Sense dades'],
            datasets: [{
                label: 'Nombre de crisis',
                data: data.length > 0 ? data : [0],
                backgroundColor: '#4f46e5', // color indigo-600 suau
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0 // ACCESSIBILITAT: 0 animacions per evitar canvis bruscos visuals
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                    grid: { color: '#334155' } // Línies suaus
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    // --- LÒGICA D'EXPORTACIÓ A CSV ---

const btnExport = document.getElementById('btn-export');

btnExport.addEventListener('click', () => {
    // Recuperar dades (de moment de LocalStorage)
    const history = JSON.parse(localStorage.getItem('seizureHistory')) || [];
    
    if (history.length === 0) {
        alert('No hi ha cap registre per exportar encara.');
        return;
    }

    // 1. Crear la capçalera del document CSV
    let csvContent = "Data,Hora,Intensitat,Tractament,Notes\n";

    // 2. Ordenar les dades cronològicament (del més antic al més recent)
    const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // 3. Processar cada registre
    sortedHistory.forEach(item => {
        const dateObj = new Date(item.timestamp);
        const dateStr = dateObj.toLocaleDateString('ca-ES');
        const timeStr = dateObj.toLocaleTimeString('ca-ES', { hour: '2-digit', minute:'2-digit' });
        
        // Netejar les notes: treure salts de línia i gestionar cometes i comes
        let safeNotes = item.notes ? item.notes.replace(/"/g, '""').replace(/\n/g, ' ') : '';
        if (safeNotes.includes(',')) {
            safeNotes = `"${safeNotes}"`; // Envoltem amb cometes si hi ha comes al text
        }

        // Afegir la fila al text del CSV
        const row = `${dateStr},${timeStr},${item.intensity},${item.treatmentAtTime},${safeNotes}`;
        csvContent += row + "\n";
    });

    // 4. Crear i descarregar el fitxer
    // S'afegeix '\ufeff' (BOM) perquè programes com Excel detectin correctament el text UTF-8 (accents, etc.)
    const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Creem un enllaç invisible, li fem clic automàticament i l'esborrem
    const link = document.createElement("a");
    const avui = new Date().toLocaleDateString('ca-ES').replace(/\//g, '-');
    
    link.setAttribute("href", url);
    link.setAttribute("download", `informe_crisis_${avui}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

    // --- LÒGICA D'AJUSTOS I TRACTAMENT ---

const btnSettings = document.getElementById('btn-settings');
const modalSettings = document.getElementById('modal-settings');
const btnCancelSettings = document.getElementById('btn-cancel-settings');
const btnSaveSettings = document.getElementById('btn-save-settings');
const inputTreatment = document.getElementById('input-treatment');

// 1. Carregar el tractament guardat en obrir l'app
let savedTreatment = localStorage.getItem('currentTreatment') || 'Cap tractament definit';
treatmentDisplay.innerText = savedTreatment;
currentSeizureData.treatmentAtTime = savedTreatment; // Assignem el tractament actual a les futures crisis

// 2. Obrir el modal d'ajustos
btnSettings.addEventListener('click', () => {
    // Omplim l'input amb el valor actual perquè sigui fàcil d'editar
    inputTreatment.value = savedTreatment === 'Cap tractament definit' ? '' : savedTreatment;
    
    modalSettings.classList.remove('pointer-events-none');
    modalSettings.classList.add('visible');
    inputTreatment.focus();
});

// 3. Funció per tancar de forma suau
function closeSettings() {
    modalSettings.classList.remove('visible');
    setTimeout(() => modalSettings.classList.add('pointer-events-none'), 400);
}

btnCancelSettings.addEventListener('click', closeSettings);

// 4. Guardar el nou tractament
btnSaveSettings.addEventListener('click', () => {
    const newTreatment = inputTreatment.value.trim() || 'Cap tractament definit';
    savedTreatment = newTreatment;
    
    // Actualitzem la interfície (Capçalera)
    treatmentDisplay.innerText = savedTreatment;
    
    // Actualitzem les dades que s'enviaran al registrar una crisi
    currentSeizureData.treatmentAtTime = savedTreatment;
    
    // Guardem el tractament a la memòria del telèfon de forma permanent
    localStorage.setItem('currentTreatment', savedTreatment);
    
    closeSettings();
});
}
