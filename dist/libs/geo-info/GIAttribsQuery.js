"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
/**
 * Class for attributes.
 */
class GIAttribsQuery {
    /**
      * Creates an object to store the attribute data.
      * @param model The JSON data
      */
    constructor(model, attribs_maps) {
        this._model = model;
        this._attribs_maps = attribs_maps;
    }
    /**
     * Checks if an attribute with this name exists.
     * @param name
     */
    hasModelAttrib(name) {
        const attribs_maps_key = common_1.EEntTypeStr[common_1.EEntType.MOD];
        const attrib = this._attribs_maps[attribs_maps_key];
        return attrib.has(name);
    }
    /**
     * Get attrib data type. Also works for MOD attribs.
     *
     * @param ent_type
     * @param name
     */
    getAttribDataType(ent_type, name) {
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        if (attribs.get(name) === undefined) {
            throw new Error('Attribute with this name does not exist.');
        }
        if (ent_type === common_1.EEntType.MOD) {
            const mod_attribs = attribs;
            const value = mod_attribs.get(name);
            let first_value;
            if (Array.isArray(value)) {
                first_value = value[0];
            }
            else {
                first_value = value;
            }
            if (typeof first_value === 'string') {
                return common_1.EAttribDataTypeStrs.STRING;
            }
            return common_1.EAttribDataTypeStrs.NUMBER;
        }
        else {
            const ent_attribs = attribs;
            return ent_attribs.get(name).getDataType();
        }
    }
    /**
     * Get attrib data size. Also works for MOD attribs.
     *
     * @param ent_type
     * @param name
     */
    getAttribDataSize(ent_type, name) {
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        if (attribs.get(name) === undefined) {
            throw new Error('Attribute with this name does not exist.');
        }
        if (ent_type === common_1.EEntType.MOD) {
            const mod_attribs = attribs;
            const value = mod_attribs.get(name);
            if (Array.isArray(value)) {
                return value.length;
            }
            else {
                return 1;
            }
        }
        else {
            const ent_attribs = attribs;
            return ent_attribs.get(name).getDataSize();
        }
    }
    /**
     * Get a model attrib value
     * @param name
     */
    getModelAttribValue(name) {
        const attribs_maps_key = common_1.EEntTypeStr[common_1.EEntType.MOD];
        const attribs = this._attribs_maps[attribs_maps_key];
        const value = attribs.get(name);
        if (value === undefined) {
            return null;
        }
        return value;
    }
    /**
     * Get a model attrib indexed value
     * @param ent_type
     * @param name
     */
    getModelAttribIndexedValue(name, value_index) {
        const attribs_maps_key = common_1.EEntTypeStr[common_1.EEntType.MOD];
        const attribs = this._attribs_maps[attribs_maps_key];
        const list_value = attribs.get(name);
        if (list_value === undefined) {
            return null;
        }
        if (!Array.isArray(list_value)) {
            return null;
        }
        if (value_index >= list_value.length) {
            return null;
        }
        return list_value[value_index];
    }
    /**
     * Get an entity attrib value.
     * If the attribute does not exist, return null.
     * @param ent_type
     * @param name
     */
    getAttribValue(ent_type, name, ents_i) {
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        const attrib = attribs.get(name);
        if (attrib === undefined) {
            return null;
        }
        return attrib.getEntVal(ents_i);
    }
    /**
     * Get an entity attrib indexed value.
     * If the attribute does not exist or the index is out of range, return null.
     * @param ent_type
     * @param name
     */
    getAttribIndexedValue(ent_type, name, ents_i, value_index) {
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        const attrib = attribs.get(name);
        if (attrib === undefined) {
            return null;
        }
        // if (attrib.getDataSize() === 1) { throw new Error('Attribute is not a list, so indexed values are not allowed.'); }
        if (value_index >= attrib.getDataSize()) {
            throw new Error('Value index is out of range for attribute list size.');
        }
        return attrib.getEntIdxVal(ents_i, value_index);
    }
    /**
     * Check if attribute exists
     * @param ent_type
     * @param name
     */
    hasAttrib(ent_type, name) {
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        return attribs.has(name);
    }
    /**
     * Get all the attribute names for an entity type
     * @param ent_type
     */
    getAttribNames(ent_type) {
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs_map = this._attribs_maps[attribs_maps_key];
        return Array.from(attribs_map.keys());
    }
    /**
     * Get all the user defined attribute names for an entity type
     * This excludes the built in attribute names, xyz and anything starting with '_'
     * @param ent_type
     */
    getAttribNamesUser(ent_type) {
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs_map = this._attribs_maps[attribs_maps_key];
        let attribs = Array.from(attribs_map.keys());
        if (ent_type === common_1.EEntType.POSI) {
            attribs = attribs.filter(attrib => attrib !== 'xyz');
        }
        attribs = attribs.filter(attrib => attrib[0] !== '_');
        return attribs;
    }
    /**
     * Get attrib
     * @param ent_type
     * @param name
     */
    getAttrib(ent_type, name) {
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        return attribs.get(name);
    }
    // /**
    //  * Query the model using a query strings.
    //  * Returns a list of entities in the model.
    //  * @param ent_type The type of the entities being search for
    //  * @param query_str The query string, e.g. '#@name == value'
    //  * @param indices The indices of entites in the model. These are assumed to be of type ent_type.
    //  */
    // public queryAttribs(ent_type: EEntType, query_str: string, indices: number[]): number[] {
    //     // get the map that contains all the ettributes for the ent_type
    //     const attribs_maps_key: string = EEntTypeStr[ent_type];
    //     const attribs: Map<string, GIAttribMap> = this._attribs_maps[attribs_maps_key];
    //     // parse the query
    //     const queries: IQueryComponent[][] = parseQuery(query_str);
    //     if (!queries) { return []; }
    //     // do the query, one by one
    //     // [[query1 && query2] || [query3 && query4]]
    //     let union_query_results: number[] = [];
    //     for (const and_queries of queries)  {
    //         // get the ents_i to start the '&&' query
    //         let query_ents_i: number[] = null;
    //         if (indices !== null && indices !== undefined) {
    //             query_ents_i = indices;
    //         } else {
    //             query_ents_i = this._model.geom.query.getEnts(ent_type, false);
    //         }
    //         // do the '&&' queries
    //         for (const and_query of and_queries) {
    //             if (attribs && attribs.has(and_query.attrib_name)) {
    //                 const attrib: GIAttribMap = attribs.get(and_query.attrib_name);
    //                 query_ents_i = attrib.queryVal(
    //                     query_ents_i,
    //                     and_query.attrib_index,
    //                     and_query.operator_type,
    //                     and_query.attrib_value_str
    //                 );
    //             } else {
    //                 throw new Error('Attribute "' + and_query.attrib_name + '" does not exist.');
    //                 // query_ents_i = [];
    //             }
    //         }
    //         // combine the results of the '&&' queries
    //         if (query_ents_i !== null && query_ents_i.length > 0) {
    //             union_query_results = Array.from(new Set([...union_query_results, ...query_ents_i]));
    //         }
    //     }
    //     // return the result
    //     return union_query_results;
    // }
    /**
     * Query the model using a query strings.
     * Returns a list of entities in the model.
     * @param ent_type The type of the entities being quieried.
     * @param ents_i Entites in the model, assumed to be of type ent_type.
     * @param name
     * @param index
     * @param value
     */
    filterByAttribs(ent_type, ents_i, name, index, op_type, value) {
        // get the map that contains all the attributes for the ent_type
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        // do the query
        if (attribs && attribs.has(name)) {
            const attrib = attribs.get(name);
            const query_ents_i = attrib.queryVal2(ents_i, index, op_type, value);
            // return the result
            return query_ents_i;
        }
        else {
            throw new Error('Attribute "' + name + '" does not exist.');
            // query_ents_i = [];
        }
    }
    /**
     * Sort entities in the model based on attribute values.
     * @param ent_type The type of the entities being sorted.
     * @param ents_i Entites in the model, assumed to be of type ent_type.
     * @param name
     * @param index
     * @param value
     */
    sortByAttribs(ent_type, ents_i, name, index, method) {
        // get the map that contains all the ettributes for the ent_type
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        if (!attribs) {
            throw new Error('Bad sort: Attribute does not exist.');
        }
        // create the sort copmapre function
        function _sortCompare(ent1_i, ent2_i) {
            const attrib = attribs.get(name);
            let val1 = attrib.getEntVal(ent1_i);
            let val2 = attrib.getEntVal(ent2_i);
            if (index !== null) {
                if (val1 !== undefined && val1 !== null) {
                    val1 = val1[index];
                }
                if (val2 !== undefined && val2 !== null) {
                    val2 = val2[index];
                }
            }
            if (method === common_1.ESort.DESCENDING) {
                if (val1 < val2) {
                    return -1;
                }
                if (val1 > val2) {
                    return 1;
                }
            }
            else {
                if (val1 < val2) {
                    return 1;
                }
                if (val1 > val2) {
                    return -1;
                }
            }
            return 0;
        }
        // do the sort
        ents_i.sort(_sortCompare);
        return ents_i;
    }
    // ============================================================================
    // Shortcuts for getting xyz
    // ============================================================================
    /**
     * Shortcut for getting a coordinate from a numeric position index (i.e. this is not an ID)
     * @param posi_i
     */
    getPosiCoords(posi_i) {
        const result = this._attribs_maps.ps.get(common_1.EAttribNames.COORDS).getEntVal(posi_i);
        return result;
    }
    // /**
    //  * Shortcut for getting all coordinates
    //  * @param posi_i
    //  */
    // public getAllPosisCoords(): Txyz[] {
    //     const posis_i: number[] = this._model.geom.query.getEnts(EEntType.POSI);
    //     const coords_map: GIAttribMap = this._attribs_maps.ps.get(EAttribNames.COORDS);
    //     return coords_map.getEntVal(posis_i) as Txyz[];
    // }
    /**
     * Shortcut for getting a coordinate from a numeric vertex index (i.e. this is not an ID)
     * @param vert_i
     */
    getVertCoords(vert_i) {
        const posi_i = this._model.geom.query.navVertToPosi(vert_i);
        return this._attribs_maps.ps.get(common_1.EAttribNames.COORDS).getEntVal(posi_i);
    }
}
exports.GIAttribsQuery = GIAttribsQuery;
// ================================================================================================
// Functions for parsing queries
// ================================================================================================
// /**
//  * Parse a query string.
//  * && takes precedence over ||
//  * [ [ query1 && query2 ] || [ query3 && query4 ] ]
//  */
// function parseQuery(query_str: string): IQueryComponent[][] {
//     if (!query_str.startsWith('#')) {throw new Error('Bad query, query string must start with #.'); }
//     const or_query_strs: string[] = query_str.split('||');
//     const query_list: IQueryComponent[][] = [];
//     or_query_strs.forEach(or_query_str => {
//         const and_query_strs: string[] = or_query_str.split('&&');
//         query_list.push(and_query_strs.map( and_query_str => _parse_query_component(and_query_str) ) );
//     });
//     return query_list;
// }
// /**
//  * Parse a query component string.
//  */
// function _parse_query_component(query_component: string): IQueryComponent {
//     let attrib_name_str = '' ;
//     let attrib_value_str = '' ;
//     let operator_type: EFilterOperatorTypes = null;
//     // split the query at the @ sign
//     const [_, attrib_name_value_str]: string[] = query_component.split('@');
//     if (!attrib_name_value_str) { throw new Error('Bad query.'); }
//     // split the attrib_name_value_str based on operator, ==, !=, etc...
//     for (const key of Object.keys(EFilterOperatorTypes)) {
//         const split_query = attrib_name_value_str.split(EFilterOperatorTypes[key]);
//         if (split_query.length === 2) {
//             attrib_name_str =  split_query[0].trim();
//             attrib_value_str = split_query[1].trim();
//             operator_type = EFilterOperatorTypes[key];
//             break;
//         }
//     }
//     // check
//     if (!operator_type) {throw new Error('Bad operator in query.'); }
//     if (!attrib_name_str) {throw new Error('Bad attribute name in query.'); }
//     if (!attrib_value_str) {throw new Error('Bad attribute value in query.'); }
//     // parse the name
//     const attrib_name_index = _parse_name_str(attrib_name_str);
//     const attrib_name  = attrib_name_index[0];
//     const attrib_index  = attrib_name_index[1];
//     // parse the value
//     attrib_value_str = _parse_value_str(attrib_value_str);
//     // return the data for the query component as an object
//     return {
//         attrib_name: attrib_name,
//         attrib_index: attrib_index,
//         attrib_value_str: attrib_value_str,
//         operator_type: operator_type
//     };
// }
// /**
//  * Parse a sort string. #@name1 && #@name2
//  * Rerurns an array,[ query1, query2 ]
//  */
// function parseSort(sort_str: string): ISortComponent[] {
//     if (!sort_str.startsWith('#')) { throw new Error('Bad sort, sort string must start with #.'); }
//     if (sort_str.indexOf('||') !== -1) { throw new Error('Bad sort, sort string cannot contain || conditions.'); }
//     const sort_str_clean: string = sort_str.replace(/\s/g, '');
//     const component_strs: string[] = sort_str_clean.split('&&');
//     const sort_list: ISortComponent[] = [];
//     component_strs.forEach(component_str => {
//         sort_list.push(_parse_sort_component(component_str));
//     });
//     return sort_list;
// }
// /**
//  * Parse a query component string.
//  */
// function _parse_sort_component(sort_component: string): ISortComponent {
//     // split the query at the @ sign
//     const [_, attrib_name_str]: string[] = sort_component.split('@');
//     // check
//     if (!attrib_name_str) {throw new Error('Bad attribute name in query.'); }
//     // parse the name
//     const attrib_name_index = _parse_name_str(attrib_name_str);
//     const attrib_name  = attrib_name_index[0];
//     const attrib_index  = attrib_name_index[1];
//     // return the data for the query component as an object
//     return {
//         attrib_name: attrib_name,
//         attrib_index: attrib_index
//     };
// }
// /**
//  * Parse the attribute value. Handles sting with quotes, e.g. 'this' and "that".
//  * Remove quotes from value string
//  */
// function _parse_value_str(value_str: string): string {
//     const first_char: string = value_str.slice(0, 1);
//     if (first_char ===  '\'' || first_char === '"') {return value_str.slice(1, -1); }
//     return value_str;
// }
// /**
//  * Parese the attribute name. Handles names with indexes, e.g. 'name[2]'
//  * Split the name into the string name and the numeric index
//  */
// function _parse_name_str(value_str: string): [string, number?] {
//     const last_char: string = value_str.slice(-1);
//     if (last_char === ']') {
//         const [name_str, index_str]: [string, string] = value_str.slice(0, -1).split('[') as [string, string];
//         const index: number = Number(index_str);
//         if (isNaN(index)) {throw new Error('Bad query'); }
//         return [name_str, index];
//     }
//     return [value_str, null];
// }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lBdHRyaWJzUXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlicy9nZW8taW5mby9HSUF0dHJpYnNRdWVyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLHFDQUU2RTtBQUk3RTs7R0FFRztBQUNILE1BQWEsY0FBYztJQUd4Qjs7O1FBR0k7SUFDSCxZQUFZLEtBQWMsRUFBRSxZQUEwQjtRQUNsRCxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNwQixJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztJQUN0QyxDQUFDO0lBQ0Q7OztPQUdHO0lBQ0ksY0FBYyxDQUFDLElBQVk7UUFDOUIsTUFBTSxnQkFBZ0IsR0FBVyxvQkFBVyxDQUFDLGlCQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0QsTUFBTSxNQUFNLEdBQWtDLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUNuRixPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUNEOzs7OztPQUtHO0lBQ0ksaUJBQWlCLENBQUMsUUFBa0IsRUFBRSxJQUFZO1FBQ3JELE1BQU0sZ0JBQWdCLEdBQVcsb0JBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2RCxNQUFNLE9BQU8sR0FBMkQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzdHLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxTQUFTLEVBQUU7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7U0FBRTtRQUNyRyxJQUFJLFFBQVEsS0FBSyxpQkFBUSxDQUFDLEdBQUcsRUFBRTtZQUMzQixNQUFNLFdBQVcsR0FBa0MsT0FBd0MsQ0FBQztZQUM1RixNQUFNLEtBQUssR0FBcUIsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZ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