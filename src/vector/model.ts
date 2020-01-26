declare namespace PIXI {
    export interface DisplayObject {
        vectorChildren?: boolean;
    }
}

namespace pixi_blit {
    (Object as any).assign(PIXI.DisplayObject.prototype, {
        vectorChildren: true,
    });
}

namespace pixi_blit {
    // target
    // 1. changing shift & scale -> use pow2
    // 2. same shift & scale for a long time - use instanced

    //Main algo
    // 1. Find all the graphics that have to be rendered on stage
    // 2. Mark old mips as aren't needed
    // 3. Drop a few old atlases if they are cost less then X% mem, starting from even old ones
    // drop runtime atlases
    // 4. put all instances in new atlases
    // 5. put everything else in runtime atlas
    // 6. mark rest as full runtime
    // 7. draw all atlases

    // 8. render: do it all

    // How to decide which cache works on element? canvas/webgl?
    // some elements should prefer canvas, some webgl, and there has to be default setting.
    // WebGL2 if available. Canvas for IE, WebGL for the rest.
    // one model has only one preferred

    enum CacheType {
        None = 0,
        Canvas2d = 1,
        WebGL = 2,
        RuntimeWebGL = 3,
    }

    enum CacheStatus {
        Hold = 0,
        Hanging = 1,
        Disposed = 2,
    }

    export interface IVectorModel {
        mipCache: Array<IRasterCache>
        instances: { [uniqId: number]: IRasterCache }
        instanceCache: { [uniqId: number]: IRasterCache }

        geometry: IVectorGeometry;
        preferredCache: CacheType;

        touchedFrame: number;
    }

    export interface IGCEntry {
        memoryBytes: number;
        // frequency how its touched?
        touched: number;
        createdAt: number;
        tickUsed: number;
        draw(node: IModelInstance): void;

        dispose(): void;
        cacheStatus: CacheStatus;
    }

    export interface IVectorGeometry extends IGCEntry {
    }

    export interface IModelInstance {
        uniqId: number;
        model: IVectorModel;
    }

    export interface IAtlas {
    }

    export interface IRasterCache extends IGCEntry {
        key: string;
        model: IVectorModel;
        mat: PIXI.Matrix; //matrix that element was rendered with
        atlasNode: AtlasNode<IRasterCache>;
        atlas: IAtlas;
        instance: IModelInstance; // instance on screen that it belong to. Null means shared
    }

    let uniqIdCounter = 0;

    export function generateUid() {
        return ++uniqIdCounter;
    }

    export class MemoryComponent {
        touchedFrameNum = -1;
        touchedFrameCount = 0;
        touchedGc = 0;
        touchFrame(frame: number) {
            if (this.touchedFrameNum < frame) {
                this.touchedFrameNum = frame;
                this.touchedFrameCount = 0;
            }
            this.touchedFrameCount++;
        }
        touchGc(gcNum: number, lastGcFrameNum: number) {
            if (this.touchedFrameNum > lastGcFrameNum) {
                this.touchedGc = gcNum;
            }
        }
        cacheStatus: CacheStatus;
    }

    export class VectorModel {
        constructor() {
            this.uniqId = generateUid();
        }

        uniqId: number;

        graphics = new PIXI.Graphics();
        mem = new MemoryComponent();
    }

    export class RasterCache {
        key: string;
        model: VectorModel;
        mat: PIXI.Matrix;
        transformedBounds: PIXI.Bounds;
        atlasNode: AtlasNode<RasterCache>;
        atlas: IAtlas;
        instance: VectorSprite;

        get width() {
            return this.transformedBounds.maxX - this.transformedBounds.minX;
        }

        get height() {
            return this.transformedBounds.maxY - this.transformedBounds.minY;
        }
    }

    export class VectorSprite extends PIXI.Container {
        model: VectorModel;
    }

    export class ShapeCache {
        constructor() {
        }

        models: { [key: number]: VectorModel };
        entries: { [key: number]: IGCEntry };

        root: PIXI.Container;
        frameNum: number;
        lastGcFrameNum: number;
        gcNum: number;

        public frameTick() {
            this.frameNum++;
            this.recFind(this.root, this.visitFrame);
        }

        protected visitFrame = (elem: VectorSprite): void => {
            const {model} = elem;

            model.mem.touchFrame(this.frameNum);
        };

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

    export abstract class AbstractAtlas {
        root = new AtlasNode<RasterCache>();
        rt: PIXI.RenderTexture = null;
        addedElements: Array<RasterCache> = [];
        pad: number = 1;

        constructor(public options: PIXI.ISize) {
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
        }

        abstract render(): void;
    }
}
