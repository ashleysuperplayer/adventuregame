import { throwExpression, clamp } from "./util.js";

export class Colour {
    r: number;
    g: number;
    b: number;
    constructor(r: number, g: number, b: number) {
        this.r = clamp(r, 0, 255);
        this.g = clamp(g, 0, 255);
        this.b = clamp(b, 0, 255);
    }
    
    isZero(): boolean {
        return this.r==0 && this.g==0 && this.b==0;
    }

    static Zero(): Colour{
        return new Colour(0, 0, 0);
    }

    static sum(colours: Colour[]): Colour {
        let out = Colour.Zero();
        for (let colour of colours) {
            out = out.add(colour);
        }
        return out;
    }
    
    mag(): number {
        return (this.r + this.g + this.b) / 3;
    }

    add(c: Colour): Colour {
        return new Colour(
            255*255*(this.r+c.r) / (255*255 + this.r*c.r),
            255*255*(this.g+c.g) / (255*255 + this.g*c.g),
            255*255*(this.b+c.b) / (255*255 + this.b*c.b)
        );
    }

    scalarmult(x: number): Colour {
        return new Colour(this.r*x, this.g*x, this.b*x);
    }
    
    toString() {
        return `RGB(${this.r}, ${this.g}, ${this.b})`;
    }
}

// adds two numbers in [0, 255], guaranteed to land in [0, 255], inspired by relativistic velocity addition
function addcolours(c1: number, c2: number) {
    return 255*255*(c1+c2) / (255*255 + c1*c2);
}

// attenuation coeff for a light some distance away (TODO: precompute?)
function attenuate(dx: number, dy: number) {
    return 1/(0.5*(dx*dx+dy*dy)+1);
}

// returns light level from 0 to 200
function timeToLight(time: number) {
    const l = 200 * 0.5*(Math.cos(2*Math.PI * time / globalThis.MINSPERDAY / 10) + 1); // super fast for debug
    return new Colour(l*1.05, l, l);
}
//test comment please remove
export function updateLighting() {
    let lights = [];
    const amblight = timeToLight(globalThis.TIME);
    const lightrange = 8;

    // reset light level of all cells to the ambient level
    for (let cellY = -11; cellY < 44; cellY++) { // (screen length) // TODO remove these magical numbers lol
        for (let cellX = -5; cellX < 44; cellX++) { // (screen length)
            const cell = CELLMAP[`${cellX - 16 + PLAYER.x},${cellY - 16 + PLAYER.y}`];
            if (!cell) continue;
            cell.lightLevel = amblight;
        }
    }

    // find all light sources among visible(+epsilon) cells, and add their influences
    for (let cellY = -11; cellY < 44; cellY++) { // (screen length) // TODO remove these magical numbers lol
        for (let cellX = -5; cellX < 44; cellX++) { // (screen length)
            const cell = CELLMAP[`${cellX - 16 + PLAYER.x},${cellY - 16 + PLAYER.y}`];
            if (!cell) continue;
            const lum = cell.maxLum();
            if (lum.isZero()) continue;

            // then cell contains a light
            for (let dy = -lightrange; dy <= lightrange; ++dy) {
                for (let dx = -lightrange; dx <= lightrange; ++dx) {
                    const cell2 = CELLMAP[`${cell.x+dx},${cell.y+dy}`];
                    if (!cell2) continue;
                    cell2.lightLevel = cell2.lightLevel.add(lum.scalarmult(attenuate(dx,dy)));
                }
            }
        }
    }
}
