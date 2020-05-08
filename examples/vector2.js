PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL;

const app = new PIXI.Application({ antialias: false /*, autoStart: false*/ });
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

class CanvasRectangle extends PIXI.blit.GeneratedCanvasGraphics {
    renderCanvas(renderer) {
        const { context } = renderer;
        const { x, y, width, height, radius } = this.model.params;

        renderer.setContextTransform(this.transform.worldTransform);
        context.fillStyle = "#DE3249";
        context.beginPath();
        console.log(this.transform.worldTransform);
        if (radius && (radius[0] || radius[1] || radius[2] || radius[3])) {
            const right = x + width;
            const bottom = y + height;
            // top side
            context.moveTo(x + radius[0], y);
            context.lineTo(right - radius[1], y);
            // top right corner
            context.quadraticCurveTo(right, y, right, y + radius[1]);
            // right side
            context.lineTo(right, y + height - radius[2]);
            // bottom right corner
            context.quadraticCurveTo(right, bottom, right - radius[2], bottom);
            // bottom side
            context.lineTo(x + radius[3], bottom);
            // bottom left corner
            context.quadraticCurveTo(x, bottom, x, bottom - radius[3]);
            // left side
            context.lineTo(x, y + radius[0]);
            // top left corner
            context.quadraticCurveTo(x, y, x + radius[0], y);
        } else {
            context.rect(x, y, width, height);
        }
        context.fill();
    }
}

const radius = [20, 20, 20, 20];
const width = 100;
const height = 100;
const x = 50;
const y = 50;
const rectangleModel = new PIXI.blit.VectorModel({
    params: {
        radius,
        width,
        height,
        x,
        y,
    },
    generator: {
        generateCanvas: (model) => {
            return new CanvasRectangle(model);
        },
        generateBounds(model) {
            const { params, _genBounds } = model;
            _genBounds.clear();
            _genBounds.addFramePad(
                params.x,
                params.y,
                params.x + params.width,
                params.y + params.height,
                0, 0

                /*
                params.width + params.x * 2,
                params.height + params.y * 2,
                0,
                0,
                params.width + params.x,
                params.height + params.y
                 */
            );
            console.log(_genBounds);
        },
    },
});

const rectangle = new PIXI.blit.VectorSprite(rectangleModel);

let phase = 0;
app.ticker.add((delta) => {
    phase += 0.01 * delta;
    const scale = Math.exp(Math.sin(-phase));
    rectangleModel.params = {
        x,
        y,
        width: width * scale,
        height: height * scale,
        radius,
    };
    rectangleModel.reset();
});

app.stage.addChild(rectangle);
