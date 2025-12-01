// Service para gerenciar cenários no Firestore

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './config';
import type { Scenario } from '../scenarios';

const SCENARIOS_COLLECTION = 'scenarios';

// Converter documento Firestore para Scenario
const docToScenario = (doc: QueryDocumentSnapshot<DocumentData>): Scenario => {
  const data = doc.data();
  return {
    id: data.id || doc.id,
    title: data.title || '',
    rootNode: data.rootNode || null,
    tecnologia: data.tecnologia || '',
    refinaria: data.refinaria || '',
    cenario: data.cenario || '',
    isUniversal: data.isUniversal !== undefined ? data.isUniversal : true, // Por padrão, cenários existentes são universais
    parentId: data.parentId || null,
    evidenceData: data.evidenceData || {},
  } as Scenario;
};

// Buscar todos os cenários do Firestore
export const getScenariosFromFirestore = async (): Promise<Scenario[]> => {
  try {
    const scenariosRef = collection(db, SCENARIOS_COLLECTION);
    // Removido orderBy para evitar necessidade de índice
    // Os dados serão ordenados no cliente se necessário
    const querySnapshot = await getDocs(scenariosRef);

    const scenarios: Scenario[] = [];
    querySnapshot.forEach((doc) => {
      scenarios.push(docToScenario(doc));
    });

    return scenarios;
  } catch (error) {
    console.error('Erro ao buscar cenários do Firestore:', error);
    throw error;
  }
};

// Buscar um cenário específico por ID
export const getScenarioByIdFromFirestore = async (id: string): Promise<Scenario | null> => {
  try {
    const scenarioRef = doc(db, SCENARIOS_COLLECTION, id);
    const scenarioSnap = await getDoc(scenarioRef);

    if (scenarioSnap.exists()) {
      return docToScenario(scenarioSnap as QueryDocumentSnapshot<DocumentData>);
    }

    return null;
  } catch (error) {
    console.error(`Erro ao buscar cenário ${id} do Firestore:`, error);
    throw error;
  }
};

// Salvar ou atualizar um cenário no Firestore
export const saveScenarioToFirestore = async (scenario: Scenario): Promise<void> => {
  try {
    const scenarioRef = doc(db, SCENARIOS_COLLECTION, scenario.id);

    // Log para debug - verificar se rootNode tem descrições
    const checkDescriptions = (node: any, path: string = ''): string[] => {
      const descriptions: string[] = [];
      if (node.description) {
        descriptions.push(`${path}${node.id}: "${node.description}"`);
      }
      if (node.children) {
        node.children.forEach((child: any) => {
          descriptions.push(...checkDescriptions(child, `${path}${node.id}/`));
        });
      }
      return descriptions;
    };

    const descriptions = checkDescriptions(scenario.rootNode);
    console.log(`📋 Descrições no rootNode antes de salvar (${descriptions.length} nós com descrição):`, descriptions);

    // Verificar se o documento já existe
    const docSnapshot = await getDoc(scenarioRef);
    const documentExists = docSnapshot.exists();

    // Preparar todos os dados para salvar
    const allData = {
      id: scenario.id,
      title: scenario.title,
      rootNode: scenario.rootNode,
      tecnologia: scenario.tecnologia || '',
      refinaria: scenario.refinaria || '',
      cenario: scenario.cenario || '',
      isUniversal: scenario.isUniversal !== undefined ? scenario.isUniversal : true,
      parentId: scenario.parentId || null,
      evidenceData: scenario.evidenceData || {},
    };

    // Se o documento existe, usar updateDoc para garantir substituição completa do rootNode
    // Se não existe, usar setDoc para criar
    if (documentExists) {
      // Primeiro atualizar o rootNode explicitamente
      await updateDoc(scenarioRef, {
        rootNode: scenario.rootNode
      });
      // Depois atualizar os outros campos com merge
      await setDoc(scenarioRef, {
        id: scenario.id,
        title: scenario.title,
        tecnologia: scenario.tecnologia || '',
        refinaria: scenario.refinaria || '',
        cenario: scenario.cenario || '',
        isUniversal: scenario.isUniversal !== undefined ? scenario.isUniversal : true,
        parentId: scenario.parentId || null,
        evidenceData: scenario.evidenceData || {},
      }, { merge: true });
    } else {
      // Documento não existe, criar com setDoc
      await setDoc(scenarioRef, allData);
    }

    // Verificar se foi salvo corretamente
    const savedDoc = await getDoc(scenarioRef);
    if (savedDoc.exists()) {
      const savedData = savedDoc.data();
      const savedDescriptions = checkDescriptions(savedData.rootNode);
      console.log(`✅ Cenário ${scenario.id} salvo. Descrições após salvar (${savedDescriptions.length} nós):`, savedDescriptions);
    }

    console.log(`✅ Cenário ${scenario.id} salvo no Firestore com rootNode completo`);
  } catch (error) {
    console.error(`❌ Erro ao salvar cenário ${scenario.id} no Firestore:`, error);
    throw error;
  }
};

// Função helper para verificar se Firebase está configurado
export const isFirebaseConfigured = (): boolean => {
  try {
    // Verifica se as credenciais padrão foram substituídas
    const config = db.app.options;
    return config.projectId !== 'SEU_PROJECT_ID' &&
      config.apiKey !== 'SUA_API_KEY_AQUI';
  } catch {
    return false;
  }
};

// Função para atualizar todos os cenários com uma tecnologia específica
// Também garante que todos os cenários tenham os campos tecnologia, refinaria e cenario
export const updateAllScenariosTechnology = async (technology: string): Promise<void> => {
  try {
    console.log(`🚀 Atualizando todos os cenários para tecnologia: ${technology}...\n`);

    const scenariosRef = collection(db, SCENARIOS_COLLECTION);
    const querySnapshot = await getDocs(scenariosRef);

    if (querySnapshot.empty) {
      console.log('⚠️ Nenhum cenário encontrado no Firebase');
      return;
    }

    console.log(`📦 Encontrados ${querySnapshot.size} cenários\n`);

    let successCount = 0;
    let errorCount = 0;
    let missingFieldsCount = 0;
    const errors: Array<{ id: string; error: any }> = [];

    // Processar cada cenário individualmente com tratamento de erro robusto
    for (const docSnapshot of querySnapshot.docs) {
      try {
        const scenarioRef = doc(db, SCENARIOS_COLLECTION, docSnapshot.id);
        const data = docSnapshot.data();

        // Verificar quais campos estão faltando
        const hasTecnologia = data.hasOwnProperty('tecnologia');
        const hasRefinaria = data.hasOwnProperty('refinaria');
        const hasCenario = data.hasOwnProperty('cenario');

        if (!hasTecnologia || !hasRefinaria || !hasCenario) {
          missingFieldsCount++;
          console.log(`⚠️ Campos faltando em ${data.title || docSnapshot.id}:`, {
            tecnologia: hasTecnologia ? '✓' : '✗',
            refinaria: hasRefinaria ? '✓' : '✗',
            cenario: hasCenario ? '✓' : '✗',
          });
        }

        // Preparar dados para atualização - garantir que todos os campos existam
        const updateData: any = {
          tecnologia: technology,
        };

        // Se o campo não existir, criar com valor vazio
        if (!hasRefinaria) {
          updateData.refinaria = '';
        }
        if (!hasCenario) {
          updateData.cenario = '';
        }

        // Usar setDoc com merge para garantir que os campos sejam criados/atualizados
        await setDoc(scenarioRef, updateData, { merge: true });

        // Verificar se foi atualizado corretamente
        const updatedDoc = await getDoc(scenarioRef);
        const updatedData = updatedDoc.data();

        if (updatedData?.tecnologia === technology) {
          const status = [];
          if (!hasTecnologia) status.push('tecnologia criado');
          if (!hasRefinaria) status.push('refinaria criado');
          if (!hasCenario) status.push('cenario criado');

          const statusMsg = status.length > 0 ? ` (${status.join(', ')})` : '';
          console.log(`✅ Atualizado: ${data.title || docSnapshot.id} (${docSnapshot.id})${statusMsg}`);
          successCount++;
        } else {
          console.warn(`⚠️ Campo não atualizado corretamente: ${docSnapshot.id}`);
          // Tentar novamente com updateDoc
          await updateDoc(scenarioRef, updateData);
          console.log(`✅ Atualizado (2ª tentativa): ${data.title || docSnapshot.id} (${docSnapshot.id})`);
          successCount++;
        }
      } catch (error: any) {
        console.error(`❌ Erro ao atualizar ${docSnapshot.id}:`, error);
        errors.push({ id: docSnapshot.id, error });
        errorCount++;

        // Tentar uma segunda vez com setDoc
        try {
          const scenarioRef = doc(db, SCENARIOS_COLLECTION, docSnapshot.id);
          await setDoc(scenarioRef, {
            tecnologia: technology,
            refinaria: '',
            cenario: '',
          }, { merge: true });
          console.log(`✅ Atualizado (retry): ${docSnapshot.id}`);
          successCount++;
          errorCount--;
        } catch (retryError) {
          console.error(`❌ Erro no retry para ${docSnapshot.id}:`, retryError);
        }
      }
    }

    console.log('\n📊 Resumo da atualização:');
    console.log(`   ✅ Sucesso: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📦 Total: ${querySnapshot.size}`);
    console.log(`   🔧 Campos criados em: ${missingFieldsCount} cenário(s)`);

    if (errors.length > 0) {
      console.log('\n❌ Cenários com erro:');
      errors.forEach(({ id, error }) => {
        console.log(`   - ${id}: ${error.message || error}`);
      });
    }

    if (errorCount === 0) {
      console.log('\n🎉 Todos os cenários foram atualizados com sucesso!');
      console.log('   Todos os campos (tecnologia, refinaria, cenario) foram garantidos.');
    } else {
      console.log(`\n⚠️ ${errorCount} cenário(s) não foram atualizados. Verifique os erros acima.`);
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar cenários:', error);
    throw error;
  }
};

// Criar uma cópia de uma árvore universal como nova análise
export const createAnalysisFromUniversal = async (universalScenarioId: string, newTitle: string): Promise<Scenario> => {
  try {
    // Buscar a árvore universal
    const universalScenario = await getScenarioByIdFromFirestore(universalScenarioId);

    if (!universalScenario) {
      throw new Error(`Árvore universal ${universalScenarioId} não encontrada`);
    }

    if (!universalScenario.isUniversal) {
      throw new Error(`O cenário ${universalScenarioId} não é uma árvore universal`);
    }

    // Criar deep copy do rootNode
    const copiedRootNode = JSON.parse(JSON.stringify(universalScenario.rootNode));

    // Criar novo ID para a análise
    const newId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Criar novo cenário (análise)
    const newAnalysis: Scenario = {
      id: newId,
      title: newTitle,
      rootNode: copiedRootNode,
      tecnologia: universalScenario.tecnologia || '',
      refinaria: universalScenario.refinaria || '',
      cenario: universalScenario.cenario || '',
      isUniversal: false,
      parentId: universalScenarioId,
      evidenceData: universalScenario.evidenceData ? JSON.parse(JSON.stringify(universalScenario.evidenceData)) : {},
    };

    // Salvar no Firestore
    await saveScenarioToFirestore(newAnalysis);

    console.log(`✅ Análise criada: ${newId} a partir de ${universalScenarioId}`);
    return newAnalysis;
  } catch (error) {
    console.error('❌ Erro ao criar análise a partir de árvore universal:', error);
    throw error;
  }
};
