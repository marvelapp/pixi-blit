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
        expire = -1;

        // TODO: Store when did it expire
        // TODO: Store how much bytes it costs

        touchFrame(frame: number) {
            if (this.touchedFrameNum < frame) {
                this.touchedFrameNum = frame;
                this.touchedFrameCount = 0;

                if (this.cacheStatus === CacheStatus.Hanging)
                {
                    this.cacheStatus = CacheStatus.Drawn;
                }
            }
            this.touchedFrameCount++;
        }
        touchGc(gcNum: number, lastGcFrameNum: number) {
            const { expire } = this;

            if (this.touchedFrameNum > lastGcFrameNum) {
                this.touchedGc = gcNum;
                if (this.cacheStatus === CacheStatus.Hanging)
                {
                    // never called, touchFrame should do it
                    this.cacheStatus = CacheStatus.Drawn;
                }
            } else if (expire > 0 && this.touchedGc + expire < gcNum)
            {
                if (this.cacheStatus === CacheStatus.Drawn)
                {
                    this.cacheStatus = CacheStatus.Hanging;
                }
            }
        }
        cacheStatus = CacheStatus.Init;
    }

    export interface IGCEntry {
        mem: MemoryComponent;
    }
}

