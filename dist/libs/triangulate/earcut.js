"use strict";
/**
 * @author Mugen87 / https://github.com/Mugen87
 * Port from https://github.com/mapbox/earcut (v2.1.2)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const Earcut = {
    triangulate: function (data, holeIndices, dim) {
        dim = dim || 2;
        const hasHoles = holeIndices && holeIndices.length;
        const outerLen = hasHoles ? holeIndices[0] * dim : data.length;
        let outerNode = linkedList(data, 0, outerLen, dim, true);
        const triangles = [];
        if (!outerNode) {
            return triangles;
        }
        let minX, minY, maxX, maxY, x, y, invSize;
        if (hasHoles) {
            outerNode = eliminateHoles(data, holeIndices, outerNode, dim);
        }
        // if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox
        if (data.length > 80 * dim) {
            minX = maxX = data[0];
            minY = maxY = data[1];
            for (let i = dim; i < outerLen; i += dim) {
                x = data[i];
                y = data[i + 1];
                if (x < minX) {
                    minX = x;
                }
                if (y < minY) {
                    minY = y;
                }
                if (x > maxX) {
                    maxX = x;
                }
                if (y > maxY) {
                    maxY = y;
                }
            }
            // minX, minY and invSize are later used to transform coords into integers for z-order calculation
            invSize = Math.max(maxX - minX, maxY - minY);
            invSize = invSize !== 0 ? 1 / invSize : 0;
        }
        earcutLinked(outerNode, triangles, dim, minX, minY, invSize);
        return triangles;
    }
};
exports.Earcut = Earcut;
// create a circular doubly linked list from polygon points in the specified winding order
function linkedList(data, start, end, dim, clockwise) {
    let i, last;
    if (clockwise === (signedArea(data, start, end, dim) > 0)) {
        for (i = start; i < end; i += dim) {
            last = insertNode(i, data[i], data[i + 1], last);
        }
    }
    else {
        for (i = end - dim; i >= start; i -= dim) {
            last = insertNode(i, data[i], data[i + 1], last);
        }
    }
    if (last && equals(last, last.next)) {
        removeNode(last);
        last = last.next;
    }
    return last;
}
// eliminate colinear or duplicate points
function filterPoints(start, end) {
    if (!start) {
        return start;
    }
    if (!end) {
        end = start;
    }
    let p = start, again;
    do {
        again = false;
        if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
            removeNode(p);
            p = end = p.prev;
            if (p === p.next) {
                break;
            }
            again = true;
        }
        else {
            p = p.next;
        }
    } while (again || p !== end);
    return end;
}
// main ear slicing loop which triangulates a polygon (given as a linked list)
function earcutLinked(ear, triangles, dim, minX, minY, invSize, pass) {
    if (!ear) {
        return;
    }
    // interlink polygon nodes in z-order
    if (!pass && invSize) {
        indexCurve(ear, minX, minY, invSize);
    }
    let stop = ear, prev, next;
    // iterate through ears, slicing them one by one
    while (ear.prev !== ear.next) {
        prev = ear.prev;
        next = ear.next;
        if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {
            // cut off the triangle
            triangles.push(prev.i / dim);
            triangles.push(ear.i / dim);
            triangles.push(next.i / dim);
            removeNode(ear);
            // skipping the next vertice leads to less sliver triangles
            ear = next.next;
            stop = next.next;
            continue;
        }
        ear = next;
        // if we looped through the whole remaining polygon and can't find any more ears
        if (ear === stop) {
            // try filtering points and slicing again
            if (!pass) {
                earcutLinked(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);
                // if this didn't work, try curing all small self-intersections locally
            }
            else if (pass === 1) {
                ear = cureLocalIntersections(ear, triangles, dim);
                earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);
                // as a last resort, try splitting the remaining polygon into two
            }
            else if (pass === 2) {
                splitEarcut(ear, triangles, dim, minX, minY, invSize);
            }
            break;
        }
    }
}
// check whether a polygon node forms a valid ear with adjacent nodes
function isEar(ear) {
    const a = ear.prev, b = ear, c = ear.next;
    if (area(a, b, c) >= 0) {
        return false;
    } // reflex, can't be an ear
    // now make sure we don't have other points inside the potential ear
    let p = ear.next.next;
    while (p !== ear.prev) {
        if (pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) && area(p.prev, p, p.next) >= 0) {
            return false;
        }
        p = p.next;
    }
    return true;
}
function isEarHashed(ear, minX, minY, invSize) {
    const a = ear.prev, b = ear, c = ear.next;
    if (area(a, b, c) >= 0) {
        return false;
    } // reflex, can't be an ear
    // triangle bbox; min & max are calculated like this for speed
    const minTX = a.x < b.x ? (a.x < c.x ? a.x : c.x) : (b.x < c.x ? b.x : c.x), minTY = a.y < b.y ? (a.y < c.y ? a.y : c.y) : (b.y < c.y ? b.y : c.y), maxTX = a.x > b.x ? (a.x > c.x ? a.x : c.x) : (b.x > c.x ? b.x : c.x), maxTY = a.y > b.y ? (a.y > c.y ? a.y : c.y) : (b.y > c.y ? b.y : c.y);
    // z-order range for the current triangle bbox;
    const minZ = zOrder(minTX, minTY, minX, minY, invSize), maxZ = zOrder(maxTX, maxTY, minX, minY, invSize);
    // first look for points inside the triangle in increasing z-order
    let p = ear.nextZ;
    while (p && p.z <= maxZ) {
        if (p !== ear.prev && p !== ear.next &&
            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) {
            return false;
        }
        p = p.nextZ;
    }
    // then look for points in decreasing z-order
    p = ear.prevZ;
    while (p && p.z >= minZ) {
        if (p !== ear.prev && p !== ear.next &&
            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) {
            return false;
        }
        p = p.prevZ;
    }
    return true;
}
// go through all polygon nodes and cure small local self-intersections
function cureLocalIntersections(start, triangles, dim) {
    let p = start;
    do {
        const a = p.prev, b = p.next.next;
        if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {
            triangles.push(a.i / dim);
            triangles.push(p.i / dim);
            triangles.push(b.i / dim);
            // remove two nodes involved
            removeNode(p);
            removeNode(p.next);
            p = start = b;
        }
        p = p.next;
    } while (p !== start);
    return p;
}
// try splitting polygon into two and triangulate them independently
function splitEarcut(start, triangles, dim, minX, minY, invSize) {
    // look for a valid diagonal that divides the polygon into two
    let a = start;
    do {
        let b = a.next.next;
        while (b !== a.prev) {
            if (a.i !== b.i && isValidDiagonal(a, b)) {
                // split the polygon in two by the diagonal
                let c = splitPolygon(a, b);
                // filter colinear points around the cuts
                a = filterPoints(a, a.next);
                c = filterPoints(c, c.next);
                // run earcut on each half
                earcutLinked(a, triangles, dim, minX, minY, invSize);
                earcutLinked(c, triangles, dim, minX, minY, invSize);
                return;
            }
            b = b.next;
        }
        a = a.next;
    } while (a !== start);
}
// link every hole into the outer loop, producing a single-ring polygon without holes
function eliminateHoles(data, holeIndices, outerNode, dim) {
    let queue = [], i, len, start, end, list;
    for (i = 0, len = holeIndices.length; i < len; i++) {
        start = holeIndices[i] * dim;
        end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
        list = linkedList(data, start, end, dim, false);
        if (list === list.next) {
            list.steiner = true;
        }
        queue.push(getLeftmost(list));
    }
    queue.sort(compareX);
    // process holes from left to right
    for (i = 0; i < queue.length; i++) {
        eliminateHole(queue[i], outerNode);
        outerNode = filterPoints(outerNode, outerNode.next);
    }
    return outerNode;
}
function compareX(a, b) {
    return a.x - b.x;
}
// find a bridge between vertices that connects hole with an outer ring and and link it
function eliminateHole(hole, outerNode) {
    outerNode = findHoleBridge(hole, outerNode);
    if (outerNode) {
        const b = splitPolygon(outerNode, hole);
        filterPoints(b, b.next);
    }
}
// David Eberly's algorithm for finding a bridge between hole and outer polygon
function findHoleBridge(hole, outerNode) {
    let p = outerNode;
    const hx = hole.x;
    const hy = hole.y;
    let qx = -Infinity;
    let m;
    // find a segment intersected by a ray from the hole's leftmost point to the left;
    // segment's endpoint with lesser x will be potential connection point
    do {
        if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
            const x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
            if (x <= hx && x > qx) {
                qx = x;
                if (x === hx) {
                    if (hy === p.y) {
                        return p;
                    }
                    if (hy === p.next.y) {
                        return p.next;
                    }
                }
                m = p.x < p.next.x ? p : p.next;
            }
        }
        p = p.next;
    } while (p !== outerNode);
    if (!m) {
        return null;
    }
    if (hx === qx) {
        return m.prev;
    } // hole touches outer segment; pick lower endpoint
    // look for points inside the triangle of hole point, segment intersection and endpoint;
    // if there are no points found, we have a valid connection;
    // otherwise choose the point of the minimum angle with the ray as connection point
    const stop = m;
    const mx = m.x;
    const my = m.y;
    let tanMin = Infinity;
    let tan;
    p = m.next;
    while (p !== stop) {
        if (hx >= p.x && p.x >= mx && hx !== p.x &&
            pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {
            tan = Math.abs(hy - p.y) / (hx - p.x); // tangential
            if ((tan < tanMin || (tan === tanMin && p.x > m.x)) && locallyInside(p, hole)) {
                m = p;
                tanMin = tan;
            }
        }
        p = p.next;
    }
    return m;
}
// interlink polygon nodes in z-order
function indexCurve(start, minX, minY, invSize) {
    let p = start;
    do {
        if (p.z === null) {
            p.z = zOrder(p.x, p.y, minX, minY, invSize);
        }
        p.prevZ = p.prev;
        p.nextZ = p.next;
        p = p.next;
    } while (p !== start);
    p.prevZ.nextZ = null;
    p.prevZ = null;
    sortLinked(p);
}
// Simon Tatham's linked list merge sort algorithm
// http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html
function sortLinked(list) {
    let i, p, q, e, tail, numMerges, pSize, qSize, inSize = 1;
    do {
        p = list;
        list = null;
        tail = null;
        numMerges = 0;
        while (p) {
            numMerges++;
            q = p;
            pSize = 0;
            for (i = 0; i < inSize; i++) {
                pSize++;
                q = q.nextZ;
                if (!q) {
                    break;
                }
            }
            qSize = inSize;
            while (pSize > 0 || (qSize > 0 && q)) {
                if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) {
                    e = p;
                    p = p.nextZ;
                    pSize--;
                }
                else {
                    e = q;
                    q = q.nextZ;
                    qSize--;
                }
                if (tail) {
                    tail.nextZ = e;
                }
                else {
                    list = e;
                }
                e.prevZ = tail;
                tail = e;
            }
            p = q;
        }
        tail.nextZ = null;
        inSize *= 2;
    } while (numMerges > 1);
    return list;
}
// z-order of a point given coords and inverse of the longer side of data bbox
function zOrder(x, y, minX, minY, invSize) {
    // coords are transformed into non-negative 15-bit integer range
    x = 32767 * (x - minX) * invSize;
    y = 32767 * (y - minY) * invSize;
    x = (x | (x << 8)) & 0x00FF00FF;
    x = (x | (x << 4)) & 0x0F0F0F0F;
    x = (x | (x << 2)) & 0x33333333;
    x = (x | (x << 1)) & 0x55555555;
    y = (y | (y << 8)) & 0x00FF00FF;
    y = (y | (y << 4)) & 0x0F0F0F0F;
    y = (y | (y << 2)) & 0x33333333;
    y = (y | (y << 1)) & 0x55555555;
    return x | (y << 1);
}
// find the leftmost node of a polygon ring
function getLeftmost(start) {
    let p = start, leftmost = start;
    do {
        if (p.x < leftmost.x) {
            leftmost = p;
        }
        p = p.next;
    } while (p !== start);
    return leftmost;
}
// check if a point lies within a convex triangle
function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
    return (cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0 &&
        (ax - px) * (by - py) - (bx - px) * (ay - py) >= 0 &&
        (bx - px) * (cy - py) - (cx - px) * (by - py) >= 0;
}
// check if a diagonal between two polygon nodes is valid (lies in polygon interior)
function isValidDiagonal(a, b) {
    return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) &&
        locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b);
}
// signed area of a triangle
function area(p, q, r) {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
}
// check if two points are equal
function equals(p1, p2) {
    return p1.x === p2.x && p1.y === p2.y;
}
// check if two segments intersect
function intersects(p1, q1, p2, q2) {
    if ((equals(p1, q1) && equals(p2, q2)) ||
        (equals(p1, q2) && equals(p2, q1))) {
        return true;
    }
    return area(p1, q1, p2) > 0 !== area(p1, q1, q2) > 0 &&
        area(p2, q2, p1) > 0 !== area(p2, q2, q1) > 0;
}
// check if a polygon diagonal intersects any polygon segments
function intersectsPolygon(a, b) {
    let p = a;
    do {
        if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i &&
            intersects(p, p.next, a, b)) {
            return true;
        }
        p = p.next;
    } while (p !== a);
    return false;
}
// check if a polygon diagonal is locally inside the polygon
function locallyInside(a, b) {
    return area(a.prev, a, a.next) < 0 ?
        area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 :
        area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
}
// check if the middle point of a polygon diagonal is inside the polygon
function middleInside(a, b) {
    let p = a;
    let inside = false;
    const px = (a.x + b.x) / 2;
    const py = (a.y + b.y) / 2;
    do {
        if (((p.y > py) !== (p.next.y > py)) && p.next.y !== p.y &&
            (px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x)) {
            inside = !inside;
        }
        p = p.next;
    } while (p !== a);
    return inside;
}
// link two polygon vertices with a bridge; if the vertices belong to the same ring, it splits polygon into two;
// if one belongs to the outer ring and another to a hole, it merges it into a single ring
function splitPolygon(a, b) {
    const a2 = new Node(a.i, a.x, a.y), b2 = new Node(b.i, b.x, b.y), an = a.next, bp = b.prev;
    a.next = b;
    b.prev = a;
    a2.next = an;
    an.prev = a2;
    b2.next = a2;
    a2.prev = b2;
    bp.next = b2;
    b2.prev = bp;
    return b2;
}
// create a node and optionally link it with previous one (in a circular doubly linked list)
function insertNode(i, x, y, last) {
    const p = new Node(i, x, y);
    if (!last) {
        p.prev = p;
        p.next = p;
    }
    else {
        p.next = last.next;
        p.prev = last;
        last.next.prev = p;
        last.next = p;
    }
    return p;
}
function removeNode(p) {
    p.next.prev = p.prev;
    p.prev.next = p.next;
    if (p.prevZ) {
        p.prevZ.nextZ = p.nextZ;
    }
    if (p.nextZ) {
        p.nextZ.prevZ = p.prevZ;
    }
}
function Node(i, x, y) {
    // vertice index in coordinates array
    this.i = i;
    // vertex coordinates
    this.x = x;
    this.y = y;
    // previous and next vertice nodes in a polygon ring
    this.prev = null;
    this.next = null;
    // z-order curve value
    this.z = null;
    // previous and next nodes in z-order
    this.prevZ = null;
    this.nextZ = null;
    // indicates whether this is a steiner point
    this.steiner = false;
}
function signedArea(data, start, end, dim) {
    let sum = 0;
    for (let i = start, j = end - dim; i < end; i += dim) {
        sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
        j = i;
    }
    return sum;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWFyY3V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYnMvdHJpYW5ndWxhdGUvZWFyY3V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7O0FBRUgsTUFBTSxNQUFNLEdBQUc7SUFFWCxXQUFXLEVBQUUsVUFBVyxJQUFJLEVBQUUsV0FBWSxFQUFFLEdBQUk7UUFFNUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFFZixNQUFNLFFBQVEsR0FBRyxXQUFXLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQztRQUNuRCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxDQUFDLENBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDakUsSUFBSSxTQUFTLEdBQUcsVUFBVSxDQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUUsQ0FBQztRQUMzRCxNQUFNLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFFckIsSUFBSyxDQUFFLFNBQVMsRUFBRztZQUFFLE9BQU8sU0FBUyxDQUFDO1NBQUU7UUFFeEMsSUFBSSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUM7UUFFMUMsSUFBSyxRQUFRLEVBQUc7WUFBRSxTQUFTLEdBQUcsY0FBYyxDQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLEdBQUcsQ0FBRSxDQUFDO1NBQUU7UUFFcEYsNkZBQTZGO1FBRTdGLElBQUssSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLEdBQUcsR0FBRyxFQUFHO1lBRTFCLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFFLENBQUMsQ0FBRSxDQUFDO1lBQ3hCLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFFLENBQUMsQ0FB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QUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztJQUVqQixJQUFLLElBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxJQUFJLENBQUMsRUFBRztRQUFFLE9BQU8sS0FBSyxDQUFDO0tBQUUsQ0FBQywwQkFBMEI7SUFFeEUsOERBQThEO0lBRTlELE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsRUFDM0UsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsRUFDekUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsRUFDekUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztJQUU5RSwrQ0FBK0M7SUFFL0MsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUUsRUFDcEQsSUFBSSxHQUFHLE1BQU0sQ0FBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFFLENBQUM7SUFFdkQsa0VBQWtFO0lBRWxFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUM7SUFFbEIsT0FBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLEVBQUc7UUFFdkIsSUFBSyxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUk7WUFDN0IsZUFBZSxDQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRTtZQUN6RCxJQUFJLENBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUMsRUFBRztZQUFFLE9BQU8sS0FBSyxDQUFDO1NBQUU7UUFDMUQsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7S0FFZjtJQUVELDZDQUE2QztJQUU3QyxDQUFDLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQztJQUVkLE9BQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxFQUFHO1FBRXZCLElBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJO1lBQzdCLGVBQWUsQ0FBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUU7WUFDekQsSUFBSSxDQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFDLEVBQUc7WUFBRSxPQUFPLEtBQUssQ0FBQztTQUFFO1FBRTFELENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDO0tBRWY7SUFFRCxPQUFPLElBQUksQ0FBQztBQUVoQixDQUFDO0FBRUQsdUVBQXVFO0FBRXZFLFNBQVMsc0JBQXNCLENBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxHQUFHO0lBRWxELElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztJQUVkLEdBQUc7UUFFQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztRQUVsQyxJQUFLLENBQUUsTUFBTSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsSUFBSSxVQUFVLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBRSxJQUFJLGFBQWEsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLElBQUksYUFBYSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsRUFBRztZQUV2RyxTQUFTLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFFLENBQUM7WUFDNUIsU0FBUyxDQUFDLElBQUksQ0FBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBRSxDQUFDO1lBQzVCLFNBQVMsQ0FBQyxJQUFJLENBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUUsQ0FBQztZQUU1Qiw0QkFBNEI7WUFFNUIsVUFBVSxDQUFFLENBQUMsQ0FBRSxDQUFDO1lBQ2hCLFVBQVUsQ0FBRSxDQUFDLENBQUMsSUFBSSxDQUFFLENBQUM7WUFFckIsQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7U0FFakI7UUFFRCxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztLQUVkLFFBQVMsQ0FBQyxLQUFLLEtBQUssRUFBRztJQUV4QixPQUFPLENBQUMsQ0FBQztBQUViLENBQUM7QUFFRCxvRUFBb0U7QUFFcEUsU0FBUyxXQUFXLENBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPO0lBRTVELDhEQUE4RDtJQUU5RCxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUM7SUFFZCxHQUFHO1FBRUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7UUFFcEIsT0FBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRztZQUVuQixJQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxlQUFlLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxFQUFHO2dCQUUxQywyQ0FBMkM7Z0JBRTNDLElBQUksQ0FBQyxHQUFHLFlBQVksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7Z0JBRTdCLHlDQUF5QztnQkFFekMsQ0FBQyxHQUFHLFlBQVksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBRSxDQUFDO2dCQUM5QixDQUFDLEdBQUcsWUFBWSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFFLENBQUM7Z0JBRTlCLDBCQUEwQjtnQkFFMUIsWUFBWSxDQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFFLENBQUM7Z0JBQ3ZELFlBQVksQ0FBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBRSxDQUFDO2dCQUN2RCxPQUFPO2FBRVY7WUFFRCxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztTQUVkO1FBRUQsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7S0FFZCxRQUFTLENBQUMsS0FBSyxLQUFLLEVBQUc7QUFFNUIsQ0FBQztBQUVELHFGQUFxRjtBQUVyRixTQUFTLGNBQWMsQ0FBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxHQUFHO0lBRXRELElBQUksS0FBSyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDO0lBRXpDLEtBQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRyxFQUFHO1FBRW5ELEtBQUssR0FBRyxXQUFXLENBQUUsQ0FBQyxDQUFFLEdBQUcsR0FBRyxDQUFDO1FBQy9CLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFFLENBQUMsR0FBRyxDQUFDLENBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDN0QsSUFBSSxHQUFHLFVBQVUsQ0FBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFFLENBQUM7UUFDbEQsSUFBSyxJQUFJLEtBQUssSUFBSSxDQUFDLElBQUksRUFBRztZQUFFLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1NBQUU7UUFDbEQsS0FBSyxDQUFDLElBQUksQ0FBRSxXQUFXLENBQUUsSUFBSSxDQUFFLENBQUUsQ0FBQztLQUVyQztJQUVELEtBQUssQ0FBQyxJQUFJLENBQUUsUUFBUSxDQUFFLENBQUM7SUFFdkIsbUNBQW1DO0lBRW5DLEtBQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUcsRUFBRztRQUVsQyxhQUFhLENBQUUsS0FBSyxDQUFFLENBQUMsQ0FBRSxFQUFFLFNBQVMsQ0FBRSxDQUFDO1FBQ3ZDLFNBQVMsR0FBRyxZQUFZLENBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUUsQ0FBQztLQUV6RDtJQUVELE9BQU8sU0FBUyxDQUFDO0FBRXJCLENBQUM7QUFFRCxTQUFTLFFBQVEsQ0FBRSxDQUFDLEVBQUUsQ0FBQztJQUVuQixPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUVyQixDQUFDO0FBRUQsdUZBQXVGO0FBRXZGLFNBQVMsYUFBYSxDQUFFLElBQUksRUFBRSxTQUFTO0lBRW5DLFNBQVMsR0FBRyxjQUFjLENBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBRSxDQUFDO0lBRTlDLElBQUssU0FBUyxFQUFHO1FBRWIsTUFBTSxDQUFDLEdBQUcsWUFBWSxDQUFFLFNBQVMsRUFBRSxJQUFJLENBQUUsQ0FBQztRQUUxQyxZQUFZLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUUsQ0FBQztLQUU3QjtBQUVMLENBQUM7QUFFRCwrRUFBK0U7QUFFL0UsU0FBUyxjQUFjLENBQUUsSUFBSSxFQUFFLFNBQVM7SUFFcEMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDO0lBQ2xCLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDbEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNsQixJQUFJLEVBQUUsR0FBRyxDQUFFLFFBQVEsQ0FBQztJQUNwQixJQUFJLENBQUMsQ0FBQztJQUVOLGtGQUFrRjtJQUNsRixzRUFBc0U7SUFFdEUsR0FBRztRQUVDLElBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUc7WUFFbkQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFFLEdBQUcsQ0FBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFFLEdBQUcsQ0FBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7WUFFdkUsSUFBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUc7Z0JBRXJCLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBRVAsSUFBSyxDQUFDLEtBQUssRUFBRSxFQUFHO29CQUVaLElBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUc7d0JBQUUsT0FBTyxDQUFDLENBQUM7cUJBQUU7b0JBQy9CLElBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFHO3dCQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQztxQkFBRTtpQkFFNUM7Z0JBRUQsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQzthQUVuQztTQUVKO1FBRUQsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7S0FFZCxRQUFTLENBQUMsS0FBSyxTQUFTLEVBQUc7SUFFNUIsSUFBSyxDQUFFLENBQUMsRUFBRztRQUFFLE9BQU8sSUFBSSxDQUFDO0tBQUU7SUFFM0IsSUFBSyxFQUFFLEtBQUssRUFBRSxFQUFHO1FBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDO0tBQUUsQ0FBQyxrREFBa0Q7SUFFdEYsd0ZBQXdGO0lBQ3hGLDREQUE0RDtJQUM1RCxtRkFBbUY7SUFFbkYsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ2YsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNmLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDZixJQUFJLE1BQU0sR0FBRyxRQUFRLENBQUM7SUFDdEIsSUFBSSxHQUFHLENBQUM7SUFFUixDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUVYLE9BQVEsQ0FBQyxLQUFLLElBQUksRUFBRztRQUVqQixJQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN6QixlQUFlLENBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxFQUFHO1lBRWhHLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFFLEdBQUcsQ0FBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLENBQUMsYUFBYTtZQUV4RCxJQUFLLENBQUUsR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFFLEdBQUcsS0FBSyxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUUsSUFBSSxhQUFhLENBQUUsQ0FBQyxFQUFFLElBQUksQ0FBRSxFQUFHO2dCQUVuRixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNOLE1BQU0sR0FBRyxHQUFHLENBQUM7YUFFaEI7U0FFSjtRQUVELENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO0tBRWQ7SUFFRCxPQUFPLENBQUMsQ0FBQztBQUViLENBQUM7QUFFRCxxQ0FBcUM7QUFFckMsU0FBUyxVQUFVLENBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTztJQUUzQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUM7SUFFZCxHQUFHO1FBRUMsSUFBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRztZQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBRSxDQUFDO1NBQUU7UUFDdEUsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNqQixDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztLQUVkLFFBQVMsQ0FBQyxLQUFLLEtBQUssRUFBRztJQUV4QixDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7SUFDckIsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7SUFFZixVQUFVLENBQUUsQ0FBQyxDQUFFLENBQUM7QUFFcEIsQ0FBQztBQUVELGtEQUFrRDtBQUNsRCx1RUFBdUU7QUFFdkUsU0FBUyxVQUFVLENBQUUsSUFBSTtJQUVyQixJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUUxRCxHQUFHO1FBRUMsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUNULElBQUksR0FBRyxJQUFJLENBQUM7UUFDWixJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ1osU0FBUyxHQUFHLENBQUMsQ0FBQztRQUVkLE9BQVEsQ0FBQyxFQUFHO1lBRVIsU0FBUyxFQUFHLENBQUM7WUFDYixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ04sS0FBSyxHQUFHLENBQUMsQ0FBQztZQUVWLEtBQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRyxFQUFHO2dCQUU1QixLQUFLLEVBQUcsQ0FBQztnQkFDVCxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDWixJQUFLLENBQUUsQ0FBQyxFQUFHO29CQUFFLE1BQU07aUJBQUU7YUFFeEI7WUFFRCxLQUFLLEdBQUcsTUFBTSxDQUFDO1lBRWYsT0FBUSxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUUsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUUsRUFBRztnQkFFdEMsSUFBSyxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUUsS0FBSyxLQUFLLENBQUMsSUFBSSxDQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUUsRUFBRztvQkFFdkQsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDTixDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQztvQkFDWixLQUFLLEVBQUcsQ0FBQztpQkFFWjtxQkFBTTtvQkFFSCxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNOLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDO29CQUNaLEtBQUssRUFBRyxDQUFDO2lCQUVaO2dCQUVELElBQUssSUFBSSxFQUFHO29CQUFFLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO2lCQUFFO3FCQUFNO29CQUFFLElBQUksR0FBRyxDQUFDLENBQUM7aUJBQUU7Z0JBRWxELENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO2dCQUNmLElBQUksR0FBRyxDQUFDLENBQUM7YUFFWjtZQUVELENBQUMsR0FBRyxDQUFDLENBQUM7U0FFVDtRQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLE1BQU0sSUFBSSxDQUFDLENBQUM7S0FFZixRQUFTLFNBQVMsR0FBRyxDQUFDLEVBQUc7SUFFMUIsT0FBTyxJQUFJLENBQUM7QUFFaEIsQ0FBQztBQUVELDhFQUE4RTtBQUU5RSxTQUFTLE1BQU0sQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTztJQUV0QyxnRUFBZ0U7SUFFaEUsQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFFLENBQUMsR0FBRyxJQUFJLENBQUUsR0FBRyxPQUFPLENBQUM7SUFDbkMsQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFFLENBQUMsR0FBRyxJQUFJLENBQUUsR0FBRyxPQUFPLENBQUM7SUFFbkMsQ0FBQyxHQUFHLENBQUUsQ0FBQyxHQUFHLENBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBRSxDQUFFLEdBQUcsVUFBVSxDQUFDO0lBQ3BDLENBQUMsR0FBRyxDQUFFLENBQUMsR0FBRyxDQUFFLENBQUMsSUFBSSxDQUFDLENBQUUsQ0FBRSxHQUFHLFVBQVUsQ0FBQztJQUNwQyxDQUFDLEdBQUcsQ0FBRSxDQUFDLEdBQUcsQ0FBRSxDQUFDLElBQUksQ0FBQyxDQUFFLENBQUUsR0FBRyxVQUFVLENBQUM7SUFDcEMsQ0FBQyxHQUFHLENBQUUsQ0FBQyxHQUFHLENBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBRSxDQUFFLEdBQUcsVUFBVSxDQUFDO0lBRXBDLENBQUMsR0FBRyxDQUFFLENBQUMsR0FBRyxDQUFFLENBQUMsSUFBSSxDQUFDLENBQUUsQ0FBRSxHQUFHLFVBQVUsQ0FBQztJQUNwQyxDQUFDLEdBQUcsQ0FBRSxDQUFDLEdBQUcsQ0FBRSxDQUFDLElBQUksQ0FBQyxDQUFFLENBQUUsR0FBRyxVQUFVLENBQUM7SUFDcEMsQ0FBQyxHQUFHLENBQUUsQ0FBQyxHQUFHLENBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBRSxDQUFFLEdBQUcsVUFBVSxDQUFDO0lBQ3BDLENBQUMsR0FBRyxDQUFFLENBQUMsR0FBRyxDQUFFLENBQUMsSUFBSSxDQUFDLENBQUUsQ0FBRSxHQUFHLFVBQVUsQ0FBQztJQUVwQyxPQUFPLENBQUMsR0FBRyxDQUFFLENBQUMsSUFBSSxDQUFDLENBQUUsQ0FBQztBQUUxQixDQUFDO0FBRUQsMkNBQTJDO0FBRTNDLFNBQVMsV0FBVyxDQUFFLEtBQUs7SUFFdkIsSUFBSSxDQUFDLEdBQUcsS0FBSyxFQUFFLFFBQVEsR0FBRyxLQUFLLENBQUM7SUFFaEMsR0FBRztRQUVDLElBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxFQUFHO1lBQUUsUUFBUSxHQUFHLENBQUMsQ0FBQztTQUFFO1FBQ3pDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO0tBRWQsUUFBUyxDQUFDLEtBQUssS0FBSyxFQUFHO0lBRXhCLE9BQU8sUUFBUSxDQUFDO0FBRXBCLENBQUM7QUFFRCxpREFBaUQ7QUFFakQsU0FBUyxlQUFlLENBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7SUFFcEQsT0FBTyxDQUFFLEVBQUUsR0FBRyxFQUFFLENBQUUsR0FBRyxDQUFFLEVBQUUsR0FBRyxFQUFFLENBQUUsR0FBRyxDQUFFLEVBQUUsR0FBRyxFQUFFLENBQUUsR0FBRyxDQUFFLEVBQUUsR0FBRyxFQUFFLENBQUUsSUFBSSxDQUFDO1FBQ2hFLENBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBRSxJQUFJLENBQUM7UUFDMUQsQ0FBRSxFQUFFLEdBQUcsRUFBRSxDQUFFLEdBQUcsQ0FBRSxFQUFFLEdBQUcsRUFBRSxDQUFFLEdBQUcsQ0FBRSxFQUFFLEdBQUcsRUFBRSxDQUFFLEdBQUcsQ0FBRSxFQUFFLEdBQUcsRUFBRSxDQUFFLElBQUksQ0FBQyxDQUFDO0FBRWhFLENBQUM7QUFFRCxvRkFBb0Y7QUFFcEYsU0FBUyxlQUFlLENBQUUsQ0FBQyxFQUFFLENBQUM7SUFFMUIsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFO1FBQ3RFLGFBQWEsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLElBQUksYUFBYSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsSUFBSSxZQUFZLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBRS9FLENBQUM7QUFFRCw0QkFBNEI7QUFFNUIsU0FBUyxJQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0lBRWxCLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUUsR0FBRyxDQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBRSxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFFLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztBQUV6RSxDQUFDO0FBRUQsZ0NBQWdDO0FBRWhDLFNBQVMsTUFBTSxDQUFFLEVBQUUsRUFBRSxFQUFFO0lBRW5CLE9BQU8sRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztBQUUxQyxDQUFDO0FBRUQsa0NBQWtDO0FBRWxDLFNBQVMsVUFBVSxDQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7SUFFL0IsSUFBSyxDQUFFLE1BQU0sQ0FBRSxFQUFFLEVBQUUsRUFBRSxDQUFFLElBQUksTUFBTSxDQUFFLEVBQUUsRUFBRSxFQUFFLENBQUUsQ0FBRTtRQUNyQyxDQUFFLE1BQU0sQ0FBRSxFQUFFLEVBQUUsRUFBRSxDQUFFLElBQUksTUFBTSxDQUFFLEVBQUUsRUFBRSxFQUFFLENBQUUsQ0FBRSxFQUFHO1FBQUUsT0FBTyxJQUFJLENBQUM7S0FBRTtJQUVuRSxPQUFPLElBQUksQ0FBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxHQUFHLENBQUMsS0FBSyxJQUFJLENBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUUsR0FBRyxDQUFDO1FBQzNDLElBQUksQ0FBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxHQUFHLENBQUMsS0FBSyxJQUFJLENBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUUsR0FBRyxDQUFDLENBQUM7QUFFbkUsQ0FBQztBQUVELDhEQUE4RDtBQUU5RCxTQUFTLGlCQUFpQixDQUFFLENBQUMsRUFBRSxDQUFDO0lBRTVCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVWLEdBQUc7UUFFQyxJQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN2RCxVQUFVLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxFQUFHO1lBRTVDLE9BQU8sSUFBSSxDQUFDO1NBRWY7UUFFRCxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztLQUVkLFFBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRztJQUVwQixPQUFPLEtBQUssQ0FBQztBQUVqQixDQUFDO0FBRUQsNERBQTREO0FBRTVELFNBQVMsYUFBYSxDQUFFLENBQUMsRUFBRSxDQUFDO0lBRXhCLE9BQU8sSUFBSSxDQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN4RCxJQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFFLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUUsR0FBRyxDQUFDLENBQUM7QUFFN0QsQ0FBQztBQUVELHdFQUF3RTtBQUV4RSxTQUFTLFlBQVksQ0FBRSxDQUFDLEVBQUUsQ0FBQztJQUV2QixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDVixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7SUFDbkIsTUFBTSxFQUFFLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUUsR0FBRyxDQUFDLENBQUM7SUFDN0IsTUFBTSxFQUFFLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUUsR0FBRyxDQUFDLENBQUM7SUFFN0IsR0FBRztRQUVDLElBQUssQ0FBRSxDQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFFLEtBQUssQ0FBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUUsQ0FBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQy9DLENBQUUsRUFBRSxHQUFHLENBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBRSxHQUFHLENBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUUsR0FBRyxDQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFFLEVBQUc7WUFFcEYsTUFBTSxHQUFHLENBQUUsTUFBTSxDQUFDO1NBRXJCO1FBRUQsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7S0FFZCxRQUFTLENBQUMsS0FBSyxDQUFDLEVBQUc7SUFFcEIsT0FBTyxNQUFNLENBQUM7QUFFbEIsQ0FBQztBQUVELGdIQUFnSDtBQUNoSCwwRkFBMEY7QUFFMUYsU0FBUyxZQUFZLENBQUUsQ0FBQyxFQUFFLENBQUM7SUFFdkIsTUFBTSxFQUFFLEdBQUcsSUFBSSxJQUFJLENBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsRUFDaEMsRUFBRSxHQUFHLElBQUksSUFBSSxDQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFFLEVBQzlCLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUNYLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBRWhCLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ1gsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7SUFFWCxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNiLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBRWIsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7SUFDYixFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUViLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ2IsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7SUFFYixPQUFPLEVBQUUsQ0FBQztBQUVkLENBQUM7QUFFRCw0RkFBNEY7QUFFNUYsU0FBUyxVQUFVLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSTtJQUU5QixNQUFNLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0lBRTlCLElBQUssQ0FBRSxJQUFJLEVBQUc7UUFFVixDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUNYLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0tBRWQ7U0FBTTtRQUVILENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUNuQixDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztLQUVqQjtJQUVELE9BQU8sQ0FBQyxDQUFDO0FBRWIsQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFFLENBQUM7SUFFbEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNyQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBRXJCLElBQUssQ0FBQyxDQUFDLEtBQUssRUFBRztRQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7S0FBRTtJQUMzQyxJQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUc7UUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDO0tBQUU7QUFFL0MsQ0FBQztBQUVELFNBQVMsSUFBSSxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUVsQixxQ0FBcUM7SUFDckMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFWCxxQkFBcUI7SUFDckIsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDWCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVYLG9EQUFvRDtJQUNwRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUNqQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUVqQixzQkFBc0I7SUFDdEIsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7SUFFZCxxQ0FBcUM7SUFDckMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7SUFDbEIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7SUFFbEIsNENBQTRDO0lBQzVDLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBRXpCLENBQUM7QUFFRCxTQUFTLFVBQVUsQ0FBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHO0lBRXRDLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztJQUVaLEtBQU0sSUFBSSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRztRQUVwRCxHQUFHLElBQUksQ0FBRSxJQUFJLENBQUUsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFFLENBQUMsQ0FBRSxDQUFFLEdBQUcsQ0FBRSxJQUFJLENBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBRSxDQUFDLEdBQUcsQ0FBQyxDQUFFLENBQUUsQ0FBQztRQUNyRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBRVQ7SUFFRCxPQUFPLEdBQUcsQ0FBQztBQUVmLENBQUMifQ==