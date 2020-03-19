namespace pixi_blit {
    const tempMat = new PIXI.Matrix();

    export interface ISprite extends PIXI.Container {
        texture: PIXI.Texture;
    }

    export interface ISpriteGenerator {
        readonly scaleX: number;
        readonly scaleY: number;

        generateSprite(): ISprite;
    }

    export class VectorSprite extends PIXI.Container {
        constructor(public model: VectorModel) {
            super();
        }

        activeCacheType = CacheType.No_Cache;
        activeRaster: RasterCache = null;
        activeGraphics: PIXI.Graphics = null;
        activeSprite: ISprite = null;

        spriteGenerator: ISpriteGenerator = null;

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

        updateTransform() {
            super.updateTransform();
            if (this.activeSprite) {
                this.activeSprite.transform.updateTransform(this.transform);
                (this.activeSprite as any).worldAlpha = this.worldAlpha;
            }
            if (this.activeGraphics) {
                this.activeGraphics.transform.updateTransform(this.transform);
                (this.activeGraphics as any).worldAlpha = this.worldAlpha;
            }
        }

        prerender() {
            const {activeRaster, activeGraphics} = this;

            // position the raster or graphics
            if (activeRaster) {
                if (activeRaster.mem.cacheStatus > CacheStatus.Drawn) {
                    throw Error("CacheStatus for active raster in vectorSprite is not Drawn!");
                }

                if (!this.activeSprite) {
                    if (this.spriteGenerator) {
                        this.activeSprite = this.spriteGenerator.generateSprite();
                    } else {
                        this.activeSprite = new PIXI.Sprite();
                    }
                }
                this.activeSprite.texture = activeRaster.texture;
                tempMat.copyFrom(activeRaster.graphicsNode.transform.localTransform);
                tempMat.tx = -activeRaster.outerBounds.x;
                tempMat.ty = -activeRaster.outerBounds.y;
                tempMat.invert();
                this.activeSprite.transform.setFromMatrix(tempMat);
            }
        }

        _render(renderer: PIXI.Renderer) {
            const {activeRaster, activeGraphics, activeSprite} = this;
            if (activeRaster) {
                (activeSprite as any)._render(renderer);
            } else if (activeGraphics) {
                (activeGraphics as any)._render(renderer);
            } else {
                // ??? guess no graphics for us, render a marker?
            }
        }
    }
}
