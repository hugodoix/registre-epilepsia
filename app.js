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