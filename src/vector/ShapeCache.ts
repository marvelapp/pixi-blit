namespace pixi_blit {
    export class ShapeCache {
        constructor() {
        }

        models: { [key: number]: VectorModel };
        entries: { [key: number]: IGCEntry };

        root: PIXI.Container;
        frameNum: number;
        lastGcFrameNum: number;
        gcNum: number;

        public frameTick() {
            this.frameNum++;
            this.recFind(this.root, this.visitFrame);
        }

        protected visitFrame = (elem: VectorSprite): void => {
            const {model} = elem;

            model.mem.touchFrame(this.frameNum);
        };

        protected recFind(elem: PIXI.Container, visit: (elem: VectorSprite) => void) {
            if (elem instanceof VectorSprite) {
                visit(elem);
            }
            if (!elem.vectorChildren) {
                return;
            }
            const {children} = elem;
            for (let i = 0; i < children.length; i++) {
                this.recFind(children[i] as PIXI.Container, visit);
            }
        }

        public gcTick() {
            this.gcNum++;
            for (let key in this.models) {
                let model = this.models[key];
                model.mem.touchGc(this.gcNum, this.lastGcFrameNum);
            }
            this.lastGcFrameNum = this.gcNum;

            // 1. Find all the graphics that have to be rendered on stage
            // 2. Mark old mips as aren't needed
            // 3. Drop a few old atlases if they are cost less then X% mem, starting from even old ones
            // drop runtime atlases
            // 4. put all instances in new atlases
            // 5. put everything else in runtime atlas
            // 6. mark rest as full runtime
            // 7. draw all atlases
        }
    }
}
