import { Inventory } from "./inventory.js";
import { getElementFromID, gramsToKG, Vector2 } from "./util.js";
import { Cell, getSquareDistanceBetweenCells, Item, setFocus, cellFocus, Clothing } from "./world.js";

// menu system name is "focus" as in "primaryFocusContainer" and "secondaryFocusContainer", TODO change names etc
// NEW MENU SYSTEM
// menus operate on a cycle. when a menu is "focused," for example by clicking on an item of interest or
// hotkey, it will be moved into the "primary menu display slot." when another menu is focused, the menu
// in the primary slot will be moved into the smaller, secondary slot. this serves a double purpose. the
// first is in breaking up the large amounts of information the player will be using into context-driven
// pieces. the second is in the service of "realism." in real life, you cannot realistically focus on
// cooking, equipping equipment, the finer details about your environment, AND talking to someone, all at
// the same time. this is true in the game world, too. you can focus on a maximum of two things at once,
// which will balance the relative "ommnipotence" afforded to the player, which npc's obviously won't enjoy

// DMenuDisplay
// technically speaking, a menu is an instance of a class inheriting from MenuDisplay. the Menu will be
// created with modularity as a primary concern. i like modularity, it's cool! for example, the same
// Menu should be used for displaying any Inventory object, be it player, npc or container. obviously,
// each Menu should be rich with clickable and right-clickable stuff to allow a full-bodied suite of
// interactions with your environment.
// MenuDisplay should be instantiated with all of the context it needs to display and be interactable.

// DMenuDisplay.displayPrimary DMenuDisplay.displaySecondary
// every Menu will have displayPrimary and displaySecondary functions. these will handle gathering
// information about what the menu is displaying and display it. they will do this by using a function that:
// gathers the information and returns it (preferably a function/property that already exists to gather such information,
// for example Inventory.items), a function that operates on the return of the information gathering function
// and returns an HTMLElement to display it. the display function will also serve the secondary purpose of
// sanitizing the data, as the data needs to be formatted/sanitized in different ways depending on if it's
// primary or secondary display.

// DsetPrimaryDisplay
// handles setting of CURRPRIMARYMENU and movement of CURRPRIMARYMENU to CURRSECONDARYMENU, then calls updateMenus
// there will be a final, global "setPrimaryDisplay" function that takes the
// new primary display (class instance) as an argument.
// old primary/secondaryDisplay HTMLElement's child elements and replace them with the new ones, handling movement of
// primary to secondary and calling the required function, too.

// primary and secondary display MenuDisplays live in the global variables "CURRPIMARYMENU" and "CURRSECONDARYMENU".
// every tick(? optimize). the displayPrimary() and displaySecondary() of these will be called, respectively.

// the HTMLElement will be directly appended to the respective primary and secondary display HTML elements.

// MenuDisplay defines two methods for basic MenuDisplay HTMLElement functionality. these are basePrimary/SecondaryDisplay.
// everything that any menu HTMLElement does (create HTMLElement, give it css classes, etc) will be implemented on these
// functions. the functions will return an HTMLElement to be used by any child classes to use as a base, in the service of
// reduced code duplication and standardized form.

// TODO should be class methods
export function updateMenus() {
    clearMenus();
    getElementFromID("primaryMenuDisplayContainer").appendChild(CURRPRIMARYMENU.displayPrimary());
    getElementFromID("secondaryMenuDisplayContainer").appendChild(CURRSECONDARYMENU.displaySecondary());
}

// remove first (only) children of menu display containers
export function clearMenus() {
    getElementFromID("primaryMenuDisplayContainer").children[0]?.remove();
    getElementFromID("secondaryMenuDisplayContainer").children[0]?.remove();
}

export function setPrimaryDisplay(newMenu: MenuDisplay) {
    CURRSECONDARYMENU = CURRPRIMARYMENU;
    CURRPRIMARYMENU   = newMenu;
    updateMenus();
}

export abstract class MenuDisplay { // rename
    constructor() {
    }

    basePrimaryDisplay() {
        let element = document.createElement("div");

        return element
    }

    baseSecondaryDisplay() {
        let element = document.createElement("div");

        return element;
    }

    // return HTMLElement that fits directly into primaryMenuDisplayContainer
    abstract displayPrimary():   HTMLElement;
    abstract displaySecondary(): HTMLElement;
    // get the information using whatever context is necessary
    // format as HTML and return
}

// dumb class that just outputs whatever message it's sent. sense handling will be another system in world
export class SenseDisplay extends MenuDisplay {
    constructor() {
        super();
    }

    displayPrimary(): HTMLElement {
        let element = this.basePrimaryDisplay();
        element.innerHTML = "sense";
        console.log("sense primary")
        return element;
    }

    displaySecondary(): HTMLElement {
        let element = this.basePrimaryDisplay();
        element.innerHTML = "sense";
        console.log("sense secondary")
        return element;
    }
}

// secondary display should always condense items that have the same name
export class InventoryDisplay extends MenuDisplay {
    inventory: Inventory;
    constructor(inventory: Inventory) {
        super();
        this.inventory = inventory;
    }

    // probably needs some kind of scroll bar in case player is holding millions of crumpled up bits of paper
    displayPrimary(): HTMLElement {
        // create element
        let element = this.basePrimaryDisplay();
        element.innerHTML = "inventory";

        return element;
    }

    displaySecondary(): HTMLElement {
        // create element
        let element = this.baseSecondaryDisplay();
        let headingsElement = document.createElement("div");
        let itemsElement = document.createElement("div");

        let totalVolume = 0;
        let totalWeight = 0;

        for (let item of new Set(this.inventory.items)) {
            let itemEntry = inventoryDisplayEntry(item);
            for (let entry of itemEntry) {
                itemsElement.appendChild(entry);
            }
            totalVolume += item.volume;
            totalWeight += item.weight;
        }

        itemsElement.classList.add("invSecItemContainer"); // should be an id

        // add auxiliary stuff
        let nHeading = document.createElement("div");
        let qHeading = document.createElement("div");
        let vHeading = document.createElement("div");
        let wHeading = document.createElement("div");

        nHeading.id = "inventorySecN";
        qHeading.id = "inventorySecQ";
        vHeading.id = "inventorySecV";
        wHeading.id = "inventorySecW";

        // nHeading.classList.add("inventorySecName");

        nHeading.textContent = "name";
        qHeading.textContent = "q.";
        vHeading.textContent = `${totalVolume}L/${PLAYER.maxVolume}L`; // TODO/NEXT change weight and volume displays to occlude numbers
        wHeading.textContent = `${gramsToKG(totalWeight)}/${gramsToKG(PLAYER.maxEncumbrance)}`;

        headingsElement.appendChild(nHeading)
        headingsElement.appendChild(qHeading)
        headingsElement.appendChild(wHeading)
        headingsElement.appendChild(vHeading)

        element.appendChild(headingsElement);
        element.appendChild(itemsElement);

        return element;
    }
}

function inventoryDisplayEntry(item: Item): HTMLElement[] {
    // this has the disadvantage of displaying items out of their actual order in teh inventory. redo inventory display etc to display items in the order they appear
    // on second thought, maybe the order that entries appear in Inventory.items shouldnt matter to gameplay??
    // only reason i can see right now for making them ordered is in the case of your containers being overly packed,
    // stuff falls out last in first out

    const quantity = PLAYER.inventory.getQuantity(item); // this needs to work with inventories other than the player's
    const space    = item.volume  * quantity;
    const weight   = item.weight  * quantity;

    let nameE   = document.createElement("div");
    let quantE  = document.createElement("div");
    let spaceE  = document.createElement("div");
    let weightE = document.createElement("div");

    nameE.innerHTML   = `${item.name}`;
    quantE.innerHTML  = `${quantity}`;
    spaceE.innerHTML  = `${space}`;
    weightE.innerHTML = `${gramsToKG(weight)}`;

    nameE.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        setCTX(new CtxParentMenu_Inventory(event.clientX, event.clientY, item));
    })

    return [nameE, quantE, spaceE, weightE];
}

export function setCTX(newCTX: CtxParentMenu_Cell|CtxParentMenu_Inventory) {
    if (CTX) {
        CTX.HTMLElement.remove();
    }
    CTX = newCTX;
}
export function clearCTX() {
    if (CTX) {
        CTX.HTMLElement.remove();
    }
}
abstract class CtxMenuComponent {
    id:          string;
    pos:         Vector2;
    ownCls:      string;
    stackBase:   number;
    HTMLElement: HTMLElement;
    constructor(id: string, x: number, y: number, ownCls: string) {
        this.id     = id;
        this.pos    = new Vector2(x, y);
        this.ownCls = ownCls;
        this.stackBase = -1; // jank
        this.HTMLElement = this.createBaseElement();
    }

    addToStack() {
        this.stackBase += 1;
    }

    stack() { // idk why this wont push to remote
        return this.stackBase * 20;
    }

    static baseDimensions() {
        return new Vector2(60, 20);
    }

    // basic menu item, every subclass should use this in their createElement method
    createBaseElement() {
        let element = document.createElement("div");

        element.id = this.id;
        element.classList.add(this.ownCls);

        element.style.left   = `${this.pos.x}px`;
        element.style.top    = `${this.pos.y}px`;

        return element;
    }
}

abstract class CtxParentMenu extends CtxMenuComponent {
    parentElement: HTMLElement;
    HTMLElement:   HTMLElement;
    constructor(id: string, x: number, y: number, ownCls: string) {
        super(id, x, y, ownCls);
        this.parentElement = getElementFromID("ctx");
        this.HTMLElement   = this.createParentElement();
    }

    createParentElement() {
        let element = this.createBaseElement();
        this.parentElement.appendChild(element);
        return element;
    }
}

abstract class CtxHoverMenu extends CtxMenuComponent { // these base elements all suck, this class definitely will always have children but doesn't have a way to generate them without the subclass hhmmmmm
    parent: CtxParentMenu;
    abstract dimensions: Vector2;
    abstract children: CtxButton[];
    constructor(id: string, x: number, y: number, ownCls: string, parent: CtxParentMenu) {
        super(id, x, y, ownCls);
        this.parent = parent;
    }

    setupHover() {
        this.children.map((c) => {c.HTMLElement.style.display = "none";})
        this.HTMLElement.addEventListener("mouseover",(e) => {
            this.children.map((c) => {c.HTMLElement.style.display = "block";})
        },false);
        this.HTMLElement.addEventListener("mouseleave",(e) => {
            this.children.map((c) => {c.HTMLElement.style.display = "none";})
        },false);
    }
}

abstract class CtxButton extends CtxMenuComponent {
    parent:      CtxHoverMenu|CtxParentMenu;
    action:      Function;
    text:        string;
    disappearOnClick: boolean;
    constructor(id: string, x: number, y: number, ownCls: string, parent: CtxHoverMenu|CtxParentMenu, action: Function, text: string, disappearOnClick: boolean) {
        super(id, x, y, ownCls);
        this.parent = parent;
        this.action = action;
        this.text   = text;
        this.disappearOnClick = disappearOnClick;
        this.HTMLElement = this.createButtonElement();
    }

    createButtonElement() {
        let element = this.HTMLElement;

        element.style.height = "20px";
        element.style.width  = "60px";

        element.innerHTML  = this.text;
        this.parent.HTMLElement.appendChild(element);

        return element;
    }

    abstract addAction(): void; // it seems like adding onClick during createElement is adding the abstract onclick method to the button, resulting in its doing nothing
    abstract click(): void;
}

export class CtxParentMenu_Cell extends CtxParentMenu {
    cellCtx:        Cell;
    lookButton?:    CtxButton_Cell;
    takeHoverMenu?: CtxHoverMenu_Cell;
    debugMenu?:     CtxDebugMenu;
    constructor(x: number, y: number, cellCtx: Cell) {
        super("ctxParentMenu_Cell", x, y, "ctxParentMenu");
        this.cellCtx    = cellCtx;
        this.lookButton = this.createLookButton();
        // this sucks, also 2 means every orthog
        if (getSquareDistanceBetweenCells(PLAYER.getCell(), cellCtx) <= 2) {
            if (this.cellCtx.inventory.items.length > 0) {
                this.takeHoverMenu = this.createTakeHoverMenu();
            }
        }
        if (DEBUG) {
            this.debugMenu  = this.createDebugMenu();
        }
    }

    createDebugMenu() {
        this.addToStack();
        return new CtxDebugMenu(this.pos.x, this.pos.y + this.stack(), this, this.cellCtx);
    }

    createLookButton() {
        this.addToStack();
        return new CtxButton_Cell("ctxLookButton", this.pos.x, this.pos.y + this.stack(), this, ()=>{setFocus(cellFocus(this.cellCtx), "look")}, "look", false);
    }

    createTakeHoverMenu() {
        this.addToStack();
        return new CtxHoverMenu_Cell("ctxTakeHover", this.pos.x, this.pos.y + this.stack(), this);
    }
}

class CtxHoverMenu_Cell extends CtxHoverMenu {
    parent:      CtxParentMenu_Cell;
    children:    CtxButton_Cell[];
    HTMLElement: HTMLElement;
    dimensions:  Vector2;
    constructor(id: string, x: number, y: number, parent: CtxParentMenu_Cell) {
        super(id, x, y, "ctxHoverMenu", parent);
        this.parent      = parent;
        this.dimensions  = new Vector2(60, 20);
        this.HTMLElement = this.createElement();
        this.children    = this.createChildren();
        for (let child of this.children) {
            this.HTMLElement.appendChild(child.HTMLElement);
        }
        this.setupHover();
    }

    createChildren(): CtxButton_Cell[] {
        let children: CtxButton_Cell[] = [];
        for (let item of this.parent.cellCtx.inventory.items) {
            this.addToStack()
            children.push(new CtxButton_Cell(`${item.name + this.stack}Button`, this.pos.x + this.dimensions.x, this.pos.y + this.stack(), this, () => {PLAYER.take(item, this.parent.cellCtx)}, item.name, true));
        }
        return children;
    }

    createElement(): HTMLElement {
        let element = this.createBaseElement();

        element.style.width  = `${this.dimensions.x}px`;
        element.style.height = `${this.dimensions.y}px`;

        element.innerHTML = "take"; // nooooo

        element.classList.add("CtxHoverChildHolder");

        this.parent.HTMLElement.appendChild(element);

        return element;
    }
}

class CtxButton_Cell extends CtxButton {
    parent: CtxHoverMenu_Cell|CtxParentMenu_Cell;
    constructor(id: string, x: number, y: number, parent: CtxParentMenu_Cell|CtxHoverMenu_Cell, action: Function, text: string, disappearOnClick: boolean) {
        super(id, x, y, "ctxButton", parent, action, text, disappearOnClick);
        this.parent = parent;
        this.addAction();
    }

    addAction() {
        this.HTMLElement.onclick = () => {return this.click()};
    }

    click() {
        this.action();
        if (this.disappearOnClick) {
            this.HTMLElement.remove();
        }
        // jank, redo
        if ("children" in this.parent) {
            if (this.parent.HTMLElement.childElementCount < 1) {
                this.parent.HTMLElement.remove();
            }
        }
    }
}

export class CtxParentMenu_Inventory extends CtxParentMenu {
    item:           Item;
    quantity:       number;
    equipButton?:   CtxButton_Inventory;
    dropButton:     CtxButton_Inventory;
    dropAllButton?: CtxButton_Inventory;
    debugMenu?:     CtxDebugMenu;
    constructor(x: number, y: number, item: Item) {
        super("ctxParentMenu_Inventory", x, y, "ctxParentMenu");
        this.item        = item;
        this.quantity    = PLAYER.inventory.returnByName(item.name).length;
        this.HTMLElement = this.createParentElement();
        if (this.item instanceof Clothing) {
            this.equipButton = this.createEquipButton();
        }
        this.dropButton    = this.createDropButton();
        if (this.quantity > 1) {
            this.dropAllButton = this.createDropAllButton();
        }
        if (DEBUG) {
            this.debugMenu = this.createDebugMenu();
        }
    }

    createEquipButton() {
        this.addToStack();
        return new CtxButton_Inventory("ctxEquip_Inventory", this.pos.x, this.pos.y, this, () => {PLAYER.equipDefault(this.item as Clothing)}, "equip", true);
    }

    createDebugMenu() {
        this.addToStack();
        return new CtxDebugMenu(this.pos.x, this.pos.y + this.stack(), this, this.item);
    }

    createDropButton() {
        this.addToStack();
        let button = new CtxButton_Inventory("ctxDrop_Inventory", this.pos.x, this.pos.y + this.stack(), this,
        () => {PLAYER.inventory.remove([this.item]) ? PLAYER.getCell().inventory.add([this.item]) : this.HTMLElement.remove()}, "drop", false);
        this.HTMLElement.appendChild(button.HTMLElement);
        return button;
    }

    createDropAllButton() {
        this.addToStack();
        let button = new CtxButton_Inventory("ctxDropAll_Inventory", this.pos.x, this.pos.y + this.stack(), this, () => {PLAYER.dropAllByName(this.item.name)}, "drop all", true);
        this.HTMLElement.appendChild(button.HTMLElement);
        return button;
    }
}

class CtxHoverMenu_Inventory extends CtxHoverMenu {
    parent: CtxParentMenu_Inventory;
    children: CtxButton_Inventory[];
    dimensions: Vector2;
    constructor(id: string, x: number, y: number, parent: CtxParentMenu_Inventory) {
        super(id, x, y, "ctxHoverMenu", parent);
        this.parent = parent;
        this.dimensions = new Vector2(60, 20);
        this.children   = this.createChildren();
        this.setupHover()
    }

    createChildren() {
        this.addToStack();
        return [new CtxButton_Inventory("test", 0, 0, this, Function(), "test", false)];
    }
}

class CtxButton_Inventory extends CtxButton {
    constructor(id: string, x: number, y: number, parent: CtxParentMenu_Inventory|CtxHoverMenu_Inventory, action: Function, text: string, disappearOnClick: boolean) {
        super(id, x, y, "ctxButton", parent, action, text, disappearOnClick);
        this.parent = parent;
        this.addAction();
    }

    addAction() {
        this.HTMLElement.onclick = () => this.click();
    }

    click() {
        this.action();
        if (this.disappearOnClick){
            this.HTMLElement.remove();
        }
    }
}

class CtxDebugMenu extends CtxHoverMenu {
    dimensions: Vector2;
    children:   CtxButton[];
    context:    Item|Cell;
    constructor(x: number, y: number, parent: CtxParentMenu, context: Item|Cell) {
        super("ctxDebugMenu", x, y, "ctxHoverMenu", parent);
        this.dimensions  = new Vector2(60, 20);
        this.context     = context;
        this.HTMLElement = this.createElement();
        this.children    = this.createDebugChildren();
        this.setupHover();
    }

    createElement(): HTMLElement {
        let element = this.createBaseElement();

        element.style.width  = `${this.dimensions.x}px`;
        element.style.height = `${this.dimensions.y}px`;

        element.innerHTML = "debug"; // nooooo

        element.classList.add("CtxHoverChildHolder");

        this.parent.HTMLElement.appendChild(element);

        return element;
    }

    createDebugChildren() {
        let children: CtxButton[] = [];
        for (let key of Object.keys(this.context)) {
            if (key in this.context) {
                this.addToStack();
                // god forgive me
                //@ts-ignorets-ignore
                children.push(new CtxButtonDebug(`${this.stack}DebugButton`, this.pos.x + this.dimensions.x, this.pos.y + this.stack(), this, ()=>{return console.log(key), console.log(this.context[key])}, `${key}`));
            }
        }
        return children;
    }
}

class CtxButtonDebug extends CtxButton {
    constructor(id: string, x: number, y: number, parent: CtxDebugMenu, action: Function, text: string) {
        super(id, x, y, "ctxButton", parent, action, text, false)
        this.addAction();
    }

    addAction(): void {
        this.HTMLElement.onclick = () => this.click();
    }

    click(): void {
        this.action();
    }

}
