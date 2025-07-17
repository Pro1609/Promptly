#!/usr/bin/env python3
import os
import subprocess
import time

def generate_config():
    # Get environment variables
    api_key = os.environ.get('VITE_FIREBASE_API_KEY', '')
    project_id = os.environ.get('VITE_FIREBASE_PROJECT_ID', '')
    app_id = os.environ.get('VITE_FIREBASE_APP_ID', '')
    
    if not all([api_key, project_id, app_id]):
        print("Warning: Missing Firebase configuration environment variables")
        return
    
    # Generate config.js with actual values
    config_content = f"""// Configuration injection for Firebase
// Generated from environment variables
window.FIREBASE_CONFIG = {{
    apiKey: "{api_key}",
    authDomain: "{project_id}.firebaseapp.com",
    projectId: "{project_id}",
    storageBucket: "{project_id}.firebasestorage.app",
    appId: "{app_id}"
}};"""
    
    with open('public/config.js', 'w') as f:
        f.write(config_content)
    
    print("Firebase configuration generated successfully")

def start_server():
    # Generate config first
    generate_config()
    
    # Start HTTP server from public directory
    print("Starting HTTP server on port 5000...")
    os.chdir('public')
    subprocess.run(['python3', '-m', 'http.server', '5000'])

if __name__ == "__main__":
    start_server()