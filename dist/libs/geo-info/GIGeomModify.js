"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
const arrays_1 = require("../util/arrays");
const vectors_1 = require("../geom/vectors");
/**
 * Class for geometry.
 */
class GIGeomModify {
    /**
     * Creates an object to store the geometry data.
     * @param geom_data The JSON data
     */
    constructor(geom, geom_arrays) {
        this._geom = geom;
        this._geom_arrays = geom_arrays;
    }
    // ============================================================================
    // Delete geometry
    // ============================================================================
    /**
     * Del all unused posis in the model.
     * Posi attributes will also be deleted.
     * @param posis_i
     */
    delUnusedPosis(posis_i) {
        // create array
        posis_i = (Array.isArray(posis_i)) ? posis_i : [posis_i];
        if (posis_i.length === 0) {
            return;
        }
        // loop
        const deleted_posis_i = [];
        for (const posi_i of posis_i) {
            // update up arrays
            const verts_i = this._geom_arrays.up_posis_verts[posi_i];
            if (verts_i.length === 0) { // only delete posis with no verts
                this._geom_arrays.up_posis_verts[posi_i] = null;
                deleted_posis_i.push(posi_i);
            }
            // no need to update down arrays
        }
        // delete all the posi attributes, for all posis that were deleted
        this._geom.model.attribs.add.delEntFromAttribs(common_1.EEntType.POSI, deleted_posis_i);
    }
    /**
     * Del posis.
     * Posi attributes will also be deleted.
     * @param posis_i
     */
    delPosis(posis_i) {
        // create array
        posis_i = (Array.isArray(posis_i)) ? posis_i : [posis_i];
        if (posis_i.length === 0) {
            return;
        }
        // loop
        const deleted_posis_i = [];
        for (const posi_i of posis_i) {
            if (this._geom_arrays.up_posis_verts[posi_i] === null) {
                continue;
            } // already deleted
            // delete all verts for this posi
            const copy_verts_i = this._geom_arrays.up_posis_verts[posi_i].slice(); // make a copy
            copy_verts_i.forEach(vert_i => this._delVert(vert_i));
            // delete the posi
            this._geom_arrays.up_posis_verts[posi_i] = null;
            deleted_posis_i.push(posi_i);
            // no need to update down arrays
        }
        // delete all the posi attributes, for all posis that were deleted
        this._geom.model.attribs.add.delEntFromAttribs(common_1.EEntType.POSI, deleted_posis_i);
    }
    /**
     * Del points.
     * Point attributes will also be deleted.
     * @param points_i
     */
    delPoints(points_i, del_unused_posis) {
        // create array
        points_i = (Array.isArray(points_i)) ? points_i : [points_i];
        if (!points_i.length) {
            return;
        }
        // del attribs
        this._geom.model.attribs.add.delEntFromAttribs(common_1.EEntType.POINT, points_i);
        // loop
        for (const point_i of points_i) {
            // first get all the arrays so we dont break navigation
            const vert_i = this._geom_arrays.dn_points_verts[point_i];
            if (vert_i === null) {
                continue;
            } // already deleted
            const posi_i = this._geom_arrays.dn_verts_posis[vert_i];
            // delete the point and check collections
            this._geom_arrays.dn_points_verts[point_i] = null;
            for (const coll of this._geom_arrays.dn_colls_objs) {
                const coll_points_i = coll[1];
                arrays_1.arrRem(coll_points_i, point_i);
            }
            // delete the vert by setting the up and down arrays to null
            this._geom_arrays.dn_verts_posis[vert_i] = null;
            delete this._geom_arrays.up_verts_points[vert_i];
            // remove the vert from up_posis_verts
            const posi_verts_i = this._geom_arrays.up_posis_verts[posi_i];
            arrays_1.arrRem(posi_verts_i, vert_i);
            // delete unused posis
            if (del_unused_posis) {
                this.delUnusedPosis(posi_i);
            }
        }
    }
    /**
     * Del plines.
     * Pline attributes will also be deleted.
     * @param plines_i
     */
    delPlines(plines_i, del_unused_posis) {
        // del attribs
        this._geom.model.attribs.add.delEntFromAttribs(common_1.EEntType.PLINE, plines_i);
        // create array
        plines_i = (Array.isArray(plines_i)) ? plines_i : [plines_i];
        if (!plines_i.length) {
            return;
        }
        // loop
        for (const pline_i of plines_i) {
            // first get all the arrays so we dont break navigation
            const wire_i = this._geom_arrays.dn_plines_wires[pline_i];
            if (wire_i === null) {
                continue;
            } // already deleted
            const edges_i = this._geom.query.navAnyToEdge(common_1.EEntType.PLINE, pline_i);
            const verts_i = this._geom.query.navAnyToVert(common_1.EEntType.PLINE, pline_i);
            const posis_i = this._geom.query.navAnyToPosi(common_1.EEntType.PLINE, pline_i);
            // delete the pline and check collections
            this._geom_arrays.dn_plines_wires[pline_i] = null;
            for (const coll of this._geom_arrays.dn_colls_objs) {
                if (coll !== null) {
                    const coll_plines_i = coll[2];
                    arrays_1.arrRem(coll_plines_i, pline_i);
                }
            }
            // delete the wire
            this._geom_arrays.dn_wires_edges[wire_i] = null;
            delete this._geom_arrays.up_wires_plines[wire_i];
            // delete the edges
            edges_i.forEach(edge_i => {
                this._geom_arrays.dn_edges_verts[edge_i] = null;
                delete this._geom_arrays.up_edges_wires[edge_i];
            });
            // delete the verts
            verts_i.forEach(vert_i => {
                this._geom_arrays.dn_verts_posis[vert_i] = null;
                delete this._geom_arrays.up_verts_edges[vert_i];
            });
            // remove the verts from up_posis_verts
            for (const posi_i of posis_i) {
                const posi_verts_i = this._geom_arrays.up_posis_verts[posi_i];
                // loop through deleted verts
                for (const vert_i of verts_i) {
                    arrays_1.arrRem(posi_verts_i, vert_i);
                    if (posi_verts_i.length === 0) {
                        break;
                    }
                }
            }
            // delete unused posis
            if (del_unused_posis) {
                this.delUnusedPosis(posis_i);
            }
        }
    }
    /**
     * Del pgons.
     * Pgon attributes will also be deleted.
     * @param pgons_i
     */
    delPgons(pgons_i, del_unused_posis) {
        // del attribs
        this._geom.model.attribs.add.delEntFromAttribs(common_1.EEntType.PGON, pgons_i);
        // create array
        pgons_i = (Array.isArray(pgons_i)) ? pgons_i : [pgons_i];
        if (!pgons_i.length) {
            return;
        }
        // loop
        for (const pgon_i of pgons_i) {
            // first get all the arrays so we dont break navigation
            const face_i = this._geom_arrays.dn_pgons_faces[pgon_i];
            if (face_i === null) {
                continue;
            } // already deleted
            const wires_i = this._geom.query.navAnyToWire(common_1.EEntType.PGON, pgon_i);
            const edges_i = this._geom.query.navAnyToEdge(common_1.EEntType.PGON, pgon_i);
            const verts_i = this._geom.query.navAnyToVert(common_1.EEntType.PGON, pgon_i);
            const tris_i = this._geom.query.navAnyToTri(common_1.EEntType.PGON, pgon_i);
            const posis_i = this._geom.query.navAnyToPosi(common_1.EEntType.PGON, pgon_i);
            // delete the pgon and check the collections
            this._geom_arrays.dn_pgons_faces[pgon_i] = null;
            for (const coll of this._geom_arrays.dn_colls_objs) {
                if (coll !== null) {
                    const coll_pgons_i = coll[3];
                    arrays_1.arrRem(coll_pgons_i, pgon_i);
                }
            }
            // delete the face
            this._geom_arrays.dn_faces_wirestris[face_i] = null;
            delete this._geom_arrays.up_faces_pgons[face_i];
            // delete the wires
            wires_i.forEach(wire_i => {
                this._geom_arrays.dn_wires_edges[wire_i] = null;
                delete this._geom_arrays.up_wires_faces[wire_i];
            });
            // delete the edges
            edges_i.forEach(edge_i => {
                this._geom_arrays.dn_edges_verts[edge_i] = null;
                delete this._geom_arrays.up_edges_wires[edge_i];
            });
            // delete the verts
            verts_i.forEach(vert_i => {
                this._geom_arrays.dn_verts_posis[vert_i] = null;
                delete this._geom_arrays.up_verts_edges[vert_i];
                delete this._geom_arrays.up_verts_tris[vert_i];
            });
            // delete the tris
            tris_i.forEach(tri_i => {
                this._geom_arrays.dn_tris_verts[tri_i] = null;
                delete this._geom_arrays.up_tris_faces[tri_i];
            });
            // clean up, posis up arrays point to verts that may have been deleted
            for (const posi_i of posis_i) {
                const posi_verts_i = this._geom_arrays.up_posis_verts[posi_i];
                // loop through deleted verts
                for (const vert_i of verts_i) {
                    arrays_1.arrRem(posi_verts_i, vert_i);
                    if (posi_verts_i.length === 0) {
                        break;
                    }
                }
            }
            // delete unused posis
            if (del_unused_posis) {
                this.delUnusedPosis(posis_i);
            }
        }
    }
    /**
     * Delete a collection.
     * Collection attributes will also be deleted.
     * This does not delete any of the object in the collection.
     * Also, does not delete any positions.
     * @param colls_i The collections to delete
     */
    delColls(colls_i, del_unused_posis) {
        // del attribs
        this._geom.model.attribs.add.delEntFromAttribs(common_1.EEntType.COLL, colls_i);
        // create array
        colls_i = (Array.isArray(colls_i)) ? colls_i : [colls_i];
        if (!colls_i.length) {
            return;
        }
        // loop
        for (const coll_i of colls_i) {
            const coll = this._geom_arrays.dn_colls_objs[coll_i];
            if (coll === null) {
                continue;
            } // already deleted
            // up arrays, delete points, plines, pgons
            const points_i = coll[1];
            points_i.forEach(point_i => {
                const other_colls_i = this._geom_arrays.up_points_colls[point_i];
                arrays_1.arrRem(other_colls_i, coll_i);
            });
            const plines_i = coll[2];
            plines_i.forEach(pline_i => {
                const other_colls_i = this._geom_arrays.up_plines_colls[pline_i];
                arrays_1.arrRem(other_colls_i, coll_i);
            });
            const pgons_i = coll[3];
            pgons_i.forEach(pgon_i => {
                const other_colls_i = this._geom_arrays.up_pgons_colls[pgon_i];
                arrays_1.arrRem(other_colls_i, coll_i);
            });
            // down arrays
            this._geom_arrays.dn_colls_objs[coll_i] = null;
        }
    }
    // ============================================================================
    // Modify geometry
    // ============================================================================
    /**
     * Set the parent if a collection
     * @param coll_i The index of teh collection that is the parent
     * @param parent_coll_i
     */
    setCollParent(coll_i, parent_coll_i) {
        this._geom_arrays.dn_colls_objs[coll_i][0] = parent_coll_i;
    }
    /**
     * Add entities to a collection
     * @param coll_i
     * @param points_i
     * @param plines_i
     * @param pgons_i
     */
    collAddEnts(coll_i, points_i, plines_i, pgons_i) {
        const coll = this._geom_arrays.dn_colls_objs[coll_i];
        const coll_points = coll[1];
        if (points_i && points_i.length) {
            for (const point_i of points_i) {
                if (coll_points.indexOf(point_i) === -1) {
                    // update down arrays
                    coll_points.push(point_i);
                    // update up arrays
                    arrays_1.arrIdxAdd(this._geom_arrays.up_points_colls, point_i, coll_i);
                }
            }
        }
        const coll_plines = coll[2];
        if (plines_i && plines_i.length) {
            for (const pline_i of plines_i) {
                if (coll_plines.indexOf(pline_i) === -1) {
                    // update down arrays
                    coll_plines.push(pline_i);
                    // update up arrays
                    arrays_1.arrIdxAdd(this._geom_arrays.up_plines_colls, pline_i, coll_i);
                }
            }
        }
        const coll_pgons = coll[3];
        if (pgons_i && pgons_i.length) {
            for (const pgon_i of pgons_i) {
                if (coll_pgons.indexOf(pgon_i) === -1) {
                    // update down arrays
                    coll_pgons.push(pgon_i);
                    // update up arrays
                    arrays_1.arrIdxAdd(this._geom_arrays.up_pgons_colls, pgon_i, coll_i);
                }
            }
        }
    }
    /**
     * Remove entities from a collection
     * @param coll_i
     * @param points_i
     * @param plines_i
     * @param pgons_i
     */
    collRemoveEnts(coll_i, points_i, plines_i, pgons_i) {
        const coll = this._geom_arrays.dn_colls_objs[coll_i];
        const coll_points = coll[1];
        if (points_i && points_i.length) {
            for (const point_i of points_i) {
                // update down arrays
                arrays_1.arrRem(coll_points, point_i);
                // update up arrays
                arrays_1.arrRem(this._geom_arrays.up_points_colls[point_i], coll_i);
            }
        }
        const coll_plines = coll[2];
        if (plines_i && plines_i.length) {
            for (const pline_i of plines_i) {
                // update down arrays
                arrays_1.arrRem(coll_plines, pline_i);
                // update up arrays
                arrays_1.arrRem(this._geom_arrays.up_plines_colls[pline_i], coll_i);
            }
        }
        const coll_pgons = coll[3];
        if (pgons_i && pgons_i.length) {
            for (const pgon_i of pgons_i) {
                // update down arrays
                arrays_1.arrRem(coll_pgons, pgon_i);
                // update up arrays
                arrays_1.arrRem(this._geom_arrays.up_pgons_colls[pgon_i], coll_i);
            }
        }
    }
    /**
     * Creates hole in a face
     * @param posis_id
     */
    cutFaceHoles(face_i, posis_i_arr) {
        // get the normal of the face
        const face_normal = this._geom.query.getFaceNormal(face_i);
        // make the wires for the holes
        const hole_wires_i = [];
        for (const hole_posis_i of posis_i_arr) {
            const hole_vert_i_arr = hole_posis_i.map(posi_i => this._geom.add._addVertex(posi_i));
            const hole_edges_i_arr = [];
            for (let i = 0; i < hole_vert_i_arr.length - 1; i++) {
                hole_edges_i_arr.push(this._geom.add._addEdge(hole_vert_i_arr[i], hole_vert_i_arr[i + 1]));
            }
            hole_edges_i_arr.push(this._geom.add._addEdge(hole_vert_i_arr[hole_vert_i_arr.length - 1], hole_vert_i_arr[0]));
            const hole_wire_i = this._geom.add._addWire(hole_edges_i_arr, true);
            // get normal of wire and check if we need to reverse the wire
            const wire_normal = this._geom.query.getWireNormal(hole_wire_i);
            if (vectors_1.vecDot(face_normal, wire_normal) > 0) {
                this.reverse(hole_wire_i);
            }
            // add to list of holes
            hole_wires_i.push(hole_wire_i);
        }
        // create the holes, does everything at face level
        this._cutFaceHoles(face_i, hole_wires_i);
        // no need to change either the up or down arrays
        // return the new wires
        return hole_wires_i;
    }
    /**
     * Close a wire
     * @param wire_i The wire to close.
     */
    closeWire(wire_i) {
        // get the wire start and end verts
        const wire = this._geom_arrays.dn_wires_edges[wire_i];
        const num_edges = wire.length;
        const start_edge_i = wire[0];
        const end_edge_i = wire[num_edges - 1];
        const start_vert_i = this._geom.query.navEdgeToVert(start_edge_i)[0];
        const end_vert_i = this._geom.query.navEdgeToVert(end_edge_i)[1];
        if (start_vert_i === end_vert_i) {
            return;
        }
        // add the edge to the model
        const new_edge_i = this._geom.add._addEdge(end_vert_i, start_vert_i);
        // update the down arrays
        this._geom_arrays.dn_wires_edges[wire_i].push(new_edge_i);
        // update the up arrays
        this._geom_arrays.up_edges_wires[new_edge_i] = wire_i;
        // return the new edge
        return new_edge_i;
    }
    /**
     * Open a wire, by making a new position for the last vertex.
     * @param wire_i The wire to close.
     */
    openWire(wire_i) {
        // This deletes an edge
        throw new Error('Not implemented');
    }
    /**
     * Insert a vertex into an edge and updates the wire with the new edge
     * @param edge_i The edge to insert teh vertex into
     */
    insertVertIntoWire(edge_i, posi_i) {
        const wire_i = this._geom.query.navEdgeToWire(edge_i);
        const wire = this._geom_arrays.dn_wires_edges[wire_i];
        const old_edge = this._geom_arrays.dn_edges_verts[edge_i];
        // create one new vertex and one new edge
        const new_vert_i = this._geom.add._addVertex(posi_i);
        const new_edge_i = this._geom.add._addEdge(new_vert_i, old_edge[1]);
        // update the down arrays
        old_edge[1] = new_vert_i;
        wire.splice(wire.indexOf(edge_i), 1, edge_i, new_edge_i);
        // update the up arrays
        this._geom_arrays.up_edges_wires[new_edge_i] = wire_i;
        // return the new edge
        return new_edge_i;
    }
    /**
     * Adds a vertex to a wire and updates the wire with the new edge
     * @param wire_i The wire to add to.
     */
    addVertToWire(wire_i, posi_i, to_end) {
        const wire = this._geom_arrays.dn_wires_edges[wire_i];
        // create one new vertex and one new edge
        const new_vert_i = this._geom.add._addVertex(posi_i);
        let new_edge_i;
        if (to_end) {
            const exist_edge_i = wire[wire.length - 1];
            const exist_vert_i = this._geom_arrays.dn_edges_verts[exist_edge_i][1];
            new_edge_i = this._geom.add._addEdge(exist_vert_i, new_vert_i);
            // update the down arrays
            wire.push(new_edge_i);
        }
        else {
            const exist_edge_i = wire[0];
            const exist_vert_i = this._geom_arrays.dn_edges_verts[exist_edge_i][0];
            new_edge_i = this._geom.add._addEdge(new_vert_i, exist_vert_i);
            // update the down arrays
            wire.splice(0, 0, new_edge_i);
        }
        // update the up arrays
        this._geom_arrays.up_edges_wires[new_edge_i] = wire_i;
        // return the new edge
        return new_edge_i;
    }
    /**
     * Replace positions
     * @param ent_type
     * @param ent_i
     * @param new_posis_i
     */
    replacePosis(ent_type, ent_i, new_posis_i) {
        const old_posis_i = this._geom.query.navAnyToPosi(ent_type, ent_i);
        if (old_posis_i.length !== new_posis_i.length) {
            throw new Error('Replacing positions operation failed due to incorrect number of positions.');
        }
        const old_posis_i_map = new Map(); // old_posi_i -> index
        for (let i = 0; i < old_posis_i.length; i++) {
            const old_posi_i = old_posis_i[i];
            old_posis_i_map[old_posi_i] = i;
        }
        const verts_i = this._geom.query.navAnyToVert(ent_type, ent_i);
        for (const vert_i of verts_i) {
            const old_posi_i = this._geom.query.navVertToPosi(vert_i);
            const i = old_posis_i_map[old_posi_i];
            const new_posi_i = new_posis_i[i];
            // set the down array
            this._geom_arrays.dn_verts_posis[vert_i] = new_posi_i;
            // update the up arrays for the old posi, i.e. remove this vert
            arrays_1.arrRem(this._geom_arrays.up_posis_verts[old_posi_i], vert_i);
            // update the up arrays for the new posi, i.e. add this vert
            this._geom_arrays.up_posis_verts[new_posi_i].push(vert_i);
        }
    }
    /**
     * Unweld the vertices on naked edges.
     * @param verts_i
     */
    unweldVertsShallow(verts_i) {
        // create a map, for each posi_i, count how many verts there are in the input verts
        const exist_posis_i_map = new Map(); // posi_i -> count
        for (const vert_i of verts_i) {
            const posi_i = this._geom.query.navVertToPosi(vert_i);
            if (!exist_posis_i_map.has(posi_i)) {
                exist_posis_i_map.set(posi_i, 0);
            }
            const vert_count = exist_posis_i_map.get(posi_i);
            exist_posis_i_map.set(posi_i, vert_count + 1);
        }
        // copy positions on the perimeter and make a map
        const old_to_new_posis_i_map = new Map();
        exist_posis_i_map.forEach((vert_count, old_posi_i) => {
            const all_old_verts_i = this._geom.query.navPosiToVert(old_posi_i);
            const all_vert_count = all_old_verts_i.length;
            if (vert_count !== all_vert_count) {
                if (!old_to_new_posis_i_map.has(old_posi_i)) {
                    const new_posi_i = this._geom.add.copyPosis(old_posi_i, true);
                    old_to_new_posis_i_map.set(old_posi_i, new_posi_i);
                }
            }
        });
        // now go through the geom again and rewire to the new posis
        for (const vert_i of verts_i) {
            const old_posi_i = this._geom.query.navVertToPosi(vert_i);
            if (old_to_new_posis_i_map.has(old_posi_i)) {
                const new_posi_i = old_to_new_posis_i_map.get(old_posi_i);
                // update the down arrays
                this._geom_arrays.dn_verts_posis[vert_i] = new_posi_i;
                // update the up arrays for the old posi, i.e. remove this vert
                arrays_1.arrRem(this._geom_arrays.up_posis_verts[old_posi_i], vert_i);
                // update the up arrays for the new posi, i.e. add this vert
                this._geom_arrays.up_posis_verts[new_posi_i].push(vert_i);
            }
        }
        // return all the new positions
        return Array.from(old_to_new_posis_i_map.values());
    }
    /**
     * Unweld all vertices
     * @param verts_i
     */
    unweldVerts(verts_i) {
        const new_posis_i = [];
        for (const vert_i of verts_i) {
            const exist_posi_i = this._geom.query.navVertToPosi(vert_i);
            const all_verts_i = this._geom.query.navPosiToVert(exist_posi_i);
            const all_verts_count = all_verts_i.length;
            if (all_verts_count > 1) {
                const new_posi_i = this._geom.add.copyPosis(exist_posi_i, true);
                // update the down arrays
                this._geom_arrays.dn_verts_posis[vert_i] = new_posi_i;
                // update the up arrays for the old posi, i.e. remove this vert
                arrays_1.arrRem(this._geom_arrays.up_posis_verts[exist_posi_i], vert_i);
                // update the up arrays for the new posi, i.e. add this vert
                this._geom_arrays.up_posis_verts[new_posi_i].push(vert_i);
                // add the new posi_i to the list, to be returned later
                new_posis_i.push(new_posi_i);
            }
        }
        // return all the new positions
        return new_posis_i;
    }
    /**
     * Reverse the edges of a wire.
     * This lists the edges in reverse order, and flips each edge.
     * The attributes ... TODO
     */
    reverse(wire_i) {
        const wire = this._geom_arrays.dn_wires_edges[wire_i];
        wire.reverse();
        // reverse the edges
        for (const edge_i of wire) {
            const edge = this._geom_arrays.dn_edges_verts[edge_i];
            edge.reverse();
        }
        // if this is the first wire in a face, reverse the triangles
        const face_i = this._geom_arrays.up_wires_faces[wire_i];
        if (face_i !== undefined) {
            const face = this._geom_arrays.dn_faces_wirestris[face_i];
            if (face[0][0] === wire_i) {
                for (const tri_i of face[1]) {
                    const tri = this._geom_arrays.dn_tris_verts[tri_i];
                    tri.reverse();
                }
            }
        }
    }
    /**
     * Shifts the edges of a wire.
     * The attributes ... TODO
     */
    shift(wire_i, offset) {
        const wire = this._geom_arrays.dn_wires_edges[wire_i];
        wire.unshift.apply(wire, wire.splice(offset, wire.length));
    }
    // ============================================================================
    // Private methods
    // ============================================================================
    /**
     * Adds a hole to a face and updates the arrays.
     * Wires are assumed to be closed!
     * This also calls addTris()
     * @param wire_i
     */
    _cutFaceHoles(face_i, hole_wires_i) {
        // get the wires and triangles arrays
        const [face_wires_i, old_face_tris_i] = this._geom_arrays.dn_faces_wirestris[face_i];
        // get the outer wire
        const outer_wire_i = face_wires_i[0];
        // get the hole wires
        const all_hole_wires_i = [];
        if (face_wires_i.length > 1) {
            face_wires_i.slice(1).forEach(wire_i => all_hole_wires_i.push(wire_i));
        }
        hole_wires_i.forEach(wire_i => all_hole_wires_i.push(wire_i));
        // create the triangles
        const new_tris_i = this._geom.add._addTris(outer_wire_i, all_hole_wires_i);
        // create the face
        const new_wires_i = face_wires_i.concat(hole_wires_i);
        const new_face = [new_wires_i, new_tris_i];
        // update down arrays
        this._geom_arrays.dn_faces_wirestris[face_i] = new_face;
        // update up arrays
        hole_wires_i.forEach(hole_wire_i => this._geom_arrays.up_wires_faces[hole_wire_i] = face_i);
        new_tris_i.forEach(tri_i => this._geom_arrays.up_tris_faces[tri_i] = face_i);
        // delete the old trianges
        for (const old_face_tri_i of old_face_tris_i) {
            // remove these deleted tris from the verts
            for (const vertex_i of this._geom_arrays.dn_tris_verts[old_face_tri_i]) {
                const tris_i = this._geom_arrays.up_verts_tris[vertex_i];
                arrays_1.arrRem(tris_i, old_face_tri_i);
            }
            // tris to verts
            this._geom_arrays.dn_tris_verts[old_face_tri_i] = null;
            // tris to faces
            delete this._geom_arrays.up_tris_faces[old_face_tri_i];
        }
        // TODO deal with the old triangles, stored in face_tris_i
        // TODO These are still there and are still pointing up at this face
        // TODO the have to be deleted...
        // return the numeric index of the face
        return face_i;
    }
    // ============================================================================
    // Private methods to delete topo
    // ============================================================================
    /**
     * Deletes a vert.
     *
     * In the general case, the two edges adjacent to the deleted vert will be merged.
     * This means that the next edge will be deleted.
     * The end vert of the previous edge will connect to the end posi of the next edge.
     *
     * The first special case is if the vert is for a point. In that case, just delete the point.
     *
     * Then there are two special cases for whicj we delete the whole object
     *
     * 1) If the wire is open and has only 1 edge, then delete the wire
     * 2) if the wire is closed pgon and has only 3 edges, then:
     *    a) If the wire is the boundary of the pgon, then delete the whole pgon
     *    b) If the wire is a hole in the pgon, then delete the hole
     *
     * Assuming the special cases above do not apply,
     * then there are two more special cases for open wires
     *
     * 1) If the vert is at the start of an open wire, then delete the first edge
     * 2) If teh vert is at the end of an open wire, then delete the last edge
     *
     * Finally, we come to the standard case.
     * The next edge is deleted, and the prev edge gets rewired.
     *
     * @param vert_i
     */
    _delVert(vert_i) {
        // check, has it already been deleted
        if (this._geom_arrays.dn_verts_posis[vert_i] === null) {
            return;
        }
        // check, is this a point, then delete the point and vertex
        const point_i = this._geom_arrays.up_verts_points[vert_i];
        if (point_i !== undefined && point_i !== null) {
            this.delPoints(point_i, false);
            return;
        }
        // get the posis, edges, and wires, and other info
        const edges_i = this._geom_arrays.up_verts_edges[vert_i];
        const wire_i = this._geom_arrays.up_edges_wires[edges_i[0]];
        const face_i = this._geom_arrays.up_wires_faces[wire_i]; // this may be undefined
        const wire_edges_i = this._geom_arrays.dn_wires_edges[wire_i];
        const wire_verts_i = this._geom.query.navAnyToVert(common_1.EEntType.WIRE, wire_i);
        const wire_is_closed = this._geom.query.istWireClosed(wire_i);
        const index_vert_i = wire_verts_i.indexOf(vert_i);
        const num_verts = wire_verts_i.length;
        // update the edges and wires
        if (!wire_is_closed && num_verts === 2) {
            // special case, open pline with 2 verts
            this.__delVert__OpenPline1Edge(wire_i);
        }
        else if (face_i !== undefined && face_i !== null && num_verts === 3) {
            // special case, pgon with three verts
            const wires_i = this._geom_arrays.dn_faces_wirestris[face_i][0];
            const index_face_wire = wires_i.indexOf(wire_i);
            if (index_face_wire === 0) {
                // special case, pgon boundary with verts, delete the pgon
                this.__delVert__PgonBoundaryWire3Edge(face_i);
            }
            else {
                // special case, pgon hole with verts, delete the hole
                this.__delVert__PgonHoleWire3Edge(face_i, wire_i);
            }
        }
        else if (!wire_is_closed && index_vert_i === 0) {
            // special case, open pline, delete start edge and vert
            this.__delVert__OpenPlineStart(wire_edges_i, wire_verts_i, vert_i);
        }
        else if (!wire_is_closed && index_vert_i === num_verts - 1) {
            // special case, open pline, delete end edge and vert
            this.__delVert__OpenPlineEnd(wire_edges_i, wire_verts_i, vert_i);
        }
        else {
            // standard case, delete the prev edge and reqire the next edge
            this.__delVert__StandardCase(wire_edges_i, vert_i, index_vert_i === 0);
            if (face_i !== undefined) {
                // for pgons, also update tris
                this._updateFaceTris(face_i);
            }
        }
    }
    /**
     * Special case, delete the pline
     * @param wire_i
     */
    __delVert__OpenPline1Edge(wire_i) {
        const pline_i = this._geom_arrays.up_wires_plines[wire_i];
        this.delPlines(pline_i, false);
    }
    /**
     * Special case, delete either the pgon
     * @param face_i
     */
    __delVert__PgonBoundaryWire3Edge(face_i) {
        const pgon_i = this._geom_arrays.up_faces_pgons[face_i];
        this.delPgons(pgon_i, false);
    }
    /**
     * Special case, delete either the hole
     * @param vert_i
     */
    __delVert__PgonHoleWire3Edge(face_i, wire_i) {
    }
    /**
     * Special case, delete the first edge
     * @param vert_i
     */
    __delVert__OpenPlineStart(wire_edges_i, wire_verts_i, vert_i) {
        const posi_i = this._geom_arrays.dn_verts_posis[vert_i];
        // vert_i is at the star of an open wire, we have one edge
        const start_edge_i = wire_edges_i[0];
        // delete the first edge
        this._geom_arrays.dn_edges_verts[start_edge_i] = null;
        delete this._geom_arrays.up_edges_wires[start_edge_i];
        this._geom.model.attribs.add.delEntFromAttribs(common_1.EEntType.EDGE, start_edge_i);
        // update the second vert
        const second_vert_i = wire_verts_i[1];
        arrays_1.arrRem(this._geom_arrays.up_verts_edges[second_vert_i], start_edge_i);
        // update the wire
        arrays_1.arrRem(wire_edges_i, start_edge_i);
        // delete the vert
        this._geom_arrays.dn_verts_posis[vert_i] = null;
        delete this._geom_arrays.up_verts_edges[vert_i];
        this._geom.model.attribs.add.delEntFromAttribs(common_1.EEntType.VERT, vert_i);
        // update the posis
        arrays_1.arrRem(this._geom_arrays.up_posis_verts[posi_i], vert_i);
    }
    /**
     * Special case, delete the last edge
     * @param vert_i
     */
    __delVert__OpenPlineEnd(wire_edges_i, wire_verts_i, vert_i) {
        const posi_i = this._geom_arrays.dn_verts_posis[vert_i];
        // vert_i is at the end of an open wire, we have one edge
        const end_edge_i = wire_edges_i[wire_edges_i.length - 1];
        // delete the last edge
        this._geom_arrays.dn_edges_verts[end_edge_i] = null;
        delete this._geom_arrays.up_edges_wires[end_edge_i];
        this._geom.model.attribs.add.delEntFromAttribs(common_1.EEntType.EDGE, end_edge_i);
        // update the one before last vert
        const before_last_vert_i = wire_verts_i[wire_verts_i.length - 2];
        arrays_1.arrRem(this._geom_arrays.up_verts_edges[before_last_vert_i], end_edge_i);
        // update the wire
        arrays_1.arrRem(wire_edges_i, end_edge_i);
        // delete the vert
        this._geom_arrays.dn_verts_posis[vert_i] = null;
        delete this._geom_arrays.up_verts_edges[vert_i];
        this._geom.model.attribs.add.delEntFromAttribs(common_1.EEntType.VERT, vert_i);
        // update the posis
        arrays_1.arrRem(this._geom_arrays.up_posis_verts[posi_i], vert_i);
    }
    /**
     * Final case, delete the next edge, reqire the previous edge
     * For pgons, this does not update the tris
     * @param vert_i
     */
    __delVert__StandardCase(wire_edges_i, vert_i, is_first) {
        const posi_i = this._geom_arrays.dn_verts_posis[vert_i];
        // vert_i is in the middle of a wire, we must have two edges
        const edges_i = this._geom_arrays.up_verts_edges[vert_i];
        const prev_edge_i = is_first ? edges_i[1] : edges_i[0];
        const next_edge_i = is_first ? edges_i[0] : edges_i[1];
        // get the verts of the two edges
        const prev_edge_verts_i = this._geom_arrays.dn_edges_verts[prev_edge_i];
        const next_edge_verts_i = this._geom_arrays.dn_edges_verts[next_edge_i];
        const prev_vert_i = prev_edge_verts_i[0];
        const next_vert_i = next_edge_verts_i[1];
        // run some checks, TODO this can be removed later
        if (prev_vert_i === vert_i) {
            throw new Error('Unexpected vertex ordering 1');
        }
        if (next_vert_i === vert_i) {
            throw new Error('Unexpected vertex ordering 2');
        }
        if (prev_edge_verts_i[1] !== next_edge_verts_i[0]) {
            throw new Error('Unexpected vertex ordering 3');
        }
        if (prev_edge_verts_i[1] !== vert_i) {
            throw new Error('Unexpected vertex ordering 4');
        }
        // rewire the end vert of the previous edge to the end vert of the next edge
        prev_edge_verts_i[1] = next_vert_i;
        this._geom_arrays.up_verts_edges[next_vert_i][0] = prev_edge_i;
        // delete the next edge
        this._geom_arrays.dn_edges_verts[next_edge_i] = null;
        delete this._geom_arrays.up_edges_wires[next_edge_i];
        this._geom.model.attribs.add.delEntFromAttribs(common_1.EEntType.EDGE, next_edge_i);
        // update the wire
        arrays_1.arrRem(wire_edges_i, next_edge_i);
        // delete the vert
        this._geom_arrays.dn_verts_posis[vert_i] = null;
        delete this._geom_arrays.up_verts_edges[vert_i];
        this._geom.model.attribs.add.delEntFromAttribs(common_1.EEntType.VERT, vert_i);
        // update the posis
        arrays_1.arrRem(this._geom_arrays.up_posis_verts[posi_i], vert_i);
    }
    /**
     * Updates the tris in a face
     * @param face_i
     */
    _updateFaceTris(face_i) {
        // get the wires
        const border_wire_i = this._geom_arrays.dn_faces_wirestris[face_i][0][0];
        // get the border and holes
        const holes_wires_i = [];
        const num_holes = this._geom_arrays.dn_faces_wirestris[face_i][0].length - 1;
        if (num_holes > 1) {
            for (let i = 1; i < num_holes + 1; i++) {
                const hole_wire_i = this._geom_arrays.dn_faces_wirestris[face_i][0][i];
                holes_wires_i.push(hole_wire_i);
            }
        }
        const tris_i = this._geom.add._addTris(border_wire_i, holes_wires_i);
        // delete the old tris
        for (const tri_i of this._geom_arrays.dn_faces_wirestris[face_i][1]) {
            // update the verts
            const verts_i = this._geom_arrays.dn_tris_verts[tri_i];
            for (const vert_i of verts_i) {
                delete this._geom_arrays.up_verts_tris[vert_i]; // up
            }
            // delete the tri
            this._geom_arrays.dn_tris_verts[tri_i] = null;
            delete this._geom_arrays.up_tris_faces[tri_i]; // up
        }
        // update down arrays
        this._geom_arrays.dn_faces_wirestris[face_i][1] = tris_i;
        // update up arrays
        for (const tri_i of tris_i) {
            this._geom_arrays.up_tris_faces[tri_i] = face_i;
        }
    }
}
exports.GIGeomModify = GIGeomModify;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lHZW9tTW9kaWZ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYnMvZ2VvLWluZm8vR0lHZW9tTW9kaWZ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscUNBQXlGO0FBRXpGLDJDQUFtRDtBQUNuRCw2Q0FBeUM7QUFFekM7O0dBRUc7QUFDSCxNQUFhLFlBQVk7SUFHckI7OztPQUdHO0lBQ0gsWUFBWSxJQUFZLEVBQUUsV0FBd0I7UUFDOUMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDbEIsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUM7SUFDcEMsQ0FBQztJQUNELCtFQUErRTtJQUMvRSxrQkFBa0I7SUFDbEIsK0VBQStFO0lBQy9FOzs7O09BSUc7SUFDSSxjQUFjLENBQUMsT0FBd0I7UUFDMUMsZUFBZTtRQUNmLE9BQU8sR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3pELElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFBRSxPQUFPO1NBQUU7UUFDckMsT0FBTztRQUNQLE1BQU0sZUFBZSxHQUFhLEVBQUUsQ0FBQztRQUNyQyxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRTtZQUMxQixtQkFBbUI7WUFDbkIsTUFBTSxPQUFPLEdBQWEsSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbkUsSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxFQUFFLGtDQUFrQztnQkFDMUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDO2dCQUNoRCxlQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ2hDO1lBQ0QsZ0NB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