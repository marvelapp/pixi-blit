namespace pixi_blit {
    export abstract class GeneratedCanvasGraphics extends PIXI.Container {
        constructor(public model: VectorModel) {
            super();
        }

        _calculateBounds() {
            this._bounds.clear();
            this._bounds.addBoundsMatrix(this.model._genBounds, this.transform.worldTransform);
        }

        abstract renderCanvas(renderer: PIXI.CanvasRenderer): void;
    }

    export class RasterCache implements IGCEntry {
        outerBounds: PIXI.Rectangle = null;
        instance: VectorSprite;

        mem = new MemoryComponent();
        type = CacheType.Auto;
        // atlas modifies those objects
        graphicsNode: PIXI.Graphics | GeneratedCanvasGraphics = null;
        texture = new PIXI.Texture(PIXI.Texture.WHITE.baseTexture);

        addingToCollection: AtlasCollection = null;

        // atlas sets those values
        atlas: Atlas = null;
        atlasNode: AtlasNode<RasterCache> = null;
        baseTexDirtyId: number = 0;
        atlasCanvasAntiConflation = false;

        createdMat: PIXI.Matrix;
        newAtlas: Atlas = null;
        newAtlasNode: AtlasNode<RasterCache> = null;
        oldAtlasSprite: PIXI.Sprite = null;

        uniqId: number;

        constructor(public model: VectorModel, mat: PIXI.Matrix) {
            this.uniqId = generateUid();
            this.createdMat = mat.clone();
        }

        // should be called once type of raster is determined;
        prepare() {
            const {model} = this;
            const {vectorMode, generator} = model;

            if (this.type === CacheType.Canvas2d
                && vectorMode === VECTOR_MODE.GENERATED
                && generator.generateCanvas) {
                this.graphicsNode = generator.generateCanvas(model);
            } else {
                // pixi graphics mode
                model.prepareVector();
                this.graphicsNode = new PIXI.Graphics(model.graphics.geometry);
            }
            this.graphicsNode.transform.setFromMatrix(this.createdMat);
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
