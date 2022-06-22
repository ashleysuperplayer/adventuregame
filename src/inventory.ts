import { PLAYER, Item, ITEMSMAP } from "./world.js";
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

    add(itemName: string, quantity: number) {
        if (!this.contents[itemName]) {
            this.contents[itemName] = {"item": ITEMSMAP[itemName], "quantity": 0};
        }
        this.contents[itemName].quantity += quantity
        updateInventory();
    }

    // allows removal of items without knowing if they exist in inventory
    remove(itemName: string, quantity: number) {
        console.log(this.contents[itemName]);
        if (this.contents[itemName]) {
            console.log(this.contents[itemName]);
            if (this.contents[itemName].quantity < quantity) {
                console.log("invalid quantity")
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
