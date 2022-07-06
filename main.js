import { Lex, GroundType, setup, tick, constructItemKind, constructClothingKind } from "./world.js";
import { Colour } from "./light.js";
import { Viewport } from "./display.js";
import { Debugger, Vector2 } from "./util.js";
function main() {
    setGlobals();
    setup(1000, 0, new Vector2(0, 0));
    globalThis.TICKER = setInterval(tick, globalThis.TICKDURATION);
}
function setGlobals() {
    globalThis.DEBUGGER = new Debugger();
    globalThis.DEBUG = true;
    globalThis.MINSPERDAY = 1440;
    globalThis.TICKSPERMINUTE = 600;
    globalThis.TICKDURATION = 100;
    globalThis.TICKSPERDAY = 86400;
    globalThis.MOBSMAP = {};
    // // globalThis.MOBKINDSMAP = {
    //     "player":  {name: "player",  symbol: "@", limbs: Human.createLimbs()},
    //     "human":   {name: "human",   symbol: "H", limbs: Human.createLimbs()},
    //     "npctest": {name: "npctest", symbol: "T", limbs: Human.createLimbs()},
    //     "rabbit":  {name: "rabbit",  symbol: "☮", limbs: constructMobSlots()}
    // };
    globalThis.ITEMKINDSMAP = {
        //"name"  :     constructItemKind("name"    , weight(g), useableVolume(L),            luminescence,   blocks, new Lex("cellDesc",               ["plural","plural2",   itemStats: {insulation: n}), equipslot)
        "oil lamp": constructItemKind("oil lamp", 2700, 1, 0, "o", new Colour(247, 91, 18), 0, false, new Lex("is an oil lamp", ["are ", " oil lamps"])),
        "rock": constructItemKind("rock", 5000, 0.05, 0, ".", new Colour(0, 0, 0), 0, false, new Lex("is a rock", ["are ", " rocks"])),
        "chocolate bar": constructItemKind("chocolate bar", 200, 0.05, 0, "c", new Colour(0, 0, 0), 0, false, new Lex("is a chocolate thunder", ["are ", " chocolate thunders"])),
        "coat": constructClothingKind("coat", 3000, 3, 4, ["torso"], "/", 50, new Colour(0, 0, 0), 0, false, new Lex("is a white winter coat", ["are ", " winter coats"])),
        "small bag": constructClothingKind("small bag", 500, 0.3, 10, ["torso"], "U", 5, new Colour(0, 0, 0), 0, false, new Lex("NA", ["NA", "NA"]))
    };
    globalThis.TERRAINFEATUREKINDSMAP = {
        "tree": { name: "tree", symbol: "‖", luminescence: new Colour(0, 0, 0), opacity: 0, blocking: true, lex: new Lex("is a tree") },
    };
    globalThis.GROUNDTYPEKINDSMAP = {
        "mud": new GroundType("mud", new Colour(109, 81, 60), "mudBlend", new Lex("is muddy")),
        "snow": new GroundType("snow", new Colour(240, 240, 240), "mudBlend", new Lex("is covered in snow")),
        "clay": new GroundType("clay", new Colour(0, 0, 0), "clayBlend", new Lex("is slippery, clay-rich soil"))
    };
    globalThis.CTX = undefined;
    globalThis.VIEWPORT = new Viewport(0, 0, 33, 33);
}
window.addEventListener("load", (event) => {
    main();
});
//# sourceMappingURL=main.js.map