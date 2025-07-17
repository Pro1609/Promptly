import { auth, db } from './firebase-config.js';
import { 
    signInWithRedirect, 
    getRedirectResult, 
    GoogleAuthProvider, 
    signOut as firebaseSignOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { 
    doc, 
    getDoc 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getApiKey } from './api.js';

const provider = new GoogleAuthProvider();

// Add additional scopes if needed
provider.addScope('email');
provider.addScope('profile');

// Set custom parameters
provider.setCustomParameters({
    'prompt': 'select_account'
});

// Sign in with Google
export async function signInWithGoogle() {
    console.log('🔵 AUTH DEBUG: Starting Google sign-in process');
    console.log('🔵 AUTH DEBUG: Current domain:', window.location.hostname);
    console.log('🔵 AUTH DEBUG: Auth object:', auth);
    console.log('🔵 AUTH DEBUG: Provider object:', provider);
    
    try {
        // Set persistence to LOCAL to ensure auth state persists
        console.log('🔵 AUTH DEBUG: Setting persistence to LOCAL...');
        await setPersistence(auth, browserLocalPersistence);
        console.log('🔵 AUTH DEBUG: Persistence set successfully');
        
        console.log('🔵 AUTH DEBUG: Calling signInWithRedirect...');
        await signInWithRedirect(auth, provider);
        console.log('🔵 AUTH DEBUG: signInWithRedirect completed successfully');
    } catch (error) {
        console.log('🔴 AUTH DEBUG: Error in signInWithGoogle');
        console.error('Sign-in error:', error);
        console.log('🔴 AUTH DEBUG: Error code:', error.code);
        console.log('🔴 AUTH DEBUG: Error message:', error.message);
        
        // Provide more specific error messages
        if (error.code === 'auth/configuration-not-found') {
            throw new Error('Firebase Authentication is not properly configured. Please enable Google Sign-In in your Firebase Console.');
        } else if (error.code === 'auth/unauthorized-domain') {
            throw new Error(`This domain is not authorized. Please add "${window.location.hostname}" to Firebase authorized domains.`);
        } else {
            throw new Error(`Sign-in failed: ${error.message}`);
        }
    }
}

// Handle redirect result
export async function handleRedirectResult() {
    console.log('🔵 AUTH DEBUG: Starting handleRedirectResult');
    
    return new Promise((resolve, reject) => {
        let authResolved = false;
        
        // First, try to get the redirect result immediately
        getRedirectResult(auth).then(async (result) => {
            console.log('🔵 AUTH DEBUG: Immediate getRedirectResult completed:', result);
            
            if (result && result.user && !authResolved) {
                authResolved = true;
                console.log('🟢 AUTH DEBUG: User signed in via redirect:', result.user.displayName);
                console.log('🟢 AUTH DEBUG: User email:', result.user.email);
                console.log('🟢 AUTH DEBUG: User ID:', result.user.uid);
                
                await handleUserSignIn(result.user);
                resolve(result);
                return;
            }
            
            // If no redirect result, set up auth state listener
            if (!authResolved) {
                console.log('🔵 AUTH DEBUG: Setting up auth state listener...');
                
                const unsubscribe = onAuthStateChanged(auth, async (user) => {
                    console.log('🔵 AUTH DEBUG: Auth state changed:', user);
                    
                    if (user && !authResolved) {
                        authResolved = true;
                        unsubscribe();
                        
                        console.log('🟢 AUTH DEBUG: User is signed in:', user.displayName);
                        console.log('🟢 AUTH DEBUG: User email:', user.email);
                        console.log('🟢 AUTH DEBUG: User ID:', user.uid);
                        
                        await handleUserSignIn(user);
                        resolve({ user });
                    } else if (!user && !authResolved) {
                        console.log('🟡 AUTH DEBUG: No user signed in');
                        unsubscribe();
                        authResolved = true;
                        resolve(null);
                    }
                }, (error) => {
                    console.log('🔴 AUTH DEBUG: Auth state change error:', error);
                    if (!authResolved) {
                        authResolved = true;
                        unsubscribe();
                        reject(error);
                    }
                });
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    if (!authResolved) {
                        console.log('🟡 AUTH DEBUG: Auth state check timeout');
                        authResolved = true;
                        unsubscribe();
                        resolve(null);
                    }
                }, 10000);
            }
        }).catch((error) => {
            console.log('🔴 AUTH DEBUG: Error in getRedirectResult:', error);
            if (!authResolved) {
                authResolved = true;
                reject(error);
            }
        });
    });
}

// Helper function to handle user sign-in
async function handleUserSignIn(user) {
    console.log('🔵 AUTH DEBUG: Handling user sign-in for:', user.displayName);
    
    try {
        console.log('🔵 AUTH DEBUG: Checking for existing API key...');
        const apiKeyData = await checkApiKey(user);
        console.log('🔵 AUTH DEBUG: API key check result:', apiKeyData);
        
        if (apiKeyData) {
            console.log('🟢 AUTH DEBUG: API key found, redirecting to chat...');
            window.location.href = 'chat.html';
        } else {
            console.log('🟡 AUTH DEBUG: No API key found, redirecting to API setup...');
            window.location.href = 'api.html';
        }
    } catch (error) {
        console.log('🔴 AUTH DEBUG: Error checking API key:', error);
        console.error('Error checking API key:', error);
        window.location.href = 'api.html';
    }
}

// Local function to check API key (to avoid circular imports)
async function checkApiKey(user) {
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                apiKey: data.apiKey,
                provider: data.provider || 'openai'
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error checking API key:', error);
        throw error;
    }
}

// Sign out
export async function signOut() {
    try {
        await firebaseSignOut(auth);
        console.log('User signed out');
    } catch (error) {
        console.error('Sign-out error:', error);
        throw error;
    }
}

// Check authentication state
export function checkAuthState() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        }, (error) => {
            unsubscribe();
            reject(error);
        });
    });
}

// Get current user
export function getCurrentUser() {
    return auth.currentUser;
}
