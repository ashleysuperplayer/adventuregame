import { updateLighting, Colour } from "./light.js";
import { createGrid, getElementFromID, throwExpression, Vector2 } from "./util.js";
import { constructMobSlots, Inventory, SLOTBIAS, updateInventory } from "./inventory.js";
import { CtxParentMenu_Cell, setCTX, clearCTX } from "./menu.js";
import { DISPLAYELEMENTSDICT, LIGHTELEMENTSDICT, ITEMSELEMENTSDICT, updateDisplay } from "./display.js";
export function getMapCellAtDisplayCell(x, y) {
    return CELLMAP[`${x - 16 + PLAYER.pos.x},${y - 16 + PLAYER.pos.y}`];
}
export function getSquareDistanceBetweenCells(cell1, cell2) {
    return getSquareDistanceBetweenCoords(cell1.x, cell1.y, cell2.x, cell2.y);
}
// square root to get actual distance
function getSquareDistanceBetweenCoords(x1, y1, x2, y2) {
    return (x1 - x2) ** 2 + (y1 - y2) ** 2;
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
    globalThis.PLAYER = new Player(playerStartLocation.x, playerStartLocation.y);
    globalThis.VIEWPORT.pos = PLAYER.pos;
    globalThis.TIME = startTime;
    globalThis.MINSPERDAY = 1440;
    setupKeys();
    setupClicks();
    CELLMAP["1,0"].inventory.add([Item.createItem("oil lamp"), Item.createItem("coat")]); // add a lamp
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
export class Mob {
    name;
    pos;
    currentAction;
    symbol;
    facing;
    blocking;
    equipment;
    inventory;
    stats;
    kind;
    gender;
    fullName;
    constructor(x, y, kind) {
        this.name = kind.name;
        this.equipment = constructMobSlots();
        this.pos = new Vector2(x, y);
        CELLMAP[`${this.pos}`].mobs.push(this);
        this.currentAction = "wait";
        this.symbol = kind.symbol;
        this.facing = "n";
        this.blocking = true;
        this.inventory = new Inventory();
        this.stats = this.baseStats();
        this.kind = kind.name;
        this.gender = Math.random() > 0.5 ? "male" : "female";
    }
    // TODO make this work with more than one preferred slot e.g. with gloves
    equipDefault(item) {
        if (item.preferredEquipSlot) {
            this.equip(item, item.preferredEquipSlot[0]);
            return;
        }
        console.log(`can't equip ${item.name}`);
    }
    equip(item, slot) {
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
        let stats = { inInsul: 0, extInsul: 0 };
        for (let currentSlotKey in this.equipment) { // go into this.equipment
            for (let item of this.equipment[currentSlotKey].items) { // go into items on inventory on this.equipment
                if (!item.preferredEquipSlot) { // make sure item is wearable
                    console.log("impossible to have this item equipped");
                    continue;
                }
                stats = Mob.sumStats(stats, (item.preferredEquipSlot.includes(currentSlotKey)) ?
                    { inInsul: item.stats.insulation * SLOTBIAS[currentSlotKey].inInsul, extInsul: item.stats.insulation * SLOTBIAS[currentSlotKey].extInsul } :
                    { inInsul: item.stats.insulation * 0.1, extInsul: item.stats.insulation * 0.1 });
            }
        }
        return stats;
    }
    // return unordered list of all clothing Items worn by a mob
    getClothing() {
        let clothingList = [];
        Object.values(this.equipment).forEach((i) => { clothingList = clothingList.concat(i.items); });
        console.log(clothingList);
        return clothingList;
    }
    // temporary function for debugging
    static sumStats(s1, s2) {
        let s3 = { inInsul: 0, extInsul: 0 };
        s3.inInsul = s1.inInsul + s2.inInsul;
        s3.extInsul = s1.extInsul + s2.extInsul;
        return s3;
    }
    // apply stats to Mob based on StatDelta object
    // definitely a much better way to do this once i figure out indexing by string without bypassing typescript
    applyStats(statChange) {
        if (statChange.inInsul) {
            this.stats.inInsul += statChange.inInsul;
        }
        if (statChange.extInsul) {
            this.stats.extInsul += statChange.extInsul;
        }
    }
    // return base MobStats object
    baseStats() {
        return { inInsul: 0, extInsul: 0 };
    }
    // returns the current cell of this Mob
    getCell() {
        return CELLMAP[`${this.pos}`];
    }
    // initiates movement of Mob in direction
    move(direction, changeFacing) {
        // remove from old location
        let oldContents = CELLMAP[`${this.pos}`].mobs;
        oldContents.splice(oldContents.indexOf(this), 1);
        switch (direction) {
            case "north":
                if (!checkIfCellBlocked(this.pos.x, this.pos.y + 1)) {
                    if (changeFacing) {
                        this.facing = "n";
                    }
                    this.pos.y += 1;
                }
                break;
            case "south":
                if (!checkIfCellBlocked(this.pos.x, this.pos.y - 1)) {
                    if (changeFacing) {
                        this.facing = "s";
                    }
                    this.pos.y -= 1;
                }
                break;
            case "east":
                if (!checkIfCellBlocked(this.pos.x + 1, this.pos.y)) {
                    if (changeFacing) {
                        this.facing = "e";
                    }
                    this.pos.x += 1;
                }
                break;
            case "west":
                if (!checkIfCellBlocked(this.pos.x - 1, this.pos.y)) {
                    if (changeFacing) {
                        this.facing = "w";
                    }
                    this.pos.x -= 1;
                }
                break;
        }
        CELLMAP[`${this.pos}`].mobs.push(this);
        this.currentAction = "moved";
    }
    // remove 1 item from Cell Inventory and place into Mob's Inventory
    take(item, cell) {
        if (cell.inventory.remove([item])) {
            this.inventory.add([item]);
        }
        else {
            console.log("not there");
        }
    }
    // called every tick to execute Mob's currentAction, quantizes Mob actions into tick lengths
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
// TODO separate out into NPCHuman extends Human
class NPCHuman extends Mob {
    constructor(x, y, mobKind) {
        super(x, y, mobKind);
    }
    tick() {
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
    constructor(x, y, kind) {
        super(x, y, kind);
        this.blocking = false;
        this.inventory.add([Item.createItem("oil lamp")]);
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
        this.inventory.items[0].luminescence = new Colour(Math.random() * 255, Math.random() * 255, Math.random() * 255);
        this.executeAction();
    }
}
export class Player extends Mob {
    constructor(x, y) {
        super(x, y, MOBKINDSMAP["player"]);
        this.gender = "male"; // TBC
    }
    tick() {
        VIEWPORT.pos = this.pos;
        return;
    }
}
// convert the contents of Cell into a big paragraph using its components' Lex property
export function parseCell(cell) {
    let cellDescAppend = (x) => { cellDescription = cellDescription.concat(x); };
    if (cell.lightLevel.mag() < 11) {
        return "you can't see a thing, but for the darkness.";
    }
    let cellDescription = `the ground ${cell.ground.lex.cellDesc}. `;
    for (let terrain of cell.terrain) {
        cellDescAppend(`there ${terrain.lex.cellDesc}. `);
    }
    for (let item of new Set(cell.inventory.items)) {
        const quantity = cell.inventory.returnByName(item.name).length;
        if (quantity > 1) {
            cellDescAppend(`there ${item.lex.cellDescXPlural(quantity)}. `);
            continue;
        }
        cellDescAppend(`there ${item.lex.cellDesc}. `);
    }
    for (let mob of cell.mobs) {
        if (mob === PLAYER) {
            cellDescAppend(`you are here. `);
            cellDescAppend(parseMob(mob));
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
            cellDescAppend(parseMob(mob));
        }
    }
    return cellDescription;
}
// TODO change this and items to work with Lex
function parseMob(mob) {
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
function getPronouns(mob) {
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
// aids parseCell in translation into sentences
export class Lex {
    // defined in the form "there " + cellDesc + "." i.e. "there [is a lamp]."
    cellDesc;
    // defined in form "there ", cellDescP[0], quantity, cellDescP[1], "." i.e. "there [are ][7][ lamps]."
    cellDescP;
    constructor(cellDesc, cellDescP) {
        this.cellDesc = cellDesc;
        this.cellDescP = cellDescP;
    }
    // splice x into the middle of cellDescP
    cellDescXPlural(x) {
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
    name;
    weight;
    space;
    symbol;
    luminescence;
    opacity;
    blocking;
    lex;
    stats;
    preferredEquipSlot;
    constructor(itemKind) {
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
    static createItem(itemName) {
        return new Item(ITEMKINDSMAP[itemName]);
    }
}
export function constructItemKind(name, weight, space, symbol, luminescence, opacity, blocking, lex, stats, preferredEquipSlot) {
    let kind = { name: name,
        weight: weight,
        space: space,
        symbol: symbol,
        luminescence: luminescence,
        opacity: opacity,
        blocking: blocking,
        lex: lex,
        stats: stats };
    if (preferredEquipSlot) {
        kind.preferredEquipSlot = preferredEquipSlot;
    }
    return kind;
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
        this.ground = Cell.genGround();
        this.terrain = Cell.genTerrain();
        this.color = this.ground.blendMode();
        // inventory should have a way to generate items depending on some seeds
        this.inventory = new Inventory();
        this.lightLevel = Colour.Zero();
        this.isVisible = false;
    }
    static genGround() {
        // if (Math.random() > 0.99) {
        //     return GROUNDTYPEKINDSMAP["mud"];
        // }
        return GROUNDTYPEKINDSMAP["snow"];
    }
    static genTerrain() {
        let terrainFeatures = [];
        if (Math.random() < 0.1) {
            terrainFeatures.push(TERRAINFEATUREKINDSMAP["tree"]);
        }
        return terrainFeatures;
    }
    // returns true if something on cell would block something else with collision
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
    maxLum() {
        return Colour.sum(this.allLuminescence());
    }
    sumOpacity() {
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
    lex;
    constructor(name, color, blendMode, lex) {
        this.name = name;
        this.color = color;
        this.blendMode = this.getBlendMode(blendMode);
        this.lex = lex;
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
    }
    mudBlend() {
        const r = Math.random() * 400 - 200;
        return this.color.add(new Colour(r, r, r));
    }
    clayBlend() {
        const random = Math.random();
        if (random > 0.5) {
            return new Colour(169, 108, 80);
        }
        else {
            return new Colour(172, 160, 125);
        }
    }
}
//# sourceMappingURL=world.js.map