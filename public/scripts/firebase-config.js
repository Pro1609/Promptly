// Firebase configuration - Direct initialization to avoid hosting issues
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Direct Firebase configuration (no hosted init.json dependency)
const firebaseConfig = {
    apiKey: "AIzaSyCYAedjYF8ro1vseBCRDYKmD4pRUpslGjE",
    authDomain: "aigpt-d6410.firebaseapp.com",
    projectId: "aigpt-d6410",
    storageBucket: "aigpt-d6410.firebasestorage.app",
    appId: "1:707699404468:web:71f16cfefcb20a0dacf1e1"
};

// Initialize Firebase directly
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('🔵 FIREBASE: Firebase initialized successfully');
console.log('🔵 FIREBASE: Project ID:', firebaseConfig.projectId);
console.log('🔵 FIREBASE: Auth Domain:', firebaseConfig.authDomain);

// Debug logging
console.log('Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? 'Present' : 'Missing',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    appId: firebaseConfig.appId ? 'Present' : 'Missing'
});

// Show current domain info
console.log('Current domain info:', {
    hostname: window.location.hostname,
    origin: window.location.origin,
    fullURL: window.location.href
});

export { auth, db };
