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

        markClean() {
            this.drawnElements = this.addedElements.length;
        }


        protected createAtlasRoot(): AtlasNode<RasterCache> {
            let res = AtlasNode.allocate<RasterCache>();
            res.rect.width = this.options.width;
            res.rect.height = this.options.height;
            return res;
        }

        insert(elem: RasterCache) {
            const {pad, root} = this;
            elem.newAtlasNode = root.insert(elem.width + 2 * pad, elem.height + 2 * pad, elem);

            this.totalArea += elem.area;
            this.holdArea += elem.area;

            if (elem.newAtlasNode) {
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
            const {addedElements} = this;
            let holdArea = 0;

            for (let i = 0; i < addedElements.length; i++) {
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

            elem.atlas = this;
            elem.atlasNode = elem.newAtlasNode;
            elem.newAtlas = null;
            elem.newAtlasNode = null;

            const {graphicsNode, atlasNode, outerBounds, oldAtlasSprite} = elem;

            graphicsNode.transform.position.set(
                -outerBounds.x + pad + atlasNode.rect.left,
                -outerBounds.y + pad + atlasNode.rect.top);
            graphicsNode.transform.updateLocalTransform();
            graphicsNode.transform.worldTransform.copyFrom(graphicsNode.transform.localTransform);

            elem.texture = new PIXI.Texture(storage.baseTexture,
                new PIXI.Rectangle(atlasNode.rect.left + pad,
                    atlasNode.rect.top + pad, elem.width, elem.height));

            if (prevAtlas)
            {
                // just after the relocation we allow to copy element data
                // from previous location if its possible
                elem.oldAtlasSprite = new PIXI.Sprite(elem.texture);
                elem.oldAtlasSprite.position.set(elem.texture.frame.x, elem.texture.frame.y);
            }
        }
    }
}
