import { INode } from './node.interface';
import { ProcedureTypes} from '../../model/procedure';
import { PortUtils } from '../../model/port';
import { IdGenerator } from '../../utils';
import { ModuleList } from '../../decorators';
import { _parameterTypes } from '../../core/modules';

export abstract class NodeUtils {

    static getNewNode(): INode {
        const node: INode = <INode>{
            name: 'Node',
            id: IdGenerator.getNodeID(),
            position: {x: 0, y: 0},
            enabled: false,
            type: '',
            procedure: [{type: 13, ID: '',
                parent: undefined,
                meta: {name: '', module: ''},
                variable: undefined,
                children: undefined,
                argCount: 0,
                args: [],
                print: false,
                enabled: true,
                selected: false,
                selectGeom: false,
                hasError: false}],
            localFunc: [{type: 13, ID: 'local_func_blank',
                parent: undefined,
                meta: {name: '', module: ''},
                variable: undefined,
                children: undefined,
                argCount: 0,
                args: [],
                print: false,
                enabled: true,
                selected: false,
                selectGeom: false,
                hasError: false}],
            state: {
                procedure: [],
                show_code: true,
                show_func: true
            },
            input: PortUtils.getNewInput(),
            output: PortUtils.getNewOutput()
        };
        node.input.parentNode = node;
        node.output.parentNode = node;
        return node;
    }

    static getStartNode(): INode {
        const node = NodeUtils.getNewNode();
        // node.procedure = [];
        node.enabled = true;
        node.state.show_code = false;
        node.state.show_func = false;
        node.name = 'Start';
        node.type = 'start';
        return node;
    }

    static getEndNode(): INode {
        const node = NodeUtils.getNewNode();
        const returnMeta = _parameterTypes.return.split('.');
        let check = false;
        for (const i of ModuleList) {
            if (i.module !== returnMeta[0]) { continue; }
            for ( const j of i.functions) {
                if (j.name !== returnMeta[1]) { continue; }
                const newReturn = {
                    type: ProcedureTypes.EndReturn,
                    ID: 'Return',
                    parent: undefined,
                    meta: {name: '', module: ''},
                    children: undefined,
                    variable: undefined,
                    argCount: j.argCount,
                    args: j.args,
                    print: false,
                    enabled: true,
                    selected: false,
                    terminate: false,
                    hasError: false
                };

                for (const arg of newReturn.args) {
                    arg.value = '';
                    arg.jsValue = '';
                }
                node.procedure.push(newReturn);
                check = true;
                break;
            }
            break;
        }
        if (!check) {
            console.log('CORE FUNCTION ERROR: Unable to retrieve return procedure, please check "Return" in _ParameterTypes.ts');
        }
        // node.procedure = [];
        node.name = 'End';
        node.type = 'end';
        return node;
    }
}
