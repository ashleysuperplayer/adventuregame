import { GroundType, setup, tick } from "./world.js";
function main() {
    let TICKER;
    setGlobals();
    setup(1000, 0, [0, 0]);
    TICKER = setInterval(tick, globalThis.TICKDURATION);
}
function setGlobals() {
    globalThis.MINSPERDAY = 1440;
    globalThis.TICKSPERMINUTE = 600;
    globalThis.TICKDURATION = 100;
    globalThis.TICKSPERDAY = 86400;
    globalThis.MOBSMAP = {};
    globalThis.MOBKINDSMAP = {
        "player": { name: "player", symbol: "@" },
        "npctest": { name: "npctest", symbol: "T" }
    };
    globalThis.ITEMKINDSMAP = {
        "oil lamp": { name: "oil lamp", symbol: "o", luminescence: 125, weight: 2700, space: 1, opacity: 0, blocking: false },
        "rock": { name: "rock", symbol: ".", luminescence: 0, weight: 100, space: 0.1, opacity: 0, blocking: false },
        "chocolate thunder": { name: "chocolate thunder", symbol: "c", luminescence: 0, weight: 10, space: 0.01, opacity: 0, blocking: false }
    };
    globalThis.TERRAINFEATUREKINDSMAP = {
        "tree": { name: "tree", symbol: "#", luminescence: 0, opacity: 0, blocking: true },
    };
    globalThis.GROUNDTYPEKINDSMAP = {
        "mud": new GroundType("mud", [109, 81, 60], "mudBlend"),
        "snow": new GroundType("snow", [240, 240, 240], "mudBlend"),
        "clay": new GroundType("clay", [0, 0, 0], "clayBlend")
    };
}
window.addEventListener("load", (event) => {
    main();
});
//# sourceMappingURL=main.js.map