import { Item, Mob, MobStats } from "./world.js";
import { getElementFromID } from "./util.js";
import { setCTX, CtxParentMenu_Inventory } from "./menu.js";

export function updateInventory() {
    getElementFromID("inventoryDisplayList").textContent = "";
    let totalSpace  = 0;
    let totalWeight = 0;

    // this way of using itemsArray is very silly, code an "entriesArray" to use the more useful InventoryEntry interface
    for (let item of PLAYER.inventory.itemsArray(1)) {
        let [space, weight] = inventoryDisplayEntry(item);
        totalSpace  += space;
        totalWeight += weight;
    }

    getElementFromID("invSpaceLimit").textContent = `${totalSpace}/100`;
    getElementFromID("invWeightLimit").textContent = `${totalWeight}g/5000g`
}

function inventoryDisplayEntry(item: Item): number[] {
    const quantity = PLAYER.inventory.contents[item.name].quantity; // jesus good lord
    const space    = item.space  * quantity;
    const weight   = item.weight * quantity;

    let nameE   = document.createElement("div");
    nameE.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        setCTX(new CtxParentMenu_Inventory(event.clientX, event.clientY, item.name));
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


export interface InventoryEntry {
    item: Item;
    quantity: number;
}

export type InventoryMap = { [key: string]: InventoryEntry};

export class Inventory {
    contents: InventoryMap;
    constructor(contents?: InventoryMap) {
        this.contents = contents ?? {};
    }

    itemsArray(minQuant?: number): Item[] {
        let itemList: Item[] = [];
        if (minQuant) {
            for (let entry of Object.values(this.contents)) {
                if (entry.quantity >= minQuant) {
                    itemList.push(entry.item);
                }
            }
        }
        else {
            for (let entry of Object.values(this.contents)) {
                itemList.push(entry.item);
            }
        }

        return itemList;
    }

    entriesArray() {
        let entriesList: InventoryEntry[] = [];
        for (let entry of Object.values(this.contents)) {
            entriesList.push(entry);
        }
        return entriesList;
    }

    add(itemName: string, quantity: number) {
        if (!this.contents[itemName]) {
            this.contents[itemName] = {"item": globalThis.ITEMKINDSMAP[itemName], "quantity": 0};
        }
        this.contents[itemName].quantity += quantity
        updateInventory();
    }

    // allows removal of items without knowing if they exist in inventory
    remove(itemName: string, quantity: number) {
        if (this.contents[itemName]) {
            if (this.contents[itemName].quantity < quantity) {
                return false;
            }
            else {
                this.contents[itemName].quantity -= quantity;
                updateInventory();
                return true;
            }
        }
        else {
            return false;
        }
    }
}

export interface SlotStats {
    name: string;
    inInsul: number;
    extInsul: number;
}

// each slot must have a name, inInsul and extInsul
// item stats are multiplied against inInsul and extInsul to derive Mob stats "inInsul" & "extInsul"
// inInsul and extInsul of Mob is used to calculate heat loss/temperature etc

export enum Slot {
    Head,
    Face,
    Neck,
    Torso,
    Legs,
    LFoot,
    RFoot,
    LeftHand,
    RightHand
}

// how much of each stat each slot will imbue when correct items are worn
type SlotBias = {[key in Slot]: MobStats};

const SLOTBIAS: SlotBias = {
    [Slot.Head]:      {inInsul: 1.0, extInsul: 1.2},
    [Slot.Face]:      {inInsul: 0.5, extInsul: 1.2},
    [Slot.Neck]:      {inInsul: 0.8, extInsul: 1.0},
    [Slot.Torso]:     {inInsul: 1.5, extInsul: 1.0},
    [Slot.Legs]:      {inInsul: 1.0, extInsul: 1.3},
    [Slot.LFoot]:     {inInsul: 0.3, extInsul: 1.3},
    [Slot.RFoot]:     {inInsul: 0.3, extInsul: 1.5},
    [Slot.LeftHand]:  {inInsul: 0.2, extInsul: 1.5},
    [Slot.RightHand]: {inInsul: 0.2, extInsul: 1.5}
}

export class Equipment extends Inventory {
    mob: Mob;
    slots: {[key in Slot]?: Inventory}; // enums cant be used as keys unless ?
    constructor(mob: Mob, contents?: InventoryMap|undefined) {
        super(contents);
        this.mob = mob;
        this.slots = {};
    }

    getEquipment() {
        return this.slots[Slot.Torso]?.itemsArray;
    }

    equipSlot(slot: Slot, item: Item) {
        let slotObj = this.contents[slot];
        console.log(item.equipSlot);
        if (!item.equipSlot) {
            console.log("youre not meant to use this");
            return;
        }
        PLAYER.applyStats(slot in item.equipSlot ?
            {inInsul: item.stats.insulation * SLOTBIAS[slot].inInsul, extInsul: item.stats.insulation * SLOTBIAS[slot].extInsul}:
            {inInsul: item.stats.insulation * 0.1, extInsul: item.stats.insulation * 0.1});

        if (!slotObj) {
            slotObj = {item: item, quantity: 1};
            this.mob.inventory.remove(slotObj.item.name, 1);
        }
        else {
            this.mob.inventory.add(slotObj.item.name, 1);
            slotObj = {item: item, quantity: 1};
            this.mob.inventory.remove(slotObj.item.name, 1);
        }
    }
}
