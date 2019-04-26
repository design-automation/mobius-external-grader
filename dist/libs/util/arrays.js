"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Remove an item from an array
 * @param arr
 * @param item
 */
function arrRem(arr, item) {
    const index = arr.indexOf(item);
    if (index === -1) {
        return;
    }
    arr.splice(index, 1);
}
exports.arrRem = arrRem;
/**
 * Add an item to an array in an array
 * @param arr
 * @param item
 */
function arrIdxAdd(arr, idx, item) {
    if (arr[idx] === undefined || arr[idx] === null) {
        arr[idx] = [];
    }
    arr[idx].push(item);
}
exports.arrIdxAdd = arrIdxAdd;
/**
 * Remove an item from an array in an array
 * @param arr
 * @param item
 */
function arrIdxRem(arr, idx, item, del_empty) {
    if (arr[idx] === undefined || arr[idx] === null) {
        return;
    }
    const rem_index = arr[idx].indexOf(item);
    if (rem_index === -1) {
        return;
    }
    arr[idx].splice(rem_index, 1);
    if (del_empty && arr[idx].length === 0) {
        delete arr[idx];
    }
}
exports.arrIdxRem = arrIdxRem;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYnMvdXRpbC9hcnJheXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztHQUlHO0FBQ0gsU0FBZ0IsTUFBTSxDQUFDLEdBQVUsRUFBRSxJQUFTO0lBQ3hDLE1BQU0sS0FBSyxHQUFXLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEMsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFBRSxPQUFPO0tBQUU7SUFDN0IsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDekIsQ0FBQztBQUpELHdCQUlDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQWdCLFNBQVMsQ0FBQyxHQUFVLEVBQUUsR0FBVyxFQUFFLElBQVM7SUFDeEQsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssU0FBUyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDN0MsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztLQUNqQjtJQUNELEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDeEIsQ0FBQztBQUxELDhCQUtDO0FBQ0Q7Ozs7R0FJRztBQUNILFNBQWdCLFNBQVMsQ0FBQyxHQUFVLEVBQUUsR0FBVyxFQUFFLElBQVMsRUFBRSxTQUFrQjtJQUM1RSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxTQUFTLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUM3QyxPQUFPO0tBQ1Y7SUFDRCxNQUFNLFNBQVMsR0FBVyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pELElBQUksU0FBUyxLQUFLLENBQUMsQ0FBQyxFQUFFO1FBQUUsT0FBTztLQUFFO0lBQ2pDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzlCLElBQUksU0FBUyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ3BDLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ25CO0FBQ0wsQ0FBQztBQVZELDhCQVVDIn0=