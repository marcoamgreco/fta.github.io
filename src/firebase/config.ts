// Firebase Configuration
// IMPORTANTE: Substitua pelos valores reais do seu projeto Firebase
// Ou configure via variáveis de ambiente (recomendado)

import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Carregar configuração das variáveis de ambiente ou usar valores padrão
const firebaseConfig: FirebaseOptions = {
    apiKey: "AIzaSyB69U48JqtAgOI1vSFk9XRapN3iscavbgc",
    authDomain: "tstree-4a335.firebaseapp.com",
    projectId: "tstree-4a335",
    storageBucket: "tstree-4a335.firebasestorage.app",
    messagingSenderId: "441515792176",
    appId: "1:441515792176:web:208538e871cbfbf858daf5",
    measurementId: "G-J19B5T35M5"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
