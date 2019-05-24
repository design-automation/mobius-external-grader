"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flowchart_interface_1 = require("./flowchart.interface");
const node_1 = require("../node");
const utils_1 = require("../../utils");
class FlowchartUtils {
    static newflowchart() {
        const startNode = node_1.NodeUtils.getStartNode();
        let startPos = flowchart_interface_1.canvasSize * 1.07 / 2;
        startPos = startPos - startPos % 20;
        startNode.position = { x: startPos, y: flowchart_interface_1.canvasSize / 2 };
        const middleNode = node_1.NodeUtils.getNewNode();
        middleNode.position = { x: startPos, y: 200 + flowchart_interface_1.canvasSize / 2 };
        const endNode = node_1.NodeUtils.getEndNode();
        endNode.position = { x: startPos, y: 400 + flowchart_interface_1.canvasSize / 2 };
        const startMid = {
            source: startNode.output,
            target: middleNode.input,
            selected: false
        };
        startNode.output.edges = [startMid];
        middleNode.input.edges = [startMid];
        const midEnd = {
            source: middleNode.output,
            target: endNode.input,
            selected: false
        };
        middleNode.output.edges = [midEnd];
        endNode.input.edges = [midEnd];
        middleNode.enabled = true;
        endNode.enabled = true;
        const flw = {
            id: utils_1.IdGenerator.getId(),
            name: 'Untitled',
            description: '',
            language: 'js',
            meta: {
                selected_nodes: [2]
            },
            nodes: [startNode, middleNode, endNode],
            edges: [startMid, midEnd],
            functions: [],
            ordered: true
        };
        return flw;
    }
    static checkNode(nodeOrder, node, enabled) {
        if (node.hasExecuted) {
            return;
        }
        else if (node.type === 'start') {
            nodeOrder.push(node);
        }
        else {
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
    static orderNodes(flw) {
        let startNode;
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
        const nodeOrder = [];
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
                if (check) {
                    continue;
                }
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
exports.FlowchartUtils = FlowchartUtils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxvd2NoYXJ0LnV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL21vZGVsL2Zsb3djaGFydC9mbG93Y2hhcnQudXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrREFBK0Q7QUFDL0Qsa0NBQTJDO0FBRTNDLHVDQUEwQztBQUUxQyxNQUFhLGNBQWM7SUFFaEIsTUFBTSxDQUFDLFlBQVk7UUFDdEIsTUFBTSxTQUFTLEdBQUcsZ0JBQVMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUMzQyxJQUFJLFFBQVEsR0FBRyxnQ0FBVSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUM7UUFDckMsUUFBUSxHQUFHLFFBQVEsR0FBRyxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBRXBDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsRUFBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxnQ0FBVSxHQUFHLENBQUMsRUFBQyxDQUFDO1FBRXRELE1BQU0sVUFBVSxHQUFHLGdCQUFTLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDMUMsVUFBVSxDQUFDLFFBQVEsR0FBRyxFQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxnQ0FBVSxHQUFHLENBQUMsRUFBQyxDQUFDO1FBRTdELE1BQU0sT0FBTyxHQUFHLGdCQUFTLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDdkMsT0FBTyxDQUFDLFFBQVEsR0FBRyxFQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxnQ0FBVSxHQUFHLENBQUMsRUFBQyxDQUFDO1FBRTFELE1BQU0sUUFBUSxHQUFVO1lBQ3BCLE1BQU0sRUFBRSxTQUFTLENBQUMsTUFBTTtZQUN4QixNQUFNLEVBQUUsVUFBVSxDQUFDLEtBQUs7WUFDeEIsUUFBUSxFQUFFLEtBQUs7U0FDbEIsQ0FBQztRQUNGLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsUUFBUSxD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