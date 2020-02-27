const app = new PIXI.Application({antialias: false});
document.body.appendChild(app.view);

const shapeCache = new PIXI.blit.ShapeCache(app.renderer, app.stage, {});
shapeCache.defaultCacheType = PIXI.blit.CacheType.WebGL;
let lastGC = performance.now();

app.ticker.add(() => {
    if (performance.now() > lastGC + 200) {
        lastGC = performance.now();
        shapeCache.gcTick();
    }

    shapeCache.frameTick();
}, PIXI.UPDATE_PRIORITY.LOW + 1);

const circleModel = new PIXI.blit.VectorModel();
const circle = circleModel.graphics;

circle.beginFill(0xDE3249);
circle.drawCircle(0, 0, 100);
circle.endFill();

const inst1 = new PIXI.blit.VectorSprite(circleModel);
const inst2 = new PIXI.blit.VectorSprite(circleModel);
const inst3 = new PIXI.blit.VectorSprite(circleModel);

app.stage.addChild(inst1, inst2, inst3);

inst1.position.set(120, 120);
inst2.position.set(120, 340);
inst3.position.set(500, 290);

let phase = 0;
app.ticker.add((delta) => {
    phase += 0.01 * delta;
    inst2.position.y = 410 - 70 * Math.cos(2 * phase);
    inst3.scale.set(Math.exp(Math.sin(-phase)));
});
