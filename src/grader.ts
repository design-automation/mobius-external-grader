import { CodeUtils } from './model/code/code.utils';
import { IFlowchart, FlowchartUtils } from './model/flowchart';
// import { INode } from './node';
import { IProcedure, ProcedureTypes } from './model/procedure';

import { _parameterTypes, _varString } from './core/modules';
import { InputType } from './model/port';
import * as Modules from './core/modules';
import * as circularJSON from 'circular-json';
import { XMLHttpRequest } from 'xmlhttprequest';
import { INode } from './model/node';
import { GIModel } from './libs/geo-info/GIModel';
import AWS from 'aws-sdk';

const mergeInputsFunc = `
function mergeInputs(models){
    let result = __modules__.${_parameterTypes.new}();
    for (let model of models){
        __modules__.${_parameterTypes.merge}(result, model);
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
        const request = new XMLHttpRequest();
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

export const gradeFile = async (event: any = {}): Promise<any> => {
    try {
        // get the params and corresponding answers
        // TODO: allowing S3

        const answerList = []
        var s3 = new AWS.S3();
        const params = { Bucket: "mooc-answers", Key: event.question };
        const res: any =  await s3.getObject(params).promise()
        const answerParams = JSON.parse(res.Body.toString('utf-8'));
        for (const param of answerParams) {
            try {
                const newParams = { Bucket: "mooc-answers", Key: param };
                const answerResponse = await s3.getObject(newParams).promise()
                answerList.push(JSON.parse(answerResponse.Body.toString('utf-8')));
            } catch (ex) {
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
            }
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
                missing_params = checkParams(mobFile.flowchart, answerList[0].params)
            }
            break;
        }
        if (missing_params && missing_params.length > 0) {
            return {
                "correct": false,
                "score": 0,
                "comment": 'Error: Missing start node parameters - '+ missing_params.join(',') + '.'
            };
        }

        // perform the test for each of the params set
        for (const test of answerList) {
            const check = await resultCheck(mobFile.flowchart, test);
            if (!check) {
                score = 0
            } else {
                correct_count += 1;
            }
        }
        return {
            "correct": score > 0,
            "score": score,
            "comment": correct_count + '/' + answerList.length
        };
    } catch(err) {
        // throw err;
        return {
            "correct": false,
            "score": 0,
            "comment": 'Error: ' + err.message
        };
    }
}

async function resultCheck(flowchart: IFlowchart, answer: any): Promise<boolean> {
    const consoleLog = [];
    // execute the flowchart
    if (answer.params) {
        setParams(flowchart, answer.params);
    }
    await execute(flowchart, consoleLog);

    let correct_check = true;
    if (answer.console && answer.console !== answer.console) {
        console.log('console logs do not match')
        correct_check = false
    }
    if (answer.model) {
        const answer_model = new GIModel(answer.model);
        const student_model = flowchart.nodes[flowchart.nodes.length - 1].output.value;
        
        const result = answer_model.compare(student_model);
        if (!result.matches) {
            correct_check = false    
        }
    }
    return correct_check;
}

function checkParams(flowchart: IFlowchart, params: any): string[]{
    const missing_params = [];
    for (const param in params) {
        let check = false;
        for (const prod of flowchart.nodes[0].procedure){
            if (prod.type === ProcedureTypes.Constant && 
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

function setParams(flowchart: IFlowchart, params: any) {
    for (const prod of flowchart.nodes[0].procedure){
        if (prod.type === ProcedureTypes.Constant) {
            if (params[prod.args[0].value] !== undefined) {
                prod.args[1].jsValue = params[prod.args[0].value];
                prod.args[1].value = params[prod.args[0].value];
            }
            if (params[prod.args[0].jsValue] !== undefined) {
                prod.args[1].jsValue = params[prod.args[0].jsValue]
                prod.args[1].value = params[prod.args[0].jsValue]
            }
        }
    }
}

function getParams(flowchart: IFlowchart): any {
    const params = {};
    for (const prod of flowchart.nodes[0].procedure){
        if (prod.type === ProcedureTypes.Constant) {
            params[prod.args[0].value] = prod.args[1].jsValue||prod.args[1].value;
        }
    }
    return params;
}

async function execute(flowchart: any, consoleLog) {

    // reset input of all nodes except start & resolve all async processes (file reading + get url content)
    for (const node of flowchart.nodes) {
        if (node.type !== 'start') {
            if (node.input.edges) {
                node.input.value = undefined;
            }
        }

        try {
            await resolveImportedUrl(node.procedure, true);
        } catch (ex) {
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
                    arg.jsValue = arg.value
                }
            }
            if (prod.type === ProcedureTypes.Return || prod.type === ProcedureTypes.Comment || !prod.enabled) { continue; }
            if (prod.argCount > 0 && prod.args[0].invalidVar) {
                node.hasError = true;
                prod.hasError = true;
                InvalidECheck = true;
            }
            if (prod.type === ProcedureTypes.Constant) {

                // Following part is for compatibility with older files
                // to be removed...
                if (!prod.args[1].value && prod.args[1].default) {
                    prod.args[1].value = prod.args[1].default;
                }
                // remove ends!

                try {
                    prod.resolvedValue = await CodeUtils.getStartInput(prod.args[1], prod.meta.inputMode);
                } catch (ex) {
                    node.hasError = true;
                    prod.hasError = true;
                    if (ex.message.indexOf('HTTP') !== -1 || ex.message.indexOf('File Reading') !== -1) {
                        throw(ex);
                    }
                    InvalidECheck = true;
                }
                if (!prod.args[0].value || (!prod.args[1].value && prod.args[1].value !== 0)) {
                    node.hasError = true;
                    prod.hasError = true;
                    EmptyECheck = true;
                }
            } else {
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

function executeFlowchart(flowchart: IFlowchart, consoleLog) {
    let globalVars = '';
    const constantList = {};

    // reordering the flowchart
    if (!flowchart.ordered) {
        FlowchartUtils.orderNodes(flowchart);
    }

    // get the string of all imported functions
    const funcStrings = {};
    for (const func of flowchart.functions) {
        funcStrings[func.name] =  CodeUtils.getFunctionString(func);
    }
    if (flowchart.subFunctions) {
        for (const func of flowchart.subFunctions) {
            funcStrings[func.name] =  CodeUtils.getFunctionString(func);
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

async function resolveImportedUrl(prodList: IProcedure[], isMainFlowchart?: boolean) {
    for (const prod of prodList) {
        if (prod.children) {await resolveImportedUrl(prod.children); }
        if (isMainFlowchart && prod.type === ProcedureTypes.Imported) {
            for (let i = 1; i < prod.args.length; i++) {
                const arg = prod.args[i];
                // args.slice(1).map((arg) => {
                if (arg.type.toString() !== InputType.URL.toString()) { continue; }
                prod.resolvedValue = await CodeUtils.getStartInput(arg, InputType.URL);
            }
            continue;
        }
        if (prod.type !== ProcedureTypes.Function) {continue; }
        for (const func of _parameterTypes.urlFunctions) {
            const funcMeta = func.split('.');
            if (prod.meta.module === funcMeta[0] && prod.meta.name === funcMeta[1]) {
                for (const arg of prod.args) {
                    if (arg.name[0] === '_') { continue; }
                    if (arg.value.indexOf('://') !== -1) {

                    const val = <string>arg.value.replace(/ /g, '');

                        const result = await CodeUtils.getURLContent(val);
                        if (result === undefined) {
                            prod.resolvedValue = arg.value;
                        } else {
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

function executeNode(node: INode, funcStrings, globalVars, constantList, consoleLog): string {
    const params = {'currentProcedure': [''], 'console': [], 'constants': constantList};
    let fnString = '';
    try {
        const usedFuncs: string[] = [];
        const codeResult = CodeUtils.getNodeCode(node, true, undefined, usedFuncs);
        const usedFuncsSet = new Set(usedFuncs);
        // if process is terminated, return

        const codeRes = codeResult[0];
        const nodeCode = codeRes[0];

        // Create function string:
        // start with asembling the node's code
        fnString =  '\n\n//  ------ MAIN CODE ------\n' +
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
        fnString = _varString + globalVars + fnString;

        // add the merge input function and the print function
        fnString = mergeInputsFunc + '\n' + printFunc + '\n' + fnString;

        // ==> generated code structure:
        //  1. mergeInputFunction
        //  2. constants
        //  3. user functions
        //  4. main node code

        params['model'] = _parameterTypes.newFn();
        _parameterTypes.mergeFn(params['model'], node.input.value);

        // create the function with the string: new Function ([arg1[, arg2[, ...argN]],] functionBody)
        const fn = new Function('__modules__', '__params__', fnString);
        // execute the function

        const result = fn(Modules, params);

        node.output.value = result;
        node.hasExecuted = true;
        node.input.edges.forEach( edge => {
            const inputNode = edge.source.parentNode;
            if (inputNode.output.edges.length > 1) {
                for (const outputEdge of inputNode.output.edges) {
                    if (!outputEdge.target.parentNode.hasExecuted) { return; }
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
    } catch (ex) {
        throw ex;
    }
}

