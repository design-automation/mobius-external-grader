"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
const GIModel_1 = require("./libs/geo-info/GIModel");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
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
                resolve(await exports.gradeFile({ "file": request.responseText, "question": event.question }));
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
        const mob_excution_result = mobFile.flowchart.nodes[mobFile.flowchart.nodes.length - 1].output.value;
        // console.log('Finished execute...')
        const student_model_data = mob_excution_result.getData();
        var s3 = new aws_sdk_1.default.S3();
        const params = { Bucket: "mooc-answers", Key: event.question + '.gi' };
        return await s3.getObject(params).promise()
            .then((res) => {
            const answer_obj = JSON.parse(res.Body.toString('utf-8'));
            const answer_model = new GIModel_1.GIModel(answer_obj);
            const student_model = new GIModel_1.GIModel(student_model_data);
            const result = answer_model.compare(student_model);
            if (result.matches) {
                return {
                    "correct": true,
                    "score": 1,
                    "comment": result.comment
                };
            }
            else {
                return {
                    "correct": false,
                    "score": 0,
                    "comment": result.comment
                };
            }
        })
            .catch((err) => {
            return err;
        });
    }
    catch (err) {
        return {
            "correct": false,
            "score": 0,
            "comment": 'Error: ' + err.message
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
                // remove ends!
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JhZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dyYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSx3REFBb0Q7QUFDcEQsaURBQStEO0FBQy9ELGtDQUFrQztBQUNsQyxpREFBK0Q7QUFFL0QsNENBQTZEO0FBQzdELHVDQUF5QztBQUN6Qyx3REFBMEM7QUFDMUMsNERBQThDO0FBQzlDLG1EQUFnRDtBQUVoRCxxREFBa0Q7QUFFbEQsc0RBQTBCO0FBRTFCLE1BQU0sZUFBZSxHQUFHOzsrQkFFTyx5QkFBZSxDQUFDLEdBQUc7O3NCQUU1Qix5QkFBZSxDQUFDLEtBQUs7Ozs7Q0FJMUMsQ0FBQztBQUVGLE9BQU8sQ0FBQyxhQUFhLEdBQUcsS0FBSyxFQUFFLEtBQUssR0FBRyxFQUFFLEVBQUUsRUFBRTtJQUN6QyxNQUFNLENBQUMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO1FBQzlCLE1BQU0sT0FBTyxHQUFHLElBQUksK0JBQWMsRUFBRSxDQUFDO1FBQ3JDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQyxPQUFPLENBQUMsTUFBTSxHQUFHLEtBQUssSUFBSSxFQUFFO1lBQ3hCLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxHQUFHLEVBQUU7Z0JBQ3hCLE9BQU8sQ0FBQyxNQUFNLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQzthQUNsRztpQkFDSTtnQkFDRCxPQUFPLENBQUM7b0JBQ0osU0FBUyxFQUFFLEtBQUs7b0JBQ2hCLE9BQU8sRUFBRSxDQUFDO29CQUNWLFNBQVMsRUFBRSwwQkFBMEI7aUJBQ3hDLENBQUMsQ0FBQzthQUNOO1FBQ0wsQ0FBQyxDQUFDO1FBQ0YsT0FB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