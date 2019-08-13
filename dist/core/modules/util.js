"use strict";
/**
 * The `util` module has functions for importing data into the model and
 * exporting data out of the model.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *
 */
const GIModel_1 = require("../../libs/geo-info/GIModel");
const io_obj_1 = require("../../libs/geo-info/io_obj");
const io_dae_1 = require("../../libs/geo-info/io_dae");
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
var _EIODataSource;
(function (_EIODataSource) {
    _EIODataSource["DEFAULT"] = "From URL";
    _EIODataSource["FILESYS"] = "From Local Storage";
})(_EIODataSource = exports._EIODataSource || (exports._EIODataSource = {}));
var _EIODataTarget;
(function (_EIODataTarget) {
    _EIODataTarget["DEFAULT"] = "Save to Hard Disk";
    _EIODataTarget["FILESYS"] = "Save to Local Storage";
})(_EIODataTarget = exports._EIODataTarget || (exports._EIODataTarget = {}));
/**
 * Read data from a Url or from local storage.
 *
 * @param data The data to be read (from URL or from Local Storage).
 * @returns the data.
 */
function ReadData(__model__, data) {
    return data;
}
exports.ReadData = ReadData;
/**
 * Save data to the hard disk or to the local storage.
 *
 * @param data The data to be saved (can be the url to the file).
 * @param file_name The name to be saved in the file system (file extension should be included).
 * @param data_target Enum, where the data is to be exported to.
 * @returns whether the data is successfully saved.
 */
function WriteData(__model__, data, file_name, data_target) {
    try {
        if (data_target === _EIODataTarget.DEFAULT) {
            return download_1.download(data, file_name);
        }
        return saveResource(data, file_name);
    }
    catch (ex) {
        return false;
    }
}
exports.WriteData = WriteData;
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
var _EIOExportDataFormat;
(function (_EIOExportDataFormat) {
    _EIOExportDataFormat["GI"] = "gi";
    _EIOExportDataFormat["OBJ"] = "obj";
    _EIOExportDataFormat["DAE"] = "dae";
    _EIOExportDataFormat["GEOJSON"] = "geojson";
})(_EIOExportDataFormat = exports._EIOExportDataFormat || (exports._EIOExportDataFormat = {}));
/**
 * Export data from the model as a file.
 * This will result in a popup in your browser, asking you to save the file.
 * @param __model__
 * @param filename Name of the file as a string.
 * @param data_format Enum, the file format.
 * @param data_target Enum, where the data is to be exported to.
 * @returns Boolean.
 * @example util.ExportData ('my_model.obj', obj)
 * @example_info Exports all the data in the model as an OBJ.
 */
function ExportData(__model__, entities, filename, data_format, data_target) {
    // TODO implement export of entities
    switch (data_format) {
        case _EIOExportDataFormat.GI:
            let gi_data = JSON.stringify(__model__.getData());
            gi_data = gi_data.replace(/\\\"/g, '\\\\\\"'); // TODO temporary fix
            if (data_target === _EIODataTarget.DEFAULT) {
                return download_1.download(gi_data, filename);
            }
            return saveResource(gi_data, filename);
            break;
        case _EIOExportDataFormat.OBJ:
            const obj_data = io_obj_1.exportObj(__model__);
            // obj_data = obj_data.replace(/#/g, '%23'); // TODO temporary fix
            if (data_target === _EIODataTarget.DEFAULT) {
                return download_1.download(obj_data, filename);
            }
            return saveResource(obj_data, filename);
            break;
        case _EIOExportDataFormat.DAE:
            const dae_data = io_dae_1.exportDae(__model__);
            // dae_data = dae_data.replace(/#/g, '%23'); // TODO temporary fix
            if (data_target === _EIODataTarget.DEFAULT) {
                return download_1.download(dae_data, filename);
            }
            return saveResource(dae_data, filename);
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
var _EIOExportParams;
(function (_EIOExportParams) {
    _EIOExportParams["YES"] = "Add Params";
    _EIOExportParams["NO"] = "No Params";
})(_EIOExportParams = exports._EIOExportParams || (exports._EIOExportParams = {}));
var _EIOExportContents;
(function (_EIOExportContents) {
    _EIOExportContents["BOTH"] = "Both";
    _EIOExportContents["CONSOLE"] = "Console Only";
    _EIOExportContents["MODEL"] = "Model Only";
})(_EIOExportContents = exports._EIOExportContents || (exports._EIOExportContents = {}));
/**
 * Export data from the model as a file.
 * This will result in a popup in your browser, asking you to save the filel.
 * @param __model__
 * @param __console__
 * @param __constList__
 * @param __fileName__
 * @param filename Name of the file as a string.
 * @param exportParams Enum.
 * @param exportContent Enum.
 * @returns Boolean.
 * @example util.ExportIO('my_model.json')
 * @example_info Exports all the data in the model as an OBJ.
 */
function ExportIO(__model__, __console__, __constList__, __fileName__, filename, exportParams, exportContent) {
    // let gi_data: string = JSON.stringify(__model__.getData());
    // gi_data = gi_data.replace(/\\\"/g, '\\\\\\"'); // TODO temporary fix
    const consolidatedConsole = [];
    for (const logStr of __console__) {
        if (!logStr.match('<p style="padding: 2px 0px 2px 10px;"><b><i>')) {
            continue;
        }
        const replacedStr = logStr.replace('<p style="padding: 2px 0px 2px 10px;"><b><i>', '')
            .replace('</i></b> ', '').replace('</p>', '').replace('<br>', '\n');
        consolidatedConsole.push(replacedStr);
    }
    const edxAnswer = {
        'fileName': __fileName__,
        'params': __constList__,
        'console': consolidatedConsole.join('\n'),
        'model': __model__.getData()
    };
    if (exportParams === _EIOExportParams.NO) {
        edxAnswer['params'] = undefined;
    }
    if (exportContent === _EIOExportContents.CONSOLE) {
        edxAnswer['model'] = undefined;
    }
    else if (exportContent === _EIOExportContents.MODEL) {
        edxAnswer['console'] = undefined;
    }
    return download_1.download(JSON.stringify(edxAnswer), filename);
}
exports.ExportIO = ExportIO;
// ================================================================================================
/**
 * Returns a text summary of the contents of this model
 *
 * @param __model__
 * @param __constList__
 * @returns Text that summarises what is in the model.
 */
function ParamInfo(__model__, __constList__) {
    return JSON.stringify(__constList__);
}
exports.ParamInfo = ParamInfo;
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
 * Compare this model to the data from another GI model.
 *
 * @param __model__
 * @returns Text that summarises the comparison between this model and the the GI model.
 */
function ModelCompare(__model__, gi_model_data) {
    const gi_obj = JSON.parse(gi_model_data);
    const other_model = new GIModel_1.GIModel(gi_obj);
    const result = __model__.compare(other_model);
    if (result.comment !== '') {
        return result.comment;
    }
    return 'The two models match.';
}
exports.ModelCompare = ModelCompare;
// ================================================================================================
/**
 * Check the internal consistency of the model.
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
// ================================================================================================
/**
 * Functions for saving and loading resources to file system.
 */
function saveResource(file, name) {
    const itemstring = localStorage.getItem('mobius_backup_list');
    if (!itemstring) {
        localStorage.setItem('mobius_backup_list', `["${name}"]`);
    }
    else {
        const items = JSON.parse(itemstring);
        let check = false;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item === name) {
                items.splice(i, 1);
                items.push(item);
                check = true;
                break;
            }
        }
        if (!check) {
            items.push(name);
            if (items.length > 5) {
                const item = items.shift();
                localStorage.removeItem(item);
            }
            localStorage.setItem('mobius_backup_list', JSON.stringify(items));
        }
    }
    const requestedBytes = 1024 * 1024 * 50;
    window['_code_'] = name;
    window['_file_'] = file;
    navigator.webkitPersistentStorage.requestQuota(requestedBytes, function (grantedBytes) {
        // @ts-ignore
        window.webkitRequestFileSystem(PERSISTENT, grantedBytes, saveToFS, function (e) { throw e; });
    }, function (e) { throw e; });
    return true;
    // localStorage.setItem(code, file);
}
function saveToFS(fs) {
    fs.root.getFile(window['_code_'], { create: true }, function (fileEntry) {
        fileEntry.createWriter(function (fileWriter) {
            const bb = new Blob([window['_file_']], { type: 'text/plain;charset=utf-8' });
            fileWriter.write(bb);
            window['_code_'] = undefined;
            window['_file_'] = undefined;
        }, (e) => { console.log(e); });
    }, (e) => { console.log(e.code); });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL21vZHVsZXMvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOztBQUVIOztHQUVHO0FBRUgseURBQXNEO0FBQ3RELHVEQUFrRTtBQUNsRSx1REFBa0U7QUFDbEUsK0RBQStEO0FBQy9ELDBEQUF1RDtBQUN2RCx1REFBc0c7QUFHdEcsK0NBQWlEO0FBU2pELG1HQUFtRztBQUNuRyw2QkFBNkI7QUFDN0IsSUFBWSxjQUlYO0FBSkQsV0FBWSxjQUFjO0lBQ3RCLDJCQUFTLENBQUE7SUFDVCw2QkFBVyxDQUFBO0lBQ1gscUNBQW1CLENBQUE7QUFDdkIsQ0FBQyxFQUpXLGNBQWMsR0FBZCxzQkFBYyxLQUFkLHNCQUFjLFFBSXpCO0FBQ0QsSUFBWSxjQUdYO0FBSEQsV0FBWSxjQUFjO0lBQ3RCLHNDQUFvQixDQUFBO0lBQ3BCLGdEQUE4QixDQUFBO0FBQ2xDLENBQUMsRUFIVyxjQUFjLEdBQWQsc0JBQWMsS0FBZCxzQkFBYyxRQUd6QjtBQUNELElBQVksY0FHWDtBQUhELFdBQVksY0FBYztJQUN0QiwrQ0FBNkIsQ0FBQTtJQUM3QixtREFBaUMsQ0FBQTtBQUNyQyxDQUFDLEVBSFcsY0FBYyxHQUFkLHNCQUFjLEtBQWQsc0JBQWMsUUFHekI7QUFDRDs7Ozs7R0FLRztBQUNILFNBQWdCLFFBQVEsQ0FBQyxTQUFrQixFQUFFLElBQVk7SUFDckQsT0FBTyxJQUFJLENBQUM7QUFDaEIsQ0FBQztBQUZELDRCQUVDO0FBQ0Q7Ozs7Ozs7R0FPRztBQUNILFNBQWdCLFNBQVMsQ0FBQyxTQUFrQixFQUFFLElBQVksRUFBRSxTQUFpQixFQUFFLFdBQTJCO0lBQ3RHLElBQUk7UUFDQSxJQUFJLFdBQVcsS0FBSyxjQUFjLENBQUMsT0FBTyxFQUFFO1lBQ3hDLE9BQU8sbUJBQVEsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7U0FDcEM7UUFDRCxPQUFP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