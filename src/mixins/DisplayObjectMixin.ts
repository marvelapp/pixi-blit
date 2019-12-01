declare namespace PIXI {
    export interface DisplayObject {
	    /**
	     * Whether element should be processed by AA
	     */
        aaMode: number;
        blitComponent: pixi_blit.BlitComponent;
    }
}

namespace pixi_blit {
	(Object as any).assign(PIXI.DisplayObject.prototype, {
        aaMode: 0,
        blitComponent: null,
	});
}
