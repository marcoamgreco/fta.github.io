import * as XLSX from 'xlsx';
import type { TreeNode, FTANodeType, FTAGateType } from '../scenarios';

interface ExcelRow {
    ID: string;
    Label: string;
    Type: string;
    ParentID?: string;
    GateType?: string;
}

export const parseExcelToTree = async (file: File): Promise<TreeNode | null> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

                if (jsonData.length === 0) {
                    reject(new Error("Planilha vazia"));
                    return;
                }

                // Map to store nodes by ID for easy access
                const nodeMap = new Map<string, TreeNode>();
                let rootNode: TreeNode | null = null;

                // First pass: Create all nodes
                jsonData.forEach((row) => {
                    const node: TreeNode = {
                        id: row.ID.toString(),
                        label: row.Label,
                        type: (row.Type?.toLowerCase() === 'basic_event' ? 'basic_event' : 'event') as FTANodeType,
                        gateType: (row.GateType?.toUpperCase() === 'AND' ? 'AND' : 'OR') as FTAGateType,
                        children: [],
                    };
                    nodeMap.set(node.id, node);
                });

                // Second pass: Build relationships
                jsonData.forEach((row) => {
                    const node = nodeMap.get(row.ID.toString());
                    if (!node) return;

                    if (!row.ParentID) {
                        // Found root node (no parent)
                        if (rootNode) {
                            console.warn("Múltiplos nós raiz encontrados. Usando o primeiro:", rootNode.id);
                        } else {
                            rootNode = node;
                        }
                    } else {
                        const parent = nodeMap.get(row.ParentID.toString());
                        if (parent) {
                            if (!parent.children) parent.children = [];
                            parent.children.push(node);
                        } else {
                            console.warn(`Pai não encontrado para o nó ${node.id}: ${row.ParentID}`);
                        }
                    }
                });

                if (!rootNode) {
                    reject(new Error("Nenhum nó raiz encontrado (nó sem ParentID)"));
                } else {
                    resolve(rootNode);
                }

            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};
