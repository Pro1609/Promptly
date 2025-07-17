import { db } from './firebase-config.js';
import { getCurrentUser } from './auth.js';
import { getApiKey, callAI } from './api.js';
import { 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    onSnapshot,
    deleteDoc,
    getDocs
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

let currentUser = null;
let currentChatId = null;
let messagesListener = null;

// Initialize chat
export async function initializeChat(user) {
    currentUser = user;
    currentChatId = 'default'; // For simplicity, using a single chat
    
    // Set up real-time message listener
    setupMessageListener();
}

// Set up real-time message listener
function setupMessageListener() {
    if (messagesListener) {
        messagesListener();
    }
    
    const messagesRef = collection(db, 'users', currentUser.uid, 'chats', currentChatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    messagesListener = onSnapshot(q, (querySnapshot) => {
        const messages = [];
        querySnapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        
        displayMessages(messages);
    });
}

// Display messages in the chat
function displayMessages(messages) {
    const messagesContainer = document.getElementById('messagesContainer');
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    // Clear existing messages except welcome
    const existingMessages = messagesContainer.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    if (messages.length === 0) {
        welcomeMessage.style.display = 'block';
        return;
    }
    
    welcomeMessage.style.display = 'none';
    
    messages.forEach(message => {
        const messageElement = createMessageElement(message);
        messagesContainer.appendChild(messageElement);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Create message element
function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message animate-fade-in';
    
    const isUser = message.role === 'user';
    const alignClass = isUser ? 'justify-end' : 'justify-start';
    const bgClass = isUser ? 'bg-gradient-to-r from-neon-purple to-neon-green text-black' : 'bg-slate-800 text-white';
    const maxWidth = 'max-w-3xl';
    
    messageDiv.innerHTML = `
        <div class="flex ${alignClass} mb-4">
            <div class="flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3 ${maxWidth}">
                <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-gradient-to-r from-neon-purple to-neon-green' : 'bg-slate-700'}">
                    <svg class="w-4 h-4 ${isUser ? 'text-black' : 'text-neon-purple'}" fill="currentColor" viewBox="0 0 24 24">
                        ${isUser ? 
                            '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>' :
                            '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>'
                        }
                    </svg>
                </div>
                <div class="flex-1">
                    <div class="inline-block px-4 py-3 rounded-lg ${bgClass} ${isUser ? 'ml-3' : 'mr-3'} shadow-lg">
                        <p class="text-sm leading-relaxed">${escapeHtml(message.content)}</p>
                    </div>
                    <div class="text-xs text-slate-500 mt-1 ${isUser ? 'text-right mr-3' : 'text-left ml-3'}">
                        ${formatTimestamp(message.timestamp)}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return messageDiv;
}

// Send message
export async function sendMessage(content) {
    if (!currentUser || !content.trim()) return;
    
    const userMessage = {
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString()
    };
    
    try {
        // Add user message to Firestore
        const messagesRef = collection(db, 'users', currentUser.uid, 'chats', currentChatId, 'messages');
        await addDoc(messagesRef, userMessage);
        
        // Show typing indicator
        showTypingIndicator();
        
        // Get API key and call AI
        const apiKeyData = await getApiKey();
        
        if (apiKeyData) {
            // Get conversation history for context
            const conversationHistory = await getConversationHistory();
            
            // Call AI API
            const aiResponse = await callAI(conversationHistory, apiKeyData);
            
            // Add AI response to Firestore
            const aiMessage = {
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date().toISOString()
            };
            
            await addDoc(messagesRef, aiMessage);
        } else {
            // No API key, show error message
            const errorMessage = {
                role: 'assistant',
                content: 'I cannot respond because no API key is configured. Please set up your API key in the settings.',
                timestamp: new Date().toISOString()
            };
            
            await addDoc(messagesRef, errorMessage);
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        
        // Add error message to chat
        const errorMessage = {
            role: 'assistant',
            content: 'Sorry, I encountered an error while processing your message. Please try again.',
            timestamp: new Date().toISOString()
        };
        
        const messagesRef = collection(db, 'users', currentUser.uid, 'chats', currentChatId, 'messages');
        await addDoc(messagesRef, errorMessage);
    } finally {
        hideTypingIndicator();
    }
}

// Get conversation history
async function getConversationHistory() {
    const messagesRef = collection(db, 'users', currentUser.uid, 'chats', currentChatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const querySnapshot = await getDocs(q);
    const messages = [];
    
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
            role: data.role,
            content: data.content
        });
    });
    
    // Limit to last 20 messages to avoid token limits
    return messages.slice(-20);
}

// Show typing indicator
function showTypingIndicator() {
    const messagesContainer = document.getElementById('messagesContainer');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicator';
    typingDiv.className = 'message animate-fade-in';
    
    typingDiv.innerHTML = `
        <div class="flex justify-start mb-4">
            <div class="flex flex-row items-start space-x-3 max-w-3xl">
                <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-700">
                    <svg class="w-4 h-4 text-neon-purple" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                </div>
                <div class="flex-1">
                    <div class="inline-block px-4 py-3 rounded-lg bg-slate-800 text-white mr-3 shadow-lg">
                        <div class="flex items-center space-x-1">
                            <div class="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                            <div class="w-2 h-2 bg-slate-500 rounded-full animate-pulse" style="animation-delay: 0.1s"></div>
                            <div class="w-2 h-2 bg-slate-500 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Load chat history
export async function loadChatHistory() {
    // History is loaded automatically via the real-time listener
    // This function is kept for compatibility
}

// Clear chat history
export async function clearChatHistory() {
    if (!currentUser) return;
    
    const messagesRef = collection(db, 'users', currentUser.uid, 'chats', currentChatId, 'messages');
    const querySnapshot = await getDocs(messagesRef);
    
    const deletePromises = [];
    querySnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletePromises);
}

// Helper functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // Less than 1 minute
        return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) { // Less than 24 hours
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
}
