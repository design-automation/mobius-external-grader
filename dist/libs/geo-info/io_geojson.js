"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
const id_1 = require("./id");
const proj4_1 = __importDefault(require("proj4"));
var EGeojsoFeatureType;
(function (EGeojsoFeatureType) {
    EGeojsoFeatureType["POINT"] = "Point";
    EGeojsoFeatureType["LINESTRING"] = "LineString";
    EGeojsoFeatureType["POLYGON"] = "Polygon";
    EGeojsoFeatureType["MULTIPOINT"] = "MultiPoint";
    EGeojsoFeatureType["MULTILINESTRING"] = "MultiLineString";
    EGeojsoFeatureType["MULTIPOLYGON"] = "MultiPolygon";
})(EGeojsoFeatureType || (EGeojsoFeatureType = {}));
/**
* Import geojson
*/
function importGeojson(model, geojson_str, elevation) {
    // parse the json data str
    const geojson_obj = JSON.parse(geojson_str);
    const proj_obj = _createProjection(model, geojson_obj);
    // arrays for features
    const point_f = [];
    const linestring_f = [];
    const polygon_f = [];
    const multipoint_f = [];
    const multilinestring_f = [];
    const multipolygon_f = [];
    const other_f = [];
    // arrays for objects
    const points_i = [];
    const plines_i = [];
    const pgons_i = [];
    const colls_i = [];
    // loop
    for (const feature of geojson_obj.features) {
        // get the features
        switch (feature.geometry.type) {
            case EGeojsoFeatureType.POINT:
                point_f.push(feature);
                const point_i = _addPointToModel(model, feature, proj_obj, elevation);
                points_i.push(point_i);
                break;
            case EGeojsoFeatureType.LINESTRING:
                linestring_f.push(feature);
                const pline_i = _addPlineToModel(model, feature, proj_obj, elevation);
                plines_i.push(pline_i);
                break;
            case EGeojsoFeatureType.POLYGON:
                polygon_f.push(feature);
                const pgon_i = _addPgonToModel(model, feature, proj_obj, elevation);
                pgons_i.push(pgon_i);
                break;
            case EGeojsoFeatureType.MULTIPOINT:
                multipoint_f.push(feature);
                const points_coll_i = _addPointCollToModel(model, feature, proj_obj, elevation);
                for (const point_coll_i of points_coll_i[0]) {
                    points_i.push(point_coll_i);
                }
                colls_i.push(points_coll_i[1]);
                break;
            case EGeojsoFeatureType.MULTILINESTRING:
                multilinestring_f.push(feature);
                const plines_coll_i = _addPlineCollToModel(model, feature, proj_obj, elevation);
                for (const pline_coll_i of plines_coll_i[0]) {
                    plines_i.push(pline_coll_i);
                }
                colls_i.push(plines_coll_i[1]);
                break;
            case EGeojsoFeatureType.MULTIPOLYGON:
                multipolygon_f.push(feature);
                const pgons_coll_i = _addPgonCollToModel(model, feature, proj_obj, elevation);
                for (const pgon_coll_i of pgons_coll_i[0]) {
                    pgons_i.push(pgon_coll_i);
                }
                colls_i.push(pgons_coll_i[1]);
                break;
            default:
                other_f.push(feature);
                break;
        }
    }
    // log message
    // console.log(
    //     'Point: '           + point_f.length + '\n' +
    //     'LineString: '      + linestring_f.length + '\n' +
    //     'Polygon: '         + polygon_f.length + '\n' +
    //     'MultiPoint: '      + multipoint_f.length + '\n' +
    //     'MultiLineString: ' + multilinestring_f.length + '\n' +
    //     'MultiPolygon: '    + multipolygon_f.length + '\n' +
    //     'Other: '           + other_f + '\n\n');
    // return a geom pack with all the new entities that have been added
    return {
        posis_i: [],
        points_i: points_i,
        plines_i: plines_i,
        pgons_i: pgons_i,
        colls_i: colls_i
    };
}
exports.importGeojson = importGeojson;
/**
 * Get long lat, Detect CRS, create projection function
 * @param model The model.
 * @param point The features to add.
 */
function _createProjection(model, geojson_obj) {
    // create the function for transformation
    const proj_str_a = '+proj=tmerc +lat_0=';
    const proj_str_b = ' +lon_0=';
    const proj_str_c = '+k=1 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs';
    let longitude = common_1.LONGLAT[0];
    let latitude = common_1.LONGLAT[1];
    if (model.attribs.query.hasModelAttrib('longitude')) {
        const long_value = model.attribs.query.getModelAttribValue('longitude');
        if (typeof long_value !== 'number') {
            throw new Error('Longitude attribute must be a number.');
        }
        longitude = long_value;
        if (longitude < -180 || longitude > 180) {
            throw new Error('Longitude attribute must be between -180 and 180.');
        }
    }
    if (model.attribs.query.hasModelAttrib('latitude')) {
        const lat_value = model.attribs.query.getModelAttribValue('latitude');
        if (typeof lat_value !== 'number') {
            throw new Error('Latitude attribute must be a number');
        }
        latitude = lat_value;
        if (latitude < 0 || latitude > 90) {
            throw new Error('Latitude attribute must be between 0 and 90.');
        }
    }
    // try to figure out what the projection is of the source file
    let proj_from_str = 'WGS84';
    if (geojson_obj.hasOwnProperty('crs')) {
        if (geojson_obj.crs.hasOwnProperty('properties')) {
            if (geojson_obj.crs.properties.hasOwnProperty('name')) {
                const name = geojson_obj.crs.properties.name;
                const epsg_index = name.indexOf('EPSG');
                if (epsg_index !== -1) {
                    let epsg = name.slice(epsg_index);
                    epsg = epsg.replace(/\s/g, '+');
                    if (epsg === 'EPSG:4326') {
                        // do nothing, 'WGS84' is fine
                    }
                    else if (['EPSG:4269', 'EPSG:3857', 'EPSG:3785', 'EPSG:900913', 'EPSG:102113'].indexOf(epsg) !== -1) {
                        // these are the epsg codes that proj4 knows
                        proj_from_str = epsg;
                    }
                    else if (epsg === 'EPSG:3414') {
                        // singapore
                        proj_from_str =
                            '+proj=tmerc +lat_0=1.366666666666667 +lon_0=103.8333333333333 +k=1 +x_0=28001.642 +y_0=38744.572 ' +
                                '+ellps=WGS84 +units=m +no_defs';
                    }
                }
            }
        }
    }
    console.log('CRS of geojson data', proj_from_str);
    const proj_to_str = proj_str_a + latitude + proj_str_b + longitude + proj_str_c;
    const proj_obj = proj4_1.default(proj_from_str, proj_to_str);
    return proj_obj;
}
/*
    "geometry": {
        "type": "Point",
        "coordinates": [40, 40]
    }
*/
/**
 * Add a point to the model
 * @param model The model.
 * @param point The features to add.
 */
function _addPointToModel(model, point, proj_obj, elevation) {
    // add feature
    const xyz = _xformLongLat(point.geometry.coordinates, proj_obj, elevation);
    // create the posi
    const posi_i = model.geom.add.addPosi();
    model.attribs.add.setPosiCoords(posi_i, xyz);
    // create the point
    const point_i = model.geom.add.addPoint(posi_i);
    // add attribs
    _addAttribsToModel(model, common_1.EEntType.POINT, point_i, point);
    // return the index
    return point_i;
}
/*
    "geometry": {
        "type": "LineString",
        "coordinates": [
            [30, 10], [10, 30], [40, 40]
        ]
    }
*/
/**
 * Add a pline to the model
 * @param model The model
 * @param linestrings The features to add.
 */
function _addPlineToModel(model, linestring, proj_obj, elevation) {
    // add feature
    let xyzs = _xformLongLat(linestring.geometry.coordinates, proj_obj, elevation);
    const first_xyz = xyzs[0];
    const last_xyz = xyzs[xyzs.length - 1];
    const close = xyzs.length > 2 && first_xyz[0] === last_xyz[0] && first_xyz[1] === last_xyz[1];
    if (close) {
        xyzs = xyzs.slice(0, xyzs.length - 1);
    }
    // create the posis
    const posis_i = [];
    for (const xyz of xyzs) {
        const posi_i = model.geom.add.addPosi();
        model.attribs.add.setPosiCoords(posi_i, xyz);
        posis_i.push(posi_i);
    }
    // create the pline
    const pline_i = model.geom.add.addPline(posis_i, close);
    // add attribs
    _addAttribsToModel(model, common_1.EEntType.PLINE, pline_i, linestring);
    // return the index
    return pline_i;
}
/*
    "geometry": {
        "type": "Polygon",
        "coordinates": [
            [[35, 10], [45, 45], [15, 40], [10, 20], [35, 10]],
            [[20, 30], [35, 35], [30, 20], [20, 30]]
        ]
    }
*/
/**
 * Add a pgon to the model
 * @param model The model
 * @param polygons The features to add.
 */
function _addPgonToModel(model, polygon, proj_obj, elevation) {
    // add feature
    const rings = [];
    for (const ring of polygon.geometry.coordinates) {
        const xyzs = _xformLongLat(ring, proj_obj, elevation);
        // create the posis
        const posis_i = [];
        for (const xyz of xyzs) {
            const posi_i = model.geom.add.addPosi();
            model.attribs.add.setPosiCoords(posi_i, xyz);
            posis_i.push(posi_i);
        }
        rings.push(posis_i);
    }
    // create the pgon
    const pgon_i = model.geom.add.addPgon(rings[0], rings.slice(1));
    // add attribs
    _addAttribsToModel(model, common_1.EEntType.PGON, pgon_i, polygon);
    // return the index
    return pgon_i;
}
/*
    "geometry": {
        "type": "MultiPoint",
        "coordinates": [
            [10, 10],
            [40, 40]
        ]
    }
*/
/**
 * Adds multipoint to the model
 * @param model The model
 * @param multipoint The features to add.
 */
function _addPointCollToModel(model, multipoint, proj_obj, elevation) {
    // add features
    const points_i = [];
    for (const coordinates of multipoint.geometry.coordinates) {
        const point_i = _addPointToModel(model, { 'geometry': { 'coordinates': coordinates } }, proj_obj, elevation);
        points_i.push(point_i);
    }
    // create the collection
    const coll_i = model.geom.add.addColl(null, [], points_i, []);
    // add attribs
    _addAttribsToModel(model, common_1.EEntType.COLL, coll_i, multipoint);
    // return the indices of the plines and the index of the collection
    return [points_i, coll_i];
}
/*
    "geometry": {
        "type": "MultiLineString",
        "coordinates": [
            [[10, 10], [20, 20], [10, 40]],
            [[40, 40], [30, 30], [40, 20], [30, 10]]
        ]
    }
*/
/**
 * Adds multilinestrings to the model
 * @param multilinestrings The features to add.
 * @param model The model
 */
function _addPlineCollToModel(model, multilinestring, proj_obj, elevation) {
    // add features
    const plines_i = [];
    for (const coordinates of multilinestring.geometry.coordinates) {
        const pline_i = _addPlineToModel(model, { 'geometry': { 'coordinates': coordinates } }, proj_obj, elevation);
        plines_i.push(pline_i);
    }
    // create the collection
    const coll_i = model.geom.add.addColl(null, [], plines_i, []);
    // add attribs
    _addAttribsToModel(model, common_1.EEntType.COLL, coll_i, multilinestring);
    // return the indices of the plines and the index of the collection
    return [plines_i, coll_i];
}
/*
    "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
            [
                [[40, 40], [20, 45], [45, 30], [40, 40]]
            ],
            [
                [[20, 35], [10, 30], [10, 10], [30, 5], [45, 20], [20, 35]],
                [[30, 20], [20, 15], [20, 25], [30, 20]]
            ]
        ]
    }
*/
/**
 * Adds multipolygons to the model
 * @param model The model
 * @param multipolygons The features to add.
 */
function _addPgonCollToModel(model, multipolygon, proj_obj, elevation) {
    // add features
    const pgons_i = [];
    for (const coordinates of multipolygon.geometry.coordinates) {
        const pgon_i = _addPgonToModel(model, { 'geometry': { 'coordinates': coordinates } }, proj_obj, elevation);
        pgons_i.push(pgon_i);
    }
    // create the collection
    const coll_i = model.geom.add.addColl(null, [], [], pgons_i);
    // add attribs
    _addAttribsToModel(model, common_1.EEntType.COLL, coll_i, multipolygon);
    // return the indices of the plines and the index of the collection
    return [pgons_i, coll_i];
}
/**
 * Adds attributes to the model
 * @param model The model
 */
function _addAttribsToModel(model, ent_type, ent_i, feature) {
    // add attribs
    if (!feature.hasOwnProperty('properties')) {
        return;
    }
    for (const name of Object.keys(feature.properties)) {
        let value = feature.properties[name];
        const value_type = typeof feature.properties[name];
        if (value_type === 'object') {
            value = JSON.stringify(value);
        }
        model.attribs.add.setAttribValue(ent_type, ent_i, name, value);
    }
}
/**
 * Converts geojson long lat to cartesian coords
 * @param long_lat_arr
 * @param elevation
 */
function _xformLongLat(long_lat_arr, proj_obj, elevation) {
    if (id_1.getArrDepth(long_lat_arr) === 1) {
        const long_lat = long_lat_arr;
        const xy = proj_obj.forward(long_lat);
        return [xy[0], xy[1], elevation];
    }
    else {
        long_lat_arr = long_lat_arr;
        const xyzs_xformed = [];
        for (const long_lat of long_lat_arr) {
            const xyz = _xformLongLat(long_lat, proj_obj, elevation);
            xyzs_xformed.push(xyz);
        }
        return xyzs_xformed;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW9fZ2VvanNvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWJzL2dlby1pbmZvL2lvX2dlb2pzb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFDQSxxQ0FBc0k7QUFDdEksNkJBQW1DO0FBQ25DLGtEQUEwQjtBQUcxQixJQUFLLGtCQU9KO0FBUEQsV0FBSyxrQkFBa0I7SUFDbkIscUNBQWUsQ0FBQTtJQUNmLCtDQUF5QixDQUFBO0lBQ3pCLHlDQUFtQixDQUFBO0lBQ25CLCtDQUF5QixDQUFBO0lBQ3pCLHlEQUFtQyxDQUFBO0lBQ25DLG1EQUE2QixDQUFBO0FBQ2pDLENBQUMsRUFQSSxrQkFBa0IsS0FBbEIsa0JBQWtCLFFBT3RCO0FBRUE7O0VBRUU7QUFDSCxTQUFnQixhQUFhLENBQUMsS0FBYyxFQUFFLFdBQW1CLEVBQUUsU0FBaUI7SUFDaEYsMEJBQTBCO0lBQzFCLE1BQU0sV0FBVyxHQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDakQsTUFBTSxRQUFRLEdBQW9CLGlCQUFpQixDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztJQUN4RSxzQkFBc0I7SUFDdEIsTUFBTSxPQUFPLEdBQVUsRUFBRSxDQUFDO0lBQzFCLE1BQU0sWUFBWSxHQUFVLEVBQUUsQ0FBQztJQUMvQixNQUFNLFNBQVMsR0FBVSxFQUFFLENBQUM7SUFDNUIsTUFBTSxZQUFZLEdBQVUsRUFBRSxDQUFDO0lBQy9CLE1BQU0saUJBQWlCLEdBQVUsRUFBRSxDQUFDO0lBQ3BDLE1BQU0sY0FBYyxHQUFVLEVBQUUsQ0FBQztJQUNqQyxNQUFNLE9BQU8sR0FBVSxFQUFFLENBQUM7SUFDMUIscUJBQXFCO0lBQ3JCLE1BQU0sUUFBUSxHQUFhLEVBQUUsQ0FBQztJQUM5QixNQUFNLFFBQVEsR0FBYSxFQUFFLENBQUM7SUFDOUIsTUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sT0FBTyxHQUFh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