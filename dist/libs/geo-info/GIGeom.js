"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
const GIGeomAdd_1 = require("./GIGeomAdd");
const GIGeomModify_1 = require("./GIGeomModify");
const GIGeomQuery_1 = require("./GIGeomQuery");
const GIGeomThreejs_1 = require("./GIGeomThreejs");
const GIGeomIO_1 = require("./GIGeomIO");
/**
 * Class for geometry.
 */
class GIGeom {
    /**
     * Creates an object to store the geometry data.
     * @param model The parent model.
     */
    constructor(model) {
        //  all arrays
        this._geom_arrays = {
            // num_posis: 0,
            dn_verts_posis: [],
            dn_tris_verts: [],
            dn_edges_verts: [],
            dn_wires_edges: [],
            dn_faces_wirestris: [],
            dn_points_verts: [],
            dn_plines_wires: [],
            dn_pgons_faces: [],
            dn_colls_objs: [],
            up_posis_verts: [],
            up_tris_faces: [],
            up_verts_edges: [],
            up_verts_tris: [],
            up_verts_points: [],
            up_edges_wires: [],
            up_wires_faces: [],
            up_wires_plines: [],
            up_faces_pgons: [],
            up_points_colls: [],
            up_plines_colls: [],
            up_pgons_colls: []
        };
        this.model = model;
        this.io = new GIGeomIO_1.GIGeomIO(this, this._geom_arrays);
        this.add = new GIGeomAdd_1.GIGeomAdd(this, this._geom_arrays);
        this.modify = new GIGeomModify_1.GIGeomModify(this, this._geom_arrays);
        this.query = new GIGeomQuery_1.GIGeomQuery(this, this._geom_arrays);
        this.threejs = new GIGeomThreejs_1.GIGeomThreejs(this, this._geom_arrays);
        this.selected = [];
    }
    /**
     * Compares this model and another model.
     * @param model The model to compare with.
     */
    compare(model, result) {
        const eny_type_array = [
            common_1.EEntType.POSI,
            common_1.EEntType.TRI,
            common_1.EEntType.VERT,
            common_1.EEntType.EDGE,
            common_1.EEntType.WIRE,
            common_1.EEntType.FACE,
            common_1.EEntType.POINT,
            common_1.EEntType.PLINE,
            common_1.EEntType.PGON,
            common_1.EEntType.COLL
        ];
        const ent_type_strs = [
            'positions',
            'vertices',
            'edges',
            'wires',
            'faces',
            'points',
            'polylines',
            'polygons',
            'collections'
        ];
        for (const ent_type of eny_type_array) {
            if (this.model.geom.query.numEnts(ent_type, false) !== model.geom.query.numEnts(ent_type, false)) {
                result.matches = false;
                result.comment += 'Number of ' + ent_type_strs[ent_type] + ' do not match.\n';
            }
        }
    }
    /**
     * Checks geometry for internal consistency
     */
    check() {
        const errors = [];
        this._checkPosis().forEach(error => errors.push(error));
        this._checkVerts().forEach(error => errors.push(error));
        this._checkEdges().forEach(error => errors.push(error));
        this._checkWires().forEach(error => errors.push(error));
        this._checkFaces().forEach(error => errors.push(error));
        this._checkPlines().forEach(error => errors.push(error));
        this._checkPgons().forEach(error => errors.push(error));
        return errors;
    }
    /**
     * Checks geometry for internal consistency
     */
    _checkPosis() {
        const errors = [];
        for (let posi_i = 0; posi_i < this._geom_arrays.up_posis_verts.length; posi_i++) {
            // up
            const verts_i = this._geom_arrays.up_posis_verts[posi_i];
            if (verts_i === undefined) {
                errors.push('Posi ' + posi_i + ': Posi->Vert undefined.');
            }
            if (verts_i === null) {
                continue;
            } // deleted
            // down
            for (const vert_i of verts_i) {
                const vert = this._geom_arrays.dn_verts_posis[vert_i];
                if (vert === undefined) {
                    errors.push('Posi ' + posi_i + ': Vert->Posi undefined.');
                }
                if (vert === null) {
                    errors.push('Posi ' + posi_i + ': Vert->Posi null.');
                }
            }
        }
        return errors;
    }
    _checkVerts() {
        const errors = [];
        for (let vert_i = 0; vert_i < this._geom_arrays.dn_verts_posis.length; vert_i++) {
            // down
            const vert = this._geom_arrays.dn_verts_posis[vert_i];
            if (vert === undefined) {
                errors.push('Vert ' + vert_i + ': Vert->Posi undefined.');
            }
            if (vert === null) {
                continue;
            } // deleted
            // up
            const edges_i = this._geom_arrays.up_verts_edges[vert_i];
            if (edges_i === undefined) {
                errors.push('Vert ' + vert_i + ': Vert->Edge undefined.');
                continue;
            }
            if (edges_i === null) {
                errors.push('Vert ' + vert_i + ': Vert->Edge null.');
                continue;
            }
            for (const edge_i of edges_i) {
                if (edge_i === undefined) {
                    errors.push('Vert ' + vert_i + ': Vert->Edge undefined.');
                }
                if (edge_i === null) {
                    errors.push('Vert ' + vert_i + ': Vert->Edge null.');
                }
                // down
                const edge = this._geom_arrays.dn_edges_verts[edge_i];
                if (edge === undefined) {
                    errors.push('Vert ' + vert_i + ': Edge->Vert undefined.');
                }
                if (edge === null) {
                    errors.push('Vert ' + vert_i + ': Edge->Vert null.');
                }
            }
        }
        return errors;
    }
    _checkEdges() {
        const errors = [];
        for (let edge_i = 0; edge_i < this._geom_arrays.dn_edges_verts.length; edge_i++) {
            // down
            const edge = this._geom_arrays.dn_edges_verts[edge_i];
            if (edge === undefined) {
                errors.push('Edge ' + edge_i + ': Edge->Vert undefined.');
            }
            if (edge === null) {
                continue;
            } // deleted
            // up
            const wire_i = this._geom_arrays.up_edges_wires[edge_i];
            if (wire_i === undefined) {
                continue;
            } // no wire, must be a point
            if (wire_i === null) {
                errors.push('Edge ' + edge_i + ': Edge->Wire null.');
            }
            // down
            const wire = this._geom_arrays.dn_wires_edges[wire_i];
            if (wire === undefined) {
                errors.push('Edge ' + edge_i + ': Wire->Edge undefined.');
            }
            if (wire === null) {
                errors.push('Edge ' + edge_i + ': Wire->Edge null.');
            }
        }
        return errors;
    }
    _checkWires() {
        const errors = [];
        for (let wire_i = 0; wire_i < this._geom_arrays.dn_wires_edges.length; wire_i++) {
            // down
            const wire = this._geom_arrays.dn_wires_edges[wire_i];
            if (wire === undefined) {
                errors.push('Wire ' + wire_i + ': Wire->Edge undefined.');
            }
            if (wire === null) {
                continue;
            } // deleted
            // up
            const face_i = this._geom_arrays.up_wires_faces[wire_i];
            const pline_i = this._geom_arrays.up_wires_plines[wire_i];
            if (face_i !== undefined) {
                if (face_i === null) {
                    errors.push('Wire ' + wire_i + ': Wire->Face null.');
                }
                // down
                const face = this._geom_arrays.dn_faces_wirestris[face_i];
                if (face === undefined) {
                    errors.push('Wire ' + wire_i + ': Face->Wire undefined.');
                }
                if (face === null) {
                    errors.push('Wire ' + wire_i + ': Face->Wire null.');
                }
            }
            else if (pline_i !== undefined) {
                if (pline_i === null) {
                    errors.push('Wire ' + wire_i + ': Wire->Pline null.');
                }
                // down
                const pline = this._geom_arrays.dn_plines_wires[pline_i];
                if (pline === undefined) {
                    errors.push('Wire ' + wire_i + ': Pline->Wire undefined.');
                }
                if (pline === null) {
                    errors.push('Wire ' + wire_i + ': Pline->Wire null.');
                }
            }
            else {
                // down
                errors.push('Wire ' + wire_i + ': Both Wire->Face and Wire->Pline undefined.');
            }
        }
        return errors;
    }
    _checkFaces() {
        const errors = [];
        for (let face_i = 0; face_i < this._geom_arrays.dn_faces_wirestris.length; face_i++) {
            // down
            const face = this._geom_arrays.dn_faces_wirestris[face_i];
            if (face === undefined) {
                errors.push('Face ' + face_i + ': Face->WireTri undefined.');
            }
            if (face === null) {
                continue;
            } // deleted
            // up
            const pgon_i = this._geom_arrays.up_faces_pgons[face_i];
            if (pgon_i === undefined) {
                errors.push('Face ' + face_i + ': Face->Pgon undefined.');
            }
            if (pgon_i === null) {
                errors.push('Face ' + face_i + ': Face->Pgon null.');
            }
            // down
            const pgon = this._geom_arrays.dn_pgons_faces[pgon_i];
            if (pgon === undefined) {
                errors.push('Face ' + face_i + ': Pgon->Face undefined.');
            }
            if (pgon === null) {
                errors.push('Face ' + face_i + ': Pgon->Face null.');
            }
        }
        return errors;
    }
    _checkPlines() {
        const errors = [];
        for (let pline_i = 0; pline_i < this._geom_arrays.dn_plines_wires.length; pline_i++) {
            // down
            const pline = this._geom_arrays.dn_plines_wires[pline_i];
            if (pline === undefined) {
                errors.push('Pline ' + pline_i + ': Pline->Wire undefined.');
            }
            if (pline === null) {
                continue;
            } // deleted
            // up
            const colls_i = this._geom_arrays.up_plines_colls[pline_i];
            if (colls_i === undefined) {
                continue;
            } // not in coll
            for (const coll_i of colls_i) {
                if (coll_i === undefined) {
                    errors.push('Pline ' + pline_i + ': Pline->Coll undefined.');
                }
                if (coll_i === null) {
                    errors.push('Pline ' + pline_i + ': Pline->Coll null.');
                }
                // down
                const coll = this._geom_arrays.dn_colls_objs[coll_i];
                if (coll === undefined) {
                    errors.push('Pline ' + pline_i + ': Coll->Objs undefined.');
                }
                if (coll === null) {
                    errors.push('Pline ' + pline_i + ': Coll->Objs null.');
                }
                if (coll[2].indexOf(pline_i) === -1) {
                    errors.push('Pline ' + pline_i + ': Coll->Pline missing.');
                }
            }
        }
        return errors;
    }
    _checkPgons() {
        const errors = [];
        for (let pgon_i = 0; pgon_i < this._geom_arrays.dn_pgons_faces.length; pgon_i++) {
            // down
            const pgon = this._geom_arrays.dn_pgons_faces[pgon_i];
            if (pgon === undefined) {
                errors.push('Pgon ' + pgon_i + ': Pgon->Face undefined.');
            }
            if (pgon === null) {
                continue;
            } // deleted
            // up
            const colls_i = this._geom_arrays.up_pgons_colls[pgon_i];
            if (colls_i === undefined) {
                continue;
            } // not in coll
            for (const coll_i of colls_i) {
                if (coll_i === undefined) {
                    errors.push('Pgon ' + pgon_i + ': Pgon->Coll undefined.');
                }
                if (coll_i === null) {
                    errors.push('Pgon ' + pgon_i + ': Pgon->Coll null.');
                }
                // down
                const coll = this._geom_arrays.dn_colls_objs[coll_i];
                if (coll === undefined) {
                    errors.push('Pgon ' + pgon_i + ': Coll->Objs undefined.');
                }
                if (coll === null) {
                    errors.push('Pgon ' + pgon_i + ': Coll->Objs null.');
                }
                if (coll[3].indexOf(pgon_i) === -1) {
                    errors.push('Pgon ' + pgon_i + ': Coll->Pgon missing.');
                }
            }
        }
        return errors;
    }
}
exports.GIGeom = GIGeom;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lHZW9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYnMvZ2VvLWluZm8vR0lHZW9tLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EscUNBQWdIO0FBQ2hILDJDQUF3QztBQUN4QyxpREFBOEM7QUFDOUMsK0NBQTRDO0FBQzVDLG1EQUFnRDtBQUNoRCx5Q0FBc0M7QUFHdEM7O0dBRUc7QUFDSCxNQUFhLE1BQU07SUFrQ2Y7OztPQUdHO0lBQ0gsWUFBWSxLQUFjO1FBbkMxQixjQUFjO1FBQ1AsaUJBQVksR0FBZ0I7WUFDL0IsZ0JBQWdCO1lBQ2hCLGNBQWMsRUFBRSxFQUFFO1lBQ2xCLGFBQWEsRUFBRSxFQUFFO1lBQ2pCLGNBQWMsRUFBRSxFQUFFO1lBQ2xCLGNBQWMsRUFBRSxFQUFFO1lBQ2xCLGtCQUFrQixFQUFFLEVBQUU7WUFDdEIsZUFBZSxFQUFFLEVBQUU7WUFDbkIsZUFBZSxFQUFFLEVBQUU7WUFDbkIsY0FBYyxFQUFFLEVBQUU7WUFDbEIsYUFBYSxFQUFFLEVBQUU7WUFDakIsY0FBYyxFQUFFLEVBQUU7WUFDbEIsYUFBYSxFQUFFLEVBQUU7WUFDakIsY0FBYyxFQUFFLEVBQUU7WUFDbEIsYUFBYSxFQUFFLEVBQUU7WUFDakIsZUFBZSxFQUFFLEVBQUU7WUFDbkIsY0FBYyxFQUFFLEVBQUU7WUFDbEIsY0FBYyxFQUFFLEVBQUU7WUFDbEIsZUFBZSxFQUFFLEVBQUU7WUFDbkIsY0FBYyxFQUFFLEVBQUU7WUFDbEIsZUFBZSxFQUFFLEVBQUU7WUFDbkIsZUFBZSxFQUFFLEVBQUU7WUFDbkIsY0FBYyxFQUFFLEVBQUU7U0FDckIsQ0FBQztRQVlFLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxtQkFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDaEQsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLHFCQUFT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