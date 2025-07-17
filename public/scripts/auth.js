// scripts/auth.js
import { auth, provider } from './firebase-config.js';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

function checkAuthState() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, (user) => {
      resolve(user || null);
    }, reject);
  });
}

function signInWithGoogle() {
  return signInWithPopup(auth, provider);
}

function logoutUser() {
  return signOut(auth);
}

export { checkAuthState, signInWithGoogle, logoutUser };
