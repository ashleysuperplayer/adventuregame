import { updateLighting } from "./light.js";
import { createGrid, getElementFromID, throwExpression } from "./util.js";
import { Inventory, updateInventory } from "./inventory.js";
import { CtxParentMenu_Cell, setCTX, clearCTX } from "./menu.js";
import { DISPLAYELEMENTSDICT, LIGHTELEMENTSDICT, ITEMSELEMENTSDICT, updateDisplay } from "./display.js";
export function getMapCellAtDisplayCell(x, y) {
    const newX = x - 16 + PLAYER.x;
    const newY = y - 16 + PLAYER.y;
    return CELLMAP[`${newX},${newY}`];
}
export function getSquareDistanceBetweenCells(cell1, cell2) {
    return getSquareDistanceBetweenCoords(cell1.x, cell1.y, cell2.x, cell2.y);
}
// square root to get actual distance
function getSquareDistanceBetweenCoords(x1, y1, x2, y2) {
    return (x1 - x2) ** 2 + (y1 - y2) ** 2;
}
// placeholder until i get better at maths lol
// returns light level from 0 to 200
export function timeToLight(time) {
    time = Math.floor(time);
    return (Math.cos(2 * Math.PI * time / MINSPERDAY / 10) + 1) * 200 * 0.5; // super fast for debug
    // return Math.cos(time / (MINSPERDAY * 10)) * MINSPERDAY / 2 + MINSPERDAY / 2;
}
export function tick() {
    globalThis.TIME += 1;
    PLAYER.executeAction();
    for (let mob in MOBSMAP) {
        MOBSMAP[mob].tick();
    }
    updateLighting();
    updateDisplay();
    // updateInventory();
}
// generates key value pairs of locationMap as coordinates and Location objects
function generateWorld(sideLengthWorld) {
    let newCellMap = {};
    // offset world gen to generate in a square around 0,0 instead of having 0,0 as the most southwestern point
    sideLengthWorld = Math.floor(sideLengthWorld / 2);
    for (let y = 0 - sideLengthWorld; y < sideLengthWorld; y++) {
        for (let x = 0 - sideLengthWorld; x < sideLengthWorld; x++) {
            newCellMap[`${x},${y}`] = new Cell(x, y);
        }
    }
    return newCellMap;
}
function genGround() {
    if (Math.random() > 0.95) {
        return GROUNDTYPEKINDSMAP["clay"];
    }
    if (Math.random() > 0.9) {
        return GROUNDTYPEKINDSMAP["mud"];
    }
    return GROUNDTYPEKINDSMAP["snow"];
}
function genTerrain() {
    let terrainFeatures = [];
    if (Math.random() < 0.1) {
        terrainFeatures.push(TERRAINFEATUREKINDSMAP["tree"]);
    }
    return terrainFeatures;
}
function setPlayerAction(newAction) {
    PLAYER.currentAction = newAction;
}
function setMobAction(mobID, newAction) {
    MOBSMAP[mobID].currentAction = newAction;
}
// pass individual x and y values as numbers or the whole XY as a string to check if a cell is blocked
function checkIfCellBlocked(x, y, XY) {
    if (XY) {
        return CELLMAP[XY].isBlocked();
    }
    else if (x && y || x == 0 || y == 0) {
        return CELLMAP[`${x},${y}`].isBlocked();
    }
    else
        throw new Error(`missing parameters, x: ${x}, y; ${y}, XY: ${XY}`);
}
export function setup(worldSideLength, startTime, playerStartLocation) {
    createGrid("map", 33, "mapCell", DISPLAYELEMENTSDICT);
    createGrid("lightMap", 33, "lightMapCell", LIGHTELEMENTSDICT);
    createGrid("itemsMap", 33, "itemsMapCell", ITEMSELEMENTSDICT);
    globalThis.NAVIGATIONELEMENT = document.getElementById("navigation") ?? throwExpression("navigation element gone"); // for the context menus
    globalThis.CELLMAP = generateWorld(worldSideLength);
    globalThis.PLAYER = new Player(playerStartLocation[0], playerStartLocation[1]); // spread ???
    globalThis.TIME = startTime;
    setupKeys();
    setupClicks();
    CELLMAP["1,0"].inventory.add("oil lamp", 1); // add a lamp
    MOBSMAP["1"] = new NPCHuman(2, 2, MOBKINDSMAP["npctest"]);
    // debug stuff
    updateLighting();
    updateDisplay();
    updateInventory();
}
function setupKeys() {
    window.addEventListener("keydown", (event) => {
        event.preventDefault();
        if (event.shiftKey) {
            switch (event.key) {
                case "ArrowUp":
                    setPlayerAction("northKD");
                    break;
                case "ArrowLeft":
                    setPlayerAction("westKD");
                    break;
                case "ArrowDown":
                    setPlayerAction("southKD");
                    break;
                case "ArrowRight":
                    setPlayerAction("eastKD");
                    break;
                case "W":
                    setPlayerAction("northKD");
                    break;
                case "A":
                    setPlayerAction("westKD");
                    break;
                case "S":
                    setPlayerAction("southKD");
                    break;
                case "D":
                    setPlayerAction("eastKD");
                    break;
            }
        }
        else {
            switch (event.key) {
                case "ArrowUp":
                    setPlayerAction("north");
                    break;
                case "ArrowLeft":
                    setPlayerAction("west");
                    break;
                case "ArrowDown":
                    setPlayerAction("south");
                    break;
                case "ArrowRight":
                    setPlayerAction("east");
                    break;
                case "w":
                    setPlayerAction("north");
                    break;
                case "a":
                    setPlayerAction("west");
                    break;
                case "s":
                    setPlayerAction("south");
                    break;
                case "d":
                    setPlayerAction("east");
                    break;
            }
        }
    });
}
function setupClicks() {
    NAVIGATIONELEMENT.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        let displayCellCoords = document.elementFromPoint(e.clientX, e.clientY)?.id.slice("lightMap".length); // for some reason clientX and clientY are both offset by two cell width/lengths
        let x = 0;
        let y = 0;
        if (typeof displayCellCoords === "string") {
            [x, y] = stringCoordsToNum(displayCellCoords);
        }
        let cell = getMapCellAtDisplayCell(x, y);
        if (x && y || x === 0 || y === 0) {
            setCTX(new CtxParentMenu_Cell(e.clientX, e.clientY, cell)); // cell should point to whichever cell is clicked, if that's how this works
        }
    }, false);
    NAVIGATIONELEMENT.addEventListener("click", (e) => {
        clearCTX();
    }, false);
}
function stringCoordsToNum(stringCoords) {
    let numCoords = [];
    for (let coord of stringCoords.split(",")) {
        numCoords.push(+coord);
    }
    return numCoords;
}
class Mob {
    name;
    x;
    y;
    currentAction;
    symbol;
    facing;
    blocking;
    inventory;
    fullName;
    constructor(x, y, kind) {
        this.name = kind.name;
        this.x = x;
        this.y = y;
        this.currentAction = "wait";
        this.symbol = kind.symbol;
        CELLMAP[`${this.x},${this.y}`].mobs.push(this);
        this.facing = "n";
        this.blocking = true;
        this.inventory = new Inventory();
    }
    getCell() {
        return CELLMAP[`${this.x},${this.y}`];
    }
    move(direction, changeFacing) {
        // remove from old location
        let oldContents = CELLMAP[`${this.x},${this.y}`].mobs;
        oldContents.splice(oldContents.indexOf(this), 1);
        switch (direction) {
            case "north":
                if (!checkIfCellBlocked(this.x, this.y + 1)) {
                    if (changeFacing) {
                        this.facing = "n";
                    }
                    this.y += 1;
                }
                break;
            case "south":
                if (!checkIfCellBlocked(this.x, this.y - 1)) {
                    if (changeFacing) {
                        this.facing = "s";
                    }
                    this.y -= 1;
                }
                break;
            case "east":
                if (!checkIfCellBlocked(this.x + 1, this.y)) {
                    if (changeFacing) {
                        this.facing = "e";
                    }
                    this.x += 1;
                }
                break;
            case "west":
                if (!checkIfCellBlocked(this.x - 1, this.y)) {
                    if (changeFacing) {
                        this.facing = "w";
                    }
                    this.x -= 1;
                }
                break;
        }
        CELLMAP[`${this.x},${this.y}`].mobs.push(this);
        this.currentAction = "moved";
    }
    take(name, cell) {
        if (cell.inventory.remove(name, 1)) {
            this.inventory.add(name, 1);
        }
        else {
            console.log("not there");
        }
    }
    executeAction() {
        switch (this.currentAction) {
            case "north":
                this.move("north", true);
                break;
            case "south":
                this.move("south", true);
                break;
            case "east":
                this.move("east", true);
                break;
            case "west":
                this.move("west", true);
                break;
            case "northKD": // "KD" as in "Keep Direction"
                this.move("north", false);
                break;
            case "southKD":
                this.move("south", false);
                break;
            case "eastKD":
                this.move("east", false);
                break;
            case "westKD":
                this.move("west", false);
                break;
        }
        this.currentAction = "wait";
    }
}
class NPCHuman extends Mob {
    constructor(x, y, mobKind) {
        super(x, y, mobKind);
    }
    tick() {
        let rand = Math.random();
        if (rand <= 0.2) {
            this.currentAction = "north";
        }
        else if (rand <= 0.4 && rand > 0.2) {
            this.currentAction = "south";
        }
        else if (rand <= 0.6 && rand > 0.4) {
            this.currentAction = "east";
        }
        else if (rand <= 0.8 && rand > 0.6) {
            this.currentAction = "west";
        }
        this.executeAction();
    }
}
class Player extends Mob {
    constructor(x, y) {
        super(x, y, MOBKINDSMAP["player"]);
    }
    tick() {
        return;
    }
}
export function parseCell(cell) {
    if (cell.lightLevel < 30) {
        return "you can't see a thing, but for the darkness.";
    }
    let cellDescription = `the ground is ${cell.ground.name}y. `;
    for (let terrain of cell.terrain) {
        cellDescription = cellDescription.concat(`there is a ${terrain.name}. `);
    }
    for (let entry of cell.inventory.entriesArray()) {
        if (entry.quantity > 1) {
            cellDescription = cellDescription.concat(`there are ${entry.quantity} ${entry.item.name}s. `);
        }
        else {
            cellDescription = cellDescription.concat(`there is a ${entry.item.name}. `);
        }
    }
    for (let mob of cell.mobs) {
        if (mob === PLAYER) {
            cellDescription = cellDescription.concat(`you are here. `);
        }
        else {
            if ("fullName" in mob) {
                if (!mob.fullName === undefined) {
                    cellDescription = cellDescription.concat(`${mob.fullName} is here. `);
                }
                else {
                    cellDescription = cellDescription.concat(`there is a ${mob.name} here. `);
                }
            }
        }
    }
    return cellDescription;
}
export function setFocus(focus, title) {
    getElementFromID("focusElementChild").remove();
    let focusElement = getElementFromID("focus");
    let focusElementChild = document.createElement("div");
    focusElement.setAttribute("focus-title", title);
    focusElement.appendChild(focusElementChild);
    focusElementChild.id = "focusElementChild";
    focusElementChild.classList.add("focusElementChild");
    focusElementChild.innerHTML = focus;
}
export class Cell {
    x;
    y;
    mobs;
    terrain;
    ground;
    lightLevel;
    color;
    inventory;
    isVisible;
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.mobs = [];
        this.ground = genGround();
        this.terrain = genTerrain();
        this.color = this.ground.blendMode();
        // inventory should have a way to generate items depending on some seeds
        this.inventory = new Inventory();
        this.lightLevel = 0;
        this.isVisible = false;
    }
    isBlocked() {
        for (let content of [...this.terrain, ...this.mobs]) {
            if (content.blocking) {
                return true;
            }
        }
        return false;
    }
    // return unordered list of luminescences of all items
    allLuminescence() {
        let lumList = [];
        for (let entry of [...this.inventory.itemsArray(1), ...this.terrain]) {
            lumList.push(entry.luminescence);
        }
        for (let mob of this.mobs) {
            for (let item of mob.inventory.itemsArray(1)) {
                lumList.push(item.luminescence);
            }
        }
        return lumList;
    }
    // return highest luminesence item of Cell
    maxLum() {
        return Math.max(0, ...this.allLuminescence());
    }
    sumOpacity() {
        // opacity of all mobs should be assumed to be 1 until able to be calculated from weight or size
        if (this.mobs) {
            return 1;
        }
        let sum = 0;
        for (let entry of [...this.inventory.itemsArray(1), ...this.terrain]) {
            sum += entry.opacity;
        }
        return sum;
    }
}
// i dont think this is needed anymore
class ControlState {
    state;
    constructor() {
        this.state = "setup";
    }
    inventory() {
        this.state = "inventory";
    }
}
export class GroundType {
    name;
    color;
    blendMode;
    constructor(name, color, blendMode) {
        this.name = name;
        this.color = color;
        this.blendMode = this.getBlendMode(blendMode);
    }
    getBlendMode(str) {
        switch (str) {
            case "mudBlend":
                return this.mudBlend;
            case "clayBlend":
                return this.clayBlend;
            case "none":
                return () => { return this.color; };
            default:
                throwExpression("invalid blend mode");
        }
        return throwExpression("invalid blend mode");
    }
    mudBlend() {
        const random = Math.random() * 30;
        return this.color.map((rgb) => { return rgb + random; });
    }
    clayBlend() {
        const random = Math.random();
        if (random > 0.5) {
            return [169, 108, 80];
        }
        else {
            return [172, 160, 125];
        }
    }
}
//# sourceMappingURL=world.js.map