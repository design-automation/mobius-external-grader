"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//longitude latitude in Singapore, NUS
exports.LONGLAT = [103.778329, 1.298759];
// some constants
exports.XYPLANE = [[0, 0, 0], [1, 0, 0], [0, 1, 0]];
exports.YZPLANE = [[0, 0, 0], [0, 1, 0], [0, 0, 1]];
exports.ZXPLANE = [[0, 0, 0], [0, 0, 1], [1, 0, 0]];
exports.YXPLANE = [[0, 0, 0], [0, 1, 0], [1, 0, 0]];
exports.ZYPLANE = [[0, 0, 0], [0, 0, 1], [0, 1, 0]];
exports.XZPLANE = [[0, 0, 0], [1, 0, 0], [0, 0, 1]];
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
    EAttribNames["COLOUR"] = "rgb";
    EAttribNames["TEXTURE"] = "uv";
    EAttribNames["NAME"] = "name";
})(EAttribNames = exports.EAttribNames || (exports.EAttribNames = {}));
/**
 * The types of operators that can be used in a query.
 */
var EQueryOperatorTypes;
(function (EQueryOperatorTypes) {
    EQueryOperatorTypes["IS_EQUAL"] = "==";
    EQueryOperatorTypes["IS_NOT_EQUAL"] = "!=";
    EQueryOperatorTypes["IS_GREATER_OR_EQUAL"] = ">=";
    EQueryOperatorTypes["IS_LESS_OR_EQUAL"] = "<=";
    EQueryOperatorTypes["IS_GREATER"] = ">";
    EQueryOperatorTypes["IS_LESS"] = "<";
    EQueryOperatorTypes["EQUAL"] = "=";
})(EQueryOperatorTypes = exports.EQueryOperatorTypes || (exports.EQueryOperatorTypes = {}));
var ESort;
(function (ESort) {
    ESort["DESCENDING"] = "descending";
    ESort["ASCENDING"] = "ascending";
})(ESort = exports.ESort || (exports.ESort = {}));
var EAttribPromote;
(function (EAttribPromote) {
    EAttribPromote[EAttribPromote["AVERAGE"] = 0] = "AVERAGE";
    EAttribPromote[EAttribPromote["MEDIAN"] = 1] = "MEDIAN";
    EAttribPromote[EAttribPromote["SUM"] = 2] = "SUM";
    EAttribPromote[EAttribPromote["MIN"] = 3] = "MIN";
    EAttribPromote[EAttribPromote["MAX"] = 4] = "MAX";
    EAttribPromote[EAttribPromote["FIRST"] = 5] = "FIRST";
    EAttribPromote[EAttribPromote["LAST"] = 6] = "LAST";
})(EAttribPromote = exports.EAttribPromote || (exports.EAttribPromote = {}));
// ================================================================================================
// JSON DATA
// ================================================================================================
// enums
var EAttribDataTypeStrs;
(function (EAttribDataTypeStrs) {
    // INT = 'Int',
    EAttribDataTypeStrs["FLOAT"] = "Float";
    EAttribDataTypeStrs["STRING"] = "String";
})(EAttribDataTypeStrs = exports.EAttribDataTypeStrs || (exports.EAttribDataTypeStrs = {}));
// interfaces for JSON data
exports.RE_SPACES = /\s+/g;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYnMvZ2VvLWluZm8vY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsc0NBQXNDO0FBQ3pCLFFBQUEsT0FBTyxHQUFHLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBRTlDLGlCQUFpQjtBQUNKLFFBQUEsT0FBTyxHQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwRCxRQUFBLE9BQU8sR0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEQsUUFBQSxPQUFPLEdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBRXBELFFBQUEsT0FBTyxHQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwRCxRQUFBLE9BQU8sR0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxD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