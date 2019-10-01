declare namespace PIXI {
    export interface DisplayObject {
	    /**
	     * Whether element should be processed by AA
	     */
        antialias: boolean;
        _cachedSprite: PIXI.Sprite;
    }
}

namespace pixi_renderbuffer {
	(Object as any).assign(PIXI.DisplayObject.prototype, {
		antialias: false,
		_cachedSprite: null,
	});
}
