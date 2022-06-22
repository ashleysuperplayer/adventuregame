import { setup, tick, TICKDURATION } from "./world";

function main() {
    let TICKER;

    setup(1000, 0, [0,0]);
    TICKER = setInterval(tick, TICKDURATION);
}

window.addEventListener("load", (event) => {
    main();
});