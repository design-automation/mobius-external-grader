"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
     * @param geom_data The JSON data
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lHZW9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYnMvZ2VvLWluZm8vR0lHZW9tLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsMkNBQXdDO0FBQ3hDLGlEQUE4QztBQUM5QywrQ0FBNEM7QUFDNUMsbURBQWdEO0FBQ2hELHlDQUFzQztBQUV0Qzs7R0FFRztBQUNILE1BQWEsTUFBTTtJQWtDZjs7O09BR0c7SUFDSCxZQUFZLEtBQWM7UUFuQzFCLGNBQWM7UUFDUCxpQkFBWSxHQUFnQjtZQUMvQixnQkFBZ0I7WUFDaEIsY0FBYyxFQUFFLEVBQUU7WUFDbEIsYUFBYSxFQUFFLEVBQUU7WUFDakIsY0FBYyxFQUFFLEVBQUU7WUFDbEIsY0FBYyxFQUFFLEVBQUU7WUFDbEIsa0JBQWtCLEVBQUUsRUFBRTtZQUN0QixlQUFlLEVBQUUsRUFBRTtZQUNuQixlQUFlLEVBQUUsRUFBRTtZQUNuQixjQUFjLEVBQUUsRUFBRTtZQUNsQixhQUFhLEVBQUUsRUFBRTtZQUNqQixjQUFjLEVBQUUsRUFBRTtZQUNsQixhQUFhLEVBQUUsRUFBRTtZQUNqQixjQUFjLEVBQUUsRUFBRTtZQUNsQixhQUFhLEVBQUUsRUFBRTtZQUNqQixlQUFlLEVBQUUsRUFBRTtZQUNuQixjQUFjLEVBQUUsRUFBRTtZQUNsQixjQUFjLEVBQUUsRUFBRTtZQUNsQixlQUFlLEVBQUUsRUFBRTtZQUNuQixjQUFjLEVBQUUsRUFBRTtZQUNsQixlQUFlLEVBQUUsRUFBRTtZQUNuQixlQUFlLEVBQUUsRUFBRTtZQUNuQixjQUFjLEVBQUUsRUFBRTtTQUNyQixDQUFDO1FBWUUsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLG1CQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNoRCxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUkscUJBQVMsQ0FBQyxJQUFJLEVB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