"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const procedure_1 = require("../procedure");
const port_1 = require("../port");
const rxjs_1 = require("rxjs");
const circularJSON = __importStar(require("circular-json"));
const modules_1 = require("../../core/modules");
const xmlhttprequest_1 = require("xmlhttprequest");
let _terminateCheck;
class CodeUtils {
    static getProcedureCode(prod, existingVars, isMainFlowchart, functionName, usedFunctions) {
        if (_terminateCheck === '' || prod.enabled === false ||
            prod.type === procedure_1.ProcedureTypes.Blank ||
            prod.type === procedure_1.ProcedureTypes.Comment) {
            return [''];
        }
        // mark _terminateCheck to terminate all process after this
        if (prod.type === procedure_1.ProcedureTypes.Terminate && prod.enabled) {
            _terminateCheck = '';
            return ['return __params__.model;'];
        }
        prod.hasError = false;
        let codeStr = [];
        const args = prod.args;
        let prefix = '';
        if (args) {
            prefix =
                args.hasOwnProperty('0') && args[0].jsValue && args[0].jsValue.indexOf('[') === -1
                    && existingVars.indexOf(args[0].jsValue) === -1 ? 'let ' : '';
        }
        codeStr.push('');
        if (isMainFlowchart && prod.type !== procedure_1.ProcedureTypes.Else && prod.type !== procedure_1.ProcedureTypes.Elseif) {
            codeStr.push(`__params__.currentProcedure[0] = "${prod.ID}";`);
        }
        switch (prod.type) {
            case procedure_1.ProcedureTypes.Variable:
                if (!args[0].jsValue) {
                    codeStr.push(`${args[1].jsValue};`);
                    break;
                }
                const repVar = this.repSetAttrib(args[0].jsValue);
                if (!repVar) {
                    codeStr.push(`${prefix}${args[0].jsValue} = ${args[1].jsValue};`);
                    if (prefix === 'let ') {
                        existingVars.push(args[0].jsValue);
                    }
                }
                else {
                    codeStr.push(`${repVar[0]} ${args[1].jsValue} ${repVar[1]}`);
                }
                break;
            case procedure_1.ProcedureTypes.If:
                codeStr.push(`if (${args[0].jsValue}){`);
                break;
            case procedure_1.ProcedureTypes.Else:
                codeStr.push(`else {`);
                break;
            case procedure_1.ProcedureTypes.Elseif:
                codeStr.push(`else if(${args[0].jsValue}){`);
                break;
            case procedure_1.ProcedureTypes.Foreach:
                codeStr.push(`for (${prefix} ${args[0].jsValue} of ${args[1].jsValue}){`);
                break;
            case procedure_1.ProcedureTypes.While:
                codeStr.push(`while (${args[0].jsValue}){`);
                break;
            case procedure_1.ProcedureTypes.Break:
                codeStr.push(`break;`);
                break;
            case procedure_1.ProcedureTypes.Continue:
                codeStr.push(`continue;`);
                break;
            case procedure_1.ProcedureTypes.Constant:
                if (!isMainFlowchart) {
                    return [''];
                }
                let constName = args[0].jsValue;
                if (constName[0] === '"' || constName[0] === '\'') {
                    constName = args[0].jsValue.substring(1, args[0].jsValue.length - 1);
                }
                codeStr.push(`__params__['constants']['${constName}'] = ${prod.resolvedValue};`);
                break;
            case procedure_1.ProcedureTypes.AddData:
                let cst = args[0].value;
                if (!isMainFlowchart) {
                    return [`__modules__.${modules_1._parameterTypes.addData}( __params__.model, ${cst});`];
                }
                if (cst[0] === '"' || cst[0] === '\'') {
                    cst = args[0].value.substring(1, args[0].value.length - 1);
                }
                codeStr.push(`__params__['constants']['${cst}'] = ${prod.resolvedValue};`);
                if (modules_1._parameterTypes.addData) {
                    codeStr.push(`__modules__.${modules_1._parameterTypes.addData}( __params__.model, __params__.constants['${cst}']);`);
                }
                else {
                    codeStr.push(`__params__.model = mergeInputs( [__params__.model, __params__.constants['${cst}']]);`);
                }
                break;
            case procedure_1.ProcedureTypes.Return:
                let check = true;
                const returnArgVals = [];
                for (const arg of args) {
                    if (arg.name === modules_1._parameterTypes.constList) {
                        returnArgVals.push('__params__.constants');
                        continue;
                    }
                    if (arg.name === modules_1._parameterTypes.model) {
                        returnArgVals.push('__params__.model');
                        continue;
                    }
                    if (!arg.jsValue) {
                        check = false;
                        break;
                    }
                    if (arg.jsValue[0] === '#') {
                        returnArgVals.push('`' + arg.jsValue + '`');
                        continue;
                    }
                    returnArgVals.push(arg.jsValue);
                }
                if (!check) {
                    codeStr.push(`return __params__['model'];`);
                }
                else {
                    codeStr.push(`let __return_value__ = __modules__.${modules_1._parameterTypes.return}(${returnArgVals.join(', ')});`);
                    if (isMainFlowchart) {
                        codeStr.push(`__params__.console.push('<p><b>Return: <i>' + ` +
                            `__return_value__.toString().replace(/,/g,', ') + '</i></b></p>');`);
                    }
                    codeStr.push(`return __return_value__;`);
                }
                break;
            case procedure_1.ProcedureTypes.Function:
                const argVals = [];
                for (const arg of args.slice(1)) {
                    if (arg.name === modules_1._parameterTypes.constList) {
                        argVals.push('__params__.constants');
                        continue;
                    }
                    if (arg.name === modules_1._parameterTypes.model) {
                        argVals.push('__params__.model');
                        continue;
                    }
                    if (arg.name === modules_1._parameterTypes.console) {
                        argVals.push('__params__.console');
                        continue;
                    }
                    if (arg.name === modules_1._parameterTypes.fileName) {
                        argVals.push('__params__.fileName');
                        continue;
                    }
                    if (arg.jsValue && arg.jsValue[0] === '#') {
                        argVals.push('`' + arg.jsValue + '`');
                        continue;
                    }
                    argVals.push(arg.jsValue);
                }
                if (prod.resolvedValue) {
                    let prodResolvedCheck = false;
                    for (let i = 0; i < argVals.length; i++) {
                        if (argVals[i].indexOf('://') !== -1) {
                            argVals[i] = prod.resolvedValue;
                            prod.resolvedValue = null;
                            prodResolvedCheck = true;
                            break;
                        }
                    }
                    if (!prodResolvedCheck) {
                        argVals[1] = prod.resolvedValue;
                    }
                }
                // const argValues = argVals.join(', ');
                const fnCall = `__modules__.${prod.meta.module}.${prod.meta.name}( ${argVals.join(', ')} )`;
                if (prod.meta.module.toUpperCase() === 'OUTPUT') {
                    if (prod.args[prod.args.length - 1].jsValue) {
                        codeStr.push(`return ${fnCall};`);
                    }
                }
                else if (args[0].name === '__none__' || !args[0].jsValue) {
                    codeStr.push(`${fnCall};`);
                }
                else {
                    const repfuncVar = this.repSetAttrib(args[0].jsValue);
                    if (!repfuncVar) {
                        codeStr.push(`${prefix}${args[0].jsValue} = ${fnCall};`);
                        if (prefix === 'let ') {
                            existingVars.push(args[0].jsValue);
                        }
                    }
                    else {
                        codeStr.push(`${repfuncVar[0]} ${fnCall} ${repfuncVar[1]}`);
                    }
                }
                break;
            case procedure_1.ProcedureTypes.Imported:
                const argsVals = [];
                const namePrefix = functionName ? `${functionName}_` : '';
                // let urlCheck = false;
                if (isMainFlowchart) {
                    usedFunctions.push(prod.meta.name);
                    // } else {
                    //     for (const urlfunc of _parameterTypes.urlFunctions) {
                    //         const funcMeta = urlfunc.split('.');
                    //         if (funcMeta[0] === prod.meta.module && funcMeta[1] === prod.meta.name) {
                    //             urlCheck = true;
                    //             break;
                    //         }
                    //     }
                }
                for (let i = 1; i < args.length; i++) {
                    const arg = args[i];
                    // if (urlCheck && arg.jsValue.indexOf('://') !== -1) {
                    //     argsVals.push(prod.resolvedValue);
                    //     prod.resolvedValue = null;
                    // }
                    if (arg.type.toString() !== port_1.InputType.URL.toString()) {
                        argsVals.push(arg.jsValue);
                        // argsVals.push(this.repGetAttrib(arg.jsValue));
                    }
                    else {
                        argsVals.push(prod.resolvedValue);
                    }
                }
                // argsVals = argsVals.join(', ');
                // const fn = `${namePrefix}${prod.meta.name}(__params__, ${argsVals} )`;
                const fn = `${namePrefix}${prod.meta.name}(__params__${argsVals.map(val => ', ' + val).join('')})`;
                if (args[0].name === '__none__' || !args[0].jsValue) {
                    codeStr.push(`${fn};`);
                    break;
                }
                const repImpVar = this.repSetAttrib(args[0].jsValue);
                if (!repImpVar) {
                    codeStr.push(`${prefix}${args[0].jsValue} = ${fn};`);
                }
                else {
                    codeStr.push(`${repImpVar[0]} ${fn} ${repImpVar[1]}`);
                }
                if (prefix === 'let ') {
                    existingVars.push(args[0].jsValue);
                }
                break;
        }
        if (prod.children) {
            for (const p of prod.children) {
                codeStr = codeStr.concat(CodeUtils.getProcedureCode(p, existingVars, isMainFlowchart, functionName, usedFunctions));
            }
            codeStr.push(`}`);
        }
        if (isMainFlowchart && prod.print && prod.args[0].jsValue) {
            // const repGet = prod.args[0].jsValue;
            const repGet = this.repGetAttrib(prod.args[0].jsValue);
            codeStr.push(`printFunc(__params__.console,'${prod.args[0].value}', ${repGet});`);
        }
        if (isMainFlowchart && prod.selectGeom && prod.args[0].jsValue) {
            // const repGet = prod.args[0].jsValue;
            const repGet = this.repGetAttrib(prod.args[0].value);
            const repGetJS = this.repGetAttrib(prod.args[0].jsValue);
            codeStr.push(`__modules__.${modules_1._parameterTypes.select}(__params__.model, ${repGetJS}, "${repGet}");`);
        }
        return codeStr;
    }
    static repSetAttrib(val) {
        if (!val || val.indexOf('@') === -1) {
            return false;
        }
        // get two parts, before @ and after @
        let val_0;
        let val_1;
        const atIndex = val.indexOf('@');
        if (atIndex === 0) {
            val_0 = null;
            val_1 = val.slice(1);
        }
        else {
            val_0 = val.slice(0, atIndex);
            val_1 = val.slice(atIndex + 1);
        }
        const bracketIndex = val_1.indexOf('.slice(');
        if (bracketIndex !== -1) {
            const name = val_1.slice(0, bracketIndex);
            const index = val_1.slice(bracketIndex + 7, -4);
            // const innerVar = CodeUtils.repGetAttrib(bracketSplit.splice(1, bracketSplit.length - 1).join('['));
            return [`__modules__.${modules_1._parameterTypes.setattrib}(__params__.model, ${val_0}, '${name}', ${index},`, `);`];
        }
        else {
            return [`__modules__.${modules_1._parameterTypes.setattrib}(__params__.model, ${val_0}, '${val_1}', null, `, ');'];
        }
    }
    static repGetAttrib(val) {
        if (!val) {
            return;
        }
        const res = val.split('@');
        if (res.length === 1) {
            return val;
        }
        let entity = res[0];
        if (res[0] === '') {
            entity = 'null';
        }
        let att_name;
        let att_index;
        const bracketIndex = res[1].indexOf('.slice(');
        if (bracketIndex !== -1) {
            att_name = res[1].slice(0, bracketIndex);
            att_index = res[1].slice(bracketIndex + 7, -4);
        }
        else {
            att_name = res[1];
            att_index = 'null';
        }
        return `__modules__.${modules_1._parameterTypes.getattrib}(__params__.model, ${entity}, '${att_name}', ${att_index})`;
        // if (!val) { return; }
        // if (typeof val === 'number') { return val; }
        // const res = val.split(' ');
        // for (const i in res) {
        //     if (!res[i]) {
        //         continue;
        //     }
        //     const atIndex = res[i].indexOf('@');
        //     if (atIndex !== -1 && atIndex >= 0 && res[i].trim()[0] !== '#') {
        //         // get two parts, before @ and after @
        //         let val_0: string;
        //         let val_1: string;
        //         let pref = '';
        //         let postf = '';
        //         if (atIndex === 0) {
        //             val_0 = null;
        //             val_1 = res[i].slice(1);
        //         } else {
        //             val_0 = res[i].slice(0, atIndex);
        //             val_1 = res[i].slice(atIndex + 1);
        //             while (val_0[0] === '[') {
        //                 val_0 = val_0.substring(1, val_0.length);
        //                 pref += '[';
        //             }
        //             if (val_0 === '') {
        //                 val_0 = null;
        //             }
        //         }
        //         const closeBracketMatch = (val_1.match(/\]/g) || []).length;
        //         const openBracketMatch = (val_1.match(/\[/g) || []).length;
        //         if (closeBracketMatch > openBracketMatch) {
        //             val_1 = val_1.substring(0, val_1.length - (closeBracketMatch - openBracketMatch));
        //             postf = ']'.repeat(closeBracketMatch - openBracketMatch);
        //         }
        //         if (openBracketMatch) {
        //             const bracketSplit = val_1.substring(0, val_1.length - 1).split('[');
        //             const innerVar = CodeUtils.repGetAttrib(bracketSplit.splice(1, bracketSplit.length - 1).join('['));
        //             res[i] = `${pref}__modules__.${_parameterTypes.getattrib}` +
        //                 `(__params__.model, ${val_0}, '${bracketSplit[0]}', ${innerVar})${postf}`;
        //         } else {
        //             res[i] = `${pref}__modules__.${_parameterTypes.getattrib}(__params__.model, ${val_0}, '${val_1}')${postf}`;
        //         }
        //     }
        // }
        // return res.join(' ');
    }
    static async getURLContent(url) {
        if (url.indexOf('dropbox') !== -1) {
            url = url.replace('www', 'dl').replace('dl=0', 'dl=1');
        }
        if (url[0] === '"' || url[0] === '\'') {
            url = url.substring(1);
        }
        if (url[url.length - 1] === '"' || url[url.length - 1] === '\'') {
            url = url.substring(0, url.length - 1);
        }
        const p = new Promise((resolve) => {
            const request = new xmlhttprequest_1.XMLHttpRequest();
            request.open('GET', url);
            // request.overrideMimeType('text/plain; charset=x-user-defined');
            request.onload = () => {
                resolve(request.responseText.replace(/(\\[bfnrtv\'\"\\])/g, '\\$1'));
            };
            request.onerror = () => {
                resolve('HTTP Request Error: unable to retrieve file from url ' + url);
            };
            request.send();
        });
        return await p;
    }
    static async getStartInput(arg, inputMode) {
        const val = arg.jsValue || arg.value;
        let result = val;
        if (inputMode.toString() === port_1.InputType.URL.toString()) {
            result = await CodeUtils.getURLContent(val);
            if (result.indexOf('HTTP Request Error') !== -1) {
                throw (new Error(result));
            }
            result = '`' + result + '`';
        }
        else if (inputMode.toString() === port_1.InputType.File.toString()) {
            result = window.localStorage.getItem(val.name);
            if (!result) {
                const p = new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = function () {
                        resolve(reader.result);
                    };
                    reader.onerror = () => {
                        resolve('File Reading Error: unable to read file ' + val.name);
                    };
                    reader.readAsText(val);
                });
                result = await p;
                if (result.indexOf('File Reading Error') !== -1) {
                    throw (new Error(result));
                }
                result = '`' + result + '`';
                // let savedFiles: any = window.localStorage.getItem('savedFileList');
                // if (!savedFiles) {
                //     window.localStorage.setItem('savedFileList', `["${val.name}"]`);
                // } else {
                //     savedFiles = JSON.parse(savedFiles);
                //     window.localStorage.removeItem(savedFiles[0]);
                //     window.localStorage.setItem('savedFileList', `["${val.name}"]`);
                // }
                // window.localStorage.setItem(val.name, result);
                arg.jsValue = { 'name': val.name };
            }
        }
        return result;
    }
    static loadFile(f) {
        const stream = rxjs_1.Observable.create(observer => {
            const request = new xmlhttprequest_1.XMLHttpRequest();
            request.open('GET', f.download_url);
            request.onload = () => {
                if (request.status === 200) {
                    const fl = circularJSON.parse(request.responseText);
                    observer.next(fl);
                    observer.complete();
                }
                else {
                    observer.error('error happened');
                }
            };
            request.onerror = () => {
                observer.error('error happened');
            };
            request.send();
        });
        stream.subscribe(loadeddata => {
            return loadeddata;
        });
    }
    static mergeInputs(models) {
        const result = modules_1._parameterTypes['newFn']();
        for (const model of models) {
            modules_1._parameterTypes['mergeFn'](result, model);
        }
        return result;
    }
    static getInputValue(inp, node) {
        let input;
        if (node.type === 'start' || inp.edges.length === 0) {
            input = modules_1._parameterTypes['newFn']();
        }
        else {
            const inputs = [];
            for (const edge of inp.edges) {
                if (edge.source.parentNode.enabled) {
                    inputs.push(edge.source.value);
                }
            }
            input = CodeUtils.mergeInputs(inputs);
            /*
            if (input.constructor === gsConstructor) {
                input = `new __MODULES__.gs.Model(${input.toJSON()})`
            } else {
                // do nothing
            }
            */
        }
        return input;
    }
    static getNodeCode(node, isMainFlowchart = false, functionName, usedFunctions) {
        node.hasError = false;
        let codeStr = [];
        const varsDefined = [];
        // reset terminate check to false at start node (only in main flowchart's start node).
        // for every node after that, if terminate check is true, do not execute the node.
        if (!isMainFlowchart) {
            // do nothing
        }
        else if (node.type === 'start') {
            _terminateCheck = null;
        }
        else if (_terminateCheck) {
            return [undefined, _terminateCheck];
        }
        // input initializations
        if (isMainFlowchart) {
            const input = CodeUtils.getInputValue(node.input, node);
            node.input.value = input;
        }
        if (node.type === 'start') {
            codeStr.push('__params__.constants = {};\n');
        }
        codeStr.push(`__modules__.${modules_1._parameterTypes.preprocess}( __params__.model);`);
        // procedure
        for (const prod of node.procedure) {
            // if (node.type === 'start' && !isMainFlowchart) { break; }
            codeStr = codeStr.concat(CodeUtils.getProcedureCode(prod, varsDefined, isMainFlowchart, functionName, usedFunctions));
        }
        if (node.type === 'end' && node.procedure.length > 0) {
            // return [[codeStr, varsDefined], _terminateCheck];
        }
        else {
            codeStr.push(`__modules__.${modules_1._parameterTypes.postprocess}( __params__.model);`);
            codeStr.push('return __params__.model;');
        }
        if (_terminateCheck === '') {
            _terminateCheck = node.name;
        }
        return [[codeStr, varsDefined], _terminateCheck];
    }
    static getFunctionString(func) {
        let fullCode = '';
        let fnCode = `function ${func.name}(__params__${func.args.map(arg => ', ' + arg.name + '_').join('')})` + `{\nvar merged;\n`;
        for (const node of func.flowchart.nodes) {
            const nodeFuncName = `${func.name}_${node.id}`;
            if (node.type === 'start') {
                fnCode += `let result_${nodeFuncName} = __params__.model;\n`;
            }
            else {
                const codeRes = CodeUtils.getNodeCode(node, false, func.name)[0];
                fullCode += `function ${nodeFuncName}(__params__${func.args.map(arg => ', ' + arg.name + '_').join('')}){\n` +
                    codeRes[0].join('\n') + `\n}\n\n`;
                const activeNodes = [];
                for (const nodeEdge of node.input.edges) {
                    if (!nodeEdge.source.parentNode.enabled) {
                        continue;
                    }
                    activeNodes.push(nodeEdge.source.parentNode.id);
                }
                fnCode += `\n__params__.model = mergeInputs([${activeNodes.map((nodeId) => `result_${func.name}_${nodeId}`).join(', ')}]);\n`;
                fnCode += `let result_${nodeFuncName} = ${nodeFuncName}(__params__${func.args.map(arg => ', ' + arg.name + '_').join('')});\n`;
            }
            if (node.type === 'end') {
                // fnCode += `\n__mainParams__.model = mergeInputs([__mainParams__.model,__params__.model]);\n`;
                fnCode += `\nreturn result_${nodeFuncName};\n`;
            }
        }
        fnCode += '}\n\n';
        fullCode += fnCode;
        return fullCode;
    }
}
exports.CodeUtils = CodeUtils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS51dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tb2RlbC9jb2RlL2NvZGUudXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0EsNENBQXFFO0FBQ3JFLGtDQUFnRDtBQUNoRCwrQkFBa0M7QUFDbEMsNERBQThDO0FBQzlDLGdEQUFxRDtBQUNyRCxtREFBZ0Q7QUFFaEQsSUFBSSxlQUF1QixDQUFDO0FBRTVCLE1BQWEsU0FBUztJQUdsQixNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBZ0IsRUFBRSxZQUFzQixFQUFFLGVBQXdCLEVBQ2xFLFlBQXFCLEVBQUUsYUFBd0I7UUFDbkUsSUFBSSxlQUFlLEtBQUssRUFBRSxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssS0FBSztZQUNoRCxJQUFJLENBQUMsSUFBSSxLQUFLLDBCQUFjLENBQUMsS0FBSztZQUNsQyxJQUFJLENBQUMsSUFBSSxLQUFLLDBCQUFjLENBQUMsT0FBTyxFQUFFO1lBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQUU7UUFFMUQsMkRBQTJEO1FBQzNELElBQUksSUFBSSxDQUFDLElBQUksS0FBSywwQkFBYyxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ3hELGVBQWUsR0FBRyxFQUFFLENBQUM7WUFDckIsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7U0FDdkM7UUFFRCxJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztRQUV0QixJQUFJLE9BQU8sR0FBYSxFQUFFLENBQUM7UUFDM0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUN2QixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDaEIsSUFBSSxJQUFJLEVBQUU7WUFDTixNQUFNO2dCQUNOLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8s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