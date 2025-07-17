// scripts/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCYAedjYF8ro1vseBCRDYKmD4pRUpslGjE",
  authDomain: "aigpt-d6410.firebaseapp.com",
  projectId: "aigpt-d6410",
  storageBucket: "aigpt-d6410.appspot.com",
  messagingSenderId: "707699404468",
  appId: "1:707699404468:web:71f16cfefcb20a0dacf1e1",
  measurementId: "G-TGQMRV6Q50"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { app, auth, db, provider };
