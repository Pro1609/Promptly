import { db } from './firebase-config.js';
import { getCurrentUser } from './auth.js';
import { 
    doc, 
    setDoc, 
    getDoc 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Save API key to Firestore
export async function saveApiKey(apiKey, provider = 'openai') {
    const user = getCurrentUser();
    if (!user) {
        throw new Error('User not authenticated');
    }
    
    try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
            apiKey: apiKey,
            provider: provider,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        
        console.log('API key saved successfully');
    } catch (error) {
        console.error('Error saving API key:', error);
        throw error;
    }
}

// Get API key from Firestore
export async function getApiKey() {
    const user = getCurrentUser();
    if (!user) {
        throw new Error('User not authenticated');
    }
    
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
        console.error('Error getting API key:', error);
        throw error;
    }
}

// Call OpenAI API
export async function callOpenAI(messages, apiKey) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API error:', error);
        throw error;
    }
}

// Call Together.ai API
export async function callTogether(messages, apiKey) {
    try {
        const response = await fetch('https://api.together.xyz/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'meta-llama/Llama-2-70b-chat-hf',
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Together.ai API error: ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Together.ai API error:', error);
        throw error;
    }
}

// Generic AI API call
export async function callAI(messages, apiKeyData) {
    if (!apiKeyData) {
        throw new Error('No API key configured');
    }
    
    const { apiKey, provider } = apiKeyData;
    
    switch (provider) {
        case 'openai':
            return await callOpenAI(messages, apiKey);
        case 'together':
            return await callTogether(messages, apiKey);
        default:
            throw new Error(`Unsupported provider: ${provider}`);
    }
}
