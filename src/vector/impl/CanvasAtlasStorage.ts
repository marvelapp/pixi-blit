///<reference path="../AtlasCollection.ts"/>
namespace pixi_blit {
    export class CanvasAtlasStorage extends AbstractAtlasStorage {
        canvasRt: PIXI.RenderTexture = null;
        baseTex: PIXI.BaseTexture = null;
        resource: CanvasAtlasResource = null;
        rootContainer = new PIXI.Container();

        constructor(public options: PIXI.ISize) {
            super(CacheType.Canvas2d, options);

            this.canvasRt = PIXI.RenderTexture.create(options);
            this.rootContainer.renderCanvas = this.renderCanvas;

            this.resource = new CanvasAtlasResource(this);
            this.baseTex = new PIXI.BaseTexture(this.resource);
        }

        get baseTexture() {
            return this.baseTex;
        }

        get canvas(): HTMLCanvasElement {
            return (this.canvasRt as any)._canvasRenderTarget.canvas;
        }

        get context(): CanvasRenderingContext2D {
            return (this.canvasRt as any)._canvasRenderTarget.context;
        }

        renderOnlyModified = true;

        /**
         * called from blitterCache
         * @param renderer
         */
        renderCanvas = (renderer: PIXI.CanvasRenderer) => {
            const {atlas, renderOnlyModified, baseTex} = this;
            const {addedElements} = atlas;
            // render only new elements

            baseTex.update();
            for (let i = 0; i < addedElements.length; i++) {
                const elem = addedElements[i];
                const {graphicsNode, mem} = elem;
                // detect mixed conflation content

                if (renderOnlyModified && elem.atlas === atlas) {
                    continue;
                }

                // move modification id to atlas node?
                elem.baseTexDirtyId = baseTex.dirtyId;
                mem.cacheStatus = CacheStatus.Drawn;
                atlas.prepareRender(elem);

                if (elem.oldAtlasSprite) {
                    elem.oldAtlasSprite.renderCanvas(renderer);
                    elem.oldAtlasSprite = null;
                } else {
                    graphicsNode.renderCanvas(renderer);
                }
            }
        }
    }

    export class CanvasStorage extends AtlasCollectionStorage {
        constructor(public renderer: PIXI.Renderer, options: IMultiAtlasOptions) {
            super(CacheType.WebGL, options);
        }

        renderBuffer: RenderBuffer = null;
        canvasRenderer = new PIXI.CanvasRenderer();

        renderSingle(atlas: Atlas) {
            const {canvasRenderer, renderer} = this;
            if (!atlas.hasNew()) {
                return;
            }
            atlas.markClean();

            const storage = atlas.storage as CanvasAtlasStorage;
            canvasRenderer.render(storage.rootContainer, storage.canvasRt);
            renderer.texture.bind(storage.baseTex, 0);
        }

        createStorageBySize(size: PIXI.ISize) {
            return new CanvasAtlasStorage({
                width: size.width,
                height: size.height
            });
        }
    }
}
