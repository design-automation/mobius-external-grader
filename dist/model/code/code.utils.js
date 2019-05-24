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
let _terminateCheck;
class CodeUtils {
    static getProcedureCode(prod, existingVars, isMainFlowchart, functionName, usedFunctions) {
        if (_terminateCheck === '' || prod.enabled === false ||
            prod.type === procedure_1.ProcedureTypes.Blank ||
            prod.type === procedure_1.ProcedureTypes.Comment) {
            return [''];
        }
        // mark _terminateCheck to terminate all process after this
        if (prod.type === procedure_1.ProcedureTypes.Terminate) {
            _terminateCheck = '';
            return ['return __params__.model;'];
        }
        prod.hasError = false;
        let codeStr = [];
        const args = prod.args;
        let prefix = '';
        if (args) {
            prefix =
                args.hasOwnProperty('0') && args[0].value && args[0].value.indexOf('[') === -1
                    && existingVars.indexOf(args[0].value) === -1 ? 'let ' : '';
        }
        codeStr.push('');
        if (isMainFlowchart && prod.type !== procedure_1.ProcedureTypes.Else && prod.type !== procedure_1.ProcedureTypes.Elseif) {
            codeStr.push(`__params__.currentProcedure[0] = "${prod.ID}";`);
        }
        switch (prod.type) {
            case procedure_1.ProcedureTypes.Variable:
                if (!args[0].value) {
                    codeStr.push(`${this.repGetAttrib(args[1].value)};`);
                    break;
                }
                const repVar = this.repSetAttrib(args[0].value);
                if (!repVar) {
                    codeStr.push(`${prefix}${args[0].value} = ${this.repGetAttrib(args[1].value)};`);
                    if (prefix === 'let ') {
                        existingVars.push(args[0].value);
                    }
                }
                else {
                    codeStr.push(`${repVar[0]} ${this.repGetAttrib(args[1].value)} ${repVar[1]}`);
                }
                break;
            case procedure_1.ProcedureTypes.If:
                if (args[0].value.indexOf('__params__') !== -1) {
                    throw new Error('Unexpected Identifier');
                }
                codeStr.push(`if (${this.repGetAttrib(args[0].value)}){`);
                break;
            case procedure_1.ProcedureTypes.Else:
                codeStr.push(`else {`);
                break;
            case procedure_1.ProcedureTypes.Elseif:
                if (args[0].value.indexOf('__params__') !== -1) {
                    throw new Error('Unexpected Identifier');
                }
                codeStr.push(`else if(${this.repGetAttrib(args[0].value)}){`);
                break;
            case procedure_1.ProcedureTypes.Foreach:
                // codeStr.push(`for (${prefix} ${args[0].value} of [...Array(${args[1].value}).keys()]){`);
                if (args[0].value.indexOf('__params__') !== -1) {
                    throw new Error('Unexpected Identifier');
                }
                codeStr.push(`for (${prefix} ${args[0].value} of ${this.repGetAttrib(args[1].value)}){`);
                break;
            case procedure_1.ProcedureTypes.While:
                if (args[0].value.indexOf('__params__') !== -1) {
                    throw new Error('Unexpected Identifier');
                }
                codeStr.push(`while (${this.repGetAttrib(args[0].value)}){`);
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
                let constName = args[0].value;
                if (constName[0] === '"' || constName[0] === '\'') {
                    constName = args[0].value.substring(1, args[0].value.length - 1);
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
                    if (!arg.value) {
                        check = false;
                        break;
                    }
                    if (arg.value.indexOf('__params__') !== -1) {
                        throw new Error('Unexpected Identifier');
                    }
                    if (arg.value[0] === '#') {
                        returnArgVals.push('`' + this.repGetAttrib(arg.value) + '`');
                        continue;
                    }
                    returnArgVals.push(this.repGetAttrib(arg.value));
                }
                if (!check) {
                    codeStr.push(`return __params__['model'];`);
                }
                else {
                    codeStr.push(`let __return_value__ = __modules__.${modules_1._parameterTypes.return}(${returnArgVals.join(', ')});`);
                    if (isMainFlowchart) {
                        // codeStr.push(`console.(log'Return: ', __return_value__);`);
                        codeStr.push(`__params__.console.push('Return: ' + __return_value__.toString());`);
                    }
                    codeStr.push(`return __return_value__;`);
                }
                break;
            case procedure_1.ProcedureTypes.Function:
                const argVals = [];
                for (const arg of args.slice(1)) {
                    if (arg.value && arg.value.indexOf('__params__') !== -1) {
                        throw new Error('Unexpected Identifier');
                    }
                    if (arg.name === modules_1._parameterTypes.constList) {
                        argVals.push('__params__.constants');
                        continue;
                    }
                    if (arg.name === modules_1._parameterTypes.model) {
                        argVals.push('__params__.model');
                        continue;
                    }
                    if (arg.value && arg.value[0] === '#') {
                        argVals.push('`' + this.repGetAttrib(arg.value) + '`');
                        continue;
                    }
                    argVals.push(this.repGetAttrib(arg.value));
                }
                if (prod.resolvedValue) {
                    for (let i = 0; i < argVals.length; i++) {
                        if (argVals[i].indexOf('://') !== -1) {
                            argVals[i] = prod.resolvedValue;
                            prod.resolvedValue = null;
                            break;
                        }
                    }
                }
                // const argValues = argVals.join(', ');
                const fnCall = `__modules__.${prod.meta.module}.${prod.meta.name}( ${argVals.join(', ')} )`;
                if (prod.meta.module.toUpperCase() === 'OUTPUT') {
                    if (prod.args[prod.args.length - 1].value) {
                        codeStr.push(`return ${fnCall};`);
                    }
                }
                else if (args[0].name === '__none__' || !args[0].value) {
                    codeStr.push(`${fnCall};`);
                }
                else {
                    const repfuncVar = this.repSetAttrib(args[0].value);
                    if (!repfuncVar) {
                        codeStr.push(`${prefix}${args[0].value} = ${fnCall};`);
                        if (prefix === 'let ') {
                            existingVars.push(args[0].value);
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
                    // if (urlCheck && arg.value.indexOf('://') !== -1) {
                    //     argsVals.push(prod.resolvedValue);
                    //     prod.resolvedValue = null;
                    // }
                    if (arg.type.toString() !== port_1.InputType.URL.toString()) {
                        argsVals.push(this.repGetAttrib(arg.value));
                    }
                    else {
                        argsVals.push(prod.resolvedValue);
                    }
                }
                // argsVals = argsVals.join(', ');
                // const fn = `${namePrefix}${prod.meta.name}(__params__, ${argsVals} )`;
                const fn = `${namePrefix}${prod.meta.name}(__params__${argsVals.map(val => ', ' + val).join('')})`;
                if (args[0].name === '__none__' || !args[0].value) {
                    codeStr.push(`${fn};`);
                    break;
                }
                const repImpVar = this.repSetAttrib(args[0].value);
                if (!repImpVar) {
                    codeStr.push(`${prefix}${args[0].value} = ${fn};`);
                }
                else {
                    codeStr.push(`${repImpVar[0]} ${fn} ${repImpVar[1]}`);
                }
                if (prefix === 'let ') {
                    existingVars.push(args[0].value);
                }
                break;
        }
        if (prod.children) {
            for (const p of prod.children) {
                codeStr = codeStr.concat(CodeUtils.getProcedureCode(p, existingVars, isMainFlowchart, functionName, usedFunctions));
            }
            codeStr.push(`}`);
        }
        if (isMainFlowchart && prod.print && prod.args[0].value) {
            const repGet = this.repGetAttrib(prod.args[0].value);
            codeStr.push(`printFunc(__params__.console,'${prod.args[0].value}', ${repGet});`);
        }
        if (isMainFlowchart && prod.selectGeom && prod.args[0].value) {
            const repGet = this.repGetAttrib(prod.args[0].value);
            codeStr.push(`__modules__.${modules_1._parameterTypes.select}(__params__.model, ${repGet}, "${repGet}");`);
        }
        return codeStr;
    }
    static repSetAttrib(val) {
        // if (!val || val.indexOf('@') === -1) {
        //     return false;
        // }
        // const splitted = val.split('@');
        // if (splitted.length > 2) {
        //     splitted[1] = splitted.splice(1, splitted.length - 1).join('@');
        // }
        // const openBracketMatch = (splitted[1].match(/\[/g) || []).length;
        // if (openBracketMatch) {
        //     const bracketSplit = splitted[1].substring(0, splitted[1].length - 1).split('[');
        //     const innerVar = CodeUtils.repGetAttrib(bracketSplit.splice(1, bracketSplit.length - 1).join('['));
        //     return [`__modules__.${_parameterTypes.setattrib}(
        //              __params__.model, ${splitted[0]}, '${bracketSplit[0]}',`, `, ${innerVar});`];
        // } else {
        //     return [`__modules__.${_parameterTypes.setattrib}(__params__.model, ${splitted[0]}, '${splitted[1]}',`, ');'];
        // }
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
        const openBracketMatch = (val_1.match(/\[/g) || []).length;
        if (openBracketMatch) {
            const bracketSplit = val_1.substring(0, val_1.length - 1).split('[');
            const innerVar = CodeUtils.repGetAttrib(bracketSplit.splice(1, bracketSplit.length - 1).join('['));
            return [`__modules__.${modules_1._parameterTypes.setattrib}(__params__.model, ${val_0}, '${bracketSplit[0]}',`, `, ${innerVar});`];
        }
        else {
            return [`__modules__.${modules_1._parameterTypes.setattrib}(__params__.model, ${val_0}, '${val_1}',`, ');'];
        }
    }
    static repGetAttrib(val) {
        if (!val) {
            return;
        }
        if (typeof val === 'number') {
            return val;
        }
        const res = val.split(' ');
        for (const i in res) {
            if (!res[i]) {
                continue;
            }
            const atIndex = res[i].indexOf('@');
            if (atIndex !== -1 && atIndex >= 0 && res[i].trim()[0] !== '#') {
                // get two parts, before @ and after @
                let val_0;
                let val_1;
                let pref = '';
                let postf = '';
                if (atIndex === 0) {
                    val_0 = null;
                    val_1 = res[i].slice(1);
                }
                else {
                    val_0 = res[i].slice(0, atIndex);
                    val_1 = res[i].slice(atIndex + 1);
                    while (val_0[0] === '[') {
                        val_0 = val_0.substring(1, val_0.length);
                        pref += '[';
                    }
                    if (val_0 === '') {
                        val_0 = null;
                    }
                }
                const closeBracketMatch = (val_1.match(/\]/g) || []).length;
                const openBracketMatch = (val_1.match(/\[/g) || []).length;
                if (closeBracketMatch > openBracketMatch) {
                    val_1 = val_1.substring(0, val_1.length - (closeBracketMatch - openBracketMatch));
                    postf = ']'.repeat(closeBracketMatch - openBracketMatch);
                }
                if (openBracketMatch) {
                    const bracketSplit = val_1.substring(0, val_1.length - 1).split('[');
                    const innerVar = CodeUtils.repGetAttrib(bracketSplit.splice(1, bracketSplit.length - 1).join('['));
                    res[i] = `${pref}__modules__.${modules_1._parameterTypes.getattrib}` +
                        `(__params__.model, ${val_0}, '${bracketSplit[0]}', ${innerVar})${postf}`;
                }
                else {
                    res[i] = `${pref}__modules__.${modules_1._parameterTypes.getattrib}(__params__.model, ${val_0}, '${val_1}')${postf}`;
                }
            }
        }
        return res.join(' ');
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
            const request = new XMLHttpRequest();
            request.open('GET', url);
            request.overrideMimeType('text/plain; charset=x-user-defined');
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
        const val = arg.value;
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
                arg.value = { 'name': val.name };
            }
        }
        return result;
    }
    static loadFile(f) {
        const stream = rxjs_1.Observable.create(observer => {
            const request = new XMLHttpRequest();
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
        let fnCode = `function ${func.name}(__params__${func.args.map(arg => ', ' + arg.name).join('')})` + `{\nvar merged;\n`;
        for (const node of func.flowchart.nodes) {
            const nodeFuncName = `${func.name}_${node.id}`;
            if (node.type === 'start') {
                fnCode += `let result_${nodeFuncName} = __params__.model;\n`;
            }
            else {
                const codeRes = CodeUtils.getNodeCode(node, false, func.name)[0];
                fullCode += `function ${nodeFuncName}(__params__${func.args.map(arg => ', ' + arg.name).join('')}){\n` +
                    codeRes[0].join('\n') + `\n}\n\n`;
                const activeNodes = [];
                for (const nodeEdge of node.input.edges) {
                    if (!nodeEdge.source.parentNode.enabled) {
                        continue;
                    }
                    activeNodes.push(nodeEdge.source.parentNode.id);
                }
                fnCode += `\n__params__.model = mergeInputs([${activeNodes.map((nodeId) => `result_${func.name}_${nodeId}`).join(', ')}]);\n`;
                fnCode += `let result_${nodeFuncName} = ${nodeFuncName}(__params__${func.args.map(arg => ', ' + arg.name).join('')});\n`;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS51dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tb2RlbC9jb2RlL2NvZGUudXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0EsNENBQXFFO0FBQ3JFLGtDQUFnRDtBQUNoRCwrQkFBa0M7QUFDbEMsNERBQThDO0FBQzlDLGdEQUFxRDtBQUVyRCxJQUFJLGVBQXVCLENBQUM7QUFFNUIsTUFBYSxTQUFTO0lBR2xCLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFnQixFQUFFLFlBQXNCLEVBQUUsZUFBd0IsRUFDbEUsWUFBcUIsRUFBRSxhQUF3QjtRQUNuRSxJQUFJLGVBQWUsS0FBSyxFQUFFLElBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxLQUFLO1lBQ2hELElBQUksQ0FBQyxJQUFJLEtBQUssMEJBQWMsQ0FBQyxLQUFLO1lBQ2xDLElBQUksQ0FBQyxJQUFJLEtBQUssMEJBQWMsQ0FBQyxPQUFPLEVBQUU7WUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7U0FBRTtRQUUxRCwyREFBMkQ7UUFDM0QsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLDBCQUFjLENBQUMsU0FBUyxFQUFFO1lBQ3hDLGVBQWUsR0FBRyxFQUFFLENBQUM7WUFDckIsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7U0FDdkM7UUFFRCxJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztRQUV0QixJQUFJLE9BQU8sR0FBYSxFQUFFLENBQUM7UUFDM0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUN2QixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDaEIsSUFBSSxJQUFJLEVBQUU7WUFDTixNQUFNO2dCQUNOLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FB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