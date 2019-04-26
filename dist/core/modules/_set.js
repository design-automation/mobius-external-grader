"use strict";
/**
 * list functions that obtain and return information from an input list. Does not modify input list.
 */
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Mathjs = __importStar(require("mathjs"));
function setMake(list) {
    return Array.from(new Set(list));
}
exports.setMake = setMake;
function setUni(list1, list2) {
    return Mathjs.setUnion(list1, list2);
}
exports.setUni = setUni;
function setInt(list1, list2) {
    return Mathjs.setIntersect(list1, list2);
}
exports.setInt = setInt;
function setDif(list1, list2) {
    return Mathjs.setDifference(list1, list2);
}
exports.setDif = setDif;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3NldC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL21vZHVsZXMvX3NldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7Ozs7Ozs7OztBQUVILCtDQUFpQztBQUVqQyxTQUFnQixPQUFPLENBQUMsSUFBVztJQUMvQixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNyQyxDQUFDO0FBRkQsMEJBRUM7QUFFRCxTQUFnQixNQUFNLENBQUMsS0FBWSxFQUFFLEtBQVk7SUFDN0MsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBRkQsd0JBRUM7QUFFRCxTQUFnQixNQUFNLENBQUMsS0FBWSxFQUFFLEtBQVk7SUFDN0MsT0FBTyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztBQUM3QyxDQUFDO0FBRkQsd0JBRUM7QUFFRCxTQUFnQixNQUFNLENBQUMsS0FBWSxFQUFFLEtBQVk7SUFDN0MsT0FBTyxNQUFNLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBRkQsd0JBRUMifQ==