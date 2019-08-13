"use strict";
/**
 * The `calc` module has functions for performing various types of calculations with entities in the model.
 * These functions neither make nor modify anything in the model.
 * These functions all return either numbers or lists of numbers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../../libs/geo-info/common");
const id_1 = require("../../libs/geo-info/id");
const distance_1 = require("../../libs/geom/distance");
const vectors_1 = require("../../libs/geom/vectors");
const triangulate_1 = require("../../libs/triangulate/triangulate");
const triangle_1 = require("../../libs/geom/triangle");
const _check_args_1 = require("./_check_args");
// ================================================================================================
/**
 * Calculates the distance between two positions.
 * @param __model__
 * @param entities1 First position.
 * @param entities2 Second position, or list of positions.
 * @param method Enum; distance or min_distance.
 * @returns Distance, or list of distances (if position2 is a list).
 * @example distance1 = calc.Distance (position1, position2, p_to_p_distance)
 * @example_info position1 = [0,0,0], position2 = [[0,0,10],[0,0,20]], Expected value of distance is [10,20].
 */
function Distance(__model__, entities1, entities2, method) {
    // --- Error Check ---
    const fn_name = 'calc.Distance';
    const ents_arr1 = _check_args_1.checkIDs(fn_name, 'position1', entities1, [_check_args_1.IDcheckObj.isID], [common_1.EEntType.POSI]);
    const ents_arr2 = _check_args_1.checkIDs(fn_name, 'position2', entities2, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.POSI]);
    // --- Error Check ---
    if (method === _EDistanceMethod.P_P_DISTANCE) {
        return _distancePtoP(__model__, ents_arr1, ents_arr2);
    }
    else if (method === _EDistanceMethod.MIN_DISTANCE) {
        return _distanceMin(__model__, ents_arr1, ents_arr2);
    }
}
exports.Distance = Distance;
var _EDistanceMethod;
(function (_EDistanceMethod) {
    _EDistanceMethod["P_P_DISTANCE"] = "p_to_p_distance";
    _EDistanceMethod["MIN_DISTANCE"] = "min_distance";
})(_EDistanceMethod = exports._EDistanceMethod || (exports._EDistanceMethod = {}));
function _distanceMin(__model__, ent_arr1, ents_arr2) {
    const depth2 = id_1.getArrDepth(ents_arr2);
    if (depth2 === 1) {
        throw Error('Not implemented');
    }
    else if (depth2 === 2) {
        return ents_arr2.map(ent_arr2 => _distanceMin(__model__, ent_arr1, ent_arr2));
    }
}
function _distancePtoP(__model__, ent_arr1, ents_arr2) {
    const depth2 = id_1.getArrDepth(ents_arr2);
    if (depth2 === 1) {
        const ent_arr2 = ents_arr2;
        const ps1_xyz = __model__.attribs.query.getPosiCoords(ent_arr1[1]);
        const ps2_xyz = __model__.attribs.query.getPosiCoords(ent_arr2[1]);
        return distance_1.distance(ps1_xyz, ps2_xyz);
    }
    else if (depth2 === 2) {
        return ents_arr2.map(ent_arr2 => _distancePtoP(__model__, ent_arr1, ent_arr2));
    }
}
// ================================================================================================
/**
 * Calculates the length of a line or a list of lines.
 * @param __model__
 * @param entities Edge, wire or polyline.
 * @returns Length.
 * @example length1 = calc.Length (line1)
 */
function Length(__model__, entities) {
    // --- Error Check ---
    _check_args_1.checkIDs('calc.Length', 'lines', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.EDGE, common_1.EEntType.WIRE, common_1.EEntType.PLINE]);
    // --- Error Check ---
    if (!Array.isArray(entities)) {
        entities = [entities];
    }
    const edges_i = [];
    let dist = 0;
    for (const line of entities) {
        const [ent_type, index] = id_1.idsBreak(line);
        if (id_1.isEdge(ent_type)) {
            edges_i.push(index);
        }
        else if (id_1.isWire(ent_type)) {
            edges_i.push(...__model__.geom.query.navWireToEdge(index));
        }
        else if (id_1.isPline(ent_type)) {
            const wire_i = __model__.geom.query.navPlineToWire(index);
            edges_i.push(...__model__.geom.query.navWireToEdge(wire_i));
        }
        else {
            throw new Error('Entity is of wrong type. Must be a an edge, a wire or a polyline');
        }
    }
    for (const edge_i of edges_i) {
        const posis_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.EDGE, edge_i);
        const xyz_0 = __model__.attribs.query.getPosiCoords(posis_i[0]);
        const xyz_1 = __model__.attribs.query.getPosiCoords(posis_i[1]);
        dist += distance_1.distance(xyz_0, xyz_1);
    }
    return dist;
}
exports.Length = Length;
// ================================================================================================
/**
 * Calculates the area of a surface or a list of surfaces.
 * @param __model__
 * @param entities A polygon, a face, a closed polyline, or a closed wire.
 * @returns Area.
 * @example area1 = calc.Area (surface1)
 */
function Area(__model__, entities) {
    // --- Error Check ---
    const fn_name = 'calc.Area';
    const ents_arr = _check_args_1.checkIDs(fn_name, 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.PGON, common_1.EEntType.FACE, common_1.EEntType.PLINE, common_1.EEntType.WIRE]);
    // --- Error Check ---
    return _area(__model__, ents_arr);
}
exports.Area = Area;
function _area(__model__, ents_arrs) {
    if (id_1.getArrDepth(ents_arrs) === 1) {
        const [ent_type, index] = ents_arrs;
        if (id_1.isPgon(ent_type) || id_1.isFace(ent_type)) {
            // faces, these are already triangulated
            let face_i = index;
            if (id_1.isPgon(ent_type)) {
                face_i = __model__.geom.query.navPgonToFace(index);
            }
            const tris_i = __model__.geom.query.navFaceToTri(face_i);
            let total_area = 0;
            for (const tri_i of tris_i) {
                const corners_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.TRI, tri_i);
                const corners_xyzs = corners_i.map(corner_i => __model__.attribs.query.getPosiCoords(corner_i));
                const tri_area = triangle_1.area(corners_xyzs[0], corners_xyzs[1], corners_xyzs[2]);
                total_area += tri_area;
            }
            return total_area;
        }
        else if (id_1.isPline(ent_type) || id_1.isWire(ent_type)) {
            // wires, these need to be triangulated
            let wire_i = index;
            if (id_1.isPline(ent_type)) {
                wire_i = __model__.geom.query.navPlineToWire(index);
            }
            if (!__model__.geom.query.istWireClosed(wire_i)) {
                throw new Error('To calculate area, wire must be closed');
            }
            const posis_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.WIRE, index);
            const xyzs = posis_i.map(posi_i => __model__.attribs.query.getPosiCoords(posi_i));
            const tris = triangulate_1.triangulate(xyzs);
            let total_area = 0;
            for (const tri of tris) {
                const corners_xyzs = tri.map(corner_i => xyzs[corner_i]);
                const tri_area = triangle_1.area(corners_xyzs[0], corners_xyzs[1], corners_xyzs[2]);
                total_area += tri_area;
            }
            return total_area;
        }
        else {
            return 0;
        }
    }
    else {
        return ents_arrs.map(ents_arr => _area(__model__, ents_arr));
    }
}
// ================================================================================================
/**
 * Returns a vector along an edge.
 * @param __model__
 * @param entities An edge
 * @returns The vector [x, y, z] from the start point of an edge to the end point of an edge.
 */
function Vector(__model__, entities) {
    // --- Error Check ---
    _check_args_1.checkIDs('calc.Vector', 'edge', entities, [_check_args_1.IDcheckObj.isID], [common_1.EEntType.EDGE]);
    // --- Error Check ---
    const [ent_type, index] = id_1.idsBreak(entities);
    const posis_i = __model__.geom.query.navAnyToPosi(ent_type, index);
    const start = __model__.attribs.query.getPosiCoords(posis_i[0]);
    const end = __model__.attribs.query.getPosiCoords(posis_i[1]);
    return vectors_1.vecSub(end, start);
}
exports.Vector = Vector;
// ================================================================================================
/**
 * Calculates the centroid of a list of any entity.
 * @param __model__
 * @param entities List of positions, vertices, points, edges, wires, polylines, faces, polygons, or collections.
 * @returns The centroid [x, y, z] of the entities. (No position is created in the model.)
 * @example centroid1 = calc.Centroid (polygon1)
 */
function Centroid(__model__, entities) {
    if (!Array.isArray(entities)) {
        entities = [entities];
    }
    const ents_arr = id_1.idsBreak(entities);
    // --- Error Check ---
    _check_args_1.checkIDs('calc.Centroid', 'geometry', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.POSI, common_1.EEntType.VERT, common_1.EEntType.POINT, common_1.EEntType.EDGE, common_1.EEntType.WIRE,
        common_1.EEntType.PLINE, common_1.EEntType.FACE, common_1.EEntType.PGON, common_1.EEntType.COLL]);
    // --- Error Check ---
    return _centroid(__model__, ents_arr);
}
exports.Centroid = Centroid;
function _centroid(__model__, ents_arr) {
    // TODO optimise this, like bounding box code
    const posis_i = [];
    for (const ent_arr of ents_arr) {
        posis_i.push(...__model__.geom.query.navAnyToPosi(ent_arr[0], ent_arr[1]));
    }
    const unique_posis_i = Array.from(new Set(posis_i));
    const unique_xyzs = unique_posis_i.map(posi_i => __model__.attribs.query.getPosiCoords(posi_i));
    return vectors_1.vecDiv(vectors_1.vecSum(unique_xyzs), unique_xyzs.length);
}
// ================================================================================================
/**
 * Calculates the normal vector of an entity or list of entities.
 * ~
 * For polygons, faces, and face wires the normal is calculated by taking the average of all the normals of the face triangles.
 * For polylines and polyline wires, the normal is calculated by triangulating the positions, and then
 * taking the average of all the normals of the triangles.
 * For edges, the normal is calculated by takingthe avery of teh normals of the two vertices.
 * For vertices, the normal is calculated by creating a triangle out of the two adjacent edges,
 * and then calculating the normal of the triangle.
 * (If there is only one edge, or if the two adjacent edges are colinear, the the normal of the wire is returned.)
 * For positions, the normal is calculated by taking the average of the normals of all the vertices linked to the position.
 * For points and positions with no vertices, the normal is [0, 0, 0].
 *
 * @param __model__
 * @param entities An entity, or list of entities.
 * @param scale The scale factor for the normal vector. (This is equivalent to the length of the normal vector.)
 * @returns The normal vector [x, y, z].
 * @example normal1 = calc.Normal (polygon1, 1)
 * @example_info If the input is non-planar, the output vector will be an average of all normals vector of the polygon triangles.
 */
function Normal(__model__, entities, scale) {
    const ents_arr = id_1.idsBreak(entities);
    // --- Error Check ---
    const fn_name = 'calc.Normal';
    _check_args_1.checkIDs(fn_name, 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], null);
    // --- Error Check ---
    return _normal(__model__, ents_arr, scale);
}
exports.Normal = Normal;
function _vertNormal(__model__, index) {
    let norm_vec;
    const edges_i = __model__.geom.query.navVertToEdge(index);
    if (edges_i.length === 1) {
        const posis0_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.EDGE, edges_i[0]);
        const posis1_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.EDGE, edges_i[1]);
        const p_mid = __model__.attribs.query.getPosiCoords(posis0_i[1]); // same as posis1_i[0]
        const p_a = __model__.attribs.query.getPosiCoords(posis0_i[0]);
        const p_b = __model__.attribs.query.getPosiCoords(posis1_i[1]);
        norm_vec = vectors_1.vecCross(vectors_1.vecFromTo(p_mid, p_a), vectors_1.vecFromTo(p_mid, p_b), true);
        if (vectors_1.vecLen(norm_vec) > 0) {
            return norm_vec;
        }
    }
    const wire_i = __model__.geom.query.navEdgeToWire(edges_i[0]);
    norm_vec = __model__.geom.query.getWireNormal(wire_i);
    return norm_vec;
}
function _normal(__model__, ents_arr, scale) {
    if (id_1.getArrDepth(ents_arr) === 1) {
        const ent_type = ents_arr[0];
        const index = ents_arr[1];
        if (id_1.isPgon(ent_type)) {
            const norm_vec = __model__.geom.query.getFaceNormal(__model__.geom.query.navPgonToFace(index));
            return vectors_1.vecMult(norm_vec, scale);
        }
        else if (id_1.isFace(ent_type)) {
            const norm_vec = __model__.geom.query.getFaceNormal(index);
            return vectors_1.vecMult(norm_vec, scale);
        }
        else if (id_1.isPline(ent_type)) {
            const norm_vec = __model__.geom.query.getWireNormal(__model__.geom.query.navPlineToWire(index));
            return vectors_1.vecMult(norm_vec, scale);
        }
        else if (id_1.isWire(ent_type)) {
            const norm_vec = __model__.geom.query.getWireNormal(index);
            return vectors_1.vecMult(norm_vec, scale);
        }
        else if (id_1.isEdge(ent_type)) {
            const verts_i = __model__.geom.query.navEdgeToVert(index);
            const norm_vecs = verts_i.map(vert_i => _vertNormal(__model__, vert_i));
            const norm_vec = vectors_1.vecDiv(vectors_1.vecSum(norm_vecs), norm_vecs.length);
            return vectors_1.vecMult(norm_vec, scale);
        }
        else if (id_1.isVert(ent_type)) {
            const norm_vec = _vertNormal(__model__, index);
            return vectors_1.vecMult(norm_vec, scale);
        }
        else if (id_1.isPosi(ent_type)) {
            const verts_i = __model__.geom.query.navPosiToVert(index);
            if (verts_i.length > 0) {
                const norm_vecs = verts_i.map(vert_i => _vertNormal(__model__, vert_i));
                const norm_vec = vectors_1.vecDiv(vectors_1.vecSum(norm_vecs), norm_vecs.length);
                return vectors_1.vecMult(norm_vec, scale);
            }
            return [0, 0, 0];
        }
        else if (id_1.isPoint(ent_type)) {
            return [0, 0, 0];
        }
    }
    else {
        return ents_arr.map(ent_arr => _normal(__model__, ent_arr, scale));
    }
}
exports._normal = _normal;
// ================================================================================================
/**
 * Calculates the xyz location on an entity, given a parameter.
 * @param __model__
 * @param entities Edge, wire, or polyline.
 * @param param A value between 0 to 1.
 * @returns The coordinates of the location, [x, y, z]. (No position is created in the model.)
 * @example coord1 = calc.ParamTToXyz (polyline1, 0.23)
 */
function Eval(__model__, entities, param) {
    // --- Error Check ---
    const fn_name = 'calc.ParamTToXyz';
    _check_args_1.checkIDs(fn_name, 'line', entities, [_check_args_1.IDcheckObj.isID], [common_1.EEntType.EDGE, common_1.EEntType.WIRE, common_1.EEntType.PLINE]);
    _check_args_1.checkCommTypes(fn_name, 't_param', param, [_check_args_1.TypeCheckObj.isNumber]);
    if (param < 0 || param > 1) {
        throw new Error(fn_name + ': ' + 't_param is not between 0 and 1');
    }
    // --- Error Check ---
    const edges_i = [];
    const [ent_type, index] = id_1.idsBreak(entities);
    if (id_1.isEdge(ent_type)) {
        edges_i.push(index);
    }
    else if (id_1.isWire(ent_type)) {
        edges_i.push(...__model__.geom.query.navWireToEdge(index));
    }
    else if (id_1.isPline(ent_type)) {
        const wire_i = __model__.geom.query.navPlineToWire(index);
        edges_i.push(...__model__.geom.query.navWireToEdge(wire_i));
    }
    // } else {
    //     throw new Error('Entity is of wrong type. Must be a an edge, a wire or a polyline');
    // }
    const num_edges = edges_i.length;
    // get all the edge lengths
    let total_dist = 0;
    const dists = [];
    const xyz_pairs = [];
    for (const edge_i of edges_i) {
        const posis_i = __model__.geom.query.navAnyToPosi(common_1.EEntType.EDGE, edge_i);
        const xyz_0 = __model__.attribs.query.getPosiCoords(posis_i[0]);
        const xyz_1 = __model__.attribs.query.getPosiCoords(posis_i[1]);
        const dist = distance_1.distance(xyz_0, xyz_1);
        total_dist += dist;
        dists.push(total_dist);
        xyz_pairs.push([xyz_0, xyz_1]);
    }
    // map the t_param
    const t_param_mapped = param * total_dist;
    // loop through and find the point
    for (let i = 0; i < num_edges; i++) {
        if (t_param_mapped < dists[i]) {
            const xyz_pair = xyz_pairs[i];
            let dist_a = 0;
            if (i > 0) {
                dist_a = dists[i - 1];
            }
            const dist_b = dists[i];
            const edge_length = dist_b - dist_a;
            const to_t = t_param_mapped - dist_a;
            const vec_len = to_t / edge_length;
            return vectors_1.vecAdd(xyz_pair[0], vectors_1.vecMult(vectors_1.vecSub(xyz_pair[1], xyz_pair[0]), vec_len));
        }
    }
    // t param must be 1 (or greater)
    return xyz_pairs[num_edges - 1][1];
}
exports.Eval = Eval;
// ================================================================================================
/**
 * Calculates the 't' parameter along a linear entity, given a location.
 * The 't' parameter varies between 0 and 1, where 0 indicates the start and 1 indicates the end.
 *
 * @param __model__
 * @param lines List of edges, wires, or polylines.
 * @param locations List of positions, vertices, points, or coordinates.
 * @return The 't' parameter vale, between 0 and 1.
 * @example coord1 = calc.ParamXyzToT (polyline1, [1,2,3])
 */
function _ParamXyzToT(__model__, lines, locations) {
    // --- Error Check ---
    // const fn_name = 'calc.ParamXyzToT';
    // checkIDs(fn_name, 'lines', lines, [IDcheckObj.isID, IDcheckObj.isIDList], [EEntType.EDGE, EEntType.WIRE, EEntType.PLINE]);
    // checkIDnTypes(fn_name, 'locations', locations,
    //               [IDcheckObj.isID, IDcheckObj.isIDList, TypeCheckObj.isNumberList], [EEntType.POSI, EEntType.VERT, EEntType.POINT]);
    // --- Error Check ---
    throw new Error('Not implemented.');
    return null;
}
exports._ParamXyzToT = _ParamXyzToT;
// ================================================================================================
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL21vZHVsZXMvY2FsYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7QUFPSCx1REFBOEU7QUFDOUUsK0NBQWlJO0FBQ2pJLHVEQUFvRDtBQUNwRCxxREFBK0c7QUFDL0csb0VBQWlFO0FBQ2pFLHVEQUF3RDtBQUN4RCwrQ0FBaUc7QUFFakcsbUdBQW1HO0FBQ25HOzs7Ozs7Ozs7R0FTRztBQUNILFNBQWdCLFFBQVEsQ0FBQyxTQUFrQixFQUFFLFNBQWMsRUFBRSxTQUFvQixFQUFFLE1BQXdCO0lBQ3ZHLHNCQUFzQjtJQUN0QixNQUFNLE9BQU8sR0FBRyxlQUFlLENBQUM7SUFDaEMsTUFBTSxTQUFTLEdBQUcsc0JBQVEsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxDQUFDLHdCQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxpQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFpQixDQUFDO0lBQ2hILE1BQU0sU0FBUyxHQUFHLHNCQUFRLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsQ0FBQyx3QkFBVSxDQUFDLElBQUksRUFBRSx3QkFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsaUJBQVEsQ0FBQyxJQUFJLENBQUMsQ0FDMUYsQ0FBQztJQUMxQixzQkFBc0I7SUFDdEIsSUFBSSxNQUFNLEtBQUssZ0JBQWdCLENBQUMsWUFBWSxFQUFFO1FBQzFDLE9BQU8sYUFBYSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDekQ7U0FBTSxJQUFJLE1BQU0sS0FBSyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUU7UUFDakQsT0FBTyxZQUFZLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztLQUN4RDtBQUNMLENBQUM7QUFaRCw0QkFZQztBQUNELElBQVksZ0JBR1g7QUFI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