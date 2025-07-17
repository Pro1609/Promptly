// scripts/auth-handler.js
import { checkAuthState } from './auth.js';

async function handleAuthOnPageLoad(redirectIfLoggedIn = false) {
  try {
    const user = await checkAuthState();
    if (user && redirectIfLoggedIn) {
      window.location.href = "chat.html";
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }
}

export { handleAuthOnPageLoad };
