// js/auth.js
import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Toggle between Login and Signup forms
const showSignupBtn = document.getElementById('showSignup');
const showLoginBtn = document.getElementById('showLogin');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

if (showSignupBtn) {
    showSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        document.getElementById('loginError').textContent = '';
    });
}

if (showLoginBtn) {
    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
        document.getElementById('signupError').textContent = '';
        document.getElementById('signupSuccess').textContent = '';
    });
}

// Login Form Handler
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorMessage = document.getElementById('loginError');
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Get user role from Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const role = userData.role;
                
                // Redirect based on role
                if (role === 'admin') {
                    window.location.href = 'dashboard-admin.html';
                } else if (role === 'viewer') {
                    window.location.href = 'dashboard-viewer.html';
                } else {
                    errorMessage.textContent = 'Role tidak valid';
                }
            } else {
                errorMessage.textContent = 'Data user tidak ditemukan';
            }
        } catch (error) {
            console.error('Login error:', error);
            if (error.code === 'auth/invalid-credential') {
                errorMessage.textContent = 'Email atau password salah';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage.textContent = 'User tidak ditemukan';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage.textContent = 'Password salah';
            } else {
                errorMessage.textContent = 'Terjadi kesalahan saat login';
            }
        }
    });
}

// Signup Form Handler
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const role = document.getElementById('signupRole').value;
        const errorMessage = document.getElementById('signupError');
        const successMessage = document.getElementById('signupSuccess');
        
        // Clear previous messages
        errorMessage.textContent = '';
        successMessage.textContent = '';
        
        // Validate password length
        if (password.length < 6) {
            errorMessage.textContent = 'Password minimal 6 karakter';
            return;
        }
        
        try {
            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Save user data to Firestore
            await setDoc(doc(db, 'users', user.uid), {
                name: name,
                email: email,
                role: role,
                createdAt: serverTimestamp()
            });
            
            successMessage.textContent = 'Akun berhasil dibuat! Redirecting...';
            
            // Redirect based on role after 1.5 seconds
            setTimeout(() => {
                if (role === 'admin') {
                    window.location.href = 'dashboard-admin.html';
                } else {
                    window.location.href = 'dashboard-viewer.html';
                }
            }, 1500);
            
        } catch (error) {
            console.error('Signup error:', error);
            if (error.code === 'auth/email-already-in-use') {
                errorMessage.textContent = 'Email sudah terdaftar';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage.textContent = 'Format email tidak valid';
            } else if (error.code === 'auth/weak-password') {
                errorMessage.textContent = 'Password terlalu lemah';
            } else {
                errorMessage.textContent = 'Terjadi kesalahan saat mendaftar';
            }
        }
    });
}

// Check Auth State on Dashboard Pages
onAuthStateChanged(auth, async (user) => {
    const currentPage = window.location.pathname;
    
    if (user) {
        // User is logged in
        if (currentPage.includes('index.html') || currentPage.endsWith('/')) {
            // If on login page, redirect to appropriate dashboard
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const role = userDoc.data().role;
                if (role === 'admin') {
                    window.location.href = 'dashboard-admin.html';
                } else {
                    window.location.href = 'dashboard-viewer.html';
                }
            }
        }
    } else {
        // User is not logged in
        if (currentPage.includes('dashboard')) {
            window.location.href = 'index.html';
        }
    }
});

// Logout Function (export for use in dashboard pages)
window.logout = async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
};
