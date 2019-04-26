"use strict";
/**
 * The `util` module has functions for importing data into the model and
 * exporting data out of the model.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const io_obj_1 = require("../../libs/geo-info/io_obj");
const io_geojson_1 = require("../../libs/geo-info/io_geojson");
const download_1 = require("../../libs/filesys/download");
const common_1 = require("../../libs/geo-info/common");
const id_1 = require("../../libs/geo-info/id");
// ================================================================================================
// Import / Export data types
var _EIODataFormat;
(function (_EIODataFormat) {
    _EIODataFormat["GI"] = "gi";
    _EIODataFormat["OBJ"] = "obj";
    _EIODataFormat["GEOJSON"] = "geojson";
})(_EIODataFormat = exports._EIODataFormat || (exports._EIODataFormat = {}));
/**
 * Imports data into the model.
 * In order to get the model data from a file, you need to define the File or URL parameter
 * in the Start node of the flowchart.
 *
 * @param model_data The model data
 * @param data_format Enum, the file format.
 * @returns A list of the positions, points, polylines, polygons and collections added to the model.
 * @example util.ImportData (file1_data, obj)
 * @example_info Imports the data from file1 (defining the .obj file uploaded in 'Start' node).
 */
function ImportData(__model__, model_data, data_format) {
    let geom_pack;
    switch (data_format) {
        case _EIODataFormat.GI:
            const gi_json = JSON.parse(model_data);
            geom_pack = __model__.setData(gi_json);
            break;
        case _EIODataFormat.OBJ:
            throw new Error('Not implemented');
            // const obj_model: GIModel = importObj(model_data);
            // geom_pack = __merge__(__model__, obj_model);
            break;
        case _EIODataFormat.GEOJSON:
            geom_pack = io_geojson_1.importGeojson(__model__, model_data, 0);
            break;
        default:
            throw new Error('Data type not recognised');
            break;
    }
    if (geom_pack === undefined) {
        return [];
    }
    const posis_id = geom_pack.posis_i.map(posi_i => id_1.idsMake([common_1.EEntType.POSI, posi_i]));
    const points_id = geom_pack.points_i.map(point_i => id_1.idsMake([common_1.EEntType.POINT, point_i]));
    const plines_id = geom_pack.plines_i.map(pline_i => id_1.idsMake([common_1.EEntType.PLINE, pline_i]));
    const pgons_id = geom_pack.pgons_i.map(pgon_i => id_1.idsMake([common_1.EEntType.PGON, pgon_i]));
    const colls_id = geom_pack.colls_i.map(coll_i => id_1.idsMake([common_1.EEntType.COLL, coll_i]));
    return [...posis_id, ...points_id, ...plines_id, ...pgons_id, ...colls_id];
}
exports.ImportData = ImportData;
// ================================================================================================
/**
 * Export data from the model as a file.
 * This will result in a popup in your browser, asking you to save the filel.
 * @param __model__
 * @param filename Name of the file as a string.
 * @param data_format Enum, the file format.
 * @returns Boolean.
 * @example util.ExportData ('my_model.obj', obj)
 * @example_info Exports all the data in the model as an OBJ.
 */
function ExportData(__model__, filename, data_format) {
    switch (data_format) {
        case _EIODataFormat.GI:
            let gi_data = JSON.stringify(__model__.getData());
            gi_data = gi_data.replace(/\\\"/g, '\\\\\\"'); // TODO temporary fix
            return download_1.download(gi_data, filename);
            break;
        case _EIODataFormat.OBJ:
            const obj_data = io_obj_1.exportObj(__model__);
            return download_1.download(obj_data, filename);
            break;
        // case _EIODataFormat.GEOJSON:
        //     const geojson_data: string = exportObj(__model__);
        //     return download(obj_data, filename);
        //     break;
        default:
            throw new Error('Data type not recognised');
            break;
    }
}
exports.ExportData = ExportData;
// ================================================================================================
/**
 * Returns a text summary of the contents of this model
 *
 * @param __model__
 * @returns Text that summarises what is in the model, click print to see this text.
 */
function ModelInfo(__model__) {
    return JSON.stringify({
        'geometry': {
            'num_positions': __model__.geom.query.numEnts(common_1.EEntType.POSI, false),
            'num_vertices': __model__.geom.query.numEnts(common_1.EEntType.VERT, false),
            'num_edges': __model__.geom.query.numEnts(common_1.EEntType.EDGE, false),
            'num_wires': __model__.geom.query.numEnts(common_1.EEntType.WIRE, false),
            'num_faces': __model__.geom.query.numEnts(common_1.EEntType.FACE, false),
            'num_points': __model__.geom.query.numEnts(common_1.EEntType.POINT, false),
            'num_polylines': __model__.geom.query.numEnts(common_1.EEntType.PLINE, false),
            'num_polygons': __model__.geom.query.numEnts(common_1.EEntType.PGON, false),
            'num_collections': __model__.geom.query.numEnts(common_1.EEntType.COLL, false)
        },
        'attributes': {
            'position_attribs': __model__.attribs.query.getAttribNames(common_1.EEntType.POSI),
            'vertex_attribs': __model__.attribs.query.getAttribNames(common_1.EEntType.VERT),
            'edge_attribs': __model__.attribs.query.getAttribNames(common_1.EEntType.EDGE),
            'wire_attribs': __model__.attribs.query.getAttribNames(common_1.EEntType.WIRE),
            'face_attribs': __model__.attribs.query.getAttribNames(common_1.EEntType.FACE),
            'point_attribs': __model__.attribs.query.getAttribNames(common_1.EEntType.POINT),
            'polyline_attribs': __model__.attribs.query.getAttribNames(common_1.EEntType.PLINE),
            'polygon_attribs': __model__.attribs.query.getAttribNames(common_1.EEntType.PGON),
            'collection_attribs': __model__.attribs.query.getAttribNames(common_1.EEntType.COLL),
            'model_attribs': __model__.attribs.query.getAttribNames(common_1.EEntType.MOD)
        }
    });
}
exports.ModelInfo = ModelInfo;
// ================================================================================================
/**
 * Check tje internal consistency of the model.
 *
 * @param __model__
 * @returns Text that summarises what is in the model, click print to see this text.
 */
function ModelCheck(__model__) {
    const check = __model__.check();
    if (check.length > 0) {
        console.log(__model__);
        return String(check);
    }
    return 'No internal inconsistencies have been found.';
}
exports.ModelCheck = ModelCheck;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL21vZHVsZXMvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOztBQU9ILHVEQUFrRTtBQUNsRSwrREFBK0Q7QUFDL0QsMERBQXVEO0FBQ3ZELHVEQUFzRztBQUd0RywrQ0FBaUQ7QUFFakQsbUdBQW1HO0FBQ25HLDZCQUE2QjtBQUM3QixJQUFZLGNBSVg7QUFKRCxXQUFZLGNBQWM7SUFDdEIsMkJBQVMsQ0FBQTtJQUNULDZCQUFXLENBQUE7SUFDWCxxQ0FBbUIsQ0FBQTtBQUN2QixDQUFDLEVBSlcsY0FBYyxHQUFkLHNCQUFjLEtBQWQsc0JBQWMsUUFJekI7QUFDRDs7Ozs7Ozs7OztHQVVHO0FBQ0gsU0FBZ0IsVUFBVSxDQUFDLFNBQWtCLEVBQUUsVUFBa0IsRUFBRSxXQUEyQjtJQUMxRixJQUFJLFNBQW9CLENBQUM7SUFDekIsUUFBUSxXQUFXLEVBQUU7UUFDakIsS0FBSyxjQUFjLENBQUMsRUFBRTtZQUNsQixNQUFNLE9BQU8sR0FBZSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBZSxDQUFDO1lBQ2pFLFNBQVMsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZDLE1BQU07UUFDVixLQUFLLGNBQWMsQ0FBQyxHQUFHO1lBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNuQyxvREFBb0Q7WUFDcEQsK0NBQStDO1lBQy9DLE1BQU07UUFDVixLQUFLLGNBQWMsQ0FBQyxPQUFPO1lBQ3ZCLFNBQVMsR0FBRywwQkFBYSxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEQsTUFBTTtRQUNWO1lBQ0ksTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1lBQzVDLE1BQU07S0FDYjtJQUNELElBQUksU0FBUyxLQUFLLFNBQVMsRUFB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