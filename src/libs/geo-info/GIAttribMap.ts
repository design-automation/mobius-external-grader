import { EFilterOperatorTypes, EAttribDataTypeStrs, TAttribDataTypes, IAttribData, RE_SPACES } from './common';
import { arrRem } from '../util/arrays';

/**
 * Geo-info attribute class for one attribute.
 * The attributs stores key-value pairs.
 * Multiple keys point to the same value.
 * So for example, [[1,3], "a"],[[0,4], "b"] can be converted into sequential arrays.
 * The values would be ["a", "b"]
 * The keys would be [1,0,,0,1] (Note the undefined value in the middle.)
 *
 */
export class GIAttribMap {
    private _name: string;
    private _data_type: EAttribDataTypeStrs;
    private _data_size: number;
    // the _num_vals is used as an arbitrary index for the unique values
    // the index will keep growing, even when data gets deleted
    // it counts of the number of unique values (including any deleted values)
    // this should never be decremented, even when values get deleted
    private _num_vals: number;
    // the four data maps that store everything
    private _map_val_k_to_val_i: Map<string|number, number>; // unique, no duplicates
    private _map_val_i_to_val: Map<number, TAttribDataTypes>; // unique, no duplicates
    private _map_val_i_to_ents_i: Map<number, number[]>;
    private _map_ent_i_to_val_i: Map<number, number>;
    /**
     * Creates an attribute.
     * @param attrib_data
     */
    constructor(name: string, data_type: EAttribDataTypeStrs) {
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
    public getData(): IAttribData {
        const _data: Array<[number[], TAttribDataTypes]> = [];
        this._map_val_i_to_ents_i.forEach((ents_i: number[], val_i: number) => {
            const val: TAttribDataTypes = this._map_val_i_to_val.get(val_i);
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
    public getName(): string {
        return this._name;
    }
    /**
     * Sets the name of this attribute.
     */
    public setName(name: string): void {
        this._name = name;
    }
    /**
     * Returns the data type of this attribute.
     */
    public getDataType(): EAttribDataTypeStrs {
        return this._data_type;
    }
    /**
     * Returns the data size of this attribute.
     */
    public getDataSize(): number {
        return this._data_size;
    }
    /**
     * Returns true if this value exists in the attributes.
     */
    public hasVal(val: TAttribDataTypes): boolean {
        return this._map_val_k_to_val_i.has(this._valToValkey(val));
    }
    /**
     * Returns true if there is an entity that has a value (i.e. the value is not undefined).
     */
    public hasEnt(ent_i: number): boolean {
        return this._map_ent_i_to_val_i.has(ent_i);
    }
    /**
     * Delete the entities from this attribute map.
     */
    public delEnt(ents_i: number|number[]): void {
        ents_i = (Array.isArray(ents_i)) ? ents_i : [ents_i];
        ents_i.forEach(ent_i => {
            // _map_ent_i_to_val_i: Map<number, number>
            const val_i: number = this._map_ent_i_to_val_i.get(ent_i);
            if (val_i !== undefined) {
                // del the entity from _map_ent_i_to_val_i
                this._map_ent_i_to_val_i.delete(ent_i);
                // del the entity from _map_val_i_to_ents_i
                const other_ents_i: number[] = this._map_val_i_to_ents_i.get(val_i);
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
    public getEntsVals(): [number[], TAttribDataTypes][] {
        const ents_i_values: [number[], TAttribDataTypes][] = [];
        this._map_val_i_to_ents_i.forEach( (ents_i, val_i) => {
            const value: TAttribDataTypes = this._map_val_i_to_val.get(val_i);
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
    public setEntsVals(ents_i_values: [number[], TAttribDataTypes][]): void {
        for (let i = 0; i < ents_i_values.length; i++) {
            this.setEntVal(ents_i_values[i][0], ents_i_values[i][1]);
        }
    }
    /**
     * Sets the value for a given entity or entities.
     * @param ent_i
     * @param val
     */
    public setEntVal(ents_i: number|number[], val: TAttribDataTypes): void {
        // check the type
        if (this._data_type === EAttribDataTypeStrs.NUMBER && typeof val !== 'number') {
            throw new Error('Error setting attribute value. Attribute is of type "number" but the value is not a number.');
        } else if (this._data_type === EAttribDataTypeStrs.STRING && typeof val !== 'string') {
            throw new Error('Error setting attribute value. Attribute is of type "string" but the value is not a string.');
        } else if (this._data_type === EAttribDataTypeStrs.LIST && !Array.isArray(val)) {
            throw new Error('Error setting attribute value. Attribute is of type "list" but the value is not a list.');
        }
        const val_k: string | number = this._valToValkey(val);
        // check if this val already exists, if not create it
        if (!this._map_val_k_to_val_i.has(val_k)) {
            this._map_val_k_to_val_i.set(val_k, this._num_vals);
            this._map_val_i_to_val.set(this._num_vals, val);
            this._map_val_i_to_ents_i.set(this._num_vals, []);
            this._num_vals += 1;
        } else if (this._data_type === EAttribDataTypeStrs.LIST) {
            val = val as any[];
            if (val.length < this._data_size) { this._data_size = val.length; }
        }
        // get the new val_i
        const new_val_i: number = this._map_val_k_to_val_i.get(val_k);
        ents_i = (Array.isArray(ents_i)) ? ents_i : [ents_i];
        // loop through all the unique ents, and set _map_ent_i_to_val_i
        let unique_ents_i: number[] = ents_i;
        if (ents_i.length > 1) {
            unique_ents_i = Array.from(new Set(ents_i));
        }
        unique_ents_i.forEach( ent_i => {
            // keep the old value for later
            const old_val_i: number = this._map_ent_i_to_val_i.get(ent_i);
            // for each ent_i, set the new val_i
            this._map_ent_i_to_val_i.set(ent_i, new_val_i);
            // clean up the old val_i
            if (old_val_i !== undefined && old_val_i !== new_val_i) {
                arrRem(this._map_val_i_to_ents_i.get(old_val_i), ent_i);
            this._cleanUp(old_val_i);
            }
        });
        // for the new val_i, set it ot point to all the ents that have this value
        const exist_ents_i: number[] = this._map_val_i_to_ents_i.get(new_val_i);
        const exist_new_ents_i: number[] = Array.from(new Set(exist_ents_i.concat(ents_i)));
        this._map_val_i_to_ents_i.set(new_val_i, exist_new_ents_i);
    }
    /**
     * Sets the indexed value for a given entity or entities.
     * This assumes that this attribute is a list.
     * @param ent_i
     * @param val
     */
    public setEntIdxVal(ents_i: number|number[], val_index: number, val: any): void {
        if (val_index < this._data_size - 1) { this._data_size = val_index + 1; }
        ents_i = (Array.isArray(ents_i)) ? ents_i : [ents_i];
        // loop through all the unique ents, and setEntVal
        let unique_ents_i: number[] = ents_i;
        if (ents_i.length > 1) {
            unique_ents_i = Array.from(new Set(ents_i));
        }
        unique_ents_i.forEach( ent_i => {
            const exist_value_arr: any[] = this.getEntVal(ent_i) as any[];
            const new_value_arr: any[] = exist_value_arr.slice(); // IMPORTANT clone the array
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
    public getEntVal(ents_i: number|number[]): TAttribDataTypes {
        if (!Array.isArray(ents_i)) {
            const ent_i: number = ents_i as number;
            const val_i: number = this._map_ent_i_to_val_i.get(ent_i);
            if (val_i === undefined) { return undefined; }
            return this._map_val_i_to_val.get(val_i) as TAttribDataTypes;
        } else {
            return ents_i.map(ent_i => this.getEntVal(ent_i)) as TAttribDataTypes;
        }
    }
    /**
     * Gets the indexed value for a given entity.
     * Returns undefined if the entity does not exist
     * This assumes that this attribute is a list.
     * @param ent_i
     */
    public getEntIdxVal(ents_i: number|number[], val_index: number): any {
        if (!Array.isArray(ents_i)) {
            const ent_i: number = ents_i as number;
            const exist_value_arr: any[] = this.getEntVal(ent_i) as any[];
            return exist_value_arr[val_index] as any;
        } else {
            return ents_i.map(ent_i => this.getEntVal(ent_i)[val_index]) as any[];
        }
    }
    /**
     * Gets all the keys that have a given value
     * If the value does not exist an empty array is returned
     * The value can be a list
     * @param val
     */
    public getEntsFromVal(val: TAttribDataTypes): number[] {
        const val_i: number = this._map_val_k_to_val_i.get(this._valToValkey(val));
        if (val_i === undefined) { return []; }
        return this._map_val_i_to_ents_i.get(val_i);
    }
    /**
     * Returns an array of entity indices which do not have a value (undefined)
     */
    public getEntsWithoutVal(ents_i: number[]): number[] {
        return ents_i.filter(ent_i => !this._map_ent_i_to_val_i.has(ent_i));
    }
    /**
     * Returns an array of entity indices which have a value (not undefined)
     */
    public getEntsWithVal(ents_i: number[]): number[] {
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
    public queryVal2(ents_i: number[], val_arr_index: number, operator: EFilterOperatorTypes, search_val: TAttribDataTypes): number[] {
        // check the null search case
        if (search_val === null) {
            if (operator !== EFilterOperatorTypes.IS_EQUAL && operator !== EFilterOperatorTypes.IS_NOT_EQUAL) {
                { throw new Error('Query operator "' + operator + '" and query "null" value are incompatible.'); }
            }
        }
        // search
        const indexed = (val_arr_index !== null && val_arr_index !== undefined);
        if (indexed) {
            if (!Number.isInteger(val_arr_index)) {
                throw new Error('Query index "' + val_arr_index + '" cannot be converted to an integer: ' + val_arr_index);
            }
            if (this._data_type !== EAttribDataTypeStrs.LIST)  {
                throw new Error('Query attribute "' + this._name + '" is not a list.');
            }
            return this._searchIndexedValue(ents_i, val_arr_index, operator, search_val);
        } else {
            if (this._data_type === EAttribDataTypeStrs.LIST) {
                if (!Array.isArray(search_val)) {
                    { throw new Error('Query search value "' + search_val + '" is not a list.'); }
                }
                return this._searchListValue(ents_i, operator, search_val as any[]);
            } else if (this._data_type === EAttribDataTypeStrs.NUMBER) {
                if (typeof search_val !== 'number') {
                    { throw new Error('Query search value "' + search_val + '" is not a number.'); }
                }
                return this._searchNumValue(ents_i, operator, search_val  as number);
            } else if (this._data_type === EAttribDataTypeStrs.STRING) {
                if (operator !== EFilterOperatorTypes.IS_EQUAL && operator !== EFilterOperatorTypes.IS_NOT_EQUAL) {
                    { throw new Error('Query operator "' + operator + '" and query "' + search_val + '" value are incompatible.'); }
                }
                if (typeof search_val !== 'string') {
                    { throw new Error('Query search value "' + search_val + '" is not a string.'); }
                }
                return this._searchStrValue(ents_i, operator, search_val  as string);
            } else {
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
    private _valToValkey(val: TAttribDataTypes): string|number {
        if (this._data_type === EAttribDataTypeStrs.STRING) {
            if (typeof val === 'string') {
                return val as string;
            } else {
                return String(val);
            }
        }
        if (this._data_type === EAttribDataTypeStrs.NUMBER) {
            if (typeof val === 'string') {
                return parseFloat(val);
            } else {
                return val as number;
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
    private _cleanUp(val_i: number): void {
        if (val_i !== undefined) {
            // _map_val_i_to_ents_i: Map<number, number[]>
            const ents_i: number[] = this._map_val_i_to_ents_i.get(val_i);
            if (ents_i.length === 0) {
                this._map_val_i_to_ents_i.delete(val_i);
                // _map_val_i_to_val: Map<number, TAttribDataTypes>
                const val: TAttribDataTypes = this._map_val_i_to_val.get(val_i);
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
    private _compare(operator: EFilterOperatorTypes, val1: any, val2: any): boolean {
        if (Array.isArray(val1)) {
            if (!Array.isArray(val2)) { return false; }
            if (val1.length !== val2.length) { return false; }
            for (let i = 0; i < val1.length; i++) {
                if (!this._compare(operator, val1[i], val2[i])) { return false; }
            }
            return true;
        }
        if (val1 === undefined) { val1 = null; }
        if (val2 === undefined) { val2 = null; }
        if (typeof val1 !== typeof val2) { return false; }
        switch (operator) {
            // ==
            case EFilterOperatorTypes.IS_EQUAL:
                return val1 === val2;
            // !=
            case EFilterOperatorTypes.IS_NOT_EQUAL:
                return val1 !== val2;
            // >
            case EFilterOperatorTypes.IS_GREATER:
                return val1 > val2;
            // >=
            case EFilterOperatorTypes.IS_GREATER_OR_EQUAL:
                return val1 >= val2;
            // <
            case EFilterOperatorTypes.IS_LESS:
                return val1 < val2;
            // <=
            case EFilterOperatorTypes.IS_LESS_OR_EQUAL:
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
    private _searchNumValue(ents_i: number[], operator: EFilterOperatorTypes, search_val: number): number[] {
        // first deal with null cases
        if (search_val === null && operator === EFilterOperatorTypes.IS_EQUAL ) {
            return this.getEntsWithoutVal(ents_i);
        } else if (search_val === null && operator === EFilterOperatorTypes.IS_NOT_EQUAL ) {
            return this.getEntsWithVal(ents_i);
        }
        // search
        let found_keys: number[];
        switch (operator) {
            case EFilterOperatorTypes.IS_EQUAL:
                found_keys = this.getEntsFromVal(search_val);
                if (found_keys === undefined) { return []; }
                return ents_i.filter(ent_i => found_keys.indexOf(ent_i) !== -1);
            case EFilterOperatorTypes.IS_NOT_EQUAL:
                found_keys = this.getEntsFromVal(search_val);
                if (found_keys === undefined) { return []; }
                return ents_i.filter(ent_i => found_keys.indexOf(ent_i) === -1);
            case EFilterOperatorTypes.IS_GREATER:
            case EFilterOperatorTypes.IS_GREATER_OR_EQUAL:
            case EFilterOperatorTypes.IS_LESS:
            case EFilterOperatorTypes.IS_LESS_OR_EQUAL:
                found_keys = [];
                for (const ent_i of ents_i) {
                    const val: TAttribDataTypes = this.getEntVal(ent_i) as TAttribDataTypes;
                    if ((val !== null && val !== undefined) && this._compare(operator, val, search_val) ) {
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
    private _searchStrValue(ents_i: number[], operator: EFilterOperatorTypes, search_val: string): number[] {
        // first deal with null cases
        if (search_val === null && operator === EFilterOperatorTypes.IS_EQUAL ) {
            return this.getEntsWithoutVal(ents_i);
        } else if (search_val === null && operator === EFilterOperatorTypes.IS_NOT_EQUAL ) {
            return this.getEntsWithVal(ents_i);
        }
        // search
        let found_keys: number[];
        switch (operator) {
            case EFilterOperatorTypes.IS_EQUAL:
                found_keys = this.getEntsFromVal(search_val);
                if (found_keys === undefined) { return []; }
                return ents_i.filter(ent_i => found_keys.indexOf(ent_i) !== -1);
            case EFilterOperatorTypes.IS_NOT_EQUAL:
                found_keys = this.getEntsFromVal(search_val);
                if (found_keys === undefined) { return []; }
                return ents_i.filter(ent_i => found_keys.indexOf(ent_i) === -1);
            case EFilterOperatorTypes.IS_GREATER:
            case EFilterOperatorTypes.IS_GREATER_OR_EQUAL:
            case EFilterOperatorTypes.IS_LESS:
            case EFilterOperatorTypes.IS_LESS_OR_EQUAL:
                throw new Error('Query error: Operator not allowed with string values.');
            default:
                throw new Error('Query error: Operator not found.');
        }
    }
    /**
     * Searches for the list value using the operator
     */
    private _searchListValue(ents_i: number[], operator: EFilterOperatorTypes, search_val: any[]): number[] {
        // first deal with null cases
        if (search_val === null && operator === EFilterOperatorTypes.IS_EQUAL ) {
            return this.getEntsWithoutVal(ents_i);
        } else if (search_val === null && operator === EFilterOperatorTypes.IS_NOT_EQUAL ) {
            return this.getEntsWithVal(ents_i);
        }
        // search
        let found_keys: number[];
        switch (operator) {
            case EFilterOperatorTypes.IS_EQUAL:
                found_keys = this.getEntsFromVal(search_val);
                if (found_keys === undefined) { return []; }
                return ents_i.filter(ent_i => found_keys.indexOf(ent_i) !== -1);
            case EFilterOperatorTypes.IS_NOT_EQUAL:
                found_keys = this.getEntsFromVal(search_val);
                if (found_keys === undefined) { return []; }
                return ents_i.filter(ent_i => found_keys.indexOf(ent_i) === -1);
            case EFilterOperatorTypes.IS_GREATER:
            case EFilterOperatorTypes.IS_GREATER_OR_EQUAL:
            case EFilterOperatorTypes.IS_LESS:
            case EFilterOperatorTypes.IS_LESS_OR_EQUAL:
                found_keys = [];
                for (const ent_i of ents_i) {
                    const val: TAttribDataTypes = this.getEntVal(ent_i) as TAttribDataTypes;
                    if ((val !== null && val !== undefined) && this._compare(operator, val, search_val) ) {
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
    private _searchIndexedValue(ents_i: number[], val_arr_index: number, operator: EFilterOperatorTypes, search_val: any): number[] {
        // do the search
        const found_keys: number[] = [];
        for (const ent_i of ents_i) {
            const search_value_arr: TAttribDataTypes = this.getEntVal(ent_i) as TAttribDataTypes;
            if (search_value_arr !== undefined) {
                let comp;
                if (val_arr_index >= 0) {
                    comp = this._compare(operator, search_value_arr[val_arr_index], search_val);
                } else {
                    comp = this._compare(operator, (<any>search_value_arr).slice(val_arr_index)[0], search_val);
                }
                if ( comp ) {
                    found_keys.push(ent_i);
                }
            }
        }
        return found_keys;
    }
}
