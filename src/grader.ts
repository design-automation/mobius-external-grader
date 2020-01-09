require('module-alias/register')
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
import * as fs from 'fs';
import { checkArgInput } from './utils/parser';

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

const CPrefix = '<div style="padding-left: 20px; border: 2px solid black; background-color: #F5F5F5; border-radius: 5px;">';
const CPostfix = '</div>';
const ErrorPrefix = '<div style="padding-left: 20px; border: 2px solid #E00000; background-color: #FFE9E9; border-radius: 5px; color: #E00000;"><h4>';
const ErrorPostfix = '</h4></div>';

const AMAZON_BUCKET_NAME = 'mooc-s3cf';

export async function gradeFile_URL(event: {'file': String, 
                                            'question': String,
                                            'info': String,
                                            'localTest'?: boolean,
                                            'weight'?: number}) {
    const p = new Promise((resolve) => {
        const request = new XMLHttpRequest();
        request.open('GET', event.file);

        console.log('submission info: ',event.info);

        let localTest = false; 
        if (event.hasOwnProperty('localTest') && event.localTest === true) {
            localTest = true
        }
        let weight = 1; 
        if (event.hasOwnProperty('weight')) {
            weight = event.weight;
        }
        request.onload = async () => {
            if (request.status === 200) {
                resolve(await gradeFile({
                    "file": request.responseText,
                    "question": event.question ,
                    "localTest": localTest,
                    "weight": weight,
                    "info": event.info
                }));
            }
            else {
                resolve({
                    "correct": false,
                    "score": 0,
                    "comment": ErrorPrefix + "Error: Unable to retrieve file." + ErrorPostfix
                });
            }
        };
        request.send();
    });
    return await p;
};

export async function gradeFile(event: any = {}): Promise<any> {
    try {
        // get the params and corresponding answers
        let fromAmazon = true; 
        if (event.hasOwnProperty('localTest') && event.localTest === true) {
            fromAmazon = false
        }
        console.log("Retrieve Answer From Amazon:", fromAmazon)
        // const r = await getAnswer(event, fromAmazon);
        // const answerList = r[0];
        // const answerFile = r[1];
        const answerFile = await getAnswer(event, fromAmazon);
        const answerList = extractAnswerList(answerFile.flowchart);
        const total_score = event.weight;

        if (!answerList || !answerFile) {
            await saveStudentAnswer(event, 0);
            return {
                "correct": true,
                "score": 0,
                "comment": ErrorPrefix + "Error: Unable to find matching answers for this question." + ErrorPostfix
            };
        }

        let normalize = answerList.normalize;
        if (normalize === undefined) { normalize = true; }

        let check_geom_equality = answerList.check_geom_equality;
        if (check_geom_equality === undefined) { check_geom_equality = false; }

        let check_attrib_equality = answerList.check_attrib_equality;
        if (check_attrib_equality === undefined) { check_attrib_equality = false; }

        const mobFile = circularJSON.parse(event.file);
        let score = 0;
        let result: { correct: boolean; score: number; comment: string; };
        let comment = [];
        let count = 0;

        // no params ==> run result check once.
        if (!answerList.params || answerList.params.length === 0) {
            const check = await resultCheck(mobFile.flowchart, answerFile.flowchart, answerList.console, answerList.model, null,
                                            normalize, check_geom_equality, check_attrib_equality, comment, 1);
            const studentScore = JSON.parse((check * total_score / 100).toFixed(2))
            result = {
                "correct": check === 100,
                "score": studentScore,
                "comment": CPrefix + comment.join('') + CPostfix
            };
            await saveStudentAnswer(event, studentScore);
            return result;
        }

        // parse the mob file
        console.log('progress: passed .mob file parsing')


        let missing_params = checkParams(mobFile.flowchart, answerList.params[0]);
        if (missing_params && missing_params.length > 0) {
            
            result = {
                "correct": false,
                "score": 0,
                "comment": ErrorPrefix + 'Error: Missing start node parameters - <i>'+ missing_params.join(', ') + '</i>.' + ErrorPostfix
            };
            console.log(result);
            await saveStudentAnswer(event, 0);
            return result;
        }
        console.log('progress: passed file params check')

        // perform the test for each of the params set
        for (const param of answerList.params) {
            count += 1;
            const check = await resultCheck(mobFile.flowchart, answerFile.flowchart, answerList.console, answerList.model, param,
                                            normalize, check_geom_equality, check_attrib_equality, comment, count);
            score += check;
        }
        score = score * total_score / (count * 100);
        console.log('progress: passed result check (console + model)')
        const studentScore = JSON.parse(score.toFixed(2))
        result = {
            "correct": score === total_score,
            "score": JSON.parse(score.toFixed(2)),
            // "comment": correct_count + '/' + answerList.length
            "comment": CPrefix + comment.join('') + CPostfix
        };
        console.log(result);
        await saveStudentAnswer(event, studentScore);
        return result;
    } catch(err) {
        console.log('Error:',err);
        // console.log('File:', event.file);
        await saveStudentAnswer(event, 0);
        return {
            "correct": false,
            "score": 0,
            "comment": ErrorPrefix + 'Error: Unable to run the Mobius code: '+ err.message + ErrorPostfix
        };
    }
}

export async function runMobFile(fileUrl: string) {
    const p = new Promise((resolve) => {
        const request = new XMLHttpRequest();
        request.open('GET', fileUrl);
        request.onload = async () => {
            if (request.status === 200) {
                const file = circularJSON.parse(request.responseText);
                const resultConsole = [];
                await execute(file.flowchart, resultConsole);
                const s = resultConsole.join('\n');
                resolve([file.flowchart.nodes[2].model, file.flowchart.nodes[2].output.value, s]);
            }
            else {
                resolve([null,null, 'Error: Unable to retrieve file.']);
            }
        };
        request.send();
    });
    return await p;
}

export async function runJavascriptFile(fileUrl: string) {
    const p = new Promise((resolve) => {
        const request = new XMLHttpRequest();
        request.open('GET', fileUrl);
        request.onload = async () => {
            if (request.status === 200) {
                console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
                const file = require(request.responseText);
                console.log('............................')
                resolve([]);
            }
            else {
                resolve([null,null, 'Error: Unable to retrieve file.']);
            }
        };
        request.send();
    });
    return await p;

}

async function getAnswer(event: any = {},fromAmazon = true): Promise<any> {
    if (!fromAmazon) {
        const answerName = event.question;
        const answerFile = circularJSON.parse(await new Promise((resolve) => {
            fs.readFile(`test/${answerName}.mob`, 'utf8', function(err, contents) { resolve(contents); });
        }));
        return answerFile
    }
    var s3 = new AWS.S3();
    // const params1 = { Bucket: "mooc-answers", Key: event.question + '.json'};
    // const res1: any =  await s3.getObject(params1).promise();
    // const answerList = JSON.parse(res1.Body.toString('utf-8'));
    const params2 = { Bucket: AMAZON_BUCKET_NAME, Key: event.question + '.mob'};
    const res2: any =  await s3.getObject(params2).promise();
    const answerFile = circularJSON.parse(res2.Body.toString('utf-8'));
    // return [answerList, answerFile]
    return answerFile
}

function extractAnswerList(flowchart: any): any {
    const answerList = {'model': true, "normalize": true, 'params': []};
    const paramList = [];
    const lines = flowchart.description.split('\n');
    for (const line of lines) {
        let splittedLine = line.split(':');
        if (splittedLine.length < 2) {
            splittedLine = line.split('=');
            if (splittedLine.length < 2){
                continue;
            }
        }
        const param = splittedLine[0].trim();
        if (isParamName(param, flowchart)) {
            let paramVal;
            try {
                paramVal = JSON.parse(splittedLine[1]);
            } catch (ex) {
                continue;
                // paramVal = JSON.parse('[' + splittedLine[1] + ']');
            }
            if (!paramVal) { continue; }
            if (paramVal.constructor !== [].constructor) {
                paramVal = [paramVal];
            }
            paramList.push([param, paramVal]);
        } else if (param !== 'params') {
            try {
                answerList[param] = JSON.parse(splittedLine[1]);
            } catch (ex) {
                continue;
                // answerList[param] = JSON.parse('[' + splittedLine[1] + ']');
            }
        }
    }
    if (paramList.length === 0) {
        return answerList;
    }

    for (let i = 0; i < paramList[0][1].length; i++) {
        const paramSet = {};
        let check = true;
        for (const param of paramList) {
            if (i >= param[1].length) {
                check = false;
                break;
            }
            paramSet[param[0]] = param[1][i];
        }
        if (!check) { break; }
        answerList.params.push(paramSet);
    }
    return answerList;
}

function isParamName(str: string, flowchart: any): boolean {
    for (const prod of flowchart.nodes[0].procedure) {
        if (prod.type === ProcedureTypes.Constant && (prod.args[0].value === str || prod.args[0].jsValue === str)) {
            return true;
        }
    }
    return false;
}

async function saveStudentAnswer(event: any, score: number): Promise<any> {
    // var s3 = new AWS.S3();
    // const now = new Date();
    // const question_name = event.question.split('/').slice(0, -1).join('/')
    // const dateString = now.toISOString().replace(/[\:\.]/g, '-').replace('T', '_')
    // const key = question_name + '/' + event.info + '_-_' + dateString + '.mob'
    // console.log('putting student answer:');
    // console.log('  _ key:', question_name + '/' + event.info + '_-_' + dateString + '.mob');
    // const r = await s3.putObject({
    //     Bucket: "mooc-submissions",
    //     Key: key,
    //     Body: event.file,
    //     ContentType: 'application/json'
    // }).promise()
}


async function resultCheck(studentMob: IFlowchart, answerMob: IFlowchart, checkConsole: boolean, checkModel: boolean, params: {},
                           normalize: boolean, check_geom_equality: boolean, check_attrib_equality: boolean,
                           comment: string[], count: number): Promise<number> {
    let caseComment = `<h4>Test case ${count}:</h4><br>`;
    console.log(`  _ Test case ${count} started`);
    // execute the flowchart
    if (params) {
        setParams(studentMob, params);
        setParams(answerMob, params);
        caseComment += `<p style='padding-left: 20px;'><b><i>Parameters:</i></b></p>`;
        caseComment += '<ul style="padding-left: 40px;">'
        for (const i in params) {
            caseComment += `<li> ${i} = ${params[i]}</li>`
        }
        caseComment += '</ul>'
    }

    const student_console = [];
    const answer_console = [];
    console.log(`    _ Executing the submitted file`);
    await execute(studentMob, student_console);
    console.log(`    _ Executing the answer file`);
    await execute(answerMob, answer_console);
    console.log(`    _ File execution finished`);

    if (checkModel) {
        console.log(`    _ Checking model...`);
        const student_model = studentMob.nodes[studentMob.nodes.length - 1].model;
        const answer_model = answerMob.nodes[answerMob.nodes.length - 1].model;
        let result;
        result = answer_model.compare(student_model, normalize, check_geom_equality, check_attrib_equality);
        // if (normalize) {
        //     // TODO: compare with extra geom...
        // } else {
        //     result = answer_model.compare(student_model);
        // }
        caseComment += result.comment;
        if (result.score !== result.total) {
            caseComment += '<p style="padding-left: 20px;"><b><i>Model Check:</i> failed</b></p>';
            console.log('    + model check: incorrect')
        } else {
            caseComment += '<p style="padding-left: 20px;"><b><i>Model Check:</i> passed</b></p>';
            console.log('    + model check: correct')
        }
        caseComment += '<br>';
        comment.push(caseComment);
        console.log(`    -> Test case ${count} ended; correct_check: ${result.score === result.total}`);
        return result.percent;
    }
    if (checkConsole) {
        console.log(`     _ Checking console...`);
        let score;
        if (student_console.join('') !== answer_console.join('')) {
            score = 0;
            caseComment += '<p style="padding-left: 20px;"><b><i>Console Check:</i> failed</b></p>';
            console.log('    + console check: incorrect')
        } else {
            score = 100;
            caseComment += '<p style="padding-left: 20px;"><b><i>Console Check:</i> passed</b></p>';
            console.log('    + console check: correct')
        }
        caseComment += '<br>';
        comment.push(caseComment);
        console.log(`    -> Test case ${count} ended; correct_check: ${score === 100}`);
        return score;
    }
}

function checkAllArguments(flowchart: IFlowchart): boolean{
    for (const node of flowchart.nodes) {
        if (node.type === 'start') { continue; }
        if (!checkProdsArgs(node.procedure)) { return false; }
        const localFuncs = node.localFunc || [];
        if (!checkProdsArgs(localFuncs)) { return false; }
    }
}
function checkProdsArgs(procedureList: IProcedure[]): boolean {
    for (const prod of procedureList) {
        if (prod.type === ProcedureTypes.Comment || prod.type === ProcedureTypes.Blank) {
            continue
        }
        for (const arg of prod.args) {
            if (!checkArgInput(arg.jsValue)) { return false; }
        }
        if (prod.children) {
            if (!checkProdsArgs(prod.children)) { return false; }
        }
    }
    return true;
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
            if (typeof prod.args[1].jsValue === 'object') {
                prod.args[1].jsValue = JSON.stringify(prod.args[1].jsValue);
                prod.args[1].value = JSON.stringify(prod.args[1].jsValue);
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

        if (!node.enabled) {
            continue;
        }

        try {
            await resolveImportedUrl(node.procedure, true);
        } catch (ex) {
            throw ex;
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
        if (!prod.enabled) {
            continue;
        }
        if (isMainFlowchart && prod.type === ProcedureTypes.globalFuncCall) {
            for (let i = 1; i < prod.args.length; i++) {
                const arg = prod.args[i];
                // args.slice(1).map((arg) => {
                if (arg.type.toString() !== InputType.URL.toString()) { continue; }
                prod.resolvedValue = await CodeUtils.getStartInput(arg, InputType.URL);
            }
            continue;
        }
        if (prod.type !== ProcedureTypes.MainFunction) {continue; }
        for (const func of _parameterTypes.urlFunctions) {
            const funcMeta = func.split('.');
            if (prod.meta.module === funcMeta[0] && prod.meta.name === funcMeta[1]) {
                const arg = prod.args[2];
                if (arg.name[0] === '_') { continue; }
                if (arg.value.indexOf('__model_data__') !== -1) {
                    prod.resolvedValue = arg.value.split('__model_data__').join('');
                } else if (arg.value.indexOf('://') !== -1) {
                    const val = <string>(arg.value).replace(/ /g, '');
                    const result = await CodeUtils.getURLContent(val);
                    if (result === undefined) {
                        prod.resolvedValue = arg.value;
                    } else {
                        prod.resolvedValue = '`' + result + '`';
                    }
                    break;
                }
                break;
            }
        }
    }
}

// async function resolveImportedUrl(prodList: IProcedure[], isMainFlowchart?: boolean) {
//     for (const prod of prodList) {
//         if (prod.children) {await resolveImportedUrl(prod.children); }
//         if (isMainFlowchart && prod.type === ProcedureTypes.globalFuncCall) {
//             for (let i = 1; i < prod.args.length; i++) {
//                 const arg = prod.args[i];
//                 // args.slice(1).map((arg) => {
//                 if (arg.type.toString() !== InputType.URL.toString()) { continue; }
//                 prod.resolvedValue = await CodeUtils.getStartInput(arg, InputType.URL);
//             }
//             continue;
//         }
//         if (prod.type !== ProcedureTypes.MainFunction) {continue; }
//         for (const func of _parameterTypes.urlFunctions) {
//             const funcMeta = func.split('.');
//             if (prod.meta.module === funcMeta[0] && prod.meta.name === funcMeta[1]) {
//                 for (const arg of prod.args) {
//                     if (arg.name[0] === '_') { continue; }
//                     if (arg.value.indexOf('__model_data__') !== -1) {
//                         prod.resolvedValue = arg.value.split('__model_data__').join('');
//                     } else if (arg.value.indexOf('://') !== -1) {
//                         const val = <string>arg.value.replace(/ /g, '');
//                         const result = await CodeUtils.getURLContent(val);
//                         if (result === undefined) {
//                             prod.resolvedValue = arg.value;
//                         } else {
//                             prod.resolvedValue = '`' + result + '`';
//                         }
//                         break;
//                     }
//                 }
//                 break;
//             }
//         }
//     }
// }

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
        // console.log(fnString)

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

