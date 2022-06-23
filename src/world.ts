import { updateLighting, Colour } from "./light.js";
import { createGrid, getElementFromID, throwExpression } from "./util.js";
import { Inventory, updateInventory } from "./inventory.js";
import { CtxParentMenu_Cell, setCTX, clearCTX } from "./menu.js";
import { DISPLAYELEMENTSDICT, LIGHTELEMENTSDICT, ITEMSELEMENTSDICT, updateDisplay } from "./display.js";

export function getMapCellAtDisplayCell(x: number, y: number): Cell {
    const newX = x - 16 + PLAYER.x;
    const newY = y - 16 + PLAYER.y;

    return CELLMAP[`${newX},${newY}`];
}

export function getSquareDistanceBetweenCells(cell1: Cell, cell2: Cell) {
    return getSquareDistanceBetweenCoords(cell1.x, cell1.y, cell2.x, cell2.y);
}

// square root to get actual distance
function getSquareDistanceBetweenCoords(x1:number, y1:number, x2:number, y2:number) {
    return (x1 - x2)**2 + (y1 - y2)**2;
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
function generateWorld(sideLengthWorld: number) {
    let newCellMap: { [key: string]: Cell } = {};

    // offset world gen to generate in a square around 0,0 instead of having 0,0 as the most southwestern point
    sideLengthWorld = Math.floor(sideLengthWorld / 2);

    for (let y = 0 - sideLengthWorld; y < sideLengthWorld; y++) {
        for (let x = 0 - sideLengthWorld; x < sideLengthWorld; x++) {
            newCellMap[`${x},${y}`] = new Cell(x, y);
        }
    }

    return newCellMap;
}

function genGround(): GroundType {
    if (Math.random() > 0.95) {
        return GROUNDTYPEKINDSMAP["clay"];
    }
    if (Math.random() > 0.9) {
        return GROUNDTYPEKINDSMAP["mud"];
    }
    return GROUNDTYPEKINDSMAP["snow"];
}

function genTerrain(): TerrainFeature[] {
    let terrainFeatures: TerrainFeature[] = [];
    if (Math.random() < 0.1) {
        terrainFeatures.push(TERRAINFEATUREKINDSMAP["tree"]);
    }
    return terrainFeatures;
}


function setPlayerAction(newAction: string) {
    PLAYER.currentAction = newAction;
}

function setMobAction(mobID: string, newAction: string) {
    MOBSMAP[mobID].currentAction = newAction;
}

// pass individual x and y values as numbers or the whole XY as a string to check if a cell is blocked
function checkIfCellBlocked(x?: number, y?: number, XY?: string) {
    if (XY) {
        return CELLMAP[XY].isBlocked();
    }
    else if (x && y || x == 0 || y == 0) {
        return CELLMAP[`${x},${y}`].isBlocked();
    }
    else throw new Error(`missing parameters, x: ${x}, y; ${y}, XY: ${XY}`);
}

export function setup(worldSideLength: number, startTime: number, playerStartLocation: number[]) {
    createGrid("map", 33, "mapCell", DISPLAYELEMENTSDICT);
    createGrid("lightMap", 33, "lightMapCell", LIGHTELEMENTSDICT);
    createGrid("itemsMap", 33, "itemsMapCell", ITEMSELEMENTSDICT);

    globalThis.NAVIGATIONELEMENT = document.getElementById("navigation") ?? throwExpression("navigation element gone") // for the context menus

    globalThis.CELLMAP = generateWorld(worldSideLength);

    globalThis.PLAYER = new Player(playerStartLocation[0], playerStartLocation[1]); // spread ???

    globalThis.TIME = startTime;
    globalThis.MINSPERDAY = 1440;
    setupKeys();
    setupClicks();

    CELLMAP["1,0"].inventory.add("oil lamp", 1); // add a lamp

    MOBSMAP["1"] = new NPCHuman(2, 2, MOBKINDSMAP["npctest"]);

    // CTX = new CtxParentMenu_Cell(-500,-500,CELLMAP["0,50"]);
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
        let displayCellCoords: undefined|string|number[] = document.elementFromPoint(e.clientX, e.clientY)?.id.slice("lightMap".length); // for some reason clientX and clientY are both offset by two cell width/lengths
        let x = 0;
        let y = 0;

        if (typeof displayCellCoords === "string") {
            [x,y] = stringCoordsToNum(displayCellCoords);
        }

        let cell = getMapCellAtDisplayCell(x, y);

        if (x && y || x===0 || y===0) {
            setCTX(new CtxParentMenu_Cell(e.clientX, e.clientY, cell)); // cell should point to whichever cell is clicked, if that's how this works
        }
    },false);
    NAVIGATIONELEMENT.addEventListener("click", (e) => {
        clearCTX();
    },false);
}

function stringCoordsToNum(stringCoords: string): number[] {
    let numCoords = [];
    for (let coord of stringCoords.split(",")) {
        numCoords.push(+coord);
    }
    return numCoords;
}

export interface MobKind {
    name: string;
    symbol: string;
}

export abstract class Mob {
    name: string;
    x: number;
    y: number;
    currentAction: string;
    symbol: string;
    facing: string;
    blocking: boolean;
    inventory: Inventory;
    fullName?: string;
    constructor(x: number, y: number, kind: MobKind) {
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

    move(direction: string, changeFacing: boolean) {
        // remove from old location
        let oldContents = CELLMAP[`${this.x},${this.y}`].mobs;
        oldContents.splice(oldContents.indexOf(this),1);

        switch(direction) {
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

    take(name: string, cell: Cell) {
        if (cell.inventory.remove(name, 1)) {
            this.inventory.add(name, 1);
        }
        else {
            console.log("not there")
        }
    }

    executeAction() {
        switch(this.currentAction) {
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

    abstract tick(): void;
}

class NPCHuman extends Mob {
    constructor(x: number, y: number, mobKind: MobKind) {
        super(x, y, mobKind);
    }

    tick(): void {
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

export class Player extends Mob {
    constructor(x: number, y: number) {
        super(x, y, MOBKINDSMAP["player"]);
    }

    tick() {
        return;
    }
}

export function parseCell(cell: Cell): string {
    let cellDescAppend = (x: string) => {cellDescription = cellDescription.concat(x)};
    if (cell.lightLevel.mag() < 10) {
        return "you can't see a thing, but for the darkness.";
    }
    let cellDescription = `the ground ${cell.ground.lex.cellDesc}. `;

    for (let terrain of cell.terrain) {
        cellDescAppend(`there ${terrain.lex.cellDesc}. `);
    }
    for (let entry of cell.inventory.entriesArray()) {
        if (entry.quantity > 1) {
            cellDescAppend(`there ${entry.item.lex.cellDescXPlural(entry.quantity)}. `);
            ["are ", entry.quantity," rocks"]
        }
        else {
            cellDescAppend(`there ${entry.item.lex.cellDesc}. `);
        }
    }
    for (let mob of cell.mobs) {
        if (mob === PLAYER) {
            cellDescAppend(`you are here. `);
        }
        else {
            if ("fullName" in mob) {
                if (!mob.fullName === undefined) {
                    cellDescAppend(`${mob.fullName} is here. `);
                }
                else {
                    cellDescAppend(`there is a ${mob.name} here. `);
                }
            }
        }
    }

    return cellDescription;
}

export function setFocus(focus: string, title: string) {
    getElementFromID("focusElementChild").remove();
    let focusElement      = getElementFromID("focus");
    let focusElementChild = document.createElement("div");

    focusElement.setAttribute("focus-title", title);

    focusElement.appendChild(focusElementChild);
    focusElementChild.id = "focusElementChild";
    focusElementChild.classList.add("focusElementChild");
    focusElementChild.innerHTML = focus;
}

export class Lex {
    cellDesc: string;
    cellDescP?: string[];
    constructor(cellDesc: string, cellDescP?: string[]) {
        this.cellDesc = cellDesc;
        this.cellDescP = cellDescP;
    }

    cellDescXPlural(x: string|number) {
        if (typeof x === "number") {
            x = x.toString();
        }
        if (this.cellDescP) {
            return this.cellDescP[0].concat(x, this.cellDescP[1]);
        }
        else {
            throwExpression("object has no cellDescP");
        }
    }
}

export interface Item {
    name: string;
    weight: number;
    space: number;
    symbol: string;
    luminescence: Colour;
    opacity: number;
    blocking: boolean;
    lex: Lex;
}

export interface TerrainFeature {
    name: string;
    symbol: string;
    luminescence: Colour;
    opacity: number;
    blocking: boolean;
    lex: Lex;
}

export class Cell {
    x: number;
    y: number;
    mobs: Mob[];
    terrain: TerrainFeature[];
    ground: GroundType;
    lightLevel: Colour;
    color: [number, number, number];
    inventory: Inventory;
    isVisible: Boolean;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.mobs = [];
        this.ground = genGround();
        this.terrain = genTerrain();
        this.color = this.ground.blendMode();
        // inventory should have a way to generate items depending on some seeds
        this.inventory  = new Inventory();
        this.lightLevel = Colour.Zero();
        this.isVisible = false;
    }

    isBlocked(): boolean {
        for (let content of [...this.terrain, ...this.mobs]) {
            if (content.blocking) {
                return true;
            }
        }
        return false;
    }

    // return unordered list of luminescences of all items
    allLuminescence(): Colour[] {
        let lumList: Colour[] = [];
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
    maxLum(): Colour {
        return Colour.sum(this.allLuminescence());
    }

    sumOpacity(): number {
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
    state: string;
    constructor() {
        this.state = "setup";
    }

    inventory() {
        this.state = "inventory";
    }
}

export class GroundType {
    name: string;
    color: [number, number, number];
    blendMode: Function;
    lex: Lex;
    constructor(name: string, color: [number, number, number], blendMode: string, lex: Lex) {
        this.name = name;
        this.color = color;
        this.blendMode = this.getBlendMode(blendMode);
        this.lex = lex;
    }

    getBlendMode(str: string) {
        switch(str) {
            case "mudBlend":
                return this.mudBlend;
            case "clayBlend":
                return this.clayBlend;
            case "none":
                return ()=>{return this.color};
            default:
                throwExpression("invalid blend mode");
        }
    }

    mudBlend() {
        const random = Math.random() * 30;
        return this.color.map((rgb)=>{return rgb+random});
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
