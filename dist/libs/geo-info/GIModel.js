"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GIGeom_1 = require("./GIGeom");
const GIAttribs_1 = require("./GIAttribs");
const GIModelThreejs_1 = require("./GIModelThreejs");
/**
 * Geo-info model class.
 */
class GIModel {
    /**
     * Creates a model.
     * @param model_data The JSON data
     */
    constructor(model_data) {
        this.geom = new GIGeom_1.GIGeom(this);
        this.attribs = new GIAttribs_1.GIAttribs(this);
        this.threejs = new GIModelThreejs_1.GIModelThreejs(this);
        if (model_data) {
            this.setData(model_data);
        }
    }
    /**
     * Copys the data from a second model into this model.
     * The existing data in this model is not deleted.
     * @param model_data The GI model.
     */
    merge(model) {
        this.attribs.io.merge(model.attribs._attribs_maps); // warning: must be before this.geom.io.merge()
        this.geom.io.merge(model.geom._geom_arrays);
    }
    /**
     * Sets the data in this model from JSON data.
     * Any existing data in the model is deleted.
     * @param model_data The JSON data.
     */
    setData(model_data) {
        this.attribs.io.setData(model_data.attributes); // warning: must be before this.geom.io.setData()
        const new_ents_i = this.geom.io.setData(model_data.geometry);
        return new_ents_i;
    }
    /**
     * Returns the JSON data for this model.
     */
    getData() {
        return {
            geometry: this.geom.io.getData(),
            attributes: this.attribs.io.getData()
        };
    }
    /**
     * Compares this model and another model.
     * @param model The model to compare with.
     */
    compare(model) {
        const result = { matches: true, comment: '' };
        this.geom.compare(model, result);
        this.attribs.compare(model, result);
        if (result.matches) {
            result.comment = 'Models match.';
        }
        else {
            result.comment = 'Models do not match.\n' + result.comment;
        }
        return result;
    }
    /**
     * Check model for internal consistency
     */
    check() {
        return this.geom.check();
    }
}
exports.GIModel = GIModel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWJzL2dlby1pbmZvL0dJTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxQ0FBa0M7QUFDbEMsMkNBQXdDO0FBRXhDLHFEQUFrRDtBQUNsRDs7R0FFRztBQUNILE1BQWEsT0FBTztJQUtoQjs7O09BR0c7SUFDSCxZQUFZLFVBQXVCO1FBQy9CLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLHFCQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLCtCQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEMsSUFBSSxVQUFVLEVBQUU7WUFDWixJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQzVCO0lBQ0wsQ0FBQztJQUNEOzs7O09BSUc7SUFDSSxLQUFLLENBQUMsS0FBYztRQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLCtDQUErQztRQUNuRyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBQ0Q7Ozs7T0FJRztJQUNJLE9BQU8sQ0FBRSxVQUFzQjtRQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsaURBQWlEO1FBQ2pHLE1BQU0sVUFBVSxHQUFjLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEUsT0FBTyxVQUFVLENBQUM7SUFDdEIsQ0FBQztJQUNEOztPQUVHO0lBQ0ksT0FBTztRQUNWLE9BQU87WUFDSCxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO1lBQ2hDLFVBQVUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUU7U0FDeEMsQ0FBQztJQUNOLENBQUM7SUFDRDs7O09BR0c7SUFDSSxPQUFPLENBQUMsS0FBYztRQUN6QixNQUFNLE1BQU0sR0FBd0MsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUMsQ0FBQztRQUNqRixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDakMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRTtZQUNoQixNQUFNLENBQUMsT0FBTyxHQUFHLGVBQWUsQ0FBQztTQUNwQzthQUFNO1lBQ0gsTUFBTSxDQUFDLE9BQU8sR0FBRyx3QkFBd0IsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO1NBQzlEO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUNEOztPQUVHO0lBQ0ksS0FBSztRQUNSLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUM3QixDQUFDO0NBQ0o7QUFsRUQsMEJBa0VDIn0=