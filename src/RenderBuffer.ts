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

    export interface ITextureOptions {
        width: number;
        height: number;
        resolution: number;
        scaleMode: PIXI.SCALE_MODES;
    }

    export class BlitRequest {
        output: PIXI.RenderTexture = null;
        matchRes = false;
        doClear = false;
        rect = new PIXI.Rectangle();
    }

    import CLEAR_MODES = PIXI.CLEAR_MODES;

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

            this._dimensions = {
                width: options.width,
                height: options.height,
                resolution: options.resolution || 1,
                scaleMode: PIXI.SCALE_MODES.LINEAR,
            };

            this._blitFilter = new PIXI.filters.AlphaFilter();
            this._blitFilter.blendMode = PIXI.BLEND_MODES.NONE;
            this._storageMode = BLIT_STORAGE_MODE.WEBGL_CONTEXT;
            this._init(options);
        }

        _init(options: IRenderBufferOptions) {
            this.innerTexture = PIXI.RenderTexture.create(this._dimensions);
        }

        _dimensions: ITextureOptions;

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

        get dimensions() {
            return this._dimensions;
        }

        get width() {
            return this._dimensions.width;
        }

        get height() {
            return this._dimensions.height;
        }

        get resolution() {
            return this._dimensions.resolution;
        }

        /**
         * method analog to PIXI.Renderer#render : it renders stuff in buffer, then blits it to renderTexture if available
         */
        renderAndBlit(container: PIXI.Container, renderTexture: PIXI.RenderTexture, clear = false,
                      translation?: PIXI.Matrix, skipUpdateTransform = false) {
            //TODO: dont track AA groups in this case. set renderer _activeBlitBuffer
            this.parentRenderer.render(container, this.innerTexture, clear, translation, skipUpdateTransform);
            if (renderTexture) {
                this.blit(renderTexture);
            }
        }

        _blitFilter: PIXI.Filter = null;
        _blitRequest = new BlitRequest();

        /**
         * Texture copy, doesnt support offset due to webgl1 backend.
         * @param destination target renderTexture
         */
        blit(destination: PIXI.RenderTexture) {
            if (this.parentRenderer.context.isLost) {
                return;
            }

            const dimensions = this._dimensions;

            const req = this._blitRequest;
            req.rect.width = Math.min(dimensions.width, destination.width);
            req.rect.height = Math.min(dimensions.height, destination.height);
            req.matchRes = destination.baseTexture.resolution === dimensions.resolution;
            req.doClear = this.clearBeforeBlit == CLEAR_MODES.CLEAR || this.clearBeforeBlit == CLEAR_MODES.AUTO &&
                (destination.width > req.rect.width || destination.height > req.rect.height);
            req.output = destination;

            this._blitInner(req);
        }

        _blitInner(req: BlitRequest) {
            this._blitInnerTexture(req);
        }

        _blitInnerTexture(req: BlitRequest) {
            //this.innerTexture is copied or drawn on req.output, depends on resolution
            const renderer = this.parentRenderer;
            const {gl} = renderer;
            const input = this.innerTexture;
            const {output, rect, matchRes, doClear} = req;

            if (matchRes) {
                if (doClear) {
                    renderer.renderTexture.bind(output);
                    renderer.renderTexture.clear();
                }
                renderer.renderTexture.bind(input);
                renderer.texture.bindForceLocation(output, 0);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                renderer.gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0,
                    rect.width, rect.height);
            } else {
                // TODO: make better filtering here, for example: 3x3 to 1 pixel
                renderer.filter.applyOuterFilter(this._blitFilter, input, output, rect, doClear);
            }
        }

        static create(renderer: PIXI.Renderer, options: IRenderBufferOptions) {
            let storageMode = options.storageMode || BLIT_STORAGE_MODE.AUTO_DETECT;
            if (storageMode === BLIT_STORAGE_MODE.AUTO_DETECT) {
                if (renderer.context.webGLVersion === 2) {
                    storageMode = BLIT_STORAGE_MODE.MSAA;
                } else {
                    storageMode = BLIT_STORAGE_MODE.WEBGL_CONTEXT;
                }
            }
            switch (storageMode) {
                case BLIT_STORAGE_MODE.WEBGL_CONTEXT:
                    return new RenderBufferGL1(renderer, options);
                case BLIT_STORAGE_MODE.MSAA:
                    return new RenderBufferGL2(renderer, options);
                default:
                    return new RenderBuffer(renderer, options);
            }
        }

        dispose() {
            if (this.innerTexture) {
                this.innerTexture.baseTexture.dispose();
            }
        }

        destroy() {
            this.dispose();
            this.innerTexture = null;
            if (this.innerRenderer) {
                this.innerRenderer.destroy();
                this.innerRenderer = null;
            }
        }
    }
}
