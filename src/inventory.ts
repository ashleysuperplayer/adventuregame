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

// export function updateInventory() {
//     let element = getElementFromID("inventoryDisplayList");
//     element.textContent = "";

//     let totalVolume = 0;
//     let totalWeight = 0;

//     for (let item of new Set(PLAYER.inventory.items)) {
//         let [volume, weight] = inventoryDisplayEntry(item);
//         totalVolume += volume;
//         totalWeight += weight;
//     }

//     getElementFromID("invSpaceLimit").textContent  = `${totalVolume}L/${PLAYER.maxVolume}L`;
//     getElementFromID("invWeightLimit").textContent = `${gramsToKG(totalWeight)}/${gramsToKG(PLAYER.maxEncumbrance)}`
// }

function inventoryDisplayEntry(item: Item): number[] {
    // this has the disadvantage of displaying items out of their actual order in teh inventory. redo inventory display etc to display items in the order they appear
    // on second thought, maybe the order that entries appear in Inventory.items shouldnt matter to gameplay??
    // only reason i can see right now for making them ordered is in the case of your containers being overly packed,
    // stuff falls out last in first out
    let nodeListOElements = document.getElementsByName(`${item.name}InventoryEntry`);
    let oldElements = [];
    if (nodeListOElements[0]) {
        for (let i = nodeListOElements.length; i--; oldElements.unshift(nodeListOElements[i])); // stolen from SO
        oldElements.map((element) => {element.remove()});
    }

    const quantity = PLAYER.inventory.getQuantity(item);
    const space    = item.volume  * quantity;
    const weight   = item.weight  * quantity;

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
    weightE.innerHTML = `${gramsToKG(weight)}`;

    nameE.setAttribute("name", `${item.name}InventoryEntry`);
    quantE.setAttribute("name", `${item.name}InventoryEntry`);
    spaceE.setAttribute("name", `${item.name}InventoryEntry`);
    weightE.setAttribute("name", `${item.name}InventoryEntry`);

    const parent = document.getElementById("inventoryDisplayList");

    parent?.appendChild(nameE);
    parent?.appendChild(quantE);
    parent?.appendChild(spaceE);
    parent?.appendChild(weightE);

    return [space/quantity, weight/quantity]; // TODO dividing by quantity is temporary solution, find better way
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
