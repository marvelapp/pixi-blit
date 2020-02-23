///<reference path="../AtlasCollection.ts"/>
namespace pixi_blit {
    export class WebGLAtlasStorage extends AbstractAtlasStorage {
        rt: PIXI.RenderTexture = null;
        rootContainer = new PIXI.Container();

        constructor(public options: PIXI.ISize) {
            super(CacheType.WebGL, options);
            this.rt = PIXI.RenderTexture.create(options);
            this.rootContainer.render = this.render;
        }

        get baseTexture() {
            return this.rt.baseTexture;
        }

        renderOnlyModified = false;

        /**
         * called from blitterCache
         * @param renderer
         */
        render = (renderer: PIXI.Renderer) => {
            const {atlas, renderOnlyModified} = this;
            const {addedElements} = atlas;
            // render only new elements

            for (let i = 0; i < addedElements.length; i++) {
                const elem = addedElements[i];
                const {graphicsNode, mem} = elem;

                if (renderOnlyModified && mem.cacheStatus !== CacheStatus.Init) {
                    continue;
                }

                //TODO: use drawImage on old sprite
                elem.oldAtlasSprite = null;

                mem.cacheStatus = CacheStatus.Drawn;
                this.atlas.prepareRender(elem);

                if (elem.oldAtlasSprite) {
                    elem.oldAtlasSprite.render(renderer);
                    elem.oldAtlasSprite = null;
                } else {
                    graphicsNode.render(renderer);
                }
            }
        }
    }

    export class BlitterStorage extends AtlasCollectionStorage {
        constructor(public renderer: PIXI.Renderer, options: IMultiAtlasOptions) {
            super(CacheType.WebGL, options);

            const textureOptions = {
                width: options.atlasSize,
                height: options.atlasSize,
            };

            this.renderBuffer = RenderBuffer.create(renderer, textureOptions);
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
                atlas.markClean();

                const storage = atlas.storage as WebGLAtlasStorage;
                //TODO: blit only modified parts
                renderBuffer.renderAndBlit(storage.rootContainer, storage.rt);
            }
        }

        createStorageBySize(size: PIXI.ISize) {
            return new WebGLAtlasStorage({
                width: size.width,
                height: size.height
            });
        }
    }
}
