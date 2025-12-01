// Script para atualizar todos os cenários do Firebase com tecnologia FCC
// Execute este script uma vez para atualizar todos os cenários

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Importar configuração do Firebase
// Você precisa ajustar isso com suas credenciais ou importar do config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

async function updateAllScenariosToFCC() {
  try {
    console.log('🚀 Iniciando atualização de todos os cenários para FCC...\n');

    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('✅ Conectado ao Firebase\n');

    // Buscar todos os cenários
    const scenariosRef = collection(db, 'scenarios');
    const querySnapshot = await getDocs(scenariosRef);

    if (querySnapshot.empty) {
      console.log('⚠️ Nenhum cenário encontrado no Firebase');
      return;
    }

    console.log(`📦 Encontrados ${querySnapshot.size} cenários\n`);

    let successCount = 0;
    let errorCount = 0;

    // Atualizar cada cenário
    for (const docSnapshot of querySnapshot.docs) {
      try {
        const scenarioRef = doc(db, 'scenarios', docSnapshot.id);
        const data = docSnapshot.data();

        // Atualizar apenas o campo tecnologia
        await updateDoc(scenarioRef, {
          tecnologia: 'FCC'
        });

        console.log(`✅ Atualizado: ${data.title || docSnapshot.id} (${docSnapshot.id})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Erro ao atualizar ${docSnapshot.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Resumo da atualização:');
    console.log(`   ✅ Sucesso: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📦 Total: ${querySnapshot.size}\n`);

    if (errorCount === 0) {
      console.log('🎉 Todos os cenários foram atualizados com sucesso!');
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar cenários:', error);
    process.exit(1);
  }
}

// Executar se for chamado diretamente
if (import.meta.main || require.main === module) {
  updateAllScenariosToFCC()
    .then(() => {
      console.log('\n✅ Script concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

export { updateAllScenariosToFCC };
