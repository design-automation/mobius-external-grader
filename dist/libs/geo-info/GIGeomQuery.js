"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
const id_1 = require("./id");
const vectors_1 = require("../geom/vectors");
/**
 * Class for geometry.
 */
class GIGeomQuery {
    /**
     * Creates an object to store the geometry data.
     * @param geom_data The JSON data
     */
    constructor(geom, geom_arrays) {
        this._geom = geom;
        this._geom_arrays = geom_arrays;
    }
    // ============================================================================
    // Get entity indices, and num ents
    // ============================================================================
    /**
     * Returns a list of indices for all, including ents that are null
     * @param ent_type
     */
    getEnts(ent_type, include_deleted) {
        // get posis indices array from up array: up_posis_verts
        if (id_1.isPosi(ent_type)) {
            const posis = this._geom_arrays.up_posis_verts;
            const posis_i = [];
            if (include_deleted) {
                let i = 0;
                const i_max = posis.length;
                for (; i < i_max; i++) {
                    const posi = posis[i];
                    if (posi !== null) {
                        posis_i.push(i);
                    }
                    else {
                        posis_i.push(null); // TODO
                    }
                }
            }
            else {
                let i = 0;
                const i_max = posis.length;
                for (; i < i_max; i++) {
                    const posi = posis[i];
                    if (posi !== null) {
                        posis_i.push(i);
                    }
                }
            }
            return posis_i;
        }
        // get ents indices array from down arrays
        const geom_array_key = common_1.EEntStrToGeomArray[ent_type];
        const geom_array = this._geom_arrays[geom_array_key];
        const ents_i = [];
        if (include_deleted) {
            let i = 0;
            const i_max = geom_array.length;
            for (; i < i_max; i++) {
                const ent = geom_array[i];
                if (ent !== null) {
                    ents_i.push(i);
                }
                else {
                    ents_i.push(null); // TODO
                }
            }
        }
        else {
            let i = 0;
            const i_max = geom_array.length;
            for (; i < i_max; i++) {
                const ent = geom_array[i];
                if (ent !== null) {
                    ents_i.push(i);
                }
            }
        }
        return ents_i;
    }
    /**
     * Returns the number of entities
     * @param ent_type
     */
    numEnts(ent_type, include_deleted) {
        return this.getEnts(ent_type, include_deleted).length;
    }
    /**
     * Returns a list of indices for all posis that have no verts
     * @param ent_type
     */
    getUnusedPosis(include_deleted) {
        // get posis indices array from up array: up_posis_verts
        const posis = this._geom_arrays.up_posis_verts;
        const posis_i = [];
        if (include_deleted) {
            for (let i = 0; i < posis.length; i++) {
                const posi = posis[i];
                if (posi !== null) {
                    if (posi.length === 0) {
                        posis_i.push(i);
                    }
                }
                else {
                    posis_i.push(null);
                }
            }
        }
        else {
            for (let i = 0; i < posis.length; i++) {
                const posi = posis[i];
                if (posi !== null) {
                    if (posi.length === 0) {
                        posis_i.push(i);
                    }
                }
            }
        }
        return posis_i;
    }
    // ============================================================================
    // Util
    // ============================================================================
    /**
     * Check if an entity exists
     * @param ent_type
     * @param index
     */
    entExists(ent_type, index) {
        if (ent_type === common_1.EEntType.POSI) {
            return (this._geom_arrays.up_posis_verts[index] !== undefined &&
                this._geom_arrays.up_posis_verts[index] !== null);
        }
        const geom_arrays_key = common_1.EEntStrToGeomArray[ent_type];
        return (this._geom_arrays[geom_arrays_key][index] !== undefined &&
            this._geom_arrays[geom_arrays_key][index] !== null);
    }
    /**
     * Check if a wire is closed.
     * @param wire_i
     */
    istWireClosed(wire_i) {
        // get the wire start and end verts
        const wire = this._geom_arrays.dn_wires_edges[wire_i];
        const num_edges = wire.length;
        const start_edge_i = wire[0];
        const end_edge_i = wire[num_edges - 1];
        const start_vert_i = this._geom.query.navEdgeToVert(start_edge_i)[0];
        const end_vert_i = this._geom.query.navEdgeToVert(end_edge_i)[1];
        // if start and end verts are the same, then wire is closed
        return (start_vert_i === end_vert_i);
    }
    /**
     * Returns the vertices.
     * For a closed wire, #vertices = #edges
     * For an open wire, #vertices = #edges + 1
     * @param wire_i
     */
    getWireVerts(wire_i) {
        const edges_i = this._geom_arrays.dn_wires_edges[wire_i];
        const verts_i = edges_i.map(edge_i => this._geom_arrays.dn_edges_verts[edge_i][0]);
        // if wire is open, then add final vertex
        if (this._geom_arrays.dn_edges_verts[edges_i[0]][0] !== this._geom_arrays.dn_edges_verts[edges_i[edges_i.length - 1]][1]) {
            verts_i.push(this._geom_arrays.dn_edges_verts[edges_i[edges_i.length - 1]][1]);
        }
        return verts_i;
    }
    /**
     * Get the parent of a collection.
     * @param coll_i
     */
    getCollParent(coll_i) {
        return this._geom_arrays.dn_colls_objs[coll_i][0];
    }
    getCollParents(coll_i) {
        const parents = this._geom_arrays.dn_colls_objs[coll_i];
        // @ts-ignore
        const _parents = parents.flat(1).filter(function (el) { return el != null; });
        return _parents;
    }
    /**
     *
     * @param face_i
     */
    getFaceBoundary(face_i) {
        const wires_i = this._geom_arrays.dn_faces_wirestris[face_i][0];
        return wires_i[0];
    }
    /**
     *
     * @param face_i
     */
    getFaceHoles(face_i) {
        const wires_i = this._geom_arrays.dn_faces_wirestris[face_i][0];
        return wires_i.slice(1);
    }
    /**
     *
     * @param ent_i
     */
    getCentroid(ent_type, ent_i) {
        const posis_i = this.navAnyToPosi(ent_type, ent_i);
        const centroid = [0, 0, 0];
        for (const posi_i of posis_i) {
            const xyz = this._geom.model.attribs.query.getPosiCoords(posi_i);
            centroid[0] += xyz[0];
            centroid[1] += xyz[1];
            centroid[2] += xyz[2];
        }
        return vectors_1.vecDiv(centroid, posis_i.length);
    }
    /**
     *
     * @param face_i
     */
    getFaceNormal(face_i) {
        const normal = [0, 0, 0];
        const tris_i = this._geom._geom_arrays.dn_faces_wirestris[face_i][1];
        let count = 0;
        for (const tri_i of tris_i) {
            const posis_i = this._geom_arrays.dn_tris_verts[tri_i].map(vert_i => this._geom_arrays.dn_verts_posis[vert_i]);
            const xyzs = posis_i.map(posi_i => this._geom.model.attribs.query.getPosiCoords(posi_i));
            const vec_a = vectors_1.vecFromTo(xyzs[0], xyzs[1]);
            const vec_b = vectors_1.vecFromTo(xyzs[0], xyzs[2]); // CCW
            const tri_normal = vectors_1.vecCross(vec_a, vec_b, true);
            if (!(tri_normal[0] === 0 && tri_normal[1] === 0 && tri_normal[2] === 0)) {
                count += 1;
                normal[0] += tri_normal[0];
                normal[1] += tri_normal[1];
                normal[2] += tri_normal[2];
            }
        }
        if (count === 0) {
            return [0, 0, 0];
        }
        return vectors_1.vecDiv(normal, count);
    }
    /**
     *
     * @param wire_i
     */
    getWireNormal(wire_i) {
        const centroid = this.getCentroid(common_1.EEntType.WIRE, wire_i);
        const edges_i = this._geom._geom_arrays.dn_wires_edges[wire_i];
        const normal = [0, 0, 0];
        let count = 0;
        for (const edge_i of edges_i) {
            const posis_i = this._geom_arrays.dn_edges_verts[edge_i].map(vert_i => this._geom_arrays.dn_verts_posis[vert_i]);
            const xyzs = posis_i.map(posi_i => this._geom.model.attribs.query.getPosiCoords(posi_i));
            const vec_a = vectors_1.vecFromTo(centroid, xyzs[0]);
            const vec_b = vectors_1.vecFromTo(centroid, xyzs[1]); // CCW
            const tri_normal = vectors_1.vecCross(vec_a, vec_b, true);
            if (!(tri_normal[0] === 0 && tri_normal[1] === 0 && tri_normal[2] === 0)) {
                count += 1;
                normal[0] += tri_normal[0];
                normal[1] += tri_normal[1];
                normal[2] += tri_normal[2];
            }
        }
        if (count === 0) {
            return [0, 0, 0];
        }
        return vectors_1.vecDiv(normal, count);
    }
    // ============================================================================
    // Navigate down the hierarchy
    // ============================================================================
    navVertToPosi(vert_i) {
        return this._geom_arrays.dn_verts_posis[vert_i];
    }
    navTriToVert(tri_i) {
        return this._geom_arrays.dn_tris_verts[tri_i];
    }
    navEdgeToVert(edge_i) {
        return this._geom_arrays.dn_edges_verts[edge_i];
    }
    navWireToEdge(wire_i) {
        return this._geom_arrays.dn_wires_edges[wire_i];
    }
    navFaceToWire(face_i) {
        return this._geom_arrays.dn_faces_wirestris[face_i][0];
    }
    navFaceToTri(face_i) {
        return this._geom_arrays.dn_faces_wirestris[face_i][1];
    }
    navPointToVert(point_i) {
        return this._geom_arrays.dn_points_verts[point_i];
    }
    navPlineToWire(line_i) {
        return this._geom_arrays.dn_plines_wires[line_i];
    }
    navPgonToFace(pgon_i) {
        return this._geom_arrays.dn_pgons_faces[pgon_i];
    }
    navCollToPoint(coll_i) {
        return this._geom_arrays.dn_colls_objs[coll_i][1]; // coll points
    }
    navCollToPline(coll_i) {
        return this._geom_arrays.dn_colls_objs[coll_i][2]; // coll lines
    }
    navCollToPgon(coll_i) {
        return this._geom_arrays.dn_colls_objs[coll_i][3]; // coll pgons
    }
    navCollToColl(coll_i) {
        return coll_i[0]; // coll parent
    }
    // ============================================================================
    // Navigate up the hierarchy
    // ============================================================================
    navPosiToVert(posi_i) {
        return this._geom_arrays.up_posis_verts[posi_i];
    }
    navVertToTri(vert_i) {
        return this._geom_arrays.up_verts_tris[vert_i];
    }
    navVertToEdge(vert_i) {
        return this._geom_arrays.up_verts_edges[vert_i];
    }
    navTriToFace(tri_i) {
        return this._geom_arrays.up_tris_faces[tri_i];
    }
    navEdgeToWire(edge_i) {
        return this._geom_arrays.up_edges_wires[edge_i];
    }
    navWireToFace(wire_i) {
        return this._geom_arrays.up_wires_faces[wire_i];
    }
    navVertToPoint(vert_i) {
        return this._geom_arrays.up_verts_points[vert_i];
    }
    navWireToPline(wire_i) {
        return this._geom_arrays.up_wires_plines[wire_i];
    }
    navFaceToPgon(face) {
        return this._geom_arrays.up_faces_pgons[face];
    }
    navPointToColl(point_i) {
        return this._geom_arrays.up_points_colls[point_i];
    }
    navPlineToColl(line_i) {
        return this._geom_arrays.up_plines_colls[line_i];
    }
    navPgonToColl(pgon_i) {
        return this._geom_arrays.up_pgons_colls[pgon_i];
    }
    // ============================================================================
    // Navigate from any level to ? (up or down)
    // ============================================================================
    /**
     * Navigate from any level to the colls
     * @param ent_type
     * @param index
     */
    navAnyToColl(ent_type, index) {
        if (id_1.isColl(ent_type)) {
            return [index];
        }
        const points_i = this.navAnyToPoint(ent_type, index);
        const colls1_i = [].concat(...points_i.map(point_i => this.navPointToColl(point_i)));
        const plines_i = this.navAnyToPline(ent_type, index);
        const colls2_i = [].concat(...plines_i.map(pline_i => this.navPlineToColl(pline_i)));
        const pgons_i = this.navAnyToPgon(ent_type, index);
        const colls3_i = [].concat(...pgons_i.map(pgon_i => this.navPgonToColl(pgon_i)));
        return Array.from(new Set([...colls1_i, ...colls2_i, ...colls3_i])).filter(coll_i => coll_i !== undefined); // remove duplicates
    }
    /**
     * Navigate from any level to the pgons
     * @param ent_type
     * @param index
     */
    navAnyToPgon(ent_type, index) {
        if (id_1.isPgon(ent_type)) {
            return [index];
        }
        const faces_i = this.navAnyToFace(ent_type, index);
        return faces_i.map(face_i => this.navFaceToPgon(face_i)).filter(pgon_i => pgon_i !== undefined);
    }
    /**
     * Navigate from any level to the plines
     * @param ent_type
     * @param index
     */
    navAnyToPline(ent_type, index) {
        if (id_1.isPline(ent_type)) {
            return [index];
        }
        const wires_i = this.navAnyToWire(ent_type, index);
        return wires_i.map(wire_i => this.navWireToPline(wire_i)).filter(pline_i => pline_i !== undefined);
    }
    /**
     * Navigate from any level to the points
     * @param ent_type
     * @param index
     */
    navAnyToPoint(ent_type, index) {
        if (id_1.isPoint(ent_type)) {
            return [index];
        }
        const verts_i = this.navAnyToVert(ent_type, index);
        return verts_i.map(vert_i => this.navVertToPoint(vert_i)).filter(point_i => point_i !== undefined);
    }
    /**
     * Navigate from any level to the faces
     * @param ent_type
     * @param index
     */
    navAnyToFace(ent_type, index) {
        if (id_1.isPosi(ent_type)) {
            const verts_i = this.navPosiToVert(index);
            // avoid getting duplicates
            const faces_i_set = new Set();
            for (const vert_i of verts_i) {
                const faces_i = this.navAnyToFace(common_1.EEntType.VERT, vert_i);
                for (const face_i of faces_i) {
                    faces_i_set.add(face_i);
                }
            }
            return Array.from(new Set(faces_i_set));
        }
        else if (id_1.isVert(ent_type)) {
            const edges_i = this.navVertToEdge(index);
            return [].concat(...edges_i.map(edge_i => this.navAnyToFace(common_1.EEntType.EDGE, edge_i)));
        }
        else if (id_1.isTri(ent_type)) {
            return [this.navTriToFace(index)];
        }
        else if (id_1.isEdge(ent_type)) {
            const wire_i = this.navEdgeToWire(index);
            return this.navAnyToFace(common_1.EEntType.WIRE, wire_i);
        }
        else if (id_1.isWire(ent_type)) {
            return [this.navWireToFace(index)];
        }
        else if (id_1.isFace(ent_type)) { // target
            return [index];
        }
        else if (id_1.isPoint(ent_type)) {
            return [];
        }
        else if (id_1.isPline(ent_type)) {
            return [];
        }
        else if (id_1.isPgon(ent_type)) {
            return [this.navPgonToFace(index)];
        }
        else if (id_1.isColl(ent_type)) {
            const pgons_i = this.navCollToPgon(index);
            return pgons_i.map(pgon_i => this.navPgonToFace(pgon_i));
        }
        throw new Error('Bad navigation in geometry data structure: ' + ent_type + index);
    }
    /**
     * Navigate from any level to the wires
     * @param ent_type
     * @param index
     */
    navAnyToWire(ent_type, index) {
        if (id_1.isPosi(ent_type)) {
            const verts_i = this.navPosiToVert(index);
            // avoid getting duplicates
            const wires_i_set = new Set();
            for (const vert_i of verts_i) {
                const wires_i = this.navAnyToWire(common_1.EEntType.VERT, vert_i);
                for (const wire_i of wires_i) {
                    wires_i_set.add(wire_i);
                }
            }
            return Array.from(new Set(wires_i_set));
        }
        else if (id_1.isVert(ent_type)) {
            const edges_i = this.navVertToEdge(index);
            return [].concat(...edges_i.map(edge_i => this.navEdgeToWire(edge_i)));
        }
        else if (id_1.isTri(ent_type)) {
            return [];
        }
        else if (id_1.isEdge(ent_type)) {
            return [this.navEdgeToWire(index)];
        }
        else if (id_1.isWire(ent_type)) { // target
            return [index];
        }
        else if (id_1.isFace(ent_type)) {
            return this.navFaceToWire(index);
        }
        else if (id_1.isPoint(ent_type)) {
            return [];
        }
        else if (id_1.isPline(ent_type)) {
            return [this.navPlineToWire(index)];
        }
        else if (id_1.isPgon(ent_type)) {
            const face_i = this.navPgonToFace(index);
            return this.navFaceToWire(face_i);
        }
        else if (id_1.isColl(ent_type)) {
            const all_wires_i = [];
            const plines_i = this.navCollToPline(index);
            for (const pline_i of plines_i) {
                const wire_i = this.navPlineToWire(index);
                all_wires_i.push(wire_i);
            }
            const pgons_i = this.navCollToPgon(index);
            for (const pgon_i of pgons_i) {
                const wires_i = this.navAnyToWire(common_1.EEntType.PGON, pgon_i);
                for (const wire_i of wires_i) {
                    all_wires_i.push(wire_i);
                }
            }
            return all_wires_i;
        }
        throw new Error('Bad navigation in geometry data structure: ' + ent_type + index);
    }
    /**
     * Navigate from any level to the edges
     * @param ent_type
     * @param index
     */
    navAnyToEdge(ent_type, index) {
        if (id_1.isPosi(ent_type)) {
            const verts_i = this.navPosiToVert(index);
            return [].concat(...verts_i.map(vert_i => this.navVertToEdge(vert_i)));
        }
        else if (id_1.isVert(ent_type)) {
            return this.navVertToEdge(index);
        }
        else if (id_1.isTri(ent_type)) {
            return [];
        }
        else if (id_1.isEdge(ent_type)) {
            return [index];
        }
        else if (id_1.isWire(ent_type)) {
            return this.navWireToEdge(index);
        }
        else if (id_1.isFace(ent_type)) {
            const wires_i = this.navFaceToWire(index);
            return [].concat(...wires_i.map(wire_i => this.navWireToEdge(wire_i)));
        }
        else if (id_1.isPoint(ent_type)) {
            return [];
        }
        else if (id_1.isPline(ent_type)) {
            const wire_i = this.navPlineToWire(index);
            return this.navAnyToEdge(common_1.EEntType.WIRE, wire_i);
        }
        else if (id_1.isPgon(ent_type)) {
            const face_i = this.navPgonToFace(index);
            return this.navAnyToEdge(common_1.EEntType.FACE, face_i);
        }
        else if (id_1.isColl(ent_type)) {
            const all_edges_i = [];
            const plines_i = this.navCollToPline(index);
            for (const pline_i of plines_i) {
                const edges_i = this.navAnyToVert(common_1.EEntType.PLINE, pline_i);
                for (const edge_i of edges_i) {
                    all_edges_i.push(edge_i);
                }
            }
            const pgons_i = this.navCollToPgon(index);
            for (const pgon_i of pgons_i) {
                const edges_i = this.navAnyToVert(common_1.EEntType.PGON, pgon_i);
                for (const edge_i of edges_i) {
                    all_edges_i.push(edge_i);
                }
            }
            return all_edges_i;
        }
        throw new Error('Bad navigation in geometry data structure: ' + ent_type + index);
    }
    /**
     * Navigate from any level to the vertices
     * @param ent_type
     * @param index
     */
    navAnyToVert(ent_type, index) {
        if (id_1.isPosi(ent_type)) {
            return this.navPosiToVert(index);
        }
        else if (id_1.isVert(ent_type)) {
            return [index];
        }
        else if (id_1.isTri(ent_type)) {
            return this.navTriToVert(index);
        }
        else if (id_1.isEdge(ent_type)) {
            return this.navEdgeToVert(index);
        }
        else if (id_1.isWire(ent_type)) {
            return this.getWireVerts(index); // avoids duplicate verts
        }
        else if (id_1.isFace(ent_type)) {
            const wires_i = this.navFaceToWire(index);
            const verts_i = [];
            for (const wire_i of wires_i) {
                const wire_verts_i = this.getWireVerts(wire_i); // avoids duplicate verts
                for (const vert_i of wire_verts_i) {
                    verts_i.push(vert_i);
                }
            }
            return verts_i;
        }
        else if (id_1.isPoint(ent_type)) {
            return [this.navPointToVert(index)];
        }
        else if (id_1.isPline(ent_type)) {
            const wire_i = this.navPlineToWire(index);
            return this.navAnyToVert(common_1.EEntType.WIRE, wire_i);
        }
        else if (id_1.isPgon(ent_type)) {
            const face_i = this.navPgonToFace(index);
            return this.navAnyToVert(common_1.EEntType.FACE, face_i);
        }
        else if (id_1.isColl(ent_type)) {
            const all_verts_i = [];
            const points_i = this.navCollToPoint(index);
            for (const point_i of points_i) {
                const vert_i = this.navPointToVert(point_i);
                all_verts_i.push(vert_i);
            }
            const plines_i = this.navCollToPline(index);
            for (const pline_i of plines_i) {
                const verts_i = this.navAnyToVert(common_1.EEntType.PLINE, pline_i);
                for (const vert_i of verts_i) {
                    all_verts_i.push(vert_i);
                }
            }
            const pgons_i = this.navCollToPgon(index);
            for (const pgon_i of pgons_i) {
                const verts_i = this.navAnyToVert(common_1.EEntType.PGON, pgon_i);
                for (const vert_i of verts_i) {
                    all_verts_i.push(vert_i);
                }
            }
            return all_verts_i;
        }
        throw new Error('Bad navigation in geometry data structure: ' + ent_type + index);
    }
    /**
     * Navigate from any level to the triangles
     * @param ent_type
     * @param index
     */
    navAnyToTri(ent_type, index) {
        if (id_1.isPosi(ent_type)) {
            const verts_i = this.navPosiToVert(index);
            return [].concat(...verts_i.map(vert_i => this.navVertToTri(vert_i)));
        }
        else if (id_1.isVert(ent_type)) {
            return this.navVertToTri(index);
        }
        else if (id_1.isTri(ent_type)) {
            return [index];
        }
        else if (id_1.isEdge(ent_type)) {
            return [];
        }
        else if (id_1.isWire(ent_type)) {
            return [];
        }
        else if (id_1.isFace(ent_type)) {
            return this.navFaceToTri(index);
        }
        else if (id_1.isPoint(ent_type)) {
            return [];
        }
        else if (id_1.isPline(ent_type)) {
            return [];
        }
        else if (id_1.isPgon(ent_type)) {
            const face_i = this.navPgonToFace(index);
            return this.navFaceToTri(face_i);
        }
        else if (id_1.isColl(ent_type)) {
            const all_tris_i = [];
            const pgons_i = this.navCollToPgon(index);
            for (const pgon_i of pgons_i) {
                const tris_i = this.navAnyToTri(common_1.EEntType.PGON, pgon_i);
                for (const tri_i of tris_i) {
                    all_tris_i.push(tri_i);
                }
            }
            return all_tris_i;
        }
        throw new Error('Bad navigation in geometry data structure: ' + ent_type + index);
    }
    /**
     * Navigate from any level to the positions
     * @param ent_type
     * @param index
     */
    navAnyToPosi(ent_type, index) {
        if (id_1.isPosi(ent_type)) {
            return [index];
        }
        const verts_i = this.navAnyToVert(ent_type, index);
        const posis_i = verts_i.map(vert_i => this.navVertToPosi(vert_i));
        return Array.from(new Set(posis_i)); // remove duplicates
    }
    // ============================================================================
    // Navigate from any to any, general method
    // ============================================================================
    /**
     * Navigate from any level down to the positions
     * @param index
     */
    navAnyToAny(from_ets, to_ets, index) {
        // same level
        if (from_ets === to_ets) {
            return [index];
        }
        // from -> to
        switch (to_ets) {
            case common_1.EEntType.POSI:
                return this.navAnyToPosi(from_ets, index);
            case common_1.EEntType.VERT:
                return this.navAnyToVert(from_ets, index);
            case common_1.EEntType.EDGE:
                return this.navAnyToEdge(from_ets, index);
            case common_1.EEntType.WIRE:
                return this.navAnyToWire(from_ets, index);
            case common_1.EEntType.FACE:
                return this.navAnyToFace(from_ets, index);
            case common_1.EEntType.POINT:
                return this.navAnyToPoint(from_ets, index);
            case common_1.EEntType.PLINE:
                return this.navAnyToPline(from_ets, index);
            case common_1.EEntType.PGON:
                return this.navAnyToPgon(from_ets, index);
            case common_1.EEntType.COLL:
                return this.navAnyToColl(from_ets, index);
            default:
                throw new Error('Bad navigation in geometry data structure: ' + to_ets + index);
        }
    }
    // ============================================================================
    // Other methods
    // ============================================================================
    /**
     * Given a set of vertices, get the welded neighbour entities.
     * @param ent_type
     * @param verts_i
     */
    neighbor(ent_type, verts_i) {
        const neighbour_ents_i = new Set();
        for (const vert_i of verts_i) {
            const posi_i = this.navVertToPosi(vert_i);
            const found_verts_i = this.navPosiToVert(posi_i);
            for (const found_vert_i of found_verts_i) {
                if (verts_i.indexOf(found_vert_i) === -1) {
                    const found_ents_i = this.navAnyToAny(common_1.EEntType.VERT, ent_type, found_vert_i);
                    found_ents_i.forEach(found_ent_i => neighbour_ents_i.add(found_ent_i));
                }
            }
        }
        return Array.from(neighbour_ents_i);
    }
    /**
     * Given a set of edges, get the perimeter entities.
     * @param ent_type
     * @param edges_i
     */
    perimeter(ent_type, edges_i) {
        const edge_posis_map = new Map();
        const edge_to_posi_pairs_map = new Map();
        for (const edge_i of edges_i) {
            const posi_pair_i = this.navAnyToPosi(common_1.EEntType.EDGE, edge_i);
            if (!edge_posis_map.has(posi_pair_i[0])) {
                edge_posis_map.set(posi_pair_i[0], []);
            }
            edge_posis_map.get(posi_pair_i[0]).push(posi_pair_i[1]);
            edge_to_posi_pairs_map.set(edge_i, posi_pair_i);
        }
        const perimeter_ents_i = new Set();
        for (const edge_i of edges_i) {
            const posi_pair_i = edge_to_posi_pairs_map.get(edge_i);
            if (!edge_posis_map.has(posi_pair_i[1]) || edge_posis_map.get(posi_pair_i[1]).indexOf(posi_pair_i[0]) === -1) {
                const found_ents_i = this.navAnyToAny(common_1.EEntType.EDGE, ent_type, edge_i);
                found_ents_i.forEach(found_ent_i => perimeter_ents_i.add(found_ent_i));
            }
        }
        return Array.from(perimeter_ents_i);
    }
}
exports.GIGeomQuery = GIGeomQuery;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lHZW9tUXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlicy9nZW8taW5mby9HSUdlb21RdWVyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLHFDQUFtRjtBQUNuRiw2QkFBdUc7QUFFdkcsNkNBQThEO0FBQzlEOztHQUVHO0FBQ0gsTUFBYSxXQUFXO0lBR3BCOzs7T0FHRztJQUNILFlBQVksSUFBWSxFQUFFLFdBQXdCO1FBQzlDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDO0lBQ3BDLENBQUM7SUFDRCwrRUFBK0U7SUFDL0UsbUNBQW1DO0lBQ25DLCtFQUErRTtJQUMvRTs7O09BR0c7SUFDSSxPQUFPLENBQUMsUUFBa0IsRUFBRSxlQUF3QjtRQUN2RCx3REFBd0Q7UUFDeEQsSUFBSSxXQUFNLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDbEIsTUFBTSxLQUFLLEdBQWUsSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUM7WUFDM0QsTUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFDO1lBQzdCLElBQUksZUFBZSxFQUFFO2dCQUNqQixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztnQkFDdEMsT0FBTyxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFHO29CQUNwQixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3RCLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTt3QkFDZixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUNuQjt5QkFBTTt3QkFDSCxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTztxQkFDOUI7aUJBQ0o7YUFDSjtpQkFBTTtnQkFDSCxJQUFJLENBQUMs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