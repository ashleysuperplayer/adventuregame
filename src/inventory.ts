import { Clothing, Item } from "./world.js";
import { getElementFromID, gramsToKG } from "./util.js";
import { setCTX, CtxParentMenu_Inventory } from "./menu.js";

// return an element containing the names of all items in supplied Inventory
export function displayInventoryList(inventory: Inventory): HTMLElement {
        let element = document.createElement("div");
        for (let item of inventory.items) {
            let itemElement = document.createElement("div");
            itemElement.innerHTML = item.name;
            element.appendChild(itemElement);
        }
        return element;
    }

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

    getTotalUsedVolume() {
        let sum = 0;
        this.items.forEach((item)=>{sum+=item.volume});
        return sum;
    }

    // return quantity of an item, obsolete?
    getQuantity(itemQ: Item): number {
        return this.items.filter((item) => {return item.name === itemQ.name}).length;
    }

    // return all objects with name
    returnByName(name: string): Item[] {
        return this.items.filter((item) => {return item.name === name});
    }

    // return items whose quantity > quant, redo
    returnMinQuant(quant: number): Item[] {
        let bucket: {[key: string]: Item[]} = {};
        for (let item of this.items) {
            bucket[item.name].push(item);
        }

        let itemList = [];
        for (let bucketList of Object.values(bucket).filter((itemList) => {itemList.length > quant})) {
            itemList.push(...bucketList);
        }

        return itemList;
    }

    // add an item into the inventory
    add(items: Item[]): void {
        this.items.push(...items);
        // updateInventory();
    }

    // remove item from inventory and return true if successful/possible, else return false
    remove(items: Item[]): boolean {
        for (let item of items) {
            if (this.items.indexOf(item) === -1) {
                return false;
            }
        }
        this.items = this.items.filter((x) => !items.includes(x));
        return true;
    }

    // remove all objects with name
    removeAllByName(name: string): void {
        this.remove(this.returnByName(name));
    }
}

export class ClothingInventory extends Inventory{
    items: Clothing[];
    constructor() {
        super();
        this.items = [];
    }
}

// each slot must have a name, inInsul and extInsul
// item stats are multiplied against inInsul and extInsul to derive Mob stats "inInsul" & "extInsul"
// inInsul and extInsul of Mob is used to calculate heat loss/temperature etc

// how much of each stat each slot will imbue when correct items are worn

// export const SLOTBIAS: SlotBias = {
//     "head":  {inInsul: 1.0, extInsul: 1.2, maxEncumbrance: 0, maxSpace: 0},
//     "face":  {inInsul: 0.5, extInsul: 1.2, maxEncumbrance: 0, maxSpace: 0},
//     "neck":  {inInsul: 0.8, extInsul: 1.0, maxEncumbrance: 0, maxSpace: 0},
//     "torso": {inInsul: 1.5, extInsul: 1.0, maxEncumbrance: 0, maxSpace: 0},
//     "legs":  {inInsul: 1.0, extInsul: 1.3, maxEncumbrance: 0, maxSpace: 0},
//     "lFoot": {inInsul: 0.3, extInsul: 1.3, maxEncumbrance: 0, maxSpace: 0},
//     "rFoot": {inInsul: 0.3, extInsul: 1.5, maxEncumbrance: 0, maxSpace: 0},
//     "lHand": {inInsul: 0.2, extInsul: 1.5, maxEncumbrance: 0, maxSpace: 0},
//     "rHand": {inInsul: 0.2, extInsul: 1.5, maxEncumbrance: 0, maxSpace: 0}
// }

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
