namespace pixi_blit {
    export enum BLIT_STORAGE_MODE {
        AUTO_DETECT = 0,
        RENDER_TEXTURE = 1,
        MSAA,
        WEBGL_CONTEXT,
    }

    export interface IRenderBufferOptions {
        width: number;
        height: number;
        resolution?: number;
        storageMode?: BLIT_STORAGE_MODE
    }

    export enum CLEAR_MODES {
        OFF = 0,
        AUTO = 1,
        ON = 2
    }

    /**
     * high-level API that is backed by
     * 1. renderTexture
     * 2. MSAA renderbuffer inside hacked RenderTexture/Framebuffer
     * 3. another webgl context
     */
    export class RenderBuffer {
        _storageMode = BLIT_STORAGE_MODE.RENDER_TEXTURE;

        constructor(renderer: PIXI.Renderer, options: IRenderBufferOptions) {
            this.parentRenderer = renderer;

            this._init(options);
        }

        _init(options: IRenderBufferOptions) {
            this.innerTexture = PIXI.RenderTexture.create(options);
            this._blitFilter = new PIXI.filters.AlphaFilter();
            this._blitFilter.blendMode = PIXI.BLEND_MODES.NONE;
        }

        /**
         * parent renderer
         */
        parentRenderer: PIXI.Renderer = null;
        /**
         * inner renderer, if present then its WebGL1
         */
        innerRenderer: PIXI.Renderer = null;
        /**
         * inner texture, hacked or not
         */
        innerTexture: PIXI.RenderTexture = null;

        clearBeforeBlit = CLEAR_MODES.AUTO;

        get storageMode() {
            return this._storageMode;
        }

        get width() {
            return this.innerTexture.width;
        }

        get height() {
            return this.innerTexture.height;
        }

        get resolution() {
            return this.innerTexture.resolution; // getter for baseTexture.resolution
        }

        /**
         * method analog to PIXI.Renderer#render : it renders stuff in buffer, then blits it to renderTexture if available
         */
        renderAndBlit(container: PIXI.Container, renderTexture: PIXI.RenderTexture, dontClear = false,
               translation: PIXI.Matrix, skipUpdateTransform = false) {
            //TODO: dont track AA groups in this case. set renderer _activeBlitBuffer
            this.parentRenderer.render(container, this.innerTexture, dontClear, translation, skipUpdateTransform);
            if (renderTexture) {
                this.blit(renderTexture);
            }
        }

        _blitRect = new PIXI.Rectangle();
        _blitFilter: PIXI.Filter = null;
        /**
         * Texture copy, doesnt support offset due to webgl1 backend.
         * @param destination target renderTexture
         */
        blit(destination: PIXI.RenderTexture) {
            //this.renderTexture is copied or drawn on
            //renderTexture , depends on resolution
            const renderer = this.parentRenderer;
            const { gl } = renderer;
            const source = this.innerTexture;

            const rect = this._blitRect;
            rect.width = Math.min(source.width, destination.width);
            rect.height = Math.min(source.height, destination.height);

            let doClear = this.clearBeforeBlit == CLEAR_MODES.ON || this.clearBeforeBlit == CLEAR_MODES.AUTO &&
                (destination.width > rect.width || destination.height > rect.height);

            if (source.baseTexture.resolution === destination.baseTexture.resolution) {
                if (doClear) {
                    //TODO: do we really need it?
                    renderer.renderTexture.bind(destination);
                    renderer.renderTexture.clear();
                }
                renderer.renderTexture.bind(source);
                renderer.texture.bindForceLocation(destination, 0);
                renderer.gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, rect.width, rect.height);
            } else {
                // TODO: make better filtering here, for example: 3x3 to 1 pixel
                renderer.filter.applyOuterFilter(this._blitFilter, source, destination, rect, doClear);
            }
        }

        static create(renderer: PIXI.Renderer, options: IRenderBufferOptions) {
            return new RenderBuffer(renderer, options);
        }
    }
}
