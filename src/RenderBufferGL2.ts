namespace pixi_blit {
    const inRect = new PIXI.Rectangle(0, 0, 1, 1);
    const outRect = new PIXI.Rectangle(0, 0, 1, 1);

    export class RenderBufferGL2 extends RenderBuffer {
        _init(options: IRenderBufferOptions) {
            this.innerTexture = PIXI.RenderTexture.create(this._dimensions);
            this._storageMode = BLIT_STORAGE_MODE.MSAA;
            this._framebuffer = (this.innerTexture.baseTexture as any).framebuffer;
            this._framebuffer.multisample = PIXI.MSAA_QUALITY.HIGH;
        }

        _framebuffer: PIXI.Framebuffer;
        useBlitForScale = true;

        renderAndBlit(container: PIXI.Container, renderTexture: PIXI.RenderTexture, clear = false,
                      translation?: PIXI.Matrix, skipUpdateTransform = false) {
            this.parentRenderer.render(container, this.innerTexture, clear, translation, skipUpdateTransform);
            if (renderTexture) {
                this.blit(renderTexture);
            }
        }

        _blitInner(req: BlitRequest) {
            const renderer = this.parentRenderer;
            const gl = renderer.gl as any;
            const {rect, matchRes, doClear} = req;
            const resizeTo: PIXI.Framebuffer = (req.output.baseTexture as any).framebuffer;
            const blitTo = matchRes ? resizeTo : null;
            const inputRes = this._dimensions.resolution;
            const outRes = req.output.baseTexture.resolution;

            if (doClear) {
                renderer.renderTexture.bind(req.output);
                renderer.renderTexture.clear();
            }
            renderer.renderTexture.bind(this.innerTexture);


            inRect.width = Math.round(rect.width * inputRes);
            inRect.height = Math.round(rect.height * inputRes);

            renderer.framebuffer.blit(blitTo, inRect, inRect);
            if (!matchRes) {
                if (this.useBlitForScale) {
                    outRect.width = Math.round(rect.width * outRes);
                    outRect.height = Math.round(rect.height * outRes);
                    renderer.framebuffer.blit(resizeTo, inRect, outRect);
                } else {
                    this._blitInnerTexture(req);
                }
            }
            renderer.renderTexture.bind(null);
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        }
    }
}
