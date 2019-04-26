"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
const GIAttribMap_1 = require("./GIAttribMap");
const vectors_1 = require("../../libs/geom/vectors");
const mathjs = __importStar(require("mathjs"));
/**
 * Class for attributes.
 */
class GIAttribsAdd {
    /**
      * Creates an object to store the attribute data.
      * @param model The JSON data
      */
    constructor(model, attribs_maps) {
        this._model = model;
        this._attribs_maps = attribs_maps;
    }
    /**
     * Creates a new attribte.
     * If the attribute already exists, then the existing attribute is returned.
     *
     * @param ent_type The level at which to create the attribute.
     * @param name The name of the attribute.
     * @param data_type The data type of the attribute.
     * @param data_size The data size of the attribute. For example, an XYZ vector has size=3.
     */
    addAttrib(ent_type, name, data_type, data_size) {
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        if (!attribs.has(name)) {
            const attrib = new GIAttribMap_1.GIAttribMap(name, data_type, data_size);
            attribs.set(name, attrib);
        }
        else {
            if (attribs.get(name).getDataType() !== data_type || attribs.get(name).getDataSize() !== data_size) {
                throw new Error('Attribute could not be created do to conflict with existing attribute with same name.');
            }
        }
        return attribs.get(name);
    }
    /**
     * Set a model attrib value
     * @param id
     * @param name
     * @param value
     */
    setModelAttribValue(name, value) {
        const attribs_maps_key = common_1.EEntTypeStr[common_1.EEntType.MOD];
        const attrib = this._attribs_maps[attribs_maps_key];
        attrib.set(name, value);
    }
    /**
     * Set a model attrib indexed value.
     * If the attribute does not exist, it throws an error.
     * @param id
     * @param name
     * @param value
     */
    setModelAttribIndexedValue(name, value_index, value) {
        const attribs_maps_key = common_1.EEntTypeStr[common_1.EEntType.MOD];
        const attrib = this._attribs_maps[attribs_maps_key];
        const list_value = attrib.get(name);
        if (list_value === undefined) {
            throw new Error('Attribute with this name does not exist.');
        }
        if (!Array.isArray(list_value)) {
            throw new Error('Attribute is not a list, so indexed values are not allowed.');
        }
        if (value_index >= list_value.length) {
            throw new Error('Value index is out of range for attribute list size.');
        }
        list_value[value_index] = value;
    }
    /**
     * Set an entity attrib value
     * If the attribute does not exist, then it is created.
     * @param id
     * @param name
     * @param value
     */
    setAttribValue(ent_type, ents_i, name, value) {
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        if (attribs.get(name) === undefined) {
            const [new_data_type, new_data_size] = this._checkDataTypeSize(value);
            this.addAttrib(ent_type, name, new_data_type, new_data_size);
        }
        attribs.get(name).setEntVal(ents_i, value);
    }
    /**
     * Set an entity attrib indexed value.
     * If the attribute does not exist, it throws an error.
     * @param id
     * @param name
     * @param value
     */
    setAttribIndexedValue(ent_type, ents_i, name, value_index, value) {
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        const attrib = attribs.get(name);
        if (attrib === undefined) {
            throw new Error('Attribute does not exist.');
        }
        if (attrib.getDataSize() === 1) {
            throw new Error('Attribute is not a list, so indexed values are not allowed.');
        }
        if (value_index >= attrib.getDataSize()) {
            throw new Error('Value index is out of range for attribute list size.');
        }
        attrib.setEntIdxVal(ents_i, value_index, value);
    }
    /**
     * Delete the entity from an attribute
     * If there is no value for the entity, then this does nothing
     * If there is a value, then both the entity index and the value are deleted
     * @param ent_type
     * @param name
     */
    delEntFromAttribs(ent_type, ents_i) {
        // get the attrib names
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        attribs.forEach(attrib => attrib.delEnt(ents_i));
    }
    /**
     * Set the xyz position by index
     * @param index
     * @param value
     */
    setPosiCoords(index, xyz) {
        this._attribs_maps.ps.get(common_1.EAttribNames.COORDS).setEntVal(index, xyz);
    }
    /**
     * Move the xyz position by index
     * @param index
     * @param value
     */
    movePosiCoords(index, xyz) {
        const old_xyz = this._attribs_maps.ps.get(common_1.EAttribNames.COORDS).getEntVal(index);
        const new_xyz = vectors_1.vecAdd(old_xyz, xyz);
        this._attribs_maps.ps.get(common_1.EAttribNames.COORDS).setEntVal(index, new_xyz);
    }
    /**
     * Copy all attribs from one entity to another entity
     * @param ent_type
     * @param name
     */
    copyAttribs(ent_type, from_ent_i, to_ent_i) {
        // get the attrib names
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        const attrib_names = Array.from(attribs.keys());
        // copy each attrib
        for (const attrib_name of attrib_names) {
            const attrib = attribs.get(attrib_name);
            const attrib_value = attrib.getEntVal(from_ent_i);
            attrib.setEntVal(to_ent_i, attrib_value);
        }
    }
    /**
     * Promotes attrib values up and down the hierarchy.
     */
    promoteAttribValues(ent_type, attrib_name, indices, to_ent_type, method) {
        if (ent_type === to_ent_type) {
            return;
        }
        // check that the attribute exists
        if (!this._model.attribs.query.hasAttrib(ent_type, attrib_name)) {
            throw new Error('The attribute does not exist.');
        }
        // get the data type and data size of the existing attribute
        const data_type = this._model.attribs.query.getAttribDataType(ent_type, attrib_name);
        const data_size = this._model.attribs.query.getAttribDataSize(ent_type, attrib_name);
        // move attributes from entities up to the model, or form model down to entities
        if (to_ent_type === common_1.EEntType.MOD) {
            this.addAttrib(to_ent_type, attrib_name, data_type, data_size);
            const attrib_values = [];
            for (const index of indices) {
                attrib_values.push(this._model.attribs.query.getAttribValue(ent_type, attrib_name, index));
            }
            const value = this._aggregateValues(attrib_values, data_size, method);
            this.setModelAttribValue(attrib_name, value);
            return;
        }
        else if (ent_type === common_1.EEntType.MOD) {
            const value = this._model.attribs.query.getModelAttribValue(attrib_name);
            this.addAttrib(to_ent_type, attrib_name, data_type, data_size);
            const target_ents_i = this._model.geom.query.getEnts(to_ent_type, false);
            for (const target_ent_i of target_ents_i) {
                this.setAttribValue(to_ent_type, target_ent_i, attrib_name, value);
            }
            return;
        }
        // get all the values for each target
        const attrib_values_map = new Map();
        for (const index of indices) {
            const attrib_value = this._model.attribs.query.getAttribValue(ent_type, attrib_name, index);
            const target_ents_i = this._model.geom.query.navAnyToAny(ent_type, to_ent_type, index);
            for (const target_ent_i of target_ents_i) {
                if (!attrib_values_map.has(target_ent_i)) {
                    attrib_values_map.set(target_ent_i, []);
                }
                attrib_values_map.get(target_ent_i).push(attrib_value);
            }
        }
        // create the new target attribute if it does not already exist
        this.addAttrib(to_ent_type, attrib_name, data_type, data_size);
        // calculate the new value and set the attribute
        attrib_values_map.forEach((attrib_values, target_ent_i) => {
            let value = attrib_values[0];
            if (attrib_values.length > 1 && data_type === common_1.EAttribDataTypeStrs.FLOAT) {
                value = this._aggregateValues(attrib_values, data_size, method);
            }
            this.setAttribValue(to_ent_type, target_ent_i, attrib_name, value);
        });
    }
    /**
     * Transfer attrib values to neighbouring entities of the same type.
     * Neighbouring entities are those that share the same positions.
     */
    transferAttribValues(ent_type, attrib_name, indices, method) {
        throw new Error('Attribute transfer is not yet implemented.');
    }
    // ============================================================================
    // Private methods
    // ============================================================================
    _aggregateValues(values, data_size, method) {
        switch (method) {
            case common_1.EAttribPromote.AVERAGE:
                if (data_size > 1) {
                    const result = [];
                    for (let i = 0; i < data_size; i++) {
                        result[i] = mathjs.mean(values.map(vec => vec[i]));
                    }
                    return result;
                }
                else {
                    return mathjs.mean(values);
                }
            case common_1.EAttribPromote.MEDIAN:
                if (data_size > 1) {
                    const result = [];
                    for (let i = 0; i < data_size; i++) {
                        result[i] = mathjs.median(values.map(vec => vec[i]));
                    }
                    return result;
                }
                else {
                    return mathjs.median(values);
                }
            case common_1.EAttribPromote.SUM:
                if (data_size > 1) {
                    const result = [];
                    for (let i = 0; i < data_size; i++) {
                        result[i] = mathjs.sum(values.map(vec => vec[i]));
                    }
                    return result;
                }
                else {
                    return mathjs.sum(values);
                }
            case common_1.EAttribPromote.MIN:
                if (data_size > 1) {
                    const result = [];
                    for (let i = 0; i < data_size; i++) {
                        result[i] = mathjs.min(values.map(vec => vec[i]));
                    }
                    return result;
                }
                else {
                    return mathjs.min(values);
                }
            case common_1.EAttribPromote.MAX:
                if (data_size > 1) {
                    const result = [];
                    for (let i = 0; i < data_size; i++) {
                        result[i] = mathjs.max(values.map(vec => vec[i]));
                    }
                    return result;
                }
                else {
                    return mathjs.max(values);
                }
            case common_1.EAttribPromote.LAST:
                return values[values.length - 1];
            default:
                return values[0]; // EAttribPromote.FIRST
        }
    }
    /**
     * Utility method to check the data type and size of a value
     * @param value
     */
    _checkDataTypeSize(value) {
        let data_size;
        let first_value = null;
        if (Array.isArray(value)) {
            const values = value;
            if (values.length === 1) {
                throw new Error('An array data type must have more than one value.');
            }
            first_value = values[0];
            data_size = values.length;
        }
        else {
            first_value = value;
            data_size = 1;
        }
        let data_type = null;
        if (typeof first_value === 'number') {
            data_type = common_1.EAttribDataTypeStrs.FLOAT;
        }
        else if (typeof first_value === 'string') {
            data_type = common_1.EAttribDataTypeStrs.STRING;
        }
        else {
            throw new Error('Data type for new attribute not recognised.');
        }
        return [data_type, data_size];
    }
}
exports.GIAttribsAdd = GIAttribsAdd;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lBdHRyaWJzQWRkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYnMvZ2VvLWluZm8vR0lBdHRyaWJzQWRkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNBLHFDQUNvSDtBQUNwSCwrQ0FBNEM7QUFDNUMscURBQWlFO0FBQ2pFLCtDQUFpQztBQUVqQzs7R0FFRztBQUNILE1BQWEsWUFBWTtJQUd0Qjs7O1FBR0k7SUFDSCxZQUFZLEtBQWMsRUFBRSxZQUEwQjtRQUNsRCxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNwQixJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztJQUN0QyxDQUFDO0lBQ0Q7Ozs7Ozs7O09BUUc7SUFDSSxTQUFTLENBQUMsUUFBa0IsRUFBRSxJQUFZLEVBQUUsU0FBOEIsRUFBRSxTQUFpQjtRQUNoRyxNQUFNLGdCQUFnQixHQUFXLG9CQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdkQsTUFBTSxPQUFPLEdBQTZCLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUMvRSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNwQixNQUFNLE1BQU0sR0FBZ0IsSUFBSSx5QkFBVyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDeEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7U0FDN0I7YUFBTTtZQUNILElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxTQUFTLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxTQUFTLEVBQUU7Z0JBQ2hHLE1BQU0sSUFBSSxLQUFLLENBQUMsdUZBQXVGLENBQUMsQ0FBQzthQUM1RztTQUNKO1FBQ0QsT0FB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