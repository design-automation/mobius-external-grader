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
const EPS = 1e-6;
/**
 * Utility functions for threejs.
 */
// Matrices ======================================================================================================
function multVectorMatrix(v, m) {
    const v2 = v.clone();
    v2.applyMatrix4(m);
    return v2;
}
exports.multVectorMatrix = multVectorMatrix;
function xformMatrix(o, x, y, z) {
    x.normalize();
    y.normalize();
    z.normalize();
    const m1 = new three.Matrix4();
    const o_neg = o.clone().negate();
    m1.setPosition(o_neg);
    const m2 = new three.Matrix4();
    m2.makeBasis(x, y, z);
    m2.getInverse(m2);
    const m3 = new three.Matrix4();
    m3.multiplyMatrices(m2, m1);
    return m3;
}
exports.xformMatrix = xformMatrix;
function matrixInv(m) {
    const m2 = new three.Matrix4();
    return m2.getInverse(m);
}
exports.matrixInv = matrixInv;
//  Vectors =======================================================================================================
function subVectors(v1, v2, norm = false) {
    const v3 = new three.Vector3();
    v3.subVectors(v1, v2);
    if (norm) {
        v3.normalize();
    }
    return v3;
}
exports.subVectors = subVectors;
function addVectors(v1, v2, norm = false) {
    const v3 = new three.Vector3();
    v3.addVectors(v1, v2);
    if (norm) {
        v3.normalize();
    }
    return v3;
}
exports.addVectors = addVectors;
function crossVectors(v1, v2, norm = false) {
    const v3 = new three.Vector3();
    v3.crossVectors(v1, v2);
    if (norm) {
        v3.normalize();
    }
    return v3;
}
exports.crossVectors = crossVectors;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyZWV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYnMvdHJpYW5ndWxhdGUvdGhyZWV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLDZDQUErQjtBQUUvQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDakI7O0dBRUc7QUFFRixrSEFBa0g7QUFFbkgsU0FBZ0IsZ0JBQWdCLENBQUMsQ0FBZ0IsRUFBRSxDQUFnQjtJQUMvRCxNQUFNLEVBQUUsR0FBa0IsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3BDLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkIsT0FBTyxFQUFFLENBQUM7QUFDZCxDQUFDO0FBSkQsNENBSUM7QUFFRCxTQUFnQixXQUFXLENBQUMsQ0FBZ0IsRUFBRSxDQUFnQixFQUFFLENBQWdCLEVBQUUsQ0FBZ0I7SUFDOUYsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ2QsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ2QsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ2QsTUFBTSxFQUFFLEdBQWtCLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzlDLE1BQU0sS0FBSyxHQUFrQixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDaEQsRUFBRSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN0QixNQUFNLEVBQUUsR0FBa0IsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDOUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDbEIsTUFBTSxFQUFFLEdBQWtCLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzlDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDNUIsT0FBTyxFQUFFLENBQUM7QUFDZCxDQUFDO0FBYkQsa0NBYUM7QUFFRCxTQUFnQixTQUFTLENBQUMsQ0FBZ0I7SUFDdEMsTUFBTSxFQUFFLEdBQWtCLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzlDLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QixDQUFDO0FBSEQsOEJBR0M7QUFFRCxtSEFBbUg7QUFFbkgsU0FBZ0IsVUFBVSxDQUFDLEVBQWlCLEVBQUUsRUFBaUIsRUFBRSxPQUFnQixLQUFLO0lBQ2xGLE1BQU0sRUFBRSxHQUFrQixJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM5QyxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN0QixJQUFJLElBQUksRUFBRTtRQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztLQUFFO0lBQzVCLE9BQU8sRUFBRSxDQUFDO0FBQ2QsQ0FBQztBQUxELGdDQUtDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLEVBQWlCLEVBQUUsRUFBaUIsRUFBRSxPQUFnQixLQUFLO0lBQ2xGLE1BQU0sRUFBRSxHQUFrQixJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM5QyxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN0QixJQUFJLElBQUksRUFBRTtRQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztLQUFFO0lBQzVCLE9BQU8sRUFBRSxDQUFDO0FBQ2QsQ0FBQztBQUxELGdDQUtDO0FBRUQsU0FBZ0IsWUFBWSxDQUFDLEVBQWlCLEVBQUUsRUFBaUIsRUFBRSxPQUFnQixLQUFLO0lBQ3BGLE1BQU0sRUFBRSxHQUFrQixJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM5QyxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN4QixJQUFJLElBQUksRUFBRTtRQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztLQUFFO0lBQzVCLE9BQU8sRUFBRSxDQUFDO0FBQ2QsQ0FBQztBQUxELG9DQUtDIn0=