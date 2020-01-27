declare namespace PIXI {
    export interface DisplayObject {
        vectorChildren?: boolean;
    }
}

namespace pixi_blit {
    (Object as any).assign(PIXI.DisplayObject.prototype, {
        vectorChildren: true,
    });
}

namespace pixi_blit {
    namespace model {
        // target
        // 1. changing shift & scale -> use pow2
        // 2. same shift & scale for a long time - use instanced

        //Main algo
        // 1. Find all the graphics that have to be rendered on stage
        // 2. Mark old mips as aren't needed
        // 3. Drop a few old atlases if they are cost less then X% mem, starting from even old ones
        // drop runtime atlases
        // 4. put all instances in new atlases
        // 5. put everything else in runtime atlas
        // 6. mark rest as full runtime
        // 7. draw all atlases

        // 8. render: do it all

        // How to decide which cache works on element? canvas/webgl?
        // some elements should prefer canvas, some webgl, and there has to be default setting.
        // WebGL2 if available. Canvas for IE, WebGL for the rest.
        // one model has only one preferred

        export interface IVectorModel {

            touchedFrame: number;
        }

        export interface IGCEntry {
            memoryBytes: number;
            // frequency how its touched?
            touched: number;
            createdAt: number;
            tickUsed: number;

            draw(node: IModelInstance): void;

            dispose(): void;

            cacheStatus: CacheStatus;
        }

        export interface IVectorGeometry extends IGCEntry {
        }

        export interface IModelInstance {
            uniqId: number;
            model: IVectorModel;
        }

        export interface IAtlas {
        }

        export interface IRasterCache extends IGCEntry {
            key: string;
            model: IVectorModel;
            mat: PIXI.Matrix; //matrix that element was rendered with
            atlasNode: AtlasNode<IRasterCache>;
            atlas: IAtlas;
            instance: IModelInstance; // instance on screen that it belong to. Null means shared
        }
    }

}
