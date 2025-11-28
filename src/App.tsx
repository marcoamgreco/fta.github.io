import React, { useState, useCallback, useEffect } from "react";
import { scenarios } from "./scenarios";
import type { TreeNode, FTANodeType } from "./scenarios";
import FTADiagram from "./FTADiagram";

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

const App: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    scenarios[0]?.id || ""
  );
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [evidenceData, setEvidenceData] = useState<Map<string, NodeEvidence>>(new Map());
  const [sidebarWidth, setSidebarWidth] = useState<number>(280);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(350);
  const [isRightResizing, setIsRightResizing] = useState<boolean>(false);


  // Load initial tree data when scenario changes
  useEffect(() => {
    const scenario = scenarios.find((s) => s.id === selectedScenarioId);
    if (scenario) {
      // Deep copy to avoid mutating the original mock data directly during this session
      setTreeData(JSON.parse(JSON.stringify(scenario.rootNode)));
      setSelectedNodeId(null);
    }
  }, [selectedScenarioId]);


  const handleNodeClick = useCallback((nodeId: string) => {
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
  }, [evidenceData, treeData]);

  const handleNodeDoubleClick = useCallback(() => {
    // Double click now does nothing - editing is done via toolbar button
  }, []);

  const toggleEvidence = (nodeId: string, evidenceId: string, isCounterEvidence: boolean) => {
    const nodeEv = evidenceData.get(nodeId);
    if (!nodeEv) return;

    const updated = { ...nodeEv };
    const list = isCounterEvidence ? updated.counterEvidences : updated.evidences;
    const evidence = list.find(e => e.id === evidenceId);
    if (evidence) {
      evidence.checked = !evidence.checked;
    }

    setEvidenceData(new Map(evidenceData.set(nodeId, updated)));
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

  const handleEditLabel = (nodeId: string, newLabel: string) => {
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
  };

  const handleAddNode = (parentId: string, type: FTANodeType) => {
    if (!treeData) return;

    const newTree = JSON.parse(JSON.stringify(treeData));
    const parent = findNode(newTree, parentId);

    if (parent) {
      if (!parent.children) parent.children = [];
      const newNode: TreeNode = {
        id: `node-${Date.now()}`,
        label: type === "event" ? "Novo Evento" : "Nova Causa",
        type,
        children: [],
      };
      parent.children.push(newNode);
      setTreeData(newTree);
    }
  };

  const handleRemoveNode = (nodeId: string) => {
    if (!treeData) return;

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
      setTreeData(newTree);
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
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
  const handleRightMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsRightResizing(true);
  }, []);

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
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: `${sidebarWidth}px`,
          background: "#0f172a",
          color: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #334155",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid #334155",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#94a3b8",
              marginBottom: "8px",
              fontWeight: 700,
            }}
          >
            Ferramenta
          </div>
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

        <nav style={{ flex: 1, overflowY: "auto", padding: "16px" }}>


          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: "12px",
              paddingLeft: "12px",
            }}
          >
            Cenários Disponíveis
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {scenarios.map((scenario) => {
              const isActive = scenario.id === selectedScenarioId;
              return (
                <li key={scenario.id} style={{ marginBottom: "4px" }}>
                  <button
                    onClick={() => setSelectedScenarioId(scenario.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      background: isActive ? "#1e293b" : "transparent",
                      color: isActive ? "#38bdf8" : "#cbd5e1",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: isActive ? 600 : 400,
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ opacity: isActive ? 1 : 0.5 }}>
                      {isActive ? "●" : "○"}
                    </span>
                    {scenario.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div
          style={{
            padding: "16px",
            borderTop: "1px solid #334155",
            fontSize: "12px",
            color: "#64748b",
            textAlign: "center",
          }}
        >
          v1.1.0 · Desktop Edition
        </div>

        {/* Resize Handle */}
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
            padding: "0 32px",
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
                  }}
                >
                  <span style={{ fontSize: "14px" }}>🎯</span>
                  cenário ativo
                </span>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
                  {scenarios.find(s => s.id === selectedScenarioId)?.title || "Árvore Importada"}
                </h2>
              </div>
            ) : (
              <h2 style={{ margin: 0, fontSize: "16px", color: "#94a3b8" }}>
                Selecione um cenário
              </h2>
            )}
          </div>

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
          {/* Resize Handle */}
          {!isSidebarCollapsed && (
            <div
              onMouseDown={handleRightMouseDown}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
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
                if (!isRightResizing) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            />
          )}

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
                    {/* Evidences Section */}
                    <div style={{ marginBottom: "24px" }}>
                      <h4 style={{
                        margin: "0 0 12px 0",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#f8fafc",

                        letterSpacing: "0.05em",
                      }}>
                        ✓ Evidências
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
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}>
                        ✗ Contra-Evidências
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
                              background: "white",
                              borderRadius: "6px",
                              border: "1px solid #e2e8f0",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "#ef4444";
                              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(239, 68, 68, 0.2)";
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
                                accentColor: "#ef4444",
                              }}
                            />
                            <span style={{
                              fontSize: "11px",
                              lineHeight: "1.4",
                              color: evidence.checked ? "#64748b" : "#cbd5e1",
                              textDecoration: evidence.checked ? "line-through" : "none",
                            }}>
                              {evidence.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
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

    </div>
  );
};

export default App;
