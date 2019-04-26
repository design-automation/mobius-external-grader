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
        // arrays to store threejs data
        const tri_data_arrs = []; // tri_mat_indices, new_tri_verts_i, tri_i
        const mat_f = {
            specular: 0x000000,
            emissive: 0x000000,
            shininess: 0,
            side: THREE.FrontSide
        };
        const mat_b = {
            specular: 0x000000,
            emissive: 0x000000,
            shininess: 0,
            side: THREE.BackSide
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lHZW9tVGhyZWVqcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWJzL2dlby1pbmZvL0dJR2VvbVRocmVlanMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBR0EsNkNBQStCO0FBRS9COztHQUVHO0FBQ0gsTUFBYSxhQUFhO0lBR3RCOzs7O09BSUc7SUFDSCxZQUFZLElBQVksRUFBRSxXQUF3QjtRQUM5QyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztJQUNwQyxDQUFDO0lBQ0QsK0VBQStFO0lBQy9FLFVBQVU7SUFDVixzRUFBc0U7SUFDdEUsbUVBQW1FO0lBQ25FLGlCQUFpQjtJQUNqQiwrRUFBK0U7SUFDL0U7OztPQUdHO0lBQ0ksV0FBVztRQUNkLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUM7SUFDNUMsQ0FBQztJQUNEOzs7Ozs7T0FNRztJQUNJLFVBQVUsQ0FBQyxVQUErQjtRQUM3QywrQkFBK0I7UUFDL0IsTUFBTSxhQUFhLEdBQStCLEVBQUUsQ0FBQyxDQUFDLDBDQUEwQztRQUNoRyxNQUFNLEtBQUssR0FBVztZQUNsQixRQUFRLEVBQUUsUUFBUTtZQUNsQixRQUFRLEVBQUUsUUFBUTtZQUNsQixTQUFTLEVBQUUsQ0FBQztZQUNaLElBQUksRUFBRSxLQUFLLENBQUMsU0FBUztTQUN4QixDQUFDO1FBQ0YsTUFBTSxLQUFLLEdBQVc7WUFDbEIsUUFBUSxFQUFFLFFBQVE7WUFDbEIsUUFBUSxFQUFFLFFBQVE7WUFDbEIsU0FBUyxFQUFFLENBQUM7WUFDWixJQUFJLEVBQUUsS0FBSyxDQUFDLFFBQVE7U0FDdkIsQ0FBQztRQUNGLE1BQU0sU0FBUyxHQUFhLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBRSxLQUFLLENBQUUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFFLEtBQUssQ0FBRSxDQUFDLENBQUM7UUFD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