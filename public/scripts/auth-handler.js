// Dedicated authentication handler for redirect processing
import { auth, db } from './firebase-config.js';
import { 
    getRedirectResult, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { 
    doc, 
    getDoc 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Global auth state tracker
let authProcessed = false;

// Handle authentication on page load
export function handleAuthOnPageLoad() {
    console.log('🔵 AUTH HANDLER: Starting authentication check on page load');
    
    // Set up comprehensive auth state monitoring
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log('🔵 AUTH HANDLER: Auth state changed:', user ? user.email : 'null');
        
        if (user && !authProcessed) {
            authProcessed = true;
            unsubscribe();
            
            console.log('🟢 AUTH HANDLER: User authenticated, processing...');
            console.log('🟢 AUTH HANDLER: User details:', {
                displayName: user.displayName,
                email: user.email,
                uid: user.uid
            });
            
            await processAuthenticatedUser(user);
        } else if (!user && !authProcessed) {
            console.log('🟡 AUTH HANDLER: No user authenticated');
            
            // Check for redirect result
            try {
                const result = await getRedirectResult(auth);
                console.log('🔵 AUTH HANDLER: Redirect result:', result);
                
                if (result && result.user && !authProcessed) {
                    authProcessed = true;
                    unsubscribe();
                    
                    console.log('🟢 AUTH HANDLER: User authenticated via redirect');
                    await processAuthenticatedUser(result.user);
                }
            } catch (error) {
                console.log('🔴 AUTH HANDLER: Error checking redirect result:', error);
            }
        }
    }, (error) => {
        console.log('🔴 AUTH HANDLER: Auth state change error:', error);
    });
    
    // Timeout fallback
    setTimeout(() => {
        if (!authProcessed) {
            console.log('🟡 AUTH HANDLER: Auth processing timeout, no user found');
            unsubscribe();
        }
    }, 15000); // 15 second timeout
}

// Process authenticated user
async function processAuthenticatedUser(user) {
    console.log('🔵 AUTH HANDLER: Processing authenticated user:', user.displayName);
    
    try {
        // Check if user has API key
        const apiKeyData = await checkUserApiKey(user);
        console.log('🔵 AUTH HANDLER: API key check result:', apiKeyData);
        
        if (apiKeyData && apiKeyData.apiKey) {
            console.log('🟢 AUTH HANDLER: API key found, redirecting to chat...');
            window.location.href = '/chat.html';
        } else {
            console.log('🟡 AUTH HANDLER: No API key found, redirecting to API setup...');
            window.location.href = '/api.html';
        }
    } catch (error) {
        console.log('🔴 AUTH HANDLER: Error processing user:', error);
        console.error('Processing error:', error);
        
        // Default to API setup on error
        window.location.href = '/api.html';
    }
}

// Check if user has API key
async function checkUserApiKey(user) {
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