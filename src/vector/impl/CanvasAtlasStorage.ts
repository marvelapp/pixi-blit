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

                if (renderOnlyModified && mem.cacheStatus !== CacheStatus.Init) {
                    continue;
                }

                // move modification id to atlas node?
                elem.baseTexDirtyId = baseTex.dirtyId;
                mem.cacheStatus = CacheStatus.Drawn;
                atlas.calcElemPos(elem);

                //TODO: clip here!

                graphicsNode.renderCanvas(renderer);
            }
        }
    }

    export class CanvasStorage extends AtlasCollectionStorage {
        constructor(public renderer: PIXI.Renderer, options: IMultiAtlasOptions) {
            super(CacheType.WebGL, options);

            const textureOptions = {
                width: options.size,
                height: options.size,
            };
        }

        renderBuffer: RenderBuffer = null;
        canvasRenderer = new PIXI.CanvasRenderer();

        render() {
            const {canvasRenderer} = this;
            const {list} = this.collection;
            for (let j = 0; j < list.length; j++) {
                const atlas = list[j];
                if (!atlas.hasNew()) {
                    continue;
                }
                atlas.markClean();

                const storage = atlas.storage as CanvasAtlasStorage;
                canvasRenderer.render(storage.rootContainer, storage.canvasRt);
                this.renderer.texture.bind(storage.baseTex, 0);
            }
        }
    }
}
