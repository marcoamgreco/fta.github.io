import React, { useState, useCallback, useEffect, useRef } from "react";
import type { TreeNode, FTANodeType, Scenario } from "./scenarios";
import FTADiagram from "./FTADiagram";
import { useScenarios } from "./hooks/useScenarios";
import { saveScenarioToFirestore, isFirebaseConfigured, updateAllScenariosTechnology, createAnalysisFromUniversal } from "./firebase/scenariosService";
import iconImage from "./assets/icon.png";

type Evidence = {
  id: string;
  text: string;
  checked: boolean;
};

type NodeEvidence = {
  nodeId: string;
  evidences: Evidence[];
  counterEvidences: Evidence[];
};

// Toast Component
const Toast = ({ message, type }: { message: string; type: 'success' | 'error' | 'info' }) => {
  const bgColors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
  };
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: bgColors[type],
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        animation: 'slideIn 0.3s ease-out',
        fontSize: '14px',
        fontWeight: 500,
      }}
    >
      <span>{type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      {message}
    </div>
  );
};

const App: React.FC = () => {
  // Hook para carregar cenários (Firebase ou fallback local)
  const { scenariosList, loading: scenariosLoading, refreshScenarios, updateLocalScenario } = useScenarios();

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("");
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState<boolean>(false);
  const [evidenceData, setEvidenceData] = useState<Map<string, NodeEvidence>>(new Map());
  const [sidebarWidth, setSidebarWidth] = useState<number>(300);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(300);
  const [isRightResizing, setIsRightResizing] = useState<boolean>(false);
  const [isNewScenarioModalOpen, setIsNewScenarioModalOpen] = useState<boolean>(false);
  const [newScenarioTitle, setNewScenarioTitle] = useState<string>("");
  const [newScenarioId, setNewScenarioId] = useState<string>("");
  const [newScenarioTecnologia, setNewScenarioTecnologia] = useState<string>("");
  const [newScenarioRefinaria, setNewScenarioRefinaria] = useState<string>("");
  const [newScenarioCenario, setNewScenarioCenario] = useState<string>("");
  const [isCreatingScenario, setIsCreatingScenario] = useState<boolean>(false);
  const [isCreatingAnalysis, setIsCreatingAnalysis] = useState<boolean>(false);
  const [editingAnalysisTitle, setEditingAnalysisTitle] = useState<{ id: string; title: string } | null>(null);
  const [expandedTrees, setExpandedTrees] = useState<Set<string>>(new Set()); // IDs das árvores com filhos expandidos
  const saveEvidenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Feedback States
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Inicializar selectedScenarioId quando cenários carregarem
  useEffect(() => {
    if (!scenariosLoading && scenariosList.length > 0 && !selectedScenarioId) {
      setSelectedScenarioId(scenariosList[0].id);
    }
  }, [scenariosLoading, scenariosList, selectedScenarioId]);

  // Load initial tree data when scenario changes
  useEffect(() => {
    if (selectedScenarioId && scenariosList.length > 0) {
      const scenario = scenariosList.find((s) => s.id === selectedScenarioId);
      if (scenario) {
        // Deep copy to avoid mutating the original mock data directly during this session
        setTreeData(JSON.parse(JSON.stringify(scenario.rootNode)));
        setSelectedNodeId(null);

        // Carregar evidências do Firebase se existirem
        if (scenario.evidenceData && Object.keys(scenario.evidenceData).length > 0) {
          const evidenceMap = new Map<string, NodeEvidence>();
          Object.entries(scenario.evidenceData).forEach(([nodeId, evidence]) => {
            evidenceMap.set(nodeId, evidence);
          });
          setEvidenceData(evidenceMap);
        } else {
          setEvidenceData(new Map());
        }

        // Se for uma análise (não universal), expandir a árvore pai automaticamente
        if (scenario.parentId) {
          setExpandedTrees(prev => new Set(prev).add(scenario.parentId!));
        }
      }
    }
  }, [selectedScenarioId, scenariosList]);

  // Função helper para salvar o cenário atual no Firebase
  const saveCurrentScenario = useCallback(async (updatedTreeData: TreeNode) => {
    if (!isFirebaseConfigured()) {
      console.warn('⚠️ Firebase não está configurado');
      return;
    }

    if (!selectedScenarioId) {
      console.warn('⚠️ Nenhum cenário selecionado');
      return;
    }

    setIsSaving(true);
    setToast({ message: 'Salvando...', type: 'info' });

    try {
      const currentScenario = scenariosList.find(s => s.id === selectedScenarioId);
      if (!currentScenario) {
        console.error('❌ Cenário não encontrado:', selectedScenarioId);
        setIsSaving(false);
        return;
      }

      // Converter Map de evidências para objeto serializável
      const evidenceDataObj: Record<string, NodeEvidence> = {};
      evidenceData.forEach((value, key) => {
        evidenceDataObj[key] = value;
      });

      const updatedScenario: Scenario = {
        ...currentScenario,
        rootNode: updatedTreeData,
        evidenceData: evidenceDataObj
      };

      console.log('💾 Salvando cenário:', {
        id: updatedScenario.id,
        title: updatedScenario.title,
        rootNodeId: updatedTreeData.id,
        rootNodeDescription: updatedTreeData.description,
        hasChildren: !!updatedTreeData.children,
      });

      await saveScenarioToFirestore(updatedScenario);

      // Update local state to ensure persistence on navigation
      updateLocalScenario(updatedScenario);

      console.log('✅ Cenário salvo no Firebase com sucesso');
      setToast({ message: 'Salvo com sucesso!', type: 'success' });
    } catch (error) {
      console.error('❌ Erro ao salvar cenário no Firebase:', error);
      setToast({ message: 'Erro ao salvar!', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [scenariosList, selectedScenarioId, updateLocalScenario]);

  // Função global para atualizar todos os cenários (disponível no console)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).updateAllScenariosToFCC = async () => {
        if (!isFirebaseConfigured()) {
          console.error('❌ Firebase não está configurado');
          alert('Firebase não está configurado');
          return;
        }

        const confirmed = confirm('Deseja atualizar TODOS os cenários do Firebase para tecnologia "FCC"?\n\nEsta ação não pode ser desfeita facilmente.');
        if (!confirmed) {
          console.log('Operação cancelada');
          return;
        }

        try {
          console.log('🚀 Iniciando atualização...');
          await updateAllScenariosTechnology('FCC');
          alert('✅ Todos os cenários foram atualizados para FCC!\n\nRecarregue a página para ver as mudanças.');
          await refreshScenarios();
        } catch (error) {
          console.error('❌ Erro:', error);
          alert('❌ Erro ao atualizar cenários. Verifique o console.');
        }
      };

      console.log('💡 Para atualizar todos os cenários para FCC, execute no console: updateAllScenariosToFCC()');
    }
  }, [refreshScenarios]);

  const handleNodeClick = useCallback(async (nodeId: string) => {
    // Check if it's a gate node
    if (nodeId.endsWith('-gate')) {
      const realNodeId = nodeId.replace('-gate', '');

      if (!treeData) return;
      const newTree = JSON.parse(JSON.stringify(treeData));

      const toggleGate = (node: TreeNode): boolean => {
        if (node.id === realNodeId) {
          node.gateType = node.gateType === 'AND' ? 'OR' : 'AND';
          return true;
        }
        if (node.children) {
          for (const child of node.children) {
            if (toggleGate(child)) return true;
          }
        }
        return false;
      };

      if (toggleGate(newTree)) {
        setTreeData(newTree);
        await saveCurrentScenario(newTree);
      }
      return;
    }

    setSelectedNodeId(nodeId);

    // Generate evidence data if it doesn't exist for this node
    if (!evidenceData.has(nodeId)) {
      const newEvidence: NodeEvidence = {
        nodeId,
        evidences: [
          { id: `${nodeId}-ev1`, text: "Dados históricos confirmam ocorrência", checked: false },
          { id: `${nodeId}-ev2`, text: "Inspeção visual identificou problema", checked: false },
          { id: `${nodeId}-ev3`, text: "Medições técnicas fora do padrão", checked: false },
        ],
        counterEvidences: [
          { id: `${nodeId}-cev1`, text: "Manutenção preventiva em dia", checked: false },
          { id: `${nodeId}-cev2`, text: "Testes recentes dentro da normalidade", checked: false },
          { id: `${nodeId}-cev3`, text: "Sem histórico de falhas similares", checked: false },
        ],
      };
      setEvidenceData(new Map(evidenceData.set(nodeId, newEvidence)));
    }
  }, [evidenceData, treeData, saveCurrentScenario]);

  const handleNodeDoubleClick = useCallback(() => {
    // Double click now does nothing - editing is done via toolbar button
  }, []);

  // Função helper para salvar evidências no Firebase
  const saveEvidenceData = useCallback(async () => {
    if (!isFirebaseConfigured() || !selectedScenarioId || !treeData) {
      return;
    }

    try {
      const currentScenario = scenariosList.find(s => s.id === selectedScenarioId);
      if (!currentScenario) return;

      const evidenceDataObj: Record<string, NodeEvidence> = {};
      evidenceData.forEach((value, key) => {
        evidenceDataObj[key] = value;
      });

      const updatedScenario: Scenario = {
        ...currentScenario,
        rootNode: treeData,
        evidenceData: evidenceDataObj
      };

      await saveScenarioToFirestore(updatedScenario);
      await updateLocalScenario(updatedScenario);
    } catch (error) {
      console.error('Erro ao salvar evidências:', error);
    }
  }, [evidenceData, selectedScenarioId, treeData, scenariosList, updateLocalScenario]);

  // Função helper para salvar evidências com debounce
  const debouncedSaveEvidence = useCallback(() => {
    if (saveEvidenceTimeoutRef.current) {
      clearTimeout(saveEvidenceTimeoutRef.current);
    }
    saveEvidenceTimeoutRef.current = setTimeout(() => {
      saveEvidenceData();
    }, 1000); // 1 segundo de debounce
  }, [saveEvidenceData]);

  const toggleEvidence = async (nodeId: string, evidenceId: string, isCounterEvidence: boolean) => {
    const nodeEv = evidenceData.get(nodeId);
    if (!nodeEv) return;

    const updated: NodeEvidence = {
      ...nodeEv,
      evidences: nodeEv.evidences.map(e =>
        !isCounterEvidence && e.id === evidenceId ? { ...e, checked: !e.checked } : e
      ),
      counterEvidences: nodeEv.counterEvidences.map(e =>
        isCounterEvidence && e.id === evidenceId ? { ...e, checked: !e.checked } : e
      ),
    };

    setEvidenceData(new Map(evidenceData.set(nodeId, updated)));
    // Salvar no Firebase com debounce
    debouncedSaveEvidence();
  };

  const getNodeStatus = (nodeId: string): 'complete' | 'partial' | 'none' => {
    const nodeEv = evidenceData.get(nodeId);
    if (!nodeEv) return 'none';

    const allEvidencesChecked = nodeEv.evidences.every(e => e.checked);
    return allEvidencesChecked ? 'complete' : 'partial';
  };

  // --- Edit Logic ---

  const findNode = (root: TreeNode, id: string): TreeNode | null => {
    if (root.id === id) return root;
    if (root.children) {
      for (const child of root.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleEditLabel = async (nodeId: string, newLabel: string) => {
    if (!treeData) return;

    const newTree = JSON.parse(JSON.stringify(treeData));

    const updateNodeLabel = (node: TreeNode): boolean => {
      if (node.id === nodeId) {
        node.label = newLabel;
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (updateNodeLabel(child)) return true;
        }
      }
      return false;
    };

    updateNodeLabel(newTree);
    setTreeData(newTree);
    await saveCurrentScenario(newTree);
  };

  const handleEditNodeDescription = useCallback(async (nodeId: string, description: string) => {
    if (!treeData) {
      console.error('❌ treeData não está disponível');
      return;
    }

    console.log('📝 Salvando descrição:', { nodeId, description, treeDataExists: !!treeData });

    // Usar o treeData atual (já atualizado no onChange)
    const newTree = JSON.parse(JSON.stringify(treeData));

    const updateNodeDescription = (node: TreeNode): boolean => {
      if (node.id === nodeId) {
        node.description = description;
        console.log('✅ Nó atualizado:', { nodeId, description: node.description });
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (updateNodeDescription(child)) return true;
        }
      }
      return false;
    };

    const found = updateNodeDescription(newTree);
    if (!found) {
      console.error('❌ Nó não encontrado na árvore:', nodeId);
      return;
    }

    setTreeData(newTree);

    // Garantir que salvamos o cenário completo com a descrição atualizada
    try {
      await saveCurrentScenario(newTree);
      console.log('✅ Descrição salva no Firebase:', { nodeId, description });
    } catch (error) {
      console.error('❌ Erro ao salvar descrição:', error);
    }
  }, [treeData, saveCurrentScenario]);

  const handleAddNode = async (parentId: string, type: FTANodeType) => {
    if (!treeData) return;

    console.log('➕ Adicionando nó...', { parentId, type });

    const newTree = JSON.parse(JSON.stringify(treeData));
    const parent = findNode(newTree, parentId);

    if (parent) {
      if (!parent.children) parent.children = [];
      const newNode: TreeNode = {
        id: `node-${Date.now()}`,
        label: type === "event" ? "Novo Evento" : type === "terminator" ? "" : "Nova Causa",
        type,
        children: type === "terminator" ? undefined : [],
      };
      parent.children.push(newNode);

      console.log('✅ Nó adicionado à árvore local, atualizando state...');
      setTreeData(newTree);

      await saveCurrentScenario(newTree);
    } else {
      console.error('❌ Pai não encontrado para adicionar nó:', parentId);
    }
  };

  const handleRemoveNode = async (nodeId: string) => {
    if (!treeData) return;

    console.log('🗑️ Removendo nó...', { nodeId });

    // Cannot remove root
    if (treeData.id === nodeId) {
      alert("Não é possível remover o nó raiz.");
      return;
    }

    const newTree = JSON.parse(JSON.stringify(treeData));

    const removeNode = (node: TreeNode, id: string): boolean => {
      if (!node.children) return false;

      const index = node.children.findIndex(c => c.id === id);
      if (index !== -1) {
        node.children.splice(index, 1);
        return true;
      }

      for (const child of node.children) {
        if (removeNode(child, id)) return true;
      }
      return false;
    };

    if (removeNode(newTree, nodeId)) {
      console.log('✅ Nó removido da árvore local, atualizando state...');
      setTreeData(newTree);
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      await saveCurrentScenario(newTree);
    } else {
      console.error('❌ Nó não encontrado para remover:', nodeId);
    }
  };

  // Função para criar novo cenário
  const handleCreateNewScenario = async () => {
    if (!newScenarioTitle.trim() || !newScenarioId.trim()) {
      alert("Por favor, preencha o título e o ID do cenário.");
      return;
    }

    // Verificar se o ID já existe
    if (scenariosList.some(s => s.id === newScenarioId)) {
      alert("Já existe um cenário com este ID. Por favor, escolha outro.");
      return;
    }

    setIsCreatingScenario(true);

    try {
      // Criar nó raiz inicial com o nome do cenário
      const rootNode: TreeNode = {
        id: `root-${newScenarioId}`,
        label: newScenarioTitle.trim(),
        type: "event",
        gateType: "OR",
        description: "",
        children: []
      };

      const newScenario: Scenario = {
        id: newScenarioId,
        title: newScenarioTitle.trim(),
        rootNode: rootNode,
        tecnologia: newScenarioTecnologia.trim(),
        refinaria: newScenarioRefinaria.trim(),
        cenario: newScenarioCenario.trim(),
        isUniversal: true, // Novos cenários são universais por padrão
        parentId: null,
        evidenceData: {},
      };

      // Salvar no Firebase se estiver configurado
      if (isFirebaseConfigured()) {
        await saveScenarioToFirestore(newScenario);
        // Recarregar lista de cenários
        await refreshScenarios();
      } else {
        alert("⚠️ Firebase não está configurado. O cenário não foi salvo.");
        setIsCreatingScenario(false);
        setIsNewScenarioModalOpen(false);
        return;
      }

      // Selecionar o novo cenário
      setSelectedScenarioId(newScenarioId);
      setTreeData(rootNode);

      // Limpar formulário e fechar modal
      setNewScenarioTitle("");
      setNewScenarioId("");
      setNewScenarioTecnologia("");
      setNewScenarioRefinaria("");
      setNewScenarioCenario("");
      setIsNewScenarioModalOpen(false);

      alert("✅ Cenário criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar cenário:", error);
      alert("❌ Erro ao criar cenário. Verifique o console para mais detalhes.");
    } finally {
      setIsCreatingScenario(false);
    }
  };

  // Função para criar nova análise a partir de uma árvore universal
  const handleCreateAnalysis = async (universalScenarioId: string) => {
    const universalScenario = scenariosList.find(s => s.id === universalScenarioId);
    if (!universalScenario) {
      alert("Árvore universal não encontrada.");
      return;
    }

    if (!universalScenario.isUniversal) {
      alert("Este cenário não é uma árvore universal.");
      return;
    }

    setIsCreatingAnalysis(true);
    try {
      const defaultTitle = `Cópia de ${universalScenario.title}`;
      const newAnalysis = await createAnalysisFromUniversal(universalScenarioId, defaultTitle);

      // Atualizar lista de cenários
      await refreshScenarios();

      // Selecionar a nova análise e entrar em modo de edição do nome
      setSelectedScenarioId(newAnalysis.id);
      setEditingAnalysisTitle({ id: newAnalysis.id, title: newAnalysis.title });

      setToast({ message: 'Análise criada com sucesso!', type: 'success' });
    } catch (error) {
      console.error("Erro ao criar análise:", error);
      setToast({ message: 'Erro ao criar análise. Verifique o console.', type: 'error' });
    } finally {
      setIsCreatingAnalysis(false);
    }
  };

  // Função para salvar o nome editado da análise
  const handleSaveAnalysisTitle = async (analysisId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      alert("O nome não pode estar vazio.");
      return;
    }

    try {
      const scenario = scenariosList.find(s => s.id === analysisId);
      if (!scenario) {
        alert("Análise não encontrada.");
        return;
      }

      const updatedScenario: Scenario = {
        ...scenario,
        title: newTitle.trim()
      };

      await saveScenarioToFirestore(updatedScenario);
      await refreshScenarios();
      setEditingAnalysisTitle(null);
      setToast({ message: 'Nome da análise atualizado!', type: 'success' });
    } catch (error) {
      console.error("Erro ao salvar nome da análise:", error);
      setToast({ message: 'Erro ao salvar nome.', type: 'error' });
    }
  };

  // Sidebar resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = e.clientX;
    if (newWidth >= 200 && newWidth <= 600) {
      setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Right sidebar resize handlers
  // const handleRightMouseDown = useCallback((e: React.MouseEvent) => {
  //   e.preventDefault();
  //   setIsRightResizing(true);
  // }, []);

  const handleRightMouseMove = useCallback((e: MouseEvent) => {
    if (!isRightResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= 200 && newWidth <= 600) {
      setRightSidebarWidth(newWidth);
    }
  }, [isRightResizing]);

  const handleRightMouseUp = useCallback(() => {
    setIsRightResizing(false);
  }, []);

  useEffect(() => {
    if (isRightResizing) {
      document.addEventListener('mousemove', handleRightMouseMove);
      document.addEventListener('mouseup', handleRightMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleRightMouseMove);
      document.removeEventListener('mouseup', handleRightMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleRightMouseMove);
      document.removeEventListener('mouseup', handleRightMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isRightResizing, handleRightMouseMove, handleRightMouseUp]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        fontFamily: "'Inter', sans-serif",
        color: "#1e293b",
        cursor: isSaving ? 'wait' : 'default',
      }}
    >
      {toast && <Toast message={toast.message} type={toast.type} />}
      {/* Sidebar */}
      <aside
        style={{
          width: isLeftSidebarCollapsed ? "50px" : `${sidebarWidth}px`,
          background: "#0f172a",
          color: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #334155",
          position: "relative",
          flexShrink: 0,
          transition: isResizing ? "none" : "width 0.3s ease",
        }}
      >
        {/* Collapse/Expand Button */}
        <button
          onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
          style={{
            position: "absolute",
            top: "10px",
            right: isLeftSidebarCollapsed ? "50%" : "10px",
            transform: isLeftSidebarCollapsed ? "translateX(50%)" : "none",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
          title={isLeftSidebarCollapsed ? "Expandir" : "Colapsar"}
        >
          {isLeftSidebarCollapsed ? "▶" : "◀"}
        </button>

        {!isLeftSidebarCollapsed ? (
          <>
            <div
              style={{
                padding: "16px",
                borderBottom: "1px solid #334155",
              }}
            >

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <img
                  src={iconImage}
                  alt="FTA Studio"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "32px"
                  }}
                />
                <h1
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    margin: 0,
                    color: "#f8fafc",
                  }}
                >
                  FTA Studio
                </h1>
              </div>
            </div>

            <nav style={{ flex: 1, overflowY: "auto", padding: "16px" }}>


              {scenariosLoading ? (
                <div style={{
                  padding: "24px 12px",
                  color: "#64748b",
                  fontSize: "12px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    border: "3px solid rgba(59, 130, 246, 0.2)",
                    borderTop: "3px solid #3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }} />
                  <span>Carregando árvores...</span>
                </div>
              ) : scenariosList.length === 0 ? (
                <div style={{
                  padding: "24px 12px",
                  color: "#94a3b8",
                  fontSize: "12px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  <div style={{ fontSize: "32px", opacity: 0.5 }}>🌳</div>
                  <div style={{ fontWeight: 600, color: "#64748b" }}>Nenhuma árvore disponível</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Crie uma nova árvore para começar</div>
                </div>
              ) : (() => {
                // Separar árvores universais e análises
                const universalTrees = scenariosList.filter(s => s.isUniversal !== false);
                const analyses = scenariosList.filter(s => s.isUniversal === false);

                // Criar mapa de análises por parentId
                const analysesByParent = analyses.reduce((acc, analysis) => {
                  const parentId = analysis.parentId || 'orphan';
                  if (!acc[parentId]) {
                    acc[parentId] = [];
                  }
                  acc[parentId].push(analysis);
                  return acc;
                }, {} as Record<string, typeof analyses>);

                // Agrupar árvores universais por tecnologia
                const groupedByTech = universalTrees.reduce((acc, scenario) => {
                  const tech = scenario.tecnologia?.trim() || "Sem Tecnologia";
                  if (!acc[tech]) {
                    acc[tech] = [];
                  }
                  acc[tech].push(scenario);
                  return acc;
                }, {} as Record<string, typeof universalTrees>);

                // Ordenar tecnologias alfabeticamente
                const sortedTechs = Object.keys(groupedByTech).sort((a, b) => {
                  if (a === "Sem Tecnologia") return 1;
                  if (b === "Sem Tecnologia") return -1;
                  return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
                });

                return (
                  <div>
                    {sortedTechs.map((tech) => (
                      <div key={tech} style={{ marginBottom: "28px" }}>
                        <div
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            color: "#94a3b8",
                            marginBottom: "14px",
                            paddingLeft: "12px",
                            letterSpacing: "0.1em",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            position: "relative",
                          }}
                        >
                          <div style={{
                            position: "absolute",
                            left: 0,
                            width: "3px",
                            height: "16px",
                            background: "linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%)",
                            borderRadius: "2px",
                          }} />
                          <span style={{ fontSize: "14px" }}>🌿</span>
                          {tech}
                        </div>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {groupedByTech[tech].map((scenario) => {
                            const isActive = scenario.id === selectedScenarioId;
                            const scenarioAnalyses = analysesByParent[scenario.id] || [];
                            // const isEditing = editingAnalysisTitle?.id === scenario.id;
                            const isExpanded = expandedTrees.has(scenario.id);
                            const hasChildren = scenarioAnalyses.length > 0;

                            return (
                              <li key={scenario.id} style={{ marginBottom: "8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  {/* Botão de expandir/colapsar */}
                                  {hasChildren && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedTrees(prev => {
                                          const newSet = new Set(prev);
                                          if (newSet.has(scenario.id)) {
                                            newSet.delete(scenario.id);
                                          } else {
                                            newSet.add(scenario.id);
                                          }
                                          return newSet;
                                        });
                                      }}
                                      style={{
                                        padding: "6px",
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "#64748b",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: "4px",
                                        transition: "all 0.2s",
                                        minWidth: "24px",
                                        height: "24px",
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "rgba(59, 130, 246, 0.15)";
                                        e.currentTarget.style.color = "#60a5fa";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.color = "#64748b";
                                      }}
                                      title={isExpanded ? "Colapsar análises" : "Expandir análises"}
                                    >
                                      <span style={{
                                        fontSize: "12px",
                                        transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s",
                                        display: "block",
                                      }}>▶</span>
                                    </button>
                                  )}
                                  {!hasChildren && <div style={{ width: "24px" }} />}
                                  <button
                                    onClick={() => setSelectedScenarioId(scenario.id)}
                                    onMouseEnter={(e) => {
                                      if (!isActive) {
                                        e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                                        e.currentTarget.style.transform = "translateX(2px)";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isActive) {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.transform = "translateX(0)";
                                      }
                                    }}
                                    style={{
                                      flex: 1,
                                      textAlign: "left",
                                      padding: "14px 16px",
                                      background: isActive
                                        ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)"
                                        : "transparent",
                                      color: isActive ? "#60a5fa" : "#e2e8f0",
                                      border: isActive
                                        ? "1px solid rgba(59, 130, 246, 0.3)"
                                        : "1px solid transparent",
                                      borderRadius: "10px",
                                      cursor: "pointer",
                                      fontSize: "11px",
                                      fontWeight: isActive ? 600 : 500,
                                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "12px",
                                      position: "relative",
                                      boxShadow: isActive
                                        ? "0 2px 8px rgba(59, 130, 246, 0.15)"
                                        : "none",
                                    }}
                                  >
                                    <div style={{
                                      width: "8px",
                                      height: "8px",
                                      borderRadius: "50%",
                                      background: isActive
                                        ? "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)"
                                        : "rgba(203, 213, 225, 0.4)",
                                      boxShadow: isActive
                                        ? "0 0 10px rgba(59, 130, 246, 0.6)"
                                        : "none",
                                      transition: "all 0.2s",
                                    }} />
                                    <span style={{
                                      flex: 1,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      fontSize: "11px",
                                    }}>
                                      {scenario.title}
                                    </span>
                                    {scenarioAnalyses.length > 0 && (
                                      <span style={{
                                        fontSize: "10px",
                                        padding: "3px 8px",
                                        background: isActive
                                          ? "rgba(59, 130, 246, 0.25)"
                                          : "rgba(148, 163, 184, 0.2)",
                                        color: isActive ? "#60a5fa" : "#94a3b8",
                                        borderRadius: "12px",
                                        fontWeight: 700,
                                        minWidth: "22px",
                                        textAlign: "center",
                                      }}>
                                        {scenarioAnalyses.length}
                                      </span>
                                    )}
                                  </button>
                                </div>
                                {/* Lista de análises filhas */}
                                {scenarioAnalyses.length > 0 && isExpanded && (
                                  <ul style={{
                                    listStyle: "none",
                                    padding: 0,
                                    margin: "10px 0 0 28px",
                                    paddingLeft: "16px",
                                    position: "relative",
                                  }}>
                                    <div style={{
                                      position: "absolute",
                                      left: 0,
                                      top: 0,
                                      bottom: 0,
                                      width: "2px",
                                      background: "linear-gradient(180deg, rgba(59, 130, 246, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)",
                                      borderRadius: "1px",
                                    }} />
                                    {scenarioAnalyses.map((analysis) => {
                                      const isAnalysisActive = analysis.id === selectedScenarioId;
                                      const isAnalysisEditing = editingAnalysisTitle?.id === analysis.id;

                                      return (
                                        <li key={analysis.id} style={{ marginBottom: "6px" }}>
                                          {isAnalysisEditing ? (
                                            <div style={{ display: "flex", gap: "8px", padding: "4px" }}>
                                              <input
                                                type="text"
                                                value={editingAnalysisTitle.title}
                                                onChange={(e) => setEditingAnalysisTitle({ id: analysis.id, title: e.target.value })}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    handleSaveAnalysisTitle(analysis.id, editingAnalysisTitle.title);
                                                  } else if (e.key === 'Escape') {
                                                    setEditingAnalysisTitle(null);
                                                  }
                                                }}
                                                autoFocus
                                                style={{
                                                  flex: 1,
                                                  padding: "10px 12px",
                                                  background: "#0f172a",
                                                  color: "#f8fafc",
                                                  border: "1px solid #475569",
                                                  borderRadius: "8px",
                                                  fontSize: "13px",
                                                  outline: "none",
                                                }}
                                              />
                                              <button
                                                onClick={() => handleSaveAnalysisTitle(analysis.id, editingAnalysisTitle.title)}
                                                style={{
                                                  padding: "10px 12px",
                                                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                                  color: "#ffffff",
                                                  border: "none",
                                                  borderRadius: "8px",
                                                  cursor: "pointer",
                                                  fontSize: "13px",
                                                  fontWeight: 600,
                                                  boxShadow: "0 2px 4px rgba(16, 185, 129, 0.3)",
                                                }}
                                              >
                                                ✓
                                              </button>
                                              <button
                                                onClick={() => setEditingAnalysisTitle(null)}
                                                style={{
                                                  padding: "10px 12px",
                                                  background: "#475569",
                                                  color: "#ffffff",
                                                  border: "none",
                                                  borderRadius: "8px",
                                                  cursor: "pointer",
                                                  fontSize: "13px",
                                                  fontWeight: 600,
                                                }}
                                              >
                                                ✕
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => setSelectedScenarioId(analysis.id)}
                                              onDoubleClick={() => setEditingAnalysisTitle({ id: analysis.id, title: analysis.title })}
                                              onMouseEnter={(e) => {
                                                if (!isAnalysisActive) {
                                                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                                                  e.currentTarget.style.transform = "translateX(2px)";
                                                }
                                              }}
                                              onMouseLeave={(e) => {
                                                if (!isAnalysisActive) {
                                                  e.currentTarget.style.background = "transparent";
                                                  e.currentTarget.style.transform = "translateX(0)";
                                                }
                                              }}
                                              style={{
                                                width: "100%",
                                                textAlign: "left",
                                                padding: "10px 14px",
                                                background: isAnalysisActive
                                                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)"
                                                  : "transparent",
                                                color: isAnalysisActive ? "#60a5fa" : "#cbd5e1",
                                                border: isAnalysisActive
                                                  ? "1px solid rgba(59, 130, 246, 0.25)"
                                                  : "1px solid transparent",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                fontSize: "10px",
                                                fontWeight: isAnalysisActive ? 600 : 500,
                                                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px",
                                                position: "relative",
                                              }}
                                            >
                                              <span style={{
                                                fontSize: "16px",
                                                color: isAnalysisActive ? "#60a5fa" : "rgba(148, 163, 184, 0.7)",
                                                lineHeight: 1,
                                              }}>⌞</span>
                                              <span style={{
                                                flex: 1,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                fontSize: "10px",
                                              }}>
                                                {analysis.title}
                                              </span>
                                            </button>
                                          )}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div style={{
                marginTop: "24px",
                paddingTop: "20px",
                borderTop: "1px solid rgba(51, 65, 85, 0.5)",
                position: "sticky",
                bottom: 0,
                background: "#0f172a",
                paddingBottom: "16px",
              }}>
                <button
                  onClick={() => setIsNewScenarioModalOpen(true)}
                  style={{
                    display: "none", // Oculto temporariamente
                    width: "100%",
                    textAlign: "center",
                    padding: "14px 16px",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 700,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                    letterSpacing: "0.02em",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.25)";
                  }}
                >
                  <span style={{
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "20px",
                    height: "20px",
                    background: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "50%",
                  }}>+</span>
                  Nova Árvore Universal
                </button>
              </div>
            </nav>



            <div
              style={{
                padding: "16px",
                borderTop: selectedScenarioId ? "1px solid #334155" : "none",
                fontSize: "12px",
                color: "#64748b",
                textAlign: "center",
              }}
            >
              v1.1.0 · Desktop Edition
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "60px" }}>
            <img
              src={iconImage}
              alt="FTA"
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                marginBottom: "20px",
                opacity: 0.7
              }}
            />
          </div>
        )}

        {/* Resize Handle */}
        {!isLeftSidebarCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "4px",
              height: "100%",
              cursor: "col-resize",
              backgroundColor: "transparent",
              transition: "background-color 0.2s",
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#475569";
            }}
            onMouseLeave={(e) => {
              if (!isResizing) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          />
        )}
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Top Header */}
        <header
          style={{
            height: "64px",
            background: "white",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            {treeData ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    color: "#ffffff",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    marginLeft: 0,
                  }}
                >
                  <span style={{ fontSize: "14px" }}>🎯</span>
                  cenário ativo
                </span>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
                  {scenariosList.find(s => s.id === selectedScenarioId)?.title || "Árvore Importada"}
                </h2>
              </div>
            ) : (
              <h2 style={{ margin: 0, fontSize: "16px", color: "#94a3b8" }}>
                Selecione um cenário
              </h2>
            )}
          </div>

          {/* Create Analysis Button */}
          {(() => {
            const currentScenario = scenariosList.find(s => s.id === selectedScenarioId);
            const isUniversal = currentScenario?.isUniversal !== false;
            const canCreateAnalysis = treeData && isUniversal && !isCreatingAnalysis;

            return (
              <button
                onClick={() => {
                  if (!selectedScenarioId || !currentScenario) {
                    alert("Nenhuma árvore universal selecionada.");
                    return;
                  }
                  if (!isUniversal) {
                    alert("Apenas árvores universais podem ser usadas para criar análises.");
                    return;
                  }
                  handleCreateAnalysis(selectedScenarioId);
                }}
                disabled={!canCreateAnalysis}
                style={{
                  padding: "8px 16px",
                  background: canCreateAnalysis
                    ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                    : "#cbd5e1",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: canCreateAnalysis ? "pointer" : "not-allowed",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                  minWidth: "140px",
                  height: "40px",
                }}
                onMouseEnter={(e) => {
                  if (canCreateAnalysis) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(59, 130, 246, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                title={canCreateAnalysis ? `Criar nova análise a partir de "${currentScenario?.title}"` : "Selecione uma árvore universal para criar análise"}
              >
                {isCreatingAnalysis ? "Criando..." : "+ Criar Análise"}
              </button>
            );
          })()}
        </header>

        {/* Diagram Area */}
        <div
          style={{
            flex: 1,
            position: "relative",
            background: "#f8fafc",
            overflow: "hidden",
          }}
        >
          {treeData ? (
            <div style={{ width: "100%", height: "100%" }}>
              <FTADiagram
                rootNode={treeData}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                onAddNode={handleAddNode}
                onEditNode={handleEditLabel}
                onDeleteNode={handleRemoveNode}
                selectedNodeId={selectedNodeId}
                getNodeStatus={getNodeStatus}
                onPaneClick={() => setSelectedNodeId(null)}
              />
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#94a3b8",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🌳</div>
              <p style={{ fontSize: "16px", fontWeight: 500 }}>
                Selecione um cenário para visualizar a árvore de falhas
              </p>
              <p style={{ fontSize: "14px" }}>
                Use o menu lateral para navegar entre os exemplos
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar - Evidence Panel */}
      <aside
        style={{
          width: isSidebarCollapsed ? "50px" : `${rightSidebarWidth}px`,
          background: "#0f172a",
          borderLeft: "1px solid #334155",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: isRightResizing ? "none" : "width 0.3s ease",
          position: "relative",
          flexShrink: 0,
          color: "#f8fafc",
        }}
      >

        {/* Collapse/Expand Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{
            position: "absolute",
            top: "10px",
            right: isSidebarCollapsed ? "50%" : "10px",
            transform: isSidebarCollapsed ? "translateX(50%)" : "none",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
          title={isSidebarCollapsed ? "Expandir" : "Colapsar"}
        >
          {isSidebarCollapsed ? "◀" : "▶"}
        </button>

        {!isSidebarCollapsed ? (
          <>
            {/* Header */}
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #334155",
                background: "#0f172a",
              }}
            >
              <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 600, color: "#f8fafc" }}>
                Análise de Evidências
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                {selectedNodeId && treeData ? findNode(treeData, selectedNodeId)?.label || "Nó selecionado" : "Nenhum nó selecionado"}
              </p>
            </div>

            {/* Evidence Lists */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {!selectedNodeId ? (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#94a3b8",
                  textAlign: "center",
                  padding: "40px 20px",
                }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
                  <p style={{ fontSize: "14px", fontWeight: 500, margin: 0 }}>
                    Selecione um nó na árvore
                  </p>
                  <p style={{ fontSize: "12px", margin: "8px 0 0 0" }}>
                    para visualizar e editar evidências
                  </p>
                </div>
              ) : evidenceData.get(selectedNodeId) ? (
                <>
                  {/* Description Section */}
                  <div style={{ marginBottom: "24px" }}>
                    <h4 style={{
                      margin: "0 0 12px 0",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#f8fafc",
                      letterSpacing: "0.05em",
                    }}>
                      📝 Descrição
                    </h4>
                    <textarea
                      value={selectedNodeId && treeData ? (findNode(treeData, selectedNodeId)?.description || '') : ''}
                      onChange={(e) => {
                        // Atualizar apenas o estado local enquanto digita
                        if (selectedNodeId && treeData) {
                          const newTree = JSON.parse(JSON.stringify(treeData));
                          const updateNodeDescription = (node: TreeNode): boolean => {
                            if (node.id === selectedNodeId) {
                              node.description = e.target.value;
                              return true;
                            }
                            if (node.children) {
                              for (const child of node.children) {
                                if (updateNodeDescription(child)) return true;
                              }
                            }
                            return false;
                          };
                          updateNodeDescription(newTree);
                          setTreeData(newTree);
                        }
                      }}
                      onBlur={(e) => {
                        // Salvar no Firebase apenas quando sair do campo
                        if (selectedNodeId) {
                          handleEditNodeDescription(selectedNodeId, e.target.value);
                        }
                        // Reset border styling
                        e.target.style.borderColor = "#334155";
                        e.target.style.boxShadow = "none";
                      }}
                      placeholder="Digite a descrição do evento..."
                      style={{
                        width: "100%",
                        height: "150px",
                        padding: "10px 12px",
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "6px",
                        color: "#f8fafc",
                        fontSize: "11px",
                        lineHeight: "1.5",
                        resize: "none",
                        fontFamily: "inherit",
                        outline: "none",
                        overflowY: "auto",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#3b82f6";
                        e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.2)";
                      }}
                    />
                  </div>

                  {/* Evidences Section */}
                  <div style={{ marginBottom: "24px" }}>
                    <h4 style={{
                      margin: "0 0 12px 0",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#f8fafc",
                      letterSpacing: "0.05em",
                    }}>
                      🔍 Evidências
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {evidenceData.get(selectedNodeId)!.evidences.map((evidence) => (
                        <label
                          key={evidence.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "10px",
                            padding: "8px 12px",
                            background: "#1e293b",
                            borderRadius: "6px",
                            border: "1px solid #334155",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#3b82f6";
                            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#334155";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={evidence.checked}
                            onChange={() => toggleEvidence(selectedNodeId, evidence.id, false)}
                            style={{
                              width: "14px",
                              height: "14px",
                              marginTop: "2px",
                              cursor: "pointer",
                              accentColor: "#10b981",
                            }}
                          />
                          <span style={{
                            fontSize: "11px",
                            lineHeight: "1.4",
                            color: evidence.checked ? "#64748b" : "#cbd5e1",
                            textDecoration: evidence.checked ? "line-through" : "none",
                            textDecorationLine: evidence.checked ? "line-through" : "none",
                            textDecorationThickness: evidence.checked ? "1px" : "0px",
                          }}>
                            {evidence.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Counter-Evidences Section */}
                  <div>
                    <h4 style={{
                      margin: "0 0 12px 0",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#f8fafc",
                      letterSpacing: "0.05em",
                    }}>
                      🛡️ Contra-Evidências
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {evidenceData.get(selectedNodeId)!.counterEvidences.map((evidence) => (
                        <label
                          key={evidence.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "10px",
                            padding: "8px 12px",
                            background: "#1e293b",
                            borderRadius: "6px",
                            border: "1px solid #334155",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#3b82f6";
                            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#334155";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={evidence.checked}
                            onChange={() => toggleEvidence(selectedNodeId, evidence.id, true)}
                            style={{
                              width: "14px",
                              height: "14px",
                              marginTop: "2px",
                              cursor: "pointer",
                              accentColor: "#10b981",
                            }}
                          />
                          <span style={{
                            fontSize: "11px",
                            lineHeight: "1.4",
                            color: evidence.checked ? "#64748b" : "#cbd5e1",
                            textDecoration: evidence.checked ? "line-through" : "none",
                            textDecorationLine: evidence.checked ? "line-through" : "none",
                            textDecorationThickness: evidence.checked ? "1px" : "0px",
                          }}>
                            {evidence.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Development Mode: Edit Evidences */}
                  {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || import.meta.env.DEV) && (
                    <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid #334155" }}>
                      <h4 style={{
                        margin: "0 0 16px 0",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#fbbf24",
                        letterSpacing: "0.05em",
                      }}>
                        🛠️ Modo Desenvolvimento - Editar Evidências
                      </h4>

                      {/* Edit Evidences */}
                      <div style={{ marginBottom: "20px" }}>
                        <h5 style={{
                          margin: "0 0 8px 0",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#f8fafc",
                        }}>
                          Evidências:
                        </h5>
                        {evidenceData.get(selectedNodeId)!.evidences.map((evidence, index) => (
                          <div key={evidence.id} style={{ marginBottom: "8px", display: "flex", gap: "8px", alignItems: "center" }}>
                            <input
                              type="text"
                              value={evidence.text}
                              onChange={(e) => {
                                const nodeEv = evidenceData.get(selectedNodeId);
                                if (!nodeEv) return;
                                const updated = {
                                  ...nodeEv,
                                  evidences: nodeEv.evidences.map((ev, i) =>
                                    i === index ? { ...ev, text: e.target.value } : ev
                                  ),
                                };
                                setEvidenceData(new Map(evidenceData.set(selectedNodeId, updated)));
                                debouncedSaveEvidence();
                              }}
                              style={{
                                flex: 1,
                                padding: "6px 8px",
                                background: "#1e293b",
                                border: "1px solid #334155",
                                borderRadius: "4px",
                                color: "#f8fafc",
                                fontSize: "11px",
                              }}
                              placeholder="Texto da evidência"
                            />
                            <button
                              onClick={() => {
                                const nodeEv = evidenceData.get(selectedNodeId);
                                if (!nodeEv) return;
                                const updated = {
                                  ...nodeEv,
                                  evidences: nodeEv.evidences.filter((_, i) => i !== index),
                                };
                                setEvidenceData(new Map(evidenceData.set(selectedNodeId, updated)));
                                debouncedSaveEvidence();
                              }}
                              style={{
                                padding: "6px 10px",
                                background: "#7f1d1d",
                                border: "1px solid #991b1b",
                                borderRadius: "4px",
                                color: "#fee2e2",
                                fontSize: "10px",
                                cursor: "pointer",
                              }}
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const nodeEv = evidenceData.get(selectedNodeId);
                            if (!nodeEv) return;
                            const newId = `${selectedNodeId}-ev${nodeEv.evidences.length + 1}`;
                            const updated = {
                              ...nodeEv,
                              evidences: [...nodeEv.evidences, { id: newId, text: "", checked: false }],
                            };
                            setEvidenceData(new Map(evidenceData.set(selectedNodeId, updated)));
                            debouncedSaveEvidence();
                          }}
                          style={{
                            marginTop: "8px",
                            padding: "6px 12px",
                            background: "#065f46",
                            border: "1px solid #047857",
                            borderRadius: "4px",
                            color: "#d1fae5",
                            fontSize: "10px",
                            cursor: "pointer",
                          }}
                        >
                          + Adicionar Evidência
                        </button>
                      </div>

                      {/* Edit Counter-Evidences */}
                      <div>
                        <h5 style={{
                          margin: "0 0 8px 0",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#f8fafc",
                        }}>
                          Contra-Evidências:
                        </h5>
                        {evidenceData.get(selectedNodeId)!.counterEvidences.map((evidence, index) => (
                          <div key={evidence.id} style={{ marginBottom: "8px", display: "flex", gap: "8px", alignItems: "center" }}>
                            <input
                              type="text"
                              value={evidence.text}
                              onChange={(e) => {
                                const nodeEv = evidenceData.get(selectedNodeId);
                                if (!nodeEv) return;
                                const updated = {
                                  ...nodeEv,
                                  counterEvidences: nodeEv.counterEvidences.map((ev, i) =>
                                    i === index ? { ...ev, text: e.target.value } : ev
                                  ),
                                };
                                setEvidenceData(new Map(evidenceData.set(selectedNodeId, updated)));
                                debouncedSaveEvidence();
                              }}
                              style={{
                                flex: 1,
                                padding: "6px 8px",
                                background: "#1e293b",
                                border: "1px solid #334155",
                                borderRadius: "4px",
                                color: "#f8fafc",
                                fontSize: "11px",
                              }}
                              placeholder="Texto da contra-evidência"
                            />
                            <button
                              onClick={() => {
                                const nodeEv = evidenceData.get(selectedNodeId);
                                if (!nodeEv) return;
                                const updated = {
                                  ...nodeEv,
                                  counterEvidences: nodeEv.counterEvidences.filter((_, i) => i !== index),
                                };
                                setEvidenceData(new Map(evidenceData.set(selectedNodeId, updated)));
                                debouncedSaveEvidence();
                              }}
                              style={{
                                padding: "6px 10px",
                                background: "#7f1d1d",
                                border: "1px solid #991b1b",
                                borderRadius: "4px",
                                color: "#fee2e2",
                                fontSize: "10px",
                                cursor: "pointer",
                              }}
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const nodeEv = evidenceData.get(selectedNodeId);
                            if (!nodeEv) return;
                            const newId = `${selectedNodeId}-cev${nodeEv.counterEvidences.length + 1}`;
                            const updated = {
                              ...nodeEv,
                              counterEvidences: [...nodeEv.counterEvidences, { id: newId, text: "", checked: false }],
                            };
                            setEvidenceData(new Map(evidenceData.set(selectedNodeId, updated)));
                            debouncedSaveEvidence();
                          }}
                          style={{
                            marginTop: "8px",
                            padding: "6px 12px",
                            background: "#065f46",
                            border: "1px solid #047857",
                            borderRadius: "4px",
                            color: "#d1fae5",
                            fontSize: "10px",
                            cursor: "pointer",
                          }}
                        >
                          + Adicionar Contra-Evidência
                        </button>
                      </div>

                      {/* Export JSON */}
                      <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #334155" }}>
                        <button
                          onClick={() => {
                            const nodeEv = evidenceData.get(selectedNodeId);
                            if (!nodeEv) return;
                            const json = JSON.stringify(nodeEv, null, 2);
                            navigator.clipboard.writeText(json);
                            alert("JSON copiado para a área de transferência!");
                          }}
                          style={{
                            width: "100%",
                            padding: "8px",
                            background: "#1e3a8a",
                            border: "1px solid #1e40af",
                            borderRadius: "4px",
                            color: "#dbeafe",
                            fontSize: "10px",
                            cursor: "pointer",
                            marginBottom: "8px",
                          }}
                        >
                          📋 Copiar JSON das Evidências
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#94a3b8",
                  textAlign: "center",
                  padding: "40px 20px",
                }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
                  <p style={{ fontSize: "14px", fontWeight: 500, margin: 0 }}>
                    Carregando evidências...
                  </p>
                </div>
              )}
            </div>

            {/* Status Footer */}
            {selectedNodeId && (
              <div
                style={{
                  padding: "16px 20px",
                  borderTop: "1px solid #334155",
                  background: "#0f172a",
                }}
              >
                {(() => {
                  const status = getNodeStatus(selectedNodeId);
                  return (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px",
                      borderRadius: "8px",
                      background: status === 'complete' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      border: `1px solid ${status === 'complete' ? '#10b981' : '#f59e0b'}`,
                    }}>
                      <div style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: status === 'complete' ? '#10b981' : '#f59e0b',
                      }} />
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#f8fafc" }}>
                        {status === 'complete' ? 'Confirmado' : 'Pendente'}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        ) : null}
      </aside>

      {/* Modal de Novo Cenário */}
      {isNewScenarioModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={() => !isCreatingScenario && setIsNewScenarioModalOpen(false)}
        >
          <div
            style={{
              background: "#1e293b",
              borderRadius: "12px",
              padding: "24px",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                margin: "0 0 20px 0",
                fontSize: "18px",
                fontWeight: 600,
                color: "#f8fafc",
              }}
            >
              Criar Novo Cenário
            </h2>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#cbd5e1",
                }}
              >
                Título do Cenário *
              </label>
              <input
                type="text"
                value={newScenarioTitle}
                onChange={(e) => setNewScenarioTitle(e.target.value)}
                placeholder="Ex: Falha no Sistema de Refrigeração"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "6px",
                  color: "#f8fafc",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
                disabled={isCreatingScenario}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#cbd5e1",
                }}
              >
                ID do Cenário *
              </label>
              <input
                type="text"
                value={newScenarioId}
                onChange={(e) => setNewScenarioId(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                placeholder="Ex: falha-refrigeracao"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "6px",
                  color: "#f8fafc",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
                disabled={isCreatingScenario}
              />
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "11px",
                  color: "#64748b",
                }}
              >
                O ID será convertido automaticamente para minúsculas e hífens
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#cbd5e1",
                }}
              >
                Tecnologia
              </label>
              <input
                type="text"
                value={newScenarioTecnologia}
                onChange={(e) => setNewScenarioTecnologia(e.target.value)}
                placeholder="Ex: FCC, UOP, etc."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "6px",
                  color: "#f8fafc",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
                disabled={isCreatingScenario}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#cbd5e1",
                }}
              >
                Refinaria
              </label>
              <input
                type="text"
                value={newScenarioRefinaria}
                onChange={(e) => setNewScenarioRefinaria(e.target.value)}
                placeholder="Ex: REPLAN, REDUC, etc."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "6px",
                  color: "#f8fafc",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
                disabled={isCreatingScenario}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#cbd5e1",
                }}
              >
                Cenário
              </label>
              <input
                type="text"
                value={newScenarioCenario}
                onChange={(e) => setNewScenarioCenario(e.target.value)}
                placeholder="Ex: Operação normal, Startup, etc."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "6px",
                  color: "#f8fafc",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
                disabled={isCreatingScenario}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setIsNewScenarioModalOpen(false);
                  setNewScenarioTitle("");
                  setNewScenarioId("");
                  setNewScenarioTecnologia("");
                  setNewScenarioRefinaria("");
                  setNewScenarioCenario("");
                }}
                disabled={isCreatingScenario}
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  color: "#cbd5e1",
                  border: "1px solid #334155",
                  borderRadius: "6px",
                  cursor: isCreatingScenario ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  opacity: isCreatingScenario ? 0.5 : 1,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewScenario}
                disabled={isCreatingScenario || !newScenarioTitle.trim() || !newScenarioId.trim()}
                style={{
                  padding: "10px 20px",
                  background: isCreatingScenario || !newScenarioTitle.trim() || !newScenarioId.trim()
                    ? "#475569"
                    : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isCreatingScenario || !newScenarioTitle.trim() || !newScenarioId.trim()
                    ? "not-allowed"
                    : "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  opacity: isCreatingScenario || !newScenarioTitle.trim() || !newScenarioId.trim() ? 0.5 : 1,
                }}
              >
                {isCreatingScenario ? "Criando..." : "Criar Cenário"}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default App;
