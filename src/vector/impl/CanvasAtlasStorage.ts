namespace pixi_blit {

    export class CanvasAtlasStorage extends AbstractAtlasStorage {
        canvas: HTMLCanvasElement = null;
        baseTex: PIXI.BaseTexture = null;
        rootContainer = new PIXI.Container();

        constructor(public options: PIXI.ISize) {
            super(CacheType.WebGL, options);

            this.rootContainer.renderCanvas = this.renderCanvas;
        }

        get baseTexture() {
            return this.baseTex;
        }

        renderModified = false;

        /**
         * called from blitterCache
         * @param renderer
         */
        renderCanvas = (renderer: PIXI.CanvasRenderer) => {
            const {atlas, renderModified} = this;
            const {addedElements} = atlas;
            // render only new elements

            for (let i = 0; i < addedElements.length; i++) {
                const elem = addedElements[i];
                const {graphicsNode, mem} = elem;

                if (renderModified && mem.cacheStatus !== CacheStatus.Init) {
                    continue;
                }
                mem.cacheStatus = CacheStatus.Drawn;
                this.atlas.calcElemPos(elem);
                graphicsNode.renderCanvas(renderer);
            }
        }
    }

    export class CanvasStorage extends AtlasCollectionStorage {
        constructor(public renderer: PIXI.CanvasRenderer, options: IMultiAtlasOptions) {
            super(CacheType.WebGL, options);

            const textureOptions = {
                width: options.size,
                height: options.size,
            };
        }

        renderBuffer: RenderBuffer = null;

        render() {
            const {renderBuffer} = this;
            const {list} = this.collection;
            for (let j = 0; j < list.length; j++) {
                const atlas = list[j];
                if (!atlas.hasNew()) {
                    continue;
                }

                const storage = atlas.storage as CanvasAtlasStorage;
                //TODO: blit only modified parts
            }
        }
    }
}
