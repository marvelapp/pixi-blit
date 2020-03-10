///<reference path="../AtlasCollection.ts"/>
namespace pixi_blit {
    import Atlas = pixi_blit.Atlas;

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
        renderCopySeparate = false;
        copies: Array<PIXI.Sprite> = [];

        /**
         * called from blitterCache
         * @param renderer
         */
        render = (renderer: PIXI.Renderer) => {
            const {atlas, renderOnlyModified, renderCopySeparate, copies} = this;
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

                //TODO: old sprites should be blit on top of result, not to blit thingy!
                if (elem.oldAtlasSprite) {
                    if (renderCopySeparate) {
                        copies.push(elem.oldAtlasSprite);
                    } else {
                        elem.oldAtlasSprite.render(renderer);
                    }
                    elem.oldAtlasSprite = null;
                } else {
                    graphicsNode.render(renderer);
                }
            }
        };

        renderCopies(renderer: PIXI.Renderer) {
            const { copies } = this;

            for (let i = 0; i < copies.length; i++) {
                copies[i].render(renderer);
            }

            copies.length = 0;
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

        renderSingle(atlas: Atlas) {
            const {renderBuffer, renderer} = this;
            if (!atlas.hasNew()) {
                return;
            }
            atlas.markClean();

            const storage = atlas.storage as WebGLAtlasStorage;

            storage.renderCopySeparate = true;

            //TODO: blit only modified parts
            renderBuffer.renderAndBlit(storage.rootContainer, storage.rt, true);

            if (storage.copies.length > 0) {
                renderer.renderTexture.bind(storage.rt);
                storage.renderCopies(renderer);
                renderer.batch.flush();
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
