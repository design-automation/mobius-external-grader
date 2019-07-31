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
const GIModel_1 = require("./libs/geo-info/GIModel");
const mergeInputsFunc = `
function mergeInputs(models){
    let result = __modules__.${modules_1._parameterTypes.new}();
    for (let model of models){
        __modules__.${modules_1._parameterTypes.merge}(result, model);
    }
    return result;
}
`;
const printFunc = `
function printFunc(_console, name, value){
    let val;
    if (!value) {
        val = value;
    } else if (typeof value === 'number' || value === undefined) {
        val = value;
    } else if (typeof value === 'string') {
        val = '"' + value + '"';
    } else if (value.constructor === [].constructor) {
        val = JSON.stringify(value);
    } else if (value.constructor === {}.constructor) {
        val = JSON.stringify(value);
    } else {
        val = value;
    }
    _console.push('_ ' + name + ': ' + val );
    return val;
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
        // get the params and corresponding answers
        // TODO: allowing S3
        // var s3 = new AWS.S3();
        // const params = { Bucket: "mooc-answers", Key: event.question + '.json' };
        // const res: any =  await s3.getObject(params).promise()
        // const answer = JSON.parse(res.Body.toString('utf-8'));
        const answer = require('../test_foreach.json');
        // const answer = require('../test_foreach1.json');
        // parse the mob file
        const mobFile = circularJSON.parse(event.file);
        const missing_params = checkParams(mobFile.flowchart, answer[0].params);
        if (missing_params.length > 0) {
            return {
                "correct": false,
                "score": 0,
                "comment": 'Error: Missing start node parameters - ' + missing_params.join(',') + '.'
            };
        }
        let score = 0;
        // perform the test for each of the params set
        for (const test of answer) {
            const consoleLog = [];
            // execute the flowchart
            if (test.params) {
                setParams(mobFile.flowchart, test.params);
            }
            await execute(mobFile.flowchart, consoleLog);
            let correct_check = true;
            if (test.console && test.console !== test.console) {
                console.log('console logs do not match');
                correct_check = false;
            }
            if (test.model) {
                const answer_model = new GIModel_1.GIModel(test.model);
                const student_model = mobFile.flowchart.nodes[mobFile.flowchart.nodes.length - 1].output.value;
                const result = answer_model.compare(student_model);
                if (!result.matches) {
                    correct_check = false;
                }
            }
            if (correct_check) {
                score += 1;
            }
        }
        return {
            "correct": score > 0,
            "score": score,
            "comment": score + '/' + answer.length
        };
    }
    catch (err) {
        throw (err);
        return {
            "correct": false,
            "score": 0,
            "comment": 'Error: ' + err.message
        };
    }
};
// export const gradeFile_old = async (event: any = {}): Promise<any> => {
//     try {
//         // parse the mob file
//         // console.log('Parsing .mob file...')
//         const mobFile = circularJSON.parse(event.file);
//         const consoleLog = [];
//         // execute the flowchart
//         // console.log('Execute flowchart...')
//         getParams(mobFile.flowchart);
//         await execute(mobFile.flowchart, consoleLog);
//         const mob_excution_result = mobFile.flowchart.nodes[mobFile.flowchart.nodes.length - 1].output.value;
//         // console.log('Finished execute...')
//         const student_model_data = mob_excution_result.getData();
//         var s3 = new AWS.S3();
//         const params = { Bucket: "mooc-answers", Key: event.question + '.gi' };
//         return await s3.getObject(params).promise()
//         .then((res) => {
//              const answer_obj = JSON.parse(res.Body.toString('utf-8'));
//                 const answer_model = new GIModel(answer_obj);
//                 const student_model = new GIModel(student_model_data);
//                 const result = answer_model.compare(student_model);
//                 if (result.matches) {
//                     return {
//                         "correct": true,
//                         "score": 1,
//                         "comment": result.comment
//                     };
//                 }
//                 else {
//                     return {
//                         "correct": false,
//                         "score": 0,
//                         "comment": result.comment
//                     };
//                 }
//         })
//         .catch((err) => {
//             return err;
//         });
//     } catch(err) {
//         return {
//             "correct": false,
//             "score": 0,
//             "comment": 'Error: ' + err.message
//         };
//     }
// }
function checkParams(flowchart, params) {
    const missing_params = [];
    for (const param in params) {
        let check = false;
        for (const prod of flowchart.nodes[0].procedure) {
            if (prod.type === procedure_1.ProcedureTypes.Constant &&
                (params[prod.args[0].value] === params[param] || params[prod.args[0].jsValue] === params[param])) {
                check = true;
            }
        }
        if (!check) {
            missing_params.push(param);
        }
    }
    return missing_params;
}
function setParams(flowchart, params) {
    for (const prod of flowchart.nodes[0].procedure) {
        if (prod.type === procedure_1.ProcedureTypes.Constant) {
            if (params[prod.args[0].value] !== undefined) {
                prod.args[1].jsValue = params[prod.args[0].value];
                prod.args[1].value = params[prod.args[0].value];
            }
            if (params[prod.args[0].jsValue] !== undefined) {
                prod.args[1].jsValue = params[prod.args[0].jsValue];
                prod.args[1].value = params[prod.args[0].jsValue];
            }
        }
    }
}
function getParams(flowchart) {
    const params = {};
    for (const prod of flowchart.nodes[0].procedure) {
        if (prod.type === procedure_1.ProcedureTypes.Constant) {
            params[prod.args[0].value] = prod.args[1].jsValue || prod.args[1].value;
        }
    }
    return params;
}
async function execute(flowchart, consoleLog) {
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
            for (const arg of prod.args) {
                if (!arg.jsValue) {
                    arg.jsValue = arg.value;
                }
            }
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
    executeFlowchart(flowchart, consoleLog);
}
function executeFlowchart(flowchart, consoleLog) {
    let globalVars = '';
    const constantList = {};
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
        globalVars = executeNode(node, funcStrings, globalVars, constantList, consoleLog);
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
function executeNode(node, funcStrings, globalVars, constantList, consoleLog) {
    const params = { 'currentProcedure': [''], 'console': [], 'constants': constantList };
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
        fnString = mergeInputsFunc + '\n' + printFunc + '\n' + fnString;
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
                    constantList[constant] = params['constants'][constant];
                }
            }
            globalVars += '\n';
        }
        node.input.value = null;
        for (const i of params['console']) {
            consoleLog.push(i);
        }
        return globalVars;
    }
    catch (ex) {
        throw ex;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JhZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dyYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSx3REFBb0Q7QUFDcEQsaURBQStEO0FBQy9ELGtDQUFrQztBQUNsQyxpREFBK0Q7QUFFL0QsNENBQTZEO0FBQzdELHVDQUF5QztBQUN6Qyx3REFBMEM7QUFDMUMsNERBQThDO0FBQzlDLG1EQUFnRDtBQUVoRCxxREFBa0Q7QUFHbEQsTUFBTSxlQUFlLEdBQUc7OytCQUVPLHlCQUFlLENBQUMsR0FBRzs7c0JBRTVCLHlCQUFlLENBQUMsS0FBSzs7OztDQUkxQyxDQUFDO0FBQ0YsTUFBTSxTQUFTLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FtQmpCLENBQUM7QUFFRixPQUFPLENBQUMsYUFBYSxHQUFHLEtBQUssRUFBRSxLQUFLLEdBQUcsRUFBRSxFQUFFLEVBQUU7SUFFekMsTUFBTSxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtRQUM5QixNQUFNLE9BQU8sR0FBRyxJQUFJLCtCQUFjLEVBQUUsQ0FBQztRQUNyQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEMsT0FBTyxDQUFDLE1BQU0sR0FBRyxLQUFLLElBQUksRUFBRTtZQUN4QixJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssR0FBRyxFQUFFO2dCQUN4QixPQUFPLENBQUMsTUFBTSxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDbEc7aUJBQ0k7Z0JBQ0QsT0FBTyxDQUFDO29CQUNKLFNBQVMsRUFBRSxLQUFLO29CQUNoQixPQUFPLEVBQUUsQ0FBQztvQkFDVixTQUFTLEVBQUUsMEJBQTBCO2lCQUN4QyxDQUFD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