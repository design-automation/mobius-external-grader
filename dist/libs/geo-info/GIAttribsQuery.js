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
            return common_1.EAttribDataTypeStrs.FLOAT;
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
        const attrib = this._attribs_maps[attribs_maps_key];
        if (attrib.get(name) === undefined) {
            throw new Error('Attribute with this name does not exist.');
        }
        return attrib.get(name);
    }
    /**
     * Get a model attrib indexed value
     * @param ent_type
     * @param name
     */
    getModelAttribIndexedValue(name, value_index) {
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
        return list_value[value_index];
    }
    /**
     * Get an entity attrib value
     * @param ent_type
     * @param name
     */
    getAttribValue(ent_type, name, ents_i) {
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        if (attribs.get(name) === undefined) {
            throw new Error('Attribute with this name does not exist.');
        }
        return attribs.get(name).getEntVal(ents_i);
    }
    /**
     * Get an entity attrib indexed value
     * @param ent_type
     * @param name
     */
    getAttribIndexedValue(ent_type, name, ents_i, value_index) {
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        const attrib = attribs.get(name);
        if (attrib === undefined) {
            throw new Error('Attribute with this name does not exist.');
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
        const attribs = this._attribs_maps[attribs_maps_key];
        return Array.from(attribs.keys());
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
    /**
     * Query the model using a query strings.
     * Returns a list of entities in the model.
     * @param ent_type The type of the entities being search for
     * @param query_str The query string, e.g. '#@name == value'
     * @param indices The indices of entites in the model. These are assumed to be of type ent_type.
     */
    queryAttribs(ent_type, query_str, indices) {
        // get the map that contains all the ettributes for the ent_type
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        // parse the query
        const queries = parseQuery(query_str);
        if (!queries) {
            return [];
        }
        // do the query, one by one
        // [[query1 && query2] || [query3 && query4]]
        let union_query_results = [];
        for (const and_queries of queries) {
            // get the ents_i to start the '&&' query
            let query_ents_i = null;
            if (indices !== null && indices !== undefined) {
                query_ents_i = indices;
            }
            else {
                query_ents_i = this._model.geom.query.getEnts(ent_type, false);
            }
            // do the '&&' queries
            for (const and_query of and_queries) {
                if (attribs && attribs.has(and_query.attrib_name)) {
                    const attrib = attribs.get(and_query.attrib_name);
                    query_ents_i = attrib.queryVal(query_ents_i, and_query.attrib_index, and_query.operator_type, and_query.attrib_value_str);
                }
                else {
                    throw new Error('Attribute "' + and_query.attrib_name + '" does not exist.');
                    // query_ents_i = [];
                }
            }
            // combine the results of the '&&' queries
            if (query_ents_i !== null && query_ents_i.length > 0) {
                union_query_results = Array.from(new Set([...union_query_results, ...query_ents_i]));
            }
        }
        // return the result
        return union_query_results;
    }
    /**
     * Query the model using a sort strings.
     * Returns a list of entities in the model.
     * @param ent_type The type of the entities being search for
     * @param sort_str The sort string, e.g. '#@name && #@name2[3]'
     * @param indices The indices of entites in the model. These are assumed to be of type ent_type.
     */
    sortByAttribs(ent_type, indices, sort_str, method) {
        // get the map that contains all the ettributes for the ent_type
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        if (!attribs) {
            throw new Error('Bad sort: Attribute does not exist.');
        }
        // parse the query
        const sorts = parseSort(sort_str);
        if (!sorts) {
            return [];
        }
        // create the sort copmapre function
        function _sortCompare(ent1_i, ent2_i) {
            // do the '&&' sorts
            for (const sort of sorts) {
                if (!attribs.has(sort.attrib_name)) {
                    throw new Error('Bad sort: Attribute does not exist.');
                }
                const attrib = attribs.get(sort.attrib_name);
                const data_size = attrib.getDataSize();
                if (sort.attrib_index !== null && data_size === 1) {
                    throw new Error('Bad sort: Attribute with index must have a size greater than 1.');
                }
                let val1 = attrib.getEntVal(ent1_i);
                let val2 = attrib.getEntVal(ent2_i);
                if (sort.attrib_index !== null) {
                    if (val1 !== undefined && val1 !== null) {
                        val1 = val1[sort.attrib_index];
                    }
                    if (val2 !== undefined && val2 !== null) {
                        val2 = val2[sort.attrib_index];
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
            }
            return 0;
        }
        // do the sort
        indices.sort(_sortCompare);
        return indices;
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
/**
 * Parse a query string.
 * && takes precedence over ||
 * [ [ query1 && query2 ] || [ query3 && query4 ] ]
 */
function parseQuery(query_str) {
    if (!query_str.startsWith('#')) {
        throw new Error('Bad query, query string must start with #.');
    }
    const or_query_strs = query_str.split('||');
    const query_list = [];
    or_query_strs.forEach(or_query_str => {
        const and_query_strs = or_query_str.split('&&');
        query_list.push(and_query_strs.map(and_query_str => _parse_query_component(and_query_str)));
    });
    return query_list;
}
/**
 * Parse a query component string.
 */
function _parse_query_component(query_component) {
    let attrib_name_str = '';
    let attrib_value_str = '';
    let operator_type = null;
    // split the query at the @ sign
    const [_, attrib_name_value_str] = query_component.split('@');
    if (!attrib_name_value_str) {
        throw new Error('Bad query.');
    }
    // split the attrib_name_value_str based on operator, ==, !=, etc...
    for (const key of Object.keys(common_1.EQueryOperatorTypes)) {
        const split_query = attrib_name_value_str.split(common_1.EQueryOperatorTypes[key]);
        if (split_query.length === 2) {
            attrib_name_str = split_query[0].trim();
            attrib_value_str = split_query[1].trim();
            operator_type = common_1.EQueryOperatorTypes[key];
            break;
        }
    }
    // check
    if (!operator_type) {
        throw new Error('Bad operator in query.');
    }
    if (!attrib_name_str) {
        throw new Error('Bad attribute name in query.');
    }
    if (!attrib_value_str) {
        throw new Error('Bad attribute value in query.');
    }
    // parse the name
    const attrib_name_index = _parse_name_str(attrib_name_str);
    const attrib_name = attrib_name_index[0];
    const attrib_index = attrib_name_index[1];
    // parse the value
    attrib_value_str = _parse_value_str(attrib_value_str);
    // return the data for the query component as an object
    return {
        attrib_name: attrib_name,
        attrib_index: attrib_index,
        attrib_value_str: attrib_value_str,
        operator_type: operator_type
    };
}
/**
 * Parse a sort string. #@name1 && #@name2
 * Rerurns an array,[ query1, query2 ]
 */
function parseSort(sort_str) {
    if (!sort_str.startsWith('#')) {
        throw new Error('Bad sort, sort string must start with #.');
    }
    if (sort_str.indexOf('||') !== -1) {
        throw new Error('Bad sort, sort string cannot contain || conditions.');
    }
    const sort_str_clean = sort_str.replace(/\s/g, '');
    const component_strs = sort_str_clean.split('&&');
    const sort_list = [];
    component_strs.forEach(component_str => {
        sort_list.push(_parse_sort_component(component_str));
    });
    return sort_list;
}
/**
 * Parse a query component string.
 */
function _parse_sort_component(sort_component) {
    // split the query at the @ sign
    const [_, attrib_name_str] = sort_component.split('@');
    // check
    if (!attrib_name_str) {
        throw new Error('Bad attribute name in query.');
    }
    // parse the name
    const attrib_name_index = _parse_name_str(attrib_name_str);
    const attrib_name = attrib_name_index[0];
    const attrib_index = attrib_name_index[1];
    // return the data for the query component as an object
    return {
        attrib_name: attrib_name,
        attrib_index: attrib_index
    };
}
/**
 * Parse the attribute value. Handles sting with quotes, e.g. 'this' and "that".
 * Remove quotes from value string
 */
function _parse_value_str(value_str) {
    const first_char = value_str.slice(0, 1);
    if (first_char === '\'' || first_char === '"') {
        return value_str.slice(1, -1);
    }
    return value_str;
}
/**
 * Parese the attribute name. Handles names with indexes, e.g. 'name[2]'
 * Split the name into the string name and the numeric index
 */
function _parse_name_str(value_str) {
    const last_char = value_str.slice(-1);
    if (last_char === ']') {
        const [name_str, index_str] = value_str.slice(0, -1).split('[');
        const index = Number(index_str);
        if (isNaN(index)) {
            throw new Error('Bad query');
        }
        return [name_str, index];
    }
    return [value_str, null];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lBdHRyaWJzUXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlicy9nZW8taW5mby9HSUF0dHJpYnNRdWVyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLHFDQUNpSTtBQUlqSTs7R0FFRztBQUNILE1BQWEsY0FBYztJQUd4Qjs7O1FBR0k7SUFDSCxZQUFZLEtBQWMsRUFBRSxZQUEwQjtRQUNsRCxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNwQixJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztJQUN0QyxDQUFDO0lBQ0Q7OztPQUdHO0lBQ0ksY0FBYyxDQUFDLElBQVk7UUFDOUIsTUFBTSxnQkFBZ0IsR0FBVyxvQkFBVyxDQUFDLGlCQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0QsTUFBTSxNQUFNLEdBQWtDLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUNuRixPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUNEOzs7OztPQUtHO0lBQ0ksaUJBQWlCLENBQUMsUUFBa0IsRUFBRSxJQUFZO1FBQ3JELE1BQU0sZ0JBQWdCLEdBQVcsb0JBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2RCxNQUFNLE9BQU8sR0FBMkQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzdHLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxTQUFTLEVBQUU7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7U0FBRTtRQUNyRyxJQUFJLFFBQVEsS0FBSyxpQkFBUSxDQUFDLEdBQUcsRUFBRTtZQUMzQixNQUFNLFdBQVcsR0FBa0MsT0FBd0MsQ0FBQztZQUM1RixNQUFNLEtBQUssR0FBcUIsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN0RCxJQUFJLFdBQTBCLENBQUM7WUFDL0IsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUN0QixXQUFXLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQzFCO2lCQUFNO2dCQUNILFdBQVcsR0FBRyxLQUFLLENBQUM7YUFDdkI7WUFDRCxJQUFJLE9BQU8sV0FBVyxLQUFLLFFBQVEsRUFBRTtnQkFBRSxPQUFPLDRCQUFtQixDQUFDLE1BQU0sQ0FBQzthQUFFO1lBQzNFLE9BQU8sNEJBQW1CLENBQUMsS0FBSyxDQUFDO1NBQ3BDO2FBQU07WUFDSCxNQUFNLFdBQVcsR0FBNkIsT0FBbUMsQ0FBQztZQUNsRixPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7U0FDOUM7SUFDTCxDQUFDO0lBQ0Q7Ozs7O09BS0c7SUFDSSxpQkFBaUIsQ0FBQyxRQUFrQixFQUFFLElBQVk7UUFDckQsTUFBTSxnQkFBZ0IsR0FBVyxvQkFBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sT0FBTyxHQUEyRCxJQUFJLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDN0csSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLFNBQVMsRUFBRTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsMENBQTBDLENBQUMsQ0FBQztTQUFFO1FBQ3JHLElBQUksUUFBUSxLQUFLLGlCQUFRLENBQUMsR0FBRyxFQUFFO1lBQzNCLE1BQU0sV0FBVyxHQUFrQyxPQUF3QyxDQUFDO1lBQzVGLE1BQU0sS0FBSyxHQUFxQixXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3RELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDdEIsT0FBUSxLQUEyQixDQUFDLE1BQU0sQ0FBQzthQUM5QztpQkFBTTtnQkFDSCxPQUFPLENBQUMsQ0FBQzthQUNaO1NBQ0o7YUFBTTtZQUNILE1BQU0sV0FBVyxHQUE2QixPQUFtQyxDQUFDO1lBQ2xGLE9BQU8sV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztTQUM5QztJQUNMLENBQUM7SUFDRDs7O09BR0c7SUFDSSxtQkFBbUIsQ0FBQyxJQUFZO1FBQ25DLE1BQU0sZ0JBQWdCLEdBQVcsb0JBQVcsQ0FBQyxpQkFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzNELE1BQU0sTUFBTSxHQUFrQyxJQUFJLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDbkYsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLFNBQVMsRUFBRTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsMENBQTBDLENBQUMsQ0FBQztTQUFFO1FBQ3BHLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBQ0Q7Ozs7T0FJRztJQUNJLDBCQUEwQixDQUFDLElBQVksRUFBRSxXQUFtQjtRQUMvRCxNQUFNLGdCQUFnQixHQUFXLG9CQUFXLENBQUMsaUJBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzRCxNQUFNLE1BQU0sR0FBa0MsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ25GLE1BQU0sVUFBVSxHQUFxQixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RELElBQUksVUFBVSxLQUFLLFNBQVMsRUFBRTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsMENBQTBDLENBQUMsQ0FBQztTQUFFO1FBQzlGLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyw2REFBNkQsQ0FBQyxDQUFDO1NBQUU7UUFDbkgsSUFBSSxXQUFXLElBQUksVUFBVSxDQUFDLE1BQU0sRUFBRTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsc0RBQXNELENBQUMsQ0FBQztTQUFFO1FBQ2xILE9BQU8sVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFDRDs7OztPQUlHO0lBQ0ksY0FBYyxDQUFDLFFBQWtCLEVBQUUsSUFBWSxFQUFFLE1BQXVCO1FBQzNFLE1BQU0sZ0JBQWdCLEdBQVcsb0JBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2RCxNQUFNLE9BQU8sR0FBNkIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQy9FLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxTQUFTLEVBQUU7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7U0FBRTtRQUNyRyxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFDRDs7OztPQUlHO0lBQ0kscUJBQXFCLENBQUMsUUFBa0IsRUFBRSxJQUFZLEVBQUUsTUFBYyxFQUFFLFdBQW1CO1FBQzlGLE1BQU0sZ0JBQWdCLEdBQVcsb0JBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2RCxNQUFNLE9BQU8sR0FBNkIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQy9FLE1BQU0sTUFBTSxHQUFnQixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlDLElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsMENBQTBDLENBQUMsQ0FBQztTQUFFO1FBQzFGLHNIQUFzSDtRQUN0SCxJQUFJLFdBQVcsSUFBSSxNQUFNLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7U0FBRTtRQUNySCxPQUFPLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBa0IsQ0FBQztJQUNyRSxDQUFDO0lBQ0Q7Ozs7T0FJRztJQUNJLFNBQVMsQ0FBQyxRQUFrQixFQUFFLElBQVk7UUFDN0MsTUFBTSxnQkFBZ0IsR0FBVyxvQkFBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sT0FBTyxHQUE2QixJQUFJLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDL0UsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFDRDs7O09BR0c7SUFDSSxjQUFjLENBQUMsUUFBa0I7UUFDcEMsTUFBTSxnQkFBZ0IsR0FBVyxvQkFBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sT0FBTyxHQUE2QixJQUFJLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDL0UsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFDRDs7OztPQUlHO0lBQ0ksU0FBUyxDQUFDLFFBQWtCLEVBQUUsSUFBWTtRQUM3QyxNQUFNLGdCQUFnQixHQUFXLG9CQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdkQsTUFBTSxPQUFPLEdBQTZCLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUMvRSxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUNEOzs7Ozs7T0FNRztJQUNJLFlBQVksQ0FBQyxRQUFrQixFQUFFLFNBQWlCLEVBQUUsT0FBaUI7UUFDeEUsZ0VBQWdFO1FBQ2hFLE1BQU0sZ0JBQWdCLEdBQVcsb0JBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2RCxNQUFNLE9BQU8sR0FBNkIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQy9FLGtCQUFrQjtRQUNsQixNQUFNLE9BQU8sR0FBd0IsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxPQUFPLEVBQUU7WUFBRSxPQUFPLEVBQUUsQ0FBQztTQUFFO1FBQzVCLDJCQUEyQjtRQUMzQiw2Q0FBNkM7UUFDN0MsSUFBSSxtQkFBbUIsR0FBYSxFQUFFLENBQUM7UUFDdkMsS0FBSyxNQUFNLFdBQVcsSUFBSSxPQUFPLEVBQUc7WUFDaEMseUNBQXlDO1lBQ3pDLElBQUksWUFBWSxHQUFhLElBQUksQ0FBQztZQUNsQyxJQUFJLE9BQU8sS0FBSyxJQUFJLElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRTtnQkFDM0MsWUFBWSxHQUFHLE9BQU8sQ0FBQzthQUMxQjtpQkFBTTtnQkFDSCxZQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDbEU7WUFDRCxzQkFBc0I7WUFDdEIsS0FBSyxNQUFNLFNBQVMsSUFBSSxXQUFXLEVBQUU7Z0JBQ2pDLElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxFQUFFO29CQUMvQyxNQUFNLE1BQU0sR0FBZ0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQy9ELFlBQVksR0FBRyxNQUFNLENBQUMsUUFBUSxDQUMxQixZQUFZLEVBQ1osU0FBUyxDQUFDLFlBQVksRUFDdEIsU0FBUyxDQUFDLGFBQWEsRUFDdkIsU0FBUyxDQUFDLGdCQUFnQixDQUM3QixDQUFDO2lCQUNMO3FCQUFNO29CQUNILE1BQU0sSUFBSSxLQUFLLENBQUMsYUFBYSxHQUFHLFNBQVMsQ0FBQyxXQUFXLEdBQUcsbUJBQW1CLENBQUMsQ0FBQztvQkFDN0UscUJBQXFCO2lCQUN4QjthQUNKO1lBQ0QsMENBQTBDO1lBQzFDLElBQUksWUFBWSxLQUFLLElBQUksSUFBSSxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDbEQsbUJBQW1CLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsbUJBQW1CLEVBQUUsR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDeEY7U0FDSjtRQUNELG9CQUFvQjtRQUNwQixPQUFPLG1CQUFtQixDQUFDO0lBQy9CLENBQUM7SUFDRDs7Ozs7O09BTUc7SUFDSSxhQUFhLENBQUMsUUFBa0IsRUFBRSxPQUFpQixFQUFFLFFBQWdCLEVBQUUsTUFBYTtRQUN2RixnRUFBZ0U7UUFDaEUsTUFBTSxnQkFBZ0IsR0FBVyxvQkFBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sT0FBTyxHQUE2QixJQUFJLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDL0UsSUFBSSxDQUFDLE9BQU8sRUFBRztZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMscUNBQXFDLENBQUMsQ0FBQztTQUFFO1FBQzFFLGtCQUFrQjtRQUNsQixNQUFNLEtBQUssR0FBcUIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BELElBQUksQ0FBQyxLQUFLLEVBQUU7WUFBRSxPQUFPLEVBQUUsQ0FBQztTQUFFO1FBQzFCLG9DQUFvQztRQUNwQyxTQUFTLFlBQVksQ0FBQyxNQUFjLEVBQUUsTUFBYztZQUNoRCxvQkFBb0I7WUFDcEIsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUU7Z0JBQ3RCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRTtvQkFDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO2lCQUMxRDtnQkFDRCxNQUFNLE1BQU0sR0FBZ0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQzFELE1BQU0sU0FBUyxHQUFXLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDL0MsSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLElBQUksSUFBSSxTQUFTLEtBQUssQ0FBQyxFQUFFO29CQUMvQyxNQUFNLElBQUksS0FBSyxDQUFDLGlFQUFpRSxDQUFDLENBQUM7aUJBQ3RGO2dCQUNELElBQUksSUFBSSxHQUFxQixNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBcUIsQ0FBQztnQkFDMUUsSUFBSSxJQUFJLEdBQXFCLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFxQixDQUFDO2dCQUMxRSxJQUFJLElBQUksQ0FBQyxZQUFZLEtBQUssSUFBSSxFQUFFO29CQUM1QixJQUFJLElBQUksS0FBSyxTQUFTLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTt3QkFDckMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7cUJBQ2xDO29CQUNELElBQUksSUFBSSxLQUFLLFNBQVMsSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFO3dCQUNyQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztxQkFDbEM7aUJBQ0o7Z0JBQ0QsSUFBSSxNQUFNLEtBQUssY0FBSyxDQUFDLFVBQVUsRUFBRTtvQkFDN0IsSUFBSSxJQUFJLEdBQUcsSUFBSSxFQUFFO3dCQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7cUJBQUU7b0JBQy9CLElBQUksSUFBSSxHQUFHLElBQUksRUFBRTt3QkFBRSxPQUFPLENBQUMsQ0FBQztxQkFBRTtpQkFDakM7cUJBQU07b0JBQ0gsSUFBSSxJQUFJLEdBQUcsSUFBSSxFQUFFO3dCQUFFLE9BQU8sQ0FBQyxDQUFDO3FCQUFFO29CQUM5QixJQUFJLElBQUksR0FBRyxJQUFJLEVBQUU7d0JBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztxQkFBRTtpQkFDbEM7YUFDSjtZQUNELE9BQU8sQ0FBQyxDQUFDO1FBQ2IsQ0FBQztRQUNELGNBQWM7UUFDZCxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzNCLE9BQU8sT0FBTyxDQUFDO0lBQ25CLENBQUM7SUFDRCwrRUFBK0U7SUFDL0UsNEJBQTRCO0lBQzVCLCtFQUErRTtJQUMvRTs7O09BR0c7SUFDSSxhQUFhLENBQUMsTUFBYztRQUMvQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMscUJBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFTLENBQUM7UUFDeEYsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUNELE1BQU07SUFDTiwwQ0FBMEM7SUFDMUMsbUJBQW1CO0lBQ25CLE1BQU07SUFDTix1Q0FBdUM7SUFDdkMsK0VBQStFO0lBQy9FLHNGQUFzRjtJQUN0RixzREFBc0Q7SUFDdEQsSUFBSTtJQUNKOzs7T0FHRztJQUNJLGFBQWEsQ0FBQyxNQUFjO1FBQy9CLE1BQU0sTUFBTSxHQUFXLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDcEUsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMscUJBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFTLENBQUM7SUFDcEYsQ0FBQztDQVdKO0FBNVJELHdDQTRSQztBQUNELG1HQUFtRztBQUNuRyxnQ0FBZ0M7QUFDaEMsbUdBQW1HO0FBQ25HOzs7O0dBSUc7QUFDSCxTQUFTLFVBQVUsQ0FBQyxTQUFpQjtJQUNqQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztLQUFFO0lBQ2pHLE1BQU0sYUFBYSxHQUFhLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEQsTUFBTSxVQUFVLEdBQXdCLEVBQUUsQ0FBQztJQUMzQyxhQUFhLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUFFO1FBQ2pDLE1BQU0sY0FBYyxHQUFhLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUQsVUFBVSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFFLGFBQWEsQ0FBQyxFQUFFLENBQUMsc0JBQXNCLENBQUMsYUFBYSxDQUFDLENBQUUsQ0FBRSxDQUFDO0lBQ25HLENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxVQUFVLENBQUM7QUFDdEIsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBUyxzQkFBc0IsQ0FBQyxlQUF1QjtJQUNuRCxJQUFJLGVBQWUsR0FBRyxFQUFFLENBQUU7SUFDMUIsSUFBSSxnQkFBZ0IsR0FBRyxFQUFFLENBQUU7SUFDM0IsSUFBSSxhQUFhLEdBQXdCLElBQUksQ0FBQztJQUM5QyxnQ0FBZ0M7SUFDaEMsTUFBTSxDQUFDLENBQUMsRUFBRSxxQkFBcUIsQ0FBQyxHQUFhLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDeEUsSUFBSSxDQUFDLHFCQUFxQixFQUFFO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztLQUFFO0lBQzlELG9FQUFvRTtJQUNwRSxLQUFLLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsNEJBQW1CLENBQUMsRUFBRTtRQUNoRCxNQUFNLFdBQVcsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsNEJBQW1CLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMxRSxJQUFJLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQzFCLGVBQWUsR0FBSSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDekMsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3pDLGFBQWEsR0FBRyw0QkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN6QyxNQUFNO1NBQ1Q7S0FDSjtJQUNELFFBQVE7SUFDUixJQUFJLENBQUMsYUFBYSxFQUFFO1FBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0tBQUU7SUFDakUsSUFBSSxDQUFDLGVBQWUsRUFBRTtRQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztLQUFFO0lBQ3pFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtRQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQztLQUFFO0lBQzNFLGlCQUFpQjtJQUNqQixNQUFNLGlCQUFpQixHQUFHLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUMzRCxNQUFNLFdBQVcsR0FBSSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxQyxNQUFNLFlBQVksR0FBSSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQyxrQkFBa0I7SUFDbEIsZ0JBQWdCLEdBQUcsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUN0RCx1REFBdUQ7SUFDdkQsT0FBTztRQUNILFdBQVcsRUFBRSxXQUFXO1FBQ3hCLFlBQVksRUFBRSxZQUFZO1FBQzFCLGdCQUFnQixFQUFFLGdCQUFnQjtRQUNsQyxhQUFhLEVBQUUsYUFBYTtLQUMvQixDQUFDO0FBQ04sQ0FBQztBQUNEOzs7R0FHRztBQUNILFNBQVMsU0FBUyxDQUFDLFFBQWdCO0lBQy9CLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO0tBQUU7SUFDL0YsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxxREFBcUQsQ0FBQyxDQUFDO0tBQUU7SUFDOUcsTUFBTSxjQUFjLEdBQVcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDM0QsTUFBTSxjQUFjLEdBQWEsY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1RCxNQUFNLFNBQVMsR0FBcUIsRUFBRSxDQUFDO0lBQ3ZDLGNBQWMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQUU7UUFDbkMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO0lBQ3pELENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxTQUFTLENBQUM7QUFDckIsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBUyxxQkFBcUIsQ0FBQyxjQUFzQjtJQUNqRCxnQ0FBZ0M7SUFDaEMsTUFBTSxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsR0FBYSxjQUFjLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2pFLFFBQVE7SUFDUixJQUFJLENBQUMsZUFBZSxFQUFFO1FBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0tBQUU7SUFDekUsaUJBQWlCO0lBQ2pCLE1BQU0saUJBQWlCLEdBQUcsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQzNELE1BQU0sV0FBVyxHQUFJLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFDLE1BQU0sWUFBWSxHQUFJLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNDLHVEQUF1RDtJQUN2RCxPQUFPO1FBQ0gsV0FBVyxFQUFFLFdBQVc7UUFDeEIsWUFBWSxFQUFFLFlBQVk7S0FDN0IsQ0FBQztBQUNOLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLGdCQUFnQixDQUFDLFNBQWlCO0lBQ3ZDLE1BQU0sVUFBVSxHQUFXLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2pELElBQUksVUFBVSxLQUFNLElBQUksSUFBSSxVQUFVLEtBQUssR0FBRyxFQUFFO1FBQUMsT0FBTyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQUU7SUFDakYsT0FBTyxTQUFTLENBQUM7QUFDckIsQ0FBQztBQUNEOzs7R0FHRztBQUNILFNBQVMsZUFBZSxDQUFDLFNBQWlCO0lBQ3RDLE1BQU0sU0FBUyxHQUFXLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM5QyxJQUFJLFNBQVMsS0FBSyxHQUFHLEVBQUU7UUFDbkIsTUFBTSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsR0FBcUIsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFxQixDQUFDO1FBQ3RHLE1BQU0sS0FBSyxHQUFXLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN4QyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7U0FBRTtRQUNsRCxPQUFPLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQzVCO0lBQ0QsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUM3QixDQUFDIn0=