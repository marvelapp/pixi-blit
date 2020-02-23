namespace pixi_blit {
    export let MIN_CACHE_LEVELS = 5;
    export let MAX_CACHE_LEVELS = 3;

    export enum CANVAS_CONFLATION_MODE {
        NO = 0,
        YES = 1,
        AUTO = 2,
    }

    export class VectorModel {

        constructor() {
            this.uniqId = generateUid();
        }

        uniqId: number;

        graphics = new PIXI.Graphics();
        mem = new MemoryComponent();
        // works with canvas2d
        conflationMode = CANVAS_CONFLATION_MODE.AUTO;

        mipCache: Array<RasterCache>;
        instances: { [uniqId: number]: RasterCache };
        instanceCache: { [uniqId: number]: RasterCache };

        copyBounds(mat: PIXI.Matrix, out: PIXI.Bounds) {
            const {minX, minY, maxX, maxY} = this.graphics.geometry.bounds;

            out.clear();
            out.addFrameMatrix(mat, minX, maxX, minY, maxY);
        }

        geometry: VectorGeometry;
        preferredCache = CacheType.Auto;
    }

    export class RasterCache implements IGCEntry {
        key: string;
        outerBounds: PIXI.Rectangle = null;
        instance: VectorSprite;

        mem = new MemoryComponent();
        area = 0;
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
