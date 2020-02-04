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
        preferredCache: CacheType;
    }

    export class RasterCache implements IGCEntry {
        key: string;
        mat = new PIXI.Matrix();
        transformedBounds = new PIXI.Bounds();
        outerBounds: PIXI.Bounds;
        atlasNode: AtlasNode<RasterCache>;
        atlas: AbstractAtlas;
        instance: VectorSprite;

        mem = new MemoryComponent();
        area = 0;

        constructor(public model: VectorModel, mat: PIXI.Matrix) {
            this.mat.copyFrom(mat);
        }

        get width() {
            return this.outerBounds.maxX - this.outerBounds.minX;
        }

        get height() {
            return this.outerBounds.maxY - this.outerBounds.minY;
        }
    }
}
