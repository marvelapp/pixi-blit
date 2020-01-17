declare namespace PIXI.systems {
    export interface FilterSystem {
        applyOuterFilter(filter: Filter, input: RenderTexture, output: RenderTexture, rect: PIXI.Rectangle, clear?: boolean): void;
    }
}

namespace pixi_blit {
    const tempState = {
        sourceFrame: new PIXI.Rectangle(),
        destinationFrame: new PIXI.Rectangle(),
        resolution: 1,
    };

    function applyOuterFilter(this: PIXI.systems.FilterSystem, filter: PIXI.Filter, input: PIXI.RenderTexture, output: PIXI.RenderTexture,
                              rect: PIXI.Rectangle, clear = true) {
        const state = tempState;
        state.sourceFrame = rect;
        state.destinationFrame = input.frame;
        state.resolution = input.resolution;
        const saveFilterFrame = input.filterFrame;
        (input as any).filterFrame = rect;

        // filling uniforms, copied from pop()

        const globalUniforms = this.globalUniforms.uniforms;

        globalUniforms.outputFrame = state.sourceFrame;
        globalUniforms.resolution = state.resolution;

        const inputSize = globalUniforms.inputSize;
        const inputPixel = globalUniforms.inputPixel;
        const inputClamp = globalUniforms.inputClamp;

        inputSize[0] = state.destinationFrame.width;
        inputSize[1] = state.destinationFrame.height;
        inputSize[2] = 1.0 / inputSize[0];
        inputSize[3] = 1.0 / inputSize[1];

        inputPixel[0] = inputSize[0] * state.resolution;
        inputPixel[1] = inputSize[1] * state.resolution;
        inputPixel[2] = 1.0 / inputPixel[0];
        inputPixel[3] = 1.0 / inputPixel[1];

        inputClamp[0] = 0.5 * inputPixel[2];
        inputClamp[1] = 0.5 * inputPixel[3];
        inputClamp[2] = (state.sourceFrame.width * inputSize[2]) - (0.5 * inputPixel[2]);
        inputClamp[3] = (state.sourceFrame.height * inputSize[3]) - (0.5 * inputPixel[3]);

        (this.globalUniforms as any).update();

        //applying shader
        filter.apply(this, input, output, clear ? PIXI.CLEAR_MODES.CLEAR : PIXI.CLEAR_MODES.NO, state);

        //restore old frame
        (input as any).filterFrame = saveFilterFrame;
    }

	PIXI.systems.FilterSystem.prototype.applyOuterFilter = applyOuterFilter;
}
