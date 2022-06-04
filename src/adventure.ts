// bresenham shit I STOLE FROM WIKIPEDIA
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
        gridAutoColumn += " auto"; // gridAutoColumn.concat(" auto");
    }

    parent.style.gridTemplateColumns = gridAutoColumn;
}

function tick() {
    TIME += 1;
    // console.log(`time: ${Math.floor((TIME/24)/60)}:${Math.floor(TIME/60%60%24)}:${Math.floor(TIME%60)}`);
    // console.log(timeToLight(TIME));
    PLAYER.executeAction();
    for (let mob in MOBSMAP) {
        MOBSMAP[mob].tick();
    }

    console.log(timeToLight(TIME));

    // for (let x = -2; x < 2; x+=0.05) {
    //     for (let y = -2; y < 2; y+=0.05) {
    //         RAYMAP[RAYIDCOUNTER] = new LightRay(RAYIDCOUNTER, PLAYER.x, PLAYER.y, Number(x.toFixed(2)), Number(y.toFixed(2)), 1);
    //         // console.log(`light ray created at ${PLAYER.x}, ${PLAYER.y}, trajectory ${x.toFixed(2)},${y.toFixed(2)}`);
    //     }
    // }
    // for (let emitter in EMITTERMAP) {
    //     EMITTERMAP[emitter].tick();
    // }
    // for (let ray in RAYMAP) {
    //     RAYMAP[ray].cast();
    //     // console.log(`ray ${ray} cast`);
    // }
    // console.log("completed lighting pass");
    updateDisplay();
    // clearInterval(TIMER);
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
    const currAmbientLight = timeToLight(TIME);
    // const oldAmbientLight = timeToLight(TIME-1); // this feels hacky and dangerous

    let cum = 0;

    // if (ifZeroZero(x, y)) {
    //     console.log("after contents " + newLightLevel);
    // }

    // newLightLevel += ambientLight;

    // if (ifZeroZero(x, y)) {
    //     console.log("after ambient light " + newLightLevel);
    // }

    // these will be calculated from "weather lighting" level which is calculated based on time of day and weather
    // remind me to add cloud movement above player
    for (let dY = -1; dY <= 1; dY++) {
        for (let dX = -1; dX <= 1; dX++) {
            const absOffsets = Math.abs(dX) + Math.abs(dY);
            if (absOffsets === 0) {
                // cum += CELLMAP[`${x+dX},${y+dY}`].lightLevel * SELFWEIGHT
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

    // SELFWEIGHT: 10, ORTHOGWEIGHT: 0.75, DIAGWEIGHT: 0.3, AMBAMPLIGHT: 200 sort of works but it still ßux
    cum /= LIGHTATTENUATION;

    // cum -= oldAmbientLight;

    // cum += currAmbientLight;

    // cum *= 0.98;

    // if (ifZeroZero(x, y)) {
    //     console.log("after averaging " + newLightLevel);
    // }

    // newLightLevel += ambientLight - 1;

    // if (ifZeroZero(x, y)) {
    //     console.log("after rest of maths " + newLightLevel);
    // }

    // if (cum < currAmbientLight) {
    //     cum += 5;
    // }
    // else if (cum > currAmbientLight) {
    //     cum -= 5;
    // }

    // upper limit on lightLevel
    if (cum > 255) {
        cum = 255;
    }

    // if (cum < currAmbientLight) {
    //     cum = currAmbientLight;
    // }

    if (cum < cell.maxLum()) {
        cum = cell.maxLum();
    }

    // if (ifZeroZero(x, y)) {
    //     console.log("after limiting and ambient light floor " + newLightLevel);
    // }

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

    let lightElementColourAmbient = `${1 - ((cell.lightLevel / 255) + (timeToLight(TIME) / 255))}`;
    // +lightElementColourAmbient += ;

    if (+lightElementColourAmbient < 0) {
        lightElementColourAmbient = `0`;
    }

    if (+lightElementColourAmbient > 1) {
        lightElementColourAmbient = `1`;
    }
    // all works

    // console.log("lightElementColourAmbient " + lightElementColourAmbient);
    lightElement.style.opacity = lightElementColourAmbient;

    // redo this, only allows for one kind of cell contents at a time
    for (let content of cell.contents) {
        displayElement.innerHTML = content.symbol;
    }

    // if (!cell.isVisible) {
    //     displayElement.style.backgroundColor = "black";
    // }
    // else {
    //     displayElement.style.backgroundColor = `rgb(${cell.color})`;
    // }

    cell.isVisible = false;
    // console.log(`displayCell: HTML cell: ${cellCoords} is displaying location: ${displayElementCoords} with light level ${cell.lightLevel} and effective colour ${effectiveColor}`);
}

function setPlayerAction(newAction: string) {
    // console.log("click!");
    PLAYER.currentAction = newAction;
}

function setMobAction(mobID: string, newAction: string) {
    MOBSMAP[mobID].currentAction = newAction;
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
    MOBSMAP["1"] = new NPCHuman(2, 2, MOBKINDSMAP["npctest"]);

    updateDisplay();
}

class Mob {
    x: number;
    y: number;
    currentAction: string;
    symbol: string;
    luminescence: number;
    facing: string;

    constructor(x: number, y: number, kind: MobKind) {
        this.x = x;
        this.y = y;
        this.currentAction = "wait";
        this.symbol = kind.symbol;
        CELLMAP[`${this.x},${this.y}`].contents.push(this);
        this.luminescence = kind.luminescence;
        this.facing = "n";
    }


    move(direction: string) {
        // remove from old location
        CELLMAP[`${this.x},${this.y}`].contents = CELLMAP[`${this.x},${this.y}`].contents.slice(0, -1); // bad implementation fix so it SEEKS AND DESTROYS the mob from contents

        switch(direction) {
            case "north":
                this.y += 1;
                this.facing = "n";
                break;
            case "south":
                this.y -= 1;
                this.facing = "s";
                break;
            case "east":
                this.x += 1;
                this.facing = "e";
                break;
            case "west":
                this.x -= 1;
                this.facing = "w";
                break;
        }

        CELLMAP[`${this.x},${this.y}`].contents.push(this);

        this.currentAction = "moved";
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
        // console.log("moved" + this.currentAction);

        this.currentAction = "wait";
    }

    tick(): void {
        let rand = Math.random();
        // console.log(rand);
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
    weather: Weather;
    isVisible: Boolean;

    constructor(x: number, y: number, weather = "dark") {
        this.x = x;
        this.y = y;
        this.contents = this.genCell() ?? []; // CellContents type
        this.lightLevel = 0;
        // console.log(this.contents);
        this.color = [228, 228, 228];
        this.weather = WEATHERMAP[weather];
        this.isVisible = false;
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

    sumOpacity() {
        let cum = 0;
        for (let content of this.contents) {
            cum += content.luminescence;
        }
        return cum;
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
    opacity: number;
}

interface Weather {  // this is a placeholder system, in future weather and light will be determined by temperature and humidity etc
    name: string;
    ambientLight: number;
}

// right now i'm messing around with these to find some combination that makes nice lighting
// NICE COMBOS:
// SELFWEIGHT: 1, AMBIENTWEIGHT: 0.5, ORTHOGWEIGHT: 0.75, DIAGWEIGHT: 0.5, AMBLIGHTAMP: 0 (correct lighting effect but perpetual night)
// AMBLIGHTAMP = ~200 gives correct range
// SELFWEIGHT: 10, AMBIENTWEIGHT: 1, ORTHOGWEIGHT: 0.5, DIAGWEIGHT: 0.25, AMBAMPLIGHT: 200 (almost correct ambient feel, light tapers too quickly still)
// SELFWEIGHT: 10, ORTHOGWEIGHT: 20, DIAGWEIGHT: 1, AMBAMPLIGHT: 200
let SELFWEIGHT = 10;
let ORTHOGWEIGHT = 20;
let DIAGWEIGHT = 1;
let AMBLIGHTAMP = 200;

let LIGHTATTENUATION = getLA();

function getLA() {
    return SELFWEIGHT + ((ORTHOGWEIGHT + DIAGWEIGHT) * 4) + 1; // this +1 is a band-aid until ""raytracing"" works
}

const MINSPERDAY = 1440;
const TICKSPERMINUTE = 600;

const TICKDURATION = 100;
const TICKSPERDAY = 86400 * (1000 / TICKDURATION);

let CELLMAP: { [key: string]: Cell };
let MOBSMAP: { [id: string]: Mob } = {};

let DISPLAYELEMENTSDICT: { [key: string]: HTMLElement} = {};
let LIGHTELEMENTSDICT: { [key: string]: HTMLElement} = {};

let RAYMAP: { [id: string]: LightRay} = {};
let EMITTERMAP: { [key: string]: LightEmitter} = {};
let RAYIDCOUNTER = 0;

let MOBKINDSMAP: { [key: string]: MobKind } = {
    "player": {name: "player", symbol: "@", luminescence: 255},
    "npctest": {name: "npctest", symbol: "W", luminescence: 0}
}

let TERRAINFEATURESMAP: { [key: string]: TerrainFeature } = {
    "tree": {name: "tree", symbol: "#", luminescence: 0, opacity: 0},
    "grass": {name: "grass", symbol: "", luminescence: 0, opacity: 0},
    "light": {name: "light", symbol: "o", luminescence: 125, opacity: 1},
    "rock": {name: "rock", symbol: ".", luminescence: 0, opacity: 0}
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
    setup(1000, 0, [0,0]);
    TICKER = setInterval(tick, TICKDURATION);
    // tick(); for debugging
});
