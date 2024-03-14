import { MapSchema, Schema, Context, type } from "@colyseus/schema";
import { PlayerSchema } from "../schema/PlayerSchema";
import { Client } from "colyseus";
import { NetworkBooleanSchema, NetworkNumberSchema, NetworkQuaternionSchema, NetworkStringSchema, NetworkTransformSchema, NetworkVector3Schema, QuaternionSchema, Vector3Schema } from "../schema/DataTypeSchema";
import { CollabObjectSchema } from "../schema/CollabObjectSchema";

export class AppRoomState extends Schema {
    @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
    @type({ map: CollabObjectSchema }) collabObjects = new MapSchema<CollabObjectSchema>();
    @type("string") mySynchronizedProperty: string = "Hello world";

    @type({ map: NetworkTransformSchema }) meshTransforms = new MapSchema<NetworkTransformSchema>();
    @type({ map: NetworkNumberSchema }) numberDataFields = new MapSchema<NetworkNumberSchema>();
    @type({ map: NetworkBooleanSchema }) boolDataFields = new MapSchema<NetworkBooleanSchema>();
    @type({ map: NetworkStringSchema }) stringDataFields = new MapSchema<NetworkStringSchema>();
    @type({ map: NetworkVector3Schema }) vector3DataFields = new MapSchema<NetworkVector3Schema>();
    @type({ map: NetworkQuaternionSchema }) quaternionDataFields = new MapSchema<NetworkQuaternionSchema>();

    private roomStartTime:string;
    // Mapping of entity types to their respective collections
    private entityCollections= {};

    constructor(...args: any[]) {
        super(...args);
        this.start();
    }

    public async start() {
        const currentDate = new Date(); // Get the current date and time

        // Create a human-readable date string with milliseconds
        this.roomStartTime = currentDate.toUTCString();
        
        this.entityCollections = {
            "player": this.players,
            // Add more entity types and their corresponding collections as needed
        };
    }

    public update(deltaTime: number) {

    }


    removePlayer(client: Client): void {
        this.players.delete(client.sessionId);
        console.log(client.sessionId, "left! - removePlayer");
    }


    processMessage = async (room, clients, client, type, data) => {
        if (type === "ping") {
            client.send("pong", data);
        }

        if (type === "addEntity") {
            const entityCollection = this.entityCollections[data.type];
            console.log("addEntity: " + data.type);
            if (!entityCollection) {
                console.error(`Unknown entity type: ${data.type}`);
                return false;
            }
            
            let entityState = entityCollection.get(data.data.entityID);
            if (entityState != null) {
                console.error(`entityState of type ${data.type} with ID ${data.data.entityID} already exist`);
                return false;
            }
        
            switch (data.type) {
                case 'player':
                    entityState = new PlayerSchema(data.data); // Assuming constructors can take initial data
                    break;
            }
        
            // It's important to check entityState was actually created
            if (entityState) {
                entityCollection.set(data.data.entityID, entityState);
                
            } else {
                console.error(`Failed to create entity state for type: ${data.type}`);
            }
        }
        
        if (type === "updateEntity") {
            const entityCollection = this.entityCollections[data.type];
            if (!entityCollection) {
                console.error(`Unknown entity type: ${data.type}`);
                return false;
            }
        
            const entityState = entityCollection.get(data.data.entityID);
            if (!entityState) {
                console.error(`Entity of type ${data.type} with ID ${data.data.entityID} not found`);
                return false;
            }
        
            if(data.type == "player"){
                (this.players[data.data.entityID] as PlayerSchema).updateEntityState(data.data);
            }

        }
        
        //for app data with client-side decorator
        if (type == "addFieldData") {
            let curField;
            let newFieldSchema;
            console.log(data.type + "," + data.id + " , " + JSON.stringify(data.value));
            switch (data.type) {
                case 'Vector3':
                    curField = this.vector3DataFields.get(data.id);
                    if (!curField) {
                        newFieldSchema = new NetworkVector3Schema(data.value.x, data.value.y, data.value.z);
                        newFieldSchema.id = data.id;
                        newFieldSchema.owner = "";
                        this.vector3DataFields.set(data.id, newFieldSchema);
                    }
                    break;
                case 'Quaternion':
                    curField = this.quaternionDataFields.get(data.id);
                    if (!curField) {
                        newFieldSchema = new NetworkQuaternionSchema(data.value.x, data.value.y, data.value.z, data.value.w);
                        newFieldSchema.id = data.id;
                        newFieldSchema.owner = "";
                        this.quaternionDataFields.set(data.id, newFieldSchema);
                    }
                    break;
                case 'number':
                    curField = this.numberDataFields.get(data.id);
                    if (!curField) {
                        newFieldSchema = new NetworkNumberSchema(data.value);
                        newFieldSchema.id = data.id;
                        this.numberDataFields.set(data.id, newFieldSchema);
                    }
                    break;
                case 'boolean':
                    curField = this.boolDataFields.get(data.id);
                    if (!curField) {
                        newFieldSchema = new NetworkNumberSchema(data.value);
                        newFieldSchema.id = data.id;
                        this.boolDataFields.set(data.id, newFieldSchema);
                    }
                    break;
                case 'string':
                    curField = this.stringDataFields.get(data.id);
                    if (!curField) {
                        newFieldSchema = new NetworkNumberSchema(data.value);
                        newFieldSchema.id = data.id;
                        this.stringDataFields.set(data.id, newFieldSchema);
                    }
                    break;
            }
        }

        if (type=== 'updateField') {
            const { field, value, type } = data;
            let newFieldSchema;
            switch (type) {
                case 'number':
                    newFieldSchema = new NetworkNumberSchema();
                    newFieldSchema.value = value;
                    newFieldSchema.owner = client.sessionId;
                    this.numberDataFields.set(field, newFieldSchema);
                    break;
                case 'boolean':
                    newFieldSchema = new NetworkBooleanSchema();
                    newFieldSchema.value = value;
                    newFieldSchema.owner = client.sessionId;
                    this.boolDataFields.set(field, newFieldSchema);
                    break;
                case 'string':
                    newFieldSchema = new NetworkStringSchema();
                    newFieldSchema.value = value;
                    newFieldSchema.owner = client.sessionId;
                    this.stringDataFields.set(field, newFieldSchema);
                    break;
                // Additional handling for other types if needed
            }
        }


        if (type === 'updateProperty') {
            const { id, value, type } = data;
            let newFieldSchema;
            switch (type) {
                case 'Vector3':
                    console.log("updateProperty, " + JSON.stringify(data.value));
                    newFieldSchema = this.vector3DataFields.get(id);
                    newFieldSchema.vector3.x = value.x
                    newFieldSchema.vector3.y = value.y
                    newFieldSchema.vector3.z = value.z
                    break;
                case 'Quaternion':
                    newFieldSchema = this.quaternionDataFields.get(id);
                    newFieldSchema.quaternion.x = value.x
                    newFieldSchema.quaternion.y = value.y
                    newFieldSchema.quaternion.z = value.z
                    newFieldSchema.quaternion.w = value.w
                    break;

                case 'number':
                    newFieldSchema = this.numberDataFields.get(id);
                    newFieldSchema.value = value;
                    break;
                case 'boolean':
                    newFieldSchema = this.boolDataFields.get(id);
                    newFieldSchema.value = value;
                    break;
                case 'string':
                    newFieldSchema = this.stringDataFields.get(id);
                    newFieldSchema.value = value;
                    break;
                // Additional handling for other types if needed
            }
        }

        if (type === "claimOwnership") {
            const obj = this.findObjectByKey(data.id);
            if (obj == null) {
                console.log("obj not found: " + data.id);
                return;
            }

            let newObj: NetworkTransformSchema | NetworkNumberSchema | NetworkBooleanSchema | NetworkStringSchema | NetworkVector3Schema | NetworkQuaternionSchema;
            if (obj instanceof NetworkTransformSchema) {
                // Handle the MeshTransform object
                obj.owner = client.sessionId;

                newObj = new NetworkTransformSchema();
                newObj.position = obj.position;
                newObj.rotation = obj.rotation;
                newObj.scaling = obj.scaling;
                newObj.owner = client.sessionId
                this.meshTransforms.set(data.id, newObj);

            } else if (obj instanceof NetworkNumberSchema) {
                // Handle the NetworkNumber object
                newObj = new NetworkNumberSchema();
                newObj.value = obj.value;
                newObj.owner = client.sessionId;
                this.numberDataFields.set(data.id, newObj);
            } else if (obj instanceof NetworkBooleanSchema) {
                // Handle the NetworkBoolean object
                newObj = new NetworkBooleanSchema();
                newObj.value = obj.value;
                newObj.owner = client.sessionId;
                this.boolDataFields.set(data.id, newObj);
            } else if (obj instanceof NetworkStringSchema) {
                // Handle the NetworkString object
                newObj = new NetworkStringSchema();
                newObj.value = obj.value;
                newObj.owner = client.sessionId;
                this.stringDataFields.set(data.id, newObj);
            } else if (obj instanceof NetworkVector3Schema) {
                obj.owner = client.sessionId;
                console.log("claimOwnership: " + data.id + " : " + obj.owner);
            } else if (obj instanceof NetworkQuaternionSchema) {
                obj.owner = client.sessionId;
            }
            
        }

        if (type === "releaseOwnership") {
            const obj = this.findObjectByKey(data.id);
            if (obj == null) {
                console.log("obj not found: " + data.id);
                return;
            }

            let newObj;
            if (obj instanceof NetworkTransformSchema) {
                // Handle the MeshTransform object
                obj.owner = client.sessionId;

                newObj = new NetworkTransformSchema();
                newObj.position = obj.position;
                newObj.rotation = obj.rotation;
                newObj.scaling = obj.scaling;
                newObj.owner = ""
                this.meshTransforms.set(data.id, newObj);

            } else if (obj instanceof NetworkNumberSchema) {
                // Handle the NetworkNumber object
                newObj = new NetworkNumberSchema();
                newObj.value = obj.value;
                newObj.owner = "";
                this.numberDataFields.set(data.id, newObj);
            } else if (obj instanceof NetworkBooleanSchema) {
                // Handle the NetworkBoolean object
                newObj = new NetworkBooleanSchema();
                newObj.value = obj.value;
                newObj.owner = "";
                this.boolDataFields.set(data.id, newObj);
            } else if (obj instanceof NetworkStringSchema) {
                // Handle the NetworkString object
                newObj = new NetworkStringSchema();
                newObj.value = obj.value;
                newObj.owner = "";
                this.stringDataFields.set(data.id, newObj);
            } else if (obj instanceof NetworkVector3Schema) {
                obj.owner = "";
                console.log("releaseOwnership: " + data.id + " : " + obj.owner);
            } else if (obj instanceof NetworkQuaternionSchema) {
                obj.owner = "";
            }
        }

        if(type === "broadcastEvent"){
            console.log("broadcastEvent: " + data.value.key);
            room.broadcast("broadcastEvent", JSON.stringify( data.value));
        }

    }

    private findObjectByKey(key: string): NetworkTransformSchema | NetworkNumberSchema | NetworkBooleanSchema | NetworkStringSchema |
        NetworkVector3Schema | NetworkQuaternionSchema | undefined {
        // Check in meshTransforms
        console.log("findObjectByKey: " + key);
        if (this.meshTransforms.has(key)) {
            return this.meshTransforms.get(key);
        }

        // Check in numberDataFields
        if (this.numberDataFields.has(key)) {
            return this.numberDataFields.get(key);
        }

        // Check in boolDataFields
        if (this.boolDataFields.has(key)) {
            return this.boolDataFields.get(key);
        }

        // Check in stringDataFields
        if (this.stringDataFields.has(key)) {
            return this.stringDataFields.get(key);
        }

        // Check in vector3DataFields
        if (this.vector3DataFields.has(key)) {
            return this.vector3DataFields.get(key);
        }

        // Check in quaternionDataFields
        if (this.quaternionDataFields.has(key)) {
            return this.quaternionDataFields.get(key);
        }

        // Return undefined if the key is not found in any schema
        return undefined;
    }

}