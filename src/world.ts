import { updateLighting } from "./light.js";
import { createGrid, throwExpression } from "./util.js";
import { Inventory, updateInventory } from "./inventory.js";
import { CtxParentMenu_Cell, setCTX } from "./menu.js";
import { DISPLAYELEMENTSDICT, LIGHTELEMENTSDICT, ITEMSELEMENTSDICT, updateDisplay } from "./display.js";

export function getMapCellAtDisplayCell(x: number, y: number): Cell
export function getMapCellAtDisplayCell(xy: string): Cell
export function getMapCellAtDisplayCell(xyOrX: number|string, y?: number): Cell {
    if (typeof xyOrX === "number") {
        if (y || y === 0) {
            return CELLMAP[`${xyOrX - 18 + PLAYER.x},${y - 18 + PLAYER.y}`];
        }
        return throwExpression("xyOrX is a number but y doesn't exist (you missed an argument)")
    }
    else {
        let splitXY = xyOrX.split(","); // tried defining with x, y = xyOrX.split(",") but x sometimes "didnt exist"

        return CELLMAP[`${+splitXY[0] - 18 + PLAYER.x},${+splitXY[1] - 18 + PLAYER.y}`];
    }
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
            // console.log(`genning ${x},${y}`)
            newCellMap[`${x},${y}`] = new Cell(x, y);
            // console.log(`genned ${x}, ${y} with color ${newLocationMap[x + "," + y].color}`)
        }
    }

    return newCellMap;
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

    NAVIGATIONELEMENT = document.getElementById("navigation") ?? throwExpression("navigation element gone") // for the context menus

    CELLMAP = generateWorld(worldSideLength);

    PLAYER = new Player(playerStartLocation[0], playerStartLocation[1]); // spread ???

    globalThis.TIME = startTime;
    globalThis.MINSPERDAY = 1440;
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

// this function works!
function setupClicks() {
    NAVIGATIONELEMENT.addEventListener("contextmenu", function(e) {
        e.preventDefault();
        let displayCellCoords = document.elementFromPoint(e.clientX + 36, e.clientY - 36)?.id.slice("lightMap".length); // for some reason clientX and clientY are both offset by two cell width/lengths
        if (displayCellCoords) {
            setCTX(new CtxParentMenu_Cell(e.clientX, e.clientY, getMapCellAtDisplayCell(displayCellCoords))); // cell should point to whichever cell is clicked, if that's how this works
        }
    },false);
}


interface MobKind {
    name: string;
    symbol: string;
}

abstract class Mob {
    name: string;
    x: number;
    y: number;
    currentAction: string;
    symbol: string;
    facing: string;
    blocking: boolean;
    inventory: Inventory;
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

class Player extends Mob {
    constructor(x: number, y: number) {
        super(x, y, MOBKINDSMAP["player"]);
    }

    tick() {
        return;
    }
}

export class Cell {
    x: number;
    y: number;
    mobs: Mob[];
    terrain: TerrainFeature[];
    ground: GroundType;
    lightLevel: number;
    color: [number, number, number];
    inventory: Inventory;
    isVisible: Boolean;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.mobs = [];
        this.ground = this.genGround();
        this.terrain = this.genTerrain();
        this.color = this.ground.blendMode();
        // inventory should have a way to generate items depending on some seeds
        this.inventory  = new Inventory();
        this.lightLevel = 0;
        this.isVisible = false;
    }

    genGround(): GroundType {
        if (Math.random() > 0.95) {
            return GROUNDTYPESMAP["mud"];
        }
        return GROUNDTYPESMAP["snow"];
    }

    genTerrain(): TerrainFeature[] {
        let terrainFeatures: TerrainFeature[] = [];
        if (Math.random() < 0.1) {
            terrainFeatures.push(TERRAINFEATURESMAP["tree"]);
        }
        return terrainFeatures;
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
    allLuminescence(): number[] {
        let lumList: number[] = [];
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
    maxLum(): number {
        return Math.max(0, ...this.allLuminescence());
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


class GroundType {
    name: string;
    color: [number, number, number];
    blendMode: Function;
    constructor(name: string, color: [number, number, number], blendMode: string) {
        this.name = name;
        this.color = color;
        this.blendMode = this.getBlendMode(blendMode);
    }

    getBlendMode(str: string) {
        switch(str) {
            case "mudBlend":
                return this.mudBlend;
            case "none":
                return ()=>{return this.color};
            default:
                throwExpression("invalid blend mode");
        }
        return throwExpression("invalid blend mode");
    }

    mudBlend() {
        const random = Math.random() * 30;
        return this.color.map((rgb)=>{return rgb+random});
    }
}

export interface Item {
    name: string;
    weight: number;
    space: number;
    symbol: string;
    luminescence: number;
    opacity: number;
    blocking: boolean;
}

interface TerrainFeature {
    name: string;
    symbol: string;
    luminescence: number;
    opacity: number;
    blocking: boolean;
}



declare global {
    var TIME: number;
    var MINSPERDAY: number;
}

let NAVIGATIONELEMENT: HTMLElement;
let CONTROLSTATE;

const TICKSPERMINUTE = 600;

export const TICKDURATION = 100;
const TICKSPERDAY = 86400 * (1000 / TICKDURATION);

export let CELLMAP: { [key: string]: Cell };
let MOBSMAP: { [id: string]: Mob } = {};

let MOBKINDSMAP: { [key: string]: MobKind } = {
    "player": {name: "player", symbol: "@"},
    "npctest": {name: "npctest", symbol: "T"}
}
export let ITEMSMAP: { [key: string]: Item} = {
    "oil lamp": {name: "oil lamp", symbol: "o", luminescence: 125, weight: 2700, space: 1, opacity: 0, blocking: false},
    "rock": {name: "rock", symbol: ".", luminescence: 0, weight: 100, space: 0.1, opacity: 0, blocking: false},
    "chocolate thunder": {name: "chocolate thunder", symbol: "c", luminescence: 0, weight: 10, space: 0.01, opacity: 0, blocking: false}
}
let TERRAINFEATURESMAP: { [key: string]: TerrainFeature } = {
    "tree": {name: "tree", symbol: "#", luminescence: 0, opacity: 0, blocking: true},
}
let GROUNDTYPESMAP: { [key: string]: GroundType } = {
    "mud": new GroundType("mud", [109, 81, 60], "mudBlend"),
    "snow": new GroundType("snow", [240, 240, 240], "mudBlend") // use this in a more robust way to display cells. basically if cell.contents content has a "colour", set the cell to that colour.
}

export let PLAYER: Player;

