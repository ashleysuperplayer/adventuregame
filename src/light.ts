import { throwExpression } from "./util.js";

// adds two numbers in [0, 255], guaranteed to land in [0, 255], inspired by relativistic velocity addition
function addcolours(c1: number, c2: number) {
    return 255*255*(c1+c2) / (255*255 + c1*c2);
}

// attenuation coeff for a light some distance away (TODO: precompute?)
function attenuate(dx: number, dy: number) {
    return 1/(dx*dx+dy*dy+1);
}

// TODO lighting needs to be calculated for a few cells AROUND where the player can actually see
// calculate lighting based on avg lighting of 4 adjacent cells, there is definitely a better way to do it
export function calcCellLighting(cellCoords: string) {
    const cell = CELLMAP[cellCoords] ?? throwExpression(`invalid cell coords LIGHTING "${cellCoords}"`) // needs to return cell

    let cum = 0;
    const searchradius = 5;
    for (let dy = -searchradius; dy <= searchradius; ++dy) {
        for (let dx = -searchradius; dx <= searchradius; ++dx) {
            const cell2 = CELLMAP[`${cell.x+dx},${cell.y+dy}`];
            if (!cell2) continue;
            const lum = cell2.maxLum();
            if (lum === 0) continue;
            // we have a light source in cell2
            cum = addcolours(cum, lum*attenuate(dx, dy));
        }
    }
    cell.lightLevel = Math.floor(cum);
};

export function updateLighting() {
    for (let cellY = -11; cellY < 44; cellY++) { // (screen length) // TODO remove these magical numbers lol
        for (let cellX = -5; cellX < 44; cellX++) { // (screen length)
            calcCellLighting(`${cellX - 16 + PLAYER.x},${cellY - 16 + PLAYER.y}`);
            // definitely a better way to do all this
            // place "seen" cells into a register and then calc their lighting
            // until it drops to/below ambient light and then stop tracking them?
        }
    }
}

// let AMBLIGHTAMP = 200;
