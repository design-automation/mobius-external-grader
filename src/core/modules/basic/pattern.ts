/**
 * The `pattern` module has functions for creating patters of positions.
 * These functions all return lists of position IDs.
 * The list may be nested, depending on which function is selected.
 * @module
 */


import * as chk from '../../_check_types';

import { Txyz, TPlane, XYPLANE, TId, EEntType, Txy } from '@libs/geo-info/common';
import { idsMake, idsMakeFromIdxs } from '@assets/libs/geo-info/common_id_funcs';
import { getArrDepth } from '@assets/libs/util/arrs';
import { vecAdd, vecDiv, vecFromTo, vecSub } from '@libs/geom/vectors';
import { xfromSourceTargetMatrix, multMatrix } from '@libs/geom/matrix';
import { Matrix4 } from 'three';
import { GIModel } from '@libs/geo-info/GIModel';
import * as THREE from 'three';
import * as VERB from '@assets/libs/verb/verb';
import { arrFill, arrMakeFlat } from '@assets/libs/util/arrs';
// ================================================================================================
/**
 * Creates a set of positions in a straight line pattern.
 * \n
 * The `origin` parameter specifies the centre of the straight line along which positions will be
 * generated. The origin can be specified as either a |coordinate| or a |plane|. If a coordinate
 * is given, then a plane will be automatically generated, aligned with the global XY plane.
 * \n
 * The positions will be generated along an straight line aligned with the X axis of the origin 
 * plane.
 * \n
 * Returns the list of new positions.
 * \n
 * @param __model__
 * @param origin A |coordinate| or a |plane|.
 * If a coordinate is given, then the plane is assumed to be aligned with the global XY plane.
 * @param length The length of the line along which positions will be generated.
 * @returns Entities, a list of new positions.
 */
export function Line(__model__: GIModel, origin: Txyz|TPlane, length: number, num_positions: number): TId[] {
    // --- Error Check ---
    if (__model__.debug) {
        const fn_name = 'pattern.Line';
        chk.checkArgs(fn_name, 'origin', origin, [chk.isXYZ, chk.isPln]);
        chk.checkArgs(fn_name, 'length', length, [chk.isNum]);
        chk.checkArgs(fn_name, 'num_positions', num_positions, [chk.isInt]);
    }
    // --- Error Check ---
    // create the matrix one time
    let matrix: Matrix4;
    const origin_is_plane = getArrDepth(origin) === 2;
    if (origin_is_plane) {
        matrix = xfromSourceTargetMatrix(XYPLANE, origin as TPlane);
    }
    // create the positions
    const posis_i: number[] = [];
    const coords: Txyz[] = [];
    const step: number = length / (num_positions - 1);
    for (let i = 0; i < num_positions; i++) {
        coords.push([-(length / 2) + i * step, 0, 0]);
    }
    for (const coord of coords) {
        let xyz: Txyz = coord;
        if (origin_is_plane) {
            xyz = multMatrix(xyz, matrix);
        } else { // we have a plane
            xyz = vecAdd(xyz, origin as Txyz);
        }
        const posi_i: number = __model__.modeldata.geom.add.addPosi();
        __model__.modeldata.attribs.posis.setPosiCoords(posi_i, xyz);
        posis_i.push(posi_i);
    }
    // return
    return idsMakeFromIdxs(EEntType.POSI, posis_i) as TId[];
}
// ================================================================================================
/**
 * Creates a set of positions by linear interpolation between the specified |coordinates|.
 * \n
 * The `num_positions` parameter specifies the number of positions to be generated between
 * each pair of coordinates.
 * \n
 * The `method` parameter specifies whether to close the loop of coordinates. If set to `close`,
 * then positions are also generated between the last and first coordinates in the list.
 * \n
 * For the `num_positions` parameters:
 * - `num_positions = 0`: No positions are generated.
 * - `num_positions = 1`: No new coordinates are calculated.
 * If `close` is true, then positions are generate at all coordinates in the input list.
 * If `close` is false, then positions are generate at all coordinates in the input list
 * except the last coordinate (which is ignored).
 * - `num_positions = 2`: No new coordinates are calculated. Positions are generate at all
 * coordinates in the input list. (The `close` parameter has no effect.)
 * - `num_positions = 3`: For each pair of coordinates, one additional coordinate
 * is calculated by linear interpolation.
 * - `num_positions = 4`: For each pair of coordinates, two additional coordinates
 * are calculated by linear interpolation.
 * - etc
 * \n
 * For example, lets consider a case where you specify three coordinates, set the method to `close`
 * and set `num_positions` to 4. In this case, there will be 3 pairs of coordinates, `[0, 1]`,
 * `[1, 2]` and `[2, 0]`. For each pair of coordinates, 2 new calculations are calculated.
 * This results in a total of 9 coordinates. So 9 positions will be generated.
 * \n
 * Returns the list of new position IDs.
 * \n
 * @param __model__
 * @param coords A list of |coordinates|.
 * @param close Enum, 'open' or 'close'.
 * @param The number of positions to generate.
 * @returns Entities, a list of new position IDs.
 * @example posis = pattern.Linear([[0,0,0], [10,0,0]], false, 3)
 * @example_info Generates 3 positions, located at [0,0,0], [5,0,0], and [10,0,0].
 * @example `posis = pattern.Linear([[0,0,0], [10,0,0], [10,10,0]], 'close', 4)`
 * @example_info Generates 9 positions. Two new coordinates are calculated between each pair of
 * input positions.
 */
export function Linear(__model__: GIModel, coords: Txyz[], close: _EClose,
        num_positions: number): TId[] {
    // --- Error Check ---
    if (__model__.debug) {
        const fn_name = 'pattern.Linear';
        chk.checkArgs(fn_name, 'coords', coords, [chk.isXYZL]);
        chk.checkArgs(fn_name, 'num_positions', num_positions, [chk.isInt]);
    }
    // --- Error Check ---
    if (num_positions === 0) { return []; }
    const is_closed: boolean = close === _EClose.CLOSE;
    const num_pairs: number = is_closed ? coords.length : coords.length - 1;
    const new_xyzs: Txyz[] = [];
    for (let i = 0; i < num_pairs; i++) {
        const xyz0: Txyz = coords[i];
        const xyz1: Txyz = coords[(i + 1) % coords.length];
        const sub_vec: Txyz = vecDiv(vecFromTo(xyz0, xyz1), num_positions - 1);
        let xyz_next: Txyz = xyz0;
        for (let j = 0; j < num_positions - 1; j++) {
            new_xyzs.push(xyz_next);
            xyz_next = vecAdd(xyz_next, sub_vec);
        }
    }
    if (!is_closed) { new_xyzs.push(coords[coords.length - 1]); }
    // make posis and return
    return idsMake(__model__.modeldata.funcs_make.position(new_xyzs)) as TId[];
}
// ================================================================================================
/**
 * Creates four positions in a rectangle pattern.
 * \n
 * The `origin` parameter specifies the centre of the rectangle for which positions will be
 * generated. The origin can be specified as either a |coordinate| or a |plane|. If a coordinate
 * is given, then a plane will be automatically generated, aligned with the global XY plane.
 * \n
 * The positions will be generated for a rectangle on the origin XY plane. So if the origin plane is
 * rotated, then the rectangle will also be rotated.
 * \n
 * The `size` parameter specifies the size of the rectangle. If only one number is given,
 * then width and length are assumed to be equal. If a list of two numbers is given,
 * then they will be interpreted as `[width, length]`.The width dimension will be in the
 * X-direction of the origin plane, and the length will be in the Y direction of the origin plane.
 * \n
 * Returns a list of new positions.
 * \n
 * @param __model__
 * @param origin A |coordinate| or a |plane|.
 * If a coordinate is given, then the plane is assumed to be aligned with the global XY plane.
 * @param size Size of rectangle. If number, assume square of that length;
 * if list of two numbers, x and y lengths respectively.
 * @returns Entities, a list of four positions.
 * @example posis = pattern.Rectangle([0,0,0], 10)
 * @example_info Creates a list of 4 coords, being the vertices of a 10 by 10 square.
 * @example `posis = pattern.Rectangle(XY, [10,20])`
 * @example_info Creates a list of 4 positions in a rectangle pattern. The rectangle has a width of
 * 10 (in the X direction) and a length of 20 (in the Y direction).
 */
export function Rectangle(__model__: GIModel, origin: Txyz|TPlane,
        size: number|[number, number]): TId[] {
    // --- Error Check ---
    if (__model__.debug) {
        const fn_name = 'pattern.Rectangle';
        chk.checkArgs(fn_name, 'origin', origin, [chk.isXYZ, chk.isPln]);
        chk.checkArgs(fn_name, 'size', size, [chk.isNum, chk.isXY]);
    }
    // --- Error Check ---
    // create the matrix one time
    let matrix: Matrix4;
    const origin_is_plane = getArrDepth(origin) === 2;
    if (origin_is_plane) {
        matrix = xfromSourceTargetMatrix(XYPLANE, origin as TPlane);
    }
    // create the positions
    const posis_i: number[] = [];
    const xy_size: [number, number] =
        (Array.isArray(size) ? size : [size, size]) as [number, number];
    const coords: Txyz[] = [
        [-(xy_size[0] / 2), -(xy_size[1] / 2), 0],
        [ (xy_size[0] / 2), -(xy_size[1] / 2), 0],
        [ (xy_size[0] / 2),  (xy_size[1] / 2), 0],
        [-(xy_size[0] / 2),  (xy_size[1] / 2), 0]
    ];
    for (const coord of coords) {
        let xyz: Txyz = coord;
        if (origin_is_plane) {
            xyz = multMatrix(xyz, matrix);
        } else { // we have a plane
            xyz = vecAdd(xyz, origin as Txyz);
        }
        const posi_i: number = __model__.modeldata.geom.add.addPosi();
        __model__.modeldata.attribs.posis.setPosiCoords(posi_i, xyz);
        posis_i.push(posi_i);
    }
    // return
    return idsMakeFromIdxs(EEntType.POSI, posis_i) as TId[];
}
// ================================================================================================
export enum _EGridMethod {
    FLAT = 'flat',
    COLUMNS = 'columns',
    ROWS = 'rows',
    QUADS = 'quads'
}
/**
 * Creates positions in a grid pattern.
 * \n
 * The `origin` parameter specifies the centre of the grid for which positions will be
 * generated. The origin can be specified as either a |coordinate| or a |plane|. If a coordinate
 * is given, then a plane will be automatically generated, aligned with the global XY plane.
 * \n
 * The positions will be generated for a grid on the origin XY plane. So if the origin plane is
 * rotated, then the grid will also be rotated.
 * \n
 * The `size` parameter specifies the size of the grid. 
 * - If only one number is given, then width and length are assumed to be equal. 
 * - If a list of two numbers is given, then they will be interpreted as `[width, length]`.
 * \n
 * The width dimension will be in the X-direction of the origin plane, and the length will be in 
 * the Y direction of the origin plane.
 * \n
 * The `num_positions` parameter specifies the number of columns and rows of positions in the grid.
 * - If only one number is given, then the grid is assumed to have equal number columns and rows.
 * - If a list of two numbers is given, then they will be interpreted as `[columns, rows]`.
 * \n
 * The `columns` will be parallel to the Y-direction of the origin plane,
 * and the `rows` will be parallel to the X-direction of the origin plane.
 * \n
 * For example, consider the following function call:
 * `posis = pattern.Grid(XY, [10, 20], [3, 5], 'flat')`
 * This will generate the following grid:
 * \n
 * ![An example of pattern.Grid](assets/typedoc-json/docMDimgs/pattern_grid.png)
 * \n
 * The positions can either be returned as a flat list or as nested lists.
 * For the nested lists, three options are available:
 * - `columns`: Each nested list represents a column of positions. 
 * - `rows`: Each nested list represents a row of positions.
 * - `quads`: Each nested list represents four positions, forming a quadrilateral. Neighbouring 
 * quadrilaterals share positions.
 * \n
 * Below are the varying results when calling the function with the method set to
 * `flat`, `columns`, `rows` and `quads`:
 * \n
 * `posis = pattern.Grid(XY, [10,20], [2,3], 'flat')`
 * ```
 * posis = ["ps0", "ps1", "ps2", "ps3", "ps4", "ps5"]
 * ```
 * \n
 * `posis = pattern.Grid(XY, [10,20], [2,3], 'columns')`
 * ```
 * posis = [
 *     ["ps0", "ps2", "ps4"],
 *     ["ps1", "ps3", "ps5"]
 * ]
 * ```
 * \n
 * `posis = pattern.Grid(XY, [10,20], [2,3], 'rows')`
 * ```
 * posis = [
 *     ["ps0", "ps1"],
 *     ["ps2", "ps3"],
 *     ["ps4", "ps5"]
 * ]
 * ```
 * \n
 * `posis = pattern.Grid(XY, [10,20], [2,3], 'quads')`
 * ```
 * posis = [
 *     ["ps0", "ps1", "ps3", "ps2"],
 *     ["ps2", "ps3", "ps5", "ps4"]
 * ]
 * ```
 * \n
 * When the method is set to `columns` or `rows`, polylines can be generated as follows:
 * ```
 * posis = pattern.Grid(XY, [10,20], [2,3], 'rows')
 * plines = make.Polyline(posis, 'open')
 * ```
 * When the method is set to quads, polygons can be generated as follows:
 * ```
 * posis = pattern.Grid(XY, [10,20], [2,3], 'quads')
 * pgons = make.Polygon(posis)
 * ```
 * \n
 * @param __model__
 * @param origin A |coordinate| or a |plane|.
 * If a coordinate is given, then the plane is assumed to be aligned with the global XY plane.
 * @param size The width and length of grid.
 * If a single number is given, then the width and length are assumed to be equal.
 * If a list of two numbers is given, then they will be interpreted as `[width, length]`.
 * @param num_positions Number of columns and rows of positions in the grid.
 * If a single number is given, then the number of columns and rows are assumed to be equal.
 * If a list of two numbers is given, then they will be interpreted as `[columns, rows]`.
 * @param method Enum, define the way the coords will be return as lists.
 * @returns Entities, a list of positions, or a list of lists of positions
 * (depending on the 'method' setting).
 * @example posis = pattern.Grid([0,0,0], 10, 3, 'flat')
 * @example_info Creates a list of 9 positions on a 3x3 square grid with a size of 10.
 * @example `posis = pattern.Grid([0,0,0], [10,20], [3,4], 'flat')`
 * @example_info Creates a list of 12 positions on a 3x4 grid. The grid as a width of 10
 * and a length of 20. The positions are returned as a flat list.
*/
export function Grid(__model__: GIModel, origin: Txyz|TPlane, size: number|[number, number],
        num_positions: number|[number, number], method: _EGridMethod): TId[]|TId[][] {
    // --- Error Check ---
    if (__model__.debug) {
        const fn_name = 'pattern.Grid';
        chk.checkArgs(fn_name, 'origin', origin, [chk.isXYZ, chk.isPln]);
        chk.checkArgs(fn_name, 'size', size, [chk.isNum, chk.isXY]);
        chk.checkArgs(fn_name, 'num_positions', num_positions, [chk.isInt, chk.isXYInt]);
    }
    // --- Error Check ---
    // create the matrix one time
    let matrix: Matrix4;
    const origin_is_plane = getArrDepth(origin) === 2;
    if (origin_is_plane) {
        matrix = xfromSourceTargetMatrix(XYPLANE, origin as  TPlane);
    }
    // create the positions
    const posis_i: number[] = [];
    const xy_size: [number, number] =
        (Array.isArray(size) ? size : [size, size]) as [number, number];
    const xy_num_positions: [number, number] =
        (Array.isArray(num_positions) ?
        num_positions : [num_positions, num_positions]) as [number, number];
    const x_offset: number = xy_size[0] / (xy_num_positions[0] - 1);
    const y_offset: number = xy_size[1] / (xy_num_positions[1] - 1);
    for (let i = 0; i < xy_num_positions[1]; i++) {
        const y: number = (i * y_offset) - (xy_size[1] / 2);
        for (let j = 0; j < xy_num_positions[0]; j++) {
            const x: number = (j * x_offset) - (xy_size[0] / 2);
            let xyz: Txyz = [x, y, 0];
            if (origin_is_plane) {
                xyz = multMatrix(xyz, matrix);
            } else { // we have a plane
                xyz = vecAdd(xyz, origin as Txyz);
            }
            const posi_i: number = __model__.modeldata.geom.add.addPosi();
            __model__.modeldata.attribs.posis.setPosiCoords(posi_i, xyz);
            posis_i.push(posi_i);
        }
    }
    // structure the grid of posis, and return
    const posis_i2: number[][] = [];
    if (method === _EGridMethod.FLAT) {
        return idsMakeFromIdxs(EEntType.POSI, posis_i) as TId[];
    } else if (method === _EGridMethod.ROWS) {
        for (let i = 0; i < xy_num_positions[1]; i++) {
            const row: number[] = [];
            for (let j = 0; j < xy_num_positions[0]; j++) {
                const index: number = (i * xy_num_positions[0]) + j;
                row.push( posis_i[index] );
            }
            posis_i2.push(row);
        }
    } else if (method === _EGridMethod.COLUMNS) {
        for (let i = 0; i < xy_num_positions[0]; i++) {
            const col: number[] = [];
            for (let j = 0; j < xy_num_positions[1]; j++) {
                const index: number = (j * xy_num_positions[0]) + i;
                col.push( posis_i[index] );
            }
            posis_i2.push(col);
        }
    } else if (method === _EGridMethod.QUADS) {
        for (let i = 0; i < xy_num_positions[1] - 1; i++) {
            for (let j = 0; j < xy_num_positions[0] - 1; j++) {
                const index: number = (i * xy_num_positions[0]) + j;
                const square: number[] = [
                    posis_i[index],
                    posis_i[index + 1],
                    posis_i[index + xy_num_positions[0] + 1],
                    posis_i[index + xy_num_positions[0]]
                ];
                posis_i2.push( square );
            }
        }
    }
    return idsMakeFromIdxs(EEntType.POSI, posis_i2) as TId[][];
}
// ================================================================================================
export enum _EBoxMethod {
    FLAT = 'flat',
    ROWS = 'rows',
    COLUMNS = 'columns',
    LAYERS = 'layers',
    QUADS = 'quads'
}
/**
 * Creates positions in a box pattern. Positions are only generated on the outer surface of the box.
 * No positions are generated in the interior of the box.
 * \n
 * The `origin` parameter specifies the centre of the box for which positions will be
 * generated. The origin can be specified as either a |coordinate| or a |plane|. If a coordinate
 * is given, then a plane will be automatically generated, aligned with the global XY plane.
 * \n
 * The positions will be generated for a box aligned with the origin XY plane.
 * So if the origin plane is rotated, then the box will also be rotated.
 * \n
 * The `size` parameter specifies the size of the box.
 * - If only one number is given, then the width, length, and height are assumed to be equal.
 * - If a list of two numbers is given, then they will be interpreted as `[width, length]`,
 * and the height will be the same as the length.
 * - If a list of three numbers is given, then they will be interpreted as `[width, length, height]`.
 * \n
 * The width dimension will be in the X-direction of the origin plane,
 * the length in the Y direction, and the height in the Z-direction.
 * \n
 * The `num_positions` parameter specifies the number of columns, rows, and layers of positions
 * in the box.
 * - If only one number is given, then the box is assumed to have equal number columns, rows,
 * and layers.
 * - If a list of two numbers is given, then they will be interpreted as `[columns, rows]`,
 * and the number of layers will be the same as the rows.
 * - If a list of three numbers is given, then they will be interpreted as `[columns, rows, layers]`.
 * \n
 * The `columns` will be parallel to the Y-direction of the origin plane,
 * and the `rows` will be parallel to the X-direction of the origin plane.
 * The layers are stacked up in the Z-direction of the origin plane.
 * \n
 * For example, consider the following function call:
 * `posis = pattern.Box(XY, [10,20,30], [2,3,2], 'flat')`
 * This will generate the following box:
 * \n
 * ![An example of pattern.Box](assets/typedoc-json/docMDimgs/pattern_box.png)
 * \n
 * Below are the varying results when calling the function with the method set to
 * `flat`, `columns`, `rows` `layers` and `quads`:
 * \n
 * `posis = pattern.Box(XY, [10,20,30], [2,3,2], 'flat')`
 * ```
 * posis = ["ps0", "ps1", "ps2", "ps3", "ps4", "ps5", "ps6", "ps7", "ps8", "ps9", "ps10", "ps11"]
 * ```
 * \n
 * `posis = pattern.Grid(XY, [10,20,30], [2,3,2], 'columns')`
 * ```
 * posis = [
 *     ["ps0", "ps1", "ps6", "ps7"],
 *     ["ps2", "ps3", "ps8", "ps9"],
 *     ["ps4", "ps5", "ps10", "ps11"]
 * ]
 * ```
 * \n
 * `posis = pattern.Grid(XY, [10,20,30], [2,3,2], 'rows')`
 * ```
 * posis = [
 *     ["ps0", "ps2", "ps4", "ps6", "ps8", "ps10"],
 *     ["ps1", "ps3", "ps5", "ps7", "ps9", "ps11"]
 * ]
 * ```
 * \n
 * `posis = pattern.Grid(XY, [10,20,30], [2,3,2], 'layers')`
 * ```
 * posis = [
 *     ["ps0", "ps1", "ps2", "ps3", "ps4", "ps5"],
 *     ["ps6", "ps7", "ps8", "ps9", "ps10", "ps11"]
 * ]
 * ```
 * \n
* `posis = pattern.Grid(XY, [10,20,30], [2,3,2], 'quads')`
 * ```
 * posis = [
 *     ["ps0", "ps2", "ps3", "ps1"],
 *     ["ps2", "ps4", "ps5", "ps3"],
 *     ["ps0", "ps1", "ps7", "ps6"],
 *     ["ps1", "ps3", "ps9", "ps7"],
 *     ["ps3", "ps5", "ps11", "ps9"],
 *     ["ps5", "ps4", "ps10", "ps11"],
 *     ["ps4", "ps2", "ps8", "ps10"],
 *     ["ps2", "ps0", "ps6", "ps8"],
 *     ["ps6", "ps7", "ps9", "ps8"],
 *     ["ps8", "ps9", "ps11", "ps10"]
 * ]
 * ```
 * \n
 * When the method is set to `columns` or `rows`, polylines can be generated as follows:
 * ```
 * posis = pattern.Box(XY, [10,20,30], [2,3,2], 'rows')
 * plines = make.Polyline(posis, 'open')
 * ```
 * When the method is set to quads, polygons on the box surface can be generated as follows:
 * ```
 * posis = pattern.Grid(XY, [10,20,30], [2,3,2], 'quads')
 * pgons = make.Polygon(posis)
 * ```
 * \n
 * @param __model__
 * @param origin A |coordinate| or a |plane|.
 * If a coordinate is given, then the plane is assumed to be aligned with the global XY plane.
 * @param size The width, length, and height of the box.
 * If a single number is given, then the width, length, and height are assumed to be equal.
 * If a list of two numbers is given, then they will be interpreted as `[width, length]`,
 * and the height is assumed to be equal to the length.
 * If a list of three numbers is given, then they will be interpreted as `[width, length, height]`.
 * @param num_positions Number of columns, rows, and layers of positions in the box.
 * If a single number is given, then the number of columns, rows, and layers are assumed to be equal.
 * If a list of two numbers is given, then they will be interpreted as `[columns, rows]`,
 * and the number of layers is assumed to be equal to the number of rows.
 * If a list of three numbers is given, then they will be interpreted as `[columns, rows, layers]`.
 * @param method Enum, define the way the coords will be return as lists.
 * @returns Entities, a list of positions, or a list of lists of positions
 * (depending on the 'method' setting).
 * @example `posis = pattern.Box(XY, [10,20,30], [3,4,5], 'quads')`
 * @example_info Returns positions in a box pattern. The size of the box is 10 wide (in X direction)
 * 20 long (Y direction), and 30 high (Z direction). The box has 3 columns, 4 rows, and 5 layers.
 * This results in a total of 12 (i.e. 3 x 4) positions in the top and bottom layers, and 10
 * positions in the middle two layers. The positions are returned as nested lists, where each
 * sub-list contains positions for one quadrilateral.
 */
export function Box(__model__: GIModel, origin: Txyz | TPlane,
    size: number | [number, number] | [number, number, number],
    num_positions: number | [number, number] | [number, number, number],
    method: _EBoxMethod): TId[] | TId[][] {
    // --- Error Check ---
    if (__model__.debug) {
        const fn_name = 'pattern.Box';
        chk.checkArgs(fn_name, 'origin', origin, [chk.isXYZ, chk.isPln]);
        chk.checkArgs(fn_name, 'size', size, [chk.isNum, chk.isXY, chk.isXYZ]);
    }
    // --- Error Check ---
    // create the matrix one time
    let matrix: Matrix4;
    const origin_is_plane = getArrDepth(origin) === 2;
    if (origin_is_plane) {
        matrix = xfromSourceTargetMatrix(XYPLANE, origin as TPlane);
    }
    // create params
    const xyz_size: Txyz = arrFill(size, 3) as [number, number, number];
    const xyz_num_positions: [number, number, number] =
        arrFill(num_positions, 3) as [number, number, number];
    // create the positions
    const layer_top_posis_i: number[] = [];
    const layer_bot_posis_i: number[] = [];
    const posis_i: number[][][] = [];
    const x_offset: number = xyz_size[0] / (xyz_num_positions[0] - 1);
    const y_offset: number = xyz_size[1] / (xyz_num_positions[1] - 1);
    const z_offset: number = xyz_size[2] / (xyz_num_positions[2] - 1);
    for (let k = 0; k < xyz_num_positions[2]; k++) {
        const layer_perim_x0_posis_i: number[] = [];
        const layer_perim_y0_posis_i: number[] = [];
        const layer_perim_x1_posis_i: number[] = [];
        const layer_perim_y1_posis_i: number[] = [];
        const z: number = (k * z_offset) - (xyz_size[2] / 2);
        for (let i = 0; i < xyz_num_positions[1]; i++) {
            const y: number = (i * y_offset) - (xyz_size[1] / 2);
            for (let j = 0; j < xyz_num_positions[0]; j++) {
                const x: number = (j * x_offset) - (xyz_size[0] / 2);
                let create_perim_layer = false;
                // perimeter layers
                if (i === 0 || i === xyz_num_positions[1] - 1) { create_perim_layer = true; }
                if (j === 0 || j === xyz_num_positions[0] - 1) { create_perim_layer = true; }
                // top layer
                let create_top_layer = false;
                if (k === xyz_num_positions[2] - 1) { create_top_layer = true; }
                // bot layer
                let create_bot_layer = false;
                if (k === 0) { create_bot_layer = true; }
                // create posis
                if (create_perim_layer || create_top_layer || create_bot_layer) {
                    let xyz: Txyz = [x, y, z];
                    if (origin_is_plane) {
                        xyz = multMatrix(xyz, matrix);
                    } else { // we have a plane
                        xyz = vecAdd(xyz, origin as Txyz);
                    }
                    const posi_i: number = __model__.modeldata.geom.add.addPosi();
                    __model__.modeldata.attribs.posis.setPosiCoords(posi_i, xyz);
                    if (create_perim_layer) {
                        if (i === 0) {
                            layer_perim_x0_posis_i.push(posi_i);
                        } else if (i === xyz_num_positions[1] - 1) {
                            layer_perim_x1_posis_i.push(posi_i);
                        } else if (j === xyz_num_positions[0] - 1) {
                            layer_perim_y0_posis_i.push(posi_i);
                        } else if (j === 0) {
                            layer_perim_y1_posis_i.push(posi_i);
                        }
                    }
                    if (create_top_layer) {
                        layer_top_posis_i.push(posi_i);
                    }
                    if (create_bot_layer) {
                        layer_bot_posis_i.push(posi_i);
                    }
                }
            }
        }
        posis_i.push([
            layer_perim_x0_posis_i, layer_perim_y0_posis_i,
            layer_perim_x1_posis_i, layer_perim_y1_posis_i
        ]);
    }
    // structure the grid of posis, and return
    if (method === _EBoxMethod.FLAT) {
        const layers_posis_i: number[][] = [];
        for (let k = 1; k < posis_i.length - 2; k++) {
            layers_posis_i.push(
                arrMakeFlat([
                    posis_i[k][0],
                    posis_i[k][1],
                    posis_i[k][2].reverse(),
                    posis_i[k][3].reverse(),
                ])
            );
        }
        const all_posis: number[] = arrMakeFlat([layer_bot_posis_i, layers_posis_i, layer_top_posis_i]);
        return idsMakeFromIdxs(EEntType.POSI, all_posis) as TId[];
    } else if (method === _EBoxMethod.ROWS) {
        // rows that are parallel to x axis
        const posis_i2: number[][] = [];
        for (let i = 0; i < xyz_num_positions[1]; i++) {
            const row: number[] = [];
            // bottom
            for (let j = 0; j < xyz_num_positions[0]; j++) {
                const index: number = (i * xyz_num_positions[0]) + j;
                row.push(layer_bot_posis_i[index]);
            }
            // mid
            if (posis_i.length > 2) {
                for (let k = 1; k < posis_i.length - 1; k++) {
                    if (i === 0) {
                        row.push(...posis_i[k][0]);
                    } else if (i === xyz_num_positions[1] - 1) {
                        row.push(...posis_i[k][2]);
                    } else {
                        row.push(posis_i[k][3][i - 1]);
                        row.push(posis_i[k][1][i - 1]);
                    }
                }
            }
            // top
            for (let j = 0; j < xyz_num_positions[0]; j++) {
                const index: number = (i * xyz_num_positions[0]) + j;
                row.push(layer_top_posis_i[index]);
            }
            posis_i2.push(row);
        }
        return idsMakeFromIdxs(EEntType.POSI, posis_i2) as TId[][];
    } else if (method === _EBoxMethod.COLUMNS) {
        // columns that are parallel to the y axis
        // i is moving along x axis
        const posis_i2: number[][] = [];
        for (let i = 0; i < xyz_num_positions[0]; i++) {
            const col: number[] = [];
            // bot
            for (let j = 0; j < xyz_num_positions[1]; j++) {
                const index: number = (j * xyz_num_positions[0]) + i;
                col.push(layer_bot_posis_i[index]);
            }
            // mid
            if (posis_i.length > 2) {
                for (let k = 1; k < posis_i.length - 1; k++) {
                    if (i === 0) {
                        col.push(posis_i[k][0][0]);
                        col.push(...posis_i[k][3]);
                        col.push(posis_i[k][2][0]);
                    } else if (i === xyz_num_positions[1] - 1) {
                        col.push(posis_i[k][0][xyz_num_positions[0] - 1]);
                        col.push(...posis_i[k][1]);
                        col.push(posis_i[k][0][xyz_num_positions[0] - 1]);
                    } else {
                        col.push(posis_i[k][0][i]);
                        col.push(posis_i[k][2][i]);
                    }
                }
            }
            // top
            for (let j = 0; j < xyz_num_positions[1]; j++) {
                const index: number = (j * xyz_num_positions[0]) + i;
                col.push(layer_top_posis_i[index]);
            }
            posis_i2.push(col);
        }
        return idsMakeFromIdxs(EEntType.POSI, posis_i2) as TId[][];
    } else if (method === _EBoxMethod.LAYERS) {
        // layers that are parallel to the xy plane
        // i is moving along z axis
        // bottom
        const posis_i2: number[][] = [layer_bot_posis_i];
        // mid
        for (let i = 1; i < xyz_num_positions[2] - 1; i++) {
            if (posis_i.length > 2) {
                const layer: number[] = posis_i[i][0].slice();
                for (let j = 0; j < xyz_num_positions[1] - 2; j++) {
                    layer.push(posis_i[i][3][j]);
                    layer.push(posis_i[i][1][j]);
                }
                layer.push(...posis_i[i][2]);
                posis_i2.push(layer);
            }
        }
        // top
        posis_i2.push(layer_top_posis_i);
        return idsMakeFromIdxs(EEntType.POSI, posis_i2) as TId[][];
    } else if (method === _EBoxMethod.QUADS) {
        const posis_i2: number[][] = [];
        // bottom
        for (let i = 0; i < xyz_num_positions[1] - 1; i++) {
            for (let j = 0; j < xyz_num_positions[0] - 1; j++) {
                const index: number = (i * xyz_num_positions[0]) + j;
                const quad: number[] = [
                    layer_bot_posis_i[index],
                    layer_bot_posis_i[index + xyz_num_positions[0]],
                    layer_bot_posis_i[index + xyz_num_positions[0] + 1],
                    layer_bot_posis_i[index + 1]
                ];
                posis_i2.push(quad);
            }
        }
        // mid
        const layers_posis_i: number[][] = [];
        for (let k = 0; k < posis_i.length; k++) {
            layers_posis_i.push(
                arrMakeFlat([
                    posis_i[k][0],
                    posis_i[k][1],
                    posis_i[k][2].reverse(),
                    posis_i[k][3].reverse(),
                ])
            );
        }
        for (let k = 0; k < layers_posis_i.length - 1; k++) {
            const layer_posis_i: number[] = layers_posis_i[k];
            const next_layer_posis_i: number[] = layers_posis_i[k + 1];
            for (let i = 0; i < layer_posis_i.length; i++) {
                const index: number = i;
                const next_index: number = i === layer_posis_i.length - 1 ? 0 : i + 1;
                const quad: number[] = [
                    layer_posis_i[index],
                    layer_posis_i[next_index],
                    next_layer_posis_i[next_index],
                    next_layer_posis_i[index]
                ];
                posis_i2.push(quad);
            }
        }
        // top
        for (let i = 0; i < xyz_num_positions[1] - 1; i++) {
            for (let j = 0; j < xyz_num_positions[0] - 1; j++) {
                const index: number = (i * xyz_num_positions[0]) + j;
                const quad: number[] = [
                    layer_top_posis_i[index],
                    layer_top_posis_i[index + 1],
                    layer_top_posis_i[index + xyz_num_positions[0] + 1],
                    layer_top_posis_i[index + xyz_num_positions[0]]
                ];
                posis_i2.push(quad);
            }
        }
        return idsMakeFromIdxs(EEntType.POSI, posis_i2) as TId[][];
    }
    return [];
}
// ================================================================================================
export enum _EPolyhedronMethod {
    FLAT_TETRA = 'flat_tetra',
    FLAT_CUBE = 'flat_cube',
    FLAT_OCTA = 'flat_octa',
    FLAT_ICOSA = 'flat_icosa',
    FLAT_DODECA = 'flat_dodeca',
    FACE_TETRA = 'face_tetra',
    FACE_CUBE = 'face_cube',
    FACE_OCTA = 'face_octa',
    FACE_ICOSA = 'face_icosa',
    FACE_DODECA = 'face_dodeca'
}
/**
 * Creates positions in a polyhedron pattern.
 * \n
 * The five regular polyhedrons can be generated:
 * - Tetrahedron (4 triangular faces)
 * - Cube (4 square faces)
 * - Octahedron (8 triangular faces)
 * - Icosahedron (20 triangular faces)
 * - Dodecahedron (12 pentagon faces)
 * \n
 * The `origin` parameter specifies the centre of the polyhedron for which positions will be
 * generated. The origin can be specified as either a |coordinate| or a |plane|. If a coordinate
 * is given, then a plane will be automatically generated, aligned with the global XY plane.
 * \n
 * The positions will be generated for a polyhedron aligned with the origin XY plane.
 * So if the origin plane is rotated, then the polyhedron will also be rotated.
 * \n
 * The `radius` parameter specifies the size of the polyhedron.
 * All positions that are generated are projected onto the surface of a sphere,
 * with the specified `radius`.
 * \n
 * The faces of the regular polyhedron can be further subdivided by specifying the level of
 * `detail`. (When subdivided, it will no longer be regular polyhedrons.)
 * \n
 * For tetrahedrons, octahedrons, and icosahedrons, the `detail` subdivides as follows:
 * - Detail = 0: No subdivision
 * - Detail = 1: Each triangle edge is subdivided into two edges.
 * - Detail = 2: Each triangle edge is subdivided into three edges.
 * - etc
 * \n
 * Cubes and dodecahedrons do not have triangular faces. So in these cases, the first level of 
 * `detail` converts each non-triangular face into triangles by adding a position at the centre of 
 * the face. The `detail` subdivides as follows:
 * - Detail= 0: No subdivision.
 * - Detail = 1: Convert non-triangular faces into triangles.
 * - Detail = 2: Each triangle edge is subdivided into two edges.
 * - Detail = 3: Each triangle edge is subdivided into three edges.
 * - etc
 * \n
 * The positions can either be returned as a flat list or as nested lists.
 * The nested lists represent the faces of the polyhedron.
 * However, note that only the positions are returned.
 * If you want to have polygon faces, you need to generate polygons from the positions.
 * \n
 * For example, calling the function with `detail = 0` and `method = 'flat_tetra'`,
 * will result in the following positions:
 * ```
 * posis = ["ps0", "ps1", "ps2", "ps3"]
 * ```
 * If you change the method to `method = 'face_tetra'`, then you will get the following nested lists.
 * ```
 * posis = [
 *     ["ps2", "ps1", "ps0"],
 *     ["ps0", "ps3", "ps2"],
 *     ["ps1", "ps3", "ps0"],
 *     ["ps2", "ps3", "ps1"]
 * ]
 * ```
 * Notice that the number of positions is the same in both cases
 * (i.e. in both cases there are 4 positions: 'ps0', 'ps1', 'ps2', 'ps3').
 * When `face_tetra` is selected selected, the positions are organised into 4 lists,
 * representing the 4 faces of the tetrahedron.
 * \n
 * The nested lists can be passed to the `make.Polygon` function in order to generated polygonal faces.
 * Here is an example:
 * \n
 * ```
 * posis = pattern.Polyhedron(XY, 10, 0, 'face_tetra')
 * pgons = make.Polygon(posis)
 * ```
 * \n
 * ![Tetrahedron with triangular faces](assets/typedoc-json/docMDimgs/polyhedron_tetra.png)
 * \n
 * @param __model__
 * @param origin A |coordinate| or a |plane|, specifying the origin of the polyhedron.
 * If a coordinate is given, then the plane is assumed to be aligned with the global XY plane.
 * @param radius The radius of the polyhedron.
 * @param detail The level of detail for the polyhedron.
 * @param method Enum: The Type of polyhedron to generate.
 * @returns Entities, a list of positions.
 * @example `posis = pattern.Polyhedron(XY, 20, 0, 'face_tetra')`
 * @example_info Creates positions in a regular tetrahedron pattern, with a radius of 20. The 
 * positions are returned as nested lists, where each list contains the positions for one face.
 */
export function Polyhedron(__model__: GIModel, origin: Txyz | TPlane, radius: number, detail: number,
        method: _EPolyhedronMethod): TId[]|TId[][] {
    // --- Error Check ---
    if (__model__.debug) {
        const fn_name = 'pattern.Polyhedron';
        chk.checkArgs(fn_name, 'origin', origin, [chk.isXYZ, chk.isPln]);
        chk.checkArgs(fn_name, 'radius', radius, [chk.isNum]);
        chk.checkArgs(fn_name, 'detail', detail, [chk.isInt]);
        if (detail > 6) {
            throw new Error('pattern.Polyhedron: The "detail" argument is too high, the maximum is 6.');
        }
    }
    // --- Error Check ---
    // create the matrix one time
    let matrix: Matrix4 = null;
    const origin_is_plane = getArrDepth(origin) === 2;
    if (origin_is_plane) {
        matrix = xfromSourceTargetMatrix(XYPLANE, origin as TPlane);
    } else {
        matrix = new Matrix4();
        matrix.makeTranslation(...origin as Txyz);
    }
    // make polyhedron posis
    const posis_i: number[]|number[][] = _polyhedron(__model__, matrix, radius, detail, method);
    return idsMakeFromIdxs(EEntType.POSI, posis_i) as TId[][];
}
// create the polyhedron
export function _polyhedron(__model__: GIModel, matrix: Matrix4, radius: number, detail: number,
    method: _EPolyhedronMethod): number[]|number[][] {
    // create the posis
    let xyzs: Txyz[];
    let faces: number[][];
    switch (method) {
        case _EPolyhedronMethod.FLAT_TETRA:
        case _EPolyhedronMethod.FACE_TETRA:
            [xyzs, faces] = _polyhedronCreate(_polyhedronTetra(), radius, detail);
            break;
        case _EPolyhedronMethod.FLAT_CUBE:
        case _EPolyhedronMethod.FACE_CUBE:
            [xyzs, faces] = _polyhedronCreate(_polyhedronCube(), radius, detail);
            break;
        case _EPolyhedronMethod.FLAT_OCTA:
        case _EPolyhedronMethod.FACE_OCTA:
            [xyzs, faces] = _polyhedronCreate(_polyhedronOcta(), radius, detail);
            break;
        case _EPolyhedronMethod.FLAT_ICOSA:
        case _EPolyhedronMethod.FACE_ICOSA:
            [xyzs, faces] = _polyhedronCreate(_polyhedronIcosa(), radius, detail);
            break;
        case _EPolyhedronMethod.FLAT_DODECA:
        case _EPolyhedronMethod.FACE_DODECA:
            [xyzs, faces] = _polyhedronCreate(_polyhedronDodeca(), radius, detail);
            break;
        default:
            throw new Error('pattern.Polyhedron: method not recognised.');
    }
    // make posis
    const posis_i: number[] = [];
    for (const xyz of xyzs) {
        const posi_i: number = __model__.modeldata.geom.add.addPosi();
        const xyz_xform: Txyz = multMatrix(xyz, matrix);
        __model__.modeldata.attribs.posis.setPosiCoords(posi_i, xyz_xform);
        posis_i.push(posi_i);
    }
    // if the method is flat, then we are done, return the posis
    switch (method) {
        case _EPolyhedronMethod.FLAT_TETRA:
        case _EPolyhedronMethod.FLAT_CUBE:
        case _EPolyhedronMethod.FLAT_OCTA:
        case _EPolyhedronMethod.FLAT_ICOSA:
        case _EPolyhedronMethod.FLAT_DODECA:
            return posis_i;
    }
    // if we want faces, then make lists of posis for each face
    const faces_posis_i: number[][] = [];
    for (const face of faces) {
        const face_posis_i: number[] = [];
        for (const i of face) {
            face_posis_i.push(posis_i[i]);
        }
        faces_posis_i.push(face_posis_i);
    }
    return faces_posis_i;
}
// Create a tetrahedron
function _polyhedronTetra(): [Txyz[], number[][]] {
    // copied from threejs
    const xyzs: Txyz[] = [
        [1, 1, 1],
        [- 1, - 1, 1],
        [- 1, 1, - 1],
        [1, - 1, - 1]
    ];
    const faces: number[][] = [
        [2, 1, 0],
        [0, 3, 2],
        [1, 3, 0],
        [2, 3, 1]
    ];
    return [xyzs, faces];
}
// Create a cube
function _polyhedronCube(): [Txyz[], number[][]] {
    const xyzs: Txyz[] = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1,  1], [1, -1,  1], [1, 1,  1], [-1, 1,  1],
    ];
    const faces: number[][] = [
        [0, 1, 2, 3],
        [0, 1, 5, 4],
        [1, 2, 6, 5],
        [2, 3, 7, 6],
        [3, 0, 4, 7],
        [7, 6, 5, 4]
    ];
    return [xyzs, faces];
}
// Create a Octahedron
function _polyhedronOcta(): [Txyz[], number[][]] {
    // copied from threejs
    const xyzs: Txyz[] = [
        [1, 0, 0], [- 1, 0, 0], [0, 1, 0],
        [0, - 1, 0], [0, 0, 1], [0, 0, - 1]
    ];
    const faces: number[][] = [
        [0, 2, 4], [0, 4, 3], [0, 3, 5],
        [0, 5, 2], [1, 2, 5], [1, 5, 3],
        [1, 3, 4], [1, 4, 2]
    ];
    return [xyzs, faces];
}
// Create a Icosahedron
function _polyhedronIcosa(): [Txyz[], number[][]] {
    // copied from threejs
    const t = (1 + Math.sqrt(5)) / 2;
    const xyzs: Txyz[] = [
        [- 1, t, 0], [1, t, 0], [- 1, - t, 0],
        [1, - t, 0], [0, - 1, t], [0, 1, t],
        [0, - 1, - t], [0, 1, - t], [t, 0, - 1],
        [t, 0, 1], [- t, 0, - 1], [- t, 0, 1]
    ];
    const faces: number[][] = [
        [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
        [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
        [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
        [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];
    return [xyzs, faces];
}
// Create a Dodecahedron
function _polyhedronDodeca(): [Txyz[], number[][]] {
    // copied from threejs
    const t: number = (1 + Math.sqrt(5)) / 2;
    const r: number = 1 / t;
    const xyzs: Txyz[] = [
        // (±1, ±1, ±1)
        [- 1, - 1, - 1], [- 1, - 1, 1],
        [- 1, 1, - 1], [- 1, 1, 1],
        [1, - 1, - 1], [1, - 1, 1],
        [1, 1, - 1], [1, 1, 1],
        // (0, ±1/φ, ±φ)
        [0, - r, - t], [0, - r, t],
        [0, r, - t], [0, r, t],
        // (±1/φ, ±φ, 0)
        [- r, - t, 0], [- r, t, 0],
        [r, - t, 0], [r, t, 0],
        // (±φ, 0, ±1/φ)
        [- t, 0, - r], [t, 0, - r],
        [- t, 0, r], [t, 0, r]
    ];
    const faces: number[][] = [
        // [3, 11, 7], [3, 7, 15], [3, 15, 13],
        // [7, 19, 17], [7, 17, 6], [7, 6, 15],
        // [17, 4, 8], [17, 8, 10], [17, 10, 6],
        // [8, 0, 16], [8, 16, 2], [8, 2, 10],
        // [0, 12, 1], [0, 1, 18], [0, 18, 16],
        // [6, 10, 2], [6, 2, 13], [6, 13, 15],
        // [2, 16, 18], [2, 18, 3], [2, 3, 13],
        // [18, 1, 9], [18, 9, 11], [18, 11, 3],
        // [4, 14, 12], [4, 12, 0], [4, 0, 8],
        // [11, 9, 5], [11, 5, 19], [11, 19, 7],
        // [19, 5, 14], [19, 14, 4], [19, 4, 17],
        // [1, 12, 14], [1, 14, 5], [1, 5, 9]
        [3, 11, 7, 15, 13],
        [7, 19, 17, 6, 15],
        [17, 4, 8, 10, 6],
        [8, 0, 16, 2, 10],
        [0, 12, 1, 18, 16],
        [6, 10, 2, 13, 15],
        [2, 16, 18, 3, 13],
        [18, 1, 9, 11, 3],
        [4, 14, 12, 0, 8],
        [11, 9, 5, 19, 7],
        [19, 5, 14, 4, 17],
        [1, 12, 14, 5, 9]

    ];
    return [xyzs, faces];
}
// Subdivide and apply radius
function _polyhedronCreate(xyzs_faces: [Txyz[], number[][]], radius: number, detail: number): [Txyz[], number[][]] {
    const xyzs: Txyz[] = xyzs_faces[0];
    const faces: number[][] = xyzs_faces[1];
    // subdiv
    const [new_xyzs, new_faces]: [Txyz[], number[][]]  = _polyhedronSubDdiv(xyzs, faces, detail);
    // apply radius
    _polyhedronApplyRadiusXyzs(new_xyzs, radius);
    // return
    return [new_xyzs, new_faces];
}
// Subdiv all faces
function _polyhedronSubDdiv(xyzs: Txyz[], faces: number[][], detail: number): [Txyz[], number[][]] {
    if (detail === 0) { return [xyzs, faces]; }
    const new_faces: number[][] = [];
    for (const face of faces) {
        if (face.length > 3) {
            const mid: Txyz = [0, 0, 0];
            for (const xyz_i of face) {
                mid[0] = mid[0] + xyzs[xyz_i][0];
                mid[1] = mid[1] + xyzs[xyz_i][1];
                mid[2] = mid[2] + xyzs[xyz_i][2];
            }
            mid[0] = mid[0] / face.length;
            mid[1] = mid[1] / face.length;
            mid[2] = mid[2] / face.length;
            const mid_i: number = xyzs.push(mid) - 1;
            for (let i = 0; i < face.length; i++) {
                const tri_face: number[] = [mid_i, face[i], face[(i + 1) % face.length]];
                const subdiv_faces: number[][] = _polyhedronSubDdivTriFace(xyzs, tri_face, detail - 1);
                subdiv_faces.map(subdiv_face => new_faces.push(subdiv_face));
            }
        } else {
            const subdiv_faces: number[][] = _polyhedronSubDdivTriFace(xyzs, face, detail);
            subdiv_faces.map(subdiv_face => new_faces.push(subdiv_face));
        }
    }
    // merge xyzs
    const new_xyzs: Txyz[] = _polyhedronMergeXyzs(xyzs, new_faces);
    // return
    return [new_xyzs, new_faces];
}
// Subdivide one face
function _polyhedronSubDdivTriFace(xyzs: Txyz[], face: number[], detail: number): number[][] {
    const a: Txyz = xyzs[face[0]];
    const b: Txyz = xyzs[face[1]];
    const c: Txyz = xyzs[face[2]];
    const cols = detail + 1;
    // we use this multidimensional array as a data structure for creating the subdivision
    const xyzs_i: number[][] = [];
    // construct all of the xyzs for this subdivision
    for (let i = 0; i <= cols; i++) {
        xyzs_i[i] = [];
        const aj = _polyhedronLerp(a, c, i / cols);
        const bj = _polyhedronLerp(b, c, i / cols);
        const rows = cols - i;
        for (let j = 0; j <= rows; j++) {
            let xyz_i: number;
            if (j === 0 && i === cols) {
                xyz_i = xyzs.push(aj) - 1;
            } else {
                xyz_i = xyzs.push(_polyhedronLerp(aj, bj, j / rows)) - 1;
            }
            xyzs_i[i][j] = xyz_i;
        }
    }
    // construct all of the tri faces
    const new_faces: number[][] = [];
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < 2 * (cols - i) - 1; j++) {
            const new_face: number[] = [];
            const k = Math.floor(j / 2);
            if (j % 2 === 0) {
                new_face.push(xyzs_i[i][k + 1]);
                new_face.push(xyzs_i[i + 1][k]);
                new_face.push(xyzs_i[i][k]);
            } else {
                new_face.push(xyzs_i[i][k + 1]);
                new_face.push(xyzs_i[i + 1][k + 1]);
                new_face.push(xyzs_i[i + 1][k]);
            }
            new_faces.push(new_face);
        }
    }
    return new_faces;
}
function _polyhedronMergeXyzs(xyzs: Txyz[], faces: number[][]): Txyz[] {
    // iterate over the xyzs
    const xyz_i_old_new_map: Map<number, number> = new Map();
    const new_xyzs: Txyz[] = [];
    for (let i = 0; i < xyzs.length; i++) {
        if (!xyz_i_old_new_map.has(i)) {
            const new_i: number = new_xyzs.push(xyzs[i]) - 1;
            xyz_i_old_new_map.set(i, new_i);
            for (let j = i + 1; j < xyzs.length; j++) {
                const dist_sq: number =
                    Math.abs(xyzs[i][0] - xyzs[j][0]) +
                    Math.abs(xyzs[i][1] - xyzs[j][1]) +
                    Math.abs(xyzs[i][2] - xyzs[j][2]);
                if (dist_sq < 1e-6) {
                    xyz_i_old_new_map.set(j, new_i);
                }
            }
        }
    }
    // update indexes
    for (const face of faces) {
        for (let i = 0; i < face.length; i++) {
            face[i] = xyz_i_old_new_map.get(face[i]);
        }
    }
    // return
    return new_xyzs;
}
function _polyhedronApplyRadiusXyzs(xyzs: Txyz[], radius: number): void {
    // iterate over the xyzs and apply the radius to each xyz
    for (const xyz of xyzs) {
        const scale: number =
            radius / Math.sqrt(xyz[0] * xyz[0] + xyz[1] * xyz[1] + xyz[2] * xyz[2]);
        xyz[0] = xyz[0] * scale;
        xyz[1] = xyz[1] * scale;
        xyz[2] = xyz[2] * scale;
    }
}
function _polyhedronLerp(a: Txyz, b: Txyz, alpha: number): Txyz {
    // interpolate between two points
    return [
        a[0] + (b[0] - a[0]) * alpha,
        a[1] + (b[1] - a[1]) * alpha,
        a[2] + (b[2] - a[2]) * alpha
    ];
}
// ================================================================================================
/**
 * Creates positions in an arc or circle pattern.
 * \n
 * The `origin` parameter specifies the centre of the polyhedron for which positions will be
 * generated. The origin can be specified as either a |coordinate| or a |plane|. If a coordinate
 * is given, then a plane will be automatically generated, aligned with the global XY plane.
 * \n
 * The positions will be generated for an arc aligned with the origin XY plane.
 * So if the origin plane is rotated, then the rotated will also be rotated.
 * \n
 * The `radius` parameter specifies the size of the arc.
 * \n
 * The `num_positions` parameter specifies the total number of positions to be generated on the arc.
 * \n
 * The `arc_angle` specifies the angle of the arc, in radians. Angles start at thet X-axis of the
 * origin plane and move in a counter-clockwise direction. Two angles are needed to define an arc,
 * a `start_angle` and `end_angle`. The angles may be positive or negative, and may be
 * greater than `2*PI` or smaller than `-2*PI`.
 * \n
 * Positions will always be generated in sequence, from the start angle towards the end angle.
 * - If the start angle is smaller than the end angle, then the positions will be generated in
 * counter-clockwise order.
 * - If the start angle is greater than the end angle, then the positions will be generated in
 * clockwise order.
 * \n
 * The angle may either be given as a single number, as a list of two numbers, or as `null`:
 * - If the angle is given as a single number, then the arc angles will be ser to be
 * `[0, end_angle]`. This means that the start of the arc will coincide with the X-axis
 * of the origin plane.
 * - If the angle is given as a list of two numbers, then they will be set to be
 * `[start_angle, end_angle]`.
 * - If the angle is set to `null`, then the arc angles will be set to be
 * `[0, 2*PI]` In addition, duplicate positions at start and end of the arc are
 * automatically removed.
 * \n
 * Note that setting the arc angle to null is not the same as setting it to `2*PI`
 * When setting the arc angle to `2*PI`, you will get a duplicate positions at start and end 
 * of the arc.
 * \n
 * @param __model__
 * @param origin A |coordinate| or a |plane|, specifying the centre of the arc.
 * If a coordinate is given, then the plane is assumed to be aligned with the global XY plane.
 * @param radius Radius of circle as a number.
 * @param num_positions Number of positions to be distributed equally along the arc.
 * @param arc_angle Angle of arc (in radians). If a list of two numbers is given, then the first
 * number specifies the arc start angle, and the second number the arc end angle, i.e.
 * `[arc_start_angle, arc_end_angle]`. If a single numer is specified, then the angles will be set
 * to `[0, arc_end_angle]`. If `null` is given, then the angles will be set to `[0, 2 * PI]`.
 * @returns Entities, a list of positions.
 * @example `posis = pattern.Arc([0,0,0], 10, 12, PI)`
 * @example_info Creates a list of 12 positions distributed equally along a semicircle of radius 10
 * starting at an angle of 0 and ending at an angle of 180 degrees, rotating in a counter-clockwise
 * direction.
 */
export function Arc(__model__: GIModel, origin: Txyz|TPlane, radius: number, num_positions: number, 
        arc_angle: number|[number, number]): TId[] {
    // --- Error Check ---
    if (__model__.debug) {
        const fn_name = 'pattern.Arc';
        chk.checkArgs(fn_name, 'origin', origin, [chk.isXYZ, chk.isPln]);
        chk.checkArgs(fn_name, 'radius', radius, [chk.isNum]);
        chk.checkArgs(fn_name, 'num_positions', num_positions, [chk.isInt]);
        chk.checkArgs(fn_name, 'arc_angle', arc_angle, [chk.isNum, chk.isNumL, chk.isNull]);
        if (Array.isArray(arc_angle)) {
            if (arc_angle.length !== 2) {
                throw new Error('pattern.Arc: If the "arc_angle" is given as a list of numbers, \
                then the list must contain exactly two angles (in radians).');
            }
        }
    }
    // --- Error Check ---
    // create the matrix one time
    let matrix: Matrix4;
    const origin_is_plane = getArrDepth(origin) === 2;
    if (origin_is_plane) {
        matrix = xfromSourceTargetMatrix(XYPLANE, origin as  TPlane);
    }
    // get the two arc angles
    let arc_angles: [number, number];
    if (arc_angle === null) {
        arc_angles = [0, 2 * Math.PI];
    } else if ( Array.isArray(arc_angle)) {
        arc_angles = arc_angle;
    } else {
        arc_angles = [0, arc_angle];
    }
    // calc the rot angle per position
    let rot: number;
    const div: number = arc_angle === null ? num_positions : num_positions - 1;
    if (arc_angles[0] < arc_angles[1]) {
        rot = (arc_angles[1] - arc_angles[0]) / div; // CCW
    } else {
        rot = (arc_angles[0] - arc_angles[1]) / -div; // CW
    }
    // create positions
    const posis_i: number[] = [];
    for (let i = 0; i < num_positions; i++) {
        const angle: number = arc_angles[0] + (rot * i);
        const x: number = (Math.cos(angle) * radius);
        const y: number = (Math.sin(angle) * radius);
        let xyz: Txyz = [x, y, 0];
        if (origin_is_plane) {
            xyz = multMatrix(xyz, matrix);
        } else { // we have a plane
            xyz = vecAdd(xyz, origin as Txyz);
        }
        const posi_i: number = __model__.modeldata.geom.add.addPosi();
        __model__.modeldata.attribs.posis.setPosiCoords(posi_i, xyz);
        posis_i.push(posi_i);
    }
    // return the list of posis
    return idsMakeFromIdxs(EEntType.POSI, posis_i) as TId[];
}
// ================================================================================================
/**
 * Creates positions in an Bezier curve pattern, defined by a list of coordinates.
 * \n
 * The Bezier is created as either a qadratic or cubic Bezier. It is always an open curve.
 * \n
 * The positions are created along the curve at equal parameter values.
 * This means that the euclidean distance between the positions will not necessarily be equal.
 * \n
 * For the quadratic Bezier, three coordinates are required.
 * For the cubic Bezier, four coordinates are required.
 * \n
 * The `coords` parameter gives the list of |coordinates|
 * (three coords for quadratics, four coords for cubics).
 * The first and last coordinates in the list are the start and end positions of the curve.
 * The middle coordinates act as the control points for controlling the shape of the curve.
 * \n
 * The `num_positions` parameter specifies the total number of positions to be generated.
 * \n
 * For more information, see the wikipedia article: 
 * <a href="https://en.wikipedia.org/wiki/B%C3%A9zier_curve">B%C3%A9zier_curve</a>.
 * \n
 * @param __model__
 * @param origin A |coordinate| or a |plane| (three coords for quadratics, four coords for cubics).
 * If a coordinate is given, then the plane is assumed to be aligned with the global XY plane. .
 * @param num_positions Number of positions to be distributed along the Bezier.
 * @returns Entities, a list of positions.
 * @example `posis = pattern.Bezier([[0,0,0], [10,0,50], [20,0,0]], 20)`
 * @example_info Creates a list of 20 positions distributed along a Bezier curve.
 */
export function Bezier(__model__: GIModel, coords: Txyz[], num_positions: number): TId[] {
    // --- Error Check ---
    const fn_name = 'pattern.Bezier';
    if (__model__.debug) {
        chk.checkArgs(fn_name, 'coords', coords, [chk.isXYZL]);
        chk.checkArgs(fn_name, 'num_positions', num_positions, [chk.isInt]);
    }
    // --- Error Check ---
    // create the curve
    const coords_tjs: THREE.Vector3[] =
        coords.map(coord => new THREE.Vector3(coord[0], coord[1], coord[2]));
    let points_tjs: THREE.Vector3[] = [];
    let curve_tjs: THREE.CubicBezierCurve3|THREE.QuadraticBezierCurve3 = null;
    if (coords.length === 4) {
        curve_tjs =
            new THREE.CubicBezierCurve3(coords_tjs[0], coords_tjs[1], coords_tjs[2], coords_tjs[3]);
        points_tjs = curve_tjs.getPoints(num_positions - 1);
    } else if (coords.length === 3) {
        curve_tjs = new THREE.QuadraticBezierCurve3(coords_tjs[0], coords_tjs[1], coords_tjs[2]);
        points_tjs = curve_tjs.getPoints(num_positions - 1);
    } else {
        throw new Error (fn_name + 
            ': "coords" should be a list of either three or four XYZ coords.');
    }
    // create positions
    const posis_i: number[] = [];
    for (let i = 0; i < num_positions; i++) {
        const posi_i: number = __model__.modeldata.geom.add.addPosi();
        __model__.modeldata.attribs.posis.setPosiCoords(posi_i, points_tjs[i].toArray() as Txyz);
        posis_i.push(posi_i);
    }
    // return the list of posis
    return idsMakeFromIdxs(EEntType.POSI, posis_i) as TId[];
}
// ================================================================================================
export enum _EClose {
    OPEN = 'open',
    CLOSE = 'close'
}
/**
 * Creates positions in an NURBS curve pattern, defined a list of coordinates.
 * \n
 * The positions are created along the curve according to the parametric equation of the curve.
 * This means that the euclidean distance between the positions will not necessarily be equal.
 * For open BSpline curves, the positions at the start and end tend to be closer together.
 * \n
 * The `coords` parameter gives the list of |coordinates| for generating the curve.
 * - If the curve is open, then the first and last coordinates in the list are the start and end
 * positions of the curve. The middle coordinates act as the control points for controlling the
 * shape of the curve.
 * - If the curve is closed, then all coordinates act as the control points for controlling the
 * shape of the curve.
 * \n
 * The degree (between 2 and 5) of the curve defines how smooth the curve is.
 * Quadratic: degree = 2
 * Cubic: degree = 3
 * Quartic: degree = 4.
 * \n
 * The number of coordinates should be at least one greater than the degree of the curve.
 * \n
 * The `num_positions` parameter specifies the total number of positions to be generated.
 * \n
 * @param __model__
 * @param coords A list of |coordinates| (must be at least three).
 * @param degree The degree of the curve, and integer between 2 and 5.
 * @param close Enum, 'close' or 'open'
 * @param num_positions Number of positions to be distributed along the Bezier.
 * @returns Entities, a list of positions.
 * @example `posis = pattern.Nurbs([[0,0,0], [10,0,50], [20,0,50], [30,0,0]], 3, 'open', 20)`
 * @example_info Creates a list of 20 positions distributed along a Nurbs curve.
 */
export function Nurbs(__model__: GIModel, coords: Txyz[], degree: number, close: _EClose,
        num_positions: number): TId[] {
    // --- Error Check ---
    if (__model__.debug) {
        const fn_name = 'pattern.Nurbs';
        chk.checkArgs(fn_name, 'coords', coords, [chk.isXYZL]);
        chk.checkArgs(fn_name, 'num_positions', num_positions, [chk.isInt]);
        if (coords.length < 3) {
            throw new Error (fn_name + ': "coords" should be a list of at least three XYZ coords.');
        }
        if (degree < 2  || degree > 5) {
            throw new Error (fn_name + ': "degree" should be between 2 and 5.');
        }
        if (degree > (coords.length - 1)) {
            throw new Error (fn_name + ': a curve of degree ' + degree + ' requires at least ' +
                (degree + 1) + ' coords.' );
        }
    }
    // --- Error Check ---
    const closed: boolean = close === _EClose.CLOSE;
    // create the curve using the VERBS library
    const offset = degree + 1;
    const coords2: Txyz[] = coords.slice();
    if (closed) {
        const start: Txyz[] = coords2.slice(0, offset);
        const end: Txyz[] = coords2.slice(coords2.length - offset, coords2.length);
        coords2.splice(0, 0, ...end);
        coords2.splice(coords2.length, 0, ...start);
    }
    const weights = coords2.forEach( _ => 1);
    const num_knots: number = coords2.length + degree + 1;
    const knots: number [] = [];
    const uniform_knots = num_knots - (2 * degree);
    for (let i = 0; i < degree; i++) {
        knots.push(0);
    }
    for (let i = 0; i < uniform_knots; i++) {
        knots.push(i / (uniform_knots - 1));
    }
    for (let i = 0; i < degree; i++) {
        knots.push(1);
    }
    const curve_verb =
        new VERB.geom.NurbsCurve.byKnotsControlPointsWeights(degree, knots, coords2, weights);
    // Testing VERB closed curve
    // const k: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    // const c: number[][] = [[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0], [0, 0, 0], [10, 0, 0]];
    // const w: number[] = [1, 1, 1, 1, 1, 1];
    // const curve_verb2 = new VERB.geom.NurbsCurve.byKnotsControlPointsWeights(2, k, c, w);
    // This gives an error: Error:
    // Invalid knot vector format!
    // Should begin with degree + 1 repeats and end with degree + 1 repeats!
    const posis_i: number[] =
        nurbsToPosis(__model__, curve_verb, degree, closed, num_positions, coords[0]);
    // return the list of posis
    return idsMakeFromIdxs(EEntType.POSI, posis_i) as TId[];
}
// ================================================================================================
// Enums for CurveCatRom()
export enum _ECurveCatRomType {
    CENTRIPETAL = 'centripetal',
    CHORDAL = 'chordal',
    CATMULLROM = 'catmullrom'
}
/**
 * Creates positions in an spline pattern. Returns a list of new positions.
 * It is a type of interpolating spline (a curve that goes through its control points).
 * \n
 * The input is a list of XYZ coordinates. These act as the control points for creating the Spline curve.
 * The positions that get generated will be divided equally between the control points.
 * For example, if you define 4 control points for a closed spline, and set 'num_positions' to be 40,
 * then you will get 8 positions between each pair of control points,
 * irrespective of the distance between the control points.
 * \n
 * The spline curve can be created in three ways: 'centripetal', 'chordal', or 'catmullrom'.
 * \n
 * For more information, see the wikipedia article:
 * <a href="https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline">Catmull–Rom spline</a>.
 * \n
 * <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Catmull-Rom_examples_with_parameters..png"
 * alt="Curve types" width="100">
 * \n
 * @param __model__
 * @param coords A list of |coordinates|.
 * @param type Enum, the type of interpolation algorithm.
 * @param tension Curve tension, between 0 and 1. This only has an effect when the 'type' is set
 * to 'catmullrom'.
 * @param close Enum, 'open' or 'close'.
 * @param num_positions Number of positions to be distributed distributed along the spline.
 * @returns Entities, a list of positions.
 * @example `posis = pattern.Spline([[0,0,0], [10,0,50], [20,0,0], [30,0,20], [40,0,10]],
 * 'chordal','close', 0.2, 50)`
 * @example_info Creates a list of 50 positions distributed along a spline curve pattern.
 */
export function Interpolate(__model__: GIModel, coords: Txyz[], type: _ECurveCatRomType, 
    tension: number, close: _EClose, num_positions: number): TId[] {
    // --- Error Check ---
    if (__model__.debug) {
        const fn_name = 'pattern.Interpolate';
        chk.checkArgs(fn_name, 'coords', coords, [chk.isXYZL]);
        chk.checkArgs(fn_name, 'tension', tension, [chk.isNum01]);
        chk.checkArgs(fn_name, 'num_positions', num_positions, [chk.isInt]);
        if (coords.length < 3) {
            throw new Error(fn_name + ': "coords" should be a list of at least three XYZ coords.');
        }
    }
    // --- Error Check ---
    const closed_tjs: boolean = close === _EClose.CLOSE;
    const num_positions_tjs: number = closed_tjs ? num_positions : num_positions - 1;
    if (tension === 0) { tension = 1e-16; } // There seems to be a bug in threejs, so this is a fix
    // Check we have enough coords
    // create the curve
    const coords_tjs: THREE.Vector3[] =
        coords.map(coord => new THREE.Vector3(coord[0], coord[1], coord[2]));
    const curve_tjs: THREE.CatmullRomCurve3 =
        new THREE.CatmullRomCurve3(coords_tjs, closed_tjs, type, tension);
    const points_tjs: THREE.Vector3[] = curve_tjs.getPoints(num_positions_tjs);
    // create positions
    const posis_i: number[] = [];
    for (let i = 0; i < num_positions; i++) {
        const posi_i: number = __model__.modeldata.geom.add.addPosi();
        __model__.modeldata.attribs.posis.setPosiCoords(posi_i, points_tjs[i].toArray() as Txyz);
        posis_i.push(posi_i);
    }
    // return the list of posis
    return idsMakeFromIdxs(EEntType.POSI, posis_i) as TId[];
}
// ================================================================================================
function nurbsToPosis(__model__: GIModel, curve_verb: any, degree: number, closed: boolean,
    num_positions: number, start: Txyz): number[] {
    // create positions
    const posis_i: number[] = [];
    const [offset_start, offset_end] = { 2: [5, 3], 3: [6, 5], 4: [8, 6], 5: [9, 8] }[degree];
    const knots: number[] = curve_verb.knots();
    const u_start = knots[offset_start];
    const u_end = knots[knots.length - offset_end - 1];
    const u_range = u_end - u_start;
    // trying split
    // const [c1, c2] = curve_verb.split(u_start);
    // const [c3, c4] = c2.split(u_end);
    // const curve_length_samples_verb: any[] = c3.divideByEqualArcLength(num_positions - 1);
    // const u_values_verb: number[] = curve_length_samples_verb.map( cls => cls.u as number );
    let min_dist_to_start = Infinity;
    let closest_to_start = -1;
    for (let i = 0; i < num_positions; i++) {
        let u: number;
        if (closed) {
            u = u_start + ((i / num_positions) * u_range);
        } else {
            u = i / (num_positions - 1);
        }
        const xyz: Txyz = curve_verb.point(u) as Txyz;
        // xyz[2] = i / 10;
        const posi_i: number = __model__.modeldata.geom.add.addPosi();
        __model__.modeldata.attribs.posis.setPosiCoords(posi_i, xyz);
        posis_i.push(posi_i);
        const dist = Math.abs(start[0] - xyz[0]) +
            Math.abs(start[1] - xyz[1]) +
            Math.abs(start[2] - xyz[2]);
        if (dist < min_dist_to_start) {
            min_dist_to_start = dist;
            closest_to_start = i;
        }
    }
    const posis_i_start: number[] = posis_i.slice(closest_to_start, posis_i.length);
    const posis_i_end: number[] = posis_i.slice(0, closest_to_start);
    const posis_i_sorted: number[] = posis_i_start.concat(posis_i_end);
    // return the list of posis
    return posis_i_sorted;
}


// // ================================================================================================
// /**
//  * Creates positions in an NURBS curve pattern, by iterpolating between the coordinates.
//  * \n
//  * The positions are created along the curve according to the parametric equation of the curve.
//  * This means that the euclidean distance between the positions will not necessarily be equal.
//  * For open BSpline curves, the positions at the start and end tend to be closer together.
//  * \n
//  * The `coords` parameter gives the list of |coordinates| for generating the curve.
//  * - If the curve is open, then the first and last coordinates in the list are the start and end
//  * positions of the curve. The middle coordinates act as the control points for controlling the
//  * shape of the curve.
//  * - If the curve is closed, then all coordinates act as the control points for controlling the
//  * shape of the curve.
//  * \n
//  * The degree (between 2 and 5) of the curve defines how smooth the curve is.
//  * Quadratic: degree = 2
//  * Cubic: degree = 3
//  * Quartic: degree = 4.
//  * \n
//  * The number of coordinates should be at least one greater than the degree of the curve.
//  * \n
//  * The `num_positions` parameter specifies the total number of positions to be generated.
//  * \n
//  * @param __model__
//  * @param coords A list of |coordinates| (must be at least three).
//  * @param degree The degree of the curve, and integer between 2 and 5.
//  * @param close Enum, 'close' or 'open'
//  * @param num_positions Number of positions to be distributed along the Bezier.
//  * @returns Entities, a list of positions.
//  * @example posis = pattern.Nurbs([[0,0,0], [10,0,50], [20,0,10]], 20)
//  * @example_info Creates a list of 20 positions distributed along a Bezier curve pattern.
//  */
// export function _Interpolate(__model__: GIModel, coords: Txyz[], degree: number, close: _EClose, num_positions: number): TId[] {
//     // --- Error Check ---
//     if (__model__.debug) {
//         const fn_name = 'pattern._Interpolate';
//         chk.checkArgs(fn_name, 'coords', coords, [chk.isXYZL]);
//         chk.checkArgs(fn_name, 'num_positions', num_positions, [chk.isInt]);
//         // --- Error Check ---
//         if (coords.length < 3) {
//             throw new Error(fn_name + ': "coords" should be a list of at least three XYZ coords.');
//         }
//         if (degree < 2 || degree > 5) {
//             throw new Error(fn_name + ': "degree" should be between 2 and 5.');
//         }
//         if (degree > (coords.length - 1)) {
//             throw new Error(fn_name + ': a curve of degree ' + degree + ' requires at least ' + (degree + 1) + ' coords.');
//         }
//     }
//     const closed: boolean = close === _EClose.CLOSE;
//     // create the curve using the VERBS library
//     const offset = degree + 1;
//     const coords2: Txyz[] = coords.slice();
//     if (closed) {
//         const start: Txyz[] = coords2.slice(0, offset);
//         const end: Txyz[] = coords2.slice(coords2.length - offset, coords2.length);
//         coords2.splice(0, 0, ...end);
//         coords2.splice(coords2.length, 0, ...start);
//     }
//     const curve_verb = new VERB.geom.NurbsCurve.byPoints(coords2, degree);
//     // return the list of posis
//     const posis_i: number[] = nurbsToPosis(__model__, curve_verb, degree, closed, num_positions, coords[0]);
//     return idsMakeFromIdxs(EEntType.POSI, posis_i) as TId[];
// }
