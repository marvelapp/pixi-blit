namespace pixi_blit {
    export let MIN_CACHE_LEVELS = 5;
    export let MAX_CACHE_LEVELS = 3;

    export class VectorModel {

        constructor() {
            this.uniqId = generateUid();
        }

        uniqId: number;

        graphics = new PIXI.Graphics();
        mem = new MemoryComponent();

        mipCache: Array<RasterCache>;
        instances: { [uniqId: number]: RasterCache };
        instanceCache: { [uniqId: number]: RasterCache };

        copyBounds(mat: PIXI.Matrix, out: PIXI.Bounds) {
            const { minX, minY, maxX, maxY } = this.graphics.geometry.bounds;

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
        // atlas modifies this
        graphicsNode: PIXI.Graphics = null;
        texture = new PIXI.Texture(PIXI.Texture.WHITE.baseTexture);

        // atlas sets those values
        atlas: Atlas;
        atlasNode: AtlasNode<RasterCache>;

        constructor(public model: VectorModel, mat: PIXI.Matrix) {
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
    }
}
