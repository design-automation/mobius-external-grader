import { GIModel } from './GIModel';
import { TAttribDataTypes, IAttribsMaps,
    Txyz, EAttribNames, EEntType,  ESort,
    EAttribDataTypeStrs, EEntTypeStr, EFilterOperatorTypes } from './common';
import { GIAttribMap } from './GIAttribMap';
import { string } from '../../core/inline/_mathjs';

/**
 * Class for attributes.
 */
export class GIAttribsQuery {
    private _model: GIModel;
    private _attribs_maps: IAttribsMaps;
   /**
     * Creates an object to store the attribute data.
     * @param model The JSON data
     */
    constructor(model: GIModel, attribs_maps: IAttribsMaps) {
        this._model = model;
        this._attribs_maps = attribs_maps;
    }
    /**
     * Checks if an attribute with this name exists.
     * @param name
     */
    public hasModelAttrib(name: string): boolean {
        const attribs_maps_key: string = EEntTypeStr[EEntType.MOD];
        const attrib: Map<string, TAttribDataTypes> = this._attribs_maps[attribs_maps_key];
        return attrib.has(name);
    }
    /**
     * Get attrib data type. Also works for MOD attribs.
     *
     * @param ent_type
     * @param name
     */
    public getAttribDataType(ent_type: EEntType, name: string): EAttribDataTypeStrs {
        const attribs_maps_key: string = EEntTypeStr[ent_type];
        const attribs: Map<string, GIAttribMap>|Map<string, TAttribDataTypes> = this._attribs_maps[attribs_maps_key];
        if (attribs.get(name) === undefined) { throw new Error('Attribute with this name does not exist.'); }
        if (ent_type === EEntType.MOD) {
            const mod_attribs: Map<string, TAttribDataTypes> = attribs as Map<string, TAttribDataTypes>;
            const value: TAttribDataTypes = mod_attribs.get(name);
            let first_value: number|string;
            if (Array.isArray(value)) {
                first_value = value[0];
            } else {
                first_value = value;
            }
            if (typeof first_value === 'string') { return EAttribDataTypeStrs.STRING; }
            return EAttribDataTypeStrs.NUMBER;
        } else {
            const ent_attribs: Map<string, GIAttribMap> = attribs as Map<string, GIAttribMap>;
            return ent_attribs.get(name).getDataType();
        }
    }
    /**
     * Get attrib data size. Also works for MOD attribs.
     *
     * @param ent_type
     * @param name
     */
    public getAttribDataSize(ent_type: EEntType, name: string): number {
        const attribs_maps_key: string = EEntTypeStr[ent_type];
        const attribs: Map<string, GIAttribMap>|Map<string, TAttribDataTypes> = this._attribs_maps[attribs_maps_key];
        if (attribs.get(name) === undefined) { throw new Error('Attribute with this name does not exist.'); }
        if (ent_type === EEntType.MOD) {
            const mod_attribs: Map<string, TAttribDataTypes> = attribs as Map<string, TAttribDataTypes>;
            const value: TAttribDataTypes = mod_attribs.get(name);
            if (Array.isArray(value)) {
                return (value as number[]|string[]).length;
            } else {
                return 1;
            }
        } else {
            const ent_attribs: Map<string, GIAttribMap> = attribs as Map<string, GIAttribMap>;
            return ent_attribs.get(name).getDataSize();
        }
    }
    /**
     * Get a model attrib value
     * @param name
     */
    public getModelAttribValue(name: string): TAttribDataTypes {
        const attribs_maps_key: string = EEntTypeStr[EEntType.MOD];
        const attribs: Map<string, TAttribDataTypes> = this._attribs_maps[attribs_maps_key];
        const value: TAttribDataTypes = attribs.get(name);
        if (value === undefined) { return null; }
        return value;
    }
    /**
     * Get a model attrib indexed value
     * @param ent_type
     * @param name
     */
    public getModelAttribIndexedValue(name: string, value_index: number): number|string {
        const attribs_maps_key: string = EEntTypeStr[EEntType.MOD];
        const attribs: Map<string, TAttribDataTypes> = this._attribs_maps[attribs_maps_key];
        const list_value: TAttribDataTypes = attribs.get(name);
        if (list_value === undefined) { return null; }
        if (!Array.isArray(list_value)) { return null; }
        if (value_index >= list_value.length) { return null; }
        return list_value[value_index];
    }
    /**
     * Get an entity attrib value.
     * If the attribute does not exist, return null.
     * @param ent_type
     * @param name
     */
    public getAttribValue(ent_type: EEntType, name: string, ents_i: number|number[]): TAttribDataTypes|TAttribDataTypes[] {
        const attribs_maps_key: string = EEntTypeStr[ent_type];
        const attribs: Map<string, GIAttribMap> = this._attribs_maps[attribs_maps_key];
        const attrib: GIAttribMap = attribs.get(name);
        if (attrib === undefined) { return null; }
        return attrib.getEntVal(ents_i);
    }
    /**
     * Get an entity attrib indexed value.
     * If the attribute does not exist or the index is out of range, return null.
     * @param ent_type
     * @param name
     */
    public getAttribIndexedValue(ent_type: EEntType, name: string, ents_i: number, value_index: number): number|string {
        const attribs_maps_key: string = EEntTypeStr[ent_type];
        const attribs: Map<string, GIAttribMap> = this._attribs_maps[attribs_maps_key];
        const attrib: GIAttribMap = attribs.get(name);
        if (attrib === undefined) { return null; }
        // if (attrib.getDataSize() === 1) { throw new Error('Attribute is not a list, so indexed values are not allowed.'); }
        if (value_index >= attrib.getDataSize()) { throw new Error('Value index is out of range for attribute list size.'); }
        return attrib.getEntIdxVal(ents_i, value_index) as number|string;
    }
    /**
     * Check if attribute exists
     * @param ent_type
     * @param name
     */
    public hasAttrib(ent_type: EEntType, name: string): boolean {
        const attribs_maps_key: string = EEntTypeStr[ent_type];
        const attribs: Map<string, GIAttribMap> = this._attribs_maps[attribs_maps_key];
        return attribs.has(name);
    }
    /**
     * Get all the attribute names for an entity type
     * @param ent_type
     */
    public getAttribNames(ent_type: EEntType): string[] {
        const attribs_maps_key: string = EEntTypeStr[ent_type];
        const attribs_map: Map<string, GIAttribMap> = this._attribs_maps[attribs_maps_key];
        return Array.from(attribs_map.keys());
    }
    /**
     * Get all the user defined attribute names for an entity type
     * This excludes the built in attribute names, xyz and anything starting with '_'
     * @param ent_type
     */
    public getAttribNamesUser(ent_type: EEntType): string[] {
        const attribs_maps_key: string = EEntTypeStr[ent_type];
        const attribs_map: Map<string, GIAttribMap> = this._attribs_maps[attribs_maps_key];
        let attribs: string[] = Array.from(attribs_map.keys());
        if (ent_type === EEntType.POSI) {
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
    public getAttrib(ent_type: EEntType, name: string): GIAttribMap {
        const attribs_maps_key: string = EEntTypeStr[ent_type];
        const attribs: Map<string, GIAttribMap> = this._attribs_maps[attribs_maps_key];
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
    public filterByAttribs(ent_type: EEntType, ents_i: number[],
            name: string, index: number, op_type: EFilterOperatorTypes, value: TAttribDataTypes): number[] {
        // get the map that contains all the attributes for the ent_type
        const attribs_maps_key: string = EEntTypeStr[ent_type];
        const attribs: Map<string, GIAttribMap> = this._attribs_maps[attribs_maps_key];
        // do the query
        if (attribs && attribs.has(name)) {
            const attrib: GIAttribMap = attribs.get(name);
            const query_ents_i: number[] = attrib.queryVal2(
                ents_i,
                index,
                op_type,
                value
            );
            // return the result
            return query_ents_i;
        } else {
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
    public sortByAttribs(ent_type: EEntType, ents_i: number[],
            name: string, index: number, method: ESort): number[] {
        // get the map that contains all the ettributes for the ent_type
        const attribs_maps_key: string = EEntTypeStr[ent_type];
        const attribs: Map<string, GIAttribMap> = this._attribs_maps[attribs_maps_key];
        if (!attribs)  { throw new Error('Bad sort: Attribute does not exist.'); }
        // create the sort copmapre function
        function _sortCompare(ent1_i: number, ent2_i: number): number {
            const attrib: GIAttribMap = attribs.get(name);
            let val1: TAttribDataTypes = attrib.getEntVal(ent1_i) as TAttribDataTypes;
            let val2: TAttribDataTypes = attrib.getEntVal(ent2_i) as TAttribDataTypes;
            if (index !== null) {
                if (val1 !== undefined && val1 !== null) {
                    val1 = val1[index];
                }
                if (val2 !== undefined && val2 !== null) {
                    val2 = val2[index];
                }
            }
            if (method === ESort.DESCENDING) {
                if (val1 < val2) { return -1; }
                if (val1 > val2) { return 1; }
            } else {
                if (val1 < val2) { return 1; }
                if (val1 > val2) { return -1; }
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
    public getPosiCoords(posi_i: number): Txyz {
        const result = this._attribs_maps.ps.get(EAttribNames.COORDS).getEntVal(posi_i) as Txyz;
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
    public getVertCoords(vert_i: number): Txyz {
        const posi_i: number = this._model.geom.query.navVertToPosi(vert_i);
        return this._attribs_maps.ps.get(EAttribNames.COORDS).getEntVal(posi_i) as Txyz;
    }
    // /**
    //  * Shortcut for getting coords for all verts
    //  * @param attrib_name
    //  */
    // public getAllVertsCoords(attrib_name: string): Txyz[] {
    //     const verts_i: number[] = this._model.geom.query.getEnts(EEntType.VERT);
    //     const posis_i: number[] = verts_i.map( vert_i => this._model.geom.query.navVertToPosi(vert_i));
    //     const coords_map: GIAttribMap = this._attribs_maps.ps.get(EAttribNames.COORDS);
    //     return coords_map.getEntVal(posis_i) as Txyz[];
    // }
}
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
