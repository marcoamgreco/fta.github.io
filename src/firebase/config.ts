// Firebase Configuration
// IMPORTANTE: Configure as variáveis de ambiente no arquivo .env.local
// As variáveis devem ter o prefixo VITE_ para serem expostas no Vite

import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Carregar configuração das variáveis de ambiente
const firebaseConfig: FirebaseOptions = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

// Validar se as variáveis de ambiente estão configuradas
if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    console.warn(
        '⚠️ Firebase não configurado! Crie um arquivo .env.local com as variáveis VITE_FIREBASE_*.\n' +
        'Veja .env.example para referência.'
    );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
