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
        mergeThreshold?: number;
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
        singles: { [key: number]: Atlas } = {};
        newSingles: Array<Atlas> = [];
        drop: Array<Atlas> = [];
        pool: Array<AbstractAtlasStorage> = [];

        frameRasterQueue: Array<RasterCache> = [];
        frameRasterMap: { [key: number]: RasterCache } = {};

        gcEntries: { [key: number]: IGCEntry } = {};

        addToQueue(raster: RasterCache) {
            if (this.frameRasterMap[raster.uniqId]) {
                return;
            }
            this.frameRasterQueue.push(raster);
            this.frameRasterMap[raster.uniqId] = raster;
            this.gcEntries[raster.uniqId] = raster;
        }

        elemSortMethod = (a: RasterCache, b: RasterCache) => {
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
            const {storage, singles, newSingles} = this;
            const stor = storage.createStorageBySize(elem);
            const atlas = new Atlas(stor);
            atlas.markSingle();
            atlas.insert(elem);
            if (!elem.newAtlas) {
                throw new Error("Cant add element in single atlas");
            }

            newSingles.push(atlas);
            singles[atlas.uniqId] = atlas;
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
            queue.length = 0;

            if (lightQueue.length === 0) {
                return;
            }
            //2.
            lightQueue.sort(this.elemSortMethod);

            const atlasList = storage.options.atlasAllowInsert ? list : newAtlases;

            //TODO: try add to last atlas with repack, if possible, like in @mbusyrev algo

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
                    if (!elem.newAtlas) {
                        throw new Error("Cant add element in shared atlas");
                    }
                    newAtlases.push(newAtlas);
                }
            }

            //new atlas and resizes here

            //TODO: allow blitter to use smaller area if possible

            lightQueue.length = 0;
            newAtlases.length = 0;
        }

        /**
         * precondition: gc objects have to be already marked as HANGING
         * goes through all atlases, check which ones can be freed
         */
        gcTick() {

        }

        atlasSortMethod = (a: Atlas, b: Atlas) => {
            if (a.usedArea - b.usedArea > 0) {
                return 1;
            }
            if (a.usedArea - b.usedArea < 0) {
                return -1;
            }
            return 0;
        };

        removeAtlas(atlas: Atlas) {
            const {list, pool} = this;

            if (atlas.isSingle) {
                //single!
                delete this.singles[atlas.uniqId];
                atlas.destroy();
            } else {
                const ind = list.indexOf(atlas);
                if (ind < 0) {
                    throw new Error('removed atlas not found in the list');
                }
                list.splice(ind, 1);
                atlas.mem.cacheStatus = CacheStatus.Hanging;
                this.drop.push(atlas);
            }

            atlas.storage.unbind();
            pool.push(atlas.storage);
        }

        tryRepack() {
            const {list} = this;
            for (let i = 0; i < list.length; i++) {
                list[i].calcHoldArea();
            }
            list.sort(this.atlasSortMethod);
            // take N best atlases, try combine them
            let N = 0;
            const {atlasSize, mergeThreshold} = this.storage.options;

            while (list.length >= 1 && list[0].usedArea === 0) {
                this.removeAtlas(list[0]);
            }

            //TODO: also use changed tick?
            if (list.length >= 2) {
                if (list[0].usedArea + list[1].usedArea < atlasSize * atlasSize * mergeThreshold) {
                    N = 2;
                }
            } else if (list.length >= 3) {
                if (list[0].usedArea + list[1].usedArea + list[2].usedArea < 2 * atlasSize * atlasSize * mergeThreshold) {
                    N = 3;
                }
            }

            for (let j = 0; j < N; j++) {
                for (let i = 0; i < list[j].addedElements.length; i++) {
                    const elem = list[j].addedElements[i];
                    if (elem.mem.cacheStatus <= CacheStatus.Drawn) {
                        lightQueue.push(elem);
                    }
                }
            }

            lightQueue.sort(this.elemSortMethod);
            for (let j = 0; j + 1 < N; j++) {
                newAtlases.push(this.takeFromPool());
            }

            lightQueue.sort(this.elemSortMethod);

            let failFlag = false;

            for (let i = 0; i < lightQueue.length; i++) {
                const elem = lightQueue[i];

                for (let j = 0; j < newAtlases.length; j++) {
                    if (newAtlases[j].insert(elem)) {
                        break;
                    }
                }
                if (elem.newAtlas === null) {
                    failFlag = true;
                    break;
                }
            }

            if (failFlag) {
                list.length = list.length - newAtlases.length;
            } else {
                for (let j = N - 1; j >= 0; j--) {
                    this.removeAtlas(list[j]);
                }
            }
            lightQueue.length = 0;
            newAtlases.length = 0;
        }

        prerender() {
            // takes frame queue and rasterizes everything
            this.storage.render();
            this.cleanup();
        }

        cleanup() {
            const {drop} = this;
            for (let i = 0; i < drop.length; i++) {
                drop[i].destroy();
            }
            drop.length = 0;
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
                mergeThreshold: 0.8
            });
        }

        collection: AtlasCollection = null;

        bind(collection: AtlasCollection) {
            this.collection = collection;
        }

        render() {
            const {list, newSingles} = this.collection;
            for (let j = 0; j < list.length; j++) {
                this.renderSingle(list[j]);
            }
            for (let j = 0; j < newSingles.length; j++) {
                this.renderSingle(newSingles[j]);
            }
            newSingles.length = 0;
        }

        abstract renderSingle(atlas: Atlas): void;

        abstract createStorageBySize(size: PIXI.ISize): AbstractAtlasStorage;
    }
}
