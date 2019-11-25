namespace pixi_blit {
    export class RenderBufferGL1 extends RenderBuffer {
        _init(options: IRenderBufferOptions) {
            this.innerRenderer = new PIXI.Renderer({
                antialias: true,
                ...this._dimensions
            });
        }

        renderAndBlit(container: PIXI.Container, renderTexture: PIXI.RenderTexture, dontClear = false,
                      translation: PIXI.Matrix, skipUpdateTransform = false) {
            if (this.innerRenderer.context.isLost) {
                return;
            }

            this.innerRenderer.render(container, undefined, dontClear, translation, skipUpdateTransform);
            if (renderTexture) {
                this.blit(renderTexture);
            }
        }

        _blitInner(req: BlitRequest) {
            if (this.innerRenderer.context.isLost) {
                return;
            }
            const renderer = this.parentRenderer;
            const {gl} = renderer;
            const sourceCanvas = this.innerRenderer.view;

            const {output, rect, matchRes, doClear} = req;
            const dimensions = this._dimensions;
            const ignoreInnerTexture = matchRes && rect.width == dimensions.width
                && rect.height == dimensions.height;

            if (ignoreInnerTexture) {
                if (doClear) {
                    renderer.renderTexture.bind(output);
                    renderer.renderTexture.clear();
                }
                renderer.texture.bindForceLocation(output, 0);
            } else {
                if (!this.innerTexture) {
                    this.innerTexture = PIXI.RenderTexture.create(this._dimensions);
                }
                // should we use doClear here too?
                renderer.texture.bindForceLocation(this.innerTexture, 0);
            }

            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);

            if (!ignoreInnerTexture) {
                this._blitInnerTexture(req);
            }
        }
    }
}
