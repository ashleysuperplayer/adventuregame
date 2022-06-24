import { Item } from "./world.js";

export function getElementFromID(id: string): HTMLElement {
    let element = document.getElementById(id);
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

    toString() {
        return `${this.x},${this.y}`;
    }
}

// these can't be static or they're inaccessible during runtime
export class Debugger {
    constructor() {
    }

    createItem(itemName: string) {
        return [new Item(ITEMKINDSMAP[itemName])];
    }
}