"use strict";
/**
 * The `render` module has functions for defining various settings for the 3D viewer.
 * These settings are saved as attributes at the model level.
 * These include things like creating more advanced materials.
 * For more informtion, see the threejs docs: https://threejs.org/
 */
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = __importStar(require("three"));
var _ESide;
(function (_ESide) {
    _ESide["FRONT"] = "front";
    _ESide["BACK"] = "back";
    _ESide["BOTH"] = "both";
})(_ESide = exports._ESide || (exports._ESide = {}));
function _convertSelectESideToNum(select) {
    switch (select) {
        case _ESide.FRONT:
            return THREE.FrontSide;
        case _ESide.BACK:
            return THREE.BackSide;
        default:
            return THREE.DoubleSide;
    }
}
var _EColours;
(function (_EColours) {
    _EColours["NO_VERT_COLOURS"] = "none";
    _EColours["VERT_COLOURS"] = "apply_rgb";
})(_EColours = exports._EColours || (exports._EColours = {}));
function _convertSelectEColoursToNum(select) {
    switch (select) {
        case _EColours.NO_VERT_COLOURS:
            return THREE.NoColors;
        default:
            return THREE.VertexColors;
    }
}
var _EMaterialType;
(function (_EMaterialType) {
    _EMaterialType["BASIC"] = "MeshBasicMaterial";
    _EMaterialType["LAMBERT"] = "MeshLambertMaterial";
    _EMaterialType["PHONG"] = "MeshPhongMaterial";
    _EMaterialType["STANDARD"] = "MeshStandardMaterial";
    _EMaterialType["PHYSICAL"] = "MeshPhysicalMaterial";
})(_EMaterialType || (_EMaterialType = {}));
// ================================================================================================
/**
 * Creates a glass material with an opacity setting. The material will default to a Phong material.
 * ~
 * In order to assign a material to polygons in the model, a polygon attribute called 'material'
 * needs to be created. The value for each polygon must either be null, or must be a material name.
 *
 * @param name The name of the material.
 * @param opacity The opacity of the glass, between 0 (totally transparent) and 1 (totally opaque).
 * @returns void
 */
function GlassMaterial(__model__, name, opacity) {
    opacity = _clamp01(opacity);
    const transparent = opacity < 1;
    const settings_obj = {
        type: _EMaterialType.PHONG,
        opacity: opacity,
        transparent: transparent,
        shininess: 90,
        color: new THREE.Color(1, 1, 1),
        emissive: new THREE.Color(0, 0, 0),
        side: THREE.DoubleSide
    };
    _setMaterialModelAttrib(__model__, name, settings_obj);
}
exports.GlassMaterial = GlassMaterial;
// ================================================================================================
/**
 * Creates a Basic material and saves it in the model attributes.
 * ~
 * [See the threejs docs](https://threejs.org/docs/#api/en/materials/MeshBasicMaterial)
 * ~
 * The colour pf teh material can either ignore or apply the vertex rgb colours.
 * If 'apply' id selected, then the actual colour will be a combination of the material colour
 * and the vertex colours, as specified by the a vertex attribute called 'rgb'.
 * In such a case, if material colour is set to white, then it will
 * have no effect, and the colour will be defined by the vertex [r,g,b] values.
 * ~
 * Additional material properties can be set by calling the functions for the more advanced materials.
 * These include LambertMaterial, PhongMaterial, StandardMaterial, and Physical Material.
 * Each of these more advanced materials allows you to specify certain additional settings.
 * ~
 * In order to assign a material to polygons in the model, a polygon attribute called 'material'.
 * needs to be created. The value for each polygon must either be null, or must be a material name.
 *
 * @param name The name of the material.
 * @param colour The diffuse colour, as [r, g, b] values between 0 and 1. White is [1, 1, 1].
 * @param opacity The opacity of the glass, between 0 (totally transparent) and 1 (totally opaque).
 * @param select_side Enum, select front, back, or both.
 * @param select_vert_colours Enum, select whether to use vertex colours if they exist.
 * @returns void
 */
function BasicMaterial(__model__, name, colour, opacity, select_side, select_vert_colours) {
    const side = _convertSelectESideToNum(select_side);
    const vert_colours = _convertSelectEColoursToNum(select_vert_colours);
    opacity = _clamp01(opacity);
    const transparent = opacity < 1;
    _clampArr01(colour);
    const settings_obj = {
        type: _EMaterialType.BASIC,
        side: side,
        vertexColors: vert_colours,
        opacity: opacity,
        transparent: transparent,
        color: _colour(colour)
    };
    _setMaterialModelAttrib(__model__, name, settings_obj);
}
exports.BasicMaterial = BasicMaterial;
// ================================================================================================
/**
 * Creates a Lambert material and saves it in the model attributes.
 * If a Basic material with the same name already exits, these settings will be added to the basic material.
 * ~
 * [See the threejs docs](https://threejs.org/docs/#api/en/materials/MeshLambertMaterial)
 * ~
 * In order to assign a material to polygons in the model, a polygon attribute called 'material'
 * needs to be created. The value for each polygon must either be null, or must be a material name.
 *
 * @param name The name of the material.
 * @param emissive The emissive colour, as [r, g, b] values between 0 and 1. White is [1, 1, 1].
 * @returns void
 */
function LambertMaterial(__model__, name, emissive) {
    _clampArr01(emissive);
    const settings_obj = {
        type: _EMaterialType.LAMBERT,
        emissive: _colour(emissive)
    };
    _setMaterialModelAttrib(__model__, name, settings_obj);
}
exports.LambertMaterial = LambertMaterial;
// ================================================================================================
/**
 * Creates a Phong material and saves it in the model attributes.
 * If a Basic material with the same name already exits, these settings will be added to the basic material.
 * ~
 * [See the threejs docs](https://threejs.org/docs/#api/en/materials/MeshPhongMaterial)
 * ~
 * In order to assign a material to polygons in the model, a polygon attribute called 'material'
 * needs to be created. The value for each polygon must either be null, or must be a material name.
 *
 * @param name The name of the material.
 * @param emissive The emissive colour, as [r, g, b] values between 0 and 1. White is [1, 1, 1].
 * @param specular The specular colour, as [r, g, b] values between 0 and 1. White is [1, 1, 1].
 * @param shininess The shininess, between 0 and 100.
 * @returns void
 */
function PhongMaterial(__model__, name, emissive, specular, shininess) {
    _clampArr01(emissive);
    _clampArr01(specular);
    shininess = Math.floor(_clamp0100(shininess));
    const settings_obj = {
        type: _EMaterialType.PHONG,
        emissive: _colour(emissive),
        specular: _colour(specular),
        shininess: shininess
    };
    _setMaterialModelAttrib(__model__, name, settings_obj);
}
exports.PhongMaterial = PhongMaterial;
// ================================================================================================
/**
 * Creates a Standard material and saves it in the model attributes.
 * If a Basic material with the same name already exits, these settings will be added to the basic material.
 * ~
 * [See the threejs docs](https://threejs.org/docs/#api/en/materials/MeshStandardMaterial)
 * ~
 * In order to assign a material to polygons in the model, a polygon attribute called 'material'
 * needs to be created. The value for each polygon must either be null, or must be a material name.
 *
 * @param name The name of the material.
 * @param emissive The emissive colour, as [r, g, b] values between 0 and 1. White is [1, 1, 1].
 * @param roughness The roughness, between 0 (smooth) and 1 (rough).
 * @param metalness The metalness, between 0 (non-metalic) and 1 (metalic).
 * @param reflectivity The reflectivity, between 0 (non-reflective) and 1 (reflective).
 * @returns void
 */
function StandardlMaterial(__model__, name, emissive, roughness, metalness) {
    _clampArr01(emissive);
    roughness = _clamp01(roughness);
    metalness = _clamp01(metalness);
    const settings_obj = {
        type: _EMaterialType.STANDARD,
        emissive: _colour(emissive),
        roughness: roughness,
        metalness: metalness
    };
    _setMaterialModelAttrib(__model__, name, settings_obj);
}
exports.StandardlMaterial = StandardlMaterial;
// ================================================================================================
/**
 * Creates a Physical material and saves it in the model attributes.
 * If a Basic material with the same name already exits, these settings will be added to the basic material.
 * ~
 * [See the threejs docs](https://threejs.org/docs/#api/en/materials/MeshPhysicalMaterial)
 * ~
 * In order to assign a material to polygons in the model, a polygon attribute called 'material'
 * needs to be created. The value for each polygon must either be null, or must be a material name.
 *
 * @param name The name of the material.
 * @param emissive The emissive colour, as [r, g, b] values between 0 and 1. White is [1, 1, 1].
 * @param roughness The roughness, between 0 (smooth) and 1 (rough).
 * @param metalness The metalness, between 0 (non-metalic) and 1 (metalic).
 * @param reflectivity The reflectivity, between 0 (non-reflective) and 1 (reflective).
 * @returns void
 */
function PhysicalMaterial(__model__, name, emissive, roughness, metalness, reflectivity) {
    _clampArr01(emissive);
    roughness = _clamp01(roughness);
    metalness = _clamp01(metalness);
    reflectivity = _clamp01(reflectivity);
    const settings_obj = {
        type: _EMaterialType.PHYSICAL,
        emissive: _colour(emissive),
        roughness: roughness,
        metalness: metalness,
        reflectivity: reflectivity
    };
    _setMaterialModelAttrib(__model__, name, settings_obj);
}
exports.PhysicalMaterial = PhysicalMaterial;
// ================================================================================================
function _clamp01(val) {
    val = (val > 1) ? 1 : val;
    val = (val < 0) ? 0 : val;
    return val;
}
function _clamp0100(val) {
    val = (val > 100) ? 100 : val;
    val = (val < 0) ? 0 : val;
    return val;
}
function _clampArr01(vals) {
    for (let i = 0; i < vals.length; i++) {
        vals[i] = _clamp01(vals[i]);
    }
}
function _colour(col) {
    return new THREE.Color(col[0], col[1], col[2]);
}
function _setMaterialModelAttrib(__model__, name, settings_obj) {
    // if the material already exists, then existing settings will be added
    // but new settings will take precedence
    if (__model__.attribs.query.hasModelAttrib(name)) {
        const exist_settings_str = __model__.attribs.query.getModelAttribValue(name);
        const exist_settings_obj = JSON.parse(exist_settings_str);
        // check that the existing material is a Basic one
        if (exist_settings_obj['type'] !== _EMaterialType.BASIC) {
            if (settings_obj['type'] !== exist_settings_obj['type']) {
                throw new Error('Error creating material: non-basic material with this name already exists.');
            }
        }
        // copy the settings from the existing material to the new material
        for (const key of Object.keys(exist_settings_obj)) {
            if (settings_obj[key] === undefined) {
                settings_obj[key] = exist_settings_obj[key];
            }
        }
    }
    const settings_str = JSON.stringify(settings_obj);
    __model__.attribs.add.setModelAttribValue(name, settings_str);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvcmUvbW9kdWxlcy9yZW5kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7OztHQUtHOzs7Ozs7Ozs7QUFRSCw2Q0FBK0I7QUFFL0IsSUFBWSxNQUlYO0FBSkQsV0FBWSxNQUFNO0lBQ2QseUJBQWlCLENBQUE7SUFDakIsdUJBQWUsQ0FBQTtJQUNmLHVCQUFlLENBQUE7QUFDbkIsQ0FBQyxFQUpXLE1BQU0sR0FBTixjQUFNLEtBQU4sY0FBTSxRQUlqQjtBQUNELFNBQVMsd0JBQXdCLENBQUMsTUFBYztJQUM1QyxRQUFRLE1BQU0sRUFBRTtRQUNaLEtBQUssTUFBTSxDQUFDLEtBQUs7WUFDYixPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUM7UUFDM0IsS0FBSyxNQUFNLENBQUMsSUFBSTtZQUNaLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQztRQUMxQjtZQUNJLE9BQU8sS0FBSyxDQUFDLFVBQVUsQ0FBQztLQUMvQjtBQUNMLENBQUM7QUFDRCxJQUFZLFNBR1g7QUFIRCxXQUFZLFNBQVM7SUFDakIscUNBQTBCLENBQUE7SUFDMUIsdUNBQTRCLENBQUE7QUFDaEMsQ0FBQyxFQUhXLFNBQVMsR0FBVCxpQkFBUyxLQUFULGlCQUFTLFFBR3BCO0FBQ0QsU0FBUywyQkFBMkIsQ0FBQyxNQUFpQjtJQUNsRCxRQUFRLE1BQU0sRUFBRTtRQUNaLEtBQUssU0FBUyxDQUFDLGVBQWU7WUFDMUIsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDO1FBQzFCO1lBQ0ksT0FBTyxLQUFLLENBQUMsWUFBWSxDQUFDO0tBQ2pDO0FBQ0wsQ0FBQztBQUVELElBQUssY0FNSjtBQU5ELFdBQUssY0FBYztJQUNmLDZDQUEyQixDQUFBO0lBQzNCLGlEQUErQixDQUFBO0lBQy9CLDZDQUEyQixDQUFBO0lBQzNCLG1EQUFpQyxDQUFBO0lBQ2pDLG1EQUFpQyxDQUFBO0FBQ3JDLENBQUMsRUFO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