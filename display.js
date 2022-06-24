import { throwExpression, Vector2 } from "./util.js";
export function updateDisplay() {
    for (let y = 0; y < VIEWPORT.size.y; ++y) {
        for (let x = 0; x < VIEWPORT.size.x; ++x) {
            displayCell(x, y);
        }
    }
}
function displayCell(x, y) {
    const displayElementCoords = `${x},${y}`;
    const cellCoords = `${VIEWPORT.Disp2Real(x, y)}`;
    // console.log(`displayCell: ${displayElementCoords},${cellCoords}`);
    let displayElement = DISPLAYELEMENTSDICT[displayElementCoords] ?? throwExpression(`invalid display coords ${displayElementCoords}`);
    let itemsElement = ITEMSELEMENTSDICT[displayElementCoords] ?? throwExpression(`invalid item element coords ${displayElementCoords}`);
    let lightElement = LIGHTELEMENTSDICT[displayElementCoords] ?? throwExpression(`invalid light element coords ${displayElementCoords}`);
    let cell = CELLMAP[cellCoords] ?? throwExpression(`invalid cell coords ${cellCoords}`);
    let itemsDisplay = "";
    displayElement.innerHTML = "";
    for (let item of cell.inventory.items) {
        itemsDisplay += item.symbol;
    }
    if (cell.mobs.length > 0) {
        const symbol = cell.mobs.at(-1)?.symbol;
        if (symbol) {
            displayElement.innerHTML = symbol;
        }
    }
    if (cell.terrain[0]) {
        displayElement.innerHTML = cell.terrain[0].symbol;
    }
    itemsElement.innerHTML = itemsDisplay;
    lightElement.style.mixBlendMode = "multiply";
    lightElement.style.backgroundColor = `${cell.lightLevel}`;
    displayElement.style.backgroundColor = `${cell.color}`; // band aid
}
export let DISPLAYELEMENTSDICT = {};
export let LIGHTELEMENTSDICT = {};
export let ITEMSELEMENTSDICT = {};
export class Viewport {
    pos; // map coords of cell to be drawn at centre (probably pos=player.pos)
    size; // width and height of screen (odd!!!)
    constructor(x, y, w, h) {
        this.pos = new Vector2(x, y);
        this.size = new Vector2(w, h);
    }
    Disp2Real(x, y) {
        return new Vector2(x - (this.size.x - 1) / 2 + this.pos.x, y - (this.size.y - 1) / 2 + this.pos.y);
    }
    Real2Disp(x, y) {
        return new Vector2(x + (this.size.x - 1) / 2 - this.pos.x, y + (this.size.y - 1) / 2 - this.pos.y);
    }
}
//# sourceMappingURL=display.js.map