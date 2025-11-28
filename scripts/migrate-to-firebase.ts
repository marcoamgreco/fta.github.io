// Script para migrar cenários de scenarios.ts para Firebase Firestore
// Execute: npx tsx scripts/migrate-to-firebase.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { scenarios } from '../src/scenarios';
import type { Scenario } from '../src/scenarios';

// ⚠️ IMPORTANTE: Configure suas credenciais Firebase aqui
// Ou use variáveis de ambiente
const firebaseConfig = {

  apiKey: "AIzaSyB69U48JqtAgOI1vSFk9XRapN3iscavbgc",

  authDomain: "tstree-4a335.firebaseapp.com",

  projectId: "tstree-4a335",

  storageBucket: "tstree-4a335.firebasestorage.app",

  messagingSenderId: "441515792176",

  appId: "1:441515792176:web:208538e871cbfbf858daf5",

  measurementId: "G-J19B5T35M5"

};


async function migrateScenarios() {
  console.log('🚀 Iniciando migração para Firebase Firestore...\n');

  // Verificar se as credenciais foram configuradas
  if (firebaseConfig.apiKey === 'SUA_API_KEY_AQUI') {
    console.error('❌ ERRO: Configure as credenciais do Firebase primeiro!');
    console.log('Edite o arquivo scripts/migrate-to-firebase.ts ou configure variáveis de ambiente.\n');
    process.exit(1);
  }

  try {
    // Inicializar Firebase
    console.log('📡 Conectando ao Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('✅ Conectado ao Firebase!\n');

    // Migrar cada cenário
    const scenariosCollection = collection(db, 'scenarios');
    let successCount = 0;
    let errorCount = 0;

    console.log(`📦 Migrando ${scenarios.length} cenários...\n`);

    for (const scenario of scenarios) {
      try {
        const scenarioRef = doc(scenariosCollection, scenario.id);

        // Preparar dados para o Firestore
        const scenarioData = {
          id: scenario.id,
          title: scenario.title,
          rootNode: scenario.rootNode,
          // Metadados opcionais
          migratedAt: new Date().toISOString(),
          version: 1,
        };

        await setDoc(scenarioRef, scenarioData);
        console.log(`✅ Migrado: ${scenario.title} (${scenario.id})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Erro ao migrar ${scenario.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Resumo da migração:');
    console.log(`   ✅ Sucesso: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📦 Total: ${scenarios.length}\n`);

    if (errorCount === 0) {
      console.log('🎉 Migração concluída com sucesso!');
      console.log('💡 Acesse o Firebase Console para verificar os dados.\n');
    } else {
      console.log('⚠️  Migração concluída com erros. Verifique os logs acima.\n');
    }

  } catch (error) {
    console.error('❌ Erro fatal durante a migração:', error);
    process.exit(1);
  }
}

// Executar migração
migrateScenarios().catch(console.error);
