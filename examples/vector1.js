PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL;

const app = new PIXI.Application({antialias: false/*, autoStart: false*/});
document.body.appendChild(app.view);

const shapeCache = new PIXI.blit.ShapeCache(app.renderer, app.stage, {});
shapeCache.defaultCacheType = PIXI.blit.CacheType.Canvas2d;
let lastGC = performance.now();

shapeCache.gcExpire = 1;

app.ticker.add(() => {
    if (performance.now() > lastGC + 200) {
        lastGC = performance.now();
        shapeCache.gcTick();
    }

    shapeCache.frameTick();
}, PIXI.UPDATE_PRIORITY.LOW + 1);

class MyCircleCanvas extends PIXI.blit.GeneratedCanvasGraphics {
    renderCanvas(renderer) {
        const context = renderer.context;

        const params = this.model.params;

        const radius = params.radius;
        const color = params.color;

        renderer.setContextTransform(this.transform.worldTransform);

        context.fillStyle = `#${color.toString(16)}`;
        context.beginPath();
        context.ellipse(0, 0, radius, radius, 0, 0, Math.PI*2);
        context.fill();
    }
}

class MyCircleGenerator {
    generate(model) {
        const {graphics, params} = model;

        graphics.beginFill(params.color || 0xFFFFFF);
        graphics.drawCircle(0, 0, params.radius || 10);
        graphics.endFill();
    }

    generateBounds(model) {
        const {params, _genBounds} = model;

        const radius = params.radius = params.radius || 10;
        params.color = params.color || 0xFFFFFF;

        _genBounds.addFramePad(0, 0, 0, 0,
            radius, radius);
    }

    generateCanvas(model) {
        return new MyCircleCanvas(model);
    }
}

const circleModel = new PIXI.blit.VectorModel({
    params: {
        radius: 100,
        color: 0xDE3249,
    },
    generator: new MyCircleGenerator()
});

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

// shapeCache.frameTick();
// app.render();
