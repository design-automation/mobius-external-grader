"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// longitude latitude in Singapore, NUS
exports.LONGLAT = [103.778329, 1.298759];
// some constants
exports.XYPLANE = [[0, 0, 0], [1, 0, 0], [0, 1, 0]];
exports.YZPLANE = [[0, 0, 0], [0, 1, 0], [0, 0, 1]];
exports.ZXPLANE = [[0, 0, 0], [0, 0, 1], [1, 0, 0]];
exports.YXPLANE = [[0, 0, 0], [0, 1, 0], [1, 0, 0]];
exports.ZYPLANE = [[0, 0, 0], [0, 0, 1], [0, 1, 0]];
exports.XZPLANE = [[0, 0, 0], [1, 0, 0], [0, 0, 1]];
// export interface IExpr {
//     ent_type1: string;
//     attrib_name1?: string;
//     attrib_index1?: number;
//     ent_type2?: string;
//     attrib_name2?: string;
//     attrib_index2?: number;
//     operator?: string;
//     value?: TAttribDataTypes;
// }
// export interface IExprQuery {
//     ent_type: EEntType;
//     attrib_name?: string;
//     attrib_index?: number;
//     operator?: EFilterOperatorTypes;
//     value?: TAttribDataTypes;
// }
// export interface IExprSort {
//     ent_type: EEntType;
//     attrib_name: string;
//     attrib_index?: number;
// }
// export interface IExprPush {
//     ent_type1: EEntType;
//     attrib_name1: string;
//     attrib_index1?: number;
//     ent_type2: EEntType;
//     attrib_name2: string;
//     attrib_index2?: number;
// }
// export enum EExprEntType {
//     POSI =   'ps',
//     VERT =   '_v',
//     EDGE =   '_e',
//     WIRE =   '_w',
//     FACE =   '_f',
//     POINT =  'pt',
//     PLINE =  'pl',
//     PGON =   'pg',
//     COLL =   'co'
// }
// Types of entities
var EEntType;
(function (EEntType) {
    EEntType[EEntType["POSI"] = 0] = "POSI";
    EEntType[EEntType["TRI"] = 1] = "TRI";
    EEntType[EEntType["VERT"] = 2] = "VERT";
    EEntType[EEntType["EDGE"] = 3] = "EDGE";
    EEntType[EEntType["WIRE"] = 4] = "WIRE";
    EEntType[EEntType["FACE"] = 5] = "FACE";
    EEntType[EEntType["POINT"] = 6] = "POINT";
    EEntType[EEntType["PLINE"] = 7] = "PLINE";
    EEntType[EEntType["PGON"] = 8] = "PGON";
    EEntType[EEntType["COLL"] = 9] = "COLL";
    EEntType[EEntType["MOD"] = 10] = "MOD";
})(EEntType = exports.EEntType || (exports.EEntType = {}));
// Types of entities
var EEntTypeStr;
(function (EEntTypeStr) {
    EEntTypeStr[EEntTypeStr["ps"] = 0] = "ps";
    EEntTypeStr[EEntTypeStr["_t"] = 1] = "_t";
    EEntTypeStr[EEntTypeStr["_v"] = 2] = "_v";
    EEntTypeStr[EEntTypeStr["_e"] = 3] = "_e";
    EEntTypeStr[EEntTypeStr["_w"] = 4] = "_w";
    EEntTypeStr[EEntTypeStr["_f"] = 5] = "_f";
    EEntTypeStr[EEntTypeStr["pt"] = 6] = "pt";
    EEntTypeStr[EEntTypeStr["pl"] = 7] = "pl";
    EEntTypeStr[EEntTypeStr["pg"] = 8] = "pg";
    EEntTypeStr[EEntTypeStr["co"] = 9] = "co";
    EEntTypeStr[EEntTypeStr["mo"] = 10] = "mo";
})(EEntTypeStr = exports.EEntTypeStr || (exports.EEntTypeStr = {}));
var EEntStrToGeomArray;
(function (EEntStrToGeomArray) {
    EEntStrToGeomArray[EEntStrToGeomArray["posis"] = 0] = "posis";
    EEntStrToGeomArray[EEntStrToGeomArray["dn_tris_verts"] = 1] = "dn_tris_verts";
    EEntStrToGeomArray[EEntStrToGeomArray["dn_verts_posis"] = 2] = "dn_verts_posis";
    EEntStrToGeomArray[EEntStrToGeomArray["dn_edges_verts"] = 3] = "dn_edges_verts";
    EEntStrToGeomArray[EEntStrToGeomArray["dn_wires_edges"] = 4] = "dn_wires_edges";
    EEntStrToGeomArray[EEntStrToGeomArray["dn_faces_wirestris"] = 5] = "dn_faces_wirestris";
    EEntStrToGeomArray[EEntStrToGeomArray["dn_points_verts"] = 6] = "dn_points_verts";
    EEntStrToGeomArray[EEntStrToGeomArray["dn_plines_wires"] = 7] = "dn_plines_wires";
    EEntStrToGeomArray[EEntStrToGeomArray["dn_pgons_faces"] = 8] = "dn_pgons_faces";
    EEntStrToGeomArray[EEntStrToGeomArray["dn_colls_objs"] = 9] = "dn_colls_objs";
})(EEntStrToGeomArray = exports.EEntStrToGeomArray || (exports.EEntStrToGeomArray = {}));
// Names of attributes
var EAttribNames;
(function (EAttribNames) {
    EAttribNames["COORDS"] = "xyz";
    EAttribNames["NORMAL"] = "normal";
    EAttribNames["COLOR"] = "rgb";
    EAttribNames["TEXTURE"] = "uv";
    EAttribNames["NAME"] = "name";
    EAttribNames["MATERIAL"] = "material";
})(EAttribNames = exports.EAttribNames || (exports.EAttribNames = {}));
/**
 * The types of operators that can be used in a filter.
 */
var EFilterOperatorTypes;
(function (EFilterOperatorTypes) {
    EFilterOperatorTypes["IS_EQUAL"] = "==";
    EFilterOperatorTypes["IS_NOT_EQUAL"] = "!=";
    EFilterOperatorTypes["IS_GREATER_OR_EQUAL"] = ">=";
    EFilterOperatorTypes["IS_LESS_OR_EQUAL"] = "<=";
    EFilterOperatorTypes["IS_GREATER"] = ">";
    EFilterOperatorTypes["IS_LESS"] = "<";
    EFilterOperatorTypes["EQUAL"] = "=";
})(EFilterOperatorTypes = exports.EFilterOperatorTypes || (exports.EFilterOperatorTypes = {}));
var ESort;
(function (ESort) {
    ESort["DESCENDING"] = "descending";
    ESort["ASCENDING"] = "ascending";
})(ESort = exports.ESort || (exports.ESort = {}));
var EAttribPush;
(function (EAttribPush) {
    EAttribPush[EAttribPush["AVERAGE"] = 0] = "AVERAGE";
    EAttribPush[EAttribPush["MEDIAN"] = 1] = "MEDIAN";
    EAttribPush[EAttribPush["SUM"] = 2] = "SUM";
    EAttribPush[EAttribPush["MIN"] = 3] = "MIN";
    EAttribPush[EAttribPush["MAX"] = 4] = "MAX";
    EAttribPush[EAttribPush["FIRST"] = 5] = "FIRST";
    EAttribPush[EAttribPush["LAST"] = 6] = "LAST";
})(EAttribPush = exports.EAttribPush || (exports.EAttribPush = {}));
// ================================================================================================
// JSON DATA
// ================================================================================================
// enums
var EAttribDataTypeStrs;
(function (EAttribDataTypeStrs) {
    // INT = 'Int',
    EAttribDataTypeStrs["NUMBER"] = "Number";
    EAttribDataTypeStrs["STRING"] = "String";
    EAttribDataTypeStrs["LIST"] = "List"; // a list of anything
})(EAttribDataTypeStrs = exports.EAttribDataTypeStrs || (exports.EAttribDataTypeStrs = {}));
// interfaces for JSON data
exports.RE_SPACES = /\s+/g;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYnMvZ2VvLWluZm8vY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsdUNBQXVDO0FBQzFCLFFBQUEsT0FBTyxHQUFHLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBRTlDLGlCQUFpQjtBQUNKLFFBQUEsT0FBTyxHQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwRCxRQUFBLE9BQU8sR0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEQsUUFBQSxPQUFPLEdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBRXBELFFBQUEsT0FBTyxHQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwRCxRQUFBLE9BQU8sR0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxD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