import { updateLighting, Colour } from "./light.js";
import { createGrid, getElementFromID, throwExpression, Vector2 } from "./util.js";
import { constructMobSlots, displayInventoryForFocus, Inventory, MobSlots, SLOTBIAS, updateInventory } from "./inventory.js";
import { CtxParentMenu_Cell, setCTX, clearCTX } from "./menu.js";
import { DISPLAYELEMENTSDICT, LIGHTELEMENTSDICT, ITEMSELEMENTSDICT, updateDisplay } from "./display.js";

export function getMapCellAtDisplayCell(x: number, y: number): Cell {
    return CELLMAP[`${x-16+PLAYER.pos.x},${y-16+PLAYER.pos.y}`];
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
    PLAYER.tick();
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

function setPlayerAction(newAction: string) {
    PLAYER.currentAction = newAction;
}

function setMobAction(mobID: string, newAction: string) {
    MOBSMAP[mobID].currentAction = newAction;
}

export function setup(worldSideLength: number, startTime: number, playerStartLocation: Vector2) {
    createGrid("map", 33, "mapCell", DISPLAYELEMENTSDICT);
    createGrid("lightMap", 33, "lightMapCell", LIGHTELEMENTSDICT);
    createGrid("itemsMap", 33, "itemsMapCell", ITEMSELEMENTSDICT);

    globalThis.NAVIGATIONELEMENT = getElementFromID("navigation"); // for context menus
    globalThis.INVENTORYELEMENT  = getElementFromID("inventory");
    globalThis.CELLMAP = generateWorld(worldSideLength);
    globalThis.PLAYER = new Player(playerStartLocation.x, playerStartLocation.y);
    globalThis.VIEWPORT.pos = PLAYER.pos;
    globalThis.TIME = startTime;
    globalThis.MINSPERDAY = 1440;

    setupKeys();
    setupClicks();

    CELLMAP["1,0"].inventory.add([Item.createItem("oil lamp"), Item.createItem("coat")]); // add a lamp

    CELLMAP["0,1"].mobs.push(new Animal(0, 1, MOBKINDSMAP["rabbit"]));

    // PLAYER.equip(new Item(ITEMKINDSMAP["coat"]), "torso");
    // PLAYER.equip(new Item(ITEMKINDSMAP["coat"]), "torso");
    // PLAYER.equip(new Item(ITEMKINDSMAP["coat"]), "legs");

    updateLighting();
    updateDisplay();
    updateInventory();
}

function setupKeys() {
    window.addEventListener("keydown", (event) => {
        // event.preventDefault();
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
    INVENTORYELEMENT.addEventListener("click", (e) => {
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
    limbs: MobSlots;
}

export abstract class Mob {
    name: string;
    pos: Vector2;
    currentAction: string;
    symbol: string;
    facing: Vector2;
    blocking: boolean;
    equipment: MobSlots;
    inventory: Inventory;
    stats: MobStats;
    kind: string;
    gender: string;
    fullName?: string;
    constructor(x: number, y: number, kind: MobKind) {
        this.name = kind.name;
        this.equipment = constructMobSlots();
        this.pos = new Vector2(x, y);
        CELLMAP[`${this.pos}`].mobs.push(this);
        this.currentAction = "wait";
        this.symbol = kind.symbol;
        this.facing = new Vector2(0, +1); 
        this.blocking = true;
        this.inventory = new Inventory();
        this.stats = this.baseStats();
        this.kind = kind.name;
        this.gender = Math.random() > 0.5 ? "male" : "female";
    }

    // TODO make this work with more than one preferred slot e.g. with gloves
    equipDefault(item: Item) {
        if (item.preferredEquipSlot) {
            this.equip(item, item.preferredEquipSlot[0]);
            return;
        }
        console.log(`can't equip ${item.name}`);
    }

    equip(item: Item, slot: string) {
        if (!item.preferredEquipSlot) {
            console.log("dont wear this, you'll thank me later");
            return;
        }
        this.equipment[slot]?.add([item]);
        this.inventory.remove([item]);
        this.checkClothingStats();
        // just in case
        updateInventory();
    }

    checkClothingStats() {
        return this.getClothingStats();
    }

    // for each slot, get all items, multiply them by SLOTBIAS if they are in correct slot,
    // else divide their effect by 10, add their calculacted values into inInsul and extInsul
    getClothingStats() {
        let stats: MobStats = {inInsul: 0, extInsul: 0};
        for (let currentSlotKey in this.equipment) {                 // go into this.equipment
            for (let item of this.equipment[currentSlotKey].items) { // go into items on inventory on this.equipment
                if (!item.preferredEquipSlot) {                      // make sure item is wearable
                    console.log("impossible to have this item equipped")
                    continue;
                }
                stats = Mob.sumStats(stats, (item.preferredEquipSlot.includes(currentSlotKey)) ?
                {inInsul: item.stats.insulation * SLOTBIAS[currentSlotKey].inInsul, extInsul: item.stats.insulation * SLOTBIAS[currentSlotKey].extInsul}:
                {inInsul: item.stats.insulation * 0.1, extInsul: item.stats.insulation * 0.1});
            }
        }
        return stats;
    }

    // return unordered list of all clothing Items worn by a mob
    getClothing(): Item[] {
        let clothingList: Item[] = [];
        Object.values(this.equipment).forEach((i) => {clothingList = clothingList.concat(i.items)});
        console.log(clothingList);
        return clothingList;
    }

    // temporary function for debugging
    static sumStats(s1: MobStats, s2: MobStats) {
        let s3: MobStats = {inInsul: 0, extInsul: 0};

        s3.inInsul = s1.inInsul + s2.inInsul;
        s3.extInsul = s1.extInsul + s2.extInsul;

        return s3;
    }

    // apply stats to Mob based on StatDelta object
    // definitely a much better way to do this once i figure out indexing by string without bypassing typescript
    applyStats(statChange: StatDelta): void {
        if (statChange.inInsul) {
            this.stats.inInsul += statChange.inInsul;
        }
        if (statChange.extInsul) {
            this.stats.extInsul += statChange.extInsul;
        }
    }

    // return base MobStats object
    baseStats(): MobStats {
        return {inInsul: 0, extInsul: 0}
    }

    // returns the current cell of this Mob
    getCell() {
        return CELLMAP[`${this.pos}`];
    }

    // initiates movement of Mob in direction
    move(direction: string, changeFacing: boolean) {
        let dir, dest: Vector2;
        switch(direction) {
            case "north":
                dir = new Vector2(0, +1);
                break;
            case "south":
                dir = new Vector2(0, -1);
                break;
            case "east":
                dir = new Vector2(+1, 0);
                break;
            case "west":
                dir = new Vector2(-1, 0);
                break;
            default:
                dir = new Vector2(0, 0);
        }
        if (changeFacing) this.facing = dir;
        dest = Vector2.Add(this.pos, dir);
        if (CELLMAP[`${dest}`].isBlocked()) return;

        // remove from old location
        let oldMobs = CELLMAP[`${this.pos}`].mobs;
        oldMobs.splice(oldMobs.indexOf(this),1);

        this.pos = dest;
        CELLMAP[`${this.pos}`].mobs.push(this);

        this.currentAction = "moved";
    }

    // remove 1 item from Cell Inventory and place into Mob's Inventory
    take(item: Item, cell: Cell) {
        if (cell.inventory.remove([item])) {
            this.inventory.add([item]);
        }
        else {
            console.log("not there");
        }
    }

    // called every tick to execute Mob's currentAction, quantizes Mob actions into tick lengths
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

// TODO separate out into NPCHuman extends Human
class NPCHuman extends Mob {
    constructor(x: number, y: number, mobKind: MobKind) {
        super(x, y, mobKind);
    }

    tick(): void {
        let rand = Math.random() * 10;
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

export class Animal extends Mob {
    constructor(x: number, y: number, kind: MobKind) {
        super(x, y, kind);
        this.blocking = false;
        this.inventory.add([Item.createItem("oil lamp")]);
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

        this.inventory.items[0].luminescence = new Colour(Math.random()*255, Math.random()*255, Math.random()*255);

        this.executeAction();
    }
}

export class Player extends Mob {
    constructor(x: number, y: number) {
        super(x, y, MOBKINDSMAP["player"]);
        this.gender = "male"; // TBC
    }

    tick() {
        VIEWPORT.pos = this.pos;
        return;
    }
}

function displayListContents(container: Mob[]|TerrainFeature[]|GroundType[]) {
    let element = document.createElement("div");
    for (let content of container) {
        let contentElement = document.createElement("div");
        contentElement.innerHTML = content.name;
        element.appendChild(contentElement);
    }

    return element;
}

export function cellFocus(cell: Cell): HTMLElement {
    let elementNames = ["Parent", "Items", "Mobs", "Terrain", "Ground"];
    let elements: {[key: string]: HTMLElement} = {};
    for (let name of elementNames) {
        elements[name] = document.createElement("div");
        elements[name].id = `cellFocus${name}`;

        let titleElement = document.createElement("div");
        titleElement.classList.add(`cellFocusTitle`);
        titleElement.innerHTML = name;

        elements[name].appendChild(titleElement);
    }

    elements["Items"].appendChild(displayInventoryForFocus(cell.inventory));
    elements["Mobs"].appendChild(displayListContents(cell.mobs));
    elements["Terrain"].appendChild(displayListContents(cell.terrain));
    elements["Ground"].appendChild(displayListContents([cell.ground]));

    elements["Parent"].innerHTML = "";

    elements["Parent"].appendChild(elements["Items"]);
    elements["Parent"].appendChild(elements["Mobs"]);
    elements["Parent"].appendChild(elements["Terrain"]);
    elements["Parent"].appendChild(elements["Ground"]);

    return elements["Parent"];
}

// TODO change this and items to work with Lex
// keeping this in
function parseMob(mob: Mob) {
    let pronoun = getPronouns(mob);
    let mobDescription = `${pronoun} wearing `;
    let clothing = mob.getClothing();

    if (clothing.length < 1) {
        return `${pronoun} naked...`;
    }
    if (clothing.length === 1) {
        return `${pronoun} wearing a ${clothing[0].name}.`;
    }
    // why did i even do this. "coat, a coat and a coat" vs "3 coats" lol
    for (let i = 0; i < clothing.length; i++) {
        if (i === clothing.length - 1) {
            mobDescription = mobDescription.concat(`and a ${clothing[i].name}.`);
            continue;
        }
        mobDescription = mobDescription.concat(`a ${clothing[i].name}, `);

    }
    return mobDescription;
}

// TODO add "they" for unknown gender etc.
function getPronouns(mob: Mob) {
    if (mob.kind === "player") {
        return "you're";
    }
    if (mob.kind !== "human") {
        return "it's";
    }
    if (mob.gender === "male") {
        return "he's";
    }
    return "she's";
}

// WIP, sets the content of the focus menu
export function setFocus(focusChild: HTMLElement, title: string) {
    getElementFromID("focusChild").remove();
    let focusElementParent = getElementFromID("focus");

    focusElementParent.setAttribute("focus-title", title);
    focusElementParent.appendChild(focusChild);

    focusChild.id = "focusChild";
    focusChild.classList.add("focusChild");
}

// aids parser in translation into sentences
export class Lex {
    // defined in the form "there " + cellDesc + "." i.e. "there [is a lamp]."
    cellDesc: string;
    // defined in form "there ", cellDescP[0], quantity, cellDescP[1], "." i.e. "there [are ][7][ lamps]."
    cellDescP?: string[];
    constructor(cellDesc: string, cellDescP?: string[]) {
        this.cellDesc = cellDesc;
        this.cellDescP = cellDescP;
    }

    // splice x into the middle of cellDescP
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

export class Item {
    name: string;
    weight: number;
    space: number;
    symbol: string;
    luminescence: Colour;
    opacity: number;
    blocking: boolean;
    lex: Lex;
    stats: ItemStats;
    preferredEquipSlot?: string[];
    constructor(itemKind: ItemKind) {
        this.name = itemKind.name;
        this.weight = itemKind.weight;
        this.space = itemKind.space;
        this.symbol = itemKind.symbol;
        this.luminescence = itemKind.luminescence;
        this.opacity = itemKind.opacity;
        this.blocking = itemKind.blocking;
        this.lex = itemKind.lex;
        this.stats = itemKind.stats;
        this.preferredEquipSlot = itemKind.preferredEquipSlot;
    }

    static createItem(itemName: string) {
        return new Item(ITEMKINDSMAP[itemName]);
    }
}

export function constructItemKind(name: string, weight: number, space: number, symbol: string, luminescence: Colour, opacity: number, blocking: boolean, lex: Lex, stats: ItemStats, preferredEquipSlot?: string[]) {
    let kind: ItemKind = {name: name,
        weight: weight,
        space: space,
        symbol: symbol,
        luminescence: luminescence,
        opacity: opacity,
        blocking: blocking,
        lex: lex,
        stats: stats}
    if (preferredEquipSlot) {
        kind.preferredEquipSlot = preferredEquipSlot;
    }
    return kind;
}

interface ItemKind {
    name: string;
    weight: number;
    space: number;
    symbol: string;
    luminescence: Colour;
    opacity: number;
    blocking: boolean;
    lex: Lex;
    stats: ItemStats;
    preferredEquipSlot?: string[];
}

export interface ItemStats {
    insulation: number;
}

export interface MobStats {
    inInsul: number;
    extInsul: number;
}

interface StatDelta {
    inInsul?: number;
    extInsul?: number;
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
    color: Colour;
    inventory: Inventory;
    isVisible: Boolean;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.mobs = [];
        this.ground = Cell.genGround();
        this.terrain = Cell.genTerrain();
        this.color = this.ground.blendMode();
        // inventory should have a way to generate items depending on some seeds
        this.inventory  = new Inventory();
        this.lightLevel = Colour.Zero();
        this.isVisible = false;
    }

    static genGround(): GroundType {
        // if (Math.random() > 0.99) {
        //     return GROUNDTYPEKINDSMAP["mud"];
        // }
        return GROUNDTYPEKINDSMAP["snow"];
    }

    static genTerrain(): TerrainFeature[] {
        let terrainFeatures: TerrainFeature[] = [];
        if (Math.random() < 0.1) {
            terrainFeatures.push(TERRAINFEATUREKINDSMAP["tree"]);
        }
        return terrainFeatures;
    }

    // returns true if something on cell would block something else with collision
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
        for (let entry of [...this.inventory.items, ...this.terrain]) {
            lumList.push(entry.luminescence);
        }
        for (let mob of this.mobs) {
            for (let item of mob.inventory.items) {
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

        for (let entry of [...this.inventory.items, ...this.terrain]) {
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
    color: Colour;
    blendMode: Function;
    lex: Lex;
    constructor(name: string, color: Colour, blendMode: string, lex: Lex) {
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

    mudBlend(): Colour {
        const r = Math.random()*400-200;
        return this.color.add(new Colour(r, r, r));
    }

    clayBlend(): Colour {
        const random = Math.random();
        if (random > 0.5) {
            return new Colour(169, 108, 80);
        }
        else {
            return new Colour(172, 160, 125);
        }
    }
}
