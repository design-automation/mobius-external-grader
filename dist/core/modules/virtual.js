"use strict";
/**
 * The `virtual` module has functions for creating virtual geometric constructs.
 * They are called 'virtual' due to the fact that they are not saved in the model.
 * Currently there are two types of virtual constructs: planes and rays.
 * Most of these functions neither make nor modify anything in the model.
 * The exception is the `Vis` functions, that generate some polylines and polygons in the model
 * to aid with visualizing these virtual constructs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *
 */
const common_1 = require("../../libs/geo-info/common");
const _check_args_1 = require("./_check_args");
const id_1 = require("../../libs/geo-info/id");
const vectors_1 = require("../../libs/geom/vectors");
const calc_1 = require("./calc");
// ================================================================================================
/**
 * Creates a ray, centered at the origin.
 * A ray is defined by a list of two lists, as follows: [origin, direction_vector].
 *
 * @param __model__
 * @param origin Origin of ray: Position, Vertex, Point, or a list of three numbers
 * @param dir_vec Direction of Ray: Vector, or list of three numbers
 * @returns A list consisting of an origin and a vector, [origin, vector].
 * @example virtual.Ray([1,2,3],[4,3,2])
 * @example_info Creates a ray from [1,2,3] with the vector [4,3,2].
 *
 */
function Ray(__model__, origin, dir_vec) {
    // --- Error Check ---
    const fn_name = 'virtual.Ray';
    const ents_arr = _check_args_1.checkCommTypes(fn_name, 'origin', origin, [_check_args_1.TypeCheckObj.isOrigin]);
    _check_args_1.checkCommTypes(fn_name, 'dir_vec', dir_vec, [_check_args_1.TypeCheckObj.isVector]);
    // --- Error Check ---
    if (!Array.isArray(origin)) {
        const [ent_type, index] = ents_arr;
        const posi_i = __model__.geom.query.navAnyToPosi(ent_type, index)[0];
        origin = __model__.attribs.query.getPosiCoords(posi_i);
    }
    return [
        origin,
        vectors_1.vecNorm(dir_vec)
    ];
}
exports.Ray = Ray;
// ================================================================================================
/**
 * Creates a plane, centered at the origin.
 * A plane is define by a list of three lists, as folows: [origin, x_vector, y_vector].
 *
 * @param __model__
 * @param origin Origin of plane: Position, Vertex, Point, or a list of three numbers
 * @param x_vec X vector of the plane: List of three numbers
 * @param xy_vec A vector in the xy plane (parallel to teh x vector): List of three numbers
 * @returns A list consisting of an origin and two vectors, [origin, vector, vector].
 * @example virtual.Plane ([1,2,3],[4,3,2],[3,3,9])
 * @example_info Creates a plane with its origin positioned at [1,2,3] and two vectors [4,3,2] and [3,3,9] lie on it.
 */
function Plane(__model__, origin, x_vec, xy_vec) {
    // --- Error Check ---
    const fn_name = 'virtual.Plane';
    const ents_arr = _check_args_1.checkCommTypes(fn_name, 'origin', origin, [_check_args_1.TypeCheckObj.isOrigin]);
    _check_args_1.checkCommTypes(fn_name, 'x_vec', x_vec, [_check_args_1.TypeCheckObj.isVector]);
    _check_args_1.checkCommTypes(fn_name, 'xy_vec', xy_vec, [_check_args_1.TypeCheckObj.isVector]);
    // --- Error Check ---
    if (!Array.isArray(origin)) {
        const [ent_type, index] = ents_arr;
        const posi_i = __model__.geom.query.navAnyToPosi(ent_type, index)[0];
        origin = __model__.attribs.query.getPosiCoords(posi_i);
    }
    return [
        origin,
        vectors_1.vecNorm(x_vec),
        vectors_1.vecNorm(vectors_1.vecMakeOrtho(xy_vec, x_vec))
    ];
}
exports.Plane = Plane;
// ================================================================================================
/**
 * Create a ray, from a plane.
 * The direction will be along the z axis.
 * A plane is define by a list of three lists, as folows: [origin, x_vector, y_vector].
 * A ray is defined by a list of two lists, as follows: [origin, direction_vector].
 *
 * @param __model__
 * @param plane Plane or list of planes.
 * @returns Ray or list of rays.
 */
function RayFromPlane(planes) {
    // --- Error Check ---
    // checkCommTypes('virtual.RayFromPlane', 'origin', planes, [TypeCheckObj.isPlane]); //TODO accept a list of planes
    // TODO allow list of planes
    // --- Error Check ---
    return _rayFromPlane(planes);
}
exports.RayFromPlane = RayFromPlane;
function _rayFromPlane(planes) {
    if (id_1.getArrDepth(planes) === 2) {
        const plane = planes;
        return [plane[0], vectors_1.vecCross(plane[1], plane[2])];
    }
    else {
        return planes.map(plane => _rayFromPlane(plane));
    }
}
// ================================================================================================
/**
 * Returns a ray for an edge, a face, or a polygons. For edges, it returns a ray along the edge, from teh start vertex to the end vertex
 * For a face or polygon, it returns the ray that is the z-axis of the plane.
 * ~
 * For an edge, the ray vector is not normalised. For a face or polygon, the ray vector is normalised.
 *
 * @param __model__
 * @param entities An edge, a face, or a polygon, or a list.
 * @returns The ray.
 */
function GetRay(__model__, entities) {
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('virtual.GetRay', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], [common_1.EEntType.EDGE, common_1.EEntType.FACE, common_1.EEntType.PGON]);
    // --- Error Check ---
    return _getRay(__model__, ents_arr);
}
exports.GetRay = GetRay;
function _getRayFromEdge(__model__, ent_arr) {
    const posis_i = __model__.geom.query.navAnyToPosi(ent_arr[0], ent_arr[1]);
    const xyzs = posis_i.map(posi_i => __model__.attribs.query.getPosiCoords(posi_i));
    return [xyzs[0], vectors_1.vecSub(xyzs[1], xyzs[0])];
}
function _getRayFromFace(__model__, ent_arr) {
    const plane = _getPlane(__model__, ent_arr);
    return _rayFromPlane(plane);
}
function _getRay(__model__, ents_arr) {
    if (id_1.getArrDepth(ents_arr) === 1) {
        const ent_arr = ents_arr;
        if (ent_arr[0] === common_1.EEntType.EDGE) {
            return _getRayFromEdge(__model__, ent_arr);
        }
        else if (ent_arr[0] === common_1.EEntType.FACE) {
            return _getRayFromFace(__model__, ent_arr);
        }
        else { // must be a polygon
            const face_i = __model__.geom.query.navPgonToFace(ent_arr[1]);
            return _getRayFromFace(__model__, [common_1.EEntType.FACE, face_i]);
        }
    }
    else {
        return ents_arr.map(ent_arr => _getRay(__model__, ent_arr));
    }
}
// ================================================================================================
/**
 * Returns a plane from a polygon, a face, a polyline, or a wire.
 * For polylines or wires, there must be at least three non-colinear vertices.
 * ~
 * The winding order is counter-clockwise.
 * This means that if the vertices are ordered counter-clockwise relative to your point of view,
 * then the z axis of the plane will be pointing towards you.
 *
 * @param entities Any entities
 * @returns The plane.
 */
function GetPlane(__model__, entities) {
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('virtual.GetPlane', 'entities', entities, [_check_args_1.IDcheckObj.isID, _check_args_1.IDcheckObj.isIDList], null); // takes in any
    // TODO [EEntType.PGON, EEntType.FACE, EEntType.PLINE, EEntType.WIRE]);
    // --- Error Check ---
    return _getPlane(__model__, ents_arr);
}
exports.GetPlane = GetPlane;
function _getPlane(__model__, ents_arr) {
    if (id_1.getArrDepth(ents_arr) === 1) {
        const ent_arr = ents_arr;
        const posis_i = __model__.geom.query.navAnyToPosi(ent_arr[0], ent_arr[1]);
        const unique_posis_i = Array.from(new Set(posis_i));
        if (unique_posis_i.length < 3) {
            throw new Error('Too few points to calculate plane.');
        }
        const unique_xyzs = unique_posis_i.map(posi_i => __model__.attribs.query.getPosiCoords(posi_i));
        const origin = vectors_1.vecDiv(vectors_1.vecSum(unique_xyzs), unique_xyzs.length);
        // const normal: Txyz = newellNorm(unique_xyzs);
        const normal = calc_1._normal(__model__, ent_arr, 1);
        const x_vec = vectors_1.vecNorm(vectors_1.vecFromTo(unique_xyzs[0], unique_xyzs[1]));
        const y_vec = vectors_1.vecCross(normal, x_vec); // must be z-axis, x-axis
        return [origin, x_vec, y_vec];
    }
    else {
        return ents_arr.map(ent_arr => _getPlane(__model__, ent_arr));
    }
}
// ================================================================================================
/**
 * Returns the bounding box of the entities.
 * The bounding box is an imaginary box that completley contains all the geometry.
 * The box is always aligned with the global x, y, and z axes.
 * The bounding box consists of a list of lists, as follows [[x, y, z], [x, y, z], [x, y, z], [x, y, z]].
 * - The first [x, y, z] is the coordinates of the centre of the bounding box.
 * - The second [x, y, z] is the corner of the bounding box with the lowest x, y, z values.
 * - The third [x, y, z] is the corner of the bounding box with the highest x, y, z values.
 * - The fourth [x, y, z] is the dimensions of the bounding box.
 * @param __model__
 * @param entities The etities for which to calculate the bounding box.
 * @returns The bounding box consisting of a list of four lists.
 */
function GetBBox(__model__, entities) {
    if (!Array.isArray(entities)) {
        entities = [entities];
    }
    // --- Error Check ---
    const ents_arr = _check_args_1.checkIDs('virtual.BBox', 'entities', entities, [_check_args_1.IDcheckObj.isIDList], null); // all
    // --- Error Check ---
    return _getBoundingBox(__model__, ents_arr);
}
exports.GetBBox = GetBBox;
function _getBoundingBox(__model__, ents_arr) {
    const posis_set_i = new Set();
    for (const ent_arr of ents_arr) {
        const ent_posis_i = __model__.geom.query.navAnyToPosi(ent_arr[0], ent_arr[1]);
        for (const ent_posi_i of ent_posis_i) {
            posis_set_i.add(ent_posi_i);
        }
    }
    const unique_posis_i = Array.from(posis_set_i);
    const unique_xyzs = unique_posis_i.map(posi_i => __model__.attribs.query.getPosiCoords(posi_i));
    const corner_min = [Infinity, Infinity, Infinity];
    const corner_max = [-Infinity, -Infinity, -Infinity];
    for (const unique_xyz of unique_xyzs) {
        if (unique_xyz[0] < corner_min[0]) {
            corner_min[0] = unique_xyz[0];
        }
        if (unique_xyz[1] < corner_min[1]) {
            corner_min[1] = unique_xyz[1];
        }
        if (unique_xyz[2] < corner_min[2]) {
            corner_min[2] = unique_xyz[2];
        }
        if (unique_xyz[0] > corner_max[0]) {
            corner_max[0] = unique_xyz[0];
        }
        if (unique_xyz[1] > corner_max[1]) {
            corner_max[1] = unique_xyz[1];
        }
        if (unique_xyz[2] > corner_max[2]) {
            corner_max[2] = unique_xyz[2];
        }
    }
    return [
        [(corner_min[0] + corner_max[0]) / 2, (corner_min[1] + corner_max[1]) / 2, (corner_min[2] + corner_max[2]) / 2],
        corner_min,
        corner_max,
        [corner_max[0] - corner_min[0], corner_max[1] + corner_min[1], corner_max[2] + corner_min[2]]
    ];
}
// ================================================================================================
/**
 * Visualises a ray by creating a line.
 *
 * @param __model__
 * @param rays A list of two list of three coordinates [origin, vector]: [[x,y,z],[x',y',z']]
 * @returns entities, a line representing the ray.
 * @example ray1 = virtual.visRay([[1,2,3],[0,0,1]])
 */
function VisRay(__model__, rays, scale) {
    // --- Error Check ---
    const fn_name = 'virtual.visRay';
    _check_args_1.checkCommTypes(fn_name, 'ray', rays, [_check_args_1.TypeCheckObj.isRay]); // TODO rays can be a list // add isRayList to enable check
    _check_args_1.checkCommTypes(fn_name, 'scale', scale, [_check_args_1.TypeCheckObj.isNumber]);
    // --- Error Check ---
    return id_1.idsMake(_visRay(__model__, rays, scale));
}
exports.VisRay = VisRay;
function _visRay(__model__, rays, scale) {
    if (id_1.getArrDepth(rays) === 2) {
        const ray = rays;
        const origin = ray[0];
        const vec = vectors_1.vecMult(ray[1], scale);
        const end = vectors_1.vecAdd(origin, vec);
        // create orign point
        const origin_posi_i = __model__.geom.add.addPosi();
        __model__.attribs.add.setPosiCoords(origin_posi_i, origin);
        const point_i = __model__.geom.add.addPoint(origin_posi_i);
        // create pline
        const end_posi_i = __model__.geom.add.addPosi();
        __model__.attribs.add.setPosiCoords(end_posi_i, end);
        const pline_i = __model__.geom.add.addPline([origin_posi_i, end_posi_i]);
        // return the geometry IDs
        return [
            [common_1.EEntType.POINT, point_i],
            [common_1.EEntType.PLINE, pline_i]
        ];
    }
    else {
        const ents_arr = [];
        for (const ray of rays) {
            const ray_ents = _visRay(__model__, ray, scale);
            for (const ray_ent of ray_ents) {
                ents_arr.push(ray_ent);
            }
        }
        return ents_arr;
    }
}
// ================================================================================================
/**
 * Visualises a plane by creating a polygon and axis lines.
 *
 * @param __model__
 * @param plane A list of lists
 * @returns Entities, a polygon and two polyline representing the plane.
 * @example plane1 = virtual.visPlane(position1, vector1, [0,1,0])
 * @example_info Creates a plane with position1 on it and normal = cross product of vector1 with y-axis.
 */
function VisPlane(__model__, planes, scale) {
    // --- Error Check ---
    const fn_name = 'virtual.visPlane';
    _check_args_1.checkCommTypes(fn_name, 'planes', planes, [_check_args_1.TypeCheckObj.isPlane]); // TODO planes can be a list // add isPlaneList to enable check
    _check_args_1.checkCommTypes(fn_name, 'scale', scale, [_check_args_1.TypeCheckObj.isNumber]);
    // --- Error Check ---
    return id_1.idsMake(_visPlane(__model__, planes, scale));
}
exports.VisPlane = VisPlane;
function _visPlane(__model__, planes, scale) {
    if (id_1.getArrDepth(planes) === 2) {
        const plane = planes;
        const origin = plane[0];
        const x_vec = vectors_1.vecMult(plane[1], scale);
        const y_vec = vectors_1.vecMult(plane[2], scale);
        let x_end = vectors_1.vecAdd(origin, x_vec);
        let y_end = vectors_1.vecAdd(origin, y_vec);
        const z_end = vectors_1.vecAdd(origin, vectors_1.vecMult(vectors_1.vecCross(x_vec, y_vec), 0.1));
        const plane_corners = [
            vectors_1.vecAdd(x_end, y_vec),
            vectors_1.vecSub(y_end, x_vec),
            vectors_1.vecSub(vectors_1.vecSub(origin, x_vec), y_vec),
            vectors_1.vecSub(x_end, y_vec),
        ];
        x_end = vectors_1.vecAdd(x_end, vectors_1.vecMult(x_vec, 0.1));
        y_end = vectors_1.vecSub(y_end, vectors_1.vecMult(y_vec, 0.1));
        // create the point
        const origin_posi_i = __model__.geom.add.addPosi();
        __model__.attribs.add.setPosiCoords(origin_posi_i, origin);
        const point_i = __model__.geom.add.addPoint(origin_posi_i);
        // create the x axis
        const x_end_posi_i = __model__.geom.add.addPosi();
        __model__.attribs.add.setPosiCoords(x_end_posi_i, x_end);
        const x_pline_i = __model__.geom.add.addPline([origin_posi_i, x_end_posi_i]);
        // create the y axis
        const y_end_posi_i = __model__.geom.add.addPosi();
        __model__.attribs.add.setPosiCoords(y_end_posi_i, y_end);
        const y_pline_i = __model__.geom.add.addPline([origin_posi_i, y_end_posi_i]);
        // create the z axis
        const z_end_posi_i = __model__.geom.add.addPosi();
        __model__.attribs.add.setPosiCoords(z_end_posi_i, z_end);
        const z_pline_i = __model__.geom.add.addPline([origin_posi_i, z_end_posi_i]);
        // create pline for plane
        const corner_posis_i = [];
        for (const corner of plane_corners) {
            const posi_i = __model__.geom.add.addPosi();
            __model__.attribs.add.setPosiCoords(posi_i, corner);
            corner_posis_i.push(posi_i);
        }
        const plane_i = __model__.geom.add.addPline(corner_posis_i, true);
        // return the geometry IDs
        return [
            [common_1.EEntType.POINT, point_i],
            [common_1.EEntType.PLINE, x_pline_i],
            [common_1.EEntType.PLINE, y_pline_i],
            [common_1.EEntType.PLINE, z_pline_i],
            [common_1.EEntType.PLINE, plane_i]
        ];
    }
    else {
        const ents_arr = [];
        for (const plane of planes) {
            const plane_ents = _visPlane(__model__, plane, scale);
            for (const plane_ent of plane_ents) {
                ents_arr.push(plane_ent);
            }
        }
        return ents_arr;
    }
}
// ================================================================================================
/**
 * Visualises a bounding box by adding geometry to the model.
 *
 * @param __model__
 * @param bboxes A list of lists.
 * @returns Entities, twelve polylines representing the box.
 * @example bbox1 = virtual.viBBox(position1, vector1, [0,1,0])
 * @example_info Creates a plane with position1 on it and normal = cross product of vector1 with y-axis.
 */
function VisBBox(__model__, bboxes) {
    // --- Error Check ---
    const fn_name = 'virtual.visBBox';
    _check_args_1.checkCommTypes(fn_name, 'bbox', bboxes, [_check_args_1.TypeCheckObj.isBBox]); // TODO bboxs can be a list // add isBBoxList to enable check
    // --- Error Check ---
    return id_1.idsMake(_visBBox(__model__, bboxes));
}
exports.VisBBox = VisBBox;
function _visBBox(__model__, bboxs) {
    if (id_1.getArrDepth(bboxs) === 2) {
        const bbox = bboxs;
        const min = bbox[1];
        const max = bbox[2];
        // bottom
        const ps0 = __model__.geom.add.addPosi();
        __model__.attribs.add.setPosiCoords(ps0, min);
        const ps1 = __model__.geom.add.addPosi();
        __model__.attribs.add.setPosiCoords(ps1, [max[0], min[1], min[2]]);
        const ps2 = __model__.geom.add.addPosi();
        __model__.attribs.add.setPosiCoords(ps2, [max[0], max[1], min[2]]);
        const ps3 = __model__.geom.add.addPosi();
        __model__.attribs.add.setPosiCoords(ps3, [min[0], max[1], min[2]]);
        // top
        const ps4 = __model__.geom.add.addPosi();
        __model__.attribs.add.setPosiCoords(ps4, [min[0], min[1], max[2]]);
        const ps5 = __model__.geom.add.addPosi();
        __model__.attribs.add.setPosiCoords(ps5, [max[0], min[1], max[2]]);
        const ps6 = __model__.geom.add.addPosi();
        __model__.attribs.add.setPosiCoords(ps6, max);
        const ps7 = __model__.geom.add.addPosi();
        __model__.attribs.add.setPosiCoords(ps7, [min[0], max[1], max[2]]);
        // plines bottom
        const pl0 = __model__.geom.add.addPline([ps0, ps1]);
        const pl1 = __model__.geom.add.addPline([ps1, ps2]);
        const pl2 = __model__.geom.add.addPline([ps2, ps3]);
        const pl3 = __model__.geom.add.addPline([ps3, ps0]);
        // plines top
        const pl4 = __model__.geom.add.addPline([ps4, ps5]);
        const pl5 = __model__.geom.add.addPline([ps5, ps6]);
        const pl6 = __model__.geom.add.addPline([ps6, ps7]);
        const pl7 = __model__.geom.add.addPline([ps7, ps4]);
        // plines vertical
        const pl8 = __model__.geom.add.addPline([ps0, ps4]);
        const pl9 = __model__.geom.add.addPline([ps1, ps5]);
        const pl10 = __model__.geom.add.addPline([ps2, ps6]);
        const pl11 = __model__.geom.add.addPline([ps3, ps7]);
        // return
        return [pl0, pl1, pl2, pl3, pl4, pl5, pl6, pl7, pl8, pl9, pl10, pl11].map(pl => [common_1.EEntType.PLINE, pl]);
    }
    else {
        const ents_arr = [];
        for (const bbox of bboxs) {
            const bbox_ents = _visBBox(__model__, bbox);
            for (const bbox_ent of bbox_ents) {
                ents_arr.push(bbox_ent);
            }
        }
        return ents_arr;
    }
}
// ================================================================================================
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL21vZHVsZXMvdmlydHVhbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7R0FPRzs7QUFFSDs7R0FFRztBQUVILHVEQUFtRztBQUNuRywrQ0FBbUY7QUFFbkYsK0NBQXdFO0FBQ3hFLHFEQUEwSTtBQUMxSSxpQ0FBaUM7QUFFakMsbUdBQW1HO0FBQ25HOzs7Ozs7Ozs7OztHQVdHO0FBRUgsU0FBZ0IsR0FBRyxDQUFDLFNBQWtCLEVBQUUsTUFBZ0IsRUFBRSxPQUFhO0lBQ25FLHNCQUFzQjtJQUN0QixNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUM7SUFDOUIsTUFBTSxRQUFRLEdBQUcsNEJBQWMsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLDBCQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUNwRiw0QkFBYyxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUMsMEJBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3JFLHNCQUFzQjtJQUN0QixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUN4QixNQUFNLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxHQUF1QixRQUE4QixDQUFDO1FBQzdFLE1BQU0sTUFBTSxHQUFXLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0UsTUFBTSxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUMxRDtJQUNELE9BQU87UUFDSCxNQUFNO1FBQ04saUJBQU8sQ0FBQyxPQUFPLENBQUM7S0FDbkIsQ0FBQztBQUNOLENBQUM7QUFmRCxrQkFlQztBQUNE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QUFDLENBQUMsQ0FBQyxFQUFFO1lBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUFFO1FBQ3JFLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FBRTtRQUNyRSxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQUU7UUFDckUsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUFFO1FBQ3JFLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FBRTtLQUN4RTtJQUNELE9BQU87UUFDSCxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9HLFVBQVU7UUFDVixVQUFVO1FBQ1YsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMs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