import { Schema } from "@colyseus/schema";
import * as Colyseus from "colyseus.js";
import * as BABYLON from "@babylonjs/core";

export abstract class NetworkedEntity<T extends Schema> {

    protected abstract entityType: string;
    protected schema: T;
    protected room: Colyseus.Room;
    public isLocal: boolean = true; // Default to true, can be adjusted as needed
    private lastUpdateTime = 0;
    public fps: number = 30; // Can be updated dynamically
    protected scene: BABYLON.Scene;
    protected isInitialized: boolean = false;

    constructor(room: Colyseus.Room, scene: BABYLON.Scene, schemaType: { new(): T; }) {
        this.room = room;
        this.scene = scene;
        this.schema = new schemaType(); // Initialize the schema object here
    }

    protected abstract initialize(...args: any[]): void | Promise<void>;

    protected startUpdateLoop(): void {
        this.scene.onBeforeRenderObservable.add(this.update.bind(this));
    }

    // Implement control/interaction logic for entities the client owns
    protected abstract handleLocalUpdates(deltaTime: number): void;

    // Implement visualization logic based on the synchronized schema
    protected abstract handleNetworkUpdates(deltaTime: number): void;

    // General update method to decide between control or synchronization based on ownership
    private update(): void {
        if (!this.isInitialized) return;

        const now = Date.now();
        const deltaTime = now - this.lastUpdateTime;
        const updateInterval = 1000 / this.fps; // Calculate update interval based on current FPS

        if (deltaTime >= updateInterval) {
            if (this.isLocal) {
                this.handleLocalUpdates(deltaTime);
            } else {
                this.handleNetworkUpdates(deltaTime);
            }

            this.lastUpdateTime = now;
        }
    }

    public updateLocalSchema(newSchemaObj: Partial<T>): void {
        Object.assign(this.schema, newSchemaObj);
        this.onSchemaUpdated();
    }

    public getSchema():T{
        return this.schema;
    }

    protected abstract onSchemaUpdated(): void

    protected createNewEntity(initialData: any) {
        this.room.send('addEntity', { type: this.entityType, data: initialData });
    }

    protected updateNetworkSchema(newSchemaObj: Partial<T>): void {
        this.room.send('updateEntity',  { type: this.entityType, data: newSchemaObj });
    }

    public abstract dispose(): void;

    // Static factory method
    static async create<U extends Schema>(
        this: new (room: Colyseus.Room, scene: BABYLON.Scene, schemaType: { new(): U; }) => NetworkedEntity<U>,
        room: Colyseus.Room, scene: BABYLON.Scene, schemaType: { new(): U; },
        ...initArgs: any[]  // Accept additional arguments for initialize
    ): Promise<NetworkedEntity<U>> {
        const entity = new this(room, scene, schemaType);
        try {
            // Spread the additional arguments into the call to initialize
            await entity.initialize(...initArgs);
            entity.isInitialized = true;
            entity.startUpdateLoop();
        } catch (error) {
            console.error("Initialization failed:", error);
            // Handle initialization failure (e.g., reject the promise or return null)
        }
        return entity;
    }
}
