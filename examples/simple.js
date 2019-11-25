const app = new PIXI.Application({ antialias: false });
document.body.appendChild(app.view);

const circle = new PIXI.Graphics();

circle.beginFill(0xDE3249);
circle.drawCircle(100, 100, 100);
circle.endFill();

const rect = new PIXI.Graphics();
rect.beginFill(0xFEEB77);
rect.drawRect(0, 0, 300, 300);

const textures = [];

const storageMode = PIXI.blit.BLIT_STORAGE_MODE.WEBGL_CONTEXT;

let buffers = [
    PIXI.blit.RenderBuffer.create(app.renderer, { width: 200, height: 200, storageMode }),
    PIXI.blit.RenderBuffer.create(app.renderer, { width: 200, height: 200, resolution: 2, storageMode })
];

for (let i=0;i<6;i++) {
    let row = i % 2;
    let col = i >> 1;
    let buf = buffers[row];
    buf.clearBeforeBlit = 0;

    let size = 250;
    if (col===1) {
        size = 200;
    }
    if (col===2) {
        size = 150;
    }

    let rt = PIXI.RenderTexture.create({ width: size, height: size});
    // to check the overflow case
    app.renderer.render(rect, rt);

    buf.renderAndBlit(circle, rt);
    let sprite = new PIXI.Sprite(rt);
    sprite.x = col * 300 + 25;
    sprite.y = row * 300 + 25;

    app.stage.addChild(sprite);
}

