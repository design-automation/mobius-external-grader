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
function _rayFromPlane(planes) {
    if (id_1.getArrDepth(planes) === 2) {
        const plane = planes;
        return [plane[0], vectors_1.vecCross(plane[1], plane[2])];
    }
    else {
        return planes.map(plane => _rayFromPlane(plane));
    }
}
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
// ================================================================================================
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
// ================================================================================================
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
// ================================================================================================
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
// ================================================================================================
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
/**
 * Visualises a ray by creating a line.
 *
 * @param __model__
 * @param ray A list of two list of three coordinates [origin, vector]: [[x,y,z],[x',y',z']]
 * @returns entities, a line representing the ray.
 * @example ray1 = virtual.visRay([[1,2,3],[0,0,1]])
 */
function VisRay(__model__, ray, scale) {
    // --- Error Check ---
    const fn_name = 'virtual.visRay';
    _check_args_1.checkCommTypes(fn_name, 'ray', ray, [_check_args_1.TypeCheckObj.isRay]); // TODO rays can be a list // add isRayList to enable check
    _check_args_1.checkCommTypes(fn_name, 'scale', scale, [_check_args_1.TypeCheckObj.isNumber]);
    // --- Error Check ---
    return id_1.idsMake(_visRay(__model__, ray, scale));
}
exports.VisRay = VisRay;
// ================================================================================================
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
// ================================================================================================
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
/**
 * Visualises a bounding box by adding geometry to the model.
 *
 * @param __model__
 * @param bbox A list of lists.
 * @returns Entities, twelve polylines representing the box.
 * @example bbox1 = virtual.viBBox(position1, vector1, [0,1,0])
 * @example_info Creates a plane with position1 on it and normal = cross product of vector1 with y-axis.
 */
function VisBBox(__model__, bbox) {
    // --- Error Check ---
    const fn_name = 'virtual.visBBox';
    _check_args_1.checkCommTypes(fn_name, 'bbox', bbox, [_check_args_1.TypeCheckObj.isBBox]); // TODO bboxs can be a list // add isBBoxList to enable check
    // --- Error Check ---
    return id_1.idsMake(_visBBox(__model__, bbox));
}
exports.VisBBox = VisBBox;
// ================================================================================================
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL21vZHVsZXMvdmlydHVhbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7R0FPRzs7QUFFSDs7R0FFRztBQUVILHVEQUFtRztBQUNuRywrQ0FBbUY7QUFFbkYsK0NBQXdFO0FBQ3hFLHFEQUEwSTtBQUMxSSxpQ0FBaUM7QUFFakMsbUdBQW1HO0FBQ25HOzs7Ozs7Ozs7OztHQVdHO0FBRUgsU0FBZ0IsR0FBRyxDQUFDLFNBQWtCLEVBQUUsTUFBZ0IsRUFBRSxPQUFhO0lBQ25FLHNCQUFzQjtJQUN0QixNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUM7SUFDOUIsTUFBTSxRQUFRLEdBQUcsNEJBQWMsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLDBCQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUNwRiw0QkFBYyxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUMsMEJBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3JFLHNCQUFzQjtJQUN0QixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUN4QixNQUFNLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxHQUF1QixRQUE4QixDQUFDO1FBQzdFLE1BQU0sTUFBTSxHQUFXLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0UsTUFBTSxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUMxRDtJQUNELE9BQU87UUFDSCxNQUFNO1FBQ04saUJBQU8sQ0FBQyxPQUFPLENBQUM7S0FDbkIsQ0FBQztBQUNOLENBQUM7QUFmRCxrQkFlQztBQUNE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