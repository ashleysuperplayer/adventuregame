import { Clothing, ClothingKind, Item } from "./world.js";

let fart = 0;

export function getElementFromID(id: string): HTMLElement {
    let element = document.getElementById(id);

    // console.log(randomGradient(fart, fart++));

    if (element) {
        return element;
    }
    else {
        throw new Error(`invalid ID: ${id}`);
    }

}
// throw error when can't set variable
export function throwExpression(errorMessage: string): never {
    throw new Error(errorMessage);
}

// function for faster debugging
function ZZ(a: number, b: number) {
    return a === 0 && b === 0; // i just hate writing this line out all the time it reminds me i'm still using js lol
}

export function clamp(x: number, min: number, max: number) {
    if (max < min) return x;
    else return Math.max(min, Math.min(max, x));
}

// creates a grid of even height and width.
export function createGrid(parentID: string, sideLength: number, cellClass: string, elementsDict: { [key: string]: HTMLElement}) {
    const parent: HTMLElement = document.getElementById(parentID) ?? throwExpression("parentID not found");

    for (let y = sideLength - 1; y > -1; y--) {
        for (let x = 0; x < sideLength; x++) {
            let cell = document.createElement("div");

            cell.setAttribute("id", `${parentID}${x},${y}`);
            cell.classList.add(cellClass);

            elementsDict[`${x},${y}`] = cell;

            parent.appendChild(cell);
        }
    }

    let gridAutoColumn = "auto";

    for (let i = 1; i < sideLength; i++) {
        gridAutoColumn += " auto";
    }

    parent.style.gridTemplateColumns = gridAutoColumn;
}

export class Vector2 {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(v: Vector2) {
        this.x += v.x;
        this.y += v.y;
    }

    scalarmult(s: number) {
        this.x *= s;
        this.y *= s;
    }

    lengthsq() {
        return this.x*this.x + this.y*this.y;
    }

    dot(v: Vector2) {
        return this.x*v.x + this.y*v.y;
    }

    static Add(v1: Vector2, v2: Vector2) {
        return new Vector2(v1.x + v2.x, v1.y + v2.y);
    }

    toString() {
        return `${this.x},${this.y}`;
    }
}

function getElementFromPoint(x: number, y: number): Element {
    let element = document.elementFromPoint(x, y);
    if (element) {
        return element;
    }
    throw new Error(`no element at point: ${x},${y}`);
}

function sumObjectsByKey(...objs: any) {
    return objs.reduce((a: any, b: any) => {
    for (let k in b) {
        if (b.hasOwnProperty(k))
            a[k] = (a[k] || 0) + b[k];
    }
    return a;
    }, {});
}

// these can't be static or they're inaccessible at runtime
export class Debugger {
    constructor() {
    }

    createItem(itemName: string): Item[] {
        return [new Item(ITEMKINDSMAP[itemName])]; // TODO gut the way items are generated
    }

    createClothing(clothingName: string): Clothing[] {
        return [new Clothing(ITEMKINDSMAP[clothingName] as ClothingKind)];
    }

    perlin(p: Vector3) {
        return perlin3d(p);
    }

    // try and click all the points on the map
    test_clickAllPointsOnMap() {
        for (let pX = 0; pX < +getElementFromID("map").style.width; pX++) {
            for (let pY = 0; pY < +getElementFromID("map").style.height; pY++) {
                (getElementFromPoint(pX, pY) as HTMLElement).click();
            }
        }
        return true;
    }
}

interface Vector3 {
    x: number,
    y: number,
    z: number
}

export function gramsToKG(grams: number) {
    return grams > 1000 ? `${(grams / 1000).toFixed(1)}kg` : `${grams.toFixed(1)}g`;
}

// rewrite, stolen from wikipedia
export function randomGradient(ix: number, iy: number, iz: number): Vector3 {
    // No precomputed gradients mean this works for any number of grid coordinates
    const w = 32;
    const s = w / 2; // rotation width
    let a = ix, b = iy;

    a *= 3284157443; b ^= a << s | a >> w-s;
    b *= 1911520717; a ^= b << s | b >> w-s;
    a *= 2048419325 * iz; // hehe
    let r1 = a * (Math.PI / (1 << 31)); // in [0, 2*Pi]
    let r2 = r1 + 348474384;
    // console.log("x", Math.cos(r1), "y", Math.sin(r1)*Math.cos(r2), "z", Math.sin(r1)*Math.sin(r2));
    return {x: Math.cos(r1), y: Math.sin(r1)*Math.cos(r2), z: Math.sin(r1)*Math.sin(r2)};
}

function dotOffsetGridVector(corner: Vector3, p: Vector3) {
    let offX = p.x - corner.x;
    let offY = p.y - corner.y;
    let offZ = p.z - corner.z;

    let gridVector = randomGradient(corner.x, corner.y, corner.z);

    // console.log("dot product", offX * gridVector.x + offY * gridVector.y + offZ * gridVector.z)
    return offX * gridVector.x + offY * gridVector.y + offZ * gridVector.z;
}

function interpolate(l: number, r: number, w: number) {
    return l*(1 - w) + r*w;
}

export function perlin3d(p: Vector3) {
    let fX = Math.floor(p.x); // add 1
    let fY = Math.floor(p.y);
    let fZ = Math.floor(p.z);

    let c1 = dotOffsetGridVector({x: fX    , y: fY    , z: fZ    }, p);
    let c2 = dotOffsetGridVector({x: fX    , y: fY    , z: fZ + 1}, p);
    let c12 = interpolate(c1, c2, p.z - fZ);

    let c3 = dotOffsetGridVector({x: fX    , y: fY + 1, z: fZ    }, p);
    let c4 = dotOffsetGridVector({x: fX    , y: fY + 1, z: fZ + 1}, p);
    let c34 = interpolate(c3, c4, p.z - fZ);

    let c5 = dotOffsetGridVector({x: fX + 1, y: fY    , z: fZ    }, p);
    let c6 = dotOffsetGridVector({x: fX + 1, y: fY    , z: fZ + 1}, p);
    let c56 = interpolate(c5, c6, p.z - fZ);

    let c7 = dotOffsetGridVector({x: fX + 1, y: fY + 1, z: fZ    }, p);
    let c8 = dotOffsetGridVector({x: fX + 1, y: fY + 1, z: fZ + 1}, p);
    let c78 = interpolate(c7, c8, p.z - fZ);

    let c1234 = interpolate(c12, c34, p.y - fY);
    let c5678 = interpolate(c56, c78, p.y - fY);

    return interpolate(c1234, c5678, p.x - fX);
}