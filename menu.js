import { getElementFromID, Vector2 } from "./util.js";
import { getSquareDistanceBetweenCells, parseCell, setFocus } from "./world.js";
export function setCTX(newCTX) {
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
class CtxMenuComponent {
    id;
    pos;
    ownCls;
    stackBase;
    HTMLElement;
    constructor(id, x, y, ownCls) {
        this.id = id;
        this.pos = new Vector2(x, y);
        this.ownCls = ownCls;
        this.stackBase = -1; // jank
        this.HTMLElement = this.createBaseElement();
    }
    addToStack() {
        this.stackBase += 1;
    }
    stack() {
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
        element.style.left = `${this.pos.x}px`;
        element.style.top = `${this.pos.y}px`;
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
class CtxHoverMenu extends CtxMenuComponent {
    parent;
    constructor(id, x, y, ownCls, parent) {
        super(id, x, y, ownCls);
        this.parent = parent;
    }
    setupHover() {
        this.children.map((c) => { c.HTMLElement.style.display = "none"; });
        this.HTMLElement.addEventListener("mouseover", (e) => {
            this.children.map((c) => { c.HTMLElement.style.display = "block"; });
        }, false);
        this.HTMLElement.addEventListener("mouseleave", (e) => {
            this.children.map((c) => { c.HTMLElement.style.display = "none"; });
        }, false);
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
export class CtxParentMenu_Cell extends CtxParentMenu {
    cellCtx;
    lookButton;
    takeHoverMenu;
    debugMenu;
    constructor(x, y, cellCtx) {
        super("ctxParentMenu_Cell", x, y, "ctxParentMenu");
        this.cellCtx = cellCtx;
        this.lookButton = this.createLookButton();
        // this sucks, also 2 means every orthog
        if (getSquareDistanceBetweenCells(PLAYER.getCell(), this.cellCtx) <= 2) {
            if (this.cellCtx.inventory.items.length > 0) {
                this.takeHoverMenu = this.createTakeHoverMenu();
            }
        }
        if (DEBUG) {
            this.debugMenu = this.createDebugMenu();
        }
    }
    createDebugMenu() {
        this.addToStack();
        return new CtxDebugMenu(this.pos.x, this.pos.y + this.stack(), this, this.cellCtx);
    }
    createLookButton() {
        this.addToStack();
        return new CtxButton_Cell("ctxLookButton", this.pos.x, this.pos.y + this.stack(), this, () => { setFocus(parseCell(this.cellCtx), "look"); }, "look", false);
    }
    createTakeHoverMenu() {
        this.addToStack();
        return new CtxHoverMenu_Cell("ctxTakeHover", this.pos.x, this.pos.y + this.stack(), this);
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
        this.dimensions = new Vector2(60, 20);
        this.HTMLElement = this.createElement();
        this.children = this.createChildren();
        for (let child of this.children) {
            this.HTMLElement.appendChild(child.HTMLElement);
        }
        this.setupHover();
    }
    createChildren() {
        let children = [];
        for (let item of this.parent.cellCtx.inventory.items) {
            this.addToStack();
            children.push(new CtxButton_Cell(`${item.name + this.stack}Button`, this.pos.x + this.dimensions.x, this.pos.y + this.stack(), this, () => { PLAYER.take(item, this.parent.cellCtx); }, item.name, true));
        }
        return children;
    }
    createElement() {
        let element = this.createBaseElement();
        element.style.width = `${this.dimensions.x}px`;
        element.style.height = `${this.dimensions.y}px`;
        element.innerHTML = "take"; // nooooo
        element.classList.add("CtxHoverChildHolder");
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
            if (this.parent.HTMLElement.childElementCount < 1) {
                this.parent.HTMLElement.remove();
            }
        }
    }
}
export class CtxParentMenu_Inventory extends CtxParentMenu {
    item;
    quantity;
    dropButton;
    dropAllButton;
    debugMenu;
    constructor(x, y, item) {
        super("ctxParentMenu_Inventory", x, y, "ctxParentMenu");
        this.item = item;
        this.quantity = PLAYER.inventory.returnByName(item.name).length;
        this.HTMLElement = this.createParentElement();
        this.dropButton = this.createDropButton();
        if (this.quantity > 1) {
            this.dropAllButton = this.createDropAllButton();
        }
        if (DEBUG) {
            this.debugMenu = this.createDebugMenu();
        }
    }
    createDebugMenu() {
        this.addToStack();
        return new CtxDebugMenu(this.pos.x, this.pos.y + this.stack(), this, this.item);
    }
    createDropButton() {
        this.addToStack();
        let button = new CtxButton_Inventory("ctxDrop_Inventory", this.pos.x, this.pos.y + this.stack(), this, () => { PLAYER.inventory.remove([this.item]); PLAYER.getCell().inventory.add([this.item]); }, "drop", false);
        this.HTMLElement.appendChild(button.HTMLElement);
        return button;
    }
    createDropAllButton() {
        this.addToStack();
        let button = new CtxButton_Inventory("ctxDropAll_Inventory", this.pos.x, this.pos.y + this.stack(), this, () => { PLAYER.inventory.removeAllByName(this.item.name); PLAYER.getCell().inventory.add([]); }, "drop all", true);
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
        this.dimensions = new Vector2(60, 20);
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
class CtxDebugMenu extends CtxHoverMenu {
    dimensions;
    children;
    context;
    constructor(x, y, parent, context) {
        super("ctxDebugMenu", x, y, "ctxHoverMenu", parent);
        this.dimensions = new Vector2(60, 20);
        this.context = context;
        this.HTMLElement = this.createElement();
        this.children = this.createDebugChildren();
        this.setupHover();
    }
    createElement() {
        let element = this.createBaseElement();
        element.style.width = `${this.dimensions.x}px`;
        element.style.height = `${this.dimensions.y}px`;
        element.innerHTML = "debug"; // nooooo
        element.classList.add("CtxHoverChildHolder");
        this.parent.HTMLElement.appendChild(element);
        return element;
    }
    createDebugChildren() {
        let children = [];
        console.log(this.context); // TODO fix context not coming through sometimes on right side of screen
        for (let key of Object.keys(this.context)) {
            if (key in this.context) {
                this.addToStack();
                // god forgive me
                //@ts-ignorets-ignore
                children.push(new CtxButtonDebug(`${this.stack}DebugButton`, this.pos.x + this.dimensions.x, this.pos.y + this.stack(), this, () => { return console.log(key), console.log(this.context[key]); }, `${key}`));
            }
        }
        return children;
    }
}
class CtxButtonDebug extends CtxButton {
    constructor(id, x, y, parent, action, text) {
        super(id, x, y, "ctxButton", parent, action, text, false);
        this.addAction();
    }
    addAction() {
        this.HTMLElement.onclick = () => this.click();
    }
    click() {
        this.action();
    }
}
//# sourceMappingURL=menu.js.map