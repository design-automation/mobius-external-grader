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
const vectors_1 = require("../geom/vectors");
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
     * Creates a new attribte, at either the model level or the entity level.
     *
     * For entity attributes, if an attribute with the same name but different data_type already exists,
     * then an error is thrown.
     *
     * @param ent_type The level at which to create the attribute.
     * @param name The name of the attribute.
     * @param data_type The data type of the attribute.
     */
    addAttrib(ent_type, name, data_type) {
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        if (ent_type === common_1.EEntType.MOD) {
            if (!attribs.has(name)) {
                attribs.set(name, null);
            }
        }
        else {
            if (!attribs.has(name)) {
                const attrib = new GIAttribMap_1.GIAttribMap(name, data_type);
                attribs.set(name, attrib);
            }
            else {
                if (attribs.get(name).getDataType() !== data_type) {
                    throw new Error('Attribute could not be created due to conflict with existing attribute with same name.');
                }
            }
        }
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
        if (value_index < 0) {
            value_index += list_value.length;
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
            const new_data_type = this._checkDataTypeSize(value);
            this.addAttrib(ent_type, name, new_data_type);
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
        if (attrib.getDataType() !== common_1.EAttribDataTypeStrs.LIST) {
            throw new Error('Attribute is not a list, so indexed values are not allowed.');
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
    pushAttribValues(source_ent_type, source_attrib_name, source_indices, target_ent_type, target_attrib_name, method) {
        if (source_ent_type === target_ent_type) {
            return;
        }
        // check that the attribute exists
        if (!this._model.attribs.query.hasAttrib(source_ent_type, source_attrib_name)) {
            throw new Error('The attribute does not exist.');
        }
        // get the data type and data size of the existing attribute
        const data_type = this._model.attribs.query.getAttribDataType(source_ent_type, source_attrib_name);
        const data_size = this._model.attribs.query.getAttribDataSize(source_ent_type, source_attrib_name);
        // move attributes from entities up to the model, or form model down to entities
        if (target_ent_type === common_1.EEntType.MOD) {
            this.addAttrib(target_ent_type, target_attrib_name, data_type);
            const attrib_values = [];
            for (const index of source_indices) {
                attrib_values.push(this._model.attribs.query.getAttribValue(source_ent_type, source_attrib_name, index));
            }
            const value = this._aggregateValues(attrib_values, data_size, method);
            this.setModelAttribValue(target_attrib_name, value);
            return;
        }
        else if (source_ent_type === common_1.EEntType.MOD) {
            const value = this._model.attribs.query.getModelAttribValue(source_attrib_name);
            this.addAttrib(target_ent_type, target_attrib_name, data_type);
            const target_ents_i = this._model.geom.query.getEnts(target_ent_type, false);
            for (const target_ent_i of target_ents_i) {
                this.setAttribValue(target_ent_type, target_ent_i, target_attrib_name, value);
            }
            return;
        }
        // get all the values for each target
        const attrib_values_map = new Map();
        for (const index of source_indices) {
            const attrib_value = this._model.attribs.query.getAttribValue(source_ent_type, source_attrib_name, index);
            const target_ents_i = this._model.geom.query.navAnyToAny(source_ent_type, target_ent_type, index);
            for (const target_ent_i of target_ents_i) {
                if (!attrib_values_map.has(target_ent_i)) {
                    attrib_values_map.set(target_ent_i, []);
                }
                attrib_values_map.get(target_ent_i).push(attrib_value);
            }
        }
        // create the new target attribute if it does not already exist
        this.addAttrib(target_ent_type, target_attrib_name, data_type);
        // calculate the new value and set the attribute
        attrib_values_map.forEach((attrib_values, target_ent_i) => {
            let value = attrib_values[0];
            if (attrib_values.length > 1 && data_type === common_1.EAttribDataTypeStrs.NUMBER) {
                value = this._aggregateValues(attrib_values, data_size, method);
            }
            this.setAttribValue(target_ent_type, target_ent_i, target_attrib_name, value);
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
            case common_1.EAttribPush.AVERAGE:
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
            case common_1.EAttribPush.MEDIAN:
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
            case common_1.EAttribPush.SUM:
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
            case common_1.EAttribPush.MIN:
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
            case common_1.EAttribPush.MAX:
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
            case common_1.EAttribPush.LAST:
                return values[values.length - 1];
            default:
                return values[0]; // EAttribPush.FIRST
        }
    }
    // /**
    //  * Utility method to check the data type and size of a value
    //  * @param value
    //  */
    // private _checkDataTypeSize(value: TAttribDataTypes): [EAttribDataTypeStrs, number] {
    //     let data_size: number;
    //     let first_value = null;
    //     if (Array.isArray(value)) {
    //         const values = value as number[] | string[];
    //         if (values.length === 1) {
    //             throw new Error('An array data type must have more than one value.');
    //         }
    //         first_value = values[0];
    //         data_size = values.length;
    //     } else {
    //         first_value = value;
    //         data_size = 1;
    //     }
    //     let data_type: EAttribDataTypeStrs = null;
    //     if (typeof first_value === 'number') {
    //         data_type = EAttribDataTypeStrs.NUMBER;
    //     } else if (typeof first_value === 'string') {
    //         data_type = EAttribDataTypeStrs.STRING;
    //     } else {
    //         throw new Error('Data type for new attribute not recognised.');
    //     }
    //     return [data_type, data_size];
    // }
    /**
     * Utility method to check the data type of an attribute.
     * @param value
     */
    _checkDataTypeSize(value) {
        if (typeof value === 'string') {
            return common_1.EAttribDataTypeStrs.STRING;
        }
        if (typeof value === 'number') {
            return common_1.EAttribDataTypeStrs.NUMBER;
        }
        if (Array.isArray(value)) {
            return common_1.EAttribDataTypeStrs.LIST;
        }
        throw new Error('Data type for new attribute not recognised.');
    }
}
exports.GIAttribsAdd = GIAttribsAdd;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lBdHRyaWJzQWRkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYnMvZ2VvLWluZm8vR0lBdHRyaWJzQWRkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNBLHFDQUNpSDtBQUNqSCwrQ0FBNEM7QUFDNUMsNkNBQXlEO0FBQ3pELCtDQUFpQztBQUVqQzs7R0FFRztBQUNILE1BQWEsWUFBWTtJQUd0Qjs7O1FBR0k7SUFDSCxZQUFZLEtBQWMsRUFBRSxZQUEwQjtRQUNsRCxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNwQixJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztJQUN0QyxDQUFDO0lBQ0Q7Ozs7Ozs7OztPQVNHO0lBQ0ksU0FBUyxDQUFDLFFBQWtCLEVBQUUsSUFBWSxFQUFFLFNBQThCO1FBQzdFLE1BQU0sZ0JBQWdCLEdBQVcsb0JBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2RCxNQUFNLE9BQU8sR0FBcUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3ZFLElBQUksUUFBUSxLQUFLLGlCQUFRLENBQUMsR0FBRyxFQUFFO1lBQzNCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQzthQUMzQjtTQUNKO2FBQU07WUFDSCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDcEIsTUFBTSxNQUFNLEdBQWdCLElBQUkseUJBQVcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzdELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2FBQzdCO2lCQUFNO2dCQUNILElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFX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