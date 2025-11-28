// Hook customizado para gerenciar cenários (Firebase ou fallback local)

import { useState, useEffect } from 'react';
import { scenarios } from '../scenarios';
import type { Scenario } from '../scenarios';
import {
  getScenariosFromFirestore,
  isFirebaseConfigured
} from '../firebase/scenariosService';

type UseScenariosReturn = {
  scenariosList: Scenario[];
  loading: boolean;
  error: string | null;
  source: 'firebase' | 'local';
  refreshScenarios: () => Promise<void>;
};

export const useScenarios = (): UseScenariosReturn => {
  const [scenariosList, setScenariosList] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'firebase' | 'local'>('local');

  const loadScenarios = async () => {
    setLoading(true);
    setError(null);

    try {
      // Tentar carregar do Firebase se estiver configurado
      if (isFirebaseConfigured()) {
        try {
          const firebaseScenarios = await getScenariosFromFirestore();
          if (firebaseScenarios && firebaseScenarios.length > 0) {
            setScenariosList(firebaseScenarios);
            setSource('firebase');
            setLoading(false);
            console.log(`✅ Carregados ${firebaseScenarios.length} cenários do Firebase`);
            return;
          }
        } catch (firebaseError) {
          console.warn('⚠️ Erro ao carregar do Firebase, usando fallback local:', firebaseError);
        }
      }

      // Fallback para dados locais
      setScenariosList(scenarios);
      setSource('local');
      console.log(`✅ Carregados ${scenarios.length} cenários do arquivo local`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      // Em caso de erro, usar dados locais como último recurso
      setScenariosList(scenarios);
      setSource('local');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, []);

  return { scenariosList, loading, error, source, refreshScenarios: loadScenarios };
};
