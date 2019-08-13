"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
/**
 * Geo-info model class.
 */
class GIModelThreejs {
    /**
      * Creates an object to store the attribute data.
      * @param model The JSON data
      */
    constructor(model) {
        this._model = model;
    }
    /**
     * Generate a default color if none exists.
     */
    _generateColors() {
        const colors = [];
        const numEnts = this._model.geom.query.numEnts(common_1.EEntType.VERT, false);
        for (let index = 0; index < numEnts; index++) {
            colors.push(1, 1, 1);
        }
        return colors;
    }
    // /**
    //  * Generate default normals if non exist.
    //  */
    // private _generateNormals(): number[] {
    //     const normals = [];
    //     const numEnts = this.geom.query.numEnts(EEntType.VERT, false);
    //     for (let index = 0; index < numEnts; index++) {
    //         normals.push(0, 0, 0);
    //     }
    //     return normals;
    // }
    /**
     * Returns arrays for visualization in Threejs.
     */
    get3jsData() {
        // get the attribs at the vertex level
        const [posis_xyz, posis_map] = this._model.attribs.threejs.get3jsSeqPosisCoords();
        const [vertex_xyz, vertex_map] = this._model.attribs.threejs.get3jsSeqVertsCoords();
        const normals_values = this._model.attribs.threejs.get3jsSeqVertsAttrib(common_1.EAttribNames.NORMAL);
        let colors_values = this._model.attribs.threejs.get3jsSeqVertsAttrib(common_1.EAttribNames.COLOR);
        // add normals and colours
        // if (!normals_values) {
        //     normals_values = this._generateNormals();
        // }
        if (!colors_values) {
            colors_values = this._generateColors();
        }
        // get posi indices
        const posis_indices = Array.from(posis_map.values());
        // get the indices of the vertices for edges, points and triangles
        const [tris_verts_i, triangle_select_map, materials, material_groups] = this._model.geom.threejs.get3jsTris(vertex_map);
        const [edges_verts_i, edge_select_map] = this._model.geom.threejs.get3jsEdges(vertex_map);
        const [points_verts_i, point_select_map] = this._model.geom.threejs.get3jsPoints(vertex_map);
        // return an object containing all the data
        const data = {
            posis_xyz: posis_xyz,
            posis_indices: posis_indices,
            posis_map: posis_map,
            vertex_xyz: vertex_xyz,
            vertex_map: vertex_map,
            normals: normals_values,
            colors: colors_values,
            point_indices: points_verts_i,
            point_select_map: point_select_map,
            edge_indices: edges_verts_i,
            edge_select_map: edge_select_map,
            triangle_indices: tris_verts_i,
            triangle_select_map: triangle_select_map,
            materials: materials,
            material_groups: material_groups
        };
        // console.log(data);
        return data;
    }
}
exports.GIModelThreejs = GIModelThreejs;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lNb2RlbFRocmVlanMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlicy9nZW8taW5mby9HSU1vZGVsVGhyZWVqcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHFDQUFrRDtBQUdsRDs7R0FFRztBQUNILE1BQWEsY0FBYztJQUd4Qjs7O1FBR0k7SUFDSCxZQUFZLEtBQWM7UUFDdEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7SUFDeEIsQ0FBQztJQUNEOztPQUVHO0lBQ0ssZUFBZTtRQUNuQixNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDbEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNyRSxLQUFLLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsT0FBTyxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQzFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUN4QjtRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFDRCxNQUFNO0lBQ04sNENBQTRDO0lBQzVDLE1BQU07SUFDTix5Q0FBeUM7SUFDekMsMEJBQTBCO0lBQzFCLHFFQUFxRTtJQUNyRSxzREFBc0Q7SUFDdEQsaUNBQWlDO0lBQ2pDLFFBQVE7SUFDUixzQkFBc0I7SUFDdEIsSUFBSTtJQUNKOztPQUVHO0lBQ0ksVUFBVTtRQUNiLHNDQUFzQztRQUN0QyxNQUFNLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxHQUFzQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUNySCxNQUFNLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxHQUFzQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUN2SCxNQUFNLGNBQWMsR0FBYSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMscUJBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2RyxJQUFJLGFBQWEsR0FBYSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMscUJBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuRywwQkFBMEI7UUFDMUIseUJBQXlCO1FBQ3pCLGdEQUFnRDtRQUNoRCxJQUFJO1FBQ0osSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUNoQixhQUFhLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1NBQzFDO1FBQ0QsbUJBQW1CO1FBQ25CLE1BQU0sYUFBYSxHQUFhLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDL0Qsa0VBQWtFO1FBQ2xFLE1BQU0sQ0FBQyxZQUFZLEVBQUUsbUJBQW1CLEVBQUUsU0FBUyxFQUFFLGVBQWUsQ0FBQyxHQUNPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDNUgsTUFBTSxDQUFDLGFBQWEsRUFBRSxlQUFlLENBQUMsR0FBb0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMzSCxNQUFNLENBQUMsY0FBYyxFQUFFLGdCQUFnQixDQUFDLEdBQW9DLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDOUgsMkNBQTJDO1FBQzNDLE1BQU0sSUFBSSxHQUFhO1lBQ25CLFNBQVMsRUFBRSxTQUFTO1lBQ3BCLGFBQWEsRUFBRSxhQUFhO1lBQzVCLFNBQVMsRUFBRSxTQUFTO1lBQ3BCLFVBQVUsRUFBRSxVQUFVO1lBQ3RCLFVBQVUsRUFBRSxVQUFVO1lBQ3RCLE9BQU8sRUFBRSxjQUFjO1lBQ3ZCLE1BQU0sRUFBRSxhQUFhO1lBQ3JCLGFBQWEsRUFBRSxjQUFjO1lBQzdCLGdCQUFnQixFQUFFLGdCQUFnQjtZQUNsQyxZQUFZLEVBQUUsYUFBYTtZQUMzQixlQUFlLEVBQUUsZUFBZTtZQUNoQyxnQkFBZ0IsRUFBRSxZQUFZO1lBQzlCLG1CQUFtQixFQUFFLG1CQUFtQjtZQUN4QyxTQUFTLEVBQUUsU0FBUztZQUNwQixlQUFlLEVBQUUsZUFBZTtTQUNuQyxDQUFDO1FBQ0YscUJBQXFCO1FBQ3JCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7Q0FDSjtBQTVFRCx3Q0E0RUMifQ==