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
  updateLocalScenario: (updatedScenario: Scenario) => void;
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
            // Ordenar cenários alfabeticamente por título
            const sortedScenarios = [...firebaseScenarios].sort((a, b) =>
              a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' })
            );
            setScenariosList(sortedScenarios);
            setSource('firebase');
            setLoading(false);
            console.log(`✅ Carregados ${sortedScenarios.length} cenários do Firebase (ordenados alfabeticamente)`);
            return;
          }
        } catch (firebaseError) {
          console.warn('⚠️ Erro ao carregar do Firebase, usando fallback local:', firebaseError);
        }
      }

      // Fallback para dados locais - também ordenar alfabeticamente
      const sortedLocalScenarios = [...scenarios].sort((a, b) =>
        a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' })
      );
      setScenariosList(sortedLocalScenarios);
      setSource('local');
      console.log(`✅ Carregados ${sortedLocalScenarios.length} cenários do arquivo local (ordenados alfabeticamente)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      // Em caso de erro, usar dados locais como último recurso - também ordenar
      const sortedLocalScenarios = [...scenarios].sort((a, b) =>
        a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' })
      );
      setScenariosList(sortedLocalScenarios);
      setSource('local');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, []);

  const updateLocalScenario = (updatedScenario: Scenario) => {
    setScenariosList(prev =>
      prev.map(s => s.id === updatedScenario.id ? updatedScenario : s)
    );
  };

  return { scenariosList, loading, error, source, refreshScenarios: loadScenarios, updateLocalScenario };
};
