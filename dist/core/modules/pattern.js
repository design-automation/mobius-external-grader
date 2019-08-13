"use strict";
/**
 * The `pattern` module has functions for creating patters of positions in the model.
 * All these functions all return lists of position IDs.
 * The list may be nested, depending on which function is selected.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *
 */
const _check_args_1 = require("./_check_args");
const common_1 = require("../../libs/geo-info/common");
const id_1 = require("../../libs/geo-info/id");
const vectors_1 = require("../../libs/geom/vectors");
const matrix_1 = require("../../libs/geom/matrix");
// ================================================================================================
/**
 * Creates four positions in a rectangle pattern, and returns the list of new positions.
 * @param __model__
 * @param origin XYZ coordinates as a list of three numbers.
 * @param size Size of rectangle. If number, assume square of that length; if list of two numbers, x and y lengths respectively.
 * @returns Entities, a list of four positions.
 * @example coordinates1 = pattern.Rectangle([0,0,0], 10)
 * @example_info Creates a list of 4 coords, being the vertices of a 10 by 10 square.
 * @example coordinates1 = pattern.Rectangle([0,0,0], [10,20])
 * @example_info Creates a list of 4 coords, being the vertices of a 10 by 20 rectangle.
 */
function Rectangle(__model__, origin, size) {
    // --- Error Check ---
    const fn_name = 'pattern.Rectangle';
    _check_args_1.checkCommTypes(fn_name, 'origin', origin, [_check_args_1.TypeCheckObj.isCoord, _check_args_1.TypeCheckObj.isPlane]);
    _check_args_1.checkCommTypes(fn_name, 'size', size, [_check_args_1.TypeCheckObj.isNumber, _check_args_1.TypeCheckObj.isXYlist]);
    // --- Error Check ---
    // create the matrix one time
    let matrix;
    const origin_is_plane = id_1.getArrDepth(origin) === 2;
    if (origin_is_plane) {
        matrix = matrix_1.xfromSourceTargetMatrix(common_1.XYPLANE, origin);
    }
    // create the positions
    const posis_i = [];
    const xy_size = (Array.isArray(size) ? size : [size, size]);
    const coords = [
        [-(xy_size[0] / 2), -(xy_size[1] / 2), 0],
        [(xy_size[0] / 2), -(xy_size[1] / 2), 0],
        [(xy_size[0] / 2), (xy_size[1] / 2), 0],
        [-(xy_size[0] / 2), (xy_size[1] / 2), 0]
    ];
    for (const coord of coords) {
        let xyz = coord;
        if (origin_is_plane) {
            xyz = matrix_1.multMatrix(xyz, matrix);
        }
        else { // we have a plane
            xyz = vectors_1.vecAdd(xyz, origin);
        }
        const posi_i = __model__.geom.add.addPosi();
        __model__.attribs.add.setPosiCoords(posi_i, xyz);
        posis_i.push(posi_i);
    }
    // return
    return id_1.idsMakeFromIndicies(common_1.EEntType.POSI, posis_i);
}
exports.Rectangle = Rectangle;
// ================================================================================================
/**
* Creates positions in a grid pattern, and returns the list (or list of lists) of new positions.
* @param __model__
* @param origin XYZ coordinates as a list of three numbers.
* @param size Size of grid. If number, assume square grid of that length; if list of two numbers, x and y lengths respectively.
* @param num_positions Number of positions.
* @param method Enum, define the way the coords will be return as lists.
* If integer, same number for x and y; if list of two numbers, number for x and y respectively.
* @returns Entities, a list of positions, or a list of lists of positions (depending on the 'method' setting).
* @example coordinates1 = pattern.Grid([0,0,0], 10, 3)
* @example_info Creates a list of 9 XYZ coordinates on a 3x3 square grid of length 10.
* @example coordinates1 = pattern.Grid([0,0,0], [10,20], [2,4])
* @example_info Creates a list of 8 XYZ coordinates on a 2x4 grid of length 10 by 20.
*/
function Grid(__model__, origin, size, num_positions, method) {
    // --- Error Check ---
    const fn_name = 'pattern.Grid';
    _check_args_1.checkCommTypes(fn_name, 'origin', origin, [_check_args_1.TypeCheckObj.isCoord, _check_args_1.TypeCheckObj.isPlane]);
    _check_args_1.checkCommTypes(fn_name, 'size', size, [_check_args_1.TypeCheckObj.isNumber, _check_args_1.TypeCheckObj.isXYlist]);
    _check_args_1.checkCommTypes(fn_name, 'num_positions', num_positions, [_check_args_1.TypeCheckObj.isInt, _check_args_1.TypeCheckObj.isXYlistInt]);
    // --- Error Check ---
    // create the matrix one time
    let matrix;
    const origin_is_plane = id_1.getArrDepth(origin) === 2;
    if (origin_is_plane) {
        matrix = matrix_1.xfromSourceTargetMatrix(common_1.XYPLANE, origin);
    }
    // create the positions
    const posis_i = [];
    const xy_size = (Array.isArray(size) ? size : [size, size]);
    const xy_num_positions = (Array.isArray(num_positions) ? num_positions : [num_positions, num_positions]);
    const x_offset = xy_size[0] / (xy_num_positions[0] - 1);
    const y_offset = xy_size[1] / (xy_num_positions[1] - 1);
    for (let i = 0; i < xy_num_positions[1]; i++) {
        const y = (i * y_offset) - (xy_size[1] / 2);
        for (let j = 0; j < xy_num_positions[0]; j++) {
            const x = (j * x_offset) - (xy_size[0] / 2);
            let xyz = [x, y, 0];
            if (origin_is_plane) {
                xyz = matrix_1.multMatrix(xyz, matrix);
            }
            else { // we have a plane
                xyz = vectors_1.vecAdd(xyz, origin);
            }
            const posi_i = __model__.geom.add.addPosi();
            __model__.attribs.add.setPosiCoords(posi_i, xyz);
            posis_i.push(posi_i);
        }
    }
    // structure the grid of posis, and return
    const posis_i2 = [];
    if (method === _EGridMethod.FLAT) {
        return id_1.idsMakeFromIndicies(common_1.EEntType.POSI, posis_i);
    }
    else if (method === _EGridMethod.ROWS) {
        for (let i = 0; i < xy_num_positions[1]; i++) {
            const row = [];
            for (let j = 0; j < xy_num_positions[0]; j++) {
                const index = (i * xy_num_positions[0]) + j;
                row.push(posis_i[index]);
            }
            posis_i2.push(row);
        }
    }
    else if (method === _EGridMethod.COLUMNS) {
        for (let i = 0; i < xy_num_positions[0]; i++) {
            const col = [];
            for (let j = 0; j < xy_num_positions[1]; j++) {
                const index = (j * xy_num_positions[0]) + i;
                col.push(posis_i[index]);
            }
            posis_i2.push(col);
        }
    }
    else if (method === _EGridMethod.SQUARES) {
        for (let i = 0; i < xy_num_positions[1] - 1; i++) {
            for (let j = 0; j < xy_num_positions[0] - 1; j++) {
                const index = (i * xy_num_positions[0]) + j;
                const square = [
                    posis_i[index],
                    posis_i[index + 1],
                    posis_i[index + xy_num_positions[0] + 1],
                    posis_i[index + xy_num_positions[0]]
                ];
                posis_i2.push(square);
            }
        }
    }
    return id_1.idsMakeFromIndicies(common_1.EEntType.POSI, posis_i2);
}
exports.Grid = Grid;
var _EGridMethod;
(function (_EGridMethod) {
    _EGridMethod["FLAT"] = "flat";
    _EGridMethod["COLUMNS"] = "columns";
    _EGridMethod["ROWS"] = "rows";
    _EGridMethod["SQUARES"] = "squares";
})(_EGridMethod = exports._EGridMethod || (exports._EGridMethod = {}));
// ================================================================================================
/**
 * Creates positions in an arc pattern, and returns the list of new positions.
 * If the angle of the arc is set to null, then circular patterns will be created.
 * For circular patterns, duplicates at start and end are automatically removed.
 *
 * @param __model__
 * @param origin XYZ coordinates as a list of three numbers.
 * @param radius Radius of circle as a number.
 * @param num_positions Number of positions distributed equally along the arc.
 * @param arc_angle Angle of arc (in radians).
 * @returns Entities, a list of positions.
 * @example coordinates1 = pattern.Arc([0,0,0], 10, 12, PI)
 * @example_info Creates a list of 12 XYZ coordinates distributed equally along a semicircle of radius 10.
 */
function Arc(__model__, origin, radius, num_positions, arc_angle) {
    // --- Error Check ---
    const fn_name = 'pattern.Arc';
    _check_args_1.checkCommTypes(fn_name, 'origin', origin, [_check_args_1.TypeCheckObj.isCoord, _check_args_1.TypeCheckObj.isPlane]);
    _check_args_1.checkCommTypes(fn_name, 'radius', radius, [_check_args_1.TypeCheckObj.isNumber]);
    _check_args_1.checkCommTypes(fn_name, 'num_positions', num_positions, [_check_args_1.TypeCheckObj.isInt]);
    _check_args_1.checkCommTypes(fn_name, 'arc_angle', arc_angle, [_check_args_1.TypeCheckObj.isNumber, _check_args_1.TypeCheckObj.isNull]);
    // --- Error Check ---
    // create the matrix one time
    let matrix;
    const origin_is_plane = id_1.getArrDepth(origin) === 2;
    if (origin_is_plane) {
        matrix = matrix_1.xfromSourceTargetMatrix(common_1.XYPLANE, origin);
    }
    // calc the rot angle per position
    const rot = (arc_angle === null) ? (2 * Math.PI) / num_positions : arc_angle / (num_positions - 1);
    // create positions
    const posis_i = [];
    for (let i = 0; i < num_positions; i++) {
        const angle = rot * i; // CCW
        const x = (Math.cos(angle) * radius);
        const y = (Math.sin(angle) * radius);
        let xyz = [x, y, 0];
        if (origin_is_plane) {
            xyz = matrix_1.multMatrix(xyz, matrix);
        }
        else { // we have a plane
            xyz = vectors_1.vecAdd(xyz, origin);
        }
        const posi_i = __model__.geom.add.addPosi();
        __model__.attribs.add.setPosiCoords(posi_i, xyz);
        posis_i.push(posi_i);
    }
    // return the list of posis
    return id_1.idsMakeFromIndicies(common_1.EEntType.POSI, posis_i);
}
exports.Arc = Arc;
// ================================================================================================
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0dGVybi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL21vZHVsZXMvcGF0dGVybi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7QUFFSDs7R0FFRztBQUVILCtDQUE2RDtBQUM3RCx1REFBa0Y7QUFDbEYsK0NBQTBFO0FBQzFFLHFEQUFpRDtBQUNqRCxtREFBNkU7QUFJN0UsbUdBQW1HO0FBQ25HOzs7Ozs7Ozs7O0dBVUc7QUFDSCxTQUFnQixTQUFTLENBQUMsU0FBa0IsRUFBRSxNQUFtQixFQUFFLElBQTZCO0lBQzVGLHNCQUFzQjtJQUN0QixNQUFNLE9BQU8sR0FBRyxtQkFBbUIsQ0FBQztJQUNwQyw0QkFBYyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsMEJBQVksQ0FBQyxPQUFPLEVBQUUsMEJBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3hGLDRCQUFjLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQywwQkFBWSxDQUFDLFFBQVEsRUFBRSwwQkFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDdEYsc0JBQXNCO0lBQ3RCLDZCQUE2QjtJQUM3QixJQUFJLE1BQWUsQ0FBQztJQUNwQixNQUFNLGVBQWUsR0FBRyxnQkFBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsRCxJQUFJLGVBQWUsRUFBRTtRQUNqQixNQUFNLEdBQUcsZ0NBQXVCLENBQUMsZ0JBQU8sRUFBRSxNQUFpQixDQUFDLENBQUM7S0FDaEU7SUFDRCx1QkFBdUI7SUFDdkIsTUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sT0FBTyxHQUFxQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQXFC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