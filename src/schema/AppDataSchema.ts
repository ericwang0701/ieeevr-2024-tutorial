import { MapSchema, Schema, Context, type } from "@colyseus/schema";
import { NetworkBooleanSchema, NetworkNumberSchema, NetworkQuaternionSchema, NetworkStringSchema, NetworkTransformSchema, NetworkVector3Schema } from "./DataTypeSchema";

export class AppDataSchema extends Schema {
    @type({ map: NetworkTransformSchema }) meshTransforms = new MapSchema<NetworkTransformSchema>();
    @type({ map: NetworkNumberSchema }) numberDataFields = new MapSchema<NetworkNumberSchema>();
    @type({ map: NetworkBooleanSchema }) boolDataFields = new MapSchema<NetworkBooleanSchema>();
    @type({ map: NetworkStringSchema }) stringDataFields = new MapSchema<NetworkStringSchema>();
    @type({ map: NetworkVector3Schema }) vector3DataFields = new MapSchema<NetworkVector3Schema>();
    @type({ map: NetworkQuaternionSchema }) quaternionDataFields = new MapSchema<NetworkQuaternionSchema>();

    constructor() {
        super();
    }

    private findObjectByKey(key: string): NetworkTransformSchema | NetworkNumberSchema | NetworkBooleanSchema | NetworkStringSchema |
        NetworkVector3Schema | NetworkQuaternionSchema | undefined {
        // Check in meshTransforms
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

    // updateAppDataState(data, clientID) {
    //     //console.log("AppDataState update received -> ");
    //     //console.debug(JSON.stringify(data));

    //     if (data.type == "addFieldData") {
    //         let curField;
    //         let newFieldSchema;
    //         switch (data.type) {
    //             case 'Vector3':
    //                 console.log(data.id + " , " + JSON.stringify(data.value));
    //                 curField = this.vector3DataFields.get(data.id);
    //                 if (!curField) {
    //                     newFieldSchema = new NetworkVector3Schema();
    //                     newFieldSchema.value = data.value;
    //                     newFieldSchema.owner = "";
    //                     this.vector3DataFields.set(data.id, newFieldSchema);
    //                 }
    //                 break;
    //             case 'Quaternion':
    //                 curField = this.quaternionDataFields.get(data.id);
    //                 if (!curField) {
    //                     newFieldSchema = new NetworkQuaternionSchema();
    //                     newFieldSchema.value = data.value;
    //                     newFieldSchema.owner = "";
    //                     this.quaternionDataFields.set(data.id, newFieldSchema);
    //                 }
    //                 break;
    //             case 'number':
    //                 curField = this.numberDataFields.get(data.id);
    //                 if (!curField) {
    //                     newFieldSchema = new NetworkNumberSchema();
    //                     newFieldSchema.value = data.value;
    //                     newFieldSchema.owner = "";
    //                     this.numberDataFields.set(data.id, newFieldSchema);
    //                 }
    //                 break;
    //             case 'boolean':
    //                 curField = this.boolDataFields.get(data.id);
    //                 if (!curField) {
    //                     newFieldSchema = new NetworkBooleanSchema();
    //                     newFieldSchema.value = data.value;
    //                     newFieldSchema.owner = "";
    //                     this.boolDataFields.set(data.id, newFieldSchema);
    //                 }
    //                 break;
    //             case 'string':
    //                 curField = this.stringDataFields.get(data.id);
    //                 if (!curField) {
    //                     newFieldSchema = new NetworkStringSchema();
    //                     newFieldSchema.value = data.value;
    //                     newFieldSchema.owner = "";
    //                     this.stringDataFields.set(data.id, newFieldSchema);
    //                 }
    //                 break;
    //             // case 'transform':
    //             //     let mesh = this.meshTransforms.get(data.id);
    //             //     if (mesh == null) {
    //             //         mesh = new NetworkTransformSchema();
    //             //         mesh.position = new NetworkVector3Schema(...data.position);
    //             //         mesh.rotation = new NetworkQuaternionSchema(...data.rotation);
    //             //         mesh.scaling = new NetworkVector3Schema(...data.scaling);
    //             //         mesh.owner = "";
    //             //         this.meshTransforms.set(data.id, mesh);
    //             //         console.log("addMeshTransform: " + JSON.stringify(mesh));
    //             //     }
    //             //     break;
    //             // Additional handling for other types if needed
    //         }
    //     }

    //     if (data.type === 'updateField') {
    //         const { field, value, type } = data;
    //         let newFieldSchema;
    //         switch (type) {
    //             case 'number':
    //                 newFieldSchema = new NetworkNumberSchema();
    //                 newFieldSchema.value = value;
    //                 newFieldSchema.owner = clientID;
    //                 this.numberDataFields.set(field, newFieldSchema);
    //                 break;
    //             case 'boolean':
    //                 newFieldSchema = new NetworkBooleanSchema();
    //                 newFieldSchema.value = value;
    //                 newFieldSchema.owner = clientID;
    //                 this.boolDataFields.set(field, newFieldSchema);
    //                 break;
    //             case 'string':
    //                 newFieldSchema = new NetworkStringSchema();
    //                 newFieldSchema.value = value;
    //                 newFieldSchema.owner = clientID;
    //                 this.stringDataFields.set(field, newFieldSchema);
    //                 break;
    //             // Additional handling for other types if needed
    //         }
    //     }


    //     if (data.type === 'updateProperty') {
    //         const { id, value, type } = data;
    //         let newFieldSchema;
    //         switch (type) {
    //             case 'Vector3':
    //                 newFieldSchema = new NetworkVector3Schema();
    //                 Object.assign(newFieldSchema, value, { owner: clientID });
    //                 this.vector3DataFields.set(id, newFieldSchema);
    //                 break;
    //             case 'Quaternion':
    //                 newFieldSchema = new NetworkQuaternionSchema();
    //                 Object.assign(newFieldSchema, value, { owner: clientID });
    //                 this.quaternionDataFields.set(id, newFieldSchema);
    //                 break;

    //             case 'number':
    //                 newFieldSchema = new NetworkNumberSchema();
    //                 newFieldSchema.value = value;
    //                 newFieldSchema.owner = clientID;
    //                 this.numberDataFields.set(id, newFieldSchema);
    //                 break;
    //             case 'boolean':
    //                 newFieldSchema = new NetworkBooleanSchema();
    //                 newFieldSchema.value = value;
    //                 newFieldSchema.owner = clientID;
    //                 this.boolDataFields.set(id, newFieldSchema);
    //                 break;
    //             case 'string':
    //                 newFieldSchema = new NetworkStringSchema();
    //                 newFieldSchema.value = value;
    //                 newFieldSchema.owner = clientID;
    //                 this.stringDataFields.set(id, newFieldSchema);
    //                 break;
    //             // Additional handling for other types if needed
    //         }
    //     }

    //     if (data.type == "claimOwnership") {
    //         const obj = this.findObjectByKey(data.id);
    //         if (obj == null) {
    //             console.log("obj not found: " + data.id);
    //             return;
    //         }

    //         let newObj: NetworkTransformSchema | NetworkNumberSchema | NetworkBooleanSchema | NetworkStringSchema | NetworkVector3Schema | NetworkQuaternionSchema;
    //         if (obj instanceof NetworkTransformSchema) {
    //             // Handle the MeshTransform object
    //             obj.owner = clientID;

    //             //need to create a new object to trigger onChange
    //             //otherwise have to use Listen on certain property in client side
    //             newObj = new NetworkTransformSchema();
    //             newObj.position = obj.position;
    //             newObj.rotation = obj.rotation;
    //             newObj.scaling = obj.scaling;
    //             newObj.owner = clientID
    //             this.meshTransforms.set(data.id, newObj);

    //         } else if (obj instanceof NetworkNumberSchema) {
    //             // Handle the NetworkNumber object
    //             newObj = new NetworkNumberSchema();
    //             newObj.value = obj.value;
    //             newObj.owner = clientID;
    //             this.numberDataFields.set(data.id, newObj);
    //         } else if (obj instanceof NetworkBooleanSchema) {
    //             // Handle the NetworkBoolean object
    //             newObj = new NetworkBooleanSchema();
    //             newObj.value = obj.value;
    //             newObj.owner = clientID;
    //             this.boolDataFields.set(data.id, newObj);
    //         } else if (obj instanceof NetworkStringSchema) {
    //             // Handle the NetworkString object
    //             newObj = new NetworkStringSchema();
    //             newObj.value = obj.value;
    //             newObj.owner = clientID;
    //             this.stringDataFields.set(data.id, newObj);
    //         } else if (obj instanceof NetworkVector3Schema) {
    //             // Handle the NetworkString object
    //             newObj = new NetworkVector3Schema();
    //             //Object.assign(newObj, obj, { owner: client.sessionId });
    //             newObj.x = obj.x;
    //             newObj.y = obj.y;
    //             newObj.z = obj.z;
    //             newObj.owner = clientID;
    //             this.vector3DataFields.set(data.id, newObj);
    //         } else if (obj instanceof NetworkQuaternionSchema) {
    //             // Handle the NetworkString object
    //             //Object.assign(newObj, obj, { owner: client.sessionId });
    //             //TODO - figure weird bug?
    //             newObj = new NetworkQuaternionSchema();
    //             newObj.x = obj.x;
    //             newObj.y = obj.y;
    //             newObj.z = obj.z;
    //             (newObj as NetworkQuaternionSchema).w = obj.w;
    //             newObj.owner = clientID;
    //             this.quaternionDataFields.set(data.id, (newObj as NetworkQuaternionSchema));
    //         }
    //         console.log("claimOwnership: " + data.id + " : " + newObj.owner);

    //     }

    //     if (data.type == "releaseOwnership") {
    //         const obj = this.findObjectByKey(data.id);
    //         if (obj == null) {
    //             console.log("obj not found: " + data.id);
    //             return;
    //         }

    //         let newObj;
    //         if (obj instanceof NetworkTransformSchema) {
    //             // Handle the MeshTransform object
    //             obj.owner = clientID;

    //             //need to create a new object to trigger onChange
    //             //otherwise have to use Listen on certain property in client side
    //             newObj = new NetworkTransformSchema();
    //             newObj.position = obj.position;
    //             newObj.rotation = obj.rotation;
    //             newObj.scaling = obj.scaling;
    //             newObj.owner = ""
    //             this.meshTransforms.set(data.id, newObj);

    //         } else if (obj instanceof NetworkNumberSchema) {
    //             // Handle the NetworkNumber object
    //             newObj = new NetworkNumberSchema();
    //             newObj.value = obj.value;
    //             newObj.owner = "";
    //             this.numberDataFields.set(data.id, newObj);
    //         } else if (obj instanceof NetworkBooleanSchema) {
    //             // Handle the NetworkBoolean object
    //             newObj = new NetworkBooleanSchema();
    //             newObj.value = obj.value;
    //             newObj.owner = "";
    //             this.boolDataFields.set(data.id, newObj);
    //         } else if (obj instanceof NetworkStringSchema) {
    //             // Handle the NetworkString object
    //             newObj = new NetworkStringSchema();
    //             newObj.value = obj.value;
    //             newObj.owner = "";
    //             this.stringDataFields.set(data.id, newObj);
    //         } else if (obj instanceof NetworkVector3Schema) {
    //             // Handle the NetworkString object
    //             newObj = new NetworkVector3Schema();
    //             Object.assign(newObj, obj, { owner: "" });
    //             this.vector3DataFields.set(data.id, newObj);
    //         } else if (obj instanceof NetworkQuaternionSchema) {
    //             // Handle the NetworkString object
    //             newObj = new NetworkQuaternionSchema();
    //             Object.assign(newObj, obj, { owner: "" });
    //             this.quaternionDataFields.set(data.id, newObj);
    //         }


    //         console.log("releaseOwnership: " + data.id);
    //     }
    // }



}