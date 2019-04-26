"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
const util_1 = require("util");
const maps_1 = require("../util/maps");
/**
 * Class for attributes.
 */
class GIAttribsThreejs {
    /**
      * Creates an object to store the attribute data.
      * @param model The JSON data
      */
    constructor(model, attribs_maps) {
        this._model = model;
        this._attribs_maps = attribs_maps;
    }
    // ============================================================================
    // Threejs
    // For methods to get the array of edges and triangles, see the geom class
    // get3jsTris() and get3jsEdges()
    // ============================================================================
    /**
     * Get a flat array of all the coordinates of all the vertices.
     * Verts that have been deleted will not be included
     * @param verts An array of vertex indices pointing to the positio.
     */
    get3jsSeqPosisCoords() {
        const coords_attrib = this._attribs_maps.ps.get(common_1.EAttribNames.COORDS);
        //
        const coords = [];
        const posi_map = new Map();
        const posis_i = this._model.geom.query.getEnts(common_1.EEntType.POSI, true);
        posis_i.forEach((posi_i, gi_index) => {
            if (posi_i !== null) {
                const tjs_index = coords.push(coords_attrib.getEntVal(posi_i)) - 1;
                posi_map.set(gi_index, tjs_index);
            }
        });
        // @ts-ignore
        return [coords.flat(1), posi_map];
    }
    /**
     * Get a flat array of all the coordinates of all the vertices.
     * Verts that have been deleted will not be included
     * @param verts An array of vertex indices pointing to the positio.
     */
    get3jsSeqVertsCoords() {
        const coords_attrib = this._attribs_maps.ps.get(common_1.EAttribNames.COORDS);
        //
        const coords = [];
        const vertex_map = new Map();
        const verts_i = this._model.geom.query.getEnts(common_1.EEntType.VERT, true);
        verts_i.forEach((vert_i, gi_index) => {
            if (vert_i !== null) {
                const posi_i = this._model.geom.query.navVertToPosi(vert_i);
                const tjs_index = coords.push(coords_attrib.getEntVal(posi_i)) - 1;
                vertex_map.set(gi_index, tjs_index);
            }
        });
        // @ts-ignore
        return [coords.flat(1), vertex_map];
    }
    /**
     * Get a flat array of attribute values for all the vertices.
     * Verts that have been deleted will not be included
     * @param attrib_name The name of the vertex attribute. Either NORMAL or COLOR.
     */
    get3jsSeqVertsAttrib(attrib_name) {
        if (!this._attribs_maps._v.has(attrib_name)) {
            return null;
        }
        const verts_attrib = this._attribs_maps._v.get(attrib_name);
        //
        const verts_attribs_values = [];
        const verts_i = this._model.geom.query.getEnts(common_1.EEntType.VERT, true);
        verts_i.forEach((vert_i, gi_index) => {
            if (vert_i !== null) {
                const value = verts_attrib.getEntVal(vert_i);
                if (attrib_name === common_1.EAttribNames.COLOUR) {
                    const _value = value === undefined ? [1, 1, 1] : value;
                    verts_attribs_values.push(_value);
                }
                else {
                    verts_attribs_values.push(value);
                }
            }
        });
        // @ts-ignore
        return verts_attribs_values.flat(1);
    }
    /**
     *
     */
    getModelAttribsForTable() {
        const attribs_maps_key = common_1.EEntTypeStr[common_1.EEntType.MOD];
        const attribs = this._attribs_maps[attribs_maps_key];
        if (attribs === undefined) {
            return [];
        }
        const arr = [];
        attribs.forEach((value, key) => {
            // const _value = isString(value) ? `'${value}'` : value;
            const _value = value;
            const obj = { Name: key, Value: _value };
            arr.push(obj);
        });
        // console.log(arr);
        return arr;
    }
    /**
     *
     * @param ent_type
     */
    getAttribsForTable(ent_type) {
        // get the attribs map for this ent type
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        // create a map of objects to store the data
        const data_obj_map = new Map();
        // create the ID for each table row
        const ents_i = this._model.geom.query.getEnts(ent_type, false);
        let i = 0;
        for (const ent_i of ents_i) {
            data_obj_map.set(ent_i, { '#': i, _id: `${attribs_maps_key}${ent_i}` });
            i++;
        }
        // loop through all the attributes
        attribs.forEach((attrib, attrib_name) => {
            const data_size = attrib.getDataSize();
            for (const ent_i of ents_i) {
                if (attrib_name.substr(0, 1) === '_') {
                    const attrib_value = attrib.getEntVal(ent_i);
                    data_obj_map.get(ent_i)[`${attrib_name}`] = attrib_value;
                }
                else {
                    const attrib_value = attrib.getEntVal(ent_i);
                    if (data_size > 1) {
                        if (attrib_value !== undefined) {
                            attrib_value.forEach((v, idx) => {
                                const _v = v;
                                data_obj_map.get(ent_i)[`${attrib_name}[${idx}]`] = _v;
                            });
                        }
                        else {
                            for (let idx = 0; idx < data_size; idx++) {
                                data_obj_map.get(ent_i)[`${attrib_name}[${idx}]`] = undefined;
                            }
                        }
                    }
                    else {
                        const _attrib_value = util_1.isString(attrib_value) ? `'${attrib_value}'` : attrib_value;
                        data_obj_map.get(ent_i)[`${attrib_name}`] = _attrib_value;
                    }
                }
            }
        });
        return Array.from(data_obj_map.values());
    }
    /**
     * @param ent_type
     * @param ents_i
     */
    getEntsVals(selected_ents, ent_type) {
        const attribs_maps_key = common_1.EEntTypeStr[ent_type];
        const attribs = this._attribs_maps[attribs_maps_key];
        const data_obj_map = new Map();
        if (!selected_ents || selected_ents === undefined) {
            return [];
        }
        let i = 0;
        const selected_ents_sorted = maps_1.sortByKey(selected_ents);
        selected_ents_sorted.forEach(ent => {
            data_obj_map.set(ent, { '#': i, _id: `${attribs_maps_key}${ent}` });
            i++;
        });
        attribs.forEach((attrib, attrib_name) => {
            const data_size = attrib.getDataSize();
            for (const ent_i of Array.from(selected_ents.values())) {
                if (attrib_name.substr(0, 1) === '_') {
                    const attrib_value = attrib.getEntVal(ent_i);
                    data_obj_map.get(ent_i)[`${attrib_name}`] = attrib_value;
                }
                else {
                    const attrib_value = attrib.getEntVal(ent_i);
                    if (data_size > 1) {
                        if (attrib_value !== undefined) {
                            attrib_value.forEach((v, idx) => {
                                data_obj_map.get(ent_i)[`${attrib_name}[${idx}]`] = v;
                            });
                        }
                        else {
                            for (let idx = 0; idx < data_size; idx++) {
                                data_obj_map.get(ent_i)[`${attrib_name}[${idx}]`] = undefined;
                            }
                        }
                    }
                    else {
                        const _attrib_value = util_1.isString(attrib_value) ? `'${attrib_value}'` : attrib_value;
                        data_obj_map.get(ent_i)[`${attrib_name}`] = _attrib_value;
                    }
                }
            }
        });
        return Array.from(data_obj_map.values());
    }
    getIdIndex(ent_type, id) {
        const ents_i = this._model.geom.query.getEnts(ent_type, false);
        const index = ents_i.findIndex(ent_i => ent_i === id);
        return index;
    }
}
exports.GIAttribsThreejs = GIAttribsThreejs;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lBdHRyaWJzVGhyZWVqcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWJzL2dlby1pbmZvL0dJQXR0cmlic1RocmVlanMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxxQ0FBK0Y7QUFFL0YsK0JBQWdDO0FBQ2hDLHVDQUF5QztBQUV6Qzs7R0FFRztBQUNILE1BQWEsZ0JBQWdCO0lBRzFCOzs7UUFHSTtJQUNILFlBQVksS0FBYyxFQUFFLFlBQTBCO1FBQ2xELElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDO0lBQ3RDLENBQUM7SUFDRCwrRUFBK0U7SUFDL0UsVUFBVTtJQUNWLDBFQUEwRTtJQUMxRSxpQ0FBaUM7SUFDakMsK0VBQStFO0lBQy9FOzs7O09BSUc7SUFDSSxvQkFBb0I7UUFDdkIsTUFBTSxhQUFhLEdBQWdCLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxxQkFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xGLEVBQUU7UUFDRixNQUFNLE1BQU0sR0FBZSxFQUFFLENBQUM7UUFDOUIsTUFBTSxRQUFRLEdBQXdCLElBQUksR0FBRyxFQUFFLENBQUM7UUFDaEQsTUFBTSxPQUFPLEdBQWEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM5RSxPQUFPLENBQUMsT0FBTyxDQUFFLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxFQUFFO1lBQ2xDLElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtnQkFDakIsTUFBTSxTQUFTLEdBQVcsTUFBTSxDQUFDLElBQUksQ0FBRSxhQUFhLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBYSxDQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUN6RixRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQzthQUNyQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0gsYUFBYTtRQUNiLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFDRDs7OztPQUlHO0lBQ0ksb0JBQW9CO1FBQ3ZCLE1BQU0sYUFBYSxHQUFnQixJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMscUJBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsRixFQUFFO1FBQ0YsTUFBTSxNQUFNLEdBQWUsRUFBRSxDQUFDO1FBQzlCLE1BQU0sVUFBVSxHQUF3QixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ2xELE1BQU0sT0FBTyxHQUFhLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDOUUsT0FBTyxDQUFDLE9BQU8sQ0FBRSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsRUFBRTtZQUNsQyxJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7Z0JBQ2pCLE1BQU0sTUFBTSxHQUFXLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sU0FBUyxHQUFXLE1BQU0sQ0FBQyxJQUFJLENBQUUsYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQWEsQ0FBRSxHQUFHLENBQUMsQ0FBQztnQkFDekYsVUFBVSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7YUFDdkM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUNILGFBQWE7UUFDYixPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBQ0Q7Ozs7T0FJRztJQUNJLG9CQUFvQixDQUFDLFdBQXlCO1FBQ2pELElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFBRSxPQUFPLElBQUksQ0FBQztTQUFFO1FBQzdELE1BQU0sWUFBWSxHQUFnQixJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDekUsRUFBRTtRQUNGLE1BQU0sb0JBQW9CLEdBQXVCLEVBQUUsQ0FBQztRQUNwRCxNQUFNLE9BQU8sR0FBYSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGlCQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzlFLE9BQU8sQ0FBQyxPQUFPLENBQUUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLEVBQUU7WUFDbEMsSUFBSSxNQUFNLEtBQUssSUFBSSxFQUFFO2dCQUNqQixNQUFNLEtBQUssR0FBRyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBcUIsQ0FBQztnQkFDakUsSUFBSSxXQUFXLEtBQUsscUJBQVksQ0FBQyxNQUFNLEVBQUU7b0JBQ3JDLE1BQU0sTUFBTSxHQUFHLEtBQUssS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO29CQUN2RCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7aUJBQ3JDO3FCQUFNO29CQUNILG9CQUFvQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztpQkFDcEM7YUFDSjtRQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0gsYUFBYTtRQUNiLE9BQU8sb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFDRDs7T0FFRztJQUNJLHVCQUF1QjtRQUMxQixNQUFNLGdCQUFnQixHQUFXLG9CQUFXLENBQUUsaUJBQVEsQ0FBQyxHQUFHLENBQUUsQ0FBQztRQUM3RCxNQUFNLE9BQU8sR0FBa0MsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3BGLElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRTtZQUFFLE9BQU8sRUFBRSxDQUFDO1NBQUU7UUFDekMsTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUMzQix5REFBeUQ7WUFDekQsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLE1BQU0sR0FBRyxHQUFHLEVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFDLENBQUM7WUFDdkMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsQixDQUFDLENBQUMsQ0FBQztRQUNILG9CQUFvQjtRQUNwQixPQUFPLEdBQUcsQ0FBQztJQUNmLENBQUM7SUFDRDs7O09BR0c7SUFDSSxrQkFBa0IsQ0FBQyxRQUFrQjtRQUN4Qyx3Q0FBd0M7UUFDeEMsTUFBTSxnQkFBZ0IsR0FBVyxvQkFBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sT0FBTyxHQUE2QixJQUFJLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDL0UsNENBQTRDO1FBQzVDLE1BQU0sWUFBWSxHQUErQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQzNFLG1DQUFtQztRQUNuQyxNQUFNLE1BQU0sR0FBYSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6RSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sRUFBRTtZQUN4QixZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsZ0JBQWdCLEdBQUcsS0FBSyxFQUFFLEVBQUMsQ0FBRSxDQUFDO1lBQ3hFLENBQUMsRUFBRSxDQUFDO1NBQ1A7UUFDRCxrQ0FBa0M7UUFDbEMsT0FBTyxDQUFDLE9BQU8sQ0FBRSxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsRUFBRTtZQUNyQyxNQUFNLFNBQVMsR0FBVyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDL0MsS0FBSyxNQUFNLEtBQUssSUFBSSxNQUFNLEVBQUU7Z0JBQ3hCLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO29CQUNsQyxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUM3QyxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsV0FBVyxFQUFFLENBQUMsR0FBRyxZQUFZLENBQUM7aUJBQzVEO3FCQUFNO29CQUNILE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzdDLElBQUssU0FBUyxHQUFHLENBQUMsRUFBRzt3QkFDakIsSUFBSSxZQUFZLEtBQUssU0FBUyxFQUFFOzRCQUMzQixZQUFzQixDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRTtnQ0FDeEMsTUFBTSxFQUFFLEdBQUksQ0FBQyxDQUFDO2dDQUNkLFlBQVksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxXQUFXLElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7NEJBQzNELENBQUMsQ0FBQyxDQUFDO3lCQUNOOzZCQUFNOzRCQUNILEtBQUssSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxTQUFTLEVBQUUsR0FBRyxFQUFFLEVBQUU7Z0NBQ3RDLFlBQVksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxXQUFXLElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxTQUFTLENBQUM7NkJBQ2pFO3lCQUNKO3FCQUNKO3lCQUFNO3dCQUNILE1BQU0sYUFBYSxHQUFHLGVBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO3dCQUNsRixZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsV0FBVyxFQUFFLENBQUMsR0FBRyxhQUFhLENBQUM7cUJBQzdEO2lCQUNKO2FBQ0o7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUNILE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0ksV0FBVyxDQUFDLGFBQWtDLEVBQUUsUUFBa0I7UUFDckUsTUFBTSxnQkFBZ0IsR0FBVyxvQkFBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sT0FBTyxHQUE2QixJQUFJLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDL0UsTUFBTSxZQUFZLEdBQStDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDM0UsSUFBSSxDQUFDLGFBQWEsSUFBSSxhQUFhLEtBQUssU0FBUyxFQUFFO1lBQy9DLE9BQU8sRUFBRSxDQUFDO1NBQ2I7UUFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixNQUFNLG9CQUFvQixHQUFHLGdCQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDdEQsb0JBQW9CLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQy9CLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxnQkFBZ0IsR0FBRyxHQUFHLEVBQUUsRUFBRSxDQUFFLENBQUM7WUFDckUsQ0FBQyxFQUFFLENBQUM7UUFDUixDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxPQUFPLENBQUUsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLEVBQUU7WUFDckMsTUFBTSxTQUFTLEdBQVcsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQy9DLEtBQUssTUFBTSxLQUFLLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRTtnQkFDcEQsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7b0JBQ2xDLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzdDLFlBQVksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxXQUFXLEVBQUUsQ0FBQyxHQUFHLFlBQVksQ0FBQztpQkFDNUQ7cUJBQU07b0JBQ0gsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDN0MsSUFBSyxTQUFTLEdBQUcsQ0FBQyxFQUFHO3dCQUNqQixJQUFJLFlBQVksS0FBSyxTQUFTLEVBQUU7NEJBQzNCLFlBQXNCLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFO2dDQUN4QyxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsV0FBVyxJQUFJLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDOzRCQUMxRCxDQUFDLENBQUMsQ0FBQzt5QkFDTjs2QkFBTTs0QkFDSCxLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsU0FBUyxFQUFFLEdBQUcsRUFBRSxFQUFFO2dDQUN0QyxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsV0FBVyxJQUFJLEdBQUcsR0FBRyxDQUFDLEdBQUcsU0FBUyxDQUFDOzZCQUNqRTt5QkFDSjtxQkFDSjt5QkFBTTt3QkFDSCxNQUFNLGFBQWEsR0FBRyxlQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQzt3QkFDbEYsWUFBWSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLFdBQVcsRUFBRSxDQUFDLEdBQUcsYUFBYSxDQUFDO3FCQUM3RDtpQkFDSjthQUNKO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVNLFVBQVUsQ0FBQyxRQUFrQixFQUFFLEVBQVU7UUFDNUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDL0QsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssS0FBSyxFQUFFLENBQUMsQ0FBQztRQUN0RCxPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0NBQ0o7QUFyTUQsNENBcU1DIn0=