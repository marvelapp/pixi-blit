namespace pixi_blit {
    import AbstractAtlasStorage = pixi_blit.AbstractAtlasStorage;

    export interface IMultiAtlasOptions {
        atlasSize: number;
        webglAntialias?: boolean;
        canvasAntiConflation?: boolean;

        dim1MaxSize?: number;
        dim2MinSize?: number;
        dim2MaxSize?: number;
        atlasAllowInsert?: boolean;
    }

    const lightQueue: Array<RasterCache> = [];
    const newAtlases: Array<Atlas> = [];

    export class AtlasCollection {
        constructor(public readonly storage: AtlasCollectionStorage) {
            storage.bind(this);

            this.textureOptions = {
                width: storage.options.atlasSize,
                height: storage.options.atlasSize,
            }
        }

        textureOptions: PIXI.ISize;

        list: Array<Atlas> = [];
        singles: Array<Atlas> = [];
        drop: Array<Atlas> = [];
        pool: Array<AbstractAtlasStorage> = [];
        //TODO: single elements instead of whole atlas?

        frameRasterQueue: Array<RasterCache> = [];
        frameRasterMap: { [key: number]: RasterCache } = {};

        gcEntries: { [key: number]: IGCEntry };

        addToQueue(raster: RasterCache) {
            this.frameRasterQueue.push(raster);
            this.frameRasterMap[raster.uniqId] = raster;
            this.gcEntries[raster.uniqId] = raster;
        }

        sortMethod = (a: RasterCache, b: RasterCache) => {
            if (b.width == a.width) {
                return b.height - a.height;
            }
            return b.height - a.height;
        };

        isBig = (elem: RasterCache) => {
            const min = Math.min(elem.width, elem.height);
            const max = Math.max(elem.width, elem.height);
            const {options} = this.storage;

            return max >= options.dim1MaxSize || min >= options.dim2MinSize && max >= options.dim2MaxSize;
        };

        cacheSingleElem(elem: RasterCache) {
            const {storage, singles} = this;
            const stor = storage.createStorageBySize(elem);
            const atlas = new Atlas(stor);
            atlas.pad = 0;
            atlas.insert(elem);
            singles.push(atlas);
        }

        takeFromPool() {
            const atlas = new Atlas(this.pool.pop()
                || this.storage.createStorageBySize(this.textureOptions));
            this.list.push(atlas);
            return atlas;
        }

        //TODO: move processQueue to strategy, leave only utility methods here

        /**
         * adds all that possible from queue to atlas list
         */
        processQueue() {
            const queue = this.frameRasterQueue;
            const {isBig, storage, list} = this;

            //1. move all the heavy objects to separate textures
            for (let i = 0; i < queue.length; i++) {
                const elem = queue[i];
                if (isBig(elem)) {
                    this.cacheSingleElem(elem);
                } else {
                    lightQueue.push(elem);
                }
            }

            if (lightQueue.length === 0) {
                return;
            }
            //2.
            lightQueue.sort(this.sortMethod);

            const atlasList = storage.options.atlasAllowInsert ? list : newAtlases;

            for (let i = 0; i < lightQueue.length; i++) {
                const elem = lightQueue[i];

                for (let j = 0; j < atlasList.length; j++) {
                    if (atlasList[j].insert(elem)) {
                        break;
                    }
                }
                if (elem.newAtlas === null) {
                    const newAtlas = this.takeFromPool();
                    newAtlas.insert(elem);
                    newAtlases.push(newAtlas);
                }
            }

            //new atlas and resizes here

            //TODO: allow blitter to use smaller area if possible

            lightQueue.length = 0;
        }

        /**
         * precondition: gc objects have to be already marked as HANGING
         * goes through all atlases, check which ones can be freed
         */
        gcTick() {

        }

        tryRepack() {
            // take N best atlases, try combine them
        }

        prerender() {
            // takes frame queue and rasterizes everything
            this.storage.render();
        }
    }

    export abstract class AtlasCollectionStorage {
        constructor(public readonly type: CacheType, public options: IMultiAtlasOptions) {
            // default setting
            (Object as any).assign(options, {
                dim1MaxSize: 512,
                dim2MinSize: 256,
                dim2MaxSize: 256,
                webglAntialias: true,
                canvasAntiConflation: false,
                atlasAllowInsert: false,

                atlasSize: 1024,
                atlasDivStep: 128,
            });
        }

        collection: AtlasCollection = null;

        bind(collection: AtlasCollection) {
            this.collection = collection;
        }

        abstract render(): void;

        abstract createStorageBySize(size: PIXI.ISize): AbstractAtlasStorage;
    }
}
