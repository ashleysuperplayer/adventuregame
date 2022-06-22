import { Dim2, getElementFromID } from "./util.js";
import { Cell, getSquareDistanceBetweenCells } from "./world.js";
import { InventoryEntry, updateInventory } from "./inventory.js";

export function setCTX(newCTX: CtxParentMenu_Cell|CtxParentMenu_Inventory) {
    if (CTX) {
        CTX.HTMLElement.remove();
    }
    CTX = newCTX;
}
// create own element > create children > calculate dimensions to fit children > reshape element to accomodate children
abstract class CtxMenuComponent {
    id:     string;
    x:      number;
    y:      number;
    ownCls: string;
    HTMLElement: HTMLElement;
    constructor(id: string, x: number, y: number, ownCls: string) {
        this.id     = id;
        this.x      = x;
        this.y      = y;
        this.ownCls = ownCls;
        this.HTMLElement = this.createBaseElement();
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
        this.HTMLElement   = this.createBaseElement();
    }
}

export class CtxParentMenu_Cell extends CtxParentMenu {
    cellCtx:        Cell;
    HTMLElement:    HTMLElement;
    takeHoverMenu?: CtxHoverMenu_Cell;
    constructor(x: number, y: number, cellCtx: Cell) {
        super("ctxParentMenu_Cell", x, y, "ctxParentMenu");
        this.cellCtx       = cellCtx;
        this.HTMLElement   = this.createElement();
        // this sucks, also 2 means 1.5 cells basicallyt
        if (getSquareDistanceBetweenCells(PLAYER.getCell(), this.cellCtx) <= 2) {
            this.takeHoverMenu = this.createTakeHoverMenu();
        }
    }

    createElement() {
        let element = this.createBaseElement();
        // console.log(element);
        this.parentElement.appendChild(element);
        return element;
    }

    createTakeHoverMenu() {
        // console.log("ctxtakehover x is "+(this.x+this.dimensions.width))
        return new CtxHoverMenu_Cell("ctxTakeHover", this.x, this.y, this);
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
        this.HTMLElement.addEventListener("mouseover",(e) => {
            this.children.map((c) => {c.HTMLElement.style.display = "block";})
        },false);
        this.HTMLElement.addEventListener("mouseleave",(e) => {
            this.children.map((c) => {c.HTMLElement.style.display = "none";})
        },false);
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
        this.children    = this.createChildren();
        this.HTMLElement = this.createElement();
        this.setupHover();
    }

    createChildren(): CtxButton_Cell[] {
        let children: CtxButton_Cell[] = [];
        let childItemIdCounter = 0;
        for (let content of Object.values(this.parent.cellCtx.inventory.contents)) {
            children.push(new CtxButton_Cell(`${content.item.name + childItemIdCounter}Button`, this.x + this.dimensions.width, this.y + (childItemIdCounter * this.dimensions.height), this, () => {PLAYER.take(content.item.name, this.parent.cellCtx)}, content.item.name))
            childItemIdCounter++;
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

        // append child HTML elements to this one
        for (let child of this.children) {
            element.appendChild(child.HTMLElement);
        }

        return element;
    }
}

abstract class CtxButton extends CtxMenuComponent {
    parent:      CtxHoverMenu|CtxParentMenu;
    action:      Function;
    text:        string;
    constructor(id: string, x: number, y: number, ownCls: string, parent: CtxHoverMenu|CtxParentMenu, action: Function, text: string) {
        super(id, x, y, ownCls);
        this.parent = parent;
        this.action = action;
        this.text   = text;
        this.HTMLElement = this.createElement();
    }

    createElement() {
        let element = this.HTMLElement;

        element.style.height = "20px";
        element.style.width  = "60px";

        element.innerHTML  = this.text;
        element.onclick    = () => {this.click()};

        return element;
    }

    abstract click(): void;
}

class CtxButton_Cell extends CtxButton {
    parent: CtxHoverMenu_Cell|CtxParentMenu_Cell;
    constructor(id: string, x: number, y: number, parent: CtxParentMenu_Cell|CtxHoverMenu_Cell, action: Function, text: string) {
        super(id, x, y, "ctxButton", parent, action, text);
        this.parent = parent;
    }

    click() {
        this.action();
        this.HTMLElement.remove();
    }
}

export class CtxParentMenu_Inventory extends CtxParentMenu {
    entry:      InventoryEntry;
    dropButton: CtxButton_Inventory;
    constructor(x: number, y: number, itemName: string) {
        super("ctxParentMenu_Inventory", x, y, "ctxParentMenu");
        this.entry = PLAYER.inventory.contents[itemName];
        this.HTMLElement = this.createElement();
        this.dropButton = this.createDropButton();
    }

    createElement() {
        let element = this.createBaseElement();
        this.parentElement.appendChild(element);
        return element;
    }

    createDropButton() {
        let itemName = this.entry.item.name;
        let button = new CtxButton_Inventory("ctxDrop_Inventory", this.x, this.y, this, () => {PLAYER.inventory.remove(itemName, 1); PLAYER.getCell().inventory.add(itemName, 1)}, "drop");
        this.HTMLElement.appendChild(button.HTMLElement);
        return button;
    }
}

class CtxHoverMenu_Inventory extends CtxHoverMenu {
    parent: CtxParentMenu_Inventory;
    children: CtxButton_Inventory[];
    HTMLElement: HTMLElement;
    dimensions: Dim2;
    constructor(id: string, x: number, y: number, parent: CtxParentMenu_Inventory) {
        super(id, x, y, "ctxHoverMenu", parent);
        this.parent = parent;
        this.dimensions = {"height": 20, width: 60};
        this.children   = this.createChildren();
        this.HTMLElement = this.createElement();
        this.setupHover()
    }

    createChildren() {
        return [new CtxButton_Inventory("test", 0, 0, this, Function(), "test")];
    }

    createElement() {
        let element = this.createBaseElement();
        return element;
    }
}

class CtxButton_Inventory extends CtxButton {
    constructor(id: string, x: number, y: number, parent: CtxParentMenu_Inventory|CtxHoverMenu_Inventory, action: Function, text: string) {
        super(id, x, y, "ctxButton", parent, action, text);
        this.parent = parent;
    }

    click() {
        updateInventory();
        this.action();
    }
}

export let CTX: CtxParentMenu_Cell|CtxParentMenu_Inventory;
