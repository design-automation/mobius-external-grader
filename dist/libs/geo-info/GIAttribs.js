"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GIAttribsAdd_1 = require("./GIAttribsAdd");
const GIAttribsThreejs_1 = require("./GIAttribsThreejs");
const GIAttribsQuery_1 = require("./GIAttribsQuery");
const common_1 = require("./common");
const GIAttribsIO_1 = require("./GIAttribsIO");
function hashCode(s) {
    let h;
    for (let i = 0; i < s.length; i++)
        h = Math.imul(31, h) + s.charCodeAt(i) | 0;
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
        this.query = new GIAttribsQuery_1.GIAttribsQuery(model, this._attribs_maps);
        this.threejs = new GIAttribsThreejs_1.GIAttribsThreejs(model, this._attribs_maps);
        this.add.addAttrib(common_1.EEntType.POSI, common_1.EAttribNames.COORDS, common_1.EAttribDataTypeStrs.FLOAT, 3);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lBdHRyaWJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYnMvZ2VvLWluZm8vR0lBdHRyaWJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaURBQThDO0FBQzlDLHlEQUFzRDtBQUN0RCxxREFBa0Q7QUFFbEQscUNBQW9HO0FBQ3BHLCtDQUE0QztBQUU1QyxTQUFTLFFBQVEsQ0FBQyxDQUFTO0lBQ3ZCLElBQUksQ0FBUyxDQUFDO0lBQ2QsS0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFO1FBQzFCLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqRCxPQUFPLENBQUMsQ0FBQztBQUNiLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQWEsU0FBUztJQW9CbkI7OztRQUdJO0lBQ0gsWUFBWSxLQUFjO1FBdEIxQiw4REFBOEQ7UUFDdkQsa0JBQWEsR0FBaUI7WUFDakMsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1NBQ2hCLENBQUM7UUFXRSxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNwQixJQUFJLENB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