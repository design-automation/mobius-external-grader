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
    constructor(name, data_type) {
        this._name = name;
        this._data_type = data_type;
        this._data_size = 0;
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
     * Gets the name of this attribute.
     */
    getName() {
        return this._name;
    }
    /**
     * Sets the name of this attribute.
     */
    setName(name) {
        this._name = name;
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
     * Returns true if there is an entity that has a value (i.e. the value is not undefined).
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
     * [ [[2,4,6,8], 'hello'], [[9,10], 'world']]
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
        // check the type
        if (this._data_type === common_1.EAttribDataTypeStrs.NUMBER && typeof val !== 'number') {
            throw new Error('Error setting attribute value. Attribute is of type "number" but the value is not a number.');
        }
        else if (this._data_type === common_1.EAttribDataTypeStrs.STRING && typeof val !== 'string') {
            throw new Error('Error setting attribute value. Attribute is of type "string" but the value is not a string.');
        }
        else if (this._data_type === common_1.EAttribDataTypeStrs.LIST && !Array.isArray(val)) {
            throw new Error('Error setting attribute value. Attribute is of type "list" but the value is not a list.');
        }
        const val_k = this._valToValkey(val);
        // check if this val already exists, if not create it
        if (!this._map_val_k_to_val_i.has(val_k)) {
            this._map_val_k_to_val_i.set(val_k, this._num_vals);
            this._map_val_i_to_val.set(this._num_vals, val);
            this._map_val_i_to_ents_i.set(this._num_vals, []);
            this._num_vals += 1;
        }
        else if (this._data_type === common_1.EAttribDataTypeStrs.LIST) {
            val = val;
            if (val.length < this._data_size) {
                this._data_size = val.length;
            }
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
     * This assumes that this attribute is a list.
     * @param ent_i
     * @param val
     */
    setEntIdxVal(ents_i, val_index, val) {
        if (val_index < this._data_size - 1) {
            this._data_size = val_index + 1;
        }
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
     * This assumes that this attribute is a list.
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
     * The value can be a list
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
    // /**
    //  * Executes a query
    //  * @param ents_i
    //  * @param val_arr_index The index of the value in the array
    //  * @param operator The relational operator, ==, !=, <=, >=, etc
    //  * @param val_k The string version of the value.
    //  */
    // public queryVal(ents_i: number[], val_arr_index: number, operator: EFilterOperatorTypes, val_k: string): number[] {
    //     // check the validity of the arguments
    //     const indexed = (val_arr_index !== null && val_arr_index !== undefined);
    //     if (indexed) {
    //         if (!Number.isInteger(val_arr_index)) {
    //             throw new Error('Query index "' + val_arr_index + '" cannot be converted to an integer: ' + val_arr_index);
    //         }
    //         if (!(this._data_size > 0))  {
    //             throw new Error('Query attribute ' + this._name + ' is not a list.');
    //         }
    //     }
    //     if (this._data_type === EAttribDataTypeStrs.STRING) {
    //         if (operator !== EFilterOperatorTypes.IS_EQUAL && operator !== EFilterOperatorTypes.IS_NOT_EQUAL) {
    //             { throw new Error('Query operator "' + operator + '" and query "' + val_k + '" value are incompatible.'); }
    //         }
    //     }
    //     if (val_k === 'null') {
    //         if (operator !== EFilterOperatorTypes.IS_EQUAL && operator !== EFilterOperatorTypes.IS_NOT_EQUAL) {
    //             { throw new Error('Query operator ' + operator + ' and query "null" value are incompatible.'); }
    //         }
    //     }
    //     // search, no index
    //     if (indexed) {
    //         if (this._data_type === EAttribDataTypeStrs.NUMBER) {
    //             return this._searchIndexedNumValue(ents_i, val_arr_index, operator, val_k);
    //         } else {
    //             return this._searchIndexedStrValue(ents_i, val_arr_index, operator, val_k);
    //         }
    //     } else {
    //         if (this._data_type === EAttribDataTypeStrs.NUMBER) {
    //             return this._searchNumValue(ents_i, operator, val_k);
    //         } else {
    //             return this._searchStrValue(ents_i, operator, val_k);
    //         }
    //     }
    // }
    /**
     * Executes a query
     * @param ents_i
     * @param val_arr_index The index of the value in the array, or null if it is not an array
     * @param operator The relational operator, ==, !=, <=, >=, etc
     * @param search_val The value to search, string or number, or any[].
     */
    queryVal2(ents_i, val_arr_index, operator, search_val) {
        // check the null search case
        if (search_val === null) {
            if (operator !== common_1.EFilterOperatorTypes.IS_EQUAL && operator !== common_1.EFilterOperatorTypes.IS_NOT_EQUAL) {
                {
                    throw new Error('Query operator "' + operator + '" and query "null" value are incompatible.');
                }
            }
        }
        // search
        const indexed = (val_arr_index !== null && val_arr_index !== undefined);
        if (indexed) {
            if (!Number.isInteger(val_arr_index)) {
                throw new Error('Query index "' + val_arr_index + '" cannot be converted to an integer: ' + val_arr_index);
            }
            if (this._data_type !== common_1.EAttribDataTypeStrs.LIST) {
                throw new Error('Query attribute "' + this._name + '" is not a list.');
            }
            return this._searchIndexedValue(ents_i, val_arr_index, operator, search_val);
        }
        else {
            if (this._data_type === common_1.EAttribDataTypeStrs.LIST) {
                if (!Array.isArray(search_val)) {
                    {
                        throw new Error('Query search value "' + search_val + '" is not a list.');
                    }
                }
                return this._searchListValue(ents_i, operator, search_val);
            }
            else if (this._data_type === common_1.EAttribDataTypeStrs.NUMBER) {
                if (typeof search_val !== 'number') {
                    {
                        throw new Error('Query search value "' + search_val + '" is not a number.');
                    }
                }
                return this._searchNumValue(ents_i, operator, search_val);
            }
            else if (this._data_type === common_1.EAttribDataTypeStrs.STRING) {
                if (operator !== common_1.EFilterOperatorTypes.IS_EQUAL && operator !== common_1.EFilterOperatorTypes.IS_NOT_EQUAL) {
                    {
                        throw new Error('Query operator "' + operator + '" and query "' + search_val + '" value are incompatible.');
                    }
                }
                if (typeof search_val !== 'string') {
                    {
                        throw new Error('Query search value "' + search_val + '" is not a string.');
                    }
                }
                return this._searchStrValue(ents_i, operator, search_val);
            }
            else {
                throw new Error('Bad query.');
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
        if (this._data_type === common_1.EAttribDataTypeStrs.STRING) {
            if (typeof val === 'string') {
                return val;
            }
            else {
                return String(val);
            }
        }
        if (this._data_type === common_1.EAttribDataTypeStrs.NUMBER) {
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
     * Compare two values with a comparison operator, ==, !=, >, >=, <, <=
     * ~
     * If the values are of different types, then false is returned.
     * ~
     * For arrays, true is returned only if a pairwise comparison between the items in the two arrays all return true.
     * The two arrays must also be of equal length.
     * ~
     * Values may be null.
     * Values that are undefined will be treated as null.
     * ~
     * @param operator
     * @param val1
     * @param val2
     */
    _compare(operator, val1, val2) {
        if (Array.isArray(val1)) {
            if (!Array.isArray(val2)) {
                return false;
            }
            if (val1.length !== val2.length) {
                return false;
            }
            for (let i = 0; i < val1.length; i++) {
                if (!this._compare(operator, val1[i], val2[i])) {
                    return false;
                }
            }
            return true;
        }
        if (val1 === undefined) {
            val1 = null;
        }
        if (val2 === undefined) {
            val2 = null;
        }
        if (typeof val1 !== typeof val2) {
            return false;
        }
        switch (operator) {
            // ==
            case common_1.EFilterOperatorTypes.IS_EQUAL:
                return val1 === val2;
            // !=
            case common_1.EFilterOperatorTypes.IS_NOT_EQUAL:
                return val1 !== val2;
            // >
            case common_1.EFilterOperatorTypes.IS_GREATER:
                return val1 > val2;
            // >=
            case common_1.EFilterOperatorTypes.IS_GREATER_OR_EQUAL:
                return val1 >= val2;
            // <
            case common_1.EFilterOperatorTypes.IS_LESS:
                return val1 < val2;
            // <=
            case common_1.EFilterOperatorTypes.IS_LESS_OR_EQUAL:
                return val1 <= val2;
            default:
                throw new Error('Query operator not found: ' + operator);
        }
    }
    // // ====================================================== TODO delete these 4 methods
    // /**
    //  * Searches for the value using the operator
    //  */
    // private _searchNumValue(ents_i: number[], operator: EFilterOperatorTypes, val_k: string): number[] {
    //     // clean up
    //     val_k = val_k.replace(RE_SPACES, '');
    //     // first deal with null cases
    //     if (val_k === 'null' && operator === EFilterOperatorTypes.IS_EQUAL ) {
    //         return this.getEntsWithoutVal(ents_i);
    //     } else if (val_k === 'null' && operator === EFilterOperatorTypes.IS_NOT_EQUAL ) {
    //         return this.getEntsWithVal(ents_i);
    //     }
    //     // get the values to search for
    //     const search_val: number = Number(val_k);
    //     if (isNaN(search_val)) {
    //         throw new Error('Query error: the search value is not a number.');
    //     }
    //     // search
    //     let found_keys: number[];
    //     switch (operator) {
    //         case EFilterOperatorTypes.IS_EQUAL:
    //             found_keys = this.getEntsFromVal(search_val);
    //             if (found_keys === undefined) { return []; }
    //             return ents_i.filter(ent_i => found_keys.indexOf(ent_i) !== -1);
    //         case EFilterOperatorTypes.IS_NOT_EQUAL:
    //             found_keys = this.getEntsFromVal(search_val);
    //             if (found_keys === undefined) { return []; }
    //             return ents_i.filter(ent_i => found_keys.indexOf(ent_i) === -1);
    //         case EFilterOperatorTypes.IS_GREATER:
    //         case EFilterOperatorTypes.IS_GREATER_OR_EQUAL:
    //         case EFilterOperatorTypes.IS_LESS:
    //         case EFilterOperatorTypes.IS_LESS_OR_EQUAL:
    //             found_keys = [];
    //             for (const ent_i of ents_i) {
    //                 const val: TAttribDataTypes = this.getEntVal(ent_i) as TAttribDataTypes;
    //                 if ((val !== null && val !== undefined) && this._compare(operator, val, search_val) ) {
    //                     found_keys.push(ent_i);
    //                 }
    //             }
    //             return found_keys;
    //         default:
    //             throw new Error('Query error: Operator not found.');
    //     }
    // }
    // /**
    //  * Searches for the value using the operator
    //  */
    // private _searchStrValue(ents_i: number[], operator: EFilterOperatorTypes, val_k: string): number[] {
    //     // first deal with null cases
    //     if (val_k === 'null' && operator === EFilterOperatorTypes.IS_EQUAL ) {
    //         return this.getEntsWithoutVal(ents_i);
    //     } else if (val_k === 'null' && operator === EFilterOperatorTypes.IS_NOT_EQUAL ) {
    //         return this.getEntsWithVal(ents_i);
    //     }
    //     // get the values to search for
    //     const search_val: string = val_k;
    //     // search
    //     let found_keys: number[];
    //     switch (operator) {
    //         case EFilterOperatorTypes.IS_EQUAL:
    //             found_keys = this.getEntsFromVal(search_val);
    //             if (found_keys === undefined) { return []; }
    //             return ents_i.filter(ent_i => found_keys.indexOf(ent_i) !== -1);
    //         case EFilterOperatorTypes.IS_NOT_EQUAL:
    //             found_keys = this.getEntsFromVal(search_val);
    //             if (found_keys === undefined) { return []; }
    //             return ents_i.filter(ent_i => found_keys.indexOf(ent_i) === -1);
    //         case EFilterOperatorTypes.IS_GREATER:
    //         case EFilterOperatorTypes.IS_GREATER_OR_EQUAL:
    //         case EFilterOperatorTypes.IS_LESS:
    //         case EFilterOperatorTypes.IS_LESS_OR_EQUAL:
    //             throw new Error('Query error: Operator not allowed with string values.');
    //         default:
    //             throw new Error('Query error: Operator not found.');
    //     }
    // }
    // /**
    //  * Searches for the value using the operator
    //  */
    // private _searchIndexedNumValue(ents_i: number[], val_arr_index: number, operator: EFilterOperatorTypes, val_k: string): number[] {
    //     // clean up
    //     val_k = val_k.replace(RE_SPACES, '');
    //     // get the search value, null or a number
    //     let search_val: number;
    //     if (val_k === 'null') {
    //         search_val = null;
    //     } else { // value_str must be a number
    //         search_val = Number.parseFloat(val_k);
    //         if (isNaN(search_val)) {
    //             throw new Error('Query value "' + val_k + '" cannot be converted to a number: ' + val_k);
    //         }
    //     }
    //     // do the search
    //     const found_keys: number[] = [];
    //     for (const ent_i of ents_i) {
    //         const search_value_arr: TAttribDataTypes = this.getEntVal(ent_i) as TAttribDataTypes;
    //         if (search_value_arr !== undefined) {
    //             let comp;
    //             if (val_arr_index >= 0) {
    //                 comp = this._compare(operator, search_value_arr[val_arr_index], search_val);
    //             } else {
    //                 comp = this._compare(operator, (<any>search_value_arr).slice(val_arr_index)[0], search_val);
    //             }
    //             if ( comp ) {
    //                 found_keys.push(ent_i);
    //             }
    //         }
    //     }
    //     return found_keys;
    // }
    // /**
    //  * Searches for the value using the operator
    //  */
    // private _searchIndexedStrValue(ents_i: number[], val_arr_index: number, operator: EFilterOperatorTypes, val_k: string): number[] {
    //     // clean up
    //     val_k = val_k.replace(RE_SPACES, '');
    //     // get the search value, null or a string
    //     let search_val: string;
    //     if (val_k === 'null') {
    //         search_val = null;
    //     } else { // value_str must be a number
    //         search_val = val_k;
    //     }
    //     // do the search
    //     const found_keys: number[] = [];
    //     for (const ent_i of ents_i) {
    //         const search_value_arr: TAttribDataTypes = this.getEntVal(ent_i) as TAttribDataTypes;
    //         let comp;
    //         if (val_arr_index >= 0) {
    //             comp = this._compare(operator, search_value_arr[val_arr_index], search_val);
    //         } else {
    //             comp = this._compare(operator, (<any>search_value_arr).slice(val_arr_index)[0], search_val);
    //         }
    //         if ( comp ) {
    //             found_keys.push(ent_i);
    //         }
    //     }
    //     return found_keys;
    // }
    // ======================================================
    /**
     * Searches for the number value using the operator
     */
    _searchNumValue(ents_i, operator, search_val) {
        // first deal with null cases
        if (search_val === null && operator === common_1.EFilterOperatorTypes.IS_EQUAL) {
            return this.getEntsWithoutVal(ents_i);
        }
        else if (search_val === null && operator === common_1.EFilterOperatorTypes.IS_NOT_EQUAL) {
            return this.getEntsWithVal(ents_i);
        }
        // search
        let found_keys;
        switch (operator) {
            case common_1.EFilterOperatorTypes.IS_EQUAL:
                found_keys = this.getEntsFromVal(search_val);
                if (found_keys === undefined) {
                    return [];
                }
                return ents_i.filter(ent_i => found_keys.indexOf(ent_i) !== -1);
            case common_1.EFilterOperatorTypes.IS_NOT_EQUAL:
                found_keys = this.getEntsFromVal(search_val);
                if (found_keys === undefined) {
                    return [];
                }
                return ents_i.filter(ent_i => found_keys.indexOf(ent_i) === -1);
            case common_1.EFilterOperatorTypes.IS_GREATER:
            case common_1.EFilterOperatorTypes.IS_GREATER_OR_EQUAL:
            case common_1.EFilterOperatorTypes.IS_LESS:
            case common_1.EFilterOperatorTypes.IS_LESS_OR_EQUAL:
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
     * Searches for the string value using the operator
     */
    _searchStrValue(ents_i, operator, search_val) {
        // first deal with null cases
        if (search_val === null && operator === common_1.EFilterOperatorTypes.IS_EQUAL) {
            return this.getEntsWithoutVal(ents_i);
        }
        else if (search_val === null && operator === common_1.EFilterOperatorTypes.IS_NOT_EQUAL) {
            return this.getEntsWithVal(ents_i);
        }
        // search
        let found_keys;
        switch (operator) {
            case common_1.EFilterOperatorTypes.IS_EQUAL:
                found_keys = this.getEntsFromVal(search_val);
                if (found_keys === undefined) {
                    return [];
                }
                return ents_i.filter(ent_i => found_keys.indexOf(ent_i) !== -1);
            case common_1.EFilterOperatorTypes.IS_NOT_EQUAL:
                found_keys = this.getEntsFromVal(search_val);
                if (found_keys === undefined) {
                    return [];
                }
                return ents_i.filter(ent_i => found_keys.indexOf(ent_i) === -1);
            case common_1.EFilterOperatorTypes.IS_GREATER:
            case common_1.EFilterOperatorTypes.IS_GREATER_OR_EQUAL:
            case common_1.EFilterOperatorTypes.IS_LESS:
            case common_1.EFilterOperatorTypes.IS_LESS_OR_EQUAL:
                throw new Error('Query error: Operator not allowed with string values.');
            default:
                throw new Error('Query error: Operator not found.');
        }
    }
    /**
     * Searches for the list value using the operator
     */
    _searchListValue(ents_i, operator, search_val) {
        // first deal with null cases
        if (search_val === null && operator === common_1.EFilterOperatorTypes.IS_EQUAL) {
            return this.getEntsWithoutVal(ents_i);
        }
        else if (search_val === null && operator === common_1.EFilterOperatorTypes.IS_NOT_EQUAL) {
            return this.getEntsWithVal(ents_i);
        }
        // search
        let found_keys;
        switch (operator) {
            case common_1.EFilterOperatorTypes.IS_EQUAL:
                found_keys = this.getEntsFromVal(search_val);
                if (found_keys === undefined) {
                    return [];
                }
                return ents_i.filter(ent_i => found_keys.indexOf(ent_i) !== -1);
            case common_1.EFilterOperatorTypes.IS_NOT_EQUAL:
                found_keys = this.getEntsFromVal(search_val);
                if (found_keys === undefined) {
                    return [];
                }
                return ents_i.filter(ent_i => found_keys.indexOf(ent_i) === -1);
            case common_1.EFilterOperatorTypes.IS_GREATER:
            case common_1.EFilterOperatorTypes.IS_GREATER_OR_EQUAL:
            case common_1.EFilterOperatorTypes.IS_LESS:
            case common_1.EFilterOperatorTypes.IS_LESS_OR_EQUAL:
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
    _searchIndexedValue(ents_i, val_arr_index, operator, search_val) {
        // do the search
        const found_keys = [];
        for (const ent_i of ents_i) {
            const search_value_arr = this.getEntVal(ent_i);
            if (search_value_arr !== undefined) {
                let comp;
                if (val_arr_index >= 0) {
                    comp = this._compare(operator, search_value_arr[val_arr_index], search_val);
                }
                else {
                    comp = this._compare(operator, search_value_arr.slice(val_arr_index)[0], search_val);
                }
                if (comp) {
                    found_keys.push(ent_i);
                }
            }
        }
        return found_keys;
    }
}
exports.GIAttribMap = GIAttribMap;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lBdHRyaWJNYXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlicy9nZW8taW5mby9HSUF0dHJpYk1hcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHFDQUErRztBQUMvRywyQ0FBd0M7QUFFeEM7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFhLFdBQVc7SUFjcEI7OztPQUdHO0lBQ0gsWUFBWSxJQUFZLEVBQUUsU0FBOEI7UUFDcEQsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDbEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7UUFDNUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFDcEIsV0FBVztRQUNYLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3JDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ25DLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3RDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ3pDLENBQUM7SUFDRDs7T0FFRztJQUNJLE9BQU87UUFDVixNQUFNLEtBQUssR0FBd0MsRUFBRSxDQUFDO1FBQ3RELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFnQixFQUFFLEtBQWEsRUFBRSxFQUFFO1lBQ2xFLE1BQU0sR0FBRyxHQUFxQixJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2hFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM5QixDQUFDLENBQUMsQ0FBQztRQUNILE9BQU87WUFDSCxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUs7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