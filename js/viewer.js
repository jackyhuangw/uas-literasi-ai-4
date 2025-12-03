// js/viewer.js
import { auth, db } from './firebase-config.js';
import { collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let allAgendas = [];

// Category Labels
const categoryLabels = {
    'rapat_internal': 'Rapat Internal',
    'pertemuan_klien': 'Pertemuan Klien',
    'olahraga': 'Olahraga',
    'perjalanan_bisnis': 'Perjalanan Bisnis',
    'pribadi': 'Pribadi'
};

// Display Viewer Name
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            document.getElementById('viewerName').textContent = userDoc.data().name;
        }
    }
});

// Load Agendas (Real-time)
const agendasRef = collection(db, 'agendas');
const q = query(agendasRef, orderBy('startTime', 'asc'));

onSnapshot(q, (snapshot) => {
    allAgendas = [];
    snapshot.forEach((doc) => {
        allAgendas.push({ id: doc.id, ...doc.data() });
    });
    displayAgendas(allAgendas);
});

// Display Agendas
function displayAgendas(agendas) {
    const agendaList = document.getElementById('agendaList');

    if (agendas.length === 0) {
        agendaList.innerHTML = '<p class="no-data">Belum ada agenda</p>';
        return;
    }

    agendaList.innerHTML = agendas.map(agenda => {
        const startTime = agenda.startTime.toDate();
        const endTime = agenda.endTime.toDate();

        return `
            <div class="agenda-card viewer">
                <div class="agenda-header">
                    <h3>${agenda.title}</h3>
                    <span class="category-badge ${agenda.category}">${categoryLabels[agenda.category]}</span>
                </div>
                <div class="agenda-body">
                    <p><strong>📅 Waktu:</strong> ${formatDateTime(startTime)} - ${formatTime(endTime)}</p>
                    <p><strong>📍 Lokasi:</strong> ${agenda.location}</p>
                    ${agenda.description ? `<p><strong>📝 Deskripsi:</strong> ${agenda.description}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Format DateTime
function formatDateTime(date) {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'full',
        timeStyle: 'short'
    }).format(date);
}

// Format Time Only
function formatTime(date) {
    return new Intl.DateTimeFormat('id-ID', {
        timeStyle: 'short'
    }).format(date);
}

// Filters
document.getElementById('filterCategory').addEventListener('change', applyFilters);
document.getElementById('filterDate').addEventListener('change', applyFilters);

function applyFilters() {
    const categoryFilter = document.getElementById('filterCategory').value;
    const dateFilter = document.getElementById('filterDate').value;

    let filtered = allAgendas;

    if (categoryFilter) {
        filtered = filtered.filter(a => a.category === categoryFilter);
    }

    if (dateFilter) {
        const filterDate = new Date(dateFilter);
        filtered = filtered.filter(a => {
            const agendaDate = a.startTime.toDate();
            return agendaDate.toDateString() === filterDate.toDateString();
        });
    }

    displayAgendas(filtered);
}
