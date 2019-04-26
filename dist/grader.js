"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const code_utils_1 = require("./model/code/code.utils");
const flowchart_1 = require("./model/flowchart");
// import { INode } from './node';
const procedure_1 = require("./model/procedure");
const modules_1 = require("./core/modules");
const port_1 = require("./model/port");
const Modules = __importStar(require("./core/modules"));
const circularJSON = __importStar(require("circular-json"));
const xmlhttprequest_1 = require("xmlhttprequest");
const mergeInputsFunc = `
function mergeInputs(models){
    let result = __modules__.${modules_1._parameterTypes.new}();
    for (let model of models){
        __modules__.${modules_1._parameterTypes.merge}(result, model);
    }
    return result;
}
`;
exports.gradeFile_URL = async (event = {}) => {
    const p = new Promise((resolve) => {
        const request = new xmlhttprequest_1.XMLHttpRequest();
        request.open('GET', event.file);
        request.onload = async () => {
            if (request.status === 200) {
                resolve(await exports.gradeFile({ "file": request.responseText }));
            }
            else {
                resolve({
                    "correct": false,
                    "score": 0,
                    "comment": "Unable to retrieve file."
                });
            }
        };
        request.send();
    });
    return await p;
};
exports.gradeFile = async (event = {}) => {
    try {
        // parse the mob file
        // console.log('Parsing .mob file...')
        const mobFile = circularJSON.parse(event.file);
        // execute the flowchart
        // console.log('Execute flowchart...')
        await execute(mobFile.flowchart);
        const result = mobFile.flowchart.nodes[mobFile.flowchart.nodes.length - 1].output.value;
        // console.log('Finished execute...')
        // console.log('result:', JSON.stringify(result.getData()));
        // TODO: grade the output...
        // TODO: return grading...
        if (result.getData) {
            return {
                "correct": true,
                "score": 100,
                "comment": `${result.getData().geometry.num_positions} positions`
            };
        }
        else {
            return {
                "correct": true,
                "score": 100,
                "comment": `result: ${result}`
            };
        }
        // return JSON.stringify(result.getData());
    }
    catch (err) {
        return {
            "correct": false,
            "score": 0,
            "comment": err.message
        };
    }
};
async function execute(flowchart) {
    // reset input of all nodes except start & resolve all async processes (file reading + get url content)
    for (const node of flowchart.nodes) {
        if (node.type !== 'start') {
            if (node.input.edges) {
                node.input.value = undefined;
            }
        }
        try {
            await resolveImportedUrl(node.procedure, true);
        }
        catch (ex) {
            throw ex;
        }
        if (!node.enabled) {
            continue;
        }
        let EmptyECheck = false;
        let InvalidECheck = false;
        for (const prod of node.procedure) {
            if (prod.type === procedure_1.ProcedureTypes.Return || prod.type === procedure_1.ProcedureTypes.Comment || !prod.enabled) {
                continue;
            }
            if (prod.argCount > 0 && prod.args[0].invalidVar) {
                node.hasError = true;
                prod.hasError = true;
                InvalidECheck = true;
            }
            if (prod.type === procedure_1.ProcedureTypes.Constant) {
                // Following part is for compatibility with older files
                // to be removed...
                if (!prod.args[1].value && prod.args[1].default) {
                    prod.args[1].value = prod.args[1].default;
                }
                // removed end...
                try {
                    prod.resolvedValue = await code_utils_1.CodeUtils.getStartInput(prod.args[1], prod.meta.inputMode);
                }
                catch (ex) {
                    node.hasError = true;
                    prod.hasError = true;
                    if (ex.message.indexOf('HTTP') !== -1 || ex.message.indexOf('File Reading') !== -1) {
                        throw (ex);
                    }
                    InvalidECheck = true;
                }
                if (!prod.args[0].value || (!prod.args[1].value && prod.args[1].value !== 0)) {
                    node.hasError = true;
                    prod.hasError = true;
                    EmptyECheck = true;
                }
            }
            else {
                for (const arg of prod.args) {
                    if (arg.name[0] === '_' || arg.type === 5) {
                        continue;
                    }
                    if (arg.value !== 0 && !arg.value) {
                        node.hasError = true;
                        prod.hasError = true;
                        EmptyECheck = true;
                    }
                }
            }
        }
        if (EmptyECheck) {
            throw new Error('Empty Argument');
        }
        if (InvalidECheck) {
            throw new Error('Reserved Word Argument');
        }
    }
    for (const func of flowchart.functions) {
        for (const node of func.flowchart.nodes) {
            await resolveImportedUrl(node.procedure, false);
        }
    }
    if (flowchart.subFunctions) {
        for (const func of flowchart.subFunctions) {
            for (const node of func.flowchart.nodes) {
                await resolveImportedUrl(node.procedure, false);
            }
        }
    }
    executeFlowchart(flowchart);
}
function executeFlowchart(flowchart) {
    let globalVars = '';
    // reordering the flowchart
    if (!flowchart.ordered) {
        flowchart_1.FlowchartUtils.orderNodes(flowchart);
    }
    // get the string of all imported functions
    const funcStrings = {};
    for (const func of flowchart.functions) {
        funcStrings[func.name] = code_utils_1.CodeUtils.getFunctionString(func);
    }
    if (flowchart.subFunctions) {
        for (const func of flowchart.subFunctions) {
            funcStrings[func.name] = code_utils_1.CodeUtils.getFunctionString(func);
        }
    }
    for (let i = 0; i < flowchart.nodes.length; i++) {
        flowchart.nodes[i].hasExecuted = false;
    }
    // execute each node
    for (let i = 0; i < flowchart.nodes.length; i++) {
        // for (const i of executeSet) {
        const node = flowchart.nodes[i];
        if (!node.enabled) {
            node.output.value = undefined;
            continue;
        }
        globalVars = executeNode(node, funcStrings, globalVars);
    }
    for (const node of flowchart.nodes) {
        if (node.type !== 'end') {
            delete node.output.value;
        }
    }
}
async function resolveImportedUrl(prodList, isMainFlowchart) {
    for (const prod of prodList) {
        if (prod.children) {
            await resolveImportedUrl(prod.children);
        }
        if (isMainFlowchart && prod.type === procedure_1.ProcedureTypes.Imported) {
            for (let i = 1; i < prod.args.length; i++) {
                const arg = prod.args[i];
                // args.slice(1).map((arg) => {
                if (arg.type.toString() !== port_1.InputType.URL.toString()) {
                    continue;
                }
                prod.resolvedValue = await code_utils_1.CodeUtils.getStartInput(arg, port_1.InputType.URL);
            }
            continue;
        }
        if (prod.type !== procedure_1.ProcedureTypes.Function) {
            continue;
        }
        for (const func of modules_1._parameterTypes.urlFunctions) {
            const funcMeta = func.split('.');
            if (prod.meta.module === funcMeta[0] && prod.meta.name === funcMeta[1]) {
                for (const arg of prod.args) {
                    if (arg.name[0] === '_') {
                        continue;
                    }
                    if (arg.value.indexOf('://') !== -1) {
                        const val = arg.value.replace(/ /g, '');
                        const result = await code_utils_1.CodeUtils.getURLContent(val);
                        if (result === undefined) {
                            prod.resolvedValue = arg.value;
                        }
                        else {
                            prod.resolvedValue = '`' + result + '`';
                        }
                        break;
                    }
                }
                break;
            }
        }
    }
}
function executeNode(node, funcStrings, globalVars) {
    const params = { 'currentProcedure': [''], 'console': [] };
    let fnString = '';
    try {
        const usedFuncs = [];
        const codeResult = code_utils_1.CodeUtils.getNodeCode(node, true, undefined, usedFuncs);
        const usedFuncsSet = new Set(usedFuncs);
        // if process is terminated, return
        const codeRes = codeResult[0];
        const nodeCode = codeRes[0];
        // Create function string:
        // start with asembling the node's code
        fnString = '\n\n//  ------ MAIN CODE ------\n' +
            '\nfunction __main_node_code__(){\n' +
            nodeCode.join('\n') +
            '\n}\nreturn __main_node_code__();';
        // add the user defined functions that are used in the node
        usedFuncsSet.forEach((funcName) => {
            for (const otherFunc in funcStrings) {
                if (otherFunc.substring(0, funcName.length) === funcName) {
                    fnString = funcStrings[otherFunc] + fnString;
                }
            }
        });
        // add the constants from the start node and the predefined constants/functions (e.g. PI, sqrt, ...)
        fnString = modules_1._varString + globalVars + fnString;
        // add the merge input function and the print function
        fnString = mergeInputsFunc + '\n' + fnString;
        // ==> generated code structure:
        //  1. mergeInputFunction
        //  2. constants
        //  3. user functions
        //  4. main node code
        params['model'] = modules_1._parameterTypes.newFn();
        modules_1._parameterTypes.mergeFn(params['model'], node.input.value);
        // create the function with the string: new Function ([arg1[, arg2[, ...argN]],] functionBody)
        const fn = new Function('__modules__', '__params__', fnString);
        // execute the function
        const result = fn(Modules, params);
        node.output.value = result;
        node.hasExecuted = true;
        node.input.edges.forEach(edge => {
            const inputNode = edge.source.parentNode;
            if (inputNode.output.edges.length > 1) {
                for (const outputEdge of inputNode.output.edges) {
                    if (!outputEdge.target.parentNode.hasExecuted) {
                        return;
                    }
                }
            }
            inputNode.output.model = null;
        });
        // diff(node.output.value.getData(), node.input.value.getData());
        if (node.type === 'start') {
            for (const constant in params['constants']) {
                if (params['constants'].hasOwnProperty(constant)) {
                    const constString = JSON.stringify(params['constants'][constant]);
                    globalVars += `const ${constant} = ${constString};\n`;
                }
            }
            globalVars += '\n';
        }
        node.input.value = null;
        return globalVars;
    }
    catch (ex) {
        throw ex;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JhZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dyYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSx3REFBb0Q7QUFDcEQsaURBQStEO0FBQy9ELGtDQUFrQztBQUNsQyxpREFBK0Q7QUFFL0QsNENBQTZEO0FBQzdELHVDQUF5QztBQUN6Qyx3REFBMEM7QUFDMUMsNERBQThDO0FBQzlDLG1EQUFnRDtBQUdoRCxNQUFNLGVBQWUsR0FBRzs7K0JBRU8seUJBQWUsQ0FBQyxHQUFHOztzQkFFNUIseUJBQWUsQ0FBQyxLQUFLOzs7O0NBSTFDLENBQUM7QUFHVyxRQUFBLGFBQWEsR0FBRyxLQUFLLEVBQUUsUUFBYSxFQUFFLEVBQWdCLEVBQUU7SUFDakUsTUFBTSxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtRQUU5QixNQUFNLE9BQU8sR0FBRyxJQUFJLCtCQUFjLEVBQUUsQ0FBQztRQUNyQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEMsT0FBTyxDQUFDLE1BQU0sR0FBRyxLQUFLLElBQUksRUFBRTtZQUN4QixJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssR0FBRyxFQUFFO2dCQUN4QixPQUFPLENBQUMsTUFBTSxpQkFBUyxDQUFDLEVBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxZQUFZLEVBQUMsQ0FBQyxDQUFDLENBQUE7YUFDM0Q7aUJBQU07Z0JBQ0gsT0FBTyxDQUFDO29CQUNKLFNBQVMsRUFBRSxLQUFLO29CQUNoQixPQUFPLEVBQUUsQ0FBQztvQkFDVixTQUFTLEVBQUUsMEJBQTBCO2lCQUN4QyxDQUFDLENBQUM7YUFDTjtRQUNMLENBQUMsQ0FBQztRQUNGLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNuQixDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sTUFBTSxDQUFDLENBQUM7QUFDbkIsQ0FB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