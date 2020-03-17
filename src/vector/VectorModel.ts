namespace pixi_blit {
    export let MIN_CACHE_LEVELS = 5;
    export let MAX_CACHE_LEVELS = 3;

    export enum CANVAS_CONFLATION_MODE {
        NO = 0,
        YES = 1,
        AUTO = 2,
    }

    export enum VECTOR_MODE {
        INVALID = 0,
        PROVIDED = 1,
        GENERATED = 2,
    }

    export interface IVectorGenerator {
         generate(model: VectorModel): void;
    }

    export interface IVectorModelOptions {
        generator?: IVectorGenerator;
        params?: { [key: string]: any };
        graphics?: PIXI.Graphics;
    }

    export class VectorModel {

        constructor(options?: IVectorModelOptions) {
            this.uniqId = generateUid();

            options = options || {};

            if (options.generator) {
                this.generator = options.generator;
            } else if (options.graphics) {
                this.graphics = options.graphics;
            }

            this.params = options.params || {};
        }


        params: { [key: string]: any };

        uniqId: number;

        mem = new MemoryComponent();
        // works with canvas2d
        conflationMode = CANVAS_CONFLATION_MODE.AUTO;
        vectorMode = VECTOR_MODE.PROVIDED;

        mipCache: Array<RasterCache> = [];
        instances: { [uniqId: number]: VectorSprite } = {};
        instanceCache: { [uniqId: number]: RasterCache } = {};

        copyBounds(mat: PIXI.Matrix, out: PIXI.Bounds) {
            const {minX, minY, maxX, maxY} = this.graphics.geometry.bounds;

            out.clear();
            out.addFrameMatrix(mat, minX, maxX, minY, maxY);
        }

        _generator: IVectorGenerator = null;
        _graphics: PIXI.Graphics = null;

        set generator(value: IVectorGenerator) {
            this._generator = value;
            this.vectorMode = VECTOR_MODE.GENERATED;
        }

        get generator() {
            return this._generator;
        }

        set graphics(value: PIXI.Graphics) {
            this._graphics = value;
            this.vectorMode = VECTOR_MODE.PROVIDED;
            //TODO: mark graphics as static somehow - dont modify after measurements are taken
        }

        get graphics() {
            return this._graphics;
        }

        prepare() {
            if (this.vectorMode === VECTOR_MODE.INVALID) {
                throw new Error('cant prepare empty VectorModel');
            }

            if (this.vectorMode === VECTOR_MODE.GENERATED) {
                if (!this._graphics) {
                    this._graphics = new PIXI.Graphics();
                    this.generator.generate(this);
                    (this._graphics as any).finishPoly();
                }
            }
        }

        preferredCache = CacheType.Auto;
    }
}
