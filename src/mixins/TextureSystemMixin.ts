declare namespace PIXI.systems {
    export interface TextureSystem {
        bindForceLocation(tex: Texture | BaseTexture, location?: number): void;
    }
}

namespace pixi_blit {
    function bindForceLocation(this:PIXI.systems.TextureSystem, tex: PIXI.Texture | PIXI.BaseTexture, location = 0) {
        const { gl } = this as any;
        if (this.currentLocation !== location) {
            (this as any).currentLocation = location;
            gl.activeTexture(gl.TEXTURE0 + location);
        }
        this.bind(tex, location);
    }
    PIXI.systems.TextureSystem.prototype.bindForceLocation = bindForceLocation;

}
