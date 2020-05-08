/// <reference types="pixi.js-legacy" />
declare namespace pixi_blit {
    class BlitComponent {
        constructor();
        sprite: PIXI.Sprite;
        tryRender(renderer: PIXI.Renderer): boolean;
    }
}
declare namespace pixi_blit {
    enum BLIT_STORAGE_MODE {
        AUTO_DETECT = 0,
        RENDER_TEXTURE = 1,
        MSAA = 2,
        WEBGL_CONTEXT = 3
    }
    interface IRenderBufferOptions {
        width: number;
        height: number;
        resolution?: number;
        storageMode?: BLIT_STORAGE_MODE;
    }
    interface ITextureOptions {
        width: number;
        height: number;
        resolution: number;
        scaleMode: PIXI.SCALE_MODES;
    }
    class BlitRequest {
        output: PIXI.RenderTexture;
        matchRes: boolean;
        doClear: boolean;
        rect: PIXI.Rectangle;
    }
    class RenderBuffer {
        _storageMode: BLIT_STORAGE_MODE;
        constructor(renderer: PIXI.Renderer, options: IRenderBufferOptions);
        _init(options: IRenderBufferOptions): void;
        _dimensions: ITextureOptions;
        parentRenderer: PIXI.Renderer;
        innerRenderer: PIXI.Renderer;
        innerTexture: PIXI.RenderTexture;
        clearBeforeBlit: any;
        get storageMode(): BLIT_STORAGE_MODE;
        get dimensions(): ITextureOptions;
        get width(): number;
        get height(): number;
        get resolution(): number;
        renderAndBlit(container: PIXI.Container, renderTexture: PIXI.RenderTexture, clear?: boolean, translation?: PIXI.Matrix, skipUpdateTransform?: boolean): void;
        _blitFilter: PIXI.Filter;
        _blitRequest: BlitRequest;
        blit(destination: PIXI.RenderTexture): void;
        _blitInner(req: BlitRequest): void;
        _blitInnerTexture(req: BlitRequest): void;
        static create(renderer: PIXI.Renderer, options: IRenderBufferOptions): RenderBuffer;
        dispose(): void;
        destroy(): void;
    }
}
declare namespace pixi_blit {
    class RenderBufferGL1 extends RenderBuffer {
        _init(options: IRenderBufferOptions): void;
        renderAndBlit(container: PIXI.Container, renderTexture: PIXI.RenderTexture, clear?: boolean, translation?: PIXI.Matrix, skipUpdateTransform?: boolean): void;
        _blitInner(req: BlitRequest): void;
    }
}
declare namespace pixi_blit {
    class RenderBufferGL2 extends RenderBuffer {
        _init(options: IRenderBufferOptions): void;
        _framebuffer: PIXI.Framebuffer;
        useBlitForScale: boolean;
        renderAndBlit(container: PIXI.Container, renderTexture: PIXI.RenderTexture, clear?: boolean, translation?: PIXI.Matrix, skipUpdateTransform?: boolean): void;
        _blitInner(req: BlitRequest): void;
    }
}
declare namespace pixi_blit {
}
declare module "pixi-blit" {
    export = pixi_blit;
}
declare namespace PIXI.systems {
    interface FilterSystem {
        applyOuterFilter(filter: Filter, input: RenderTexture, output: RenderTexture, rect: PIXI.Rectangle, clear?: boolean): void;
    }
}
declare namespace pixi_blit {
}
declare namespace PIXI.systems {
    interface TextureSystem {
        bindForceLocation(tex: Texture | BaseTexture, location?: number): void;
    }
}
declare namespace pixi_blit {
}
declare namespace pixi_blit {
    enum CacheType {
        Auto = 0,
        No_Cache = 1,
        Canvas2d = 2,
        WebGL = 3,
        RuntimeWebGL = 4
    }
    abstract class AbstractAtlasStorage {
        readonly type: CacheType;
        options: PIXI.ISize;
        constructor(type: CacheType, options: PIXI.ISize);
        readonly baseTexture: PIXI.BaseTexture;
        atlas: Atlas;
        needClear: boolean;
        bind(atlas: Atlas): void;
        unbind(): void;
        abstract dispose(): void;
    }
    class Atlas {
        readonly storage: AbstractAtlasStorage;
        root: AtlasNode<RasterCache>;
        addedElements: Array<RasterCache>;
        pad: number;
        isSingle: boolean;
        totalArea: number;
        usedArea: number;
        drawnElements: number;
        mem: MemoryComponent;
        uniqId: number;
        constructor(storage: AbstractAtlasStorage);
        get options(): PIXI.ISize;
        get type(): CacheType;
        markSingle(): void;
        hasNew(): boolean;
        markClean(): void;
        destroy(): void;
        protected createAtlasRoot(): AtlasNode<RasterCache>;
        insert(elem: RasterCache): boolean;
        reset(): void;
        calcHoldArea(): number;
        attach(): void;
        prepareRender(elem: RasterCache): void;
    }
}
declare namespace pixi_blit {
    interface IMultiAtlasOptions {
        atlasSize: number;
        webglAntialias?: boolean;
        canvasAntiConflation?: boolean;
        dim1MaxSize?: number;
        dim2MinSize?: number;
        dim2MaxSize?: number;
        atlasAllowInsert?: boolean;
        mergeThreshold?: number;
    }
    class AtlasCollection {
        readonly storage: AtlasCollectionStorage;
        constructor(storage: AtlasCollectionStorage);
        textureOptions: PIXI.ISize;
        list: Array<Atlas>;
        singles: {
            [key: number]: Atlas;
        };
        newSingles: Array<Atlas>;
        drop: Array<AbstractAtlasStorage>;
        pool: Array<AbstractAtlasStorage>;
        frameRasterQueue: Array<RasterCache>;
        addToQueue(raster: RasterCache): void;
        elemSortMethod: (a: RasterCache, b: RasterCache) => number;
        isBig: (elem: RasterCache) => boolean;
        cacheSingleElem(elem: RasterCache): void;
        takeFromPool(): Atlas;
        processQueue(): void;
        gcTick(): void;
        atlasSortMethod: (a: Atlas, b: Atlas) => 1 | 0 | -1;
        removeAtlas(atlas: Atlas): void;
        tryRepack(): void;
        prerender(): void;
        cleanup(): void;
    }
    abstract class AtlasCollectionStorage {
        readonly type: CacheType;
        options: IMultiAtlasOptions;
        constructor(type: CacheType, options: IMultiAtlasOptions);
        collection: AtlasCollection;
        bind(collection: AtlasCollection): void;
        render(): void;
        abstract renderSingle(atlas: Atlas): void;
        abstract createStorageBySize(size: PIXI.ISize): AbstractAtlasStorage;
    }
}
declare namespace pixi_blit {
    class AtlasNode<T> {
        childs: Array<AtlasNode<T>>;
        rect: AtlasRectangle;
        data: T;
        constructor();
        insert(width: number, height: number, data: T): AtlasNode<T>;
        static pool: Array<any>;
        static allocate<T>(): AtlasNode<T>;
        freeSubtree(): void;
    }
    class AtlasRectangle {
        constructor(l?: number, t?: number, w?: number, h?: number);
        left: number;
        top: number;
        height: number;
        width: number;
        set(l: number, t: number, w: number, h: number): void;
    }
}
declare namespace pixi_blit {
    enum CacheStatus {
        Init = 0,
        Drawn = 1,
        Hanging = 2,
        Disposed = 3
    }
    function generateUid(): number;
    class MemoryComponent {
        touchedFrameNum: number;
        touchedFrameCount: number;
        touchedGc: number;
        expire: number;
        touchFrame(frame: number): void;
        touchGc(gcNum: number, lastGcFrameNum: number): void;
        cacheStatus: CacheStatus;
    }
    interface IGCEntry {
        mem: MemoryComponent;
    }
}
declare namespace pixi_blit {
    abstract class GeneratedCanvasGraphics extends PIXI.Container {
        model: VectorModel;
        constructor(model: VectorModel);
        _calculateBounds(): void;
        abstract renderCanvas(renderer: PIXI.CanvasRenderer): void;
    }
    class RasterCache implements IGCEntry {
        model: VectorModel;
        outerBounds: PIXI.Rectangle;
        instance: VectorSprite;
        mem: MemoryComponent;
        type: CacheType;
        graphicsNode: PIXI.Graphics | GeneratedCanvasGraphics;
        texture: PIXI.Texture;
        addingToCollection: AtlasCollection;
        atlas: Atlas;
        atlasNode: AtlasNode<RasterCache>;
        baseTexDirtyId: number;
        atlasCanvasAntiConflation: boolean;
        updateId: number;
        createdMat: PIXI.Matrix;
        newAtlas: Atlas;
        newAtlasNode: AtlasNode<RasterCache>;
        oldAtlasSprite: PIXI.Sprite;
        uniqId: number;
        constructor(model: VectorModel, mat: PIXI.Matrix);
        prepare(): void;
        get area(): number;
        get width(): number;
        get height(): number;
        destroy(): void;
    }
}
declare namespace pixi_blit {
    class ShapeCache {
        renderer: PIXI.Renderer;
        root: PIXI.Container;
        options: IMultiAtlasOptions;
        constructor(renderer: PIXI.Renderer, root: PIXI.Container, options: IMultiAtlasOptions);
        gcExpire: number;
        init(): void;
        registerAtlas(type: CacheType, storage: AtlasCollectionStorage): AtlasCollection;
        models: {
            [key: number]: VectorModel;
        };
        rasters: {
            [key: number]: RasterCache;
        };
        runners: {
            gcTick: PIXI.Runner;
            processQueue: PIXI.Runner;
            prerender: PIXI.Runner;
            tryRepack: PIXI.Runner;
        };
        fillActiveElements: boolean;
        activeElements: Array<VectorSprite>;
        atlases: {
            [key in CacheType]: AtlasCollection;
        };
        frameNum: number;
        lastGcFrameNum: number;
        gcNum: number;
        tryRepack: boolean;
        maxBoundsForMips: number;
        defaultCacheType: CacheType;
        frameTick(): void;
        isEmpty(graphics: PIXI.Graphics): boolean;
        protected visitFrame: (elem: VectorSprite) => void;
        mipBehaviour(elem: VectorSprite): RasterCache;
        protected recFind(elem: PIXI.Container, visit: (elem: VectorSprite) => void): void;
        gcTick(): void;
    }
}
declare namespace pixi_blit {
    let MIN_CACHE_LEVELS: number;
    let MAX_CACHE_LEVELS: number;
    enum CANVAS_CONFLATION_MODE {
        NO = 0,
        YES = 1,
        AUTO = 2
    }
    enum VECTOR_MODE {
        INVALID = 0,
        PROVIDED = 1,
        GENERATED = 2
    }
    interface IVectorGenerator {
        generate(model: VectorModel): void;
        generateBounds?(model: VectorModel): void;
        generateCanvas?(model: VectorModel): GeneratedCanvasGraphics;
    }
    interface IVectorModelOptions {
        generator?: IVectorGenerator;
        params?: {
            [key: string]: any;
        };
        graphics?: PIXI.Graphics;
    }
    class VectorModel {
        constructor(options?: IVectorModelOptions);
        params: {
            [key: string]: any;
        };
        uniqId: number;
        mem: MemoryComponent;
        conflationMode: CANVAS_CONFLATION_MODE;
        vectorMode: VECTOR_MODE;
        dirtyBounds: boolean;
        dirtyGraphics: boolean;
        mipCache: Array<RasterCache>;
        instances: {
            [uniqId: number]: VectorSprite;
        };
        instanceCache: {
            [uniqId: number]: RasterCache;
        };
        copyBounds(mat: PIXI.Matrix, out: PIXI.Bounds): void;
        _generator: IVectorGenerator;
        _graphics: PIXI.Graphics;
        _genBounds: PIXI.Bounds;
        set generator(value: IVectorGenerator);
        get generator(): IVectorGenerator;
        set graphics(value: PIXI.Graphics);
        get graphics(): PIXI.Graphics;
        prepareVector(): void;
        prepareBounds(): void;
        dispose(disposeRaster?: boolean): void;
        disposeRaster(): void;
        reset(): void;
        renderCanvas(): void;
        isDisposable(): boolean;
        preferredCache: CacheType;
    }
}
declare namespace pixi_blit {
    interface ISprite extends PIXI.Container {
        texture: PIXI.Texture;
        tint?: number;
        containsPoint?(point: PIXI.IPoint): boolean;
    }
    interface ISpriteGenerator {
        readonly scaleX: number;
        readonly scaleY: number;
        generateSprite(): ISprite;
    }
    class VectorSprite extends PIXI.Container {
        model: VectorModel;
        constructor(model: VectorModel);
        tint: number;
        preferredCache: CacheType;
        activeCacheType: CacheType;
        activeRaster: RasterCache;
        activeGraphics: PIXI.Graphics;
        activeSprite: ISprite;
        rasterUpdateId: number;
        spriteGenerator: ISpriteGenerator;
        enableRaster(raster: RasterCache): void;
        enableGraphics(geom: PIXI.GraphicsGeometry): void;
        disable(): void;
        updateTransform(): void;
        prerender(): void;
        containsPoint(point: PIXI.IPoint): boolean;
        calculateBounds(): void;
        _render(renderer: PIXI.Renderer): void;
    }
}
declare namespace PIXI {
    interface DisplayObject {
        vectorChildren?: boolean;
    }
}
declare namespace pixi_blit {
}
declare namespace pixi_blit {
}
declare namespace pixi_blit {
    class CanvasAtlasResource extends PIXI.resources.Resource {
        storage: CanvasAtlasStorage;
        constructor(storage: CanvasAtlasStorage);
        defaultConflationMode: CANVAS_CONFLATION_MODE;
        detectedConflationMode: CANVAS_CONFLATION_MODE;
        mixedContent: boolean;
        get source(): HTMLCanvasElement;
        detectConflation(): void;
        fixImageData(imageData: ImageData, fix?: boolean): ImageData;
        upload(renderer: PIXI.Renderer, tex: PIXI.BaseTexture, glTex: PIXI.GLTexture): boolean;
    }
}
declare namespace pixi_blit {
    class CanvasAtlasStorage extends AbstractAtlasStorage {
        options: PIXI.ISize;
        static CanvasHTMLContainer: HTMLElement;
        canvasRt: PIXI.RenderTexture;
        baseTex: PIXI.BaseTexture;
        resource: CanvasAtlasResource;
        rootContainer: PIXI.Container;
        constructor(options: PIXI.ISize);
        get baseTexture(): PIXI.BaseTexture;
        get canvas(): HTMLCanvasElement;
        get context(): CanvasRenderingContext2D;
        hackClear(): void;
        renderOnlyModified: boolean;
        addedToHtml: boolean;
        renderCanvas: (renderer: PIXI.CanvasRenderer) => void;
        dispose(): void;
    }
    class CanvasStorage extends AtlasCollectionStorage {
        renderer: PIXI.Renderer;
        constructor(renderer: PIXI.Renderer, options: IMultiAtlasOptions);
        renderBuffer: RenderBuffer;
        canvasRenderer: PIXI.CanvasRenderer;
        renderSingle(atlas: Atlas): void;
        createStorageBySize(size: PIXI.ISize): CanvasAtlasStorage;
    }
}
declare namespace pixi_blit {
    import Atlas = pixi_blit.Atlas;
    class WebGLAtlasStorage extends AbstractAtlasStorage {
        options: PIXI.ISize;
        rt: PIXI.RenderTexture;
        rootContainer: PIXI.Container;
        constructor(options: PIXI.ISize);
        get baseTexture(): PIXI.BaseTexture;
        renderOnlyModified: boolean;
        renderCopySeparate: boolean;
        copies: Array<PIXI.Sprite>;
        render: (renderer: PIXI.Renderer) => void;
        renderCopies(renderer: PIXI.Renderer): void;
        dispose(): void;
    }
    class BlitterStorage extends AtlasCollectionStorage {
        renderer: PIXI.Renderer;
        constructor(renderer: PIXI.Renderer, options: IMultiAtlasOptions);
        renderBuffer: RenderBuffer;
        renderSingle(atlas: Atlas): void;
        createStorageBySize(size: PIXI.ISize): WebGLAtlasStorage;
    }
}
