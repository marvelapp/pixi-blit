declare namespace PIXI {
    // export interface Container {
    //     containerRenderWebGL?(renderer: Renderer): void;
    // }
}

namespace pixi_blit {
    const oldFunc = PIXI.Container.prototype.render;

    (Object as any).assign(PIXI.Container.prototype, {
        render: function (renderer: PIXI.Renderer): void {
            if (this._blitCacheData && this._blitCacheData.tryRender(renderer)) {
                return;
            }
            oldFunc.call(this, renderer);
        },
        containerRenderWebGL: oldFunc
    });
}
