require('module-alias/register');
import { CodeUtils } from './model/code/code.utils';
import { IFlowchart, FlowchartUtils } from './model/flowchart';
// import { INode } from './node';
import { IProcedure, ProcedureTypes } from './model/procedure';

import { _parameterTypes, _varString } from './core/modules';
import { InputType } from './model/port';
import * as Modules from './core/modules';
import * as circularJSON from 'circular-json';
import { INode } from './model/node';
import { GIModel } from './libs/geo-info/GIModel';
import AWS from 'aws-sdk';
import * as fs from 'fs';
import { checkArgInput } from './utils/parser';
import { XMLHttpRequest } from 'xmlhttprequest';
import fetch from 'node-fetch';
import { isArray } from 'util';
import JSZip from 'jszip';
import { IdGenerator } from './utils';
import { range, random } from 'underscore';

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
    try {
        result.debug = __debug__;
    } catch (ex) {}
    for (let model of models){
        __modules__.${_parameterTypes.merge}(result, model);
    }
    return result;
}
function duplicateModel(model){
    const result = model.clone();
    try {
        result.debug = __debug__;
    } catch (ex) {}
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
        if (!event.hasOwnProperty('localTest') || event.localTest === false) {
            await saveStudentAnswer(event);
        }
        if (!answerList || !answerFile) {
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

        console.log(`  _ Test case ${count} started`);
        const missingParams = updateParam(answerFile.flowchart, mobFile.flowchart)
        if (missingParams && missingParams.length > 0) {
            result = {
                "correct": false,
                "score": 0,
                "comment": ErrorPrefix + 'Error: Missing start node parameters - <i>'+ missingParams.join(', ') + '</i>.' + ErrorPostfix
            };
            console.log(result);
            return result;
        }
    
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
        return result;
    } catch(err) {
        console.log('Error:',err);
        // console.log('File:', event.file);
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

export async function runJavascriptFile(event: {'file': string, 'parameters': {}}) {
    const p = new Promise((resolve) => {
        fetch(event.file).then(res => {
            if (!res.ok) {
                resolve('HTTP Request Error: request file timeout from url ' + event.file);
                return '';
            }
            return res.text();
        }).then(body => {
            const splittedString = body.split('/** * **/');
            const argStrings = splittedString[0].split('// Parameter:');
            const args = [];
            if (argStrings.length > 1) {
                for (let i = 1; i < argStrings.length - 1; i++) {
                    args.push(JSON.parse(argStrings[i]));
                }
                args.push(JSON.parse(argStrings[argStrings.length - 1].split('function')[0]));
            }
            const val0 = args.map(arg => arg.name);
            const val1 = args.map(arg => {
                if (event.parameters && event.parameters.hasOwnProperty(arg.name)) {
                    return event.parameters[arg.name];
                }
                return arg.value;
            });
            const fn = new Function('__modules__', ...val0, splittedString[1]);
            const result = fn(Modules, ...val1);
            result.model = result.model.getData();
            resolve("successful");
        });
    });
    return await p;
}


export async function runGen(data) {
    const docClient = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'});
    if (data.genUrl && data.evalUrl) {
        const p = new Promise((resolve) => {
            const request = new XMLHttpRequest();
            request.open('GET', data.genUrl);
            request.onload = async () => {
                if (request.status === 200) {
                    const splittedString = request.responseText.split('/** * **/');
                    const argStrings = splittedString[0].split('// Parameter:');
                    const args = [];
                    if (argStrings.length > 1) {
                        for (let i = 1; i < argStrings.length - 1; i++) {
                            args.push(JSON.parse(argStrings[i]));
                        }
                        args.push(JSON.parse(argStrings[argStrings.length - 1].split('function')[0]));
                    }
                    const val0 = args.map(arg => arg.name);
                    const val1 = args.map(arg => {
                        if (data.params && data.params.hasOwnProperty(arg.name)) {
                            return data.params[arg.name];
                        }
                        return arg.value;
                    });
                    const addedString = `__debug__ = false;\n__model__ = null;\n`
                    const fn = new Function('__modules__', ...val0, addedString + splittedString[1]);
                    const result = fn(Modules, ...val1);
                    const model = JSON.stringify(result.model.getData()).replace(/\\/g, '\\\\');

                    const params = {
                        TableName: 'GenEvalParam',
                        Item: {
                            'ParamID': data.ParamID,
                            'JobID': data.JobID,
                            'GenID': data.GenID,
                            'params': data.params,
                            // 'genUrl': data.genUrl,
                            // 'evalUrl': data.evalUrl,
                            'model': model,
                            'live': true
                        }
                    };
                    docClient.put(params, function (err, data) {
                        if (err) {
                            console.log('Error placing gen data:', err);
                            resolve(false);
                        }
                        else {
                            console.log('successfully placed data');
                            resolve(true);
                        }
                    });
                }
                else {
                    console.log('... error getting file:', request)
                    resolve(false);
                }
            };
            request.send();
        });
        return await p;
    }
    return false
}

export async function runEval(recordInfo) {
    const docClient = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'});
    console.log('param id:', recordInfo.ParamID);
    const p = new Promise((resolve) => {
        docClient.get({
            "TableName": "GenEvalParam",
            "Key": {
                "ParamID":  recordInfo.ParamID
            },
            "ProjectionExpression": 'model',
            "ConsistentRead": true
        }, function(err, record) {
            if (err) {
              console.log("Error", err);
              resolve(null);
            } else {
              resolve(record.Item);
            }
        });
    });
    const data: any = await p;
    if (data === null) {
        return false;
    }

    // console.log('DynamoDB Record: %j', record.dynamodb);
    // const data = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
    if (recordInfo.genUrl && recordInfo.evalUrl) {
        const p = new Promise((resolve) => {
            const request = new XMLHttpRequest();
            request.open('GET', recordInfo.evalUrl);
            request.onload = async () => {
                if (request.status === 200) {
                    const splittedString = request.responseText.split('/** * **/');
                    const argStrings = splittedString[0].split('// Parameter:');
                    const args = [];
                    if (argStrings.length > 1) {
                        for (let i = 1; i < argStrings.length - 1; i++) {
                            args.push(JSON.parse(argStrings[i]));
                        }
                        args.push(JSON.parse(argStrings[argStrings.length - 1].split('function')[0]));
                    }
                    const val0 = args.map(arg => arg.name);
                    const val1 = args.map(arg =>arg.value);

                    const addedString = `__debug__ = false;\n__model__ = \`${data.model}\`;\n`
                    const fn = new Function('__modules__', ...val0, addedString + splittedString[1]);
                    const result = fn(Modules, ...val1);
                    resolve(result.result);

                    // const params = {
                    //     TableName: 'GenEvalParam',
                    //     Key:{
                    //         "ParamID": recordInfo.ParamID
                    //     },
                    //     UpdateExpression: "set score = :s",
                    //     ExpressionAttributeValues:{
                    //         ":s": result.result
                    //     },
                    //     ReturnValues: "UPDATED_NEW"
                    // };

                    // docClient.update(params, function (err, data) {
                    //     if (err) {
                    //         console.log('Error placing eval data:', err);
                    //         resolve(false);
                    //     }
                    //     else {
                    //         console.log('successfully placed data');
                    //         resolve(result.result);
                    //     }
                    // });

                }
                else {
                    resolve(false);
                }
            };
            request.send();
        });
        return await p;
    }
    return false
}

export async function runGenTest(data, genFile) {
    const p = new Promise((resolve) => {
        const splittedString = genFile.split('/** * **/');
        const argStrings = splittedString[0].split('// Parameter:');
        const args = [];
        if (argStrings.length > 1) {
            for (let i = 1; i < argStrings.length - 1; i++) {
                args.push(JSON.parse(argStrings[i]));
            }
            args.push(JSON.parse(argStrings[argStrings.length - 1].split('function')[0]));
        }
        const val0 = args.map(arg => arg.name);
        const val1 = args.map(arg => {
            if (data.params && data.params.hasOwnProperty(arg.name)) {
                return data.params[arg.name];
            }
            return arg.value;
        });
        const addedString = `__debug__ = false;\n__model__ = null;\n`
        const fn = new Function('__modules__', ...val0, addedString + splittedString[1]);
        const result = fn(Modules, ...val1);
        const model = JSON.stringify(result.model.getData()).replace(/\\/g, '\\\\');

        const params = {
            TableName: 'GenEvalParam',
            Item: {
                'ParamID': data.ParamID,
                'params': data.params,
                'genUrl': data.genUrl,
                'evalUrl': data.evalUrl,
                'model': model,
                'live': true
            }
        };
        resolve(params);
    });
    return await p;
}

export async function runEvalTest(recordInfo, record, evalFile) {
    const data = record.Item
    if (data === null) {
        return false;
    }
    const p = new Promise((resolve) => {
        const splittedString = evalFile.split('/** * **/');
        const argStrings = splittedString[0].split('// Parameter:');
        const args = [];
        if (argStrings.length > 1) {
            for (let i = 1; i < argStrings.length - 1; i++) {
                args.push(JSON.parse(argStrings[i]));
            }
            args.push(JSON.parse(argStrings[argStrings.length - 1].split('function')[0]));
        }
        const val0 = args.map(arg => arg.name);
        const val1 = args.map(arg =>arg.value);

        const addedString = `__debug__ = false;\n__model__ = \`${data.model}\`;\n`
        const fn = new Function('__modules__', ...val0, addedString + splittedString[1]);
        const result = fn(Modules, ...val1);
        resolve(result.result)
    });
    return await p;
}


function generateParamVariations(params) {
    const paramVariations = []
    let totalCount = 1;
    for (const param of params) {
        if (param.hasOwnProperty('step')) {
            const paramList = [];
            let steps = (param.max - param.min) / param.step;
            for (let i = 0; i <= steps; i++) {
                paramList.push(param.min + param.step * i);
            }
            paramVariations.push([param.name, paramList]);
            totalCount = totalCount * paramList.length;
        } else {
            paramVariations.push([param.name, [param.value]]);
        }
    }
    paramVariations.push(totalCount)
    return paramVariations
}

function mutateDesign(existing_design, params_details, all_params, newIDNum) {
    // const newID = existing_design.ParamID.split('_');
    // newID[newID.length - 1] = newIDNum
    const new_designs = {
        'ParamID': existing_design.JobID + '_' + newIDNum,
        'JobID': existing_design.JobID,
        'GenID': newIDNum,
        'genUrl': existing_design.genUrl,
        'evalUrl': existing_design.evalUrl,
        'params': null,
        'score': null,
        'live': true,
        'scoreWritten': false,
        'deadWritten': false,
        'expiry': existing_design.expiry
    };
    while (true) {
        const new_param = {}
        for (const param of params_details){
            if (param.hasOwnProperty('step')) {
                let pos_neg = Math.floor(Math.random() * 2) == 0 ? -1 : 1
    
                const existing_step = (existing_design.params[param.name] - param.min) / param.step;
                if (existing_design.params[param.name] === param.min) {
                    pos_neg = 1
                } else if (existing_design.params[param.name] === param.max) {
                    pos_neg = -1
                }
                let added_val = Math.pow(Math.random(), 10);
                if (pos_neg < 0) {
                    added_val = - 1 - Math.floor(added_val * (existing_design.params[param.name] - param.min) / param.step)
                } else {
                    added_val = 1 + Math.floor(added_val * (param.max - existing_design.params[param.name]) / param.step) 
                }
                new_param[param.name] = param.min + (existing_step + added_val) * param.step;
            } else {
                new_param[param.name] = existing_design.params[param.name];
            }
        }
        if (all_params.indexOf(new_param) === -1) {
            new_designs.params = new_param;
            all_params.push(new_param)
            break;
        }
    }
    return new_designs
}

// function getRandomDesign(designList, tournamentSize, eliminateSize) {
// }

function tournamentSelect(liveDesignList: any[], deadDesignList: any[], tournament_size: number, survival_size: number) {
    // select tournamentSize number of designs from live list
    let selectedDesigns = []
    for (let i = 0; i < tournament_size; i++) {
        if (liveDesignList.length === 0) { break; }
        const randomIndex =  Math.floor(Math.random() * liveDesignList.length);
        selectedDesigns.push(liveDesignList.splice(randomIndex, 1)[0])
    }
    // sort the selectedDesigns list in ascending order according to each design's score
    selectedDesigns = selectedDesigns.sort((a, b) =>  a.score - b.score)
    // mark the first <eliminateSize> entries as dead and add them to the deadDesignList,
    // add the rest back to the liveDesignList
    for (let j = 0; j < selectedDesigns.length; j++) {
        if (j < survival_size) {
            selectedDesigns[j].live = false;
            deadDesignList.push(selectedDesigns[j])
        } else {
            liveDesignList.push(selectedDesigns[j])
        }
    }
}

export async function runGenEvalController(event) {
    const docClient = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'});
    const lambda = new AWS.Lambda({region: 'us-east-1'});

    if (!event.genUrl || !event.evalUrl) { return false; }
    let population_size = 20;
    if (event.population_size) {
        population_size = event.population_size;
    }
    let maxDesigns = 500;
    if (event.maxDesigns) {
        maxDesigns = event.maxDesigns;
    }
    let tournament_size = 5;
    if (event.tournament_size) {
        tournament_size = event.tournament_size;
    }
    let survival_size = 2;
    if (event.survival_size) {
        survival_size = event.survival_size;
    }
    let expiration = 3600
    // let expiration = 86400
    if (event.expiration) {
        expiration = event.expiration;
    }
    const expiration_time = Math.round(Date.now() / 1000) + expiration;

    const genPromise = new Promise((resolve) => {
        const request = new XMLHttpRequest();
        request.open('GET', event.genUrl);
        request.onload = async () => {
            if (request.status === 200) {
                const splittedString = request.responseText.split('/** * **/');
                const argStrings = splittedString[0].split('// Parameter:');
                const args = [];
                if (argStrings.length > 1) {
                    for (let i = 1; i < argStrings.length - 1; i++) {
                        args.push(JSON.parse(argStrings[i]));
                    }
                    args.push(JSON.parse(argStrings[argStrings.length - 1].split('function')[0]));
                }
                args.forEach( x => {
                    if (x.min && typeof x.min !== 'number') {
                        x.min = Number(x.min);
                    }
                    if (x.max && typeof x.max !== 'number') {
                        x.max = Number(x.max);
                    }
                    if (x.step && typeof x.step !== 'number') {
                        x.step = Number(x.step);
                    }
                })
                resolve([request.responseText, args]);
            }
            else {
                resolve(null);
            }
        };
        request.send();
    });
    const evalPromise = new Promise<String> ((resolve) => {
        const request = new XMLHttpRequest();
        request.open('GET', event.evalUrl);
        request.onload = async () => {
            if (request.status === 200) {
                resolve(request.responseText);
            }
            else {
                resolve(null);
            }
        };
        request.send();
    });
    const genResult = await genPromise;
    const evalFile = await evalPromise;
    if (!evalFile || !genResult) {
        return false;
    }
    const genFile = genResult[0];
    const params = genResult[1];
    const paramVariations = generateParamVariations(params)
    const totalCount = paramVariations.pop();
    if (!params) { return false; }
    let paramList = []

    // if total number of variations is fewer than number of maxDesigns
    // -> find all designs
    if (totalCount < maxDesigns) {
        paramList.push({});
        const newParamList = []
        for (const p of paramVariations) {
            const paramName = p[0]
            const variations = p[1]
            for (const paramSet of paramList){
                for (const param of variations) {
                    const newParamSet = JSON.parse(JSON.stringify(paramSet));
                    newParamSet[paramName] = param;
                    newParamList.push(newParamSet)
                }
            }
            paramList = newParamList;
        }
        if (totalCount > maxDesigns) {
            for (let i = paramList.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = paramList[i];
                paramList[i] = paramList[j];
                paramList[j] = temp;
            }
            paramList = paramList.slice(0, maxDesigns);
        }

    // if total number of variations is more than number of maxDesigns
    // -> randomly select 20 unique parameter sets
    } else {
        while (paramList.length < population_size) {
            const paramSet = {}
            for (const p of paramVariations) {
                const paramName = p[0]
                const variations = p[1]
                if (variations.length == 1) {
                    paramSet[paramName] = variations[0];
                    continue;
                }
                const randI = Math.floor(Math.random() * variations.length);
                paramSet[paramName] = variations[randI];
            }
            if (paramList.indexOf(paramSet) === -1) {
                paramList.push(paramSet)
            }
        }
    }

    let ID
    if (event.id) {
        ID = event.id
    } else {
        ID = process.hrtime();
        ID = ID[0].toString() + ID[1].toString();
    }

    const liveEntries = [];
    const deadEntries = [];
    const updateDynamoPromises = [];

    for (let i = 0; i < paramList.length; i++) {
        const paramSet = paramList[i];
        liveEntries.push({
            'ParamID': ID + '_' + i,
            'JobID': ID.toString(),
            'GenID': i.toString(),
            'genUrl': event.genUrl,
            'evalUrl': event.evalUrl,
            'params': paramSet,
            'score': null,
            'evalResult': null,
            'live': true,
            'scoreWritten': false,
            'deadWritten': false,
            'expiry': expiration_time
        });
    }
    let designCount = liveEntries.length;
    while (designCount < maxDesigns) {
        const mutationNumber = liveEntries.length < (maxDesigns - designCount)? liveEntries.length : maxDesigns - designCount;
        for (let i = 0; i < mutationNumber; i++) {
            liveEntries.push(mutateDesign(liveEntries[i], params, paramList, designCount + i));
        }
        const promiseList = [];
        for (const entry of liveEntries) {
            if (entry.score) { continue; }
            promiseList.push(new Promise(resolve => {
                const entryBlob = JSON.stringify(entry);
                lambda.invoke({
                    FunctionName: 'generate_design_func',
                    Payload: entryBlob
                }, (err, successCheck) => {
                    if (err || !successCheck) {
                        console.log('Error:', err)
                        resolve(null);
                    } else {
                        lambda.invoke({
                            FunctionName: 'evaluate_design_func',
                            Payload: entryBlob
                        }, (err, response) => {
                            if (err || !response) {
                                console.log('Error:', err)
                                resolve(null);
                            } else {
                                try {
                                    const evalResult = JSON.parse(response.Payload.toString());
                                    // const evalScore = new Number(response.Payload);
                                    entry.evalResult = evalResult;
                                    entry.score = evalResult.score;
                                    resolve(null);
                                } catch (ex) {
                                    resolve(null);
                                }
                            }
                        })
                    }
                })

                // runGenTest(entry, genFile).then( result => {
                //     if (result) {
                //         console.log('success gen: ',entry.ParamID)
                //         runEvalTest(entry, result, evalFile).then( (evalResult: any) => {
                //             entry.score = evalResult.score;
                //             entry.evalResult = evalResult;
                //             resolve(null);
                //         })
                //     } else {
                //         console.log('failed gen:', entry.ParamID)
                //     }
                // });
            }));
        }
        await Promise.all(promiseList);
        while (liveEntries.length > population_size) {
            const elimSize = survival_size <= (liveEntries.length - population_size) ? survival_size : liveEntries.length - population_size;
            tournamentSelect(liveEntries, deadEntries, tournament_size, elimSize)
        }
        designCount = liveEntries.length + deadEntries.length;

        for (const entry of liveEntries){
            if (!entry.scoreWritten) {
                entry.scoreWritten = true;
                const updateEntry = {
                    TableName: 'GenEvalParam',
                    Key:{
                        "ParamID": entry.ParamID
                    },
                    UpdateExpression: "set score=:s, evalResult=:e",
                    ExpressionAttributeValues:{
                        ":s": entry.score,
                        ":e": entry.evalResult
                    },
                    ReturnValues: "UPDATED_NEW"
                };
                const p = new Promise( resolve => {
                    docClient.update(updateEntry, function (err, data) {
                        if (err) {
                            console.log('Error placing data:', err);
                            resolve(null);
                        }
                        else {
                            resolve(null);
                        }
                    });
                })
                updateDynamoPromises.push(p)
            }
        }

        for (const entry of deadEntries){
            if (!entry.deadWritten) {
                entry.deadWritten = true;
                const updateEntry = {
                    TableName: 'GenEvalParam',
                    Key:{
                        "ParamID": entry.ParamID
                    },
                    UpdateExpression: "set live = :l, score=:s, evalResult=:e, expirationTime=:x",
                    ExpressionAttributeValues:{
                        ":l": false,
                        ":s": entry.score,
                        ":e": entry.evalResult,
                        ":x": entry.expiry
                    },
                    ReturnValues: "UPDATED_NEW"
                };
                const p = new Promise( resolve => {
                    docClient.update(updateEntry, function (err, data) {
                        if (err) {
                            console.log('Error placing data:', err);
                            resolve(null);
                        }
                        else {
                            resolve(null);
                        }
                    });
                })
                updateDynamoPromises.push(p)
            }
        }

        // if (topScores.length < 10) { break; }
        // topScores = topScores.sort((a,b) => b - a).slice(0,10);
        // for (const entry of entries){
        //     if (entry.live && entry.score < topScores[9]) {
        //         entry.live = false
        //         const updateEntry = {
        //             TableName: 'GenEvalParam',
        //             Key:{
        //                 "ParamID": entry.ParamID
        //             },
        //             UpdateExpression: "set live = :s",
        //             ExpressionAttributeValues:{
        //                 ":s": false
        //             },
        //             ReturnValues: "UPDATED_NEW"
        //         };
        //         const p = new Promise( resolve => {
        //             docClient.update(updateEntry, function (err, data) {
        //                 if (err) {
        //                     console.log('Error placing data:', err);
        //                     resolve(null);
        //                 }
        //                 else {
        //                     resolve(null);
        //                 }
        //             });
        //         })
        //         updateDynamoPromises.push(p)
        //     }
        // }
    }
    await Promise.all(updateDynamoPromises);
    let s = '\n\nlive entries:';
    for (const i of liveEntries) {
        s += '\n' + i.score + ' ' + i.ParamID;
    }
    s += '\n\ndead entries:'
    for (const i of deadEntries) {
        s += '\n' + i.score + ' ' + i.ParamID;
    }
    console.log(s);
    return true;
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

async function saveStudentAnswer(event: any): Promise<any> {
    var s3 = new AWS.S3();
    const now = new Date();
    // const question_name = event.question
    const dateString = now.toISOString().replace(/[\:\.]/g, '-').replace('T', '_').replace('Z', '')
    let infoString = '';
    if (event.info && event.info.anonymous_student_id) {
        infoString = '_-_' + event.info.anonymous_student_id
    }
    const key = event.question + infoString + '_-_' + dateString + '.mob'
    console.log('putting student answer:');
    console.log('  _ key:', key);
    const r = await s3.putObject({
        Bucket: "mooc-submissions",
        Key: key,
        Body: event.file,
        ContentType: 'application/json'
    }).promise()
}


async function resultCheck(studentMob: IFlowchart, answerMob: IFlowchart, checkConsole: boolean, checkModel: boolean, params: {},
                           normalize: boolean, check_geom_equality: boolean, check_attrib_equality: boolean,
                           comment: string[], count: number): Promise<number> {
    let caseComment = `<h4>Test case ${count}:</h4><br>`;
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
        if (result.percent < 100) {
            caseComment += '<p style="padding-left: 20px;"><b><i>Model Check:</i> failed</b></p>';
            console.log('    + model check: incorrect')
        } else {
            caseComment += '<p style="padding-left: 20px;"><b><i>Model Check:</i> passed</b></p>';
            console.log('    + model check: correct')
        }
        caseComment += '<br>';
        comment.push(caseComment);
        console.log(`    -> Test case ${count} ended; correct_check: ${result.percent >= 100}`);
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

function updateParam(answerMob: IFlowchart, studentMob: IFlowchart) {
    const missing_params = [];
    for (const aProd of answerMob.nodes[0].procedure){
        if (aProd.type !== ProcedureTypes.Constant) {
            continue;
        }
        let check = false;
        for (const sProd of studentMob.nodes[0].procedure){
            if (sProd.type === ProcedureTypes.Constant && sProd.args[0].value.trim() === aProd.args[0].value.trim()) {
                sProd.args[1].jsValue = aProd.args[1].jsValue;
                sProd.args[1].value = aProd.args[1].value;
                check = true;
                break;
            }
        }
        if (!check) {
            missing_params.push(aProd.args[0].value.trim());
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

        await resolveImportedUrl(node, true);

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
            await resolveImportedUrl(node, false);
        }
    }
    if (flowchart.subFunctions) {
        for (const func of flowchart.subFunctions) {
            for (const node of func.flowchart.nodes) {
                await resolveImportedUrl(node, false);
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

    const nodeIndices = {}
    // execute each node
    for (let i = 0; i < flowchart.nodes.length; i++) {
    // for (const i of executeSet) {
        const node = flowchart.nodes[i];
        if (!node.enabled) {
            node.output.value = undefined;
            continue;
        }
        nodeIndices[node.id] = i;
        globalVars = executeNode(node, funcStrings, globalVars, constantList, consoleLog, nodeIndices);
    }

    for (const node of flowchart.nodes) {
        if (node.type !== 'end') {
            delete node.output.value;
        }
    }

    let i = 0;
    while (i < consoleLog.length - 1) {
        if (consoleLog[i].slice(0, 4) === '<div' && consoleLog[i + 1].slice(0, 5) === '</div') {
            consoleLog.splice(i, 2);
        } else {
            i++;
        }
    }
}

async function resolveImportedUrl(prodList: IProcedure[]|INode, isMainFlowchart?: boolean) {
    if (!isArray(prodList)) {
        await resolveImportedUrl(prodList.procedure, isMainFlowchart);
        if (prodList.localFunc) {
            await resolveImportedUrl(prodList.localFunc, isMainFlowchart);
        }
        return;
    }
    for (const prod of <IProcedure[]> prodList) {
        if (prod.children) {await  resolveImportedUrl(prod.children); }
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
                    arg.jsValue = arg.value;
                    prod.resolvedValue = arg.value.split('__model_data__').join('');
                } else if (arg.jsValue && arg.jsValue.indexOf('__model_data__') !== -1) {
                    prod.resolvedValue = arg.jsValue.split('__model_data__').join('');
                } else if (arg.value.indexOf('://') !== -1) {
                    const val = <string>(arg.value).replace(/ /g, '');
                    const result = await CodeUtils.getURLContent(val);
                    if (result === undefined) {
                        prod.resolvedValue = arg.value;
                    } else if (result.indexOf && result.indexOf('HTTP Request Error') !== -1) {
                        throw new Error(result);
                    } else if (val.indexOf('.zip') !== -1) {
                        prod.resolvedValue = await openZipFile(result);
                    } else {
                        prod.resolvedValue = '`' + result + '`';
                    }
                    break;
                } else if ((arg.value[0] !== '"' && arg.value[0] !== '\'')) {
                    prod.resolvedValue = null;
                    break;
                }
                break;
            }
        }
    }
}
async function openZipFile(zipFile) {
    let result = '{';
    await JSZip.loadAsync(zipFile).then(async function (zip) {
        for (const filename of Object.keys(zip.files)) {
            // const splittedNames = filename.split('/').slice(1).join('/');
            await zip.files[filename].async('text').then(function (fileData) {
                result += `"${filename}": \`${fileData.replace(/\\/g, '\\\\')}\`,`;
            });
        }
    });
    result += '}';
    return result;
}


function executeNode(node: INode, funcStrings, globalVars, constantList, consoleLog, nodeIndices): string {
    const params = {
        'currentProcedure': [''],
        'console': [],
        'constants': constantList
    };

    let fnString = '';
    try {
        const usedFuncs: string[] = [];
        const codeResult = CodeUtils.getNodeCode(node, true, nodeIndices, undefined, undefined, usedFuncs);
        const usedFuncsSet = new Set(usedFuncs);
        // if process is terminated, return

        const codeRes = codeResult[0];
        const nodeCode = codeRes[0].join('\n').split('_-_-_+_-_-_');

        // Create function string:
        // start with asembling the node's code
        fnString =  '\n\n//  ------ MAIN CODE ------\n' +
                    nodeCode[0] +
                    '\nfunction __main_node_code__(){\n' +
                    nodeCode[1] +
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
        fnString = `\nconst __debug__ = true;` + pythonList + '\n' + mergeInputsFunc + '\n' + printFunc + '\n' + fnString;

        // ==> generated code structure:
        //  1. mergeInputFunction
        //  2. constants
        //  3. user functions
        //  4. main node code

        params['model'] = _parameterTypes.newFn();
        _parameterTypes.mergeFn(params['model'], node.input.value);

        // create the function with the string: new Function ([arg1[, arg2[, ...argN]],] functionBody)
        console.log(fnString)

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

