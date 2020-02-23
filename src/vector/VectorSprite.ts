namespace pixi_blit {
    export class VectorSprite extends PIXI.Container {
        constructor(public model: VectorModel) {
            super();
        }

        activeCacheType = CacheType.No_Cache;
        activeRaster: RasterCache = null;
        activeGraphics: PIXI.Graphics = null;

        enableRaster(raster: RasterCache) {
            this.activeRaster = raster;
            this.activeCacheType = raster.type;
        }

        enableGraphics(geom: PIXI.GraphicsGeometry) {
            this.activeCacheType = CacheType.No_Cache;
            if (this.activeGraphics && this.activeGraphics.geometry) {
                return;
            }
            this.activeRaster = null;
            this.activeGraphics = new PIXI.Graphics(geom);
        }

        disable() {
            this.activeCacheType = CacheType.No_Cache;
            this.activeGraphics = null;
            this.activeRaster = null;
        }

        render(renderer: PIXI.Renderer) {
            if (this.activeRaster) {
                // render raster
            }
            else if (this.activeGraphics) {

            } else {
                // ??? guess no graphics for us, render a marker?
            }
        }
    }
}
