"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = __importStar(require("three"));
/**
 * Class for geometry.
 */
class GIGeomThreejs {
    /**
     * Creates an object to store the geometry data.
     * @param geom The GIGeom obect
     * @param geom_arrays The geometry arrays
     */
    constructor(geom, geom_arrays) {
        this._geom = geom;
        this._geom_arrays = geom_arrays;
    }
    // ============================================================================
    // ThreeJS
    // Get arrays for threejs, these retrun arrays of indexes to positions
    // For a method to get the array of positions, see the attrib class
    // getSeqCoords()
    // ============================================================================
    /**
     * Returns a flat list of all vertices.
     * The indices in the list point to the sequential coordinates.
     */
    get3jsVerts() {
        return this._geom_arrays.dn_verts_posis;
    }
    /**
     * Returns that data required for threejs triangles.
     * 0) the vertices, as a flat array
     * 1) the select map, that maps from the threejs tri indices to the gi model tri indices
     * 2) the materials array, which is an array of objects
     * 3) the material groups array, which is an array of [ start, count, mat_index ]
     */
    get3jsTris(vertex_map) {
        const settings = JSON.parse(localStorage.getItem('mpm_settings'));
        // arrays to store threejs data
        const tri_data_arrs = []; // tri_mat_indices, new_tri_verts_i, tri_i
        const mat_f = {
            specular: 0x000000,
            emissive: 0x000000,
            shininess: 0,
            side: THREE.FrontSide,
            wireframe: settings.wireframe.show
        };
        const mat_b = {
            specular: 0x000000,
            emissive: 0x000000,
            shininess: 0,
            side: THREE.BackSide,
            wireframe: settings.wireframe.show
        };
        const materials = [this._getMaterial(mat_f), this._getMaterial(mat_b)];
        const material_names = ['default_front', 'default_back'];
        // get the material attribute from polygons
        const material_attrib = this._geom.model.attribs._attribs_maps.pg.get('material');
        // loop through all tris
        let tri_i = 0;
        const tri_i_max = this._geom_arrays.dn_tris_verts.length;
        for (; tri_i < tri_i_max; tri_i++) {
            const tri_verts_i = this._geom_arrays.dn_tris_verts[tri_i];
            if (tri_verts_i !== null) {
                // get the verts, face and the polygon for this tri
                const new_tri_verts_i = tri_verts_i.map(v => vertex_map.get(v));
                // get the materials for this tri from the polygon
                const tri_face_i = this._geom_arrays.up_tris_faces[tri_i];
                const tri_pgon_i = this._geom_arrays.up_faces_pgons[tri_face_i];
                const tri_mat_indices = [];
                if (material_attrib !== undefined) {
                    const mat_attrib_val = material_attrib.getEntVal(tri_pgon_i);
                    const pgon_mat_names = (Array.isArray(mat_attrib_val)) ? mat_attrib_val : [mat_attrib_val];
                    for (const pgon_mat_name of pgon_mat_names) {
                        let pgon_mat_index = material_names.indexOf(pgon_mat_name);
                        if (pgon_mat_index === -1) {
                            const mat = this._geom.model.attribs._attribs_maps.mo.get(pgon_mat_name);
                            if (mat !== undefined) {
                                pgon_mat_index = materials.length;
                                material_names.push(pgon_mat_name);
                                const mat_settings_obj = JSON.parse(mat);
                                materials.push(this._getMaterial(mat_settings_obj));
                            }
                        }
                        if (pgon_mat_index !== -1) {
                            tri_mat_indices.push(pgon_mat_index);
                        }
                    }
                }
                if (tri_mat_indices.length === 0) {
                    tri_mat_indices.push(0); // default material front
                    tri_mat_indices.push(1); // default material back
                }
                // add the data to the data_array
                tri_data_arrs.push([tri_mat_indices, new_tri_verts_i, tri_i]);
            }
        }
        // sort that data_array, so that we get triangls sorted according to their materials
        // for each entry in the data_array, the first item is the material indices, so that they are sorted correctly
        tri_data_arrs.sort();
        // loop through the sorted array and create the tris and groups data for threejs
        const tris_verts_i = [];
        const tri_select_map = new Map();
        const mat_groups_map = new Map(); // mat_index -> [start, end][]
        for (const tri_data_arr of tri_data_arrs) {
            // save the tri data
            const tjs_i = tris_verts_i.push(tri_data_arr[1]) - 1;
            tri_select_map.set(tjs_i, tri_data_arr[2]);
            // go through all materials for this tri and add save the mat groups data
            for (const mat_index of tri_data_arr[0]) {
                let start_end_arrs = mat_groups_map.get(mat_index);
                if (start_end_arrs === undefined) {
                    start_end_arrs = [[tjs_i, tjs_i]];
                    mat_groups_map.set(mat_index, start_end_arrs);
                }
                else {
                    const start_end = start_end_arrs[start_end_arrs.length - 1];
                    if (tjs_i === start_end[1] + 1) {
                        start_end[1] = tjs_i;
                    }
                    else {
                        start_end_arrs.push([tjs_i, tjs_i]);
                    }
                }
            }
        }
        // convert the mat_groups_map into the format required for threejs
        // for each material group, we need an array [start, count, mat_index]
        const material_groups = []; // [start, count, mat_index][]
        mat_groups_map.forEach((start_end_arrs, mat_index) => {
            for (const start_end of start_end_arrs) {
                const start = start_end[0];
                const count = start_end[1] - start_end[0] + 1;
                material_groups.push([start * 3, count * 3, mat_index]);
            }
        });
        // convert the verts list to a flat array
        // tslint:disable-next-line:no-unused-expression
        // @ts-ignore
        const tris_verts_i_flat = tris_verts_i.flat(1);
        // return the data
        // there are four sets of data that are returns
        return [
            tris_verts_i_flat,
            tri_select_map,
            materials,
            material_groups // 3) the material groups array, which is an array of [ start, count, mat_index ]
        ];
        // let gi_i = 0;
        // const l = this._geom_arrays.dn_tris_verts.length;
        // for (; gi_i < l; gi_i++) {
        //     const tri_verts_i: TTri = this._geom_arrays.dn_tris_verts[gi_i];
        //     if (tri_verts_i !== null) {
        //         const new_tri_verts_i: TTri = tri_verts_i.map(v => vertex_map.get(v)) as TTri;
        //         const tjs_i = tris_verts_i_filt.push(new_tri_verts_i) - 1;
        //         tri_select_map.set(tjs_i, gi_i);
        //     }
        // }
        // @ts-ignore
        // return [tris_verts_i.flat(1), tri_select_map];
        // return this._geom_arrays.dn_tris_verts.flat(1);
        // return [].concat(...this._geom_arrays.dn_tris_verts);
    }
    /**
     * Returns a flat list of the sequence of verices for all the edges.
     * This list will be assumed to be in pairs.
     * The indices in the list point to the vertices.
     */
    get3jsEdges(vertex_map) {
        const edges_verts_i_filt = [];
        const edge_select_map = new Map();
        let gi_i = 0;
        const l = this._geom_arrays.dn_edges_verts.length;
        for (; gi_i < l; gi_i++) {
            const edge_verts_i = this._geom_arrays.dn_edges_verts[gi_i];
            if (edge_verts_i !== null) {
                const new_edge_verts_i = edge_verts_i.map(e => vertex_map.get(e));
                const tjs_i = edges_verts_i_filt.push(new_edge_verts_i) - 1;
                edge_select_map.set(tjs_i, gi_i);
            }
        }
        // @ts-ignore
        return [edges_verts_i_filt.flat(1), edge_select_map];
        // @ts-ignore
        // return this._geom_arrays.dn_edges_verts.flat(1);
        // return [].concat(...this._geom_arrays.dn_edges_verts);
    }
    /**
     * Returns a flat list of the sequence of verices for all the points.
     * The indices in the list point to the vertices.
     */
    get3jsPoints(vertex_map) {
        const points_verts_i_filt = [];
        const point_select_map = new Map();
        let gi_i = 0;
        const l = this._geom_arrays.dn_points_verts.length;
        for (; gi_i < l; gi_i++) {
            const point_verts_i = this._geom_arrays.dn_points_verts[gi_i];
            if (point_verts_i !== null) {
                const new_point_verts_i = vertex_map.get(point_verts_i);
                const tjs_i = points_verts_i_filt.push(new_point_verts_i) - 1;
                point_select_map.set(tjs_i, gi_i);
            }
        }
        return [points_verts_i_filt, point_select_map];
        // return this._geom_arrays.dn_points_verts;
    }
    /**
     * Create a threejs material
     * @param settings
     */
    _getMaterial(settings) {
        const material = {
            type: 'MeshPhongMaterial',
            side: THREE.DoubleSide,
            vertexColors: THREE.VertexColors
        };
        if (settings) {
            for (const key of Object.keys(settings)) {
                material[key] = settings[key];
            }
        }
        return material;
    }
}
exports.GIGeomThreejs = GIGeomThreejs;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lHZW9tVGhyZWVqcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWJzL2dlby1pbmZvL0dJR2VvbVRocmVlanMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBR0EsNkNBQStCO0FBRS9COztHQUVHO0FBQ0gsTUFBYSxhQUFhO0lBR3RCOzs7O09BSUc7SUFDSCxZQUFZLElBQVksRUFBRSxXQUF3QjtRQUM5QyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztJQUNwQyxDQUFDO0lBQ0QsK0VBQStFO0lBQy9FLFVBQVU7SUFDVixzRUFBc0U7SUFDdEUsbUVBQW1FO0lBQ25FLGlCQUFpQjtJQUNqQiwrRUFBK0U7SUFDL0U7OztPQUdHO0lBQ0ksV0FBVztRQUNkLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUM7SUFDNUMsQ0FBQztJQUNEOzs7Ozs7T0FNRztJQUNJLFVBQVUsQ0FBQyxVQUErQjtRQUM3QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUNsRSwrQkFBK0I7UUFDL0IsTUFBTSxhQUFhLEdBQStCLEVBQUUsQ0FBQyxDQUFDLDBDQUEwQztRQUNoRyxNQUFNLEtBQUssR0FBVztZQUNsQixRQUFRLEVBQUUsUUFBUTtZQUNsQixRQUFRLEVBQUUsUUFBUTtZQUNsQixTQUFTLEVBQUUsQ0FBQztZQUNaLElBQUksRUFBRSxLQUFLLENBQUMsU0FBUztZQUNyQixTQUFTLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJO1NBQ3JDLENBQUM7UUFDRixNQUFNLEtBQUssR0FBVztZQUNsQixRQUFRLEVBQUUsUUFBUTtZQUNsQixRQUFRLEVBQUUsUUFBUTtZQUNsQixTQUFTLEVBQUUsQ0FBQztZQUNaLElBQUksRUFBRSxLQUFLLENBQUMsUUFBUTtZQUNwQixTQUFTLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJO1NBQ3JDLENBQUM7UUFDRixNQUFNLFNBQVMsR0FBYSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUUsS0FBSyxDQUFFLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBRSxLQUFLLENBQUUsQ0FBQyxDQUFDO1FBQ3JGLE1BQU0sY0FBYyxHQUFjLENBQUMsZUFBZSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3BFLDJDQUEyQztRQUMzQyxNQUFNLGVBQWUsR0FBZ0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQy9GLHdCQUF3QjtRQUN4QixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7UUFBQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7UUFDeEUsT0FBTyxLQUFLLEdBQUcsU0FBUyxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQy9CLE1BQU0sV0FBVyxHQUFhLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JFLElBQUksV0FBVyxLQUFLLElBQUksRUFBRTtnQkFDdEIsbURBQW1EO2dCQUNuRCxNQUFNLGVBQWUsR0FBUyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBUyxDQUFDO2dCQUM5RSxrREFBa0Q7Z0JBQ2xELE1BQU0sVUFBVSxHQUFXLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNsRSxNQUFNLFVBQVUsR0FBVyxJQUFJLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDeEUsTUFBTSxlQUFlLEdBQWEsRUFBRSxDQUFDO2dCQUNyQyxJQUFJLGVBQWUsS0FBSyxTQUFTLEVBQUU7b0JBQy9CLE1BQU0sY0FBYyxHQUFvQixlQUFlLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBb0IsQ0FBQztvQkFDakcsTUFBTSxjQUFjLEdBQWEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQztvQkFDckcsS0FBSyxNQUFNLGFBQWEsSUFBSSxjQUFjLEVBQUU7d0JBQ3hDLElBQUksY0FBYyxHQUFXLGNBQWMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7d0JBQ25FLElBQUksY0FBYyxLQUFLLENBQUMsQ0FBQyxFQUFFOzRCQUN2QixNQUFNLEdBQUcsR0FBVyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7NEJBQ2pGLElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRTtnQ0FDbkIsY0FBYyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7Z0NBQ2xDLGNBQWMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7Z0NBQ25DLE1BQU0sZ0JBQWdCLEdBQVcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztnQ0FDakQsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQzs2QkFDdkQ7eUJBQ0o7d0JBQ0QsSUFBSSxjQUFjLEtBQUssQ0FBQyxDQUFDLEVBQUU7NEJBQ3ZCLGVBQWUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7eUJBQ3hDO3FCQUNKO2lCQUNKO2dCQUNELElBQUksZUFBZSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7b0JBQzlCLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyx5QkFBeUI7b0JBQ2xELGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyx3QkFBd0I7aUJBQ3BEO2dCQUNELGlDQUFpQztnQkFDakMsYUFBYSxDQUFDLElBQUksQ0FBRSxDQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsS0FBSyxDQUFFLENBQUUsQ0FBQzthQUNyRTtTQUNKO1FBQ0Qsb0ZBQW9GO1FBQ3BGLDhHQUE4RztRQUM5RyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDckIsZ0ZBQWdGO1FBQ2hGLE1BQU0sWUFBWSxHQUFXLEVBQUUsQ0FBQztRQUNoQyxNQUFNLGNBQWMsR0FBd0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUN0RCxNQUFNLGNBQWMsR0FBb0MsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDLDhCQUE4QjtRQUNqRyxLQUFLLE1BQU0sWUFBWSxJQUFJLGFBQWEsRUFBRTtZQUN0QyxvQkFBb0I7WUFDcEIsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDckQsY0FBYyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0MseUVBQXlFO1lBQ3pFLEtBQUssTUFBTSxTQUFTLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNyQyxJQUFJLGNBQWMsR0FBdUIsY0FBYyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDdkUsSUFBSSxjQUFjLEtBQUssU0FBUyxFQUFFO29CQUM5QixjQUFjLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUNsQyxjQUFjLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsQ0FBQztpQkFDakQ7cUJBQU07b0JBQ0gsTUFBTSxTQUFTLEdBQXFCLGNBQWMsQ0FBQyxjQUFjLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUM5RSxJQUFJLEtBQUssS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFO3dCQUM1QixTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO3FCQUN4Qjt5QkFBTTt3QkFDSCxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7cUJBQ3ZDO2lCQUNKO2FBQ0o7U0FDSjtRQUNELGtFQUFrRTtRQUNsRSxzRUFBc0U7UUFDdEUsTUFBTSxlQUFlLEdBQStCLEVBQUUsQ0FBQyxDQUFDLDhCQUE4QjtRQUN0RixjQUFjLENBQUMsT0FBTyxDQUFFLENBQUMsY0FBYyxFQUFFLFNBQVMsRUFBRSxFQUFFO1lBQ2xELEtBQUssTUFBTSxTQUFTLElBQUksY0FBYyxFQUFFO2dCQUNwQyxNQUFNLEtBQUssR0FBVyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLE1BQU0sS0FBSyxHQUFXLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN0RCxlQUFlLENBQUMsSUFBSSxDQUFFLENBQUUsS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFLFNBQVMsQ0FBRSxDQUFFLENBQUM7YUFDL0Q7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUNILHlDQUF5QztRQUN6QyxnREFBZ0Q7UUFDaEQsYUFBYTtRQUNiLE1BQU0saUJBQWlCLEdBQWEsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6RCxrQkFBa0I7UUFDbEIsK0NBQStDO1FBQy9DLE9BQU87WUFDSCxpQkFBaUI7WUFDakIsY0FBYztZQUNkLFNBQVM7WUFDVCxlQUFlLENBQUksaUZBQWlGO1NBQ3ZHLENBQUM7UUFFRixnQkFBZ0I7UUFDaEIsb0RBQW9EO1FBQ3BELDZCQUE2QjtRQUM3Qix1RUFBdUU7UUFDdkUsa0NBQWtDO1FBQ2xDLHlGQUF5RjtRQUN6RixxRUFBcUU7UUFDckUsMkNBQTJDO1FBQzNDLFFBQVE7UUFDUixJQUFJO1FBQ0osYUFBYTtRQUNiLGlEQUFpRDtRQUNqRCxrREFBa0Q7UUFDbEQsd0RBQXdEO0lBQzVELENBQUM7SUFDRDs7OztPQUlHO0lBQ0ksV0FBVyxDQUFDLFVBQStCO1FBQzlDLE1BQU0sa0JBQWtCLEdBQVksRUFBRSxDQUFDO1FBQ3ZDLE1BQU0sZUFBZSxHQUF3QixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3ZELElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztRQUNiLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQztRQUNsRCxPQUFPLElBQUksR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUU7WUFDckIsTUFBTSxZQUFZLEdBQVUsSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkUsSUFBSSxZQUFZLEtBQUssSUFBSSxFQUFFO2dCQUN2QixNQUFNLGdCQUFnQixHQUFVLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFVLENBQUM7Z0JBQ2xGLE1BQU0sS0FBSyxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDNUQsZUFBZSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDcEM7U0FDSjtRQUNELGFBQWE7UUFDYixPQUFPLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBRXJELGFBQWE7UUFDYixtREFBbUQ7UUFDbkQseURBQXlEO0lBQzdELENBQUM7SUFDRDs7O09BR0c7SUFDSSxZQUFZLENBQUMsVUFBK0I7UUFDL0MsTUFBTSxtQkFBbUIsR0FBYSxFQUFFLENBQUM7UUFDekMsTUFBTSxnQkFBZ0IsR0FBd0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUN4RCxJQUFJLElBQUksR0FBRyxDQUFDLENBQUM7UUFDYixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUM7UUFDbkQsT0FBTyxJQUFJLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ3JCLE1BQU0sYUFBYSxHQUFXLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3RFLElBQUksYUFBYSxLQUFLLElBQUksRUFBRTtnQkFDeEIsTUFBTSxpQkFBaUIsR0FBVyxVQUFVLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBVyxDQUFDO2dCQUMxRSxNQUFNLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzlELGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDckM7U0FDSjtRQUNELE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQy9DLDRDQUE0QztJQUNoRCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0ssWUFBWSxDQUFDLFFBQWlCO1FBQ2xDLE1BQU0sUUFBUSxHQUFJO1lBQ2QsSUFBSSxFQUFFLG1CQUFtQjtZQUN6QixJQUFJLEVBQUUsS0FBSyxDQUFDLFVBQVU7WUFDdEIsWUFBWSxFQUFFLEtBQUssQ0FBQyxZQUFZO1NBQ25DLENBQUM7UUFDRixJQUFJLFFBQVEsRUFBRTtZQUNWLEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDckMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNqQztTQUNKO1FBQ0QsT0FBTyxRQUFRLENBQUM7SUFDcEIsQ0FBQztDQUNKO0FBNU5ELHNDQTROQyJ9