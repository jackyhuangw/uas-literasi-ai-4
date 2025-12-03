// js/admin.js
import { auth, db } from './firebase-config.js';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentEditId = null;
let allAgendas = [];

// Category Labels
const categoryLabels = {
    'rapat_internal': 'Rapat Internal',
    'pertemuan_klien': 'Pertemuan Klien',
    'olahraga': 'Olahraga',
    'perjalanan_bisnis': 'Perjalanan Bisnis',
    'pribadi': 'Pribadi'
};

// Display Admin Name
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            document.getElementById('adminName').textContent = userDoc.data().name;
        }
        
        // Check for upcoming reminders
        checkReminders();
        // Check every minute
        setInterval(checkReminders, 60000);
    }
});

// Check Reminders Function
async function checkReminders() {
    if (!auth.currentUser) return;
    
    const now = new Date();
    const agendasRef = collection(db, 'agendas');
    const q = query(
        agendasRef, 
        where('notificationSent', '==', false),
        where('startTime', '>', Timestamp.now())
    );
    
    const snapshot = await getDocs(q);
    
    snapshot.forEach(async (docSnap) => {
        const agenda = docSnap.data();
        const startTime = agenda.startTime.toDate();
        const reminderTime = new Date(startTime.getTime() - (agenda.reminderMinutes * 60000));
        
        if (now >= reminderTime) {
            // Create notification
            const notifMessage = `Reminder: ${agenda.title} akan dimulai dalam ${agenda.reminderMinutes} menit`;
            
            await addDoc(collection(db, 'notifications'), {
                agendaId: docSnap.id,
                userId: auth.currentUser.uid,
                message: notifMessage,
                whenToNotify: Timestamp.now(),
                sent: true,
                sentAt: serverTimestamp()
            });
            
            // Update agenda
            await updateDoc(doc(db, 'agendas', docSnap.id), {
                notificationSent: true
            });
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Pengingat Agenda', {
                    body: notifMessage,
                    icon: 'https://img.icons8.com/color/96/calendar.png'
                });
            }
            
            // Show alert
            alert(notifMessage);
        }
    });
}

// Request notification permission on load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Form Submission
const agendaForm = document.getElementById('agendaForm');
agendaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const startTime = new Date(document.getElementById('startTime').value);
    const endTime = new Date(document.getElementById('endTime').value);
    
    // Validation
    if (endTime <= startTime) {
        alert('Waktu selesai harus lebih besar dari waktu mulai');
        return;
    }
    
    const agendaData = {
        title: document.getElementById('title').value,
        category: document.getElementById('category').value,
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
        location: document.getElementById('location').value,
        description: document.getElementById('description').value,
        reminderMinutes: parseInt(document.getElementById('reminderMinutes').value),
        notificationSent: false,
        createdBy: auth.currentUser.uid,
        updatedAt: serverTimestamp()
    };

    try {
        if (currentEditId) {
            // Update existing agenda
            await updateDoc(doc(db, 'agendas', currentEditId), agendaData);
            alert('Agenda berhasil diperbarui!');
        } else {
            // Add new agenda
            agendaData.createdAt = serverTimestamp();
            await addDoc(collection(db, 'agendas'), agendaData);
            alert('Agenda berhasil ditambahkan!');
        }
        
        resetForm();
    } catch (error) {
        console.error('Error saving agenda:', error);
        alert('Gagal menyimpan agenda');
    }
});

// Reset Form
function resetForm() {
    agendaForm.reset();
    currentEditId = null;
    document.getElementById('formTitle').textContent = 'Tambah Agenda Baru';
    document.getElementById('submitBtn').textContent = 'Tambah Agenda';
    document.getElementById('cancelBtn').style.display = 'none';
}

// Cancel Edit
document.getElementById('cancelBtn').addEventListener('click', resetForm);

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
        const isPast = startTime < new Date();
        
        return `
            <div class="agenda-card ${isPast ? 'past-event' : ''}">
                <div class="agenda-header">
                    <h3>${agenda.title}</h3>
                    <span class="category-badge ${agenda.category}">${categoryLabels[agenda.category]}</span>
                </div>
                <div class="agenda-body">
                    <p><strong>📅 Waktu:</strong> ${formatDateTime(startTime)} - ${formatTime(endTime)}</p>
                    <p><strong>📍 Lokasi:</strong> ${agenda.location}</p>
                    ${agenda.description ? `<p><strong>📝 Deskripsi:</strong> ${agenda.description}</p>` : ''}
                    <p><strong>🔔 Reminder:</strong> ${agenda.reminderMinutes} menit sebelumnya ${agenda.notificationSent ? '(✓ Terkirim)' : ''}</p>
                </div>
                <div class="agenda-actions">
                    <button onclick="editAgenda('${agenda.id}')" class="btn-edit">Edit</button>
                    <button onclick="deleteAgenda('${agenda.id}')" class="btn-delete">Hapus</button>
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

// Edit Agenda
window.editAgenda = async (id) => {
    const agenda = allAgendas.find(a => a.id === id);
    if (!agenda) return;

    currentEditId = id;
    document.getElementById('formTitle').textContent = 'Edit Agenda';
    document.getElementById('submitBtn').textContent = 'Update Agenda';
    document.getElementById('cancelBtn').style.display = 'inline-block';

    // Fill form
    document.getElementById('title').value = agenda.title;
    document.getElementById('category').value = agenda.category;
    document.getElementById('startTime').value = formatDateTimeLocal(agenda.startTime.toDate());
    document.getElementById('endTime').value = formatDateTimeLocal(agenda.endTime.toDate());
    document.getElementById('location').value = agenda.location;
    document.getElementById('description').value = agenda.description || '';
    document.getElementById('reminderMinutes').value = agenda.reminderMinutes;

    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
};

// Format for datetime-local input
function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Delete Agenda
window.deleteAgenda = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus agenda ini?')) {
        try {
            await deleteDoc(doc(db, 'agendas', id));
            alert('Agenda berhasil dihapus!');
        } catch (error) {
            console.error('Error deleting agenda:', error);
            alert('Gagal menghapus agenda');
        }
    }
};

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
