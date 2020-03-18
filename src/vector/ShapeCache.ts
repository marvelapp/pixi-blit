namespace pixi_blit {

    const tempBounds = new PIXI.Bounds();
    const tempMat = new PIXI.Matrix();
    const tempRasters: Array<RasterCache> = [];
    const tempModels: Array<VectorModel> = [];

    export class ShapeCache {
        constructor(public renderer: PIXI.Renderer,
                    public root: PIXI.Container,
                    public options: IMultiAtlasOptions) {
            this.init();
        }

        /**
         * number of gc ticks after which element will expire
         */
        gcExpire = 100;

        init() {
            const {renderer} = this;

            this.gcExpire = 100;

            const canvasOptions: IMultiAtlasOptions = (Object as any).assign({
                size: 1024,
                textureCount: 30,
                canvasAntiConflation: false,
            }, this.options);

            const blitterOptions: IMultiAtlasOptions = (Object as any).assign({
                size: 1024,
                textureCount: 30,
                webglAntialias: true,
                atlasAllowInsert: false,
            }, this.options);

            this.registerAtlas(CacheType.Canvas2d, new CanvasStorage(renderer, canvasOptions));
            this.registerAtlas(CacheType.WebGL, new BlitterStorage(renderer, blitterOptions));
            // this.registerAtlas(CacheType.RuntimeWebGL, new BlitterStorage(renderer, options));
        }

        registerAtlas(type: CacheType, storage: AtlasCollectionStorage): AtlasCollection {
            const collection = new AtlasCollection(storage);

            this.atlases[type] = collection;
            for (let key in this.runners) {
                (this.runners as any)[key].add(collection);
            }

            return collection;
        }

        models: { [key: number]: VectorModel } = {};
        rasters: { [key: number]: RasterCache } = {};

        runners = {
            gcTick: new PIXI.Runner('gcTick'),
            processQueue: new PIXI.Runner('processQueue'),
            prerender: new PIXI.Runner('prerender'),
            tryRepack: new PIXI.Runner('tryRepack'),
        };

        atlases: { [key in CacheType]: AtlasCollection } = [null, null, null, null, null] as any;
        activeElements: Array<VectorSprite> = [];
        frameNum = 0;
        lastGcFrameNum = 0;
        gcNum = 0;

        tryRepack = false;

        maxBoundsForMips = 1024;

        defaultCacheType = CacheType.WebGL;

        public frameTick() {
            const {activeElements, runners} = this;

            this.frameNum++;
            activeElements.length = 0;
            this.recFind(this.root, this.visitFrame);
            runners.processQueue.emit();
            if (this.tryRepack) {
                runners.tryRepack.emit();
                this.tryRepack = false;
            }
            this.runners.prerender.emit();

            // before or after FOR, depending on mechanism of updateTransform, we might have to call it
            // this.root.updateTransform()
            for (let i = 0; i < activeElements.length; i++) {
                activeElements[i].prerender();
            }
        }

        //TODO: move method to graphics class
        isEmpty(graphics: PIXI.Graphics) {
            (graphics as any).finishPoly();
            return (graphics.geometry as any).graphicsData.length === 0;
        }

        protected visitFrame = (elem: VectorSprite): void => {
            const {model} = elem;

            if (!this.models[model.uniqId]) {
                this.models[model.uniqId] = model;
            }

            model.prepareBounds();

            const {graphics} = model;

            this.activeElements.push(elem);

            if (graphics && this.isEmpty(graphics)) {
                elem.disable();
                return;
            }

            model.mem.touchFrame(this.frameNum);

            //TODO: runtime instanced instead of mips
            const mip = this.mipBehaviour(elem);

            if (mip) {
                if (mip.mem.cacheStatus === CacheStatus.Init) {
                    if (mip.type === CacheType.Auto) {
                        mip.type = this.defaultCacheType;
                    }
                    mip.prepare();
                    //TODO: call for vectorization if WebGL
                    this.atlases[mip.type].addToQueue(mip);
                }
                elem.enableRaster(mip);

                //TODO: touch has to be called for static elements in case they didnt appear in visitFrame
                mip.mem.touchFrame(this.frameNum);
                // elem check raster according to its position
            } else {
                model.prepareVector();
                elem.enableGraphics(model.graphics.geometry);
            }
        };

        mipBehaviour(elem: VectorSprite): RasterCache {
            const {model} = elem;
            const mat = tempMat.copyFrom(elem.transform.worldTransform);
            const elemBounds = tempBounds;

            //TODO: scale9grid caching?

            //TODO: cache transform details

            //use this thing as mat if we use precise?
            mat.a = Math.sqrt(mat.a * mat.a + mat.b * mat.b);
            mat.d = Math.sqrt(mat.c * mat.c + mat.d * mat.d);
            mat.b = 0;
            mat.c = 0;
            mat.tx -= Math.round(mat.tx);
            mat.ty -= Math.round(mat.ty);

            //TODO: use scaled AABB if not rotated

            model.copyBounds(elem.transform.worldTransform, elemBounds);

            if (elemBounds.maxX - elemBounds.minX > this.maxBoundsForMips
                || elemBounds.maxY - elemBounds.minY > this.maxBoundsForMips) {
                return null;
            }
            const matrixScale = Math.max(mat.a, mat.d);
            let mipLevel = Math.ceil(Math.log(matrixScale) / Math.LN2 - (1e-2));
            // clamp
            mipLevel = Math.min(Math.max(mipLevel, -MIN_CACHE_LEVELS), MAX_CACHE_LEVELS);

            let raster = model.mipCache[mipLevel];

            if (raster) {
                if (raster.mem.cacheStatus === CacheStatus.Disposed) {
                    // in case its already disposed
                    // report re-creation to statistics!
                    delete model.mipCache[mipLevel];
                } else {
                    return raster;
                }
            }

            mat.a = mat.d = Math.pow(2, mipLevel);
            mat.tx = mat.ty = 0;


            if (model.mipCache.length <= mipLevel) {
                model.mipCache.length = mipLevel + 1;
            }
            // RasterCache sets its transformedBounds in constructor
            raster = model.mipCache[mipLevel] = new RasterCache(model, mat);
            raster.mem.expire = this.gcExpire;
            this.rasters[raster.uniqId] = raster;

            return raster;
        }

        protected recFind(elem: PIXI.Container, visit: (elem: VectorSprite) => void) {
            if (elem instanceof VectorSprite) {
                visit(elem);
            }
            if (!elem.vectorChildren) {
                return;
            }
            const {children} = elem;
            for (let i = 0; i < children.length; i++) {
                this.recFind(children[i] as PIXI.Container, visit);
            }
        }

        public gcTick() {
            this.gcNum++;

            for (let key in this.rasters) {
                const raster = this.rasters[key];
                const {mem} = raster;

                if (mem.cacheStatus === CacheStatus.Disposed) {
                    // something was disposed in prev tick
                    tempRasters.push(raster);
                }

                mem.touchGc(this.gcNum, this.lastGcFrameNum);
            }

            for (let key in this.models) {
                const model = this.models[key];
                const {mem} = model;

                if (!model.isDisposable()) {
                    continue;
                }
                mem.touchGc(this.gcNum, this.lastGcFrameNum);
                if (mem.cacheStatus === CacheStatus.Hanging) {
                    // something was disposed in prev tick
                    model.dispose();
                }
                tempModels.push(model);
            }

            for (let i = 0; i < tempRasters.length; i++) {
                delete this.rasters[tempRasters[i].uniqId];
            }
            tempRasters.length = 0;
            for (let i = 0; i < tempRasters.length; i++) {
                delete this.models[tempModels[i].uniqId];
            }
            tempModels.length = 0;

            this.lastGcFrameNum = this.frameNum;
            this.runners.gcTick.emit();
            this.tryRepack = true;

            // 1. Find all the graphics that have to be rendered on stage
            // 2. Mark old mips as aren't needed
            // 3. Drop a few old atlases if they are cost less then X% mem, starting from even old ones
            // drop runtime atlases
            // 4. put all instances in new atlases
            // 5. put everything else in runtime atlas
            // 6. mark rest as full runtime
            // 7. draw all atlases
        }
    }
}
