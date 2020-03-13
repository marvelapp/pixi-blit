namespace pixi_blit {
    const updated: Array<RasterCache> = [];
    const bounds = new PIXI.Bounds();

    export class CanvasAtlasResource extends PIXI.resources.Resource {
        constructor(public storage: CanvasAtlasStorage) {
            super(storage.options.width, storage.options.height);
        }

        defaultConflationMode = CANVAS_CONFLATION_MODE.NO;
        detectedConflationMode = CANVAS_CONFLATION_MODE.NO;
        mixedContent = false;

        get source()
        {
            return this.storage.canvas;
        }

        detectConflation() {
            const {atlas} = this.storage;
            const {addedElements} = atlas;
            // render only new elements

            let hasYes = false, hasNo = false;

            for (let i = 0; i < addedElements.length; i++) {
                const elem = addedElements[i];

                let mode = elem.model.conflationMode !== CANVAS_CONFLATION_MODE.AUTO ?
                    elem.model.conflationMode : this.defaultConflationMode;
                if (mode === CANVAS_CONFLATION_MODE.NO) {
                    elem.atlasCanvasAntiConflation = false;
                    hasNo = true;
                } else {
                    elem.atlasCanvasAntiConflation = true;
                    hasYes = true;
                }
            }

            this.mixedContent = hasNo && hasYes;
            if (!this.mixedContent && hasYes) {
                this.detectedConflationMode = CANVAS_CONFLATION_MODE.YES;
            } else {
                this.detectedConflationMode = CANVAS_CONFLATION_MODE.NO;
            }
        }

        fixImageData(imageData: ImageData, fix: boolean = true) {
            if (!fix) {
                return imageData;
            }

            const data = imageData.data;

            let opaque = 0;
            let transparent = 0;
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] > 0) {
                    if (data[i] == 255) {
                        opaque++;
                    } else {
                        transparent++;
                    }
                }
            }

            if (opaque * 99 > transparent) {
                for (let i = 3; i < data.length; i += 4) {
                    if (data[i] > 153) {
                        data[i] = data[i] * 10 - 153 * 9;
                    }
                }
            }
            return imageData;
        }

        upload(renderer: PIXI.Renderer, tex: PIXI.BaseTexture, glTex: PIXI.GLTexture) {
            const {mixedContent, detectedConflationMode} = this;
            const {atlas, canvas, context} = this.storage;
            const {addedElements} = atlas;
            const {gl} = renderer;

            const w = canvas.width;
            const h = canvas.height;

            const dirtyId = glTex.dirtyId;

            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

            if (dirtyId < 0) {
                glTex.width = w;
                glTex.height = h;

                const initData = detectedConflationMode === CANVAS_CONFLATION_MODE.NO
                    ? canvas : this.fixImageData(context.getImageData(0, 0, w, h));
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    initData
                );

                if (!mixedContent) {
                    return true;
                }
            }

            updated.length = 0;
            let area = 0;
            for (let i = 0; i < addedElements.length; i++) {
                const region = addedElements[i];
                if (region.baseTexDirtyId <= dirtyId) {
                    continue;
                }
                const {rect} = region.atlasNode;
                updated.push(region);
                bounds.addFramePad(rect.left, rect.top, rect.left + rect.width, rect.top + rect.height, 0, 0);
                area += rect.width * rect.height;
            }

            let sq = (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);

            if (mixedContent || area * 2 < sq) {
                // multiple rects
                for (let i = 0; i < updated.length; i++) {
                    const {rect} = updated[i].atlasNode;
                    gl.texSubImage2D(
                        gl.TEXTURE_2D,
                        0,
                        rect.left,
                        rect.top,
                        gl.RGBA,
                        gl.UNSIGNED_BYTE,
                        this.fixImageData(context.getImageData(rect.left, rect.top,
                            rect.width, rect.height),
                            updated[i].atlasCanvasAntiConflation)
                    );
                }
            } else {
                gl.texSubImage2D(
                    gl.TEXTURE_2D,
                    0,
                    bounds.minX,
                    bounds.minY,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    this.fixImageData(context.getImageData(bounds.minX, bounds.minY,
                        bounds.maxX - bounds.minX, bounds.maxY - bounds.minY),
                        detectedConflationMode === CANVAS_CONFLATION_MODE.YES)
                );
            }

            return true;
        }
    }
}
