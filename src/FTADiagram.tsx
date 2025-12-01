import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import ReactFlow, {
    useNodesState,
    useEdgesState,
    Position,
    MarkerType,
    Controls,
    Background,
    Panel,
} from 'reactflow';
import type { Node, Edge, EdgeTypes, ReactFlowInstance } from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import type { TreeNode } from './scenarios';
import CustomNode from './CustomNode';
import AnimatedEdge from './AnimatedEdge';

// --- Custom Node Styles for Gates ---
const gateNodeStyle = {
    padding: '10px 20px',
    borderRadius: '0px 0px 20px 20px',
    border: '2px solid #ccc', // Default gray - will be overridden based on parent status
    fontSize: '10px',
    textAlign: 'center' as const,
    width: 60,
    height: 40,
    background: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold' as const,
    color: '#000',
};

const andGateStyle = {
    ...gateNodeStyle,
    borderRadius: '20px 20px 0 0',
};

// --- Layout Helper ---
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        const width = node.data.width || 150;
        const height = node.data.height || 50;
        dagreGraph.setNode(node.id, { width, height });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const width = node.data.width || 150;
        const height = node.data.height || 50;

        return {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            position: {
                x: nodeWithPosition.x - width / 2,
                y: nodeWithPosition.y - height / 2,
            },
        };
    });

    return { nodes: newNodes, edges };
};

type FTADiagramProps = {
    rootNode: TreeNode;
    onNodeClick?: (nodeId: string) => void;
    onNodeDoubleClick?: (nodeId: string) => void;
    onAddNode?: (parentId: string, type: 'event' | 'basic_event') => void;
    onEditNode?: (nodeId: string, newLabel: string) => void;
    onDeleteNode?: (nodeId: string) => void;
    selectedNodeId?: string | null;
    getNodeStatus?: (nodeId: string) => 'complete' | 'partial' | 'none';
    onPaneClick?: () => void;
};

const FTADiagram: React.FC<FTADiagramProps> = ({
    rootNode,
    onNodeClick,
    onNodeDoubleClick,
    onAddNode,
    onEditNode,
    onDeleteNode,
    selectedNodeId,
    getNodeStatus,
    onPaneClick
}) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);
    const rootNodeIdRef = useRef<string | null>(null);

    // Define custom node types
    const nodeTypes = useMemo(() => ({ customNode: CustomNode }), []);

    // Define custom edge types
    const edgeTypes = useMemo<EdgeTypes>(() => ({
        animated: AnimatedEdge
    }), []);

    const onInit = useCallback((instance: ReactFlowInstance) => {
        reactFlowInstanceRef.current = instance;
    }, []);

    useEffect(() => {
        console.log('🔄 FTADiagram: rootNode updated', { id: rootNode.id, childrenCount: rootNode.children?.length });
        // --- Recursive Tree Parser ---
        const generateElements = (root: TreeNode) => {
            const nodes: Node[] = [];
            const edges: Edge[] = [];

            const traverse = (node: TreeNode, parentId?: string) => {
                const nodeId = node.id;
                const isBasic = node.type === 'basic_event';
                const isTerminator = node.type === 'terminator';
                const status = getNodeStatus?.(nodeId) || 'none';
                const isRoot = !parentId;

                // Check parent status if not root
                let parentIsComplete = false;
                if (!isRoot && parentId) {
                    let parentNodeId = parentId;
                    if (parentId.endsWith('-gate')) {
                        parentNodeId = parentId.replace('-gate', '');
                    }
                    const parentStatus = getNodeStatus?.(parentNodeId) || 'none';
                    parentIsComplete = parentStatus === 'complete';
                }

                // Determine node dimensions
                let nodeWidth = 150;
                let nodeHeight = 50;
                if (isBasic) {
                    nodeWidth = 100;
                    nodeHeight = 100;
                } else if (isTerminator) {
                    // Losango: largura metade, altura 1/4
                    nodeWidth = 60;
                    nodeHeight = 30;
                }

                nodes.push({
                    id: nodeId,
                    type: 'customNode',
                    selected: nodeId === selectedNodeId,
                    data: {
                        label: node.label,
                        width: nodeWidth,
                        height: nodeHeight,
                        isBasic,
                        isTerminator,
                        status,
                        isRoot,
                        parentIsComplete,
                        description: node.description,
                        onAddEvent: () => onAddNode?.(nodeId, 'event'),
                        onAddBasicEvent: () => onAddNode?.(nodeId, 'basic_event'),
                        onAddTerminator: isTerminator ? undefined : () => onAddNode?.(nodeId, 'event'),
                        onEdit: () => { }, // Not used anymore
                        onDelete: () => onDeleteNode?.(nodeId),
                        onLabelChange: (newLabel: string) => onEditNode?.(nodeId, newLabel),
                    },
                    position: { x: 0, y: 0 },
                    style: { width: nodeWidth, height: nodeHeight },
                });

                if (parentId) {
                    // Check if parent is a gate (to find the original parent node)
                    let parentNodeId = parentId;
                    if (parentId.endsWith('-gate')) {
                        parentNodeId = parentId.replace('-gate', '');
                    }
                    const parentStatus = getNodeStatus?.(parentNodeId) || 'none';
                    const isParentComplete = parentStatus === 'complete';

                    edges.push({
                        id: `${parentId}-${nodeId}`,
                        source: parentId,
                        target: nodeId,
                        type: 'animated',
                        markerEnd: { type: MarkerType.ArrowClosed },
                        data: {
                            strokeColor: isParentComplete ? '#000' : '#bbb',
                        },
                    });
                }

                // Terminadores não podem ter filhos
                if (node.children && node.children.length > 0 && !isTerminator) {
                    // Separar filhos em terminadores e não-terminadores
                    const terminators = node.children.filter(child => child.type === 'terminator');
                    const nonTerminators = node.children.filter(child => child.type !== 'terminator');

                    // Conectar terminadores diretamente ao evento pai, sem gate
                    terminators.forEach((terminator) => {
                        traverse(terminator, nodeId);
                    });

                    // Para não-terminadores, criar gate normalmente
                    if (nonTerminators.length > 0) {
                        const gateId = `${nodeId}-gate`;
                        const gateType = node.gateType || 'OR';

                        // Gate border color: black ONLY if the parent node (nodeId) has ALL evidences checked
                        // Gates should start gray (#ccc) and only turn black when parent evidence is complete
                        // Explicitly check that status is exactly 'complete' (all evidences checked)
                        const isNodeComplete = status === 'complete';
                        const gateBorderColor = isNodeComplete ? '#000' : '#ccc';

                        nodes.push({
                            id: gateId,
                            type: 'default',
                            data: { label: gateType, width: 60, height: 40 },
                            position: { x: 0, y: 0 },
                            style: {
                                ...(gateType === 'AND' ? andGateStyle : gateNodeStyle),
                                border: `2px solid ${gateBorderColor}`,
                            },
                        });

                        // Edge from node to gate - black if node is complete
                        edges.push({
                            id: `${nodeId}-${gateId}`,
                            source: nodeId,
                            target: gateId,
                            type: 'animated',
                            data: {
                                strokeColor: isNodeComplete ? '#000' : '#bbb',
                            },
                        });

                        nonTerminators.forEach((child) => {
                            traverse(child, gateId);
                        });
                    }
                }
            };

            traverse(root);
            return { nodes, edges };
        };

        const { nodes: initialNodes, edges: initialEdges } = generateElements(rootNode);
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            initialNodes,
            initialEdges,
            'TB'
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);

        // Track if rootNode changed (scenario selection)
        const rootNodeChanged = rootNodeIdRef.current !== rootNode.id;
        rootNodeIdRef.current = rootNode.id;

        // Fit view when scenario changes (rootNode changes)
        if (rootNodeChanged && layoutedNodes.length > 0) {
            setTimeout(() => {
                reactFlowInstanceRef.current?.fitView({ duration: 0, padding: 0.2, minZoom: 0.05 });
            }, 200);
        }
    }, [rootNode, setNodes, setEdges, onAddNode, onEditNode, onDeleteNode, selectedNodeId, getNodeStatus]);

    const handleNodeClick = (_: React.MouseEvent, node: Node) => {
        if (onNodeClick) {
            onNodeClick(node.id);
        }
    };

    const handleNodeDoubleClick = (_: React.MouseEvent, node: Node) => {
        if (onNodeDoubleClick) {
            onNodeDoubleClick(node.id);
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', background: '#f0f2f5' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                onPaneClick={onPaneClick}
                onInit={onInit}
                attributionPosition="bottom-right"
                minZoom={0.05}
            >
                <Controls />
                <Background color="#aaa" gap={16} />
                <Panel position="bottom-right">
                    <div style={{ marginBottom: '10px' }}>
                        <button
                            onClick={() => {
                                const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                                    nodes,
                                    edges,
                                    'TB'
                                );
                                setNodes([...layoutedNodes]);
                                setEdges([...layoutedEdges]);
                                reactFlowInstanceRef.current?.fitView({ duration: 300, padding: 0.2, minZoom: 0.05 });
                            }}
                            style={{
                                padding: '8px 12px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '9px',
                                fontWeight: 600,
                                color: '#ffffff',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.3s ease',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                            }}
                            onMouseDown={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                    display: 'inline-block',
                                    transition: 'transform 0.3s ease',
                                }}
                                className="reorganize-icon"
                            >
                                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                            </svg>
                            <span>Reorganizar Árvore</span>
                        </button>
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
};

export default FTADiagram;
