namespace pixi_blit {
    const tempMat = new PIXI.Matrix();

    export class VectorSprite extends PIXI.Container {
        constructor(public model: VectorModel) {
            super();
        }

        activeCacheType = CacheType.No_Cache;
        activeRaster: RasterCache = null;
        activeGraphics: PIXI.Graphics = null;
        activeSprite: PIXI.Sprite = null;

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
            this.activeSprite = null;
            this.activeGraphics = new PIXI.Graphics(geom);
        }

        disable() {
            this.activeCacheType = CacheType.No_Cache;
            this.activeGraphics = null;
            this.activeRaster = null;
            this.activeSprite = null;
        }

        prerender() {
            const {activeRaster, activeGraphics} = this;

            // position the raster or graphics
            if (activeRaster) {
                if (!this.activeSprite) {
                    this.activeSprite = new PIXI.Sprite();
                }
                const {transform} = this.activeSprite;
                tempMat.copyFrom(activeRaster.graphicsNode.transform.localTransform);
                tempMat.tx -= activeRaster.outerBounds.x;
                tempMat.ty -= activeRaster.outerBounds.y;
                tempMat.invert();
                transform.setFromMatrix(tempMat);
                transform.updateTransform(this.transform);
            } else if (activeGraphics) {
                activeGraphics.transform.worldTransform.copyFrom(this.transform.worldTransform);
            }
        }

        _render(renderer: PIXI.Renderer) {
            const {activeRaster, activeGraphics, activeSprite} = this;
            if (activeRaster) {
                // render raster
                (activeSprite as any)._render(renderer);
            } else if (activeGraphics) {
                (activeGraphics as any)._render(renderer);
            } else {
                // ??? guess no graphics for us, render a marker?
            }
        }
    }
}
