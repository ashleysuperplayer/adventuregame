
function getElementFromID(id: string): HTMLElement {
    let element = document.getElementById(id);
    if (element) {
        return element;
    }
    else {
        throw new Error("invalid ID");
    }
}

// bresenham stuff i STOLE FROM WIKIPEDIA
function changeColour(x:number, y:number) {
    CELLMAP[`${x},${y}`].color = [0, 255, 0];
}
function plotLineLow(x0: number, y0: number, x1: number, y1: number) {
    let dx = x1 - x0;
    let dy = y1 - y0;
    let yi = 1;
    if (dy < 0) {
        yi = -1;
        dy = -dy;
    }

    let D = (2 * dy) - dx;
    let y = y0;

    for (let x = dx; x < x1; x++) {
        changeColour(x, y);
        if (D > 0) {
            y = y + yi;
            D = D + (2 * (dy - dx));
        }
        else {
            D = D + 2*dy;
        }
    }
}
function plotLineHigh(x0:number, y0:number, x1:number, y1:number) {
    let dx = x1 - x0;
    let dy = y1 - y0;
    let xi = 1;
    if (dx < 0) {
        xi = -1;
        dx = -dx;
    }

    let D = (2 * dx) - dy;
    let x = x0;

    for (let y = dy; y < y1; y++) {
        changeColour(x, y);
        if (D > 0) {
            x = x + xi;
            D = D + (2 * (dx - dy));
        }
        else {
            D = D + 2*dx;
        }
    }
}
function plotLine(x0:number, y0:number, x1:number, y1:number) {
    if (Math.abs(y1 - y0) < Math.abs(x1 - x0)) {
        if (x0 > x1) {
            plotLineLow(x1, y1, x0, y0);
        }
        else {
            plotLineLow(x0, y0, x1, y1);
        }
    }
    else {
        if (y0 > y1) {
            plotLineHigh(x1, y1, x0, y0);
        }
        else {
            plotLineHigh(x0, y0, x1, y1);
        }
    }
}

// function i stole from stackoverflow
function getKeyByValue(object: object, value: any) {
    // @ts-ignore // come back to this later
    return Object.keys(object).find(key => object[key] === value);
}

function printCellProperty(coords = "0,0", property: string) {
    return CELLMAP[property];
}
// throw error when can't set variable
function throwExpression(errorMessage: string): never {
    throw new Error(errorMessage);
}
// check if a number is perfect square
function isPerfectSquare(x: number) {
    return x > 0 && Math.sqrt(x) % 1 === 0;
}
// function for faster debugging
function ZZ(a: number, b: number) {
    return a === 0 && b === 0; // i just hate writing this line out all the time it reminds me i'm still using js lol
}
// placeholder until i get better at maths lol
// returns light level from 0 to AMBLIGHTAMP
function timeToLight(time: number) {
    time = Math.floor(time);
    return (Math.cos(2*Math.PI * time / MINSPERDAY / 10) + 1) * AMBLIGHTAMP * 0.5; // super fast for debug
    // return Math.cos(time / (MINSPERDAY * 10)) * MINSPERDAY / 2 + MINSPERDAY / 2;
}
function printLightingWeights() {
    console.log(`SELFWEIGHT: ${SELFWEIGHT}, ORTHOGWEIGHT: ${ORTHOGWEIGHT}, DIAGWEIGHT: ${DIAGWEIGHT}, AMBAMPLIGHT: ${AMBLIGHTAMP}`);
}

// creates a grid of even height and width.
function createGrid(parentID: string, sideLength: number, cellClass: string, elementsDict: { [key: string]: HTMLElement}) {
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

function tick() {
    TIME += 1;
    PLAYER.executeAction();
    for (let mob in MOBSMAP) {
        MOBSMAP[mob].tick();
    }

    updateLighting();
    updateDisplay();
}

function newLightEmitter(posX=0, posY=0, trajX=0, trajY=0) {
    EMITTERMAP[`${posX},${posY},${trajX},${trajY}`] = new LightEmitter(posX, posY, trajX, trajY);
}

// TODO lighting needs to be calculated for a few cells AROUND where the player can actually see
// calculate lighting based on avg lighting of 4 adjacent cells, there is definitely a better way to do it
function calcCellLighting(cellCoords: string) {
    const cell = CELLMAP[cellCoords] ?? throwExpression(`invalid cell coords LIGHTING "${cellCoords}"`) // needs to return cell
    const x = cell.x;
    const y = cell.y;

    let cum = 0;

    // if (cell.isBlocked()) {
    //     cum = -200;
    // }

    // these will be calculated from "weather lighting" level which is calculated based on time of day and weather
    // remind me to add cloud movement above player
    for (let dY = -1; dY <= 1; dY++) {
        for (let dX = -1; dX <= 1; dX++) {
            const absOffsets = Math.abs(dX) + Math.abs(dY);
            if (absOffsets === 0) {
                cum += CELLMAP[`${x+dX},${y+dY}`].lightLevel * SELFWEIGHT;
            }
            if (absOffsets === 1) {
                cum += CELLMAP[`${x+dX},${y+dY}`].lightLevel * ORTHOGWEIGHT;
            }
            else {
                cum += CELLMAP[`${x+dX},${y+dY}`].lightLevel * DIAGWEIGHT;
            }
        }
    }

    if (!cell.isBlocked()) {
        cum /= LIGHTATTENUATION * 0.97;
    }
    else {
        cum /= (LIGHTATTENUATION * 2);
    }

    // upper limit on lightLevel
    if (cum > 255) {
        cum = 255;
    }

    if (cum < cell.maxLum()) {
        cum = cell.maxLum();
    }

    cell.lightLevel = Math.floor(cum);
};

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

function getMapCellAtDisplayCell(x: number, y: number): Cell
function getMapCellAtDisplayCell(xy: string): Cell
function getMapCellAtDisplayCell(xyOrX: number|string, y?: number): Cell {
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

function updateDisplay() {
    for (let cellY = 0; cellY < 33; cellY++) { // (screen length)
        for (let cellX = 0; cellX < 33; cellX++) { // (screen length)
            displayCell(`${cellX},${cellY}`, `${cellX - 16 + PLAYER.x},${cellY - 16 + PLAYER.y}`);
        }
    }
}

function updateLighting() {
    for (let cellY = -11; cellY < 44; cellY++) { // (screen length) // TODO remove these magical numbers lol
        for (let cellX = -5; cellX < 44; cellX++) { // (screen length)
            calcCellLighting(`${cellX - 16 + PLAYER.x},${cellY - 16 + PLAYER.y}`);
            // definitely a better way to do all this
            // place "seen" cells into a register and then calc their lighting
            // until it drops to/below ambient light and then stop tracking them?
        }
    }
}

function displayCell(displayElementCoords: string, cellCoords: string) {
    // console.log(`displayCell: ${displayElementCoords},${cellCoords}`);
    let displayElement = DISPLAYELEMENTSDICT[displayElementCoords] ?? throwExpression(`invalid display coords ${displayElementCoords}`);
    let itemsElement = ITEMSELEMENTSDICT[displayElementCoords] ?? throwExpression(`invalid item element coords ${displayElementCoords}`);
    let lightElement = LIGHTELEMENTSDICT[displayElementCoords] ?? throwExpression(`invalid light element coords ${displayElementCoords}`);
    let cell = CELLMAP[cellCoords] ?? throwExpression(`invalid cell coords ${cellCoords}`);

    let itemsDisplay = "";
    for (let content of cell.contents) {
        if ("displaySmall" in content) {
            if (!content.displaySmall) {
                displayElement.innerHTML = content.symbol;
            }
            else {
                itemsDisplay += content.symbol;
            }
        }
        else {
            displayElement.innerHTML = content.symbol;
        }
    }

    itemsElement.innerHTML = itemsDisplay;

    // under the current system, ambient light is purely cosmetic for the player
    // in the future, npc's will be beholden to light level and what they can "see" to be able to do stuff
    // this will require reworking the whole lighting system to use rays
    // for now this "works" though
    let lightElementColourAmbient = `${1 - ((cell.lightLevel / 255) + (timeToLight(TIME) / 255))}`;

    if (+lightElementColourAmbient < 0) {
        lightElementColourAmbient = `0`;
    }

    if (+lightElementColourAmbient > 1) {
        lightElementColourAmbient = `1`;
    }
    // all works

    // console.log("lightElementColourAmbient " + lightElementColourAmbient);
    lightElement.style.opacity = lightElementColourAmbient;

    displayElement.style.backgroundColor = `RGB(${cell.color[0]},${cell.color[1]},${cell.color[2]})` // band aid

    // redo this, only allows for one kind of cell contents at a time


    // if (!cell.isVisible) {
    //     displayElement.style.backgroundColor = "black";
    // }
    // else {
    //     displayElement.style.backgroundColor = `rgb(${cell.color})`;
    // }

    // cell.isVisible = false;
    // console.log(`displayCell: HTML cell: ${cellCoords} is displaying location: ${displayElementCoords} with light level ${cell.lightLevel} and effective colour ${effectiveColor}`);
}

function setPlayerAction(newAction: string) {
    // console.log("click!");
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

function convertListToString(someList: number[] | string[], delimiter="") {
    let someString = "";
    for (let i of someList) {
        someString += i + delimiter;
    }

    if (delimiter) {
        return someString.slice(0, -1);
    }
    else {
        return someString;
    }
}

function setup(worldSideLength: number, startTime: number, playerStartLocation: number[]) {
    createGrid("map", 33, "mapCell", DISPLAYELEMENTSDICT);
    createGrid("lightMap", 33, "lightMapCell", LIGHTELEMENTSDICT);
    createGrid("itemsMap", 33, "itemsMapCell", ITEMSELEMENTSDICT);

    NAVIGATIONELEMENT = document.getElementById("navigation") ?? throwExpression("navigation element gone") // for the context menus

    CELLMAP = generateWorld(worldSideLength);

    TIME = startTime;
    setupKeys();
    setupClicks();

    CELLMAP["1,0"].contents = CELLMAP["1,0"].contents.concat(ITEMSMAP["oil lamp"]); // add a lamp

    PLAYER = new Player(playerStartLocation[0], playerStartLocation[1]); // spread ???
    MOBSMAP["1"] = new NPCHuman(2, 2, MOBKINDSMAP["npctest"]);

    // debug stuff

    updateLighting();
    updateDisplay();
}

function setupKeys() {
    window.addEventListener("keydown", (event) => {
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
            if (CTX) {
                CTX.HTMLElement.remove();
            }
            CTX = new CtxParentMenu_Cell(e.clientX, e.clientY, getMapCellAtDisplayCell(displayCellCoords)); // cell should point to whichever cell is clicked, if that's how this works
        }
    },false);
}

function clickTopBar(menuItemName: string) {
    let element = document.getElementById(menuItemName);
    if (element) {
        if (+element.style.height.slice(0, 2) > 0) {
            minimizeMenuItem(menuItemName);
        }
        else {
            maximizeMenuItem(menuItemName);
        }
    }
}

function minimizeMenuItem(menuItemName: string) {
    let element = document.getElementById(menuItemName);
    if (element) {
        element.style.height = "0";
    }
    console.log("minimized " + menuItemName);
}

function maximizeMenuItem(menuItemName: string) {
    let element = document.getElementById(menuItemName);
    if (element) {
        element.style.height = "400px";
    }
    console.log("maximized " + menuItemName);
}

// function contextMenuClick(displayX: number, displayY: number, kind: string, mouseX?: number, mouseY?: number) {
//     let cell = getMapCellAtDisplayCell(displayX, displayY)
//     if (mouseX && mouseY) {
//         if (kind === "navigation") {

//         }
//         }
//     }
// }


function getCellContents(x:number, y:number) {
    return CELLMAP[`${x},${y}`].contents;
}

interface CtxHoverMenuChildren {
    name: string;
    action: Function;
    args: Array<Cell|string|Function>;
}

interface Dim2 {
    height: number;
    width:  number;
}

// create own element > create children > calculate dimensions to fit children > reshape element to accomodate children
abstract class CtxMenuComponent {
    id:     string;
    x:      number;
    y:      number;
    ownCls: string;
    dimensions: Dim2;
    HTMLElement: HTMLElement;
    countChildren: number;
    constructor(id: string, x: number, y: number, ownCls: string) {
        this.id     = id;
        this.x      = x;
        this.y      = y;
        this.ownCls = ownCls;
        this.dimensions = {"height": 0, "width": 0};
        this.HTMLElement = this.createBaseElement();
        this.countChildren = 0;
    }

    countChild() {
        this.countChildren++;
    }

    getHeightFromChildren() {
        return this.countChildren * 20;
    }

    checkDimensions(dimensions: Dim2) {
        if (dimensions) {
            return {"height": dimensions.height, "width": dimensions.width};
        }
        else { // default
            return {"height": 20, "width" : 50};
        }
    }

    // basic menu item, every subclass should use this in their createElement method
    createBaseElement() {
        let element = document.createElement("div");

        element.id = this.id;
        element.classList.add(this.ownCls);

        element.style.left   = `${this.x}px`;
        element.style.top    = `${this.y}px`;

        return element;
    }
}

abstract class CtxParentMenu extends CtxMenuComponent {
    parentElement: HTMLElement;
    HTMLElement:   HTMLElement;
    dimensions:    Dim2;
    constructor(id: string, x: number, y: number, ownCls: string) {
        super(id, x, y, ownCls);
        this.dimensions    = {"height": 0, "width": 0};
        this.parentElement = getElementFromID("ctx");
        this.HTMLElement   = this.createBaseElement();
    }

    retouchDimensions() { // oh lord
        this.HTMLElement.style.height = `${this.dimensions.height}px`;
        this.HTMLElement.style.width  = `${this.dimensions.width}px`;
    }
}

class CtxParentMenu_Cell extends CtxParentMenu {
    cellCtx:       Cell;
    HTMLElement:   HTMLElement;
    takeHoverMenu: CtxHoverMenu_Cell;
    constructor(x: number, y: number, cellCtx: Cell) {
        super("ctxParentMenu_Cell", x, y, "ctxParentMenu");
        this.cellCtx       = cellCtx;
        this.HTMLElement   = this.createElement();   // fine
        this.takeHoverMenu = this.createTakeHoverMenu();
        this.dimensions    = this.getDimensionsFromChildren();
        this.retouchDimensions();
    }

    getDimensionsFromChildren(): Dim2 { // this function sux rn but it will be useful in future
        let dimensions = {height: 0, width: 60};
        // dimensions.width = this.takeHoverMenu.dimensions.width; // temporary fix
        dimensions.height = this.getHeightFromChildren(); // should be 20 * "number of properties less properties that are menu items"
        return dimensions;
    }

    createElement() {
        let element = this.HTMLElement;
        this.parentElement.appendChild(element);
        return element;
    }

    createTakeHoverMenu() {
        // console.log("ctxtakehover x is "+(this.x+this.dimensions.width))
        this.countChild();
        return new CtxHoverMenu_Cell("ctxTakeHover", this.x + this.dimensions.width, this.y + this.dimensions.height, this);
    }
}

abstract class CtxHoverMenu extends CtxMenuComponent { // these base elements all suck, this class definitely will always have children but doesn't have a way to generate them without the subclass hhmmmmm
    parent: CtxParentMenu;
    abstract children: CtxButton[];
    constructor(id: string, x: number, y: number, ownCls: string, parent: CtxParentMenu) {
        super(id, x, y, ownCls);
        this.parent = parent;
    }

    setupHover() {
        this.HTMLElement.addEventListener("mouseover",(e) => {
            this.children.map((c) => {c.HTMLElement.style.display = "block";})
        },false);
        this.HTMLElement.addEventListener("mouseleave",(e) => {
            this.children.map((c) => {c.HTMLElement.style.display = "none";})
        },false);
    }
}

class CtxHoverMenu_Cell extends CtxHoverMenu {
    parent: CtxParentMenu_Cell;
    children:    CtxButton_Cell[];
    HTMLElement: HTMLElement;
    dimensions: Dim2;
    constructor(id: string, x: number, y: number, parent: CtxParentMenu_Cell) {
        super(id, x, y, "ctxHoverMenu", parent);
        this.parent      = parent;
        this.dimensions  = {"height": 20, "width": 60};
        this.children    = this.createChildren();
        this.HTMLElement = this.createElement();
        this.setupHover();
    }

    createChildren(): CtxButton_Cell[] {
        let children: CtxButton_Cell[] = [];
        let childItemIdCounter = 0;
        for (let content of this.parent.cellCtx.contents) {
            children.push(new CtxButton_Cell(`${content.name + childItemIdCounter}Button`, this.x + this.dimensions.width, this.y + (childItemIdCounter * this.dimensions.height), this, () => {PLAYER.take(content.name, this.parent.cellCtx)}, content.name))
            childItemIdCounter++;
        }
        return children;
    }

    createElement(): HTMLElement {
        let element = this.HTMLElement;

        element.style.width  = `${this.dimensions.width}px`;
        element.style.height = `${this.dimensions.height}px`;

        element.innerHTML = "take"; // nooooo

        element.classList.add("CtxHoverChildHolder");

        this.parent.HTMLElement.appendChild(element);

        // append child HTML elements to this one
        for (let child of this.children) {
            element.appendChild(child.HTMLElement);
        }

        return element;
    }
}

abstract class CtxButton extends CtxMenuComponent {
    parent:      CtxHoverMenu|CtxParentMenu;
    action:      Function;
    text:        string;
    constructor(id: string, x: number, y: number, ownCls: string, parent: CtxHoverMenu|CtxParentMenu, action: Function, text: string) {
        super(id, x, y, ownCls);
        this.parent = parent;
        this.action = action;
        this.text   = text;
        this.HTMLElement = this.createElement();
    }

    createElement() {
        let element = this.HTMLElement;

        element.style.height = "20px";
        element.style.width  = `60px`;

        element.innerHTML  = this.text;
        console.log(element.innerHTML);
        element.onclick    = () => {this.click()};

        return element;
    }

    abstract click(): void;
}

class CtxButton_Cell extends CtxButton {
    parent: CtxHoverMenu_Cell|CtxParentMenu_Cell;
    constructor(id: string, x: number, y: number, parent: CtxParentMenu_Cell|CtxHoverMenu_Cell, action: Function, text: string) {
        super(id, x, y, "ctxButton", parent, action, text);
        this.parent = parent;
    }

    click() {
        this.action();
        this.HTMLElement.remove();
    }
}

class Mob {
    name: string;
    x: number;
    y: number;
    currentAction: string;
    symbol: string;
    luminescence: number;
    facing: string;
    blocking: boolean;
    inventory: { [key: string]: InventoryEntry};

    constructor(x: number, y: number, kind: MobKind) {
        this.name = kind.name;
        this.x = x;
        this.y = y;
        this.currentAction = "wait";
        this.symbol = kind.symbol;
        CELLMAP[`${this.x},${this.y}`].contents.push(this);
        this.luminescence = kind.luminescence;
        this.facing = "n";
        this.blocking = true;
        this.inventory = {};
    }

    currentCell() {
        return CELLMAP[`${this.x},${this.y}`];
    }

    move(direction: string, changeFacing: boolean) {
        // remove from old location
        let oldContents = CELLMAP[`${this.x},${this.y}`].contents;
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

        CELLMAP[`${this.x},${this.y}`].contents.push(this);

        this.currentAction = "moved";
    }

    take(name: string, cell: Cell) {
        for (let content of cell.contents) {
            if (content.name === name) {
                console.log(content.name);
                cell.contents.splice(cell.contents.indexOf(content), 1);
                if (!this.inventory[content.name]) {
                    // console.log(this.inventory[content.name].quantity)
                    this.inventory[content.name] = {"item": ITEMSMAP[content.name], "quantity": 1};
                }
                else {
                    this.inventory[content.name].quantity += 1;
                }
                // this.inventory[content.name].quantity += 1 ?? 1;
                break;
            }
        }
    }

    // addToInventory(itemName: string, quantity: number) {
    //     if (!this.inventory[itemName]) {
    //         this.inventory[itemName].item = ITEMSMAP[itemName];
    //         this.inventory[itemName].quantity = 1;
    //     }
    //     else {
    //         this.inventory[itemName].quantity += 1;
    //     }
    // }

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
        // console.log("moved" + this.currentAction);

        this.currentAction = "wait";
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

interface MobKind {
    name: string;
    symbol: string;
    luminescence: number;
}

interface InventoryEntry {
    item: Item;
    quantity: number;
}

class NPCHuman extends Mob {
    x: number;
    y: number;
    currentAction: string;
    symbol: string;
    luminescence: number;
    constructor(x: number, y: number, mobKind: MobKind) {
        super(x, y, mobKind);
        this.x = x;
        this.y = y;
        this.currentAction = "wait";
        this.symbol = mobKind.symbol;
        this.luminescence = mobKind.luminescence;
    }
}

class Player extends Mob {
    x: number;
    y: number;
    currentAction: string;
    constructor(x: number, y: number) {
        super(x, y, MOBKINDSMAP["player"]);
        this.x = x; // idk why this needs to be defined here if it's already defined in parent
        this.y = y;
        this.currentAction = "wait";
    }
}

class Cell {
    x: number;
    y: number;
    contents: CellContents[];
    lightLevel: number;
    color: number[];
    isVisible: Boolean;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.contents = this.genCell() ?? [];
        this.lightLevel = 0;
        // console.log(this.contents);
        this.color = [240, 240, 240];
        this.isVisible = false;
    }

    genCell(): CellContents[] {
        let cellContents = [TERRAINFEATURESMAP["snow"]];
        if (Math.random() < 0.1) {
            cellContents.push(TERRAINFEATURESMAP["tree"]);
        }

        return cellContents;
    }

    isBlocked(): boolean {
        for (let content of this.contents) {
            if (content.blocking) {
                return true;
            }
        }
        return false;
    }

    // return list of luminescences of all content
    allLuminescence(): number[] {
        let lumList: number[] = [];
        if (this.contents) {
            for (let content of this.contents) {
                lumList.push(content.luminescence);
            }
        }
        else {
            throw new Error(`cell without any contents at ${this.x},${this.y}`);
        }

        return lumList;
    }

    // return highest luminesence item of Cell
    maxLum(): number {
        return Math.max(...this.allLuminescence());
    }

    sumOpacity(): number {
        let sum = 0;
        if (this.contents) {
            for (let content of this.contents) {
                sum += content.luminescence;
            }
        }

        return sum;
    }
}

class LightEmitter {
    posX: number;
    posY: number;
    trajX: number;
    trajY: number;
    constructor(posX: number, posY: number, trajX: number, trajY: number) {
        this.posX = posX;
        this.posY = posY;
        this.trajX = trajX;
        this.trajY = trajY;
    }

    tick() {
        RAYMAP[RAYIDCOUNTER] = new LightRay(RAYIDCOUNTER, this.posX, this.posY, this.trajX, this.trajY, 1);
    }
}

class LightRay {
    id: number;
    posX: number;
    posY: number;
    trajectoryX: number;
    trajectoryY: number;
    strength: number;
    delOnNext: Boolean;
    // carryX: number;
    // carryY: number;
    constructor(id: number, posX: number, posY: number, traX: number, traY: number, strength: number) {
        this.id = id;
        this.posX = posX;
        this.posY = posY;
        this.trajectoryX = traX;
        this.trajectoryY = traY;
        this.strength = strength;
        this.delOnNext = false;
        // this.carryX = 0;
        // this.carryY = 0;
        RAYIDCOUNTER += 1;
    }

    cast(carryX=0, carryY=0) { // this could be recursive i think
        // console.log(`ray cast from ${this.posX},${this.posY} with carryX ${carryX}, carryY ${carryY}`);
        let floorTX = Math.floor(this.trajectoryX);
        let floorTY = Math.floor(this.trajectoryY);

        CELLMAP[`${this.posX},${this.posY}`].isVisible = true;

        if (carryX > 1) {
            this.posY += floorTX;
            carryX -= floorTX;
            // console.log(`carryX now ${carryX}`);
        }

        if (carryY > 1) {
            this.posX += floorTY;
            carryY -= floorTY;
            // console.log(`carryY now ${carryY}`);
        }

        if (this.delOnNext === true) {
            delete RAYMAP[this.id];
            return;
        }

        this.posX += floorTX;
        this.posY += floorTY;

        let cellOp = CELLMAP[`${this.posX},${this.posY}`].sumOpacity();
        this.strength -= (cellOp + 0.1);
        if (this.strength <= 0) {
            this.delOnNext = true;
        }

        // console.log(`to ${this.posX},${this.posY}`);
        this.cast(carryX + Math.abs(this.trajectoryX) % 1, carryY + Math.abs(this.trajectoryY) % 1);
    }
}

class ControlState {
    state: string;
    constructor() {
        this.state = "setup";
    }

    inventory() {
        this.state = "inventory";
    }
}

type CellContents = TerrainFeature|Item|Mob;

interface Item {
    name: string;
    weight: number;
    symbol: string;
    luminescence: number;
    opacity: number;
    displaySmall: boolean;
    blocking: boolean;
}

interface TerrainFeature {
    name: string;
    symbol: string;
    luminescence: number;
    opacity: number;
    displaySmall: boolean;
    blocking: boolean;
}

interface Weather {  // this is a placeholder system, in future weather and light will be determined by temperature and humidity etc
    name: string;
    ambientLight: number;
}

// NICE COMBOS:
// SELFWEIGHT: 1, AMBIENTWEIGHT: 0.5, ORTHOGWEIGHT: 0.75, DIAGWEIGHT: 0.5, AMBLIGHTAMP: 0 (correct lighting effect but perpetual night)
// AMBLIGHTAMP = ~200 gives correct range
// SELFWEIGHT: 10, AMBIENTWEIGHT: 1, ORTHOGWEIGHT: 0.5, DIAGWEIGHT: 0.25, AMBAMPLIGHT: 200 (almost correct ambient feel, light tapers too quickly still)
// ^ old
// SELFWEIGHT: 10, ORTHOGWEIGHT: 20, DIAGWEIGHT: 1, AMBAMPLIGHT: 200
let SELFWEIGHT = 10;
let ORTHOGWEIGHT = 20;
let DIAGWEIGHT = 1;
let AMBLIGHTAMP = 200;

let LIGHTATTENUATION = getLA();

function getLA() {
    return SELFWEIGHT + ((ORTHOGWEIGHT + DIAGWEIGHT) * 4) + 1; // this +1 is a band-aid until ""raytracing"" works
}

let NAVIGATIONELEMENT: HTMLElement;

// control states will influence the behaviour of keyboard controls
// they will be things like "navigation", "menu", "inventory" etc
let CONTROLSTATE = new ControlState();

const MINSPERDAY = 1440; // 1440
const TICKSPERMINUTE = 600;

const TICKDURATION = 100;
const TICKSPERDAY = 86400 * (1000 / TICKDURATION);

let CELLMAP: { [key: string]: Cell };
let MOBSMAP: { [id: string]: Mob } = {};

let DISPLAYELEMENTSDICT: { [key: string]: HTMLElement} = {};
let LIGHTELEMENTSDICT: { [key: string]: HTMLElement} = {};
let ITEMSELEMENTSDICT: { [key: string]: HTMLElement} = {};

let RAYMAP: { [id: string]: LightRay} = {};
let EMITTERMAP: { [key: string]: LightEmitter} = {};
let RAYIDCOUNTER = 0;

let MOBKINDSMAP: { [key: string]: MobKind } = {
    "player": {name: "player", symbol: "@", luminescence: 200},
    "npctest": {name: "npctest", symbol: "T", luminescence: 0}
}

// the displaySmall boolean might be dumb jank but i feel dirty checking for Item or TerrainFeature type so
let ITEMSMAP: { [key: string]: Item} = {
    "oil lamp": {name: "light", symbol: "o", luminescence: 125, weight: 2700, opacity: 0, displaySmall: true, blocking: false},
    "rock": {name: "rock", symbol: ".", luminescence: 0, weight: 100, opacity: 0, displaySmall: true, blocking: false}
}

let TERRAINFEATURESMAP: { [key: string]: TerrainFeature } = {
    "tree": {name: "tree", symbol: "#", luminescence: 0, opacity: 0, displaySmall: false, blocking: true},
    "snow": {name: "snow", symbol: "", luminescence: 0, opacity: 0, displaySmall: false, blocking: false}, // use this in a more robust way to display cells. basically if cell.contents content has a "colour", set the cell to that colour.
}

let PLAYER: Player;

let TICKER;

let CTX: CtxParentMenu_Cell;

let TIME: number;

window.addEventListener("load", (event) => {
    // genMap(1024);
    setup(1000, 0, [0,0]);
    TICKER = setInterval(tick, TICKDURATION);
    // tick(); for debugging
});
