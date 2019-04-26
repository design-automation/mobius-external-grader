"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
const arrays_1 = require("../util/arrays");
/**
 * Geo-info attribute class for one attribute.
 * The attributs stores key-value pairs.
 * Multiple keys point to the same value.
 * So for example, [[1,3], "a"],[[0,4], "b"] can be converted into sequential arrays.
 * The values would be ["a", "b"]
 * The keys would be [1,0,,0,1] (Note the undefined value in the middle.)
 *
 */
class GIAttribMap {
    /**
     * Creates an attribute.
     * @param attrib_data
     */
    constructor(name, data_type, data_size) {
        this._name = name;
        this._data_type = data_type;
        this._data_size = data_size;
        // the maps
        this._num_vals = 0;
        this._map_val_k_to_val_i = new Map();
        this._map_val_i_to_val = new Map();
        this._map_val_i_to_ents_i = new Map();
        this._map_ent_i_to_val_i = new Map();
    }
    /**
     * Returns the JSON data for this attribute.
     */
    getData() {
        const _data = [];
        this._map_val_i_to_ents_i.forEach((ents_i, val_i) => {
            const val = this._map_val_i_to_val.get(val_i);
            _data.push([ents_i, val]);
        });
        return {
            name: this._name,
            data_type: this._data_type,
            data_size: this._data_size,
            data: _data
        };
    }
    // /**
    //  * Adds ent_ities to this attribute from JSON data.
    //  * The existing attribute data in the model is not deleted.
    //  * @param attrib_data The JSON data for the new ent_ities.
    //  */
    // public addData(attrib_data: IAttribData, ent_i_offset: number): void {
    //     if (this._name !== attrib_data.name ||
    //         this._data_type !== attrib_data.data_type ||
    //         this._data_size !== attrib_data.data_size) {
    //         throw Error('Attributes do not match.');
    //     }
    //     // increment all the keys by the number of ent_ities in the existing data
    //     attrib_data.data.forEach( keys_value => {
    //         const new_keys: number[] = keys_value[0].map(key => key + ent_i_offset);
    //         const value: TAttribDataTypes = keys_value[1];
    //         this.setEntVal(new_keys, value);
    //     });
    // }
    /**
     * Returns the name of this attribute.
     */
    getName() {
        return this._name;
    }
    /**
     * Returns the data type of this attribute.
     */
    getDataType() {
        return this._data_type;
    }
    /**
     * Returns the data size of this attribute.
     */
    getDataSize() {
        return this._data_size;
    }
    /**
     * Returns true if this value exists in the attributes.
     */
    hasVal(val) {
        return this._map_val_k_to_val_i.has(this._valToValkey(val));
    }
    /**
     * Returns true if thereis an entity that has a value (i.e. the value is not undefined).
     */
    hasEnt(ent_i) {
        return this._map_ent_i_to_val_i.has(ent_i);
    }
    /**
     * Delete the entities from this attribute map.
     */
    delEnt(ents_i) {
        ents_i = (Array.isArray(ents_i)) ? ents_i : [ents_i];
        ents_i.forEach(ent_i => {
            // _map_ent_i_to_val_i: Map<number, number>
            const val_i = this._map_ent_i_to_val_i.get(ent_i);
            if (val_i !== undefined) {
                // del the entity from _map_ent_i_to_val_i
                this._map_ent_i_to_val_i.delete(ent_i);
                // del the entity from _map_val_i_to_ents_i
                const other_ents_i = this._map_val_i_to_ents_i.get(val_i);
                other_ents_i.splice(other_ents_i.indexOf(ent_i), 1);
                // now clean up just in case that was the last entity with this value
                this._cleanUp(val_i);
            }
        });
    }
    /**
     * Returns a nested array of entities and values, like this:
     * [ [[2,4,6,8], 'hello'], [[9,10], 'world']]
     * This is the same format as used in gi-json
     * This matches the method setEntsVals()
     */
    getEntsVals() {
        const ents_i_values = [];
        this._map_val_i_to_ents_i.forEach((ents_i, val_i) => {
            const value = this._map_val_i_to_val.get(val_i);
            ents_i_values.push([ents_i, value]);
        });
        return ents_i_values;
    }
    /**
     * Sets the value for multiple entity-value pairs at the same time.
     * @param ent_i
     * @param val
     */
    setEntsVals(ents_i_values) {
        for (let i = 0; i < ents_i_values.length; i++) {
            this.setEntVal(ents_i_values[i][0], ents_i_values[i][1]);
        }
    }
    /**
     * Sets the value for a given entity or entities.
     * @param ent_i
     * @param val
     */
    setEntVal(ents_i, val) {
        const val_k = this._valToValkey(val);
        // check if this val already exists, if not create it
        if (!this._map_val_k_to_val_i.has(val_k)) {
            this._map_val_k_to_val_i.set(val_k, this._num_vals);
            this._map_val_i_to_val.set(this._num_vals, val);
            this._map_val_i_to_ents_i.set(this._num_vals, []);
            this._num_vals += 1;
        }
        // get the new val_i
        const new_val_i = this._map_val_k_to_val_i.get(val_k);
        ents_i = (Array.isArray(ents_i)) ? ents_i : [ents_i];
        // loop through all the unique ents, and set _map_ent_i_to_val_i
        let unique_ents_i = ents_i;
        if (ents_i.length > 1) {
            unique_ents_i = Array.from(new Set(ents_i));
        }
        unique_ents_i.forEach(ent_i => {
            // keep the old value for later
            const old_val_i = this._map_ent_i_to_val_i.get(ent_i);
            // for each ent_i, set the new val_i
            this._map_ent_i_to_val_i.set(ent_i, new_val_i);
            // clean up the old val_i
            if (old_val_i !== undefined && old_val_i !== new_val_i) {
                arrays_1.arrRem(this._map_val_i_to_ents_i.get(old_val_i), ent_i);
                this._cleanUp(old_val_i);
            }
        });
        // for the new val_i, set it ot point to all the ents that have this value
        const exist_ents_i = this._map_val_i_to_ents_i.get(new_val_i);
        const exist_new_ents_i = Array.from(new Set(exist_ents_i.concat(ents_i)));
        this._map_val_i_to_ents_i.set(new_val_i, exist_new_ents_i);
    }
    /**
     * Sets the indexed value for a given entity or entities.
     * This assumes that this attribute has a data_size > 1.
     * @param ent_i
     * @param val
     */
    setEntIdxVal(ents_i, val_index, val) {
        ents_i = (Array.isArray(ents_i)) ? ents_i : [ents_i];
        // loop through all the unique ents, and setEntVal
        let unique_ents_i = ents_i;
        if (ents_i.length > 1) {
            unique_ents_i = Array.from(new Set(ents_i));
        }
        unique_ents_i.forEach(ent_i => {
            const exist_value_arr = this.getEntVal(ent_i);
            const new_value_arr = exist_value_arr.slice(); // IMPORTANT clone the array
            new_value_arr[val_index] = val;
            this.setEntVal(ent_i, new_value_arr);
        });
        // check that none of the old values need to be cleaned up
        // TODO
    }
    /**
     * Gets the value for a given entity, or an array of values given an array of entities.
     * Returns undefined if the entity does not exist
     * @param ent_i
     */
    getEntVal(ents_i) {
        if (!Array.isArray(ents_i)) {
            const ent_i = ents_i;
            const val_i = this._map_ent_i_to_val_i.get(ent_i);
            if (val_i === undefined) {
                return undefined;
            }
            return this._map_val_i_to_val.get(val_i);
        }
        else {
            return ents_i.map(ent_i => this.getEntVal(ent_i));
        }
    }
    /**
     * Gets the indexed value for a given entity.
     * Returns undefined if the entity does not exist
     * This assumes that this attribute has a data_size > 1.
     * @param ent_i
     */
    getEntIdxVal(ents_i, val_index) {
        if (!Array.isArray(ents_i)) {
            const ent_i = ents_i;
            const exist_value_arr = this.getEntVal(ent_i);
            return exist_value_arr[val_index];
        }
        else {
            return ents_i.map(ent_i => this.getEntVal(ent_i)[val_index]);
        }
    }
    /**
     * Gets all the keys that have a given value
     * If the value does not exist an empty array is returned
     * @param val
     */
    getEntsFromVal(val) {
        const val_i = this._map_val_k_to_val_i.get(this._valToValkey(val));
        if (val_i === undefined) {
            return [];
        }
        return this._map_val_i_to_ents_i.get(val_i);
    }
    /**
     * Returns an array of entity indices which do not have a value (undefined)
     */
    getEntsWithoutVal(ents_i) {
        return ents_i.filter(ent_i => !this._map_ent_i_to_val_i.has(ent_i));
    }
    /**
     * Returns an array of entity indices which have a value (not undefined)
     */
    getEntsWithVal(ents_i) {
        return ents_i.filter(ent_i => this._map_ent_i_to_val_i.has(ent_i));
    }
    /**
     * Executes a query
     * @param ents_i
     * @param val_arr_index The index of the value in the array
     * @param operator The relational operator, ==, !=, <=, >=, etc
     * @param val_k The string version of the value.
     */
    queryVal(ents_i, val_arr_index, operator, val_k) {
        // check the validity of the arguments
        const indexed = (val_arr_index !== null && val_arr_index !== undefined);
        if (indexed) {
            if (!Number.isInteger(val_arr_index)) {
                throw new Error('Query index "' + val_arr_index + '" cannot be converted to an integer: ' + val_arr_index);
            }
            if (!(this._data_size > 0)) {
                throw new Error('Query attribute ' + this._name + ' is not a list.');
            }
        }
        if (this._data_type === common_1.EAttribDataTypeStrs.STRING) {
            if (operator !== common_1.EQueryOperatorTypes.IS_EQUAL && operator !== common_1.EQueryOperatorTypes.IS_NOT_EQUAL) {
                {
                    throw new Error('Query operator "' + operator + '" and query "' + val_k + '" value are incompatible.');
                }
            }
        }
        if (val_k === 'null') {
            if (operator !== common_1.EQueryOperatorTypes.IS_EQUAL && operator !== common_1.EQueryOperatorTypes.IS_NOT_EQUAL) {
                {
                    throw new Error('Query operator ' + operator + ' and query "null" value are incompatible.');
                }
            }
        }
        // search, no index
        if (indexed) {
            if (this._data_type === common_1.EAttribDataTypeStrs.FLOAT) {
                return this._searchIndexedNumValue(ents_i, val_arr_index, operator, val_k);
            }
            else {
                return this._searchIndexedStrValue(ents_i, val_arr_index, operator, val_k);
            }
        }
        else {
            if (this._data_type === common_1.EAttribDataTypeStrs.FLOAT) {
                return this._searchNumValue(ents_i, operator, val_k);
            }
            else {
                return this._searchStrValue(ents_i, operator, val_k);
            }
        }
    }
    //  ===============================================================================================================
    //  Private methods
    //  ===============================================================================================================
    /**
     * Convert a value into a map key
     */
    _valToValkey(val) {
        if (this._data_size === 1 && this._data_type === common_1.EAttribDataTypeStrs.STRING) {
            if (typeof val === 'string') {
                return val;
            }
            else {
                return String(val);
            }
        }
        if (this._data_size === 1 && this._data_type === common_1.EAttribDataTypeStrs.FLOAT) {
            if (typeof val === 'string') {
                return parseFloat(val);
            }
            else {
                return val;
            }
        }
        return JSON.stringify(val);
    }
    /**
     * Checks if anything still points to this value
     * If not, cleans up the arrays
     * _map_val_i_to_ents_i
     * _map_val_i_to_val
     * _map_val_k_to_val_i
     */
    _cleanUp(val_i) {
        if (val_i !== undefined) {
            // _map_val_i_to_ents_i: Map<number, number[]>
            const ents_i = this._map_val_i_to_ents_i.get(val_i);
            if (ents_i.length === 0) {
                this._map_val_i_to_ents_i.delete(val_i);
                // _map_val_i_to_val: Map<number, TAttribDataTypes>
                const val = this._map_val_i_to_val.get(val_i);
                this._map_val_i_to_val.delete(val_i);
                // _map_val_k_to_val_i: Map<string|number, number>
                this._map_val_k_to_val_i.delete(this._valToValkey(val));
            }
        }
    }
    /**
     * Compare two values
     * @param operator
     * @param val1
     * @param val2
     */
    _compare(operator, val1, val2) {
        if (val1 === undefined) {
            val1 = null;
        }
        if (val2 === undefined) {
            val2 = null;
        }
        switch (operator) {
            // ==
            case common_1.EQueryOperatorTypes.IS_EQUAL:
                return val1 === val2;
            // !=
            case common_1.EQueryOperatorTypes.IS_NOT_EQUAL:
                return val1 !== val2;
            // >
            case common_1.EQueryOperatorTypes.IS_GREATER:
                return val1 > val2;
            // >=
            case common_1.EQueryOperatorTypes.IS_GREATER_OR_EQUAL:
                return val1 >= val2;
            // <
            case common_1.EQueryOperatorTypes.IS_LESS:
                return val1 < val2;
            // <=
            case common_1.EQueryOperatorTypes.IS_LESS_OR_EQUAL:
                return val1 <= val2;
            default:
                throw new Error('Query operator not found: ' + operator);
        }
    }
    /**
     * Searches for the value using the operator
     */
    _searchNumValue(ents_i, operator, val_k) {
        // clean up
        val_k = val_k.replace(common_1.RE_SPACES, '');
        // first deal with null cases
        if (val_k === 'null' && operator === common_1.EQueryOperatorTypes.IS_EQUAL) {
            return this.getEntsWithoutVal(ents_i);
        }
        else if (val_k === 'null' && operator === common_1.EQueryOperatorTypes.IS_NOT_EQUAL) {
            return this.getEntsWithVal(ents_i);
        }
        // get the values to search for
        const search_val = Number(val_k);
        if (isNaN(search_val)) {
            throw new Error('Query error: the search value is not a number.');
        }
        // search
        let found_keys;
        switch (operator) {
            case common_1.EQueryOperatorTypes.IS_EQUAL:
                found_keys = this.getEntsFromVal(search_val);
                if (found_keys === undefined) {
                    return [];
                }
                return ents_i.filter(ent_i => found_keys.indexOf(ent_i) !== -1);
            case common_1.EQueryOperatorTypes.IS_NOT_EQUAL:
                found_keys = this.getEntsFromVal(search_val);
                if (found_keys === undefined) {
                    return [];
                }
                return ents_i.filter(ent_i => found_keys.indexOf(ent_i) === -1);
            case common_1.EQueryOperatorTypes.IS_GREATER:
            case common_1.EQueryOperatorTypes.IS_GREATER_OR_EQUAL:
            case common_1.EQueryOperatorTypes.IS_LESS:
            case common_1.EQueryOperatorTypes.IS_LESS_OR_EQUAL:
                found_keys = [];
                for (const ent_i of ents_i) {
                    const val = this.getEntVal(ent_i);
                    if ((val !== null && val !== undefined) && this._compare(operator, val, search_val)) {
                        found_keys.push(ent_i);
                    }
                }
                return found_keys;
            default:
                throw new Error('Query error: Operator not found.');
        }
    }
    /**
     * Searches for the value using the operator
     */
    _searchStrValue(ents_i, operator, val_k) {
        // first deal with null cases
        if (val_k === 'null' && operator === common_1.EQueryOperatorTypes.IS_EQUAL) {
            return this.getEntsWithoutVal(ents_i);
        }
        else if (val_k === 'null' && operator === common_1.EQueryOperatorTypes.IS_NOT_EQUAL) {
            return this.getEntsWithVal(ents_i);
        }
        // get the values to search for
        const search_val = val_k;
        // search
        let found_keys;
        switch (operator) {
            case common_1.EQueryOperatorTypes.IS_EQUAL:
                found_keys = this.getEntsFromVal(search_val);
                if (found_keys === undefined) {
                    return [];
                }
                return ents_i.filter(ent_i => found_keys.indexOf(ent_i) !== -1);
            case common_1.EQueryOperatorTypes.IS_NOT_EQUAL:
                found_keys = this.getEntsFromVal(search_val);
                if (found_keys === undefined) {
                    return [];
                }
                return ents_i.filter(ent_i => found_keys.indexOf(ent_i) === -1);
            case common_1.EQueryOperatorTypes.IS_GREATER:
            case common_1.EQueryOperatorTypes.IS_GREATER_OR_EQUAL:
            case common_1.EQueryOperatorTypes.IS_LESS:
            case common_1.EQueryOperatorTypes.IS_LESS_OR_EQUAL:
                throw new Error('Query error: Operator not allowed with string values.');
            default:
                throw new Error('Query error: Operator not found.');
        }
    }
    /**
     * Searches for the value using the operator
     */
    _searchIndexedNumValue(ents_i, val_arr_index, operator, val_k) {
        // clean up
        val_k = val_k.replace(common_1.RE_SPACES, '');
        // get the search value, null or a number
        let search_val;
        if (val_k === 'null') {
            search_val = null;
        }
        else { // value_str must be a number
            search_val = Number.parseFloat(val_k);
            if (isNaN(search_val)) {
                throw new Error('Query value "' + val_k + '" cannot be converted to a number: ' + val_k);
            }
        }
        // do the search
        const found_keys = [];
        for (const ent_i of ents_i) {
            const search_value_arr = this.getEntVal(ent_i);
            if ((search_value_arr !== undefined) &&
                this._compare(operator, search_value_arr[val_arr_index], search_val)) {
                found_keys.push(ent_i);
            }
        }
        return found_keys;
    }
    /**
     * Searches for the value using the operator
     */
    _searchIndexedStrValue(ents_i, val_arr_index, operator, val_k) {
        // clean up
        val_k = val_k.replace(common_1.RE_SPACES, '');
        // get the search value, null or a string
        let search_val;
        if (val_k === 'null') {
            search_val = null;
        }
        else { // value_str must be a number
            search_val = val_k;
        }
        // do the search
        const found_keys = [];
        for (const ent_i of ents_i) {
            const search_value_arr = this.getEntVal(ent_i);
            if (this._compare(operator, search_value_arr[val_arr_index], search_val)) {
                found_keys.push(ent_i);
            }
        }
        return found_keys;
    }
}
exports.GIAttribMap = GIAttribMap;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lBdHRyaWJNYXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlicy9nZW8taW5mby9HSUF0dHJpYk1hcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHFDQUE4RztBQUM5RywyQ0FBd0M7QUFFeEM7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFhLFdBQVc7SUFjcEI7OztPQUdHO0lBQ0gsWUFBWSxJQUFZLEVBQUUsU0FBOEIsRUFBRSxTQUFpQjtRQUN2RSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztRQUM1QixJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztRQUM1QixXQUFXO1FBQ1gsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbkIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDckMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDbkMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDdEMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7SUFDekMsQ0FBQztJQUNEOztPQUVHO0lBQ0ksT0FBTztRQUNWLE1BQU0sS0FBSyxHQUF3QyxFQUFFLENBQUM7UUFDdEQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQWdCLEVBQUUsS0FBYSxFQUFFLEVBQUU7WUFDbEUsTUFBTSxHQUFHLEdBQXFCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzlCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTztZQUNILElBQUksRUFBRSxJQUFJ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