namespace pixi_blit {
    export interface IVectorModel {
        mipCache: Array<IRasterCache>
        instances: {[uniqId: number]: IRasterCache}
        instanceCache: {[uniqId: number]: IRasterCache}

        geometry: IVectorGeometry;
    }

    export interface IGCEntry {
        memoryBytes: number;
        // frequency how its touched?
        touched: number;
        createdAt: number;
        disposed: boolean; // marked for disposal if its not needed
        draw(node: IModelInstance): void;
        dispose(): void;
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

    // export class
}
