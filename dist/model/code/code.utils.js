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
const xmlhttprequest_1 = require("xmlhttprequest");
const circularJSON = __importStar(require("circular-json"));
const modules_1 = require("../../core/modules");
class CodeUtils {
    static getProcedureCode(prod, existingVars, isMainFlowchart, functionName, usedFunctions) {
        if (prod.enabled === false ||
            prod.type === procedure_1.ProcedureTypes.Blank ||
            prod.type === procedure_1.ProcedureTypes.Comment) {
            return [''];
        }
        // ignore terminate
        if (prod.type === procedure_1.ProcedureTypes.Terminate) {
            return [''];
            // _terminateCheck = '';
            // return ['return __params__.model;'];
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
                const argValues = argVals.join(', ');
                const fnCall = `__modules__.${prod.meta.module}.${prod.meta.name}( ${argValues} )`;
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
                let argsVals = [];
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
                argsVals = argsVals.join(', ');
                const fn = `${namePrefix}${prod.meta.name}(__params__, ${argsVals} )`;
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
        return [[codeStr, varsDefined], null];
    }
    static getFunctionString(func) {
        let fullCode = '';
        let fnCode;
        if (func.argCount === 0) {
            fnCode = `function ${func.name}(__params__)` +
                `{\nvar merged;\n`;
        }
        else {
            fnCode = `function ${func.name}(__params__, ${func.args.map(arg => arg.name).join(', ')})` +
                `{\nvar merged;\n`;
        }
        for (const node of func.flowchart.nodes) {
            const codeRes = CodeUtils.getNodeCode(node, false, func.name)[0];
            let code = codeRes[0];
            if (node.type === 'start') {
                code = '{ return __params__.model; }';
            }
            else {
                code = '{\n' + code.join('\n') + '\n}';
            }
            if (func.argCount === 0) {
                fullCode += `function ${node.id}(__params__)` + code + `\n\n`;
            }
            else {
                fullCode += `function ${node.id}(__params__, ${func.args.map(arg => arg.name).join(', ')})` + code + `\n\n`;
            }
            if (node.type === 'start') {
                fnCode += `let result_${node.id} = __params__.model;\n`;
            }
            else {
                const activeNodes = [];
                for (const nodeEdge of node.input.edges) {
                    if (!nodeEdge.source.parentNode.enabled) {
                        continue;
                    }
                    activeNodes.push(nodeEdge.source.parentNode.id);
                }
                fnCode += `\n__params__.model = mergeInputs([${activeNodes.map((nodeId) => 'result_' + nodeId).join(', ')}]);\n`;
                if (func.argCount === 0) {
                    fnCode += `let result_${node.id} = ${node.id}(__params__);\n`;
                }
                else {
                    fnCode += `let result_${node.id} = ${node.id}(__params__, ${func.args.map(arg => arg.name).join(', ')});\n`;
                }
            }
            if (node.type === 'end') {
                fnCode += `\nreturn result_${node.id};\n`;
            }
        }
        fnCode += '}\n\n';
        fullCode += fnCode;
        return fullCode;
    }
}
exports.CodeUtils = CodeUtils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS51dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tb2RlbC9jb2RlL2NvZGUudXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0EsNENBQXFFO0FBQ3JFLGtDQUFnRDtBQUNoRCwrQkFBa0M7QUFDbEMsbURBQWdEO0FBQ2hELDREQUE4QztBQUM5QyxnREFBcUQ7QUFHckQsTUFBYSxTQUFTO0lBRWxCLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFnQixFQUFFLFlBQXNCLEVBQUUsZUFBd0IsRUFDbEUsWUFBcUIsRUFBRSxhQUF3QjtRQUNuRSxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssS0FBSztZQUN0QixJQUFJLENBQUMsSUFBSSxLQUFLLDBCQUFjLENBQUMsS0FBSztZQUNsQyxJQUFJLENBQUMsSUFBSSxLQUFLLDBCQUFjLENBQUMsT0FBTyxFQUFFO1lBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQUU7UUFFMUQsbUJBQW1CO1FBQ25CLElBQUksSUFBSSxDQUFDLElBQUksS0FBSywwQkFBYyxDQUFDLFNBQVMsRUFBRTtZQUN4QyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDWix3QkFBd0I7WUFDeEIsdUNBQXVDO1NBQzFDO1FBRUQsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7UUFFdEIsSUFBSSxPQUFPLEdBQWEsRUFBRSxDQUFDO1FBQzNCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDdkIsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLElBQUksSUFBSSxFQUFFO1lBQ04sTUFBTTtnQkFDTixJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUss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