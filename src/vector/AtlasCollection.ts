namespace pixi_blit {
    import AbstractAtlasStorage = pixi_blit.AbstractAtlasStorage;

    export interface IMultiAtlasOptions {
        atlasMinSize: number;
        atlasMaxSize: number;
        webglAntialias?: boolean;
        canvasAntiConflation?: boolean;

        dim1MaxSize?: number;
        dim2MinSize?: number;
        dim2MaxSize?: number;
    }

    const lightQueue: Array<RasterCache> = [];

    export class AtlasCollection {
        constructor(public readonly storage: AtlasCollectionStorage) {
            storage.bind(this);
        }

        list: Array<Atlas> = [];
        singles: Array<Atlas> = [];
        //TODO: single elements instead of whole atlas?

        frameRasterQueue: Array<RasterCache> = [];
        frameRasterMap: {[key: number]: RasterCache} = {};

        gcEntries: { [key: number]: IGCEntry };

        addToQueue(raster: RasterCache) {
            this.frameRasterQueue.push(raster);
            this.frameRasterMap[raster.uniqId] =  raster;
            this.gcEntries[raster.uniqId] = raster;
        }

        /**
         * precondition: gc objects have to be already marked as HANGING
         * goes through all atlases, check which ones can be freed
         */
        gcTick() {

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
            const { options } = this.storage;

            return max >= options.dim1MaxSize || min >= options.dim2MinSize && max >= options.dim2MaxSize;
        };

        cacheSingleElem(elem: RasterCache) {
            const { storage, singles } = this;
            const stor = storage.createStorageFor(elem);
            const atlas = new Atlas(stor);
            atlas.pad = 0;
            atlas.insert(elem);
            singles.push(atlas);
        }

        //TODO: move processQueue to strategy, leave only utility methods here

        /**
         * adds all that possible from queue to atlas list
         */
        processQueue() {
            const queue = this.frameRasterQueue;
            const { isBig, storage, list } = this;

            //1. move all the heavy objects to separate textures
            for (let i=0;i<queue.length;i++) {
                const elem = queue[i];
                if (isBig(elem)) {
                    this.cacheSingleElem(elem);
                } else {
                    lightQueue.push(elem);
                }
            }

            //2.
            lightQueue.sort(this.sortMethod);

            //new atlas and resizes here

            //TODO: allow blitter to use smaller area if possible

            lightQueue.length = 0;
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

                atlasMaxSize: 1024,
                atlasMinSize: 128,
                atlasDivStep: 128,
            });
        }

        collection: AtlasCollection = null;
        bind(collection: AtlasCollection) {
            this.collection = collection;
        }

        abstract render(): void;

        abstract createStorageFor(raster: RasterCache): AbstractAtlasStorage;
    }
}
