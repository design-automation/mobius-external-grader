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
                const newParams = { Bucket: "mooc-answers", Key: param };
                const answerResponse = await s3.getObject(newParams).promise();
                answerList.push(JSON.parse(answerResponse.Body.toString('utf-8')));
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
        // const answerList = [require('../test_foreach1.json')];
        // parse the mob file
        const mobFile = circularJSON.parse(event.file);
        let score = 1;
        let correct_count = 0;
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
            const check = await resultCheck(mobFile.flowchart, test);
            if (!check) {
                score = 0;
            }
            else {
                correct_count += 1;
            }
        }
        return {
            "correct": score > 0,
            "score": score,
            "comment": correct_count + '/' + answerList.length
        };
    }
    catch (err) {
        // throw err;
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
    return correct_check;
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