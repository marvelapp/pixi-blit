namespace pixi_blit {
    const tempBounds = new PIXI.Bounds();
    const tempMat = new PIXI.Matrix();

    export class ShapeCache {
        constructor() {
        }

        models: { [key: number]: VectorModel };
        entries: { [key: number]: IGCEntry };

        root: PIXI.Container;
        frameNum: number;
        lastGcFrameNum: number;
        gcNum: number;

        maxBoundsForMips = 1024;

        public frameTick() {
            this.frameNum++;
            this.recFind(this.root, this.visitFrame);
        }

        protected visitFrame = (elem: VectorSprite): void => {
            const {model} = elem;

            model.mem.touchFrame(this.frameNum);

            const mip = this.mipBehaviour(elem);

            if (mip) {
                if (mip.mem.cacheStatus === CacheStatus.Init) {
                    // call for vectorization if WebGL
                    // add to atlas here
                }
            } else {
                // call for vectorization
            }
        };

        mipBehaviour(elem: VectorSprite): RasterCache {
            const { model } = elem;
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
                return raster;
            }

            mat.a = mat.d = Math.pow(2, mipLevel);
            mat.tx = mat.ty = 0;

            raster = model.mipCache[mipLevel] = new RasterCache(model, mat);
            model.copyBounds(mat, raster.transformedBounds);

            if (model.mipCache.length <= mipLevel) {
                model.mipCache.length = mipLevel + 1;
            }

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
            for (let key in this.models) {
                let model = this.models[key];
                model.mem.touchGc(this.gcNum, this.lastGcFrameNum);
            }
            this.lastGcFrameNum = this.gcNum;

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
