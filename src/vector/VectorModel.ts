namespace pixi_blit {
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

        geometry: VectorGeometry;
        preferredCache: CacheType;
    }

    export class RasterCache implements IGCEntry {
        key: string;
        model: VectorModel;
        mat: PIXI.Matrix;
        transformedBounds: PIXI.Bounds;
        atlasNode: AtlasNode<RasterCache>;
        atlas: AbstractAtlas;
        instance: VectorSprite;

        mem = new MemoryComponent();
        area = 0;

        get width() {
            return this.transformedBounds.maxX - this.transformedBounds.minX;
        }

        get height() {
            return this.transformedBounds.maxY - this.transformedBounds.minY;
        }
    }
}
