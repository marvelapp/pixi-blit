namespace pixi_blit {
    export enum CacheStatus {
        Init = 0,
        Drawn = 1,
        Hanging = 2,
        Disposed = 3,
    }

    let uniqIdCounter = 0;

    export function generateUid() {
        return ++uniqIdCounter;
    }

    export class MemoryComponent {
        touchedFrameNum = -1;
        touchedFrameCount = 0;
        touchedGc = 0;
        touchFrame(frame: number) {
            if (this.touchedFrameNum < frame) {
                this.touchedFrameNum = frame;
                this.touchedFrameCount = 0;
            }
            this.touchedFrameCount++;
        }
        touchGc(gcNum: number, lastGcFrameNum: number) {
            if (this.touchedFrameNum > lastGcFrameNum) {
                this.touchedGc = gcNum;
            }
        }
        cacheStatus = CacheStatus.Init;
    }

    export interface IGCEntry {
        mem: MemoryComponent;
    }
}

