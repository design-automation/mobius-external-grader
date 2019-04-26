import { IFlowchart, canvasSize } from './flowchart.interface';
import { INode } from '../node';

export class FlowchartUtils {

    static checkNode(nodeOrder: INode[], node: INode, enabled: boolean) {
        if (node.hasExecuted) {
            return;
        } else if (node.type === 'start' ) {
            nodeOrder.push(node);
        } else {
            for (const edge of node.input.edges) {
                if (!edge.source.parentNode.hasExecuted) {
                    return;
                }
            }
            nodeOrder.push(node);
        }
        node.hasExecuted = true;
        // node.enabled = enabled;
        for (const edge of node.output.edges) {
            FlowchartUtils.checkNode(nodeOrder, edge.target.parentNode, enabled);
        }
    }

    public static orderNodes(flw: IFlowchart) {
        let startNode: INode = flw.nodes[0];
        const selectedNodesID = [];
        for (const nodeIndex of flw.meta.selected_nodes) {
            selectedNodesID.push(flw.nodes[nodeIndex].id);
        }
        for (const node of flw.nodes) {
            if (node.type === 'start') {
                startNode = node;
            }
            node.hasExecuted = false;
        }
        const nodeOrder: any[] = [];
        FlowchartUtils.checkNode(nodeOrder, startNode, true);
        if (nodeOrder.length < flw.nodes.length) {
            /*
            for (const node of flw.nodes) {
                if (node.type !== 'start' && node.input.edges.length === 0) {
                    FlowchartUtils.checkNode(nodeOrder, node, false);
                }
            }
            */
            for (const node of flw.nodes) {
                let check = false;
                for (const existingNode of nodeOrder) {
                    if (existingNode === node) {
                        check = true;
                        break;
                    }
                }
                if (check) { continue; }
                // node.enabled = false;
                nodeOrder.push(node);
            }
        }
        if (nodeOrder[nodeOrder.length - 1].type !== 'end') {
            for (let i = nodeOrder.length - 2; i > 0; i--) {
                if (nodeOrder[i].type === 'end') {
                    const endN = nodeOrder[i];
                    nodeOrder.splice(i, 1);
                    nodeOrder.push(endN);
                    break;
                }
            }
        }
        flw.meta.selected_nodes = [];
        for (const nodeID of selectedNodesID) {
            for (let i = 0; i < nodeOrder.length; i++) {
                if (nodeOrder[i].id === nodeID) {
                    flw.meta.selected_nodes.push(i);
                    break;
                }
            }
        }
        flw.nodes = nodeOrder;
        flw.ordered = true;
    }
}
