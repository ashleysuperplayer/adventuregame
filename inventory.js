import { getElementFromID, gramsToKG } from "./util.js";
import { setCTX, CtxParentMenu_Inventory } from "./menu.js";
// return a parent element containing all items in supplied Inventory
export function displayInventoryForFocus(inventory) {
    let element = document.createElement("div");
    for (let item of inventory.items) {
        let itemElement = document.createElement("div");
        itemElement.innerHTML = item.name;
        element.appendChild(itemElement);
    }
    return element;
}
export function updateInventory() {
    let element = getElementFromID("inventoryDisplayList");
    element.textContent = "";
    let totalVolume = 0;
    let totalWeight = 0;
    for (let item of new Set(PLAYER.inventory.items)) {
        let [volume, weight] = inventoryDisplayEntry(item);
        totalVolume += volume;
        totalWeight += weight;
    }
    getElementFromID("invSpaceLimit").textContent = `${totalVolume}L/${PLAYER.maxVolume}L`;
    getElementFromID("invWeightLimit").textContent = `${gramsToKG(totalWeight)}/${gramsToKG(PLAYER.maxEncumbrance)}`;
}
function inventoryDisplayEntry(item) {
    // this has the disadvantage of displaying items out of their actual order in teh inventory. redo inventory display etc to display items in the order they appear
    // on second thought, maybe the order that entries appear in Inventory.items shouldnt matter to gameplay??
    // only reason i can see right now for making them ordered is in the case of your containers being overly packed,
    // stuff falls out last in first out
    let nodeListOElements = document.getElementsByName(`${item.name}InventoryEntry`);
    let oldElements = [];
    if (nodeListOElements[0]) {
        for (let i = nodeListOElements.length; i--; oldElements.unshift(nodeListOElements[i]))
            ; // stolen from SO
        oldElements.map((element) => { element.remove(); });
    }
    const quantity = PLAYER.inventory.getQuantity(item);
    const space = item.volume * quantity;
    const weight = item.weight * quantity;
    let nameE = document.createElement("div");
    nameE.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        setCTX(new CtxParentMenu_Inventory(event.clientX, event.clientY, item));
    });
    let quantE = document.createElement("div");
    let spaceE = document.createElement("div");
    let weightE = document.createElement("div");
    nameE.innerHTML = `${item.name}`;
    quantE.innerHTML = `${quantity}`;
    spaceE.innerHTML = `${space}`;
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
    return [space / quantity, weight / quantity]; // TODO dividing by quantity is temporary solution, find better way
}
// in an Inventory is an Array of Items
export class Inventory {
    items;
    constructor(items) {
        if (items) {
            this.items = items;
        }
        else {
            this.items = [];
        }
    }
    getTotalUsedVolume() {
        let sum = 0;
        this.items.forEach((item) => { sum += item.volume; });
        return sum;
    }
    getQuantity(itemQ) {
        return this.items.filter((item) => { return item.name === itemQ.name; }).length;
    }
    // return all objects with name
    returnByName(name) {
        return this.items.filter((item) => { return item.name === name; });
    }
    // return items whose quantity > quant, redo
    returnMinQuant(quant) {
        let bucket = {};
        for (let item of this.items) {
            bucket[item.name].push(item);
        }
        let itemList = [];
        for (let bucketList of Object.values(bucket).filter((itemList) => { itemList.length > quant; })) {
            itemList.push(...bucketList);
        }
        return itemList;
    }
    // add an item into the inventory
    add(items) {
        this.items.push(...items);
        updateInventory();
    }
    // remove item from inventory and return true if successful/possible, else return false
    remove(items) {
        for (let item of items) {
            if (this.items.indexOf(item) === -1) {
                return false;
            }
        }
        this.items = this.items.filter((x) => !items.includes(x));
        return true;
    }
    // remove all objects with name
    removeAllByName(name) {
        this.remove(this.returnByName(name));
    }
}
export class ClothingInventory extends Inventory {
    items;
    constructor() {
        super();
        this.items = [];
    }
}
export function constructMobSlots() {
    return { "head": new Inventory(),
        "face": new Inventory(),
        "neck": new Inventory(),
        "torso": new Inventory(),
        "legs": new Inventory(),
        "lFoot": new Inventory(),
        "rFoot": new Inventory(),
        "lHand": new Inventory(),
        "rHand": new Inventory()
    };
}
//# sourceMappingURL=inventory.js.map