// function setupMultisample() {
//     let samples = gl.getInternalformatParameter(
//         gl.RENDERBUFFER, gl.RGBA8, gl.SAMPLES)[0];
//
//     framebufferMulti = gl.createFramebuffer();
//
//     gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferMulti);
//
//     let color = gl.createRenderbuffer();
//     gl.bindRenderbuffer(gl.RENDERBUFFER, color);
//     gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color);
//     gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, appWidth, appHeight);
//
//     let stencil = gl.createRenderbuffer();
//     gl.bindRenderbuffer(gl.RENDERBUFFER, stencil);
//     //vvvv Switch those two lines!
//     // gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, stencil);
//     // gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.STENCIL_INDEX8, appWidth, appHeight);
//     gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, stencil);
//     gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH24_STENCIL8, appWidth, appHeight);
// }
//
// function blitMulti() {
//     gl.bindFramebuffer(gl.READ_FRAMEBUFFER, framebufferMulti);
//     gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
//     gl.blitFramebuffer(0, 0, appWidth, appHeight,
//         0, 0, appWidth, appHeight,
//         gl.COLOR_BUFFER_BIT, gl.NEAREST);
// }

namespace pixi_blit {
    export class RenderBufferGL2 extends RenderBuffer {
        _init(options: IRenderBufferOptions) {
            this.msTexture = PIXI.RenderTexture.create(this._dimensions);
            const gl = this.parentRenderer.gl as any;
            this._storageMode = BLIT_STORAGE_MODE.MSAA;
            this._framebuffer = (this.msTexture.baseTexture as any).framebuffer;
            this._framebuffer.samples = gl.getInternalformatParameter(
                gl.RENDERBUFFER, gl.RGBA8, gl.SAMPLES)[0];
        }

        msTexture: PIXI.RenderTexture;
        _framebuffer: PIXI.Framebuffer;
        useBlitForScale = true;

        renderAndBlit(container: PIXI.Container, renderTexture: PIXI.RenderTexture, dontClear = false,
                      translation: PIXI.Matrix, skipUpdateTransform = false) {
            this.parentRenderer.render(container, this.msTexture, dontClear, translation, skipUpdateTransform);
            if (renderTexture) {
                this.blit(renderTexture);
            }
        }

        _blitInner(req: BlitRequest) {
            const renderer = this.parentRenderer;
            const gl = renderer.gl as any;

            const {rect, matchRes, doClear} = req;

            if (!matchRes) {
                if (!this.innerTexture) {
                    this.innerTexture = PIXI.RenderTexture.create(this._dimensions);
                }
                renderer.renderTexture.bind(this.innerTexture);
                // should we use doClear here too?
            } else {
                renderer.renderTexture.bind(req.output);
                if (doClear) {
                    renderer.renderTexture.clear();
                }
            }
            let readFramebuffer = this._framebuffer.glFramebuffers[(renderer as any).CONTEXT_UID].framebuffer;
            const drawFramebuffer = (renderer.framebuffer as any).current.glFramebuffers[(renderer as any).CONTEXT_UID].framebuffer;
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, readFramebuffer);

            const inputRes = this._dimensions.resolution;
            const outRes = req.output.baseTexture.resolution;
            const w = Math.round(rect.width * inputRes), h = Math.round(rect.height * inputRes);

            gl.blitFramebuffer(0, 0, w, h,
                0, 0, w, h,
                gl.COLOR_BUFFER_BIT, gl.NEAREST
            );
            if (!matchRes) {
                if (this.useBlitForScale) {
                    renderer.renderTexture.bind(req.output);
                    const w2 = Math.round(rect.width * outRes), h2 = Math.round(rect.height * outRes);
                    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, drawFramebuffer);
                    gl.blitFramebuffer(0, 0, w, h,
                        0, 0, w2, h2,
                        gl.COLOR_BUFFER_BIT, gl.LINEAR
                    );
                } else {
                    this._blitInnerTexture(req);
                }
            }
            renderer.renderTexture.bind(null);
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        }

        dispose() {
            super.dispose();
            this.msTexture.baseTexture.dispose();
        }
    }
}
