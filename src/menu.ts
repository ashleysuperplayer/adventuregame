import { Dim2, getElementFromID } from "./util.js";
import { Cell, getSquareDistanceBetweenCells, Item, parseCell, setFocus } from "./world.js";
import { Inventory, InventoryEntry, updateInventory } from "./inventory.js";

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
    id:     string;
    x:      number;
    y:      number;
    ownCls: string;
    stackBase: number;
    HTMLElement: HTMLElement;
    constructor(id: string, x: number, y: number, ownCls: string) {
        this.id     = id;
        this.x      = x;
        this.y      = y;
        this.ownCls = ownCls;
        this.stackBase = -1; // jank that it starts at 0
        this.HTMLElement = this.createBaseElement();
    }

    addToStack() {
        this.stackBase += 1;
    }

    stack() {
        return this.stackBase * 20;
    }

    checkDimensions(dimensions: Dim2) {
        if (dimensions) {
            return {"height": dimensions.height, "width": dimensions.width};
        }
        else { // default
            return {"height": 20, "width" : 50};
        }
    }

    // basic menu item, every subclass should use this in their createElement method
    createBaseElement() {
        let element = document.createElement("div");

        element.id = this.id;
        element.classList.add(this.ownCls);

        element.style.left   = `${this.x}px`;
        element.style.top    = `${this.y}px`;

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
    abstract dimensions: Dim2;
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
    lookButton:     CtxButton_Cell;
    takeHoverMenu?: CtxHoverMenu_Cell;
    debugMenu?:     CtxDebugMenu;
    constructor(x: number, y: number, cellCtx: Cell) {
        super("ctxParentMenu_Cell", x, y, "ctxParentMenu");
        this.cellCtx    = cellCtx;
        this.lookButton = this.createLookButton();
        if (DEBUG) {
            this.debugMenu  = this.createDebugMenu();
        }
        // this sucks, also 2 means every orthog/diag
        if (getSquareDistanceBetweenCells(PLAYER.getCell(), this.cellCtx) <= 2) {
            if (this.cellCtx.inventory.itemsArray(1).length > 0) {
                this.takeHoverMenu = this.createTakeHoverMenu();
            }
        }
    }

    createDebugMenu() {
        this.addToStack()
        return new CtxDebugMenu(this.x, this.y + this.stack(), this, this.cellCtx);
    }

    createLookButton() {
        this.addToStack()
        return new CtxButton_Cell("ctxLookButton", this.x, this.y + this.stack(), this, ()=>{setFocus(parseCell(this.cellCtx), "look")}, "look", false);
    }

    createTakeHoverMenu() {
        this.addToStack()
        return new CtxHoverMenu_Cell("ctxTakeHover", this.x, this.y + this.stack(), this);
    }
}

class CtxHoverMenu_Cell extends CtxHoverMenu {
    parent:      CtxParentMenu_Cell;
    children:    CtxButton_Cell[];
    HTMLElement: HTMLElement;
    dimensions:  Dim2;
    constructor(id: string, x: number, y: number, parent: CtxParentMenu_Cell) {
        super(id, x, y, "ctxHoverMenu", parent);
        this.parent      = parent;
        this.dimensions  = {"height": 20, "width": 60};
        this.HTMLElement = this.createElement();
        this.children    = this.createChildren();
        for (let child of this.children) {
            this.HTMLElement.appendChild(child.HTMLElement);
        }
        this.setupHover();
    }

    createChildren(): CtxButton_Cell[] {
        let children: CtxButton_Cell[] = [];
        for (let entry of this.parent.cellCtx.inventory.entriesArray()) {
            for (let quantity = entry.quantity; quantity--; quantity > 0) {
                this.addToStack()
                children.push(new CtxButton_Cell(`${entry.item.name + this.stack}Button`, this.x + this.dimensions.width, this.y + this.stack(), this, () => {PLAYER.take(entry.item.name, this.parent.cellCtx)}, entry.item.name, true))
            }
        }
        return children;
    }

    createElement(): HTMLElement {
        let element = this.createBaseElement();

        element.style.width  = `${this.dimensions.width}px`;
        element.style.height = `${this.dimensions.height}px`;

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
    entry:          InventoryEntry;
    dropButton:     CtxButton_Inventory;
    dropAllButton?: CtxButton_Inventory;
    debugMenu?:     CtxDebugMenu;
    constructor(x: number, y: number, itemName: string) {
        super("ctxParentMenu_Inventory", x, y, "ctxParentMenu");
        this.entry         = PLAYER.inventory.contents[itemName];
        this.HTMLElement   = this.createParentElement();
        this.dropButton    = this.createDropButton();
        if (DEBUG) {
            this.debugMenu = this.createDebugMenu();
        }
        if (this.entry.quantity > 1) {
            this.dropAllButton = this.createDropAllButton();
        }
    }

    createDebugMenu() {
        this.addToStack();
        return new CtxDebugMenu(this.x, this.y, this, this.entry.item);
    }

    createDropButton() {
        this.addToStack();
        let itemName = this.entry.item.name;
        let button = new CtxButton_Inventory("ctxDrop_Inventory", this.x, this.y, this, () => {PLAYER.inventory.remove(itemName, 1); PLAYER.getCell().inventory.add(itemName, 1)}, "drop", false);
        this.HTMLElement.appendChild(button.HTMLElement);
        return button;
    }

    createDropAllButton() {
        this.addToStack();
        let itemName  = this.entry.item.name;
        let itemQuant = this.entry.quantity;
        let button    = new CtxButton_Inventory("ctxDropAll_Inventory", this.x, this.y+20, this, () => {PLAYER.inventory.remove(itemName, itemQuant); PLAYER.getCell().inventory.add(itemName, itemQuant)}, "drop all", true);
        this.HTMLElement.appendChild(button.HTMLElement);
        return button;
    }
}

class CtxHoverMenu_Inventory extends CtxHoverMenu {
    parent: CtxParentMenu_Inventory;
    children: CtxButton_Inventory[];
    dimensions: Dim2;
    constructor(id: string, x: number, y: number, parent: CtxParentMenu_Inventory) {
        super(id, x, y, "ctxHoverMenu", parent);
        this.parent = parent;
        this.dimensions = {"height": 20, width: 60};
        this.children   = this.createChildren();
        this.setupHover()
    }

    createChildren() {
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
    dimensions: Dim2;
    children:   CtxButton[];
    context:    Item|Cell;
    constructor(x: number, y: number, parent: CtxParentMenu, context: Item|Cell) {
        super("ctxDebugMenu", x, y, "ctxHoverMenu", parent);
        this.dimensions  = {height: 20, width: 60};
        this.context     = context;
        this.HTMLElement = this.createElement();
        this.children    = this.createDebugChildren();
        this.setupHover();
    }

    createElement(): HTMLElement {
        let element = this.createBaseElement();

        element.style.width  = `${this.dimensions.width}px`;
        element.style.height = `${this.dimensions.height}px`;

        element.innerHTML = "debug"; // nooooo

        element.classList.add("CtxHoverChildHolder");

        this.parent.HTMLElement.appendChild(element);

        return element;
    }

    createDebugChildren() {
        let children: CtxButton[] = [];
        console.log(this.context); // TODO fix context not coming through sometimes on right side of screen
        for (let key of Object.keys(this.context)) {
            if (key in this.context) {
                this.addToStack();
                // god forgive me
                //@ts-ignorets-ignore
                children.push(new CtxButtonDebug(`${this.stack}DebugButton`, this.x + 60, this.y + this.stack(), this, ()=>{return console.log(key), console.log(this.context[key])}, `${key}`));
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