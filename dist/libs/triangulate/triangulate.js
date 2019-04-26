"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const three = __importStar(require("three"));
const threex = __importStar(require("./threex"));
const earcut = __importStar(require("./earcut"));
const triangle_1 = require("../geom/triangle");
//  3D to 2D ======================================================================================================
/**
 * Function that returns a matrix to transform a set of vertices in 3d space onto the xy plane.
 * This function assumes that the vertices are more or less co-planar.
 * Returns a set of three Vectors that represent points on the xy plane.
 * Returns null if the plane cannot be found, e.g. points are all colinear.
 */
function _getMatrix(points) {
    // calculate origin
    const o = new three.Vector3();
    for (const v of points) {
        o.add(v);
    }
    o.divideScalar(points.length);
    // find three vectors
    let vx;
    let vz;
    let got_vx = false;
    for (let i = 0; i < points.length; i++) {
        if (!got_vx) {
            vx = threex.subVectors(points[i], o);
            if (vx.lengthSq() !== 0) {
                got_vx = true;
            }
        }
        else {
            vz = threex.crossVectors(vx, threex.subVectors(points[i], o));
            if (vz.lengthSq() !== 0) {
                break;
            }
        }
        if (i === points.length - 1) {
            return null;
        } // could not find any pair of vectors
    }
    const vy = threex.crossVectors(vz, vx);
    // create matrix
    vx.normalize();
    vy.normalize();
    vz.normalize();
    const m2 = new three.Matrix4();
    m2.makeBasis(vx, vy, vz);
    m2.getInverse(m2);
    return m2;
}
/**
 * Triangulates a set of coords in 3d with holes
 * If the coords cannot be triangulated, it returns [].
 * @param coords
 */
function triangulate(coords, holes) {
    // check if we have holes
    const has_holes = (holes !== undefined && holes.length !== 0);
    // basic case, a triangle with no holes
    if (coords.length === 3 && !has_holes) {
        return [[0, 1, 2]];
    }
    // basic case, a quad with no holes
    if (coords.length === 4 && !has_holes) {
        // TODO this does not take into account degenerate cases
        // TODO two points in same location
        // TODO Three points that are colinear
        const area1 = triangle_1.area(coords[0], coords[1], coords[2]) + triangle_1.area(coords[2], coords[3], coords[0]);
        const area2 = triangle_1.area(coords[0], coords[1], coords[3]) + triangle_1.area(coords[1], coords[2], coords[3]);
        const tri1a = [coords[0], coords[1], coords[2]];
        const tri1b = [coords[2], coords[3], coords[0]];
        const tri2a = [coords[0], coords[1], coords[3]];
        const tri2b = [coords[1], coords[2], coords[3]];
        if (area1 < area2) {
            return [[0, 1, 2], [2, 3, 0]];
        }
        else {
            return [[0, 1, 3], [1, 2, 3]];
        }
    }
    // get the matrix to transform from 2D to 3D
    const coords_v = coords.map(coord => new three.Vector3(...coord));
    const matrix = _getMatrix(coords_v);
    // check for null, which means no plane could be found
    if (matrix === null) {
        return [];
    }
    // create an array to store all x y vertex coordinates
    const flat_vert_xys = [];
    // get the perimeter vertices and add them to the array
    const coords_v_2d = coords_v.map((coord_v) => threex.multVectorMatrix(coord_v, matrix));
    if (coords_v_2d === undefined || coords_v_2d === null || coords_v_2d.length === 0) {
        console.log('WARNING: triangulation failed.');
        return [];
    }
    coords_v_2d.forEach(coord_v_2d => flat_vert_xys.push(coord_v_2d.x, coord_v_2d.y));
    // hole vertices uing EARCUT
    // holes is an array of hole indices if any (e.g. [5, 8] for a 12-vertex input would mean 
    // one hole with vertices 5–7 and another with 8–11).
    const hole_indices = [];
    let index_counter = coords_v.length;
    if (has_holes) {
        for (const hole of holes) {
            hole_indices.push(index_counter);
            if (hole.length) {
                const hole_coords_v = hole.map(hole_coord => new three.Vector3(...hole_coord));
                const hole_coords_v_2d = hole_coords_v.map((hole_coord_v) => threex.multVectorMatrix(hole_coord_v, matrix));
                const one_hole = [];
                hole_coords_v_2d.forEach(hole_coord_v => flat_vert_xys.push(hole_coord_v.x, hole_coord_v.y));
                index_counter += hole.length;
            }
        }
    }
    // do the triangulation
    const flat_tris_i = earcut.Earcut.triangulate(flat_vert_xys, hole_indices);
    // convert the triangles into lists of three
    const tris_i = [];
    for (let i = 0; i < flat_tris_i.length; i += 3) {
        tris_i.push([flat_tris_i[i], flat_tris_i[i + 1], flat_tris_i[i + 2]]);
    }
    // return the list of triangles
    return tris_i;
}
exports.triangulate = triangulate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJpYW5ndWxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlicy90cmlhbmd1bGF0ZS90cmlhbmd1bGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFDQSw2Q0FBK0I7QUFDL0IsaURBQW1DO0FBQ25DLGlEQUFtQztBQUVuQywrQ0FBd0M7QUFFeEMsbUhBQW1IO0FBRW5IOzs7OztHQUtHO0FBQ0gsU0FBUyxVQUFVLENBQUMsTUFBdUI7SUFFdkMsbUJBQW1CO0lBQ25CLE1BQU0sQ0FBQyxHQUFrQixJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM3QyxLQUFLLE1BQU0sQ0FBQyxJQUFJLE1BQU0sRUFBRTtRQUNwQixDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ1o7SUFDRCxDQUFDLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUU5QixxQkFBcUI7SUFDckIsSUFBSSxFQUFpQixDQUFDO0lBQ3RCLElBQUksRUFBaUIsQ0FBQztJQUN0QixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7SUFDbkIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDcEMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNULEVBQUUsR0FBSSxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0QyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQUMsTUFBTSxHQUFHLElBQUksQ0FBQzthQUFFO1NBQzdDO2FBQU07WUFDSCxFQUFFLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5RCxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQUUsTUFBTTthQUFFO1NBQ3RDO1FBQ0QsSUFBSSxDQUFDLEtBQUssTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFBRSxPQUFPLElBQUksQ0FBQztTQUFFLENBQUMscUNBQXFDO0tBQ3RGO0lBQ0QsTUFBTSxFQUFFLEdBQW1CLE1BQU0sQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRXZELGdCQUFnQjtJQUNoQixFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDZixFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDZixFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDZixNQUFNLEVBQUUsR0FBa0IsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDOUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3pCLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDbEIsT0FBTyxFQUFFLENBQUM7QUFDZCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQWdCLFdBQVcsQ0FBQyxNQUFjLEVBQUUsS0FBZ0I7SUFFeEQseUJBQXlCO0lBQ3pCLE1BQU0sU0FBUyxHQUFZLENBQUMsS0FBSyxLQUFLLFNBQVMsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBRXZFLHVDQUF1QztJQUN2QyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ25DLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN0QjtJQUVELG1DQUFtQztJQUNuQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ25DLHdEQUF3RDtRQUN4RCxtQ0FBbUM7UUFDbkMsc0NBQXNDO1FBQ3RDLE1BQU0sS0FBSyxHQUFXLGVBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLGVBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BHLE1BQU0sS0FBSyxHQUFXLGVBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLGVBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BHLE1BQU0sS0FBSyxHQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4RCxNQUFNLEtBQUssR0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEQsTUFBTSxLQUFLLEdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hELE1BQU0sS0FBSyxHQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4RCxJQUFJLEtBQUssR0FBRyxLQUFLLEVBQUU7WUFDZixPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2pDO2FBQU07WUFDSCxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2pDO0tBQ0o7SUFFRCw0Q0FBNEM7SUFDNUMsTUFBTSxRQUFRLEdBQW9CLE1BQU0sQ0FBQyxHQUFHLENBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ3BGLE1BQU0sTUFBTSxHQUFrQixVQUFVLENBQUUsUUFBUSxDQUFFLENBQUM7SUFFckQsc0RBQXNEO0lBQ3RELElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtRQUNqQixPQUFPLEVBQUUsQ0FBQztLQUNiO0lBRUQsc0RBQXNEO0lBQ3RELE1BQU0sYUFBYSxHQUFhLEVBQUUsQ0FBQztJQUVuQyx1REFBdUQ7SUFDdkQsTUFBTSxXQUFXLEdBQW9CLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUN6RyxJQUFJLFdBQVcsS0FBSyxTQUFTLElBQUksV0FBVyxLQUFLLElBQUksSUFBSSxXQUFXLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUMvRSxPQUFPLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7UUFDOUMsT0FBTyxFQUFFLENBQUM7S0FDYjtJQUNELFdBQVcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFbEYsNEJBQTRCO0lBQzVCLDBGQUEwRjtJQUMxRixxREFBcUQ7SUFDckQsTUFBTSxZQUFZLEdBQWEsRUFBRSxDQUFDO0lBQ2xDLElBQUksYUFBYSxHQUFXLFFBQVEsQ0FBQyxNQUFNLENBQUM7SUFDNUMsSUFBSSxTQUFTLEVBQUU7UUFDWCxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtZQUN0QixZQUFZLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ2pDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDYixNQUFNLGFBQWEsR0FBb0IsSUFBSSxDQUFDLEdBQUcsQ0FBRSxVQUFVLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pHLE1BQU0sZ0JBQWdCLEdBQW9CLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUN6RSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELE1BQU0sUUFBUSxHQUFhLEVBQUUsQ0FBQztnQkFDOUIsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3RixhQUFhLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQzthQUNoQztTQUNKO0tBQ0o7SUFFRCx1QkFBdUI7SUFDdkIsTUFBTSxXQUFXLEdBQWEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBRXJGLDRDQUE0QztJQUM1QyxNQUFNLE1BQU0sR0FBZSxFQUFFLENBQUM7SUFDOUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUM1QyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDekU7SUFFRCwrQkFBK0I7SUFDL0IsT0FBTyxNQUFNLENBQUM7QUFDbEIsQ0FBQztBQTlFRCxrQ0E4RUMifQ==