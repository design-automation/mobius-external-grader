"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
// ============================================================================
function getArrDepth(arr) {
    if (Array.isArray(arr)) {
        return 1 + getArrDepth(arr[0]);
    }
    return 0;
}
exports.getArrDepth = getArrDepth;
function isEmptyArr(arr) {
    if (Array.isArray(arr) && !arr.length) {
        return true;
    }
    return false;
}
exports.isEmptyArr = isEmptyArr;
// ============================================================================
function idsMakeFromIndicies(ent_type, idxs) {
    const depth = getArrDepth(idxs);
    if (depth === 0) {
        const idx = idxs;
        return common_1.EEntTypeStr[ent_type] + idx;
    }
    else if (depth === 1) {
        const idxs_arr = idxs;
        if (idxs_arr.length === 0) {
            return [];
        } //  deal with empty array
        return idxs_arr.map(idx => idsMakeFromIndicies(ent_type, idx));
    }
    else { // depth === 2
        const idxs_arrs = idxs;
        return idxs_arrs.map(idxs_arr => idsMakeFromIndicies(ent_type, idxs_arr));
    }
}
exports.idsMakeFromIndicies = idsMakeFromIndicies;
function idsMake(ent_type_idxs) {
    const depth = getArrDepth(ent_type_idxs);
    if (depth === 1) {
        if (ent_type_idxs.length === 0) {
            return [];
        } //  deal with empty array
        const ent_type_idx = ent_type_idxs;
        return common_1.EEntTypeStr[ent_type_idx[0]] + ent_type_idx[1];
    }
    else if (depth === 2) {
        const ent_type_idxs_arr = ent_type_idxs;
        return ent_type_idxs_arr.map(ent_type_idx => idsMake(ent_type_idx));
    }
    else { // depth === 3
        const ent_type_idxs_arrs = ent_type_idxs;
        return ent_type_idxs_arrs.map(ent_type_idxs_arr => idsMake(ent_type_idxs_arr));
    }
}
exports.idsMake = idsMake;
function idsBreak(ids) {
    const depth = getArrDepth(ids);
    if (depth === 0) {
        const id = ids;
        if (typeof id !== 'string') {
            throw new Error('Value is not an entity ID.');
        }
        if (id.length < 3) {
            throw new Error('String is not an entity ID.');
        }
        const ent_type_str = id.slice(0, 2);
        const ent_type = common_1.EEntTypeStr[ent_type_str];
        if (ent_type === undefined) {
            throw new Error('String is not an entity ID.');
        }
        const index = Number(id.slice(2));
        return [ent_type, index];
    }
    else if (depth === 1) {
        const ids_arr = ids;
        return ids_arr.map(id => idsBreak(id));
    }
    else { // depth === 2
        const ids_arr = ids;
        return ids_arr.map(id => idsBreak(id));
    }
}
exports.idsBreak = idsBreak;
function idIndicies(ents_arr) {
    return ents_arr.map(ents => ents[1]);
}
exports.idIndicies = idIndicies;
// ============================================================================
function isPosi(ent_type) {
    return ent_type === common_1.EEntType.POSI;
}
exports.isPosi = isPosi;
function isVert(ent_type) {
    return ent_type === common_1.EEntType.VERT;
}
exports.isVert = isVert;
function isTri(ent_type) {
    return ent_type === common_1.EEntType.TRI;
}
exports.isTri = isTri;
function isEdge(ent_type) {
    return ent_type === common_1.EEntType.EDGE;
}
exports.isEdge = isEdge;
function isWire(ent_type) {
    return ent_type === common_1.EEntType.WIRE;
}
exports.isWire = isWire;
function isFace(ent_type) {
    return ent_type === common_1.EEntType.FACE;
}
exports.isFace = isFace;
function isPoint(ent_type) {
    return ent_type === common_1.EEntType.POINT;
}
exports.isPoint = isPoint;
function isPline(ent_type) {
    return ent_type === common_1.EEntType.PLINE;
}
exports.isPline = isPline;
function isPgon(ent_type) {
    return ent_type === common_1.EEntType.PGON;
}
exports.isPgon = isPgon;
function isColl(ent_type) {
    return ent_type === common_1.EEntType.COLL;
}
exports.isColl = isColl;
// more general test
function isTopo(ent_type) {
    if (ent_type === common_1.EEntType.VERT) {
        return true;
    }
    if (ent_type === common_1.EEntType.EDGE) {
        return true;
    }
    if (ent_type === common_1.EEntType.WIRE) {
        return true;
    }
    if (ent_type === common_1.EEntType.FACE) {
        return true;
    }
    return false;
}
exports.isTopo = isTopo;
function isObj(ent_type) {
    if (ent_type === common_1.EEntType.PGON) {
        return true;
    }
    if (ent_type === common_1.EEntType.PLINE) {
        return true;
    }
    if (ent_type === common_1.EEntType.POINT) {
        return true;
    }
    return false;
}
exports.isObj = isObj;
function isDim0(ent_type) {
    if (ent_type === common_1.EEntType.POSI) {
        return true;
    }
    if (ent_type === common_1.EEntType.VERT) {
        return true;
    }
    if (ent_type === common_1.EEntType.POINT) {
        return true;
    }
    return false;
}
exports.isDim0 = isDim0;
function isDim1(ent_type) {
    if (ent_type === common_1.EEntType.EDGE) {
        return true;
    }
    if (ent_type === common_1.EEntType.PLINE) {
        return true;
    }
    return false;
}
exports.isDim1 = isDim1;
function isDim2(ent_type) {
    if (ent_type === common_1.EEntType.FACE) {
        return true;
    }
    if (ent_type === common_1.EEntType.PGON) {
        return true;
    }
    return false;
}
exports.isDim2 = isDim2;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlicy9nZW8taW5mby9pZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHFDQUFtRTtBQUVuRSwrRUFBK0U7QUFDL0UsU0FBZ0IsV0FBVyxDQUFDLEdBQVE7SUFDaEMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ3BCLE9BQU8sQ0FBQyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNsQztJQUNELE9BQU8sQ0FBQyxDQUFDO0FBQ2IsQ0FBQztBQUxELGtDQUtDO0FBQ0QsU0FBZ0IsVUFBVSxDQUFDLEdBQVE7SUFDL0IsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRTtRQUNuQyxPQUFPLElBQUksQ0FBQztLQUNmO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDakIsQ0FBQztBQUxELGdDQUtDO0FBQ0QsK0VBQStFO0FBQy9FLFNBQWdCLG1CQUFtQixDQUFDLFFBQWtCLEVBQUUsSUFBZ0M7SUFDcEYsTUFBTSxLQUFLLEdBQVcsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hDLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRTtRQUNiLE1BQU0sR0FBRyxHQUFXLElBQWMsQ0FBQztRQUNuQyxPQUFPLG9CQUFXLENBQUMsUUFBb0IsQ0FBQyxHQUFHLEdBQVUsQ0FBQztLQUN6RDtTQUFNLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRTtRQUNwQixNQUFNLFFBQVEsR0FBYSxJQUFnQixDQUFDO1FBQzVDLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFBRSxPQUFPLEVBQUUsQ0FBQztTQUFFLENBQUMseUJBQXlCO1FBQ25FLE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBRSxHQUFHLENBQUMsRUFBRSxDQUFDLG1CQUFtQixD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