// TODO change all getElementByIds in relation to display cells to use their respective dicts instead
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
    // i just hate writing this line out all the time it reminds me i'm still using js lol
    return a === 0 && b === 0;
}
// placeholder until i get better at maths lol
// return makesAWave(time / (stops it from going too fast)) * This makes it go from -700ish to +700 ish + this makes the whole range positive
function getLighting(time: number) {
    return (Math.cos(2*Math.PI * time / MINSPERDAY) + 1) * AMBLIGHTAMP * 0.5; // super fast for debug
    // return Math.cos(time / (MINSPERDAY * 10)) * MINSPERDAY / 2 + MINSPERDAY / 2;
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
        gridAutoColumn += " auto"; // gridAutoColumn.concat(" auto");
    }

    parent.style.gridTemplateColumns = gridAutoColumn;
}

function tick() {
    TIME += 1;
    // console.log(getLighting(TIME));
    console.log(`time: ${Math.floor(TIME/60)}:${Math.floor(TIME%60)}`);

    PLAYER.executeAction();
    updateDisplay();
}

// TODO lighting needs to be calculated for a few cells AROUND where the player can actually see
// calculate lighting based on avg lighting of 4 adjacent cells, there is definitely a better way to do it
function calcCellLighting(cellCoords: string) {
    const cell = CELLMAP[cellCoords] ?? throwExpression(`invalid cell coords LIGHTING "${cellCoords}"`) // needs to return cell
    const x = cell.x;
    const y = cell.y;
    const ambientLight = Math.floor(getLighting(TIME));

    let newLightLevel = 0; // 0

    for (let content of cell.contents) {
        newLightLevel += content.luminescence;
    }

    // if (ZZ(x, y)) {
    //     console.log("------------");
    //     console.log("after contents " + newLightLevel)
    // }

    // if (ZZ(x, y)) {

    // }

    // if (newLightLevel > 0) {
    //     cell.lightLevel = newLightLevel;
    //     return;
    // }

    // if (ZZ(x, y)) {
    //     console.log("ambient light level " + ambientLight);
    // }

    // newLightLevel += ambientLight;

    // if (ZZ(x, y)) {
    //     console.log("before ambient light " + newLightLevel);
    // }
    // if (ifZeroZero(x, y)) {
    // }

    let cum = ambientLight * AMBIENTWEIGHT;

    for (let dY = -1; dY <= 1; dY++) {
        for (let dX = -1; dX <= 1; dX++) {
            const absOffsets = Math.abs(dX) + Math.abs(dY);
            if (absOffsets === 0) {
                // cum += CELLMAP[`${x+dX},${y+dY}`].lightLevel * SELFWEIGHT;
            }
            if (absOffsets === 1) {
                cum += CELLMAP[`${x+dX},${y+dY}`].lightLevel * ORTHOGWEIGHT;
            }
            else {
                cum += CELLMAP[`${x+dX},${y+dY}`].lightLevel * DIAGWEIGHT;
            }
        }
    }

    // if (ZZ(x,y)) {
    //     console.log(`cum: ${cum}, LIGHTATTENUATION: ${LIGHTATTENUATION}, cum/LIGHTATTENUATION: ${cum/LIGHTATTENUATION}`)
    // }

    // return (Math.floor(n) + Math.floor(s) + Math.floor(e) + Math.floor(w)) / 4;
    newLightLevel += cum / LIGHTATTENUATION;

    // if (ZZ(x, y)) {
    //     console.log("after averaging " + newLightLevel);
    // }

    // newLightLevel += -ambientLight - 1;

    // if (ZZ(x, y)) {
    //     console.log("after rest of maths " + newLightLevel);
    // }

    // upper limit on lightLevel
    if (newLightLevel > 255) {
        newLightLevel = 255;
    }

    if (newLightLevel < 0) {
        newLightLevel = 0;
    }

    // if (ZZ(x, y)) {
    //     console.log("after limiting and ambient light floor " + newLightLevel);
    // }

    cell.lightLevel = newLightLevel;
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

function updateDisplay() {
    for (let cellY = 0; cellY < 33; cellY++) { // (screen length)
        for (let cellX = 0; cellX < 33; cellX++) { // (screen length)
            displayCell(`${cellX},${cellY}`, `${cellX - 16 + PLAYER.x},${cellY - 16 + PLAYER.y}`);
        }
    }
}

function displayCell(displayElementCoords: string, cellCoords: string) {
    // console.log(`displayCell: ${displayElementCoords},${cellCoords}`);
    let displayElement = DISPLAYELEMENTSDICT[displayElementCoords] ?? throwExpression(`invalid display coords ${displayElementCoords}`);
    let lightElement = LIGHTELEMENTSDICT[displayElementCoords] ?? throwExpression(`invalid light element coords ${displayElementCoords}`);
    let cell = CELLMAP[cellCoords] ?? throwExpression(`invalid cell coords ${cellCoords}`);

    calcCellLighting(cellCoords);

    lightElement.style.opacity = `${1 - (cell.lightLevel / 255)}`;

    // redo this, only allows for one kind of cell contents at a time
    for (let content of cell.contents) {
        displayElement.innerHTML = content.symbol;
    }
    // console.log(`displayCell: HTML cell: ${cellCoords} is displaying location: ${displayElementCoords} with light level ${cell.lightLevel} and effective colour ${effectiveColor}`);
}

// why weird name ?
function setPlayerDo(newAction: string) {
    console.log("click!");
    PLAYER.currentAction = newAction;
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

function setupKeys() {
    window.addEventListener("keydown", (event) => {
        switch (event.key) {
            case "ArrowUp":
                setPlayerDo("north");
                break;
            case "ArrowLeft":
                setPlayerDo("west");
                break;
            case "ArrowDown":
                setPlayerDo("south");
                break;
            case "ArrowRight":
                setPlayerDo("east");
                break;
        }
    });
}

function setup(worldSideLength: number, startTime: number, playerStartLocation: number[]) {
    createGrid("map", 33, "mapCell", DISPLAYELEMENTSDICT);
    createGrid("lightMap", 33, "lightMapCell", LIGHTELEMENTSDICT);

    CELLMAP = generateWorld(worldSideLength);

    TIME = startTime;
    setupKeys();

    PLAYER = new Player(playerStartLocation[0], playerStartLocation[1]); // spread ???

    updateDisplay();
}

class Mob {
    x: number;
    y: number;
    currentAction: string;
    symbol: string;
    luminescence: number;

    constructor(x: number, y: number, kind: MobKind) {
        this.x = x;
        this.y = y;
        this.currentAction = "wait";
        this.symbol = kind.symbol;
        CELLMAP[`${this.x},${this.y}`].contents.push(this);
        this.luminescence = kind.luminescence;
    }


    move(direction: string) {
        console.log(direction);

        // remove from old location
        CELLMAP[`${this.x},${this.y}`].contents = CELLMAP[`${this.x},${this.y}`].contents.slice(0, -1); // bad implementation fix so it SEEKS AND DESTROYS the mob from contents
        // console.log(`location before move: ${this.x},${this.y}`);

        switch(direction) {
            case "north":
                this.y += 1;
                break;
            case "south":
                this.y -= 1;
                break;
            case "east":
                this.x += 1;
                break;
            case "west":
                this.x -= 1;
                break;
        }

        CELLMAP[`${this.x},${this.y}`].contents.push(this);
        // console.log(`location after move: ${this.x},${this.y}`)

        this.currentAction = "moved";
    }
}

interface MobKind {
    name: string;
    symbol: string;
    luminescence: number;
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

    executeAction() {
        switch(this.currentAction) {
            case "north":
                this.move("north");
                break;
            case "south":
                this.move("south");
                break;
            case "east":
                this.move("east");
                break;
            case "west":
                this.move("west");
                break;
        }

        this.currentAction = "wait";
    }
}

class Cell {
    x: number;
    y: number;
    contents: CellContents[];
    lightLevel: number;
    color: number[];
    weather: Weather;

    constructor(x: number, y: number, weather = "dark") {
        this.x = x;
        this.y = y;
        this.contents = this.genCell() ?? []; // CellContents type
        this.lightLevel = 0;
        // console.log(this.contents);
        this.color = [228, 228, 228];
        this.weather = WEATHERMAP[weather];
    }

    genCell(): CellContents[] {
        let cellContents = [TERRAINFEATURESMAP["grass"]];
        if (Math.random() < 0.1) {
            cellContents.push(TERRAINFEATURESMAP["tree"]); // CellContents type
        }

        if (Math.random() < 0.3) {
            cellContents.push(TERRAINFEATURESMAP["rock"]);
        }

        if (this.x === 5 && this.y === 0) {
            cellContents.push(TERRAINFEATURESMAP["light"]);
        }

        return cellContents;
    }

    // return list of luminescences of all content
    allLuminescence(): number[] {
        let lumList: number[] = [];
        for (let content of this.contents) {
            lumList.push(content.luminescence);
        }

        return lumList;
    }

    // i might be being stupid, maybe add up the luminescence of all objects and work with that as "lightLevel" instead
    // return highest luminesence item of Cell
    maxLum() {
        return Math.max(...this.allLuminescence());
    }
}

type CellContents = TerrainFeature|Item|Mob;

interface Item {
    name: string;
    weight: number;
    symbol: string;
    luminescence: number;
}

interface TerrainFeature {
    name: string;
    symbol: string;
    luminescence: number;
}

interface Weather {  // this is a placeholder system, in future weather and light will be determined by temperature and humidity etc
    name: string;
    ambientLight: number;
}

const ___ = "\u00A0"; // non breaking space character

// lighting constants
let SELFWEIGHT = 3;
let ORTHOGWEIGHT = 2;
let DIAGWEIGHT = 1;
let AMBIENTWEIGHT = 0.01;
let AMBLIGHTAMP = 10000;

let LIGHTATTENUATION = SELFWEIGHT + ((ORTHOGWEIGHT + DIAGWEIGHT) * 4) + AMBIENTWEIGHT;

function recalcLA() {
    LIGHTATTENUATION = SELFWEIGHT + ((ORTHOGWEIGHT + DIAGWEIGHT) * 4) + AMBIENTWEIGHT;
}

const MINSPERDAY = 60 * 24;
// const TICKSPERMINUTE = 600;

const TICKDURATION = 100;
const TICKSPERDAY = 86400 * (1000 / TICKDURATION);

let CELLMAP: { [key: string]: Cell };
let MOBSMAP: { [key: string]: Mob };

let DISPLAYELEMENTSDICT: { [key: string]: HTMLElement} = {};
let LIGHTELEMENTSDICT: { [key: string]: HTMLElement} = {};

let MOBKINDSMAP: { [key: string]: MobKind } = {
    "player": {name: "player", symbol: "@", luminescence: 255},
}

let TERRAINFEATURESMAP: { [key: string]: TerrainFeature } = {
    "tree": {name: "tree", symbol: "#", luminescence: 0},
    "grass": {name: "grass", symbol: "", luminescence: 0},
    "light": {name: "light", symbol: "o", luminescence: 125},
    "rock": {name: "rock", symbol: ".", luminescence: 0}
}

let WEATHERMAP: { [key: string]: Weather} = { // RECENT
    "sunny": {name: "sunny", ambientLight: 200},
    "rainy": {name: "rainy", ambientLight: 100},
    "dark": {name: "dark", ambientLight: 0}
}

let PLAYER: Player;

let TICKER;

let TIME: number;

window.addEventListener("load", (event) => {
    // genMap(1024);
    // world side, start time, player location
    setup(1000, 0, [0,0]);
    TICKER = setInterval(tick, TICKDURATION);
});
