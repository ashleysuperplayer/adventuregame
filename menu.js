import { getElementFromID } from "./util.js";
import { getSquareDistanceBetweenCells, parseCell, setFocus } from "./world.js";
export function setCTX(newCTX) {
    if (CTX) {
        CTX.HTMLElement.remove();
    }
    CTX = newCTX;
}
export function clearCTX() {
    CTX.HTMLElement.remove();
}
// create own element > create children > calculate dimensions to fit children > reshape element to accomodate children
class CtxMenuComponent {
    id;
    x;
    y;
    ownCls;
    HTMLElement;
    constructor(id, x, y, ownCls) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.ownCls = ownCls;
        this.HTMLElement = this.createBaseElement();
    }
    checkDimensions(dimensions) {
        if (dimensions) {
            return { "height": dimensions.height, "width": dimensions.width };
        }
        else { // default
            return { "height": 20, "width": 50 };
        }
    }
    // basic menu item, every subclass should use this in their createElement method
    createBaseElement() {
        let element = document.createElement("div");
        element.id = this.id;
        element.classList.add(this.ownCls);
        element.style.left = `${this.x}px`;
        element.style.top = `${this.y}px`;
        return element;
    }
}
class CtxParentMenu extends CtxMenuComponent {
    parentElement;
    HTMLElement;
    constructor(id, x, y, ownCls) {
        super(id, x, y, ownCls);
        this.parentElement = getElementFromID("ctx");
        this.HTMLElement = this.createParentElement();
    }
    createParentElement() {
        let element = this.createBaseElement();
        this.parentElement.appendChild(element);
        return element;
    }
}
export class CtxParentMenu_Cell extends CtxParentMenu {
    cellCtx;
    lookButton;
    takeHoverMenu;
    constructor(x, y, cellCtx) {
        super("ctxParentMenu_Cell", x, y, "ctxParentMenu");
        this.cellCtx = cellCtx;
        this.lookButton = this.createLookButton();
        // this sucks, also 2 means every orthog/diag
        if (getSquareDistanceBetweenCells(PLAYER.getCell(), this.cellCtx) <= 2) {
            if (this.cellCtx.inventory.itemsArray(1).length > 0) {
                this.takeHoverMenu = this.createTakeHoverMenu();
            }
        }
    }
    createLookButton() {
        return new CtxButton_Cell("ctxLookButton", this.x, this.y, this, () => { setFocus(parseCell(this.cellCtx), "look"); }, "look", false);
    }
    createTakeHoverMenu() {
        return new CtxHoverMenu_Cell("ctxTakeHover", this.x, this.y + 20, this);
    }
}
class CtxHoverMenu extends CtxMenuComponent {
    parent;
    constructor(id, x, y, ownCls, parent) {
        super(id, x, y, ownCls);
        this.parent = parent;
    }
    setupHover() {
        this.HTMLElement.addEventListener("mouseover", (e) => {
            this.children.map((c) => { c.HTMLElement.style.display = "block"; });
        }, false);
        this.HTMLElement.addEventListener("mouseleave", (e) => {
            this.children.map((c) => { c.HTMLElement.style.display = "none"; });
        }, false);
    }
}
class CtxHoverMenu_Cell extends CtxHoverMenu {
    parent;
    children;
    HTMLElement;
    dimensions;
    constructor(id, x, y, parent) {
        super(id, x, y, "ctxHoverMenu", parent);
        this.parent = parent;
        this.dimensions = { "height": 20, "width": 60 };
        this.HTMLElement = this.createElement();
        this.children = this.createChildren();
        for (let child of this.children) {
            this.HTMLElement.appendChild(child.HTMLElement);
        }
        this.setupHover();
    }
    createChildren() {
        let children = [];
        let childItemIdCounter = 0;
        for (let entry of this.parent.cellCtx.inventory.entriesArray()) {
            for (let quantity = entry.quantity; quantity--; quantity > 0) {
                children.push(new CtxButton_Cell(`${entry.item.name + childItemIdCounter}Button`, this.x + this.dimensions.width, this.y + (childItemIdCounter * this.dimensions.height), this, () => { PLAYER.take(entry.item.name, this.parent.cellCtx); }, entry.item.name, true));
                childItemIdCounter++;
            }
        }
        return children;
    }
    createElement() {
        let element = this.createBaseElement();
        element.style.width = `${this.dimensions.width}px`;
        element.style.height = `${this.dimensions.height}px`;
        element.innerHTML = "take"; // nooooo
        element.classList.add("CtxHoverChildHolder");
        this.parent.HTMLElement.appendChild(element);
        return element;
    }
}
class CtxButton extends CtxMenuComponent {
    parent;
    action;
    text;
    disappearOnClick;
    constructor(id, x, y, ownCls, parent, action, text, disappearOnClick) {
        super(id, x, y, ownCls);
        this.parent = parent;
        this.action = action;
        this.text = text;
        this.disappearOnClick = disappearOnClick;
        this.HTMLElement = this.createButtonElement();
    }
    createButtonElement() {
        let element = this.HTMLElement;
        element.style.height = "20px";
        element.style.width = "60px";
        element.innerHTML = this.text;
        this.parent.HTMLElement.appendChild(element);
        return element;
    }
}
class CtxButton_Cell extends CtxButton {
    parent;
    constructor(id, x, y, parent, action, text, disappearOnClick) {
        super(id, x, y, "ctxButton", parent, action, text, disappearOnClick);
        this.parent = parent;
        this.addAction();
    }
    addAction() {
        this.HTMLElement.onclick = () => { return this.click(); };
    }
    click() {
        this.action();
        if (this.disappearOnClick) {
            this.HTMLElement.remove();
        }
        // jank, redo
        if ("children" in this.parent) {
            console.log("fart");
            console.log(this.parent.HTMLElement.childElementCount);
            if (this.parent.HTMLElement.childElementCount < 1) {
                this.parent.HTMLElement.remove();
            }
        }
    }
}
export class CtxParentMenu_Inventory extends CtxParentMenu {
    entry;
    dropButton;
    dropAllButton;
    constructor(x, y, itemName) {
        super("ctxParentMenu_Inventory", x, y, "ctxParentMenu");
        this.entry = PLAYER.inventory.contents[itemName];
        this.HTMLElement = this.createParentElement();
        this.dropButton = this.createDropButton();
        if (this.entry.quantity > 1) {
            this.dropAllButton = this.createDropAllButton();
        }
    }
    createDropButton() {
        let itemName = this.entry.item.name;
        let button = new CtxButton_Inventory("ctxDrop_Inventory", this.x, this.y, this, () => { PLAYER.inventory.remove(itemName, 1); PLAYER.getCell().inventory.add(itemName, 1); }, "drop", false);
        this.HTMLElement.appendChild(button.HTMLElement);
        return button;
    }
    createDropAllButton() {
        let itemName = this.entry.item.name;
        let itemQuant = this.entry.quantity;
        let button = new CtxButton_Inventory("ctxDropAll_Inventory", this.x, this.y + 20, this, () => { PLAYER.inventory.remove(itemName, itemQuant); PLAYER.getCell().inventory.add(itemName, itemQuant); }, "drop all", true);
        this.HTMLElement.appendChild(button.HTMLElement);
        return button;
    }
}
class CtxHoverMenu_Inventory extends CtxHoverMenu {
    parent;
    children;
    dimensions;
    constructor(id, x, y, parent) {
        super(id, x, y, "ctxHoverMenu", parent);
        this.parent = parent;
        this.dimensions = { "height": 20, width: 60 };
        this.children = this.createChildren();
        this.setupHover();
    }
    createChildren() {
        return [new CtxButton_Inventory("test", 0, 0, this, Function(), "test", false)];
    }
}
class CtxButton_Inventory extends CtxButton {
    constructor(id, x, y, parent, action, text, disappearOnClick) {
        super(id, x, y, "ctxButton", parent, action, text, disappearOnClick);
        this.parent = parent;
        this.addAction();
    }
    addAction() {
        this.HTMLElement.onclick = () => this.click();
    }
    click() {
        this.action();
        if (this.disappearOnClick) {
            this.HTMLElement.remove();
        }
    }
}
export let CTX;
//# sourceMappingURL=menu.js.map