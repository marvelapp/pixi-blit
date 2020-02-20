namespace pixi_blit {
    export class VectorSprite extends PIXI.Container {
        constructor(public model: VectorModel) {
            super();
        }

        cacheType = CacheType.No_Cache;
    }
}
