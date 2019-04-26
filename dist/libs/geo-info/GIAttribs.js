"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GIAttribsAdd_1 = require("./GIAttribsAdd");
const GIAttribsThreejs_1 = require("./GIAttribsThreejs");
const GIAttribsQuery_1 = require("./GIAttribsQuery");
const common_1 = require("./common");
const GIAttribsIO_1 = require("./GIAttribsIO");
/**
 * Class for attributes.
 */
class GIAttribs {
    /**
      * Creates an object to store the attribute data.
      * @param model The JSON data
      */
    constructor(model) {
        // maps, the key is the name, the value is the attrib map clas
        this._attribs_maps = {
            ps: new Map(),
            _v: new Map(),
            _e: new Map(),
            _w: new Map(),
            _f: new Map(),
            pt: new Map(),
            pl: new Map(),
            pg: new Map(),
            co: new Map(),
            mo: new Map()
        };
        this._model = model;
        this.io = new GIAttribsIO_1.GIAttribsIO(model, this._attribs_maps);
        this.add = new GIAttribsAdd_1.GIAttribsAdd(model, this._attribs_maps);
        this.query = new GIAttribsQuery_1.GIAttribsQuery(model, this._attribs_maps);
        this.threejs = new GIAttribsThreejs_1.GIAttribsThreejs(model, this._attribs_maps);
        this.add.addAttrib(common_1.EEntType.POSI, common_1.EAttribNames.COORDS, common_1.EAttribDataTypeStrs.FLOAT, 3);
    }
}
exports.GIAttribs = GIAttribs;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0lBdHRyaWJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYnMvZ2VvLWluZm8vR0lBdHRyaWJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaURBQThDO0FBQzlDLHlEQUFzRDtBQUN0RCxxREFBa0Q7QUFFbEQscUNBQW9HO0FBQ3BHLCtDQUE0QztBQUU1Qzs7R0FFRztBQUNILE1BQWEsU0FBUztJQW9CbkI7OztRQUdJO0lBQ0gsWUFBWSxLQUFjO1FBdEIxQiw4REFBOEQ7UUFDdkQsa0JBQWEsR0FBaUI7WUFDakMsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1lBQ2IsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO1NBQ2hCLENBQUM7UUFXRSxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNwQixJQUFJLENBQUMsRUFBRSxHQUFHLElBQUkseUJBQVcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3JELElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSwyQkFBWSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLCtCQUFjLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUMzRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksbUNBQWdCLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUMvRCxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxpQkFBUSxDQUFDLElBQUksRUFBRSxxQkFBWSxDQUFDLE1BQU0sRUFBRSw0QkFBbUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDekYsQ0FBQztDQUNKO0FBaENELDhCQWdDQyJ9