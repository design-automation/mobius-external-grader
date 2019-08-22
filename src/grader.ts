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

export const pythonList = `
function pythonList(x, l){
    if (x < 0) {
        return x + l;
    }
    return x;
}
`;
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
        console.log(event.info);
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
        // const answerList = []
        // var s3 = new AWS.S3();
        // const params = { Bucket: "mooc-answers", Key: event.question };
        // const res: any =  await s3.getObject(params).promise()
        // const answerParams = JSON.parse(res.Body.toString('utf-8'));
        // for (const param of answerParams) {
        //     try {
        //         const newParams = { Bucket: "mooc-answers", Key: param };
        //         const answerResponse = await s3.getObject(newParams).promise()
        //         answerList.push(JSON.parse(answerResponse.Body.toString('utf-8')));
        //     } catch (ex) {
        //         console.log(`Error: File ${param} does not exist in S3 bucket "mooc-answers"`);
        //         continue;
        //     }
        // }

        const answerList = [require('../SCT_W3_Assignment.json')];

        let result;
        if (answerList.length === 0) {
            result = {
                "correct": true,
                "score": 0,
                "comment": "Error: Unable to find answers for this question."
            };
            console.log(result);
            return result;

        }

        // parse the mob file
        const mobFile = circularJSON.parse(event.file);
        console.log('progress: passed .mob file parsing')

        let score = 1;

        let missing_params;
        for (const answer of answerList) {
            if (answer.params) {
                missing_params = checkParams(mobFile.flowchart, answerList[0].params);
            }
            break;
        }
        if (missing_params && missing_params.length > 0) {
            
            result = {
                "correct": false,
                "score": 0,
                "comment": 'Error: Missing start node parameters - '+ missing_params.join(',') + '.'
            };
            console.log(result);
            return result;
        }
        console.log('progress: passed file params check')

        let comment = [];
        let count = 0;
        // perform the test for each of the params set
        for (const test of answerList) {
            count += 1;
            const check = await resultCheck(mobFile.flowchart, test, comment, count);
            if (!check) {
                score = 0
            }
        }
        console.log('progress: passed result check (console + model)')
        result = {
            "correct": score > 0,
            "score": score,
            // "comment": correct_count + '/' + answerList.length
            "comment": comment.join('')
        };
        console.log(result);
        return result;
    } catch(err) {
        console.log('Error:',err);
        console.log('File:', event.file);
        return {
            "correct": false,
            "score": 0,
            "comment": 'Error: Unable to run the Mobius code: '+ err.message
        };
    }
}

async function resultCheck(flowchart: IFlowchart, answer: any, comment: string[], count: number): Promise<boolean> {
    const consoleLog = [];
    let caseComment = `<h4>Test case ${count}:</h4><br>`;
    console.log(`  _ Test case ${count} started`);
    // execute the flowchart
    if (answer.params) {
        setParams(flowchart, answer.params);
        caseComment += `<p style='padding-left: 20px;'><b><i>Parameters:</i></b></p>`;
        caseComment += '<ul style="padding-left: 40px;">'
        for (const i in answer.params) {
            caseComment += `<li> ${i.slice(0, -1)} = ${answer.params[i]}</li>`
        }
        caseComment += '</ul>'
    }
    await execute(flowchart, consoleLog);

    let correct_check = true;
    if (answer.console) {
        if (answer.console !== answer.console) {
            caseComment += '<p style="padding-left: 20px;"><b><i>Console Check:</i> failed</b></p>';
            correct_check = false
            console.log('    + console check: incorrect')
        } else {
            caseComment += '<p style="padding-left: 20px;"><b><i>Console Check:</i> passed</b></p>';
            console.log('    + console check: correct')
        }
    }
    if (answer.model) {
        const answer_model = new GIModel(answer.model);
        const student_model = new GIModel(flowchart.nodes[flowchart.nodes.length - 1].model.getData());
        const result = student_model.compare(answer_model);
        caseComment += result.comment;
        if (!result.matches) {
            caseComment += '<p style="padding-left: 20px;"><b><i>Model Check:</i> failed</b></p>';
            correct_check = false    
            console.log('    + model check: incorrect')
        } else {
            caseComment += '<p style="padding-left: 20px;"><b><i>Model Check:</i> passed</b></p>';
            console.log('    + model check: correct')
        }
    }
    caseComment += '<br>';
    comment.push(caseComment);
    console.log(`    -> Test case ${count} ended; correct_check: ${correct_check}`);
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
        fnString = pythonList + '\n' + mergeInputsFunc + '\n' + printFunc + '\n' + fnString;

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

        if (node.type === 'end') {
            node.output.value = result;
            node.model = params['model'];
        } else {
            node.output.value = params['model'];
        }
        node.hasExecuted = true;
        node.input.edges.forEach( edge => {
            const inputNode = edge.source.parentNode;
            if (inputNode.output.edges.length > 1) {
                for (const outputEdge of inputNode.output.edges) {
                    if (!outputEdge.target.parentNode.hasExecuted) { return; }
                }
            }
            inputNode.output.value = null;
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

