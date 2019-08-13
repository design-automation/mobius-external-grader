"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
const GIAttribMap_1 = require("./GIAttribMap");
/**
 * Class for attributes.
 */
class GIAttribsIO {
    /**
      * Creates an object to store the attribute data.
      * @param model The JSON data
      */
    constructor(model, attribs_maps) {
        this._model = model;
        this._attribs_maps = attribs_maps;
    }
    /**
     * Adds data to this model from JSON data.
     * The existing data in the model is not deleted.
     * @param model_data The JSON data for the model.
     */
    merge(attribs_maps) {
        // add the attribute data
        if (attribs_maps.ps !== undefined) {
            this._mergeAttribs(attribs_maps, common_1.EEntType.POSI);
        }
        if (attribs_maps._v !== undefined) {
            this._mergeAttribs(attribs_maps, common_1.EEntType.VERT);
        }
        if (attribs_maps._e !== undefined) {
            this._mergeAttribs(attribs_maps, common_1.EEntType.EDGE);
        }
        if (attribs_maps._w !== undefined) {
            this._mergeAttribs(attribs_maps, common_1.EEntType.WIRE);
        }
        if (attribs_maps._f !== undefined) {
            this._mergeAttribs(attribs_maps, common_1.EEntType.FACE);
        }
        if (attribs_maps.pt !== undefined) {
            this._mergeAttribs(attribs_maps, common_1.EEntType.POINT);
        }
        if (attribs_maps.pl !== undefined) {
            this._mergeAttribs(attribs_maps, common_1.EEntType.PLINE);
        }
        if (attribs_maps.pg !== undefined) {
            this._mergeAttribs(attribs_maps, common_1.EEntType.PGON);
        }
        if (attribs_maps.co !== undefined) {
            this._mergeAttribs(attribs_maps, common_1.EEntType.COLL);
        }
        if (attribs_maps.mo !== undefined) {
            this._mergeModelAttribs(attribs_maps);
        }
    }
    /**
     * Adds data to this model from JSON data.
     * The existing data in the model is deleted.
     * @param model_data The JSON data for the model.
     */
    setData(attribs_data) {
        // add the attribute data
        if (attribs_data.positions !== undefined) {
            this._setAttribs(attribs_data.positions, common_1.EEntType.POSI);
        }
        if (attribs_data.vertices !== undefined) {
            this._setAttribs(attribs_data.vertices, common_1.EEntType.VERT);
        }
        if (attribs_data.edges !== undefined) {
            this._setAttribs(attribs_data.edges, common_1.EEntType.EDGE);
        }
        if (attribs_data.wires !== undefined) {
            this._setAttribs(attribs_data.wires, common_1.EEntType.WIRE);
        }
        if (attribs_data.faces !== undefined) {
            this._setAttribs(attribs_data.faces, common_1.EEntType.FACE);
        }
        if (attribs_data.points !== undefined) {
            this._setAttribs(attribs_data.points, common_1.EEntType.POINT);
        }
        if (attribs_data.polylines !== undefined) {
            this._setAttribs(attribs_data.polylines, common_1.EEntType.PLINE);
        }
        if (attribs_data.polygons !== undefined) {
            this._setAttribs(attribs_data.polygons, common_1.EEntType.PGON);
        }
        if (attribs_data.collections !== undefined) {
            this._setAttribs(attribs_data.collections, common_1.EEntType.COLL);
        }
        if (attribs_data.model !== undefined) {
            this._setModelAttribs(attribs_data.model);
        }
    }
    /**
     * Returns the JSON data for this model.
     */
    getData() {
        return {
            positions: Array.from(this._attribs_maps.ps.values()).map(attrib => attrib.getData()),
            vertices: Array.from(this._attribs_maps._v.values()).map(attrib => attrib.getData()),
            edges: Array.from(this._attribs_maps._e.values()).map(attrib => attrib.getData()),
            wires: Array.from(this._attribs_maps._w.values()).map(attrib => attrib.getData()),
            faces: Array.from(this._attribs_maps._f.values()).map(attrib => attrib.getData()),
            points: Array.from(this._attribs_maps.pt.values()).map(attrib => attrib.getData()),
            polylines: Array.from(this._attribs_maps.pl.values()).map(attrib => attrib.getData()),
            polygons: Array.from(this._attribs_maps.pg.values()).map(attrib => attrib.getData()),
            collections: Array.from(this._attribs_maps.co.values()).map(attrib => attrib.getData()),
            model: Array.from(this._attribs_maps.mo)
        };
    }
    // ============================================================================
    // Private methods
    // ============================================================================
    /**
     * From another model
     * The existing attributes are not deleted
     * @param attribs_maps
     */
    _mergeModelAttribs(attribs_maps) {
        const from_attrib = attribs_maps[common_1.EEntTypeStr[common_1.EEntType.MOD]];
        const to_attrib = this._attribs_maps[common_1.EEntTypeStr[common_1.EEntType.MOD]];
        from_attrib.forEach((value, name) => {
            to_attrib.set(name, value);
        });
    }
    /**
     * From JSON data
     * Existing attributes are deleted
     * @param new_attribs_data
     */
    _setModelAttribs(new_attribs_data) {
        this._attribs_maps[common_1.EEntTypeStr[common_1.EEntType.MOD]] = new Map(new_attribs_data);
    }
    /**
     * From another model
     * The existing attributes are not deleted
     * @param attribs_maps
     */
    _mergeAttribs(attribs_maps, ent_type) {
        const from_attribs = attribs_maps[common_1.EEntTypeStr[ent_type]];
        const to_attribs = this._attribs_maps[common_1.EEntTypeStr[ent_type]];
        const num_ents = this._model.geom.query.numEnts(ent_type, true); // incude deleted ents
        from_attribs.forEach(from_attrib => {
            const name = from_attrib.getName();
            // get or create the existing attrib
            if (!to_attribs.has(name)) {
                to_attribs.set(name, new GIAttribMap_1.GIAttribMap(name, from_attrib.getDataType()));
            }
            const to_attrib = to_attribs.get(name);
            // get the data and shift the ents_i indices
            const ents_i_values = from_attrib.getEntsVals();
            for (const ents_i_value of ents_i_values) {
                ents_i_value[0] = ents_i_value[0].map(ent_i => ent_i + num_ents); // shift
            }
            // set the data
            to_attrib.setEntsVals(ents_i_values);
        });
    }
    /**
     * From JSON data
     * Existing attributes are deleted
     * @param new_attribs_data
     */
    _setAttribs(new_attribs_data, ent_type) {
        const to_attribs = new Map();
        new_attribs_data.forEach(new_attrib_data => {
            const name = new_attrib_data.name;
            // create a new attrib
            const to_attrib = new GIAttribMap_1.GIAttribMap(name, new_attrib_data.data_type);
            to_attribs.set(name, to_attrib);
            // set the data
            to_attrib.setEntsVals(new_attrib_data.data);
        });
        this._attribs_maps[common_1.EEntTypeStr[ent_type]] = to_attribs;
    }
}
exports.GIAttribsIO = GIAttribsIO;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lBdHRyaWJzSU8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlicy9nZW8taW5mby9HSUF0dHJpYnNJTy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLHFDQUFtSTtBQUNuSSwrQ0FBNEM7QUFFNUM7O0dBRUc7QUFDSCxNQUFhLFdBQVc7SUFHckI7OztRQUdJO0lBQ0gsWUFBWSxLQUFjLEVBQUUsWUFBMEI7UUFDbEQsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDcEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUM7SUFDdEMsQ0FBQztJQUNEOzs7O09BSUc7SUFDSSxLQUFLLENBQUMsWUFBMEI7UUFDbkMseUJBQXlCO1FBQ3pCLElBQUksWUFBWSxDQUFDLEVBQUUsS0FBSyxTQUFTLEVBQUU7WUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxpQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQUU7UUFDdkYsSUFBSSxZQUFZLENBQUMsRUFBRSxLQUFLLFNBQVMsRUFBRTtZQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLGlCQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7U0FBRTtRQUN2RixJQUFJLFlBQVksQ0FBQyxFQUFFLEtBQUssU0FBUyxFQUFFO1lBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLEVBQUUsaUJBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUFFO1FBQ3ZGLElBQUksWUFBWSxDQUFDLEVBQUUsS0FBSyxTQUFTLEVBQUU7WUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxpQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQUU7UUFDdkYsSUFBSSxZQUFZLENBQUMsRUFBRSxLQUFLLFNBQVMsRUFBRTtZQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLGlCQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7U0FBRTtRQUN2RixJQUFJLFlBQVksQ0FBQyxFQUFFLEtBQUssU0FBUyxFQUFFO1lBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLEVBQUUsaUJBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUFFO1FBQ3hGLElBQUksWUFBWSxDQUFDLEVBQUUsS0FBSyxTQUFTLEVBQUU7WUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxpQkFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQUU7UUFDeEYsSUFBSSxZQUFZLENBQUMsRUFBRSxLQUFLLFNBQVMsRUFBRTtZQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLGlCQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7U0FBRTtRQUN2RixJQUFJLFlBQVksQ0FBQyxFQUFFLEtBQUssU0FBUyxFQUFFO1lBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLEVBQUUsaUJBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUFFO1FBQ3ZGLElBQUksWUFBWSxDQUFDLEVBQUUsS0FBSyxTQUFTLEVBQUU7WUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLENBQUM7U0FBRTtJQUNqRixDQUFDO0lBQ0Q7Ozs7T0FJRztJQUNJLE9BQU8sQ0FBQyxZQUEwQjtRQUNyQyx5QkFBeUI7UUFDekIsSUFBSSxZQUFZLENBQUMsU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUN0QyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsaUJBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMzRDtRQUNELElBQUksWUFBWSxDQUFDLFFBQVEsS0FBSyxTQUFTLEVBQUU7WUFDckMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLGlCQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDMUQ7UUFDRCxJQUFJLFlBQVksQ0FBQyxLQUFLLEtBQUssU0FBUyxFQUFFO1lBQ2xDLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxpQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3ZEO1FBQ0QsSUFBSSxZQUFZLENBQUMsS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUNsQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsaUJBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN2RDtRQUNELElBQUksWUFBWSxDQUFDLEtBQUssS0FBSyxTQUFTLEVBQUU7WUFDbEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLGlCQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDdkQ7UUFDRCxJQUFJLFlBQVksQ0FBQyxNQUFNLEtBQUssU0FBUyxFQUFFO1lBQ25DLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxpQkFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3pEO1FBQ0QsSUFBSSxZQUFZLENBQUMsU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUN0QyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsaUJBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUM1RDtRQUNELElBQUksWUFBWSxDQUFDLFFBQVEsS0FBSyxTQUFTLEVBQUU7WUFDckMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLGlCQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDMUQ7UUFDRCxJQUFJLFlBQVksQ0FBQyxXQUFXLEtBQUssU0FBUyxFQUFFO1lBQ3hDLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxpQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzdEO1FBQ0QsSUFBSSxZQUFZLENBQUMsS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUNsQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzdDO0lBQ0wsQ0FBQztJQUNEOztPQUVHO0lBQ0ksT0FBTztRQUNWLE9BQU87WUFDSCxTQUFTLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNyRixRQUFRLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwRixLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNqRixLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNqRixLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNqRixNQUFNLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNsRixTQUFTLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEdB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