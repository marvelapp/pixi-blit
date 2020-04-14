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

        generateBounds?(model: VectorModel): void;

        generateCanvas?(model: VectorModel): GeneratedCanvasGraphics;
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
        dirtyBounds = false;
        dirtyGraphics = false;

        mipCache: Array<RasterCache> = [];
        instances: { [uniqId: number]: VectorSprite } = {};
        instanceCache: { [uniqId: number]: RasterCache } = {};

        copyBounds(mat: PIXI.Matrix, out: PIXI.Bounds) {
            const {minX, minY, maxX, maxY} = this._genBounds || this._graphics.geometry.bounds;

            out.clear();
            out.addFrameMatrix(mat, minX, maxX, minY, maxY);
        }

        _generator: IVectorGenerator = null;
        _graphics: PIXI.Graphics = null;
        _genBounds: PIXI.Bounds = null;

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

        prepareVector() {
            if (this.vectorMode === VECTOR_MODE.INVALID) {
                throw new Error('cant prepare empty VectorModel');
            }

            if (this.vectorMode === VECTOR_MODE.GENERATED) {
                this.mem.cacheStatus = CacheStatus.Drawn;
                if (!this._graphics || this.dirtyGraphics) {
                    this.dirtyGraphics = false;
                    this._graphics = new PIXI.Graphics();
                    this.generator.generate(this);
                    (this._graphics as any).finishPoly();
                }
            }
        }

        prepareBounds() {
            // for pixi its the same as prepareVector
            const {vectorMode, _generator} = this;

            if (vectorMode === VECTOR_MODE.GENERATED
                && (_generator.generateCanvas || _generator.generateBounds)) {
                if (!this._genBounds || this.dirtyBounds) {
                    this.dirtyBounds = false;
                    this._genBounds = new PIXI.Bounds();
                    _generator.generateBounds(this);
                }
                return;
            }
            this.prepareVector();
        }

        dispose(disposeRaster = false) {
            if (!this._graphics) {
                return;
            }
            if (this.vectorMode === VECTOR_MODE.GENERATED) {
                this._graphics.geometry.destroy();
                this._graphics.destroy();
                this._graphics = null;
            }

            if (disposeRaster) {
                this.disposeRaster();
            }
        }

        disposeRaster() {
            for (let i = 0; i < this.mipCache.length; i++) {
                const elem = this.mipCache[i];

                if (elem) {
                    this.mipCache[i] = null;
                    if (elem.mem.cacheStatus === CacheStatus.Drawn) {
                        elem.mem.cacheStatus = CacheStatus.Hanging;
                    }
                }
            }
        }

        reset() {
            this.dirtyBounds = true;
            this.dirtyGraphics = true;
            this.disposeRaster();
        }

        renderCanvas() {

        }

        isDisposable() {
            if (this.vectorMode !== VECTOR_MODE.GENERATED
                || !this._graphics) {
                return false;
            }

            const len = (this._graphics.geometry as any).points.length;

            // return len >= 100;
            return len > 0;
        }

        preferredCache = CacheType.Auto;
    }
}
