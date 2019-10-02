declare namespace PIXI {
    export interface DisplayObject {
	    /**
	     * Whether element should be processed by AA
	     */
        aaMode: number;
        _blitCacheData: PIXI.Sprite;
    }
}

namespace pixi_blit {
	(Object as any).assign(PIXI.DisplayObject.prototype, {
        aaMode: 0,
        _blitCacheData: null,
	});
}
