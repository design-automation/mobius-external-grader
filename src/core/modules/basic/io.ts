/**
 * The `io` module has functions for importing and exporting.
 * @module
 */

import { checkIDs, ID } from '../../_check_ids';

import { GIModel } from '@libs/geo-info/GIModel';
import { importObj, exportPosiBasedObj, exportVertBasedObj } from '@assets/libs/geo-info/io/io_obj';
import { importGeojson, exportGeojson } from '@assets/libs/geo-info/io/io_geojson';
import { download } from '@libs/filesys/download';
import { TId, EEntType, TEntTypeIdx, IEntSets, Txyz, Txy, TAttribDataTypes } from '@libs/geo-info/common';
// import { __merge__ } from '../_model';
// import { _model } from '..';
import { idsMake, idsBreak, idsMakeFromIdxs, idMake } from '@assets/libs/geo-info/common_id_funcs';
import { arrMakeFlat, getArrDepth } from '@assets/libs/util/arrs';
import JSZip from 'jszip';
import fetch from 'node-fetch';
import { exportGltf } from '@assets/libs/geo-info/io/io_gltf';

import { vecAng2, vecFromTo, vecRot } from '@assets/libs/geom/vectors';
import { multMatrix, rotateMatrix } from '@assets/libs/geom/matrix';
import { Matrix4 } from 'three';
import proj4 from 'proj4';
import { checkArgs, isNull, isNum, isNumL, isStr, isStrL, isXY } from '@assets/core/_check_types';
import { importCityJSON } from '@assets/libs/geo-info/io/io_cityjson';

const requestedBytes = 1024 * 1024 * 200; // 200 MB local storage quota

// ================================================================================================
declare global {
    interface Navigator {
        webkitPersistentStorage: {
            requestQuota: (a, b, c) => {}
        };
    }
}
// ================================================================================================
// Import / Export data types
export enum _EIOImportDataFormat {
    GI = 'gi',
    OBJ = 'obj',
    GEOJSON = 'geojson',
    CITYJSON = 'CityJSON'
}
export enum _EIODataSource {
    DEFAULT = 'From URL',
    FILESYS = 'From Local Storage'
}
export enum _EIODataTarget {
    DEFAULT = 'Save to Hard Disk',
    FILESYS = 'Save to Local Storage'
}
// ================================================================================================
/**
 * Read data from a Url or from local storage.
 *
 * @param data The data to be read (from URL or from Local Storage).
 * @returns the data.
 */
 export async function Read(__model__: GIModel, data: string): Promise<string|{}> {
    return _getFile(data);
}
 export function _Async_Param_Read(__model__: GIModel, data: string): Promise<string|{}> {
    return null;
}
// ================================================================================================
/**
 * Write data to the hard disk or to the local storage.
 *
 * @param data The data to be saved (can be the url to the file).
 * @param file_name The name to be saved in the file system (file extension should be included).
 * @param data_target Enum, where the data is to be exported to.
 * @returns whether the data is successfully saved.
 */
export async function Write(__model__: GIModel, data: string, file_name: string, data_target: _EIODataTarget): Promise<Boolean> {
    try {
        if (data_target === _EIODataTarget.DEFAULT) {
            return download(data, file_name);
        }
        return saveResource(data, file_name);
    } catch (ex) {
        return false;
    }
}
export function _Async_Param_Write(__model__: GIModel, data: string, file_name: string, data_target: _EIODataTarget): Promise<Boolean> {
    return null;
}

// ================================================================================================
/**
 * Imports a string of data into the model.
 * \n
 * @param model_data The model data
 * @param data_format Enum, the file format.
 * @returns A list of the positions, points, polylines, polygons and collections added to the model.
 * @example io.Import ("my_data.obj", obj)
 * @example_info Imports the data from my_data.obj, from local storage.
 */
 export function ImportData(__model__: GIModel, model_data: string, data_format: _EIOImportDataFormat): TId|TId[]|{} {
    if (!model_data) {
        throw new Error('Invalid imported model data');
    }
    // zip file
    if (model_data.constructor === {}.constructor) {
        const coll_results = {};
        for (const data_name in <Object> model_data) {
            if (model_data[data_name]) {
                coll_results[data_name]  = _import(__model__, <string> model_data[data_name], data_format);
            }
        }
        return coll_results;
    }
    // single file
    return _import(__model__, model_data, data_format);
}
// ================================================================================================
/**
 * Imports data into the model.
 * \n
 * There are two ways of specifying the file location to be imported:
 * - A url, e.g. "https://www.dropbox.com/xxxx/my_data.obj"
 * - A file name in the local storage, e.g. "my_data.obj".
 * \n
 * To place a file in local storage, go to the Mobius menu, and select 'Local Storage' from the dropdown.
 * Note that a script using a file in local storage may fail when others try to open the file.
 * \n
 * @param data_url The url to retrieve the data from
 * @param data_format Enum, the file format.
 * @returns A list of the positions, points, polylines, polygons and collections added to the model.
 * @example io.Import ("my_data.obj", obj)
 * @example_info Imports the data from my_data.obj, from local storage.
 */
export async function Import(__model__: GIModel, data_url: string, data_format: _EIOImportDataFormat): Promise<TId|TId[]|{}> {
    const model_data = await _getFile(data_url);
    if (!model_data) {
        throw new Error('Invalid imported model data');
    }
    // zip file
    if (model_data.constructor === {}.constructor) {
        const coll_results = {};
        for (const data_name in <Object> model_data) {
            if (model_data[data_name]) {
                coll_results[data_name]  = _import(__model__, <string> model_data[data_name], data_format);
            }
        }
        return coll_results;
    }
    // single file
    return _import(__model__, model_data, data_format);
}
export function _Async_Param_Import(__model__: GIModel, input_data: string, data_format: _EIOImportDataFormat): Promise<TId|TId[]|{}> {
    return null;
}
export function _import(__model__: GIModel, model_data: string, data_format: _EIOImportDataFormat): TId {
    switch (data_format) {
        case _EIOImportDataFormat.GI:
            const gi_coll_i: number  = _importGI(__model__, <string> model_data);
            return idMake(EEntType.COLL, gi_coll_i) as TId;
        case _EIOImportDataFormat.OBJ:
            const obj_coll_i: number  = _importObj(__model__, <string> model_data);
            return idMake(EEntType.COLL, obj_coll_i) as TId;
        case _EIOImportDataFormat.GEOJSON:
            const gj_coll_i: number  = _importGeoJSON(__model__, <string> model_data);
            return idMake(EEntType.COLL, gj_coll_i) as TId;
        case _EIOImportDataFormat.CITYJSON:
            const cj_coll_i: number = _importCityJSON(__model__, <string> model_data);
            return idMake(EEntType.COLL, cj_coll_i) as TId;
        default:
            throw new Error('Import type not recognised');
    }
}
export function _importGI(__model__: GIModel, json_str: string): number {
    const ssid: number = __model__.modeldata.active_ssid;
    // import
    const ents: TEntTypeIdx[] = __model__.importGI(json_str);
    const container_coll_i: number = __model__.modeldata.geom.add.addColl();
    for (const [ent_type, ent_i] of ents) {
        switch (ent_type) {
            case EEntType.POINT:
                __model__.modeldata.geom.snapshot.addCollPoints(ssid, container_coll_i, ent_i);
                break;
            case EEntType.PLINE:
                __model__.modeldata.geom.snapshot.addCollPlines(ssid, container_coll_i, ent_i);
                break;
            case EEntType.PGON:
                __model__.modeldata.geom.snapshot.addCollPgons(ssid, container_coll_i, ent_i);
                break;
            case EEntType.COLL:
                __model__.modeldata.geom.snapshot.addCollChildren(ssid, container_coll_i, ent_i);
                break;
        }
    }
    __model__.modeldata.attribs.set.setEntAttribVal(EEntType.COLL, container_coll_i, 'name', 'import GI');
    // return the result
    return container_coll_i;
}
function _importObj(__model__: GIModel, model_data: string): number {
    // get number of ents before merge
    const num_ents_before: number[] = __model__.metadata.getEntCounts();
    // import
    importObj(__model__, model_data);
    // get number of ents after merge
    const num_ents_after: number[] = __model__.metadata.getEntCounts();
    // return the result
    const container_coll_i = _createColl(__model__, num_ents_before, num_ents_after);
    __model__.modeldata.attribs.set.setEntAttribVal(EEntType.COLL, container_coll_i, 'name', 'import OBJ');
    return container_coll_i;
}
function _importGeoJSON(__model__: GIModel, model_data: string): number {
    // get number of ents before merge
    const num_ents_before: number[] = __model__.metadata.getEntCounts();
    // import
    importGeojson(__model__, model_data, 0);
    // get number of ents after merge
    const num_ents_after: number[] = __model__.metadata.getEntCounts();
    // return the result
    const container_coll_i = _createColl(__model__, num_ents_before, num_ents_after);
    __model__.modeldata.attribs.set.setEntAttribVal(EEntType.COLL, container_coll_i, 'name', 'import_GeoJSON');
    return container_coll_i;
}
function _importCityJSON(__model__: GIModel, model_data: string): number {
    // get number of ents before merge
    const num_ents_before: number[] = __model__.metadata.getEntCounts();
    // import
    importCityJSON(__model__, model_data);
    // get number of ents after merge
    const num_ents_after: number[] = __model__.metadata.getEntCounts();
    // return the result
    const container_coll_i = _createColl(__model__, num_ents_before, num_ents_after);
    __model__.modeldata.attribs.set.setEntAttribVal(EEntType.COLL, container_coll_i, 'name', 'import_CityJSON');
    return container_coll_i;
}
// function _createGIColl(__model__: GIModel, before: number[], after: number[]): number {
//     throw new Error('Not implemented');
//     // const points_i: number[] = [];
//     // const plines_i: number[] = [];
//     // const pgons_i: number[] = [];
//     // for (let point_i = before[1]; point_i < after[1]; point_i++) {
//     //     if (__model__.modeldata.geom.query.entExists(EEntType.POINT, point_i)) {
//     //         points_i.push( point_i );
//     //     }
//     // }
//     // for (let pline_i = before[2]; pline_i < after[2]; pline_i++) {
//     //     if (__model__.modeldata.geom.query.entExists(EEntType.PLINE, pline_i)) {
//     //         plines_i.push( pline_i );
//     //     }
//     // }
//     // for (let pgon_i = before[3]; pgon_i < after[3]; pgon_i++) {
//     //     if (__model__.modeldata.geom.query.entExists(EEntType.PGON, pgon_i)) {
//     //         pgons_i.push( pgon_i );
//     //     }
//     // }
//     // if (points_i.length + plines_i.length + pgons_i.length === 0) { return null; }
//     // const container_coll_i: number = __model__.modeldata.geom.add.addColl(null, points_i, plines_i, pgons_i);
//     // for (let coll_i = before[4]; coll_i < after[4]; coll_i++) {
//     //     if (__model__.modeldata.geom.query.entExists(EEntType.COLL, coll_i)) {
//     //         __model__.modeldata.geom.modify_coll.setCollParent(coll_i, container_coll_i);
//     //     }
//     // }
//     // return container_coll_i;
// }
function _createColl(__model__: GIModel, before: number[], after: number[]): number {
    const ssid: number = __model__.modeldata.active_ssid;
    const points_i: number[] = [];
    const plines_i: number[] = [];
    const pgons_i: number[] = [];
    const colls_i: number[] = [];
    for (let point_i = before[1]; point_i < after[1]; point_i++) {
        points_i.push( point_i );
    }
    for (let pline_i = before[2]; pline_i < after[2]; pline_i++) {
        plines_i.push( pline_i );
    }
    for (let pgon_i = before[3]; pgon_i < after[3]; pgon_i++) {
        pgons_i.push( pgon_i );
    }
    for (let coll_i = before[4]; coll_i < after[4]; coll_i++) {
        colls_i.push( coll_i );
    }
    if (points_i.length + plines_i.length + pgons_i.length === 0) { return null; }
    const container_coll_i: number = __model__.modeldata.geom.add.addColl();
    __model__.modeldata.geom.snapshot.addCollPoints(ssid, container_coll_i, points_i);
    __model__.modeldata.geom.snapshot.addCollPlines(ssid, container_coll_i, plines_i);
    __model__.modeldata.geom.snapshot.addCollPgons(ssid, container_coll_i, pgons_i);
    __model__.modeldata.geom.snapshot.addCollChildren(ssid, container_coll_i, colls_i);
    return container_coll_i;
}
// ================================================================================================
export enum _EIOExportDataFormat {
    GI = 'gi',
    OBJ_VERT = 'obj_v',
    OBJ_POSI = 'obj_ps',
    // DAE = 'dae',
    GEOJSON = 'geojson',
    GLTF = 'gltf'
}
/**
 * Export data from the model as a string.
 * \n
 * @param __model__
 * @param entities Optional. Entities to be exported. If null, the whole model will be exported.
 * @param file_name Name of the file as a string.
 * @param data_format Enum, the file format.
 * @returns the model data as a string.
 * @example io.Export (#pg, 'my_model.obj', obj)
 * @example_info Exports all the polgons in the model as an OBJ.
 */
export async function ExportData(__model__: GIModel, entities: TId|TId[]|TId[][], data_format: _EIOExportDataFormat): Promise<string> {
    if ( typeof localStorage === 'undefined') { return; }
    // --- Error Check ---
    const fn_name = 'io.Export';
    let ents_arr = null;
    if (__model__.debug) {
        if (entities !== null) {
            entities = arrMakeFlat(entities) as TId[];
            ents_arr = checkIDs(__model__, fn_name, 'entities', entities,
                [ID.isIDL1], [EEntType.PLINE, EEntType.PGON, EEntType.COLL])  as TEntTypeIdx[];
        }
    } else {
        if (entities !== null) {
            entities = arrMakeFlat(entities) as TId[];
            ents_arr = idsBreak(entities) as TEntTypeIdx[];
        }
    }
    // --- Error Check ---
    const ssid: number = __model__.modeldata.active_ssid;
    let model_data = '';
    switch (data_format) {
        case _EIOExportDataFormat.GI:
            model_data = __model__.exportGI(ents_arr);
            return model_data.replace(/\\/g, '\\\\\\'); // TODO temporary fix
        case _EIOExportDataFormat.OBJ_VERT:
            return exportVertBasedObj(__model__, ents_arr, ssid);
        case _EIOExportDataFormat.OBJ_POSI:
            return exportPosiBasedObj(__model__, ents_arr, ssid);
        case _EIOExportDataFormat.GEOJSON:
            return exportGeojson(__model__, ents_arr, true, ssid); // flatten
        case _EIOExportDataFormat.GLTF:
            return await exportGltf(__model__, ents_arr, ssid);
        default:
            throw new Error('Data type not recognised');
    }
}
/**
 * Export data from the model as a file.
 * \n
 * If you expore to your  hard disk,
 * it will result in a popup in your browser, asking you to save the file.
 * \n
 * If you export to Local Storage, there will be no popup.
 * \n
 * @param __model__
 * @param entities Optional. Entities to be exported. If null, the whole model will be exported.
 * @param file_name Name of the file as a string.
 * @param data_format Enum, the file format.
 * @param data_target Enum, where the data is to be exported to.
 * @returns void.
 * @example io.Export (#pg, 'my_model.obj', obj)
 * @example_info Exports all the polgons in the model as an OBJ.
 */
export async function Export(__model__: GIModel, entities: TId|TId[]|TId[][],
        file_name: string, data_format: _EIOExportDataFormat, data_target: _EIODataTarget) {
    if ( typeof localStorage === 'undefined') { return; }
    // --- Error Check ---
    const fn_name = 'io.Export';
    let ents_arr = null;
    if (__model__.debug) {
        if (entities !== null) {
            entities = arrMakeFlat(entities) as TId[];
            ents_arr = checkIDs(__model__, fn_name, 'entities', entities,
                [ID.isIDL1], [EEntType.PLINE, EEntType.PGON, EEntType.COLL])  as TEntTypeIdx[];
        }
        checkArgs(fn_name, 'file_name', file_name, [isStr, isStrL]);
    } else {
        if (entities !== null) {
            entities = arrMakeFlat(entities) as TId[];
            ents_arr = idsBreak(entities) as TEntTypeIdx[];
        }
    }
    // --- Error Check ---
    await _export(__model__, ents_arr, file_name, data_format, data_target);
}
export function _Async_Param_Export(__model__: GIModel, entities: TId|TId[]|TId[][],
    file_name: string, data_format: _EIOExportDataFormat, data_target: _EIODataTarget){
}
async function _export(__model__: GIModel, ents_arr: TEntTypeIdx[],
    file_name: string, data_format: _EIOExportDataFormat, data_target: _EIODataTarget): Promise<boolean> {
    const ssid: number = __model__.modeldata.active_ssid;
    switch (data_format) {
        case _EIOExportDataFormat.GI:
            {
                let model_data = '';
                model_data = __model__.exportGI(ents_arr);
                // gi_data = gi_data.replace(/\\\"/g, '\\\\\\"'); // TODO temporary fix
                model_data = model_data.replace(/\\/g, '\\\\\\'); // TODO temporary fix
                // === save the file ===
                if (data_target === _EIODataTarget.DEFAULT) {
                    return download(model_data , file_name);
                }
                return saveResource(model_data, file_name);
            }
        case _EIOExportDataFormat.OBJ_VERT:
            {
                const obj_verts_data: string = exportVertBasedObj(__model__, ents_arr, ssid);
                // obj_data = obj_data.replace(/#/g, '%23'); // TODO temporary fix
                if (data_target === _EIODataTarget.DEFAULT) {
                    return download(obj_verts_data , file_name);
                }
                return saveResource(obj_verts_data, file_name);
            }
        case _EIOExportDataFormat.OBJ_POSI:
            {
                const obj_posis_data: string = exportPosiBasedObj(__model__, ents_arr, ssid);
                // obj_data = obj_data.replace(/#/g, '%23'); // TODO temporary fix
                if (data_target === _EIODataTarget.DEFAULT) {
                    return download(obj_posis_data , file_name);
                }
                return saveResource(obj_posis_data, file_name);
            }
        // case _EIOExportDataFormat.DAE:
        //     const dae_data: string = exportDae(__model__);
        //     // dae_data = dae_data.replace(/#/g, '%23'); // TODO temporary fix
        //     if (data_target === _EIODataTarget.DEFAULT) {
        //         return download(dae_data, file_name);
        //     }
        //     return saveResource(dae_data, file_name);
        //     break;
        case _EIOExportDataFormat.GEOJSON:
            {
                const geojson_data: string = exportGeojson(__model__, ents_arr, true, ssid); // flatten
                if (data_target === _EIODataTarget.DEFAULT) {
                    return download(geojson_data , file_name);
                }
                return saveResource(geojson_data, file_name);
            }
        case _EIOExportDataFormat.GLTF:
            {
                const gltf_data: string = await exportGltf(__model__, ents_arr, ssid);
                if (data_target === _EIODataTarget.DEFAULT) {
                    return download(gltf_data, file_name);
                }
                return saveResource(gltf_data, file_name);
            }
        default:
            throw new Error('Data type not recognised');
    }
}
// ================================================================================================
/**
 * Set the geolocation of the Cartesian coordinate system.
 *
 * @param __model__
 * @param lat_long Set the latitude and longitude of the origin of the Cartesian coordinate system. 
 * @param rot Set the counter-clockwise rotation of the Cartesian coordinate system, in radians.
 * @param elev Set the elevation of the Cartesian coordinate system above the ground plane.
 * @returns void
 */
 export function Geolocate(
        __model__: GIModel, 
        lat_long: Txy, 
        rot: number,
        elev: number
    ): void {
    // --- Error Check ---
    const fn_name = 'io.Geolocate';
    if (__model__.debug) {
        checkArgs(fn_name, 'lat_long_o', lat_long, [isXY, isNull]);
        checkArgs(fn_name, 'rot', elev, [isNum, isNull]);
        checkArgs(fn_name, 'elev', elev, [isNum, isNull]);
    }
    // --- Error Check ---
    const gl_dict = {"latitude": lat_long[0], "longitude": lat_long[1]};
    if (elev !== null) {
        gl_dict["elevation"] = elev;
    }
    __model__.modeldata.attribs.set.setModelAttribVal("geolocation", gl_dict);
    let n_vec: Txyz = [0,1,0];
    if (rot !== null) {
        n_vec = vecRot(n_vec, [0,0,1], -rot)
    }
    __model__.modeldata.attribs.set.setModelAttribVal("north", [n_vec[0], n_vec[1]]);
}
// ================================================================================================
/**
 * Set the geolocation of the Cartesian coordinate system.
 * \n 
 * The Cartesian coordinate system is geolocated by defining two points:
 * - The latitude-longitude of the Cartesian origin.
 * - The latitude-longitude of a point on the positive Cartesian X-axis.
 * \n
 * @param __model__
 * @param lat_long_o Set the latitude and longitude of the origin of the Cartesian coordinate
 * system. 
 * @param lat_long_x Set the latitude and longitude of a point on the x-axis of the Cartesian
 * coordinate system. 
 * @param elev Set the elevation of the Cartesian coordinate system above the ground plane.
 * @returns void
 */
 export function Geoalign(
        __model__: GIModel, 
        lat_long_o: Txy,
        lat_long_x: Txy,
        elev: number
    ): void {
    // --- Error Check ---
    const fn_name = 'io.Geoalign';
    if (__model__.debug) {
        checkArgs(fn_name, 'lat_long_o', lat_long_o, [isXY, isNull]);
        checkArgs(fn_name, 'lat_long_x', lat_long_x, [isXY, isNull]);
        checkArgs(fn_name, 'elev', elev, [isNum, isNull]);
    }
    // --- Error Check ---
    const gl_dict = {"latitude": lat_long_o[0], "longitude": lat_long_o[1]};
    if (elev !== null) {
        gl_dict["elevation"] = elev;
    }
    __model__.modeldata.attribs.set.setModelAttribVal("geolocation", gl_dict);
    // calc
    const proj_obj: proj4.Converter = _createProjection(__model__);
    // origin
    let xyz_o: Txyz = _xformFromLongLatToXYZ([lat_long_o[1],lat_long_o[0]], proj_obj, 0) as Txyz;
    // point on x axis
    let xyz_x: Txyz = _xformFromLongLatToXYZ([lat_long_x[1],lat_long_x[0]], proj_obj, 0) as Txyz;
    // x axis vector
    const old_x_vec: Txyz = [1, 0, 0];
    const new_x_vec: Txyz = vecFromTo(xyz_o, xyz_x);
    const rot: number = vecAng2(old_x_vec, new_x_vec, [0, 0, 1]);
    // console.log("rot = ", rot, "x_vec = ", x_vec, xyz_o, xyz_x)
    // north vector
    const n_vec: Txyz = vecRot([0,1,0], [0,0,1], -rot);
    __model__.modeldata.attribs.set.setModelAttribVal("north", [n_vec[0], n_vec[1]]);
}


// ================================================================================================
// ================================================================================================
// ================================================================================================
// ================================================================================================
/**
 * Functions for geospatial projection
 */

// longitude latitude in Singapore, NUS
const LONGLAT = [103.778329, 1.298759];
/**
 * TODO MEgre with io_geojson.ts
 * Get long lat, Detect CRS, create projection function
 * @param model The model.
 * @param point The features to add.
 */
 function _createProjection(model: GIModel): proj4.Converter {
    // create the function for transformation
    const proj_str_a = '+proj=tmerc +lat_0=';
    const proj_str_b = ' +lon_0=';
    const proj_str_c = '+k=1 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs';
    let longitude = LONGLAT[0];
    let latitude = LONGLAT[1];
    if (model.modeldata.attribs.query.hasModelAttrib('geolocation')) {
        const geolocation = model.modeldata.attribs.get.getModelAttribVal('geolocation');
        const long_value: TAttribDataTypes = geolocation['longitude'];
        if (typeof long_value !== 'number') {
            throw new Error('Longitude attribute must be a number.');
        }
        longitude = long_value as number;
        if (longitude < -180 || longitude > 180) {
            throw new Error('Longitude attribute must be between -180 and 180.');
        }
        const lat_value: TAttribDataTypes = geolocation['latitude'];
        if (typeof lat_value !== 'number') {
            throw new Error('Latitude attribute must be a number');
        }
        latitude = lat_value as number;
        if (latitude < 0 || latitude > 90) {
            throw new Error('Latitude attribute must be between 0 and 90.');
        }
    }
    console.log("lat long", latitude, longitude);
    // try to figure out what the projection is of the source file
    // let proj_from_str = 'WGS84';
    // if (geojson_obj.hasOwnProperty('crs')) {
    //     if (geojson_obj.crs.hasOwnProperty('properties')) {
    //         if (geojson_obj.crs.properties.hasOwnProperty('name')) {
    //             const name: string = geojson_obj.crs.properties.name;
    //             const epsg_index = name.indexOf('EPSG');
    //             if (epsg_index !== -1) {
    //                 let epsg = name.slice(epsg_index);
    //                 epsg = epsg.replace(/\s/g, '+');
    //                 if (epsg === 'EPSG:4326') {
    //                     // do nothing, 'WGS84' is fine
    //                 } else if (['EPSG:4269', 'EPSG:3857', 'EPSG:3785', 'EPSG:900913', 'EPSG:102113'].indexOf(epsg) !== -1) {
    //                     // these are the epsg codes that proj4 knows
    //                     proj_from_str = epsg;
    //                 } else if (epsg === 'EPSG:3414') {
    //                     // singapore
    //                     proj_from_str =
    //                         '+proj=tmerc +lat_0=1.366666666666667 +lon_0=103.8333333333333 +k=1 +x_0=28001.642 +y_0=38744.572 ' +
    //                         '+ellps=WGS84 +units=m +no_defs';
    //                 }
    //             }
    //         }
    //     }
    // }
    // console.log('CRS of geojson data', proj_from_str);

    const proj_from_str = 'WGS84';
    const proj_to_str = proj_str_a + latitude + proj_str_b + longitude + proj_str_c;
    const proj_obj: proj4.Converter = proj4(proj_from_str, proj_to_str);
    return proj_obj;
}
/**
 * TODO MEgre with io_geojson.ts
 * Converts geojson long lat to cartesian coords
 * @param long_lat_arr
 * @param elevation
 */
function _xformFromLongLatToXYZ(
        long_lat_arr: [number, number]|[number, number][], proj_obj: proj4.Converter, elevation: number): Txyz|Txyz[] {
    if (getArrDepth(long_lat_arr) === 1) {
        const long_lat: [number, number] = long_lat_arr as [number, number];
        const xy: [number, number] = proj_obj.forward(long_lat);
        return [xy[0], xy[1], elevation];
    } else {
        long_lat_arr = long_lat_arr as [number, number][];
        const xyzs_xformed: Txyz[] = [];
        for (const long_lat of long_lat_arr) {
            if (long_lat.length >= 2) {
                const xyz: Txyz = _xformFromLongLatToXYZ(long_lat, proj_obj, elevation) as Txyz;
                xyzs_xformed.push(xyz);
            }
        }
        return xyzs_xformed as Txyz[];
    }
}
// ================================================================================================
/**
 * Transform a coordinate from latitude-longitude Geodesic coordinate to a Cartesian XYZ coordinate,
 * based on the geolocation of the model.
 *
 * @param __model__
 * @param lat_long Latitude and longitude coordinates. 
 * @param elev Set the elevation of the Cartesian coordinate system above the ground plane.
 * @returns XYZ coordinates
 */
 export function LatLong2XYZ(
        __model__: GIModel, 
        lat_long: Txy,
        elev: number
    ): Txyz {
    // --- Error Check ---
    const fn_name = 'util.LatLong2XYZ';
    if (__model__.debug) {
        checkArgs(fn_name, 'lat_long', lat_long, [isXY, isNull]);
        checkArgs(fn_name, 'elev', elev, [isNum, isNull]);
    }
    // --- Error Check ---
    const proj_obj: proj4.Converter = _createProjection(__model__);
    // calculate angle of rotation
    let rot_matrix: Matrix4 = null;
    if (__model__.modeldata.attribs.query.hasModelAttrib('north')) {
        const north: Txy = __model__.modeldata.attribs.get.getModelAttribVal('north') as Txy;
        if (Array.isArray(north)) {
            const rot_ang: number = vecAng2([0, 1, 0], [north[0], north[1], 0], [0, 0, 1]);
            rot_matrix = rotateMatrix([[0, 0, 0], [0, 0, 1]], rot_ang);
        }
    }
    // add feature
    let xyz: Txyz = _xformFromLongLatToXYZ([lat_long[1],lat_long[0]], proj_obj, elev) as Txyz;
    // rotate to north
    if (rot_matrix !== null) {
        xyz = multMatrix(xyz, rot_matrix);
    }
    return xyz;

}
// ================================================================================================
// ================================================================================================
// ================================================================================================
// ================================================================================================
/**
 * Functions for saving and loading resources to file system.
 */

async function saveResource(file: string, name: string): Promise<boolean> {
    const itemstring = localStorage.getItem('mobius_backup_list');
    if (!itemstring) {
        localStorage.setItem('mobius_backup_list', `["${name}"]`);
        localStorage.setItem('mobius_backup_date_dict', `{ "${name}": "${(new Date()).toLocaleString()}"}`);
    } else {
        const items: string[] = JSON.parse(itemstring);
        let check = false;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item === name) {
                items.splice(i, 1);
                items.unshift(item);
                check = true;
                break;
            }
        }
        if (!check) {
            items.unshift(name);
            // if (items.length > 10) {
            //     const item = items.pop();
            //     localStorage.removeItem(item);
            // }
        }
        localStorage.setItem('mobius_backup_list', JSON.stringify(items));
        const itemDates = JSON.parse(localStorage.getItem('mobius_backup_date_dict'));
        itemDates[itemstring] = (new Date()).toLocaleString();
        localStorage.setItem('mobius_backup_date_dict', JSON.stringify(itemDates));
    }
    // window['_code__'] = name;
    // window['_file__'] = file;

    function saveToFS(fs) {
        const code = name;
        // console.log(code)
        fs.root.getFile(code, { create: true}, function (fileEntry) {
            fileEntry.createWriter(async function (fileWriter) {
                const bb = new Blob([file + '_|_|_'], {type: 'text/plain;charset=utf-8'});
                await fileWriter.write(bb);
            }, (e) => { console.log(e); });
        }, (e) => { console.log(e.code); });
    }

    navigator.webkitPersistentStorage.requestQuota (
        requestedBytes, function(grantedBytes) {
            // @ts-ignore
            window.webkitRequestFileSystem(PERSISTENT, grantedBytes, saveToFS,
            function(e) { throw e; });
        }, function(e) { throw e; }
    );
    return true;
    // localStorage.setItem(code, file);
}

async function getURLContent(url: string): Promise<any> {
    url = url.replace('http://', 'https://');
    if (url.indexOf('dropbox') !== -1) {
        url = url.replace('www', 'dl').replace('dl=0', 'dl=1');
    }
    if (url[0] === '"' || url[0] === '\'') {
        url = url.substring(1);
    }
    if (url[url.length - 1] === '"' || url[url.length - 1] === '\'') {
        url = url.substring(0, url.length - 1);
    }
    const p = new Promise((resolve) => {
        const fetchObj = fetch(url);
        fetchObj.catch(err => {
            resolve('HTTP Request Error: Unable to retrieve file from ' + url);
        });
        fetchObj.then(res => {
            if (!res.ok) {
                resolve('HTTP Request Error: Unable to retrieve file from ' + url);
                return '';
            }
            if (url.indexOf('.zip') !== -1) {
                res.blob().then(body => resolve(body));
            } else {
                res.text().then(body => resolve(body.replace(/(\\[bfnrtv\'\"\\])/g, '\\$1')));
            }
        });

    });
    return await p;
}
async function openZipFile(zipFile) {
    const result = {};
    await JSZip.loadAsync(zipFile.arrayBuffer()).then(async function (zip) {
        for (const filename of Object.keys(zip.files)) {
            // const splittedNames = filename.split('/').slice(1).join('/');
            await zip.files[filename].async('text').then(function (fileData) {
                result[filename] = fileData;
            });
        }
    });
    return result;
}
async function loadFromFileSystem(filecode): Promise<any> {
    const p = new Promise((resolve) => {
        navigator.webkitPersistentStorage.requestQuota (
            requestedBytes, function(grantedBytes) {
                // @ts-ignore
                window.webkitRequestFileSystem(PERSISTENT, grantedBytes, function(fs) {
                    fs.root.getFile(filecode, {}, function(fileEntry) {
                        fileEntry.file((file) => {
                            const reader = new FileReader();
                            reader.onerror = () => {
                                resolve('error');
                            };
                            reader.onloadend = () => {
                                if ((typeof reader.result) === 'string') {
                                    resolve((<string>reader.result).split('_|_|_')[0]);
                                    // const splitted = (<string>reader.result).split('_|_|_');
                                    // let val = splitted[0];
                                    // for (const i of splitted) {
                                    //     if (val.length < i.length) {
                                    //         val = i;
                                    //     }
                                    // }
                                    // resolve(val);
                                } else {
                                    resolve(reader.result);
                                }
                            };
                            reader.readAsText(file, 'text/plain;charset=utf-8');
                        });
                    });
                });
            }, function(e) { console.log('Error', e); }
        );
    });
    return await p;
}
export async function _getFile(source: string) {
    if (source.startsWith('__model_data__')) {
        return source.substring(14);
    } else if (source.indexOf('://') !== -1) {
        const val = source.replace(/ /g, '');
        const result = await getURLContent(val);
        if (result === undefined) {
            return source;
        } else if (result.indexOf && result.indexOf('HTTP Request Error') !== -1) {
            throw new Error(result);
        } else if (val.indexOf('.zip') !== -1) {
            return await openZipFile(result);
        } else {
            return result;
        }
    } else {
        if (source.length > 1 && source[0] === '{') {
            return source;
        }
        const val = source.replace(/\"|\'/g, '');
        const backup_list: string[] = JSON.parse(localStorage.getItem('mobius_backup_list'));
        if (val.endsWith('.zip')) {
            throw(new Error(`Importing zip files from local storage is not supported`));
        }
        if (val.indexOf('*') !== -1) {
            const splittedVal = val.split('*');
            const start = splittedVal[0] === '' ? null : splittedVal[0];
            const end = splittedVal[1] === '' ? null : splittedVal[1];
            let result = '{';
            for (const backup_name of backup_list) {
                let valid_check = true;
                if (start && !backup_name.startsWith(start)) {
                    valid_check = false;
                }
                if (end && !backup_name.endsWith(end)) {
                    valid_check = false;
                }
                if (valid_check) {
                    const backup_file = await loadFromFileSystem(backup_name);
                    result += `"${backup_name}": \`${backup_file.replace(/\\/g, '\\\\')}\`,`;
                }
            }
            result += '}';
            return result;
        } else {
            if (backup_list.indexOf(val) !== -1) {
                const result = await loadFromFileSystem(val);
                if (!result || result === 'error') {
                    throw(new Error(`File named ${val} does not exist in the local storage`));
                    // return source;
                } else {
                    return result;
                }
            } else {
                throw(new Error(`File named ${val} does not exist in the local storage`));
            }
        }
    }
}
export function _Async_Param__getFile(source: string) {
}
