namespace pixi_blit {
    export enum CacheType {
        Auto = 0,
        No_Cache = 1,
        Canvas2d = 2,
        WebGL = 3,
        RuntimeWebGL = 4,
    }

    export abstract class AbstractAtlas {
        root = new AtlasNode<RasterCache>();
        rt: PIXI.RenderTexture = null;
        addedElements: Array<RasterCache> = [];
        pad: number = 1;
        totalArea = 0;
        holdArea = 0;

        constructor(public readonly type: CacheType, public options: PIXI.ISize) {
            this.rt = PIXI.RenderTexture.create(options);
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
        }

        calcHoldArea() {
            const { addedElements } = this;
            let holdArea = 0;

            for (let i=0;i<addedElements.length;i++) {
                const elem = addedElements[i];

                if (elem.mem.cacheStatus === CacheStatus.Hold) {
                    holdArea += elem.area;
                }
            }

            this.holdArea = holdArea;

            return holdArea;
        }

        abstract render(): void;
    }
}
