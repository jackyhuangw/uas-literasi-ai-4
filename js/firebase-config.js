// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB5QwZJx72GuvgwQKQEOHPw61QVVDOrHUQ",
    authDomain: "uas-literasi-ai.firebaseapp.com",
    projectId: "uas-literasi-ai",
    storageBucket: "uas-literasi-ai.firebasestorage.app",
    messagingSenderId: "686672779716",
    appId: "1:686672779716:web:2cfe1f91f878463055ec91",
    measurementId: "G-26CR76MRDL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
