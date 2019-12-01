declare namespace PIXI {
    export interface Framebuffer {
        samples?: number;
        width?: number;
        height?: number;
        stencil?: boolean;
        depth?: boolean;
        glFramebuffers: any;
    }
}

declare namespace PIXI.systems {
    export interface FramebufferSystem {
        updateMultiSampleFramebuffer(framebuffer: Framebuffer): void;

        CONTEXT_UID?: number;
        gl?: any;
    }
}

namespace pixi_blit {
    const oldUpdateFramebuffer = (PIXI.systems.FramebufferSystem.prototype as any).updateFramebuffer;
    const oldDisposeFramebuffer = PIXI.systems.FramebufferSystem.prototype.disposeFramebuffer;

    function updateFramebuffer(this: PIXI.systems.FramebufferSystem, framebuffer: PIXI.Framebuffer) {
        if (framebuffer.samples) {
            this.updateMultiSampleFramebuffer(framebuffer);
        } else {
            oldUpdateFramebuffer.call(this, framebuffer);
        }
    }

    function updateMultiSampleFramebuffer(this: PIXI.systems.FramebufferSystem, framebuffer: PIXI.Framebuffer) {
        const {gl} = this;
        const fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];

        if (!fbo.multisample) {
            fbo.multisample = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.multisample);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, fbo.multisample);
            gl.renderbufferStorageMultisample(gl.RENDERBUFFER, framebuffer.samples, gl.RGBA8, framebuffer.width, framebuffer.height);
        }

        if (!fbo.stencil && (framebuffer.stencil || framebuffer.depth)) {
            fbo.stencil = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.stencil);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, framebuffer.width, framebuffer.height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, fbo.stencil);
        }
    }

    function disposeFramebuffer(framebuffer: PIXI.Framebuffer, contextLost?: boolean) {
        const fbo = framebuffer.glFramebuffers[this.CONTEXT_UID];
        oldDisposeFramebuffer.call(this, framebuffer, contextLost);
        if (!contextLost) {
            this.gl.deleteRenderbuffer(fbo.multisample);
        }
    }

    PIXI.Framebuffer.prototype.samples = 0;
    (PIXI.systems.FramebufferSystem.prototype as any).updateFramebuffer = updateFramebuffer;
    PIXI.systems.FramebufferSystem.prototype.disposeFramebuffer = disposeFramebuffer;
    PIXI.systems.FramebufferSystem.prototype.updateMultiSampleFramebuffer = updateMultiSampleFramebuffer;
}
