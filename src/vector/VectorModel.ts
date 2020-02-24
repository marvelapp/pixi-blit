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

        mipCache: Array<RasterCache> = [];
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
}
