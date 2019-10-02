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
        resolution: number;
        storageMode: BLIT_STORAGE_MODE
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
            this.renderTexture = PIXI.RenderTexture.create(options);
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
        renderTexture: PIXI.RenderTexture = null;

        get storageMode() {
            return this._storageMode;
        }

        get width() {
            return this.renderTexture.width;
        }

        get height() {
            return this.renderTexture.height;
        }

        get resolution() {
            return this.renderTexture.resolution; // getter for baseTexture.resolution
        }

        render(container: PIXI.Container, dontClear = false,
               translation: PIXI.Matrix, skipUpdateTransform = false) {
            this.parentRenderer.render(container, this.renderTexture, dontClear, translation, skipUpdateTransform);
        }

        /**
         * Texture copy, doesnt support offset due to webgl1 backend.
         * @param renderTexture target renderTexture
         */
        blit(renderTexture: PIXI.RenderTexture) {
            const gl = this.parentRenderer.gl;

            const w = Math.min(this.width, renderTexture.width);
            const h = Math.min(this.height, renderTexture.height);

            gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, w, h);
        }

        static create(renderer: PIXI.Renderer, options: IRenderBufferOptions) {
            return new RenderBuffer(renderer, options);
        }
    }
}
