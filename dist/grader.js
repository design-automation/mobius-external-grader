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
        const answerList = [];
        var s3 = new aws_sdk_1.default.S3();
        const params = { Bucket: "mooc-answers", Key: event.question };
        const res = await s3.getObject(params).promise();
        const answerParams = JSON.parse(res.Body.toString('utf-8'));
        for (const param of answerParams) {
            try {
                answerList.push(await s3.getObject({ Bucket: "mooc-answers", Key: param }).promise());
            }
            catch (ex) {
                console.log(`Error: File ${param} does not exist in S3 bucket "mooc-answers"`);
                continue;
            }
        }
        // const answerList = require('../test_foreach.json');
        if (answerList.length === 0) {
            return {
                "correct": true,
                "score": 0,
                "comment": "Error: Unable to find answers for this question."
            };
        }
        // const answer = require('../test_foreach2.json');
        // parse the mob file
        const mobFile = circularJSON.parse(event.file);
        let score = 0;
        // if (!answer.length) {
        //     if (answer.geometry) {
        //         await execute(mobFile.flowchart, []);
        //         const answer_model = new GIModel(answer);
        //         const student_model = mobFile.flowchart.nodes[mobFile.flowchart.nodes.length - 1].output.value;
        //         const result = answer_model.compare(student_model);
        //         if (result.matches) {
        //             score = 1;
        //         }
        //         return {
        //             "correct": score > 0,
        //             "score": score,
        //             "comment": score + '/1'
        //         };
        //     }
        //     const missing_params = checkParams(mobFile.flowchart, answer.params)
        //     if (missing_params.length > 0) {
        //         return {
        //             "correct": false,
        //             "score": 0,
        //             "comment": 'Error: Missing start node parameters - '+ missing_params.join(',') + '.'
        //         };
        //     }
        //     score += await resultCheck(mobFile.flowchart, answer);
        //     return {
        //         "correct": score > 0,
        //         "score": score,
        //         "comment": score + '/1'
        //     };
        // }
        let missing_params;
        for (const answer of answerList) {
            if (answer.params) {
                missing_params = checkParams(mobFile.flowchart, answerList[0].params);
            }
            break;
        }
        if (missing_params && missing_params.length > 0) {
            return {
                "correct": false,
                "score": 0,
                "comment": 'Error: Missing start node parameters - ' + missing_params.join(',') + '.'
            };
        }
        // perform the test for each of the params set
        for (const test of answerList) {
            score += await resultCheck(mobFile.flowchart, test);
        }
        return {
            "correct": score > 0,
            "score": score,
            "comment": score + '/' + answerList.length
        };
    }
    catch (err) {
        return {
            "correct": false,
            "score": 0,
            "comment": 'Error: ' + err.message
        };
    }
};
async function resultCheck(flowchart, answer) {
    const consoleLog = [];
    // execute the flowchart
    if (answer.params) {
        setParams(flowchart, answer.params);
    }
    await execute(flowchart, consoleLog);
    let correct_check = true;
    if (answer.console && answer.console !== answer.console) {
        console.log('console logs do not match');
        correct_check = false;
    }
    if (answer.model) {
        const answer_model = new GIModel_1.GIModel(answer.model);
        const student_model = flowchart.nodes[flowchart.nodes.length - 1].output.value;
        const result = answer_model.compare(student_model);
        if (!result.matches) {
            correct_check = false;
        }
    }
    if (correct_check) {
        return 1;
    }
    return 0;
}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JhZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dyYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSx3REFBb0Q7QUFDcEQsaURBQStEO0FBQy9ELGtDQUFrQztBQUNsQyxpREFBK0Q7QUFFL0QsNENBQTZEO0FBQzdELHVDQUF5QztBQUN6Qyx3REFBMEM7QUFDMUMsNERBQThDO0FBQzlDLG1EQUFnRDtBQUVoRCxxREFBa0Q7QUFDbEQsc0RBQTBCO0FBRTFCLE1BQU0sZUFBZSxHQUFHOzsrQkFFTyx5QkFBZSxDQUFDLEdBQUc7O3NCQUU1Qix5QkFBZSxDQUFDLEtBQUs7Ozs7Q0FJMUMsQ0FBQztBQUNGLE1BQU0sU0FBUyxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBbUJqQixDQUFDO0FBRUYsT0FBTyxDQUFDLGFBQWEsR0FBRyxLQUFLLEVBQUUsS0FBSyxHQUFHLEVBQUUsRUFBRSxFQUFFO0lBRXpDLE1BQU0sQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7UUFDOUIsTUFBTSxPQUFPLEdBQUcsSUFBSSwrQkFBYyxFQUFFLENBQUM7UUFDckMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsS0FBSyxJQUFJLEVBQUU7WUFDeEIsSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLEdBQUcsRUFBRTtnQkFDeEIsT0FBTyxDQUFDLE1BQU0sT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQ2xHO2lCQUNJO2dCQUNELE9BQU8sQ0FBQztvQkFDSixTQUFTLEVBQUUsS0FBSztvQkFDaEIsT0FBTyxFQUFFLENBQUM7b0JBQ1YsU0FBUyxFQUFFLDBC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