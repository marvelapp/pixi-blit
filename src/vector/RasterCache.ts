namespace pixi_blit {
    export class RasterCache implements IGCEntry {
        outerBounds: PIXI.Rectangle = null;
        instance: VectorSprite;

        mem = new MemoryComponent();
        type = CacheType.Auto;
        // atlas modifies those objects
        graphicsNode: PIXI.Graphics = null;
        texture = new PIXI.Texture(PIXI.Texture.WHITE.baseTexture);

        // atlas sets those values
        atlas: Atlas = null;
        atlasNode: AtlasNode<RasterCache> = null;
        baseTexDirtyId: number = 0;
        atlasCanvasAntiConflation = false;

        newAtlas: Atlas = null;
        newAtlasNode: AtlasNode<RasterCache> = null;
        oldAtlasSprite: PIXI.Sprite = null;

        uniqId: number;
        constructor(public model: VectorModel, mat: PIXI.Matrix) {
            this.uniqId = generateUid();
            this.graphicsNode = new PIXI.Graphics(model.graphics.geometry);
            this.graphicsNode.transform.setFromMatrix(mat);
            this.outerBounds = this.graphicsNode.getBounds();
        }

        get area() {
            return this.outerBounds.width * this.outerBounds.height;
        }

        get width() {
            return this.outerBounds.width;
        }

        get height() {
            return this.outerBounds.height;
        }

        destroy() {
            this.atlas = null;
            this.atlasNode = null;
            this.texture = null;
            this.graphicsNode = null;
            this.mem.cacheStatus = CacheStatus.Disposed;
        }
    }
}
