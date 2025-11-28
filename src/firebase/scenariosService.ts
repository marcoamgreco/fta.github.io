// Service para gerenciar cenários no Firestore

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
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
    await setDoc(scenarioRef, {
      id: scenario.id,
      title: scenario.title,
      rootNode: scenario.rootNode,
    }, { merge: true });

    console.log(`Cenário ${scenario.id} salvo no Firestore`);
  } catch (error) {
    console.error(`Erro ao salvar cenário ${scenario.id} no Firestore:`, error);
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
