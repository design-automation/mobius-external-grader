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

const mergeInputsFunc = `
function mergeInputs(models){
    let result = __modules__.${_parameterTypes.new}();
    for (let model of models){
        __modules__.${_parameterTypes.merge}(result, model);
    }
    return result;
}
`;


export const gradeFile_URL = async (event: any = {}): Promise<any> => {
    const p = new Promise((resolve) => {

        const request = new XMLHttpRequest();
        request.open('GET', event.file);
        request.onload = async () => {
            if (request.status === 200) {
                resolve(await gradeFile({"file": request.responseText}))
            } else {
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
}

export const gradeFile = async (event: any = {}): Promise<any> => {
    try {
        // parse the mob file
        // console.log('Parsing .mob file...')
        const mobFile = circularJSON.parse(event.file);

        // execute the flowchart
        // console.log('Execute flowchart...')
        await execute(mobFile.flowchart);

        // const result = mobFile.flowchart.nodes[mobFile.flowchart.nodes.length - 1].output.value
        // console.log('Finished execute...')
        // console.log('result:', JSON.stringify(result.getData()));

        // TODO: grade the output...

        // TODO: return grading...
        const answer_model = null;
        const result = answer_model.compare(mobFile); // student_model
        
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
                "score": 1,
                "comment": result.comment
            };
        }
        // return JSON.stringify(result.getData());
    } catch(err) {
        return {
            "correct": false,
            "score": 0,
            "comment": err.message
        };
    }
}

async function execute(flowchart: any) {

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

    executeFlowchart(flowchart);
}

function executeFlowchart(flowchart: IFlowchart) {
    let globalVars = '';

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
        globalVars = executeNode(node, funcStrings, globalVars);
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

function executeNode(node: INode, funcStrings, globalVars): string {
    const params = {'currentProcedure': [''], 'console': []};
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
        fnString = mergeInputsFunc + '\n' + fnString;

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
                }
            }
            globalVars += '\n';
        }
        node.input.value = null;

        return globalVars;
    } catch (ex) {
        throw ex;
    }
}

