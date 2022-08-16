import { updateLighting, Colour } from "./light.js";
import { createGrid, getElementFromID, throwExpression, Vector2 } from "./util.js";
import { ClothingInventory, displayInventoryList, Inventory } from "./inventory.js";
import { CtxParentMenu_Cell, setCTX, clearCTX, setPrimaryDisplay, updateMenus, InventoryDisplay, SenseDisplay } from "./menu.js";
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

    // doing this every tick is temporary

    updateLighting();
    updateDisplay();
    updateMenus();
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

    globalThis.NAVIGATIONELEMENT    = getElementFromID("navigation"); // for context menus
    globalThis.PRIMARYMENUELEMENT   = getElementFromID("primaryMenuDisplayContainer");
    globalThis.SECONDARYMENUELEMENT = getElementFromID("secondaryMenuDisplayContainer");

    // globalThis.INVENTORYELEMENT  = getElementFromID("inventory");
    globalThis.CELLMAP = generateWorld(worldSideLength);
    globalThis.PLAYER = new Player(playerStartLocation.x, playerStartLocation.y);
    globalThis.VIEWPORT.pos = PLAYER.pos;
    globalThis.TIME = startTime;
 
    globalThis.CURRPRIMARYMENU = new InventoryDisplay(PLAYER.inventory);
    globalThis.CURRSECONDARYMENU = new SenseDisplay();

    // if (DEBUG) {
    //     globalThis.MINSPERDAY = 20;
    // }

    setupKeys();
    setupClicks();

    CELLMAP["1,0"].inventory.add([Item.createItem("oil lamp"), Clothing.createItem("coat") as Clothing, Clothing.createItem("small bag")]); // add a lamp and coat

    // CELLMAP["0,1"].mobs.push(new Animal(0, 1, MOBKINDSMAP["rabbit"]));

    // PLAYER.equip(new Item(ITEMKINDSMAP["coat"]), "torso");
    // PLAYER.equip(new Item(ITEMKINDSMAP["coat"]), "torso");
    // PLAYER.equip(new Item(ITEMKINDSMAP["coat"]), "legs");

    updateLighting();
    updateDisplay();
    // updateInventory();
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

                // hotkeys/menu control
                // TODO holding shift sets secondary?
                case "i":
                    setPrimaryDisplay(new InventoryDisplay(PLAYER.inventory));
                    break;
                case "e":
                    setPrimaryDisplay(new SenseDisplay());
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
    PRIMARYMENUELEMENT.addEventListener("click", (e) => {
        clearCTX();
    },false);
    SECONDARYMENUELEMENT.addEventListener("click", (e) => {
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

// consider adding "neck"
type HumanLimbsPossible = "head"|"torso"|"rArm"|"lArm"|"rHand"|"lHand"|"rLeg"|"lLeg"|"rFoot"|"lFoot";
// interface HumanLimbs {
//     HumanLimbsPossible?: Limb,
// }

type CanineLimbsPossible = "head"|"lPaw"; // etc..
interface CanineLimbs {
    limbs: {[key in CanineLimbsPossible]?: Limb},
}

type MobLimbs = HumanLimbs | CanineLimbs;

class Limb {
    name: HumanLimbsPossible;
    insulation: number;
    equipment: ClothingInventory;
    temperature: number;
    constructor(name: HumanLimbsPossible, baseTemp: number) {
        this.name        = name;
        this.insulation  = 0;
        this.temperature = baseTemp;
        this.equipment   = new ClothingInventory();
    }

    sumUsableVolume() {
        let c = 0;
        for (let equipment of this.equipment.items) {
            c += equipment.usableVolume;
        }
        return c;
    }

    recalculateInsulation() {
        let ins = 0;
        for (let item of this.equipment.items) {
            // console.log(item);
            if (this.name in item.preferredEquipSlot) {
                ins += item.insulation;
            }
            else {
                ins += item.insulation / 5;
            }
        }
        this.insulation = ins;
    }

    equip(item: Item) {
        this.equipment.add([item]);
        this.recalculateInsulation();
    }
}

//there should be a drop function oops
export abstract class Mob {
    name: string;
    pos: Vector2;
    currentAction: string;
    symbol: string;
    facing: Vector2;
    blocking: boolean;
    inventory: Inventory;
    abstract maxVolume: number;
    abstract maxEncumbrance: number;
    gender: string;
    abstract limbs: MobLimbs;
    constructor(name: string, blocking: boolean, inventory: Inventory, gender: string, x: number, y: number) {
        this.name = name;
        this.pos = new Vector2(x, y);
        CELLMAP[`${this.pos}`].mobs.push(this);
        this.currentAction = "wait";
        this.symbol = this.getSymbol();
        this.facing = new Vector2(0, +1);
        this.blocking = true;
        this.inventory = new Inventory();
        this.gender = this.getGender();
    }

    abstract getSymbol(): string;

    abstract getGender(): string;

    // return unordered list of all clothing Items worn by a mob
    getClothing(): Item[] {
        let clothingList: Item[] = [];
        Object.values(this.limbs).forEach((i) => {clothingList = clothingList.concat(i.items)});
        console.log(clothingList);
        return clothingList;
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

        // if you're carrying too much stuff, start dropping stuff
        let rand = Math.random();
        // roll to check if you'll drop something
        if (rand * this.inventory.getTotalUsedVolume() > this.maxVolume) {
            this.drop(this.inventory.items[this.inventory.items.length - 1]);
        }

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

    dropAllByName(itemName: string) {
        for (let item of this.inventory.returnByName(itemName)) { // TODO this kind of sucks
            this.drop(item);
        }
    }

    drop(item: Item) {
        if (this.inventory.remove([item])) {
            this.getCell().inventory.add([item]);
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

type HumanLimbs = {[key in HumanLimbsPossible]?: Limb}

export abstract class Human extends Mob {
    limbs:          HumanLimbs;
    maxVolume:      number;
    maxEncumbrance: number;
    fullName?:      string;
    constructor(x: number, y: number, player: boolean) {
        super("human", true, new Inventory(), "neither", x, y); //TODO proper generation of mobs
        this.limbs     = Human.createLimbs();
        this.maxVolume = this.getMaxVolume();
        this.maxEncumbrance = 30000; // calculate based on strenght o r somethign
    }

    getSymbol() {
        return "O";
    }

    getMaxVolume() {
        let c = 2;
        for (let limb of Object.values(this.limbs)) {
            c += limb.sumUsableVolume();
        }
        return c;
    }

    // TODO make this work with more than one preferred slot e.g. with gloves
    equipDefault(clothing: Clothing) {
        if (clothing.preferredEquipSlot) {
            this.equip(clothing, clothing.preferredEquipSlot[0]);
            return;
        }
        console.log(`can't equip ${clothing.name}`);
    }

    equip(item: Clothing, slot: HumanLimbsPossible) {
        this.limbs[slot]?.equipment.add([item]);
        this.inventory.remove([item]);
        // just in case
        this.maxVolume = this.getMaxVolume();
        // updateInventory();
    }

    static createLimbs(): HumanLimbs {
        return {head: new Limb("head", 40), torso: new Limb("torso", 40), rArm: new Limb("rArm", 40), lArm: new Limb("lArm", 40), rHand: new Limb("rHand", 40),
                lHand: new Limb("lHand", 40), rLeg: new Limb("rLeg", 40), lLeg: new Limb("lLeg", 40), rFoot: new Limb("rFoot", 40), lFoot: new Limb("lFoot", 40)}
    }
}

export class Player extends Human {
    constructor(x: number, y: number) {
        super(x, y, true);
    }

    static createKind(): Player {
        return new Player(0, 0);
    }

    getGender(): string {
        return "male"; //TBC
    }

    getSymbol(): string {
        return "@";
    }

    tick() {
        VIEWPORT.pos = this.pos;
        return;
    }
}

abstract class Animal extends Mob {
    constructor(x: number, y: number) {
        super("animal", false, new Inventory(), "neither", x, y); //TODO implement proper animal generation
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

    elements["Items"].appendChild(displayInventoryList(cell.inventory));
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
// function parseMob(mob: Mob) {
//     // let pronoun = getPronouns(mob);
//     let mobDescription = `${pronoun} wearing `;
//     let clothing = mob.getClothing();

//     if (clothing.length < 1) {
//         return `${pronoun} naked...`;
//     }
//     if (clothing.length === 1) {
//         return `${pronoun} wearing a ${clothing[0].name}.`;
//     }
//     // why did i even do this. "coat, a coat and a coat" vs "3 coats" lol
//     for (let i = 0; i < clothing.length; i++) {
//         if (i === clothing.length - 1) {
//             mobDescription = mobDescription.concat(`and a ${clothing[i].name}.`);
//             continue;
//         }
//         mobDescription = mobDescription.concat(`a ${clothing[i].name}, `);

//     }
//     return mobDescription;
// }

// TODO add "they" for unknown gender etc.
// function getPronouns(mob: Mob) {
//     if (mob.kind === "player") {
//         return "you're";
//     }
//     if (mob.kind !== "human") {
//         return "it's";
//     }
//     if (mob.gender === "male") {
//         return "he's";
//     }
//     return "she's";
// }

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
    usableVolume: number;
    volume: number;
    symbol: string;
    luminescence: Colour;
    opacity: number;
    blocking: boolean;
    lex: Lex;
    constructor(itemKind: ItemKind) {
        this.name = itemKind.name;
        this.weight = itemKind.weight;
        this.volume = itemKind.volume;
        this.usableVolume = itemKind.usableVolume;
        this.symbol = itemKind.symbol;
        this.luminescence = itemKind.luminescence;
        this.opacity = itemKind.opacity;
        this.blocking = itemKind.blocking;
        this.lex = itemKind.lex;
    }

    static createItem(itemName: string) { // TODO implement proper generation of items
        return new Item(ITEMKINDSMAP[itemName]);
    }
}

export class Clothing extends Item {
    insulation: number;
    preferredEquipSlot: HumanLimbsPossible[];
    constructor(kind: ClothingKind) {
        super(kind);
        this.insulation = kind.insulation;
        this.preferredEquipSlot = kind.prefESlots;
    }

    static createItem(itemName: string): Clothing {
        return new Clothing(ITEMKINDSMAP[itemName] as ClothingKind);
    }
}

export function constructClothingKind(name: string, weight: number, volume: number, usableVolume: number, prefESlots: HumanLimbsPossible[], symbol: string, insulation: number, luminescence: Colour, opacity: number, blocking: boolean, lex: Lex) {
    let kind: ClothingKind =
        {name:  name,
        weight: weight,
        volume: volume,
        usableVolume: usableVolume,
        prefESlots: prefESlots,
        symbol: symbol,
        insulation: insulation,
        luminescence: luminescence,
        opacity: opacity,
        blocking: blocking,
        lex: lex,}
    return kind;
}

export function constructItemKind(name: string, weight: number, volume: number, usableVolume: number, symbol: string, luminescence: Colour, opacity: number, blocking: boolean, lex: Lex) {
    let kind: ItemKind =
        {name:  name,
        weight: weight,
        volume: volume,
        usableVolume: usableVolume,
        symbol: symbol,
        luminescence: luminescence,
        opacity: opacity,
        blocking: blocking,
        lex: lex,}
    return kind;
}

export interface ItemKind {
    name: string;
    weight: number;
    volume: number;
    usableVolume: number;
    symbol: string;
    luminescence: Colour;
    opacity: number;
    blocking: boolean;
    lex: Lex;
}

export interface ClothingKind {
    name: string;
    weight: number;
    volume: number;
    prefESlots: HumanLimbsPossible[];
    usableVolume: number;
    insulation: number;
    symbol: string;
    luminescence: Colour;
    opacity: number;
    blocking: boolean;
    lex: Lex;
}

// this whole stats thing needs redoing
export interface ItemStats {
    insulation: number;
    maxSpace?: number;
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
