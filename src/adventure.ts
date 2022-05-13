// TODO change all getElementByIds in relation to display cells to use their respective dicts instead

// throw error when can't set variable
function throwExpression(errorMessage: string): never {
    throw new Error(errorMessage);
}
// check if a number is perfect square
function isPerfectSquare(x: number) {
    return x > 0 && Math.sqrt(x) % 1 === 0;
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
    time += 1;
    player.executeAction();
    updateDisplay();
}

// TODO lighting needs to be calculated for a few cells AROUND where the player can actually see
// calculate lighting based on avg lighting of 4 adjacent cells, there is definitely a better way to do it
function calcCellLighting(cellCoords: string) {
    const cell = cellMap[cellCoords] ?? throwExpression(`invalid cell coords LIGHTING "${cellCoords}"`) // needs to return cell
    const maxLum = Math.max(...cell.allLuminescence());

    const ambientLight = getWeather(cellCoords);

    const x = cell.x;
    const y = cell.y;

    if (maxLum === 0) {
        // these will be calculated from "weather lighting" level which is calculated based on time of day and weather
        // remind me to add cloud movement above player
        let n = cellMap[`${x},${y+1}`].lightLevel ?? 0;
        let s = cellMap[`${x},${y-1}`].lightLevel ?? 0;
        let e = cellMap[`${x+1},${y}`].lightLevel ?? 0;
        let w = cellMap[`${x-1},${y}`].lightLevel ?? 0;

        // return (Math.floor(n) + Math.floor(s) + Math.floor(e) + Math.floor(w)) / 4;
        cell.lightLevel = Math.floor((n + s + e + w) / 4);
    }
    else {
        cell.lightLevel = maxLum;
    }
    // console.log(locationMap[cellCoords]);
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
            displayCell(`${cellX},${cellY}`, `${cellX - 16 + player.x},${cellY - 16 + player.y}`);
        }
    }
}

function displayCell(displayElementCoords: string, cellCoords: string) {
    // console.log(`displayCell: ${displayElementCoords},${cellCoords}`);
    let displayElement = displayElementsDict[displayElementCoords] ?? throwExpression(`invalid display coords ${displayElementCoords}`);
    let lightElement = lightElementsDict[displayElementCoords] ?? throwExpression(`invalid light element coords ${displayElementCoords}`);
    let cell = cellMap[cellCoords] ?? throwExpression(`invalid cell coords ${cellCoords}`);

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
    player.currentAction = newAction;
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
    createGrid("map", 33, "mapCell", displayElementsDict);
    createGrid("lightMap", 33, "lightMapCell", lightElementsDict);

    cellMap = generateWorld(worldSideLength);

    time = startTime;
    setupKeys();

    player = new Player(playerStartLocation[0], playerStartLocation[1]); // spread ???

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
        cellMap[`${this.x},${this.y}`].contents.push(this);
        this.luminescence = kind.luminescence;
    }


    move(direction: string) {
        console.log(direction);

        // remove from old location
        cellMap[`${this.x},${this.y}`].contents = cellMap[`${this.x},${this.y}`].contents.slice(0, -1); // bad implementation fix so it SEEKS AND DESTROYS the mob from contents
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

        cellMap[`${this.x},${this.y}`].contents.push(this);
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
        this.lightLevel = Math.max(...this.allLuminescence());
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

interface Weather {  // RECENT // this is a placeholder system, in future weather and light will be determined by temperature and humidity etc
    name: string;
    ambientLight: number;
}

const ___ = "\u00A0"; // non breaking space character

let cellMap: { [key: string]: Cell };
let mobsMap: { [key: string]: Mob };

let displayElementsDict: { [key: string]: HTMLElement} = {};
let lightElementsDict: { [key: string]: HTMLElement} = {};

let mobKindsMap: { [key: string]: MobKind } = {
    "player": {name: "player", symbol: "@", luminescence: 255},
}

let terrainFeaturesMap: { [key: string]: TerrainFeature } = {
    "tree": {name: "tree", symbol: "#", luminescence: 0},
    "grass": {name: "grass", symbol: "", luminescence: 0},
    "light": {name: "light", symbol: "o", luminescence: 125},
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
    setup(1000, 0, [0,0]);
    ticker = setInterval(tick, 10);
});
