"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
const triangulate_1 = require("../triangulate/triangulate");
/**
 * Class for geometry.
 */
class GIGeomAdd {
    /**
     * Creates an object to store the geometry data.
     * @param geom_data The JSON data
     */
    constructor(geom, geom_arrays) {
        this._geom = geom;
        this._geom_arrays = geom_arrays;
    }
    // ============================================================================
    // Add geometry
    // ============================================================================
    /**
     * Adds a new position to the model and returns the index to that position.
     */
    addPosi() {
        // create posi
        const posi_i = this._addPosi();
        return posi_i;
    }
    /**
     * Adds a new point entity to the model.
     * @param posi_i The position for the point.
     */
    addPoint(posi_i) {
        // create vert
        const vert_i = this._addVertex(posi_i);
        // create point
        const point_i = this._geom_arrays.dn_points_verts.push(vert_i) - 1;
        this._geom_arrays.up_verts_points[vert_i] = point_i;
        return point_i;
    }
    /**
     * Adds a new pline entity to the model using numeric indices.
     * @param posis_i
     */
    addPline(posis_i, close = false) {
        // create verts, edges, wires
        const vert_i_arr = posis_i.map(posi_i => this._addVertex(posi_i));
        const edges_i_arr = [];
        for (let i = 0; i < vert_i_arr.length - 1; i++) {
            edges_i_arr.push(this._addEdge(vert_i_arr[i], vert_i_arr[i + 1]));
        }
        if (close) {
            edges_i_arr.push(this._addEdge(vert_i_arr[vert_i_arr.length - 1], vert_i_arr[0]));
        }
        const wire_i = this._addWire(edges_i_arr, close);
        // create pline
        const pline_i = this._geom_arrays.dn_plines_wires.push(wire_i) - 1;
        this._geom_arrays.up_wires_plines[wire_i] = pline_i;
        return pline_i;
    }
    /**
     * Adds a new polygon + hole entity to the model using numeric indices.
     * @param posis_id
     */
    addPgon(posis_i, holes_posis_i) {
        const has_holes = (holes_posis_i !== undefined) && (holes_posis_i.length) ? true : false;
        // create verts, edges, wire for face
        const vert_i_arr = posis_i.map(posi_i => this._addVertex(posi_i));
        const edges_i_arr = [];
        for (let i = 0; i < vert_i_arr.length - 1; i++) {
            edges_i_arr.push(this._addEdge(vert_i_arr[i], vert_i_arr[i + 1]));
        }
        edges_i_arr.push(this._addEdge(vert_i_arr[vert_i_arr.length - 1], vert_i_arr[0]));
        const wire_i = this._addWire(edges_i_arr, true);
        let face_i;
        if (has_holes) {
            // create verts, edges, wire for holes
            const holes_wires_i = [];
            for (const hole_posis_i of holes_posis_i) {
                const hole_vert_i_arr = hole_posis_i.map(posi_i => this._addVertex(posi_i));
                const hole_edges_i_arr = [];
                for (let i = 0; i < hole_vert_i_arr.length - 1; i++) {
                    hole_edges_i_arr.push(this._addEdge(hole_vert_i_arr[i], hole_vert_i_arr[i + 1]));
                }
                hole_edges_i_arr.push(this._addEdge(hole_vert_i_arr[hole_vert_i_arr.length - 1], hole_vert_i_arr[0]));
                const hole_wire_i = this._addWire(hole_edges_i_arr, true);
                holes_wires_i.push(hole_wire_i);
            }
            // create the new face with a hole
            face_i = this._addFaceWithHoles(wire_i, holes_wires_i);
        }
        else {
            face_i = this._addFace(wire_i);
        }
        // create polygon
        const pgon_i = this._geom_arrays.dn_pgons_faces.push(face_i) - 1;
        this._geom_arrays.up_faces_pgons[face_i] = pgon_i;
        return pgon_i;
    }
    /**
     * Adds a collection and updates the rev array using numeric indices.
     * @param parent_i
     * @param points_i
     * @param plines_i
     * @param pgons_i
     */
    addColl(parent_i, points_i, plines_i, pgons_i) {
        // create collection
        const coll_i = this._geom_arrays.dn_colls_objs.push([parent_i, points_i, plines_i, pgons_i]) - 1;
        for (const point_i of points_i) {
            if (this._geom_arrays.up_points_colls[point_i] === undefined) {
                this._geom_arrays.up_points_colls[point_i] = [coll_i];
            }
            else {
                this._geom_arrays.up_points_colls[point_i].push(coll_i);
            }
        }
        for (const pline_i of plines_i) {
            if (this._geom_arrays.up_plines_colls[pline_i] === undefined) {
                this._geom_arrays.up_plines_colls[pline_i] = [coll_i];
            }
            else {
                this._geom_arrays.up_plines_colls[pline_i].push(coll_i);
            }
        }
        for (const pgon_i of pgons_i) {
            if (this._geom_arrays.up_pgons_colls[pgon_i] === undefined) {
                this._geom_arrays.up_pgons_colls[pgon_i] = [coll_i];
            }
            else {
                this._geom_arrays.up_pgons_colls[pgon_i].push(coll_i);
            }
        }
        return coll_i;
    }
    // ============================================================================
    // Copy geometry
    // ============================================================================
    /**
     * Copy positions.
     * @param posis_i
     * @param copy_attribs
     */
    copyPosis(posis_i, copy_attribs) {
        if (!Array.isArray(posis_i)) {
            const posi_i = posis_i;
            const xyz = this._geom.model.attribs.query.getPosiCoords(posi_i);
            const new_posi_i = this.addPosi();
            this._geom.model.attribs.add.setPosiCoords(new_posi_i, xyz);
            if (copy_attribs) {
                const attrib_names = this._geom.model.attribs.query.getAttribNames(common_1.EEntType.POSI);
                for (const attrib_name of attrib_names) {
                    const value = this._geom.model.attribs.query.getAttribValue(common_1.EEntType.POSI, attrib_name, posis_i);
                    this._geom.model.attribs.add.setAttribValue(common_1.EEntType.POSI, new_posi_i, attrib_name, value);
                }
            }
            return new_posi_i;
        }
        else {
            return posis_i.map(posi_i => this.copyPosis(posi_i, copy_attribs));
        }
    }
    /**
     * Copy points.
     * TODO copy attribs of topo entities
     * @param index
     * @param copy_attribs
     */
    copyPoints(points_i, copy_attribs) {
        // make copies
        if (!Array.isArray(points_i)) {
            const old_point_i = points_i;
            const posis_i = this._geom.query.navAnyToPosi(common_1.EEntType.POINT, old_point_i);
            const new_point_i = this.addPoint(posis_i[0]);
            if (copy_attribs) {
                this._geom.model.attribs.add.copyAttribs(common_1.EEntType.POINT, old_point_i, new_point_i);
            }
            return new_point_i;
        }
        else { // An array of ent_i
            return points_i.map(point_i => this.copyPoints(point_i, copy_attribs));
        }
    }
    /**
     * Copy plines.
     * TODO copy attribs of topo entities
     * @param index
     * @param copy_attribs
     */
    copyPlines(plines_i, copy_attribs) {
        // make copies
        if (!Array.isArray(plines_i)) {
            const old_pline_i = plines_i;
            const posis_i = this._geom.query.navAnyToPosi(common_1.EEntType.PLINE, old_pline_i);
            const wire_i = this._geom.query.navPlineToWire(old_pline_i);
            const is_closed = this._geom.query.istWireClosed(wire_i);
            const new_pline_i = this.addPline(posis_i, is_closed);
            if (copy_attribs) {
                this._geom.model.attribs.add.copyAttribs(common_1.EEntType.PLINE, old_pline_i, new_pline_i);
            }
            return new_pline_i;
        }
        else { // An array of ent_i
            return plines_i.map(pline_i => this.copyPlines(pline_i, copy_attribs));
        }
    }
    /**
     * Copy polygons.
     * TODO copy attribs of topo entities
     * @param index
     * @param copy_attribs
     */
    copyPgons(pgons_i, copy_attribs) {
        // make copies
        if (!Array.isArray(pgons_i)) {
            const old_pgon_i = pgons_i;
            const wires_i = this._geom.query.navAnyToWire(common_1.EEntType.PGON, old_pgon_i);
            const posis_i = this._geom.query.navAnyToPosi(common_1.EEntType.WIRE, wires_i[0]);
            let new_pgon_i;
            if (wires_i.length === 1) {
                new_pgon_i = this.addPgon(posis_i);
            }
            else {
                const holes_posis_i = [];
                for (let i = 1; i < wires_i.length; i++) {
                    const hole_posis_i = this._geom.query.navAnyToPosi(common_1.EEntType.WIRE, wires_i[i]);
                    holes_posis_i.push(hole_posis_i);
                }
                new_pgon_i = this.addPgon(posis_i, holes_posis_i);
            }
            if (copy_attribs) {
                this._geom.model.attribs.add.copyAttribs(common_1.EEntType.PGON, old_pgon_i, new_pgon_i);
            }
            return new_pgon_i;
        }
        else { // AN array of ent_i
            return pgons_i.map(pgon_i => this.copyPgons(pgon_i, copy_attribs));
        }
    }
    /**
      * Copy a collection
      * TODO Copy attribs of object and topo entities
      * @param ent_type
      * @param index
      * @param copy_posis
      * @param copy_attribs
      */
    copyColls(colls_i, copy_attribs) {
        // make copies
        if (!Array.isArray(colls_i)) {
            const old_coll_i = colls_i;
            // make a deep copy of the objects in the collection
            const points_i = this._geom.query.navCollToPoint(old_coll_i);
            const res1 = this.copyPoints(points_i, copy_attribs);
            const plines_i = this._geom.query.navCollToPline(old_coll_i);
            const res2 = this.copyPlines(plines_i, copy_attribs);
            const pgons_i = this._geom.query.navCollToPgon(old_coll_i);
            const res3 = this.copyPgons(pgons_i, copy_attribs);
            const parent = this._geom.query.getCollParent(old_coll_i);
            // add the new collection
            const new_coll_i = this.addColl(parent, res1, res2, res3);
            // copy the attributes from old collection to new collection
            if (copy_attribs) {
                this._geom.model.attribs.add.copyAttribs(common_1.EEntType.COLL, old_coll_i, new_coll_i);
            }
            // return the new collection
            return new_coll_i;
        }
        else {
            return colls_i.map(coll_i => this.copyColls(coll_i, copy_attribs));
        }
    }
    // ============================================================================
    // Methods to create the topological entities
    // These methods have been made public for access from GIGeomModify
    // They should not be called externally, hence the underscore.
    // ============================================================================
    /**
     * Adds a position and updates the arrays.
     */
    _addPosi() {
        // in this case, there are no down arrays
        // because posis are the bottom of the hierarchy
        // update up arrays
        const posi_i = this._geom_arrays.up_posis_verts.push([]) - 1;
        // return the numeric index of the posi
        return posi_i;
    }
    /**
     * Adds a vertex and updates the arrays.
     * @param posi_i
     */
    _addVertex(posi_i) {
        // update down arrays
        const vert_i = this._geom_arrays.dn_verts_posis.push(posi_i) - 1;
        // update up arrays
        // if (this._geom_arrays.up_posis_verts[posi_i] === undefined) {
        //     this._geom_arrays.up_posis_verts[posi_i] = [];
        // }
        this._geom_arrays.up_posis_verts[posi_i].push(vert_i);
        // return the numeric index of the vertex
        return vert_i;
    }
    /**
     * Adds an edge and updates the arrays.
     * @param vert_i1
     * @param vert_i2
     */
    _addEdge(vert_i1, vert_i2) {
        // update down arrays
        const edge_i = this._geom_arrays.dn_edges_verts.push([vert_i1, vert_i2]) - 1;
        // update up arrays
        if (this._geom_arrays.up_verts_edges[vert_i1] === undefined) {
            this._geom_arrays.up_verts_edges[vert_i1] = [];
        }
        this._geom_arrays.up_verts_edges[vert_i1].push(edge_i);
        if (this._geom_arrays.up_verts_edges[vert_i2] === undefined) {
            this._geom_arrays.up_verts_edges[vert_i2] = [];
        }
        this._geom_arrays.up_verts_edges[vert_i2].push(edge_i);
        // return the numeric index of the edge
        return edge_i;
    }
    /**
     * Adds a wire and updates the arrays.
     * Edges are assumed to be sequential!
     * @param edges_i
     */
    _addWire(edges_i, close = false) {
        // update down arrays
        const wire_i = this._geom_arrays.dn_wires_edges.push(edges_i) - 1;
        // update up arrays
        edges_i.forEach(edge_i => this._geom_arrays.up_edges_wires[edge_i] = wire_i);
        // return the numeric index of the wire
        return wire_i;
    }
    /**
     * Adds trangles and updates the arrays.
     * Wires are assumed to be closed!
     * @param wire_i
     */
    _addTris(wire_i, hole_wires_i) {
        // save all verts
        const all_verts_i = [];
        // get the coords of the outer perimeter edge
        const wire_verts_i = this._geom.query.navAnyToVert(common_1.EEntType.WIRE, wire_i);
        wire_verts_i.forEach(wire_vert_i => all_verts_i.push(wire_vert_i));
        const wire_posis_i = wire_verts_i.map(vert_i => this._geom_arrays.dn_verts_posis[vert_i]);
        const wire_coords = wire_posis_i.map(posi_i => this._geom.model.attribs.query.getPosiCoords(posi_i));
        // get the coords of the holes
        const all_hole_coords = [];
        if (hole_wires_i !== undefined) {
            for (const hole_wire_i of hole_wires_i) {
                const hole_wire_verts_i = this._geom.query.navAnyToVert(common_1.EEntType.WIRE, hole_wire_i);
                hole_wire_verts_i.forEach(wire_vert_i => all_verts_i.push(wire_vert_i));
                const hole_wire_posis_i = hole_wire_verts_i.map(vert_i => this._geom_arrays.dn_verts_posis[vert_i]);
                const hole_wire_coords = hole_wire_posis_i.map(posi_i => this._geom.model.attribs.query.getPosiCoords(posi_i));
                all_hole_coords.push(hole_wire_coords);
            }
        }
        // create the triangles
        const tris_corners = triangulate_1.triangulate(wire_coords, all_hole_coords);
        const tris_verts_i = tris_corners.map(tri_corners => tri_corners.map(corner => all_verts_i[corner]));
        // update down arrays
        const tris_i = tris_verts_i.map(tri_verts_i => this._geom_arrays.dn_tris_verts.push(tri_verts_i) - 1);
        // update up arrays
        for (let i = 0; i < tris_verts_i.length; i++) {
            const tri_verts_i = tris_verts_i[i];
            const tri_i = tris_i[i];
            for (const tri_vert_i of tri_verts_i) {
                if (this._geom_arrays.up_verts_tris[tri_vert_i] === undefined) {
                    this._geom_arrays.up_verts_tris[tri_vert_i] = [];
                }
                this._geom_arrays.up_verts_tris[tri_vert_i].push(tri_i);
            }
        }
        // return an array of numeric indices of the triangles
        return tris_i;
    }
    /**
     * Adds a face and updates the arrays.
     * Wires are assumed to be closed!
     * This also calls addTris()
     * @param wire_i
     */
    _addFace(wire_i) {
        // create the triangles
        const tris_i = this._addTris(wire_i);
        // create the face
        const face = [[wire_i], tris_i];
        // update down arrays
        const face_i = this._geom_arrays.dn_faces_wirestris.push(face) - 1;
        // update up arrays
        this._geom_arrays.up_wires_faces[wire_i] = face_i;
        tris_i.forEach(tri_i => this._geom_arrays.up_tris_faces[tri_i] = face_i);
        // return the numeric index of the face
        return face_i;
    }
    /**
     * Adds a face with a hole and updates the arrays.
     * Wires are assumed to be closed!
     * This also calls addTris()
     * @param wire_i
     */
    _addFaceWithHoles(wire_i, holes_wires_i) {
        // create the triangles
        const tris_i = this._addTris(wire_i, holes_wires_i);
        // create the face
        const face_wires_i = [wire_i].concat(holes_wires_i);
        const face = [face_wires_i, tris_i];
        // update down arrays
        const face_i = this._geom_arrays.dn_faces_wirestris.push(face) - 1;
        // update up arrays
        face_wires_i.forEach(face_wire_i => this._geom_arrays.up_wires_faces[face_wire_i] = face_i);
        tris_i.forEach(tri_i => this._geom_arrays.up_tris_faces[tri_i] = face_i);
        // return the numeric index of the face
        return face_i;
    }
}
exports.GIGeomAdd = GIGeomAdd;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lHZW9tQWRkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYnMvZ2VvLWluZm8vR0lHZW9tQWRkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscUNBQ3lIO0FBQ3pILDREQUF5RDtBQUd6RDs7R0FFRztBQUNILE1BQWEsU0FBUztJQUdsQjs7O09BR0c7SUFDSCxZQUFZLElBQVksRUFBRSxXQUF3QjtRQUM5QyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztJQUNwQyxDQUFDO0lBQ0QsK0VBQStFO0lBQy9FLGVBQWU7SUFDZiwrRUFBK0U7SUFDL0U7O09BRUc7SUFDSSxPQUFPO1FBQ1YsY0FBYztRQUNkLE1BQU0sTUFBTSxHQUFXLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN2QyxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBQ0Q7OztPQUdHO0lBQ0ksUUFBUSxDQUFDLE1BQWM7UUFDMUIsY0FBYztRQUNkLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkMsZUFBZTtRQUNmLE1BQU0sT0FBTyxHQUFXLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0UsSUFBSSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDO1FBQ3BELE9BQU8sT0FBTyxDQUFDO0lBQ25CLENBQUM7SUFDRDs7O09BR0c7SUFDSSxRQUFRLENBQUMsT0FBaUIsRUFBRSxRQUFpQixLQUFLO1FBQ3JELDZCQUE2QjtRQUM3QixNQUFNLFVBQVUsR0FBYSxPQUFPLENBQUMsR0FBRyxDQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FB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