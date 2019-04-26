"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inline_query_expr = [
    ['#@name == value', 'Search for entities with attributes equal to a given value'],
    ['#@name[i] == value', 'Search for entities with attributes with index equal to a given value'],
    ['#@name != value', 'Search for entities with attributes not equal to a given value'],
    ['#@name[i] != value', 'Search for entities with attributes with index not equal to a given value'],
    ['#@name > value', 'Search for entities with attributes greater than a given value'],
    ['#@name[i] > value', 'Search for entities with attributes with index greater than a given value'],
    ['#@name >= value', 'Search for entities with attributes greater than or equal to a given value'],
    ['#@name[i] >= value', 'Search for entities with attributes with index greater than or equal to a given value'],
    ['#@name < value', 'Search for entities with attributes less than a given value'],
    ['#@name[i] < value', 'Search for entities with attributes with index less than a given value'],
    ['#@name <= value', 'Search for entities with attributes less than or equal to a given value'],
    ['#@name[i] <= value', 'Search for entities with attributes with index less than or equal to a given value']
];
exports.inline_sort_expr = [
    ['#@name', 'Sort based on attribute value'],
    ['#@name[i]', 'Sort based on attribute index value']
];
const constants = [
    ['PI', 'The mathematical constant PI, 3.141... '],
    ['XY', 'A plane at the origin, aligned with the XY plane'],
    ['YZ', 'A plane at the origin, aligned with the YZ plane'],
    ['ZX', 'A plane at the origin, aligned with the ZX plane'],
    ['YX', 'A plane at the origin, aligned with the YX plane'],
    ['ZY', 'A plane at the origin, aligned with the ZY plane'],
    ['XZ', 'A plane at the origin, aligned with the XZ plane']
];
const lists = [
    ['range(start, end)', 'Generates a list of integers, from start to end, with a step size of 1'],
    ['range(start, end, step?)', 'Generates a list of integers, from start to end, with a specified step size'],
    ['isList(list)', 'Returns true if this is a list, false otherwise.'],
    ['listLen(list)', 'Returns the number of items in the list'],
    ['listLast(list)', 'Returns the last item in a list'],
    ['listGet(list, index)', 'Returns the item in the list specified by index, either a positive or negative integer'],
    ['listFind(list, val)', 'Returns the index of the first occurence of the value in the list, or -1 if not found'],
    ['listHas(list, val)', 'Returns true if the list contains the value, false otherwise'],
    ['listCount(list, val)', 'Returns the number of times the value is in the list'],
    ['listCopy(list)', 'Returns a copy of the list'],
    ['listJoin(list1, list2)', 'Joins two lists into a single list'],
    ['listFlat(list)', 'Returns a copy of the nested list, flattened to a depth of 1'],
    ['listFlat(list, depth?)', 'Returns a copy of the nested list, flattened to the specified depth'],
    ['listSlice(list, start, end?)', 'Return a sub-list from the list'],
    ['listZip(lists)', 'Converts a set of lists from rows into columns, based on the shortest list'],
    ['lisZip2(lists)', 'Converts a set of lists from rows into columns, based on the longest list']
];
const vectors = [
    ['vecAdd(v1, v2)', 'Adds two vectors'],
    ['vecSub(v1, v2)', 'Subtracts vec2 from vec1'],
    ['vecDiv(v, num)', 'Divides a vector by a number'],
    ['vecMult(v, num)', 'Multiplies a vector by a number'],
    ['vecLen(v)', 'Calculates the magnitude of a vector'],
    ['vecSetLen(v, num)', 'Sets the magnitude of a vector'],
    ['vecNorm(v)', 'Sets the magnitude of a vector to 1'],
    ['vecRev(v)', 'Reverses the direction of a vector'],
    ['vecFromTo(pt1, pt2)', 'Creates a vector between two points'],
    ['vecAng(v1, v2)', 'Calculate the angle (0 to PI) between two vectors'],
    ['vecAng2(v1, v2, n)', 'Calculate the angle (0 to 2PI) between two vectors, relative to the plane normal'],
    ['vecDot(v1, v2)', 'Calculates the cross product of thre vectors'],
    ['vecCross(v1, v2)', 'Calculates the dot product of two vectors'],
    ['vecEqual(v1, v2, tol)', 'Returns true if the difference between two vectors is smaler than a specified tolerance']
];
const colours = [
    ['colFalse(val, min, max)', 'Creates a colour from a value in the range between min and max.']
];
const conversion = [
    ['boolean(val)', 'Converts the value to a boolean'],
    ['number(val)', 'Converts the value to a number'],
    ['string(val)', 'Converts the value to a string'],
    ['radToDeg(rad)', 'Converts radians to degrees'],
    ['degToRad(deg)', 'Converts degrees to radians']
];
const random = [
    ['rand(min, max)', 'Returns a random number in the specified range'],
    ['rand(min, max, seed)', 'Returns a random number in the specified range, given a numeric seed'],
    ['randInt(min, max)', 'Returns a random integer in the specified range'],
    ['randInt(min, max, seed)', 'Returns a random integer in the specified range, given a numeric seed'],
    ['randPick(list, num)', 'Returns a random set of items from the list'],
    ['randPick(list, num, seed)', 'Returns a random set of items from the list, given a numeric seed']
];
const arithmetic = [
    ['approx(num, num, tol)', 'Returns if the difference between the two numbers is less than the tolerance, t'],
    ['abs(num)', 'Returns the absolute value of the number'],
    ['square(num)', 'Returns the square of the number'],
    ['cube(num)', 'Returns the cube of the number'],
    ['pow(numb, pow)', 'Returns the number to the specified power'],
    ['sqrt(num)', 'Returns the square root of the number'],
    ['exp(num)', 'Returns the value of E to the power of the number'],
    ['log(num)', 'Returns the natural logarithm (base E) of the number'],
    ['round(num)', 'Returns the value of the number rounded to its nearest integer'],
    ['ceil(num)', 'Returns the value of the number rounded up to its nearest integer'],
    ['floor(num)', 'Returns the value of the number rounded down to its nearest integer'],
    ['mod(num1, num2)', 'Returns the remainder after division of num1 by num2'],
    ['sum(list)', 'Returns the sum of all values in a list'],
    ['prod(list)', 'Returns the product of all values in a list'],
    ['hypot(list)', 'Returns the hypothenuse of all values in a list'],
    ['norm(list)', 'Returns the norm of a list'],
    ['distance(c1, c2)', 'Returns the Eucledian distance between two xyzs, c1 and c2'],
    ['distance(c, r)', 'Returns the Eucledian distance between an xyz c and an infinite ray r'],
    ['distance(c, p)', 'Returns the Eucledian distance between an xyz c and an infinite plane p'],
    ['intersect(r1, r2)', 'Returns the intersection xyz between two infinite rays'],
    ['intersect(r, p)', 'Returns the intersection xyz between a ray r and a plane p'],
    ['project(c, r)', 'Returns the xyz from projecting an xyz c onto an infinite ray r'],
    ['project(c, p)', 'Returns the xyz from projecting an xyz c onto an infinite plane p']
];
const statistics = [
    ['min(list)', 'Returns the number with the lowest value'],
    ['max(list)', 'Returns the number with the highest value'],
    ['mad(list)', 'Returns the median absolute deviation of the list'],
    ['mean(list)', 'Returns the mean value of the list'],
    ['median(list)', 'Returns the median of the list'],
    ['mode(list)', 'Returns the mode of the list'],
    ['std(list)', 'Returns the standard deviation of the list'],
    ['vari(list)', 'Returns the variance of the list']
];
const trigonometry = [
    ['sin(rad)', 'Returns the sine of a value (in radians)'],
    ['asin(num)', 'Returns the inverse sine of a value (in radians)'],
    ['sinh(rad)', 'Returns the hyperbolic sine of a value (in radians)'],
    ['asinh(num)', 'Returns the hyperbolic arcsine of a value (in radians)'],
    ['cos(rad)', 'Returns the cosine of a value (in radians)'],
    ['acos(num)', 'Returns the inverse cosine of a value (in radians)'],
    ['cosh(rad)', 'Returns the hyperbolic cosine of a value (in radians)'],
    ['acosh(num)', 'Returns the hyperbolic arccos of a value (in radians)'],
    ['tan(rad)', 'Returns the tangent of a value (in radians)'],
    ['atan(num)', 'Returns the inverse tangent of a value (in radians)'],
    ['tanh(rad)', 'Returns the hyperbolic tangent of a value (in radians)'],
    ['atanh(num)', 'Returns the hyperbolic arctangent of a value (in radians)'],
    ['atan2(number1, number2)', 'Returns the inverse tangent function with two arguments, number1/number2']
];
const str = [
    ['replace(string,search_str,new_str)', 'Replace all instances of specified search with a new string']
];
exports.inline_func = [
    ['constants', constants],
    ['random', random],
    ['lists', lists],
    ['conversion', conversion],
    ['vectors', vectors],
    ['colours', colours],
    ['arithmetic', arithmetic],
    ['statistics', statistics],
    ['trigonometry', trigonometry]
];
// const inline_func_lst: string[][][] = inline_func.map(x => x[1]);
// const inline_func_lst = [
//     lists,
//     conversion,
//     arithmetic,
//     statistics,
//     trigonometry
// ];
// const inline_fn_names = [];
// for (let i = 0; i < inline_func_lst.length; i++) {
//     inline_func_lst[i].forEach((arr) => {
//         const mtch = arr[0].match(/^\w*(?=\()/);
//         let ret;
//         if (mtch !== null) {
//             ret = mtch[0];
//         } else {
//             ret = arr[0];
//         }
//         inline_fn_names.push(ret);
//     });
// }
// export const inline_fn_regEx = RegExp(inline_fn_names.join('|'), 'g');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvcmUvaW5saW5lL2lubGluZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNhLFFBQUEsaUJBQWlCLEdBQUc7SUFDN0IsQ0FBQyxpQkFBaUIsRUFBRSw0REFBNEQsQ0FBQztJQUNqRixDQUFDLG9CQUFvQixFQUFFLHVFQUF1RSxDQUFDO0lBQy9GLENBQUMsaUJBQWlCLEVBQUUsZ0VBQWdFLENBQUM7SUFDckYsQ0FBQyxvQkFBb0IsRUFBRSwyRUFBMkUsQ0FBQztJQUNuRyxDQUFDLGdCQUFnQixFQUFFLGdFQUFnRSxDQUFDO0lBQ3BGLENBQUMsbUJBQW1CLEVBQUUsMkVBQTJFLENBQUM7SUFDbEcsQ0FBQyxpQkFBaUIsRUFBRSw0RUFBNEUsQ0FBQztJQUNqRyxDQUFDLG9CQUFvQixFQUFFLHVGQUF1RixDQUFDO0lBQy9HLENBQUMsZ0JBQWdCLEVBQUUsNkRBQTZELENBQUM7SUFDakYsQ0FBQyxtQkFBbUIsRUFBRSx3RUFBd0UsQ0FBQztJQUMvRixDQUFDLGlCQUFpQixFQUFFLHlFQUF5RSxDQUFDO0lBQzlGLENBQUMsb0JBQW9CLEVBQUUsb0ZBQW9GLENBQUM7Q0FDL0csQ0FBQztBQUVXLFFBQUEsZ0JBQWdCLEdBQUc7SUFDNUIsQ0FBQyxRQUFRLEVBQUUsK0JBQStCLENBQUM7SUFDM0MsQ0FBQyxXQUFXLEVBQUUscUNBQXFDLENBQUM7Q0FDdkQsQ0FBQztBQUVGLE1BQU0sU0FBUyxHQUFHO0lBQ2QsQ0FBQyxJQUFJLEVBQUUseUNBQXlDLENBQUM7SUFDakQsQ0FBQyxJQUFJLEVBQUUsa0RBQWtELENBQUM7SUFDMUQsQ0FBQyxJQUFJLEVBQUUsa0RBQWtELENBQUM7SUFDMUQsQ0FBQyxJQUFJLEVBQUUsa0RBQWtELENBQUM7SUFDMUQsQ0FBQyxJQUFJLEVBQUUsa0RBQWtELENBQUM7SUFDMUQsQ0FBQyxJQUFJLEVBQUUsa0RBQWtELENBQUM7SUFDMUQsQ0FB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