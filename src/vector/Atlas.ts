namespace pixi_blit {
    import BLEND_MODE = PIXI.BLEND_MODES;

    export enum CacheType {
        Auto = 0,
        No_Cache = 1,
        Canvas2d = 2,
        WebGL = 3,
        RuntimeWebGL = 4,
    }

    export abstract class AbstractAtlasStorage {
        constructor(public readonly type: CacheType, public options: PIXI.ISize) {
        }

        readonly baseTexture: PIXI.BaseTexture;

        atlas: Atlas = null;
        bind(atlas: Atlas) {
            this.atlas = atlas;
        }
    }

    export class Atlas {
        root = new AtlasNode<RasterCache>();
        addedElements: Array<RasterCache> = [];
        pad: number = 1;
        totalArea = 0;
        holdArea = 0;
        drawnElements = 0;

        constructor(public readonly storage: AbstractAtlasStorage) {
            storage.bind(this);
        }

        get options() {
            return this.storage.options;
        }

        get type() {
            return this.storage.type;
        }

        hasNew() {
            return this.drawnElements < this.addedElements.length;
        }

        protected createAtlasRoot(): AtlasNode<RasterCache> {
            let res = AtlasNode.allocate<RasterCache>();
            res.rect.width = this.options.width;
            res.rect.height = this.options.height;
            return res;
        }

        insert(elem: RasterCache) {
            const { pad, root } = this;
            elem.atlasNode = root.insert(elem.width + 2 * pad, elem.height + 2 * pad, elem);

            this.totalArea += elem.area;

            if (elem.atlasNode) {
                this.addedElements.push(elem);
                return true;
            }
            return false;
        }

        reset() {
            if (this.root) {
                this.root.freeSubtree();
            }
            this.root = this.createAtlasRoot();
            this.addedElements.length = 0;
            this.totalArea = 0;
            this.holdArea = 0;
            this.drawnElements = 0;
        }

        calcHoldArea() {
            const { addedElements } = this;
            let holdArea = 0;

            for (let i=0;i<addedElements.length;i++) {
                const elem = addedElements[i];

                if (elem.mem.cacheStatus <= CacheStatus.Drawn) {
                    holdArea += elem.area;
                }
            }

            this.holdArea = holdArea;

            return holdArea;
        }

        attach() {

        }

        calcElemPos(elem: RasterCache) {
            const {pad, storage} = this;
            const {graphicsNode, atlasNode, outerBounds, texture} = elem;

            graphicsNode.transform.position.set(
                -outerBounds.x + pad + atlasNode.rect.left,
                -outerBounds.y + pad + atlasNode.rect.top);
            graphicsNode.transform.updateLocalTransform();
            graphicsNode.transform.worldTransform.copyFrom(graphicsNode.transform.localTransform);

            if (texture.baseTexture !== storage.baseTexture) {
                //check that it works without extra actions
                texture.baseTexture = storage.baseTexture;
            }
            texture.frame.x = atlasNode.rect.left + pad;
            texture.frame.y = atlasNode.rect.top + pad;
            texture.frame.width = elem.width;
            texture.frame.height = elem.height;
            texture.orig = texture.frame;
            texture.updateUvs();
        }

        calcPositions() {
            const { addedElements, pad } = this;

            for (let i = 0; i < addedElements.length; i++) {
                this.calcElemPos(addedElements[i]);
            }
        }
    }

    export interface IMultiAtlasOptions {
        size: number;
        textureCount: number;
    }

    export class AtlasCollection {
        constructor(public readonly storage: AtlasCollectionStorage) {
            storage.bind(this);
        }

        list: Array<Atlas> = [];

        frameRasterQueue: Array<RasterCache> = [];
        frameRasterMap: {[key: number]: RasterCache} = {};

        prerender() {
            // handles dead atlases and adds free elements back to queue.

            // takes frame queue and rasterizes everything

            // elements do not move to other atlases
        }
    }

    export abstract class AtlasCollectionStorage {
        constructor(public readonly type: CacheType, public options: IMultiAtlasOptions) {
        }

        collection: AtlasCollection = null;
        bind(collection: AtlasCollection) {
            this.collection = collection;
        }
    }
}
