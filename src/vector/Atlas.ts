namespace pixi_blit {


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

        unbind() {
            this.atlas = null;
        }

        abstract dispose(): void;
    }

    export class Atlas {
        root: AtlasNode<RasterCache> = null;
        addedElements: Array<RasterCache> = [];
        pad: number = 1;
        isSingle = false;
        totalArea = 0;
        usedArea = 0;
        drawnElements = 0;

        mem = new MemoryComponent();

        uniqId: number;

        constructor(public readonly storage: AbstractAtlasStorage) {
            this.uniqId = generateUid();
            this.root = this.createAtlasRoot();
            storage.bind(this);
        }

        get options() {
            return this.storage.options;
        }

        get type() {
            return this.storage.type;
        }

        markSingle() {
            this.pad = 0;
            this.isSingle = true;
        }

        hasNew() {
            return this.drawnElements < this.addedElements.length;
        }

        markClean() {
            this.drawnElements = this.addedElements.length;
        }

        destroy() {
            const {addedElements} = this;

            this.mem.cacheStatus = CacheStatus.Disposed;
            (this as any).storage = null;
            for (let i = 0; i < addedElements.length; i++) {
                const elem = addedElements[i];
                if (elem.mem.cacheStatus === CacheStatus.Hanging) {
                    elem.destroy();
                }
            }
        }

        protected createAtlasRoot(): AtlasNode<RasterCache> {
            // created only one time!
            let res = AtlasNode.allocate<RasterCache>();
            res.rect.width = this.options.width;
            res.rect.height = this.options.height;
            return res;
        }

        insert(elem: RasterCache) {
            const {pad, root} = this;
            elem.newAtlasNode = root.insert(elem.width + 2 * pad, elem.height + 2 * pad, elem);

            this.totalArea += elem.area;
            this.usedArea += elem.area;

            if (elem.newAtlasNode) {
                elem.newAtlas = this;
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
            this.usedArea = 0;
            this.drawnElements = 0;
        }

        calcHoldArea() {
            const {addedElements} = this;
            let holdArea = 0;

            for (let i = 0; i < addedElements.length; i++) {
                const elem = addedElements[i];

                if (elem.mem.cacheStatus <= CacheStatus.Drawn) {
                    holdArea += elem.area;
                }
            }

            this.usedArea = holdArea;

            return holdArea;
        }

        attach() {

        }

        prepareRender(elem: RasterCache) {
            const {pad, storage} = this;

            if (elem.newAtlas === null) {
                if (elem.atlas === this) {
                    return;
                } else {
                    throw new Error("Atlas element init error: element belongs to another atlas");
                }
            }

            if (elem.newAtlas !== this) {
                throw new Error("Atlas element init error: element should be added to another atlas");
            }

            const prevAtlas = elem.atlas;
            const oldTexture = elem.texture;

            elem.atlas = this;
            elem.atlasNode = elem.newAtlasNode;
            elem.newAtlas = null;
            elem.newAtlasNode = null;

            const {graphicsNode, atlasNode, outerBounds} = elem;

            graphicsNode.transform.position.set(
                -outerBounds.x + pad + atlasNode.rect.left,
                -outerBounds.y + pad + atlasNode.rect.top);
            graphicsNode._recursivePostUpdateTransform();

            elem.texture = new PIXI.Texture(storage.baseTexture,
                new PIXI.Rectangle(atlasNode.rect.left + pad,
                    atlasNode.rect.top + pad, elem.width, elem.height));

            if (prevAtlas) {
                if (elem.oldAtlasSprite) {
                    // moved two times? CURSED! drop it!
                    elem.oldAtlasSprite = null;
                } else {
                    // just after the relocation we allow to copy element data
                    // from previous location if its possible
                    const sprite = elem.oldAtlasSprite = new PIXI.Sprite(oldTexture);
                    elem.oldAtlasSprite.position.set(elem.texture.frame.x, elem.texture.frame.y);
                    sprite._recursivePostUpdateTransform();
                }
            }
        }
    }
}
