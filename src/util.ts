export function getElementFromID(id: string): HTMLElement {
    let element = document.getElementById(id);
    if (element) {
        return element;
    }
    else {
        throw new Error(`invalid ID: ${id}`);
    }
}

// function i stole from stackoverflow
function getKeyByValue(object: object, value: any) {
    // @ts-ignore // come back to this later
    return Object.keys(object).find(key => object[key] === value);
}

// throw error when can't set variable
export function throwExpression(errorMessage: string): never {
    throw new Error(errorMessage);
}

// function for faster debugging
function ZZ(a: number, b: number) {
    return a === 0 && b === 0; // i just hate writing this line out all the time it reminds me i'm still using js lol
}

// creates a grid of even height and width.
export function createGrid(parentID: string, sideLength: number, cellClass: string, elementsDict: { [key: string]: HTMLElement}) {
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

export interface Dim2 {
    height: number;
    width:  number;
}
