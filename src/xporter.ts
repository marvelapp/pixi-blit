/// <reference types="pixi.js-legacy" />

namespace pixi_blit {
    (PIXI as any).blit = pixi_blit;
}

declare module "pixi-blit" {
    export = pixi_blit;
}
