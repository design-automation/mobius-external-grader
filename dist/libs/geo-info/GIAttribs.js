"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GIAttribsAdd_1 = require("./GIAttribsAdd");
const GIAttribsThreejs_1 = require("./GIAttribsThreejs");
const GIAttribsQuery_1 = require("./GIAttribsQuery");
const common_1 = require("./common");
const GIAttribsIO_1 = require("./GIAttribsIO");
const GIAttribModify_1 = require("./GIAttribModify");
function hashCode(s) {
    let h;
    for (let i = 0; i < s.length; i++) {
        // tslint:disable-next-line:no-bitwise
        h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    }
    return h;
}
/**
 * Class for attributes.
 */
class GIAttribs {
    /**
      * Creates an object to store the attribute data.
      * @param model The JSON data
      */
    constructor(model) {
        // maps, the key is the name, the value is the attrib map clas
        this._attribs_maps = {
            ps: new Map(),
            _v: new Map(),
            _e: new Map(),
            _w: new Map(),
            _f: new Map(),
            pt: new Map(),
            pl: new Map(),
            pg: new Map(),
            co: new Map(),
            mo: new Map()
        };
        this._model = model;
        this.io = new GIAttribsIO_1.GIAttribsIO(model, this._attribs_maps);
        this.add = new GIAttribsAdd_1.GIAttribsAdd(model, this._attribs_maps);
        this.modify = new GIAttribModify_1.GIAttribsModify(model, this._attribs_maps);
        this.query = new GIAttribsQuery_1.GIAttribsQuery(model, this._attribs_maps);
        this.threejs = new GIAttribsThreejs_1.GIAttribsThreejs(model, this._attribs_maps);
        this.add.addAttrib(common_1.EEntType.POSI, common_1.EAttribNames.COORDS, common_1.EAttribDataTypeStrs.LIST);
    }
    /**
     * Compares this model and another model.
     * @param model The model to compare with.
     */
    compare(model, result) {
        const eny_type_array = [
            common_1.EEntType.POSI,
            common_1.EEntType.VERT,
            common_1.EEntType.EDGE,
            common_1.EEntType.WIRE,
            common_1.EEntType.FACE,
            common_1.EEntType.POINT,
            common_1.EEntType.PLINE,
            common_1.EEntType.PGON,
            common_1.EEntType.COLL,
            common_1.EEntType.MOD
        ];
        const ent_type_strs = [
            'positions',
            'vertices',
            'edges',
            'wires',
            'faces',
            'points',
            'polylines',
            'polygons',
            'collections',
            'model'
        ];
        for (const ent_type of eny_type_array) {
            const ent_type_str = ent_type_strs[ent_type];
            const attrib_names_1 = this._model.attribs.query.getAttribNames(ent_type);
            const attrib_names_2 = model.attribs.query.getAttribNames(ent_type);
            if (attrib_names_1.length !== attrib_names_2.length) {
                result.matches = false;
                result.comment += 'The number of ' + ent_type_str + ' attributes do not match.\n';
                for (const name2 of attrib_names_2) {
                    if (attrib_names_1.indexOf(name2) === -1) {
                        result.matches = false;
                        result.comment += 'There is an additional "' + name2 + '" ' + ent_type_str + ' attribute.\n';
                    }
                }
            }
            for (const name1 of attrib_names_1) {
                const data_type_1 = this._model.attribs.query.getAttribDataType(ent_type, name1);
                if (attrib_names_2.indexOf(name1) === -1) {
                    result.matches = false;
                    result.comment += 'The "' + name1 + '" ' + ent_type_str + ' attribute with ';
                    result.comment += 'datatype "' + data_type_1 + '" is missing.\n';
                }
                else {
                    const data_type_2 = model.attribs.query.getAttribDataType(ent_type, name1);
                    if (data_type_1 !== data_type_2) {
                        result.matches = false;
                        result.comment += 'The "' + name1 + '" ' + ent_type_str + ' attribute datatype is wrong. ';
                        result.comment += 'It is "' + data_type_1 + '" but it should be "' + data_type_1 + '".\n';
                    }
                }
            }
        }
        // TODO compare attribute values
    }
}
exports.GIAttribs = GIAttribs;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lBdHRyaWJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYnMvZ2VvLWluZm8vR0lBdHRyaWJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaURBQThDO0FBQzlDLHlEQUFzRDtBQUN0RCxxREFBa0Q7QUFFbEQscUNBQW9HO0FBQ3BHLCtDQUE0QztBQUM1QyxxREFBbUQ7QUFFbkQsU0FBUyxRQUFRLENBQUMsQ0FBUztJQUN2QixJQUFJLENBQVMsQ0FBQztJQUNkLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQzdCLHNDQUFzQztRQUN0QyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDaEQ7SUFDRCxPQUFPLENBQUMsQ0FBQztBQUNiLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQWEsU0FBUztJQXFCbkI7OztRQUdJO0lBQ0gsWUFBWSxLQUFjO1FBdkIxQiw4REFBOEQ7UUFDdkQsa0JBQWEsR0FBaUI7WUFDakMsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1NBQ2hCLENBQUM7UUFZRSxJQUFJLENB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