namespace pixi_blit {
    export class BlitCacheData {
        constructor() {

        }

        sprite: PIXI.Sprite = null;

        tryRender(renderer: PIXI.Renderer) {
            if (this.sprite) {
                this.sprite.render(renderer);
                return true;
            }

            return false;
        }
    }
}
