"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Class for geometry.
 */
class GIGeomIO {
    /**
     * Creates an object to store the geometry data.
     * @param geom_data The JSON data
     */
    constructor(geom, geom_arrays) {
        this._geom = geom;
        this._geom_arrays = geom_arrays;
    }
    /**
     * Adds data to this model from another model.
     * The existing data in the model is not deleted.
     * Both models may have deleted items, resulting in null values.
     * @param geom_arrays The geom_arrays of the other model.
     */
    merge(geom_arrays) {
        // get lengths of existing entities before we start adding stuff
        // const num_posis: number = this._geom_arrays.num_posis;
        const num_posis = this._geom_arrays.up_posis_verts.length;
        const num_verts = this._geom_arrays.dn_verts_posis.length;
        const num_tris = this._geom_arrays.dn_tris_verts.length;
        const num_edges = this._geom_arrays.dn_edges_verts.length;
        const num_wires = this._geom_arrays.dn_wires_edges.length;
        const num_faces = this._geom_arrays.dn_faces_wirestris.length;
        const num_points = this._geom_arrays.dn_points_verts.length;
        const num_plines = this._geom_arrays.dn_plines_wires.length;
        const num_pgons = this._geom_arrays.dn_pgons_faces.length;
        const num_colls = this._geom_arrays.dn_colls_objs.length;
        // for the down arrays, it is important the values are never undefined
        // undefined cannot be exported as json
        // if anything is deleted, then the value should be null
        // add vertices to model
        for (const posi_i of geom_arrays.dn_verts_posis) {
            if (posi_i === null) {
                this._geom_arrays.dn_verts_posis.push(null);
            }
            else {
                const new_vert = posi_i + num_posis;
                this._geom_arrays.dn_verts_posis.push(new_vert);
            }
        }
        // add triangles to model
        for (const verts_i of geom_arrays.dn_tris_verts) {
            if (verts_i === null) {
                this._geom_arrays.dn_tris_verts.push(null);
            }
            else {
                const new_triangle = verts_i.map(v => v + num_verts);
                this._geom_arrays.dn_tris_verts.push(new_triangle);
            }
        }
        // add edges to model
        for (const verts_i of geom_arrays.dn_edges_verts) {
            if (verts_i === null) {
                this._geom_arrays.dn_edges_verts.push(null);
            }
            else {
                const new_edge = verts_i.map(v => v + num_verts);
                this._geom_arrays.dn_edges_verts.push(new_edge);
            }
        }
        // add wires to model
        for (const edges_i of geom_arrays.dn_wires_edges) {
            if (edges_i === null) {
                this._geom_arrays.dn_wires_edges.push(null);
            }
            else {
                const new_wire = edges_i.map(e => e + num_edges);
                this._geom_arrays.dn_wires_edges.push(new_wire);
            }
        }
        // add faces to model
        for (const wires_tris_i of geom_arrays.dn_faces_wirestris) {
            if (wires_tris_i === null) {
                this._geom_arrays.dn_faces_wirestris.push(null);
            }
            else {
                const new_face = [
                    wires_tris_i[0].map(w => w + num_wires),
                    wires_tris_i[1].map(t => t + num_tris)
                ];
                this._geom_arrays.dn_faces_wirestris.push(new_face);
            }
        }
        // add points to model
        for (const vert_i of geom_arrays.dn_points_verts) {
            if (vert_i === null) {
                this._geom_arrays.dn_points_verts.push(null);
            }
            else {
                const new_point = vert_i + num_verts;
                this._geom_arrays.dn_points_verts.push(new_point);
            }
        }
        // add plines to model
        for (const wire_i of geom_arrays.dn_plines_wires) {
            if (wire_i === null) {
                this._geom_arrays.dn_plines_wires.push(null);
            }
            else {
                const new_pline = wire_i + num_wires;
                this._geom_arrays.dn_plines_wires.push(new_pline);
            }
        }
        // add pgons to model
        for (const face_i of geom_arrays.dn_pgons_faces) {
            if (face_i === null) {
                this._geom_arrays.dn_pgons_faces.push(null);
            }
            else {
                const new_pgon = face_i + num_faces;
                this._geom_arrays.dn_pgons_faces.push(new_pgon);
            }
        }
        // add collections to model
        for (const coll of geom_arrays.dn_colls_objs) {
            if (coll === null) {
                this._geom_arrays.dn_colls_objs.push(null);
            }
            else {
                const parent = (coll[0] === -1) ? -1 : coll[0] + num_colls;
                const coll_points_i = coll[1].map(point => point + num_points);
                const coll_plines_i = coll[2].map(line => line + num_plines);
                const coll_pgons_i = coll[3].map(pgon => pgon + num_pgons);
                const new_coll = [parent, coll_points_i, coll_plines_i, coll_pgons_i];
                this._geom_arrays.dn_colls_objs.push(new_coll);
            }
        }
        // update reverse arrays
        // undefined = no value
        // in typescript, undefined behaves in strange ways, try this
        //     const x = [0, undefined, 2, , 4];
        //     for (const i of x) { console.log("i in for loop:", i);}
        //     x.forEach(i => console.log("i in foreach loop:", i) );
        // for the undefined values, explicitly setting the value to undefined is not the same as not setting it at all
        // with a foreach loop, if there is no value, then it skips it completley
        // in this case, we want to make sure there is no value
        // update posis to verts (they can be null or [])
        let pv_i = 0;
        const pv_i_max = geom_arrays.up_posis_verts.length;
        for (; pv_i < pv_i_max; pv_i++) {
            const verts_i = geom_arrays.up_posis_verts[pv_i];
            if (verts_i === undefined) {
                continue;
            }
            else if (verts_i === null) {
                this._geom_arrays.up_posis_verts[pv_i + num_posis] = null;
            }
            else {
                const new_verts_i = verts_i.map(vert_i => vert_i + num_verts);
                this._geom_arrays.up_posis_verts[pv_i + num_posis] = new_verts_i;
            }
        }
        // update verts to tris
        let vt_i = 0;
        const vt_i_max = geom_arrays.up_verts_tris.length;
        for (; vt_i < vt_i_max; vt_i++) {
            const tris_i = geom_arrays.up_verts_tris[vt_i];
            if (tris_i === undefined) {
                continue;
            }
            else if (tris_i === null) {
                this._geom_arrays.up_verts_tris[vt_i + num_verts] = null;
            }
            else {
                const new_tris_i = tris_i.map(tri_i => tri_i + num_tris);
                this._geom_arrays.up_verts_tris[vt_i + num_verts] = new_tris_i;
            }
        }
        // update tris to faces
        let tf_i = 0;
        const tf_i_max = geom_arrays.up_tris_faces.length;
        for (; tf_i < tf_i_max; tf_i++) {
            const face_i = geom_arrays.up_tris_faces[tf_i];
            if (face_i === undefined) {
                continue;
            }
            else if (face_i === null) {
                this._geom_arrays.up_tris_faces[tf_i + num_tris] = null;
            }
            else {
                const new_face_i = face_i + num_faces;
                this._geom_arrays.up_tris_faces[tf_i + num_tris] = new_face_i;
            }
        }
        // update verts to edges
        let ve_i = 0;
        const ve_i_max = geom_arrays.up_verts_edges.length;
        for (; ve_i < ve_i_max; ve_i++) {
            const edges_i = geom_arrays.up_verts_edges[ve_i];
            if (edges_i === undefined) {
                continue;
            }
            else if (edges_i === null) {
                this._geom_arrays.up_verts_edges[ve_i + num_verts] = null;
            }
            else {
                const new_edges_i = edges_i.map(edge_i => edge_i + num_edges);
                this._geom_arrays.up_verts_edges[ve_i + num_verts] = new_edges_i;
            }
        }
        // update edges to wires
        let ew_i = 0;
        const ew_i_max = geom_arrays.up_edges_wires.length;
        for (; ew_i < ew_i_max; ew_i++) {
            const wire_i = geom_arrays.up_edges_wires[ew_i];
            if (wire_i === undefined) {
                continue;
            }
            else if (wire_i === null) {
                this._geom_arrays.up_edges_wires[ew_i + num_edges] = null;
            }
            else {
                const new_wire_i = wire_i + num_wires;
                this._geom_arrays.up_edges_wires[ew_i + num_edges] = new_wire_i;
            }
        }
        // update wires to faces
        let wf_i = 0;
        const wf_i_max = geom_arrays.up_wires_faces.length;
        for (; wf_i < wf_i_max; wf_i++) {
            const face_i = geom_arrays.up_wires_faces[wf_i];
            if (face_i === undefined) {
                continue;
            }
            else if (face_i === null) {
                this._geom_arrays.up_wires_faces[wf_i + num_wires] = null;
            }
            else {
                const new_face_i = face_i + num_faces;
                this._geom_arrays.up_wires_faces[wf_i + num_wires] = new_face_i;
            }
        }
        // update verts to points
        let vp_i = 0;
        const vp_i_max = geom_arrays.up_verts_points.length;
        for (; vp_i < vp_i_max; vp_i++) {
            const point_i = geom_arrays.up_verts_points[vp_i];
            if (point_i === undefined) {
                continue;
            }
            else if (point_i === null) {
                this._geom_arrays.up_verts_points[vp_i + num_points] = null;
            }
            else {
                const new_point_i = point_i + num_points;
                this._geom_arrays.up_verts_points[vp_i + num_points] = new_point_i;
            }
        }
        // update wires to plines
        let wp_i = 0;
        const wp_i_max = geom_arrays.up_wires_plines.length;
        for (; wp_i < wp_i_max; wp_i++) {
            const pline_i = geom_arrays.up_wires_plines[wp_i];
            if (pline_i === undefined) {
                continue;
            }
            else if (pline_i === null) {
                this._geom_arrays.up_wires_plines[wp_i + num_wires] = null;
            }
            else {
                const new_pline_i = pline_i + num_plines;
                this._geom_arrays.up_wires_plines[wp_i + num_wires] = new_pline_i;
            }
        }
        // update faces to pgons
        let fp_i = 0;
        const fp_i_max = geom_arrays.up_faces_pgons.length;
        for (; fp_i < fp_i_max; fp_i++) {
            const pgon_i = geom_arrays.up_faces_pgons[fp_i];
            if (pgon_i === undefined) {
                continue;
            }
            else if (pgon_i === null) {
                this._geom_arrays.up_faces_pgons[fp_i + num_faces] = null;
            }
            else {
                const new_pgon_i = pgon_i + num_pgons;
                this._geom_arrays.up_faces_pgons[fp_i + num_faces] = new_pgon_i;
            }
        }
        // update points to colls
        let poc_i = 0;
        const poc_i_max = geom_arrays.up_points_colls.length;
        for (; poc_i < poc_i_max; poc_i++) {
            const colls_i = geom_arrays.up_points_colls[poc_i];
            if (colls_i === undefined) {
                continue;
            }
            else if (colls_i === null) {
                this._geom_arrays.up_points_colls[poc_i + num_points] = null;
            }
            else {
                const new_colls_i = colls_i.map(coll_i => coll_i + num_colls);
                this._geom_arrays.up_points_colls[poc_i + num_points] = new_colls_i;
            }
        }
        // update plines to colls
        let plc_i = 0;
        const plc_i_max = geom_arrays.up_plines_colls.length;
        for (; plc_i < plc_i_max; plc_i++) {
            const colls_i = geom_arrays.up_plines_colls[plc_i];
            if (colls_i === undefined) {
                continue;
            }
            else if (colls_i === null) {
                this._geom_arrays.up_plines_colls[plc_i + num_plines] = null;
            }
            else {
                const new_colls_i = colls_i.map(coll_i => coll_i + num_colls);
                this._geom_arrays.up_plines_colls[plc_i + num_plines] = new_colls_i;
            }
        }
        // update pgons to colls
        let pgc_i = 0;
        const pgc_i_max = geom_arrays.up_pgons_colls.length;
        for (; pgc_i < pgc_i_max; pgc_i++) {
            const colls_i = geom_arrays.up_pgons_colls[pgc_i];
            if (colls_i === undefined) {
                continue;
            }
            else if (colls_i === null) {
                this._geom_arrays.up_pgons_colls[pgc_i + num_pgons] = null;
            }
            else {
                const new_colls_i = colls_i.map(coll_i => coll_i + num_colls);
                this._geom_arrays.up_pgons_colls[pgc_i + num_pgons] = new_colls_i;
            }
        }
    }
    /**
     * Sets the data in this model from JSON data.
     * The existing data in the model is deleted.
     * @param geom_data The JSON data
     */
    setData(geom_data) {
        // update the down arrays
        // these are assumed never to undefined
        // add vertices to model
        this._geom_arrays.dn_verts_posis = geom_data.vertices;
        // add triangles to model
        this._geom_arrays.dn_tris_verts = geom_data.triangles;
        // add edges to model
        this._geom_arrays.dn_edges_verts = geom_data.edges;
        // add wires to model
        this._geom_arrays.dn_wires_edges = geom_data.wires;
        // add faces to model
        this._geom_arrays.dn_faces_wirestris = geom_data.faces;
        // add points to model
        this._geom_arrays.dn_points_verts = geom_data.points;
        // add lines to model
        this._geom_arrays.dn_plines_wires = geom_data.polylines;
        // add pgons to model
        this._geom_arrays.dn_pgons_faces = geom_data.polygons;
        // add collections to model
        this._geom_arrays.dn_colls_objs = geom_data.collections;
        // set selected
        this._geom.selected = geom_data.selected;
        // update the up arrays
        // many of the values will be undefined
        // they could be null, since we might have saved some data with deleted ents
        // fill up_posis_verts with either null or empty arrays
        // the up_posis_verts array is special, it can have no undefine values
        // its length is used to determine how many posis there are in the model
        this._geom_arrays.up_posis_verts = [];
        let posi_i = 0;
        const posi_i_max = geom_data.num_positions;
        for (; posi_i < posi_i_max; posi_i++) {
            if (this._geom.model.attribs.query.getPosiCoords(posi_i) === undefined) {
                this._geom_arrays.up_posis_verts[posi_i] = null;
            }
            else {
                this._geom_arrays.up_posis_verts[posi_i] = [];
            }
        }
        // posis->verts
        this._geom_arrays.dn_verts_posis.forEach((_posi_i, vert_i) => {
            if (_posi_i !== null) {
                this._geom_arrays.up_posis_verts[_posi_i].push(vert_i);
            }
        });
        // verts->tris, one to many
        this._geom_arrays.up_verts_tris = [];
        this._geom_arrays.dn_tris_verts.forEach((vert_i_arr, tri_i) => {
            if (vert_i_arr !== null) {
                vert_i_arr.forEach(vert_i => {
                    if (this._geom_arrays.up_verts_tris[vert_i] === undefined) {
                        this._geom_arrays.up_verts_tris[vert_i] = [];
                    }
                    this._geom_arrays.up_verts_tris[vert_i].push(tri_i);
                });
            }
        });
        // verts->edges, one to two
        this._geom_arrays.up_verts_edges = [];
        this._geom_arrays.dn_edges_verts.forEach((vert_i_arr, edge_i) => {
            if (vert_i_arr !== null) {
                vert_i_arr.forEach(vert_i => {
                    if (this._geom_arrays.up_verts_edges[vert_i] === undefined) {
                        this._geom_arrays.up_verts_edges[vert_i] = [];
                    }
                    this._geom_arrays.up_verts_edges[vert_i].push(edge_i);
                });
            }
        });
        // edges->wires
        this._geom_arrays.up_edges_wires = [];
        this._geom_arrays.dn_wires_edges.forEach((edge_i_arr, wire_i) => {
            if (edge_i_arr !== null) {
                edge_i_arr.forEach(edge_i => {
                    this._geom_arrays.up_edges_wires[edge_i] = wire_i;
                });
            }
        });
        // wires->faces, tris->faces, faces->wirestris
        this._geom_arrays.up_wires_faces = [];
        this._geom_arrays.up_tris_faces = [];
        this._geom_arrays.dn_faces_wirestris.forEach((face, face_i) => {
            if (face !== null) {
                const [wire_i_arr, tri_i_arr] = face;
                wire_i_arr.forEach(wire_i => {
                    this._geom_arrays.up_wires_faces[wire_i] = face_i;
                });
                tri_i_arr.forEach(tri_i => {
                    this._geom_arrays.up_tris_faces[tri_i] = face_i;
                });
            }
        });
        // points, lines, polygons
        this._geom_arrays.up_verts_points = [];
        this._geom_arrays.dn_points_verts.forEach((vert_i, point_i) => {
            if (vert_i !== null) {
                this._geom_arrays.up_verts_points[vert_i] = point_i;
            }
        });
        this._geom_arrays.up_wires_plines = [];
        this._geom_arrays.dn_plines_wires.forEach((wire_i, line_i) => {
            if (wire_i !== null) {
                this._geom_arrays.up_wires_plines[wire_i] = line_i;
            }
        });
        this._geom_arrays.up_faces_pgons = [];
        this._geom_arrays.dn_pgons_faces.forEach((face_i, pgon_i) => {
            if (face_i !== null) {
                this._geom_arrays.up_faces_pgons[face_i] = pgon_i;
            }
        });
        // collections of points, polylines, polygons
        this._geom_arrays.up_points_colls = [];
        this._geom_arrays.up_plines_colls = [];
        this._geom_arrays.up_pgons_colls = [];
        this._geom_arrays.dn_colls_objs.forEach((coll, coll_i) => {
            if (coll !== null) {
                const [parent, point_i_arr, pline_i_arr, pgon_i_arr] = coll;
                point_i_arr.forEach(point_i => {
                    if (this._geom_arrays.up_points_colls[point_i] === undefined) {
                        this._geom_arrays.up_points_colls[point_i] = [coll_i];
                    }
                    else {
                        this._geom_arrays.up_points_colls[point_i].push(coll_i);
                    }
                });
                pline_i_arr.forEach(pline_i => {
                    if (this._geom_arrays.up_plines_colls[pline_i] === undefined) {
                        this._geom_arrays.up_plines_colls[pline_i] = [coll_i];
                    }
                    else {
                        this._geom_arrays.up_plines_colls[pline_i].push(coll_i);
                    }
                });
                pgon_i_arr.forEach(pgon_i => {
                    if (this._geom_arrays.up_pgons_colls[pgon_i] === undefined) {
                        this._geom_arrays.up_pgons_colls[pgon_i] = [coll_i];
                    }
                    else {
                        this._geom_arrays.up_pgons_colls[pgon_i].push(coll_i);
                    }
                });
            }
        });
        // return data
        return {
            posis_i: Array.from(Array(geom_data.num_positions).keys()),
            points_i: Array.from(Array(geom_data.points.length).keys()),
            plines_i: Array.from(Array(geom_data.polylines.length).keys()),
            pgons_i: Array.from(Array(geom_data.polygons.length).keys()),
            colls_i: Array.from(Array(geom_data.collections.length).keys()) // .map(v => v + num_old_colls)
        };
    }
    /**
     * Returns the JSON data for this model.
     */
    getData() {
        return {
            num_positions: this._geom_arrays.up_posis_verts.length,
            triangles: this._geom_arrays.dn_tris_verts,
            vertices: this._geom_arrays.dn_verts_posis,
            edges: this._geom_arrays.dn_edges_verts,
            wires: this._geom_arrays.dn_wires_edges,
            faces: this._geom_arrays.dn_faces_wirestris,
            points: this._geom_arrays.dn_points_verts,
            polylines: this._geom_arrays.dn_plines_wires,
            polygons: this._geom_arrays.dn_pgons_faces,
            collections: this._geom_arrays.dn_colls_objs,
            selected: this._geom.selected
        };
    }
}
exports.GIGeomIO = GIGeomIO;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lHZW9tSU8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlicy9nZW8taW5mby9HSUdlb21JTy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUlBOztHQUVHO0FBQ0gsTUFBYSxRQUFRO0lBR2pCOzs7T0FHRztJQUNILFlBQVksSUFBWSxFQUFFLFdBQXdCO1FBQzlDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDO0lBQ3BDLENBQUM7SUFDRDs7Ozs7T0FLRztJQUNJLEtBQUssQ0FBQyxXQUF3QjtRQUNqQyxnRUFBZ0U7UUFDaEUseURBQXlEO1FBQ3pELE1BQU0sU0FBUyxHQUFXLElBQUksQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQztRQUNsRSxNQUFNLFNBQVMsR0FBVyxJQUFJLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUM7UUFDbEUsTUFBTSxRQUFRLEdBQVcsSUFBSSxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDO1FBQ2hFLE1BQU0sU0FBUyxHQUFXLElBQUksQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQztRQUNsRSxNQUFNLFNBQVMsR0FBVyxJQUFJLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUM7UUFDbEUsTUFBTSxTQUFTLEdBQVcsSUFBSSxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUM7UUFDdEUsTUFBTSxVQUFVLEdBQVcsSUFBSSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDO1FBQ3BFLE1BQU0sVUFBVSxHQUFXLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQztRQUNwRSxNQUFNLFNBQVMsR0FBVyxJQUFJLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUM7UUFDbEUsTUFBTSxT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