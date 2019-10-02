declare namespace PIXI {
    export interface DisplayObject {
	    /**
	     * Whether element should be processed by AA
	     */
        antialias: boolean;
        _blitCacheData: PIXI.Sprite;
    }
}

namespace pixi_blit {
	(Object as any).assign(PIXI.DisplayObject.prototype, {
		antialias: false,
        _blitCacheData: null,
	});
}
