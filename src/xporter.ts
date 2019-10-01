/// <reference types="pixi.js" />

namespace pixi_antialias {
	(PIXI as any).antialias = pixi_antialias;
}

declare module "pixi-antialias" {
	export = pixi_antialias;
}
