import { EEntType } from './common';
import { IThreeJS } from './ThreejsJSON';
import { GIModelData } from './GIModelData';

/**
 * Geo-info model class.
 */
export class GIModelThreejs {
    private modeldata: GIModelData;

   /**
     * Constructor
     */
    constructor(modeldata: GIModelData) {
        this.modeldata = modeldata;
    }
    /**
     * Generate a default color if none exists.
     */
    private _generateColors(): number[] {
        const colors = [];
        const num_ents = this.modeldata.geom.query.numEnts(EEntType.VERT);
        for (let index = 0; index < num_ents; index++) {
            colors.push(1, 1, 1);
        }
        return colors;
    }
    /**
     * Returns arrays for visualization in Threejs.
     */
    public get3jsData(ssid: number): IThreeJS {
        // get the attribs at the vertex level
        const [posis_xyz, posis_map]: [number[], Map<number, number>]  =  this.modeldata.attribs.threejs.get3jsSeqPosisCoords(ssid);
        const [vertex_xyz, vertex_map]: [number[], Map<number, number>]  =  this.modeldata.attribs.threejs.get3jsSeqVertsCoords(ssid);
        const normals_values: number[] = this.modeldata.attribs.threejs.get3jsSeqVertsNormals(ssid);
        let colors_values: number[] = this.modeldata.attribs.threejs.get3jsSeqVertsColors(ssid);
        if (!colors_values) {
            colors_values = this._generateColors();
        }
        // get posi indices
        const posis_indices: number[] = Array.from(posis_map.values());
        // get the data for triangles
        const [tri_verts_i, tri_select_map,
            vrmesh_tri_verts_i, vrmesh_tri_select_map,
            vrmesh_hidden_tri_verts_i,
            pgon_materials, pgon_material_groups]:
            [number[], Map<number, number>,
            number[], Map<number, number>,
            number[],
            object[], [number, number, number][]]
            = this.modeldata.geom.threejs.get3jsTris(ssid, vertex_map);
        // get the data for edges
        const [edge_verts_i, edge_select_map,
            vrmesh_edge_verts_i, vrmesh_edge_select_map,
            vrmesh_hidden_edge_verts_i,
            pline_materials, pline_material_groups]:
            [number[], Map<number, number>,
            number[], Map<number, number>,
            number[],
            object[], [number, number, number][]]
            = this.modeldata.geom.threejs.get3jsEdges(ssid, vertex_map);
        // get the datas for points
        const [point_verts_i, point_select_map]:
            [number[], Map<number, number>]
            = this.modeldata.geom.threejs.get3jsPoints(ssid, vertex_map);
        // return an object containing all the data
        const data: IThreeJS = {
            posis_xyz: posis_xyz,
            posis_indices: posis_indices,
            posis_map: posis_map,
            verts_xyz: vertex_xyz,
            verts_map: vertex_map,
            normals: normals_values,
            colors: colors_values,

            point_indices: point_verts_i,
            point_select_map: point_select_map,

            edge_indices: edge_verts_i,
            edge_select_map: edge_select_map,

            tri_indices: tri_verts_i,
            tri_select_map: tri_select_map,

            vrmesh_edge_indices: vrmesh_edge_verts_i,
            vrmesh_edge_select_map: vrmesh_edge_select_map,

            vrmesh_tri_indices: vrmesh_tri_verts_i,
            vrmesh_tri_select_map: vrmesh_tri_select_map,

            vrmesh_hidden_tri_indices: vrmesh_hidden_tri_verts_i,
            vrmesh_hidden_edge_indices: vrmesh_hidden_edge_verts_i,

            pline_materials: pline_materials,
            pline_material_groups: pline_material_groups,
            pgon_materials: pgon_materials,
            pgon_material_groups: pgon_material_groups
        };
        // console.log("THREEJS DATA: ", data);
        return data;
    }
}
