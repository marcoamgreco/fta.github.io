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
    border: '2px solid #333',
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
        // --- Recursive Tree Parser ---
        const generateElements = (root: TreeNode) => {
            const nodes: Node[] = [];
            const edges: Edge[] = [];

            const traverse = (node: TreeNode, parentId?: string) => {
                const nodeId = node.id;
                const isBasic = node.type === 'basic_event';
                const status = getNodeStatus?.(nodeId) || 'none';

                nodes.push({
                    id: nodeId,
                    type: 'customNode',
                    selected: nodeId === selectedNodeId,
                    data: {
                        label: node.label,
                        width: isBasic ? 100 : 150,
                        height: isBasic ? 100 : 50,
                        isBasic,
                        status,
                        onAddEvent: () => onAddNode?.(nodeId, 'event'),
                        onAddBasicEvent: () => onAddNode?.(nodeId, 'basic_event'),
                        onEdit: () => { }, // Not used anymore
                        onDelete: () => onDeleteNode?.(nodeId),
                        onLabelChange: (newLabel: string) => onEditNode?.(nodeId, newLabel),
                    },
                    position: { x: 0, y: 0 },
                    style: { width: isBasic ? 100 : 150, height: isBasic ? 100 : 50 },
                });

                if (parentId) {
                    edges.push({
                        id: `${parentId}-${nodeId}`,
                        source: parentId,
                        target: nodeId,
                        type: 'animated',
                        markerEnd: { type: MarkerType.ArrowClosed },
                    });
                }

                if (node.children && node.children.length > 0) {
                    const gateId = `${nodeId}-gate`;
                    const gateType = node.gateType || 'OR';

                    nodes.push({
                        id: gateId,
                        type: 'default',
                        data: { label: gateType, width: 60, height: 40 },
                        position: { x: 0, y: 0 },
                        style: gateType === 'AND' ? andGateStyle : gateNodeStyle,
                    });

                    edges.push({
                        id: `${nodeId}-${gateId}`,
                        source: nodeId,
                        target: gateId,
                        type: 'animated',
                    });

                    node.children.forEach((child) => {
                        traverse(child, gateId);
                    });
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
                reactFlowInstanceRef.current?.fitView({ duration: 0, padding: 0.2 });
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
        <div style={{ width: '100%', height: '100%', background: '#f8f8f8' }}>
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
            >
                <Controls />
                <Background color="#aaa" gap={16} />
                <Panel position="top-right">
                    <button
                        onClick={() => {
                            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                                nodes,
                                edges,
                                'TB'
                            );
                            setNodes([...layoutedNodes]);
                            setEdges([...layoutedEdges]);
                        }}
                        style={{
                            padding: '8px 12px',
                            background: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <span>🔄</span> Reorganizar Layout
                    </button>
                </Panel>
            </ReactFlow>
        </div>
    );
};

export default FTADiagram;
