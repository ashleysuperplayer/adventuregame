// function creates a grid of even height and width.
function throwExpression(errorMessage: string): never {
    throw new Error(errorMessage);
}

function createGrid(parentID: string, sideLength: number, cellClass: string, elementDict: { [key: string]: HTMLElement}) {
    const parent: HTMLElement = document.getElementById(parentID) ?? throwExpression("parentID not found");

    for (let y = sideLength - 1; y > -1; y--) {
        for (let x = 0; x < sideLength; x++) {
            let cell = document.createElement("div");

            cell.setAttribute("id", `${parentID}${x},${y}`);
            cell.classList.add(cellClass);

            elementDict[`${x},${y}`] = cell;

            parent.appendChild(cell);
        }
    }

    let gridAutoColumn = "auto";

    for (let i = 1; i < sideLength; i++) {
        gridAutoColumn += " auto"; // gridAutoColumn.concat(" auto");
    }

    parent.style.gridTemplateColumns = gridAutoColumn;
}

// check if a number is perfect square
function isPerfectSquare(x: number) {
    return x > 0 && Math.sqrt(x) % 1 === 0;
}

function tick() {
    time += 1;
    // calculateLighting();
    player.executeAction();
    updateDisplay();
}

function calcCellLighting(cellCoords: string) {
    // console.log(`calc cell lighting: ${cellCoords}`)
    const cell = locationMap[cellCoords] ?? throwExpression(`invalid cell coords LIGHTING "${cellCoords}"`) // needs to return cell

    const x = cell.x;
    const y = cell.y;

    // these will be calculated from "weather lighting" level which is calculated based on time of day and weather
    // remind me to add cloud movement above player
    let n = 0;
    let s = 0;
    let e = 0;
    let w = 0;

    n = locationMap[`${x},${y+1}`].lightLevel ?? 0;

    // console.log("north: " + n);

    if (locationMap[`${x},${y-1}`]) {
        s = locationMap[`${x},${y-1}`].lightLevel;
    }
    // console.log("south: " + s);

    if (locationMap[`${x+1},${y}`]) {
        s = locationMap[`${x+1},${y}`].lightLevel;
    }
    // e = locationMap[`${x-1},${y}`].lightLevel || 0;
    // console.log("east: " + e);

    if (locationMap[`${x-1},${y}`]) {
        s = locationMap[`${x-1},${y}`].lightLevel;
    }
    // w = locationMap[`${x+1},${y}`].lightLevel || 0;
    // console.log("west: " + w);

    // return (Math.floor(n) + Math.floor(s) + Math.floor(e) + Math.floor(w)) / 4;
    cell.lightLevel = Math.abs(Math.floor((n + s + e + w) / 4 + 50));
    cell.lightLevel = Math.max(...cell.allLuminescence());
    // console.log(locationMap[cellCoords]);
    // return (n + w) / 2;
};

// generates key value pairs of locationMap as coordinates and Location objects
function generateWorld(sideLengthWorld: number) {
    let newLocationMap: { [key: string]: Cell } = {};

    // offset world gen to generate in a square around 0,0 instead of having 0,0 as the most southwestern point
    sideLengthWorld = Math.floor(sideLengthWorld / 2);

    for (let y = 0 - sideLengthWorld; y < sideLengthWorld; y++) {
        for (let x = 0 - sideLengthWorld; x < sideLengthWorld; x++) {
            // console.log(`genning ${x},${y}`)
            newLocationMap[`${x},${y}`] = new Cell(x, y);
            // console.log(`genned ${x}, ${y} with color ${newLocationMap[x + "," + y].color}`)

        }
    }

    return newLocationMap;
}

function updateDisplay() {
    for (let cellY = 0; cellY < 33; cellY++) { // (screen length)
        for (let cellX = 0; cellX < 33; cellX++) { // (screen length)
            displayCell(`${cellX},${cellY}`, `${cellX - 16 + player.x},${cellY - 16 + player.y}`);
        }
    }
}

function displayCell(displayElementCoords: string, cellCoords: string) {
    // console.log(`displayCell: ${displayElementCoords},${cellCoords}`);
    let displayElement = document.getElementById(displayElementCoords) ?? throwExpression(`invalid display coords ${displayElementCoords}`);
    let cell = locationMap[cellCoords] ?? throwExpression(`invalid cell coords ${cellCoords}`);

    calcCellLighting(cellCoords);

    let effectiveColor: number[] = cell.color.map(x => x - cell.lightLevel);
    for (let i = 0; i < 3; i++) {
        if (effectiveColor[i] > cell.color[i]) {
            effectiveColor[i] = cell.color[i];
        }
    }

    // redo this, only allows for one kind of cell contents at a time
    for (let content of cell.contents) {
        displayElement.innerHTML = content.symbol;
    }

    displayElement.style.backgroundColor = `rgb(${convertListToString(effectiveColor, ",")})`;
    // console.log(`displayCell: HTML cell: ${cellCoords} is displaying location: ${displayElementCoords} with light level ${cell.lightLevel} and effective colour ${effectiveColor}`);

}

// why weird name ?
function setPlayerDo(newAction: string) {
    console.log("click!");
    player.currentAction = newAction;
}

function setup() {
    createGrid("map", 33, "mapCell", mapElementsDict);
    createGrid("lightMap", 33, "lightMapCell", lightMapElementsDict);

    time = 0;
    setupKeys();

    locationMap = generateWorld(40);

    player = new Player(0, 0);

    updateDisplay();
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
        locationMap[`${this.x},${this.y}`].contents.push(this);
        this.luminescence = 0;
    }


    move(direction: string) {
        console.log(direction);

        // remove from old location
        locationMap[`${this.x},${this.y}`].contents = locationMap[`${this.x},${this.y}`].contents.slice(0, -1); // bad implementation fix so it SEEKS AND DESTROYS the mob from contents
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

        locationMap[`${this.x},${this.y}`].contents.push(this);
        // console.log(`location after move: ${this.x},${this.y}`)

        this.currentAction = "moved";
    }
}

interface MobKind {
    name: string;
    symbol: string;
}

class Player extends Mob {
    x: number;
    y: number;
    currentAction: string;

    constructor(x: number, y: number) {
        super(x, y, mobKindsMap["player"]);
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

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.contents = this.genCell() ?? []; // CellContents type
        this.lightLevel = Math.min(...this.allLuminescence());
        // console.log(this.contents);
        this.color = [228, 228, 228];
    }

    genCell(): CellContents[] {
        let cellContents = [terrainFeaturesMap["grass"]];
        if (Math.random() < 0.1) {
            cellContents.push(terrainFeaturesMap["tree"]); // CellContents type
        }

        if (Math.random() < 0.3) {
            cellContents.push(terrainFeaturesMap["rock"]);
        }

        if (this.x === 0 && this.y === 0) {
            cellContents.push(terrainFeaturesMap["light"]);
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

interface Weather {  // RECENT // this is a placeholder system, in future weather and light will be determined by temperature and humidity etc
    name: string;
    ambientLight: number;
}

const ___ = "\u00A0"; // non breaking space character

let locationMap: { [key: string]: Cell };
let mobsMap: { [key: string]: Mob };

let mapElementsDict: { [key: string]: HTMLElement};
let lightMapElementsDict: { [key: string]: HTMLElement};

let mobKindsMap: { [key: string]: MobKind } = {
    "player": {name: "player", symbol: "@"},
}

let terrainFeaturesMap: { [key: string]: TerrainFeature } = {
    "tree": {name: "tree", symbol: "#", luminescence: 0},
    "grass": {name: "grass", symbol: "", luminescence: 0},
    "light": {name: "light", symbol: "o", luminescence: 0},
    "rock": {name: "rock", symbol: ".", luminescence: 0}
}

let weatherMap: { [key: string]: Weather} = { // RECENT
    "sunny": {name: "sunny", ambientLight: 200},
    "rainy": {name: "rainy", ambientLight: 100}
}

let player: Player;

let ticker;

let time: number;

window.addEventListener("load", (event) => {
    // genMap(1024);
    setup();
    ticker = setInterval(tick, 1000);
});
