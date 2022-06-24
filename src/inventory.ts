import { Item, Mob, MobStats } from "./world.js";
import { getElementFromID } from "./util.js";
import { setCTX, CtxParentMenu_Inventory } from "./menu.js";

export function updateInventory() {
    getElementFromID("inventoryDisplayList").textContent = "";
    let totalSpace  = 0;
    let totalWeight = 0;

    // this way of using itemsArray is very silly, code an "entriesArray" to use the more useful InventoryEntry interface
    for (let item of PLAYER.inventory.items) {
        let [space, weight] = inventoryDisplayEntry(item);
        totalSpace  += space;
        totalWeight += weight;
    }

    getElementFromID("invSpaceLimit").textContent = `${totalSpace}/100`;
    getElementFromID("invWeightLimit").textContent = `${totalWeight}g/5000g`
}

function inventoryDisplayEntry(item: Item): number[] {
    const quantity = PLAYER.inventory.returnByName.length
    const space    = item.space  * quantity;
    const weight   = item.weight * quantity;

    let nameE   = document.createElement("div");
    nameE.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        setCTX(new CtxParentMenu_Inventory(event.clientX, event.clientY, item));
    })
    let quantE  = document.createElement("div");
    let spaceE  = document.createElement("div");
    let weightE = document.createElement("div");

    nameE.innerHTML   = `${item.name}`;
    quantE.innerHTML  = `${quantity}`;
    spaceE.innerHTML  = `${space}`;
    weightE.innerHTML = `${weight}g`;

    const parent = document.getElementById("inventoryDisplayList");

    parent?.appendChild(nameE);
    parent?.appendChild(quantE);
    parent?.appendChild(spaceE);
    parent?.appendChild(weightE);

    return [space, weight];
}

// in an Inventory is an Array of Items


export class Inventory {
    items: Item[];
    constructor(items?: Item[]) {
        if (items) {
            this.items = items;
        }
        else {
            this.items = [];
        }
    }

    // return all objects with name
    returnByName(name: string): Item[] {
        return this.items.filter((item) => {item.name === name});
    }

    // return items whose quantity > quant, redo
    returnMinQuant(quant: number): Item[] {
        let bucket: {[key: string]: Item[]} = {};
        for (let item of this.items) {
            bucket[item.name].push(item);
        }

        let itemList = [];
        for (let bucketList of Object.values(bucket).filter((itemList) => {itemList.length > quant})) {
            itemList.push(...bucketList)
        }

        return itemList;
    }

    // add an item into the inventory
    add(items: Item[]): void {
        this.items.push(...items);
        updateInventory();
    }

    // remove item from inventory and return removed item
    remove(items: Item[]): Item[] {
        return this.items = this.items.filter((x) => !items.includes(x));
    }

    // remove all objects with name and return them
    removeAllByName(name: string): Item[] {
        return this.remove(this.returnByName(name));
    }
}

// each slot must have a name, inInsul and extInsul
// item stats are multiplied against inInsul and extInsul to derive Mob stats "inInsul" & "extInsul"
// inInsul and extInsul of Mob is used to calculate heat loss/temperature etc

// how much of each stat each slot will imbue when correct items are worn
type SlotBias = {
    [key: string]: MobStats;
}

export const SLOTBIAS: SlotBias = {
    "head":  {inInsul: 1.0, extInsul: 1.2},
    "face":  {inInsul: 0.5, extInsul: 1.2},
    "neck":  {inInsul: 0.8, extInsul: 1.0},
    "torso": {inInsul: 1.5, extInsul: 1.0},
    "legs":  {inInsul: 1.0, extInsul: 1.3},
    "lFoot": {inInsul: 0.3, extInsul: 1.3},
    "rFoot": {inInsul: 0.3, extInsul: 1.5},
    "lHand": {inInsul: 0.2, extInsul: 1.5},
    "rHand": {inInsul: 0.2, extInsul: 1.5}
}

// MobSlots is 20150117--Jump3 MOB slots switched, OBVIOUSLY
export type MobSlots =  {
    [key: string]: Inventory;
}

export function constructMobSlots(): MobSlots {
    return {"head": new Inventory(),
            "face": new Inventory(),
            "neck": new Inventory(),
            "torso": new Inventory(),
            "legs":  new Inventory(),
            "lFoot": new Inventory(),
            "rFoot": new Inventory(),
            "lHand": new Inventory(),
            "rHand": new Inventory()
        };
    }
