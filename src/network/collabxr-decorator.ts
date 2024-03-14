import * as BABYLON from "@babylonjs/core";
import { Room } from "colyseus.js";
import { MultiuserManager } from "../MultiuserManager";

export function NetworkUpdateHandler() {
    return function (target: any, propertyKey: string) {
        let room: Room<any> | null = null;
        target.networkObjOwnerships = new Map<string, string>(); // Shared ownership map
        target.networkUpdateHandlers = new Map<string, Function>();

        Object.defineProperty(target, propertyKey, {
            get: () => room,
            set: (newRoom: Room<any>) => {
                room = newRoom;
                //TODO test whether this work so that users don't need to use a specific var name
                target['colyseusRoom'] = room;     
                if (room) {
                    room.state.meshTransforms.onChange((item, key) => {
                        target.networkObjOwnerships.set(key, item.owner);
                        handleFieldUpdate(key, item, item.owner);
                    });

                    // Listen for changes in number data fields
                    room.state.numberDataFields.onChange((item, key) => {
                        target.networkObjOwnerships.set(key, item.owner);
                        handleFieldUpdate(key, item, item.owner);
                    });

                    // Listen for changes in boolean data fields
                    room.state.boolDataFields.onChange((item, key) => {
                        target.networkObjOwnerships.set(key, item.owner);
                        handleFieldUpdate(key, item, item.owner);
                    });

                    // Listen for changes in string data fields
                    room.state.stringDataFields.onChange((item, key) => {
                        target.networkObjOwnerships.set(key, item.owner);
                        handleFieldUpdate(key, item, item.owner);
                    });

                    room.state.vector3DataFields.onAdd((networkVector3, key) => {
                        networkVector3.vector3.onChange(() => {
                            handleFieldUpdate(networkVector3.id, networkVector3.vector3, networkVector3.owner);
                        });

                        networkVector3.listen("owner", (value, previousValue) => {
                            target.networkObjOwnerships[networkVector3.id] = networkVector3.owner;
                        });
                    });

                    room.state.quaternionDataFields.onAdd((networkQuaternion, key) => {

                        networkQuaternion.quaternion.onChange(() => {
                            handleFieldUpdate(networkQuaternion.id, networkQuaternion.quaternion, networkQuaternion.owner);
                        });

                        networkQuaternion.listen("owner", (value, previousValue) => {
                            target.networkObjOwnerships[networkQuaternion.id] = networkQuaternion.owner;
                        });
                    });

                    room.onMessage("broadcastEvent", async (message) => {
                        const messageObj = JSON.parse(message);
                        const handler = target.networkUpdateHandlers.get(messageObj.key);
                        handler(messageObj);
                    })

                }
            },
            enumerable: true,
            configurable: true
        });

        target.registerNetworkUpdateHandler = function (objId: string, handler: Function) {
            target.networkUpdateHandlers.set(objId, handler);
        };

        target.checkNetworkUpdateHandler = function (objId: string) {
            if(target.networkUpdateHandlers.get(objId)){
                return true;
            }else{
                return false;
            }
            
        };

        function handleFieldUpdate(key: string, item: any, owner:string) {

            if (owner!= "" && owner!= room.sessionId) {
                if (target.networkUpdateHandlers.has(key)) {
                    const handler = target.networkUpdateHandlers.get(key);
                    handler(key, item);
                }
            }
        }

        function getFieldType(value) {
            switch (typeof value) {
                case 'number': return 'number';
                case 'boolean': return 'boolean';
                case 'string': return 'string';
                default: return 'unknown';
            }
        }
    };
}

export function syncField(handlerName: string = "") {
    return function (target: any, propertyKey: string) {
        let fieldValue: any = target[propertyKey];
        let room: Room<any> | null = null;
        let lastValue: any = fieldValue;

        // Custom setter for the field
        Object.defineProperty(target, propertyKey, {
            get: () => fieldValue,
            set: (newValue: any) => {
                room = target['colyseusRoom'];                 
                fieldValue = newValue;
                if (room) {
                    handleUpdate();
                }
            },
            enumerable: true,
            configurable: true
        });

        function handleUpdate() {
           
            if (!target.networkUpdateHandlers.has(propertyKey)){
                if (handlerName && typeof target.instanceReference[handlerName] === 'function') {
                    // Only register the handler if a valid name was provided
                    target.registerNetworkUpdateHandler(propertyKey,  target.instanceReference[handlerName]);      
                }else{
                    target.registerNetworkUpdateHandler(propertyKey, defualNetworkHandler.bind(target));
                }
                addServerFieldState();
            }
            
            const fieldOwner = target.networkObjOwnerships.get(propertyKey);
            const isOwner = (fieldOwner === room.sessionId);
            if (isOwner && hasChanged()) {
                const updateType = getFieldType(fieldValue);
                room.send('updateField', {
                    field: propertyKey,
                    value: fieldValue,
                    type: updateType
                });
                lastValue = fieldValue;
            }
        }

        function hasChanged() {
            return fieldValue !== lastValue;
        }

        function getFieldType(value) {
            switch (typeof value) {
                case 'number': return 'number';
                case 'boolean': return 'boolean';
                case 'string': return 'string';
                default: return 'unknown';
            }
        }

        function addServerFieldState() {
            // Logic to add initial state of the mesh to the server
            room = target['colyseusRoom'];
            
            room.send('addFieldData', {
                id: propertyKey,
                type: getFieldType(fieldValue),
                value: fieldValue
            });
        }

        function defualNetworkHandler(key, newItem){
            target[key] = newItem.value;
        }

    };
}

export function syncFields(properties: string[]) {
    return function (target: any, propertyKey: string) {
        let obj: any = null;
        let room: Room<any> | null = null;
        let scene: BABYLON.Scene | null = null;
        let lastValues: { [key: string]: any } = {};

        // Initialize _syncedProperties if not already present
        if (!target._syncedProperties) {
            target._syncedProperties = {};
        }

        // Custom setter for the object
        Object.defineProperty(target, propertyKey, {
            get: () => obj,
            set: (newValue) => {
                obj = newValue;
                if (obj) {
                    // Initialize last known states and register each property for synchronization
                    properties.forEach(prop => {
                        const key = constructKey(propertyKey, prop);
                        lastValues[key] = obj[prop];
                        target._syncedProperties[key] = { objectKey: propertyKey, propertyKey: prop };
                        target.registerNetworkUpdateHandler(key, defualNetworkFieldHandler.bind(target));
                        
                    });

                    // Setup synchronization
                    setupSync();
                    addServerFieldsState();
                }
            },
            enumerable: true,
            configurable: true
        });

        function addServerFieldsState() {
            // Logic to add initial state of the mesh to the server
            room = target['colyseusRoom'];
            properties.forEach(prop => {
                const key = constructKey(propertyKey, prop);
                const { serializedValue, type } = serializeValue(prop, obj[prop])
                
                room.send('addFieldData', {
                    id: key,
                    type: type,
                    value: serializedValue
                });
                //TODO - why target.networkObjOwnerships.set doesn't work?
                target.networkObjOwnerships[key] = "";
            })     
        }

        function setupSync() {
            room = target['colyseusRoom'];
            // Accessing other properties using a stored reference to the instance
            if (target.instanceReference) {
                scene = target.instanceReference.scene;
            }

            if (!obj || !room || !scene) return;

            // Function to send updates to the server
            const sendUpdate = () => {
                
                properties.forEach(prop => {
                    const key = constructKey(propertyKey, prop);       
                    const objOwner = target.networkObjOwnerships[key];
                    //console.log("sendUpdate: " + propertyKey + ", " + prop + ", " + key + ", " + "obj[prop]: " + obj[prop] + " lastValues[key]: " + lastValues[key]);
                    const isOwner = (objOwner === room.sessionId);
                    if (isOwner && hasChanged(obj[prop], lastValues[key])) {
                        const { serializedValue, type } = serializeValue(prop, obj[prop])
                        room.send('updateProperty', {
                            id: key,  // Using the constructed key
                            value: serializedValue,
                            type: type  // Send the type along with the value
                        });

                        // Update the last known state
                        lastValues[key] = deepCopy(obj[prop]);
                    }
                });
            };

            // Attach sendUpdate to the Babylon.js render loop
            scene.onBeforeRenderObservable.add(sendUpdate);
        }

        function defualNetworkFieldHandler(key, newItem){
            const [objId, propertyName] = parseKey(key);        
            if (propertyName) {

                //handle special case for rotationQ null
                if(propertyName == "rotationQuaternion"){
                    if(target[objId][propertyName] == null){
                        target[objId][propertyName] = BABYLON.Quaternion.Identity();
                    }
                }
                
                // propertyName is provided, so item is an object with a property to update
                if (target[objId][propertyName]  && typeof target[objId][propertyName] === 'object') {
                    // Update each property of the object
                    for (const propKey in target[objId][propertyName]) {
                        if (newItem.hasOwnProperty(propKey)) {
                            target[objId][propertyName][propKey] = newItem[propKey];
                        }
                    }
                    target[objId].computeWorldMatrix(true);
                }
            } else {
                target[objId] = newItem.value;
            }
        }
    };
}

//TODO - implement and test
export function syncMesh(handlerName: string = "") {
    return function (target: any, propertyKey: string) {
        let mesh: BABYLON.Mesh | null = null;
        let room: Room<any> | null = null;
        let isOwner: boolean = false;
        let lastPosition: BABYLON.Vector3 | null = null;
        let lastRotation: BABYLON.Quaternion | null = null;
        let lastScaling: BABYLON.Vector3 | null = null;

        // Custom setter for the mesh
        Object.defineProperty(target, propertyKey, {
            get: () => mesh,
            set: (newMesh: BABYLON.Mesh) => {
                mesh = newMesh;
                if (mesh) {
                    
                    if (handlerName && typeof target.instanceReference[handlerName] === 'function') {
                        // Only register the handler if a valid name was provided
                        target.registerNetworkUpdateHandler(mesh.name, target.instanceReference[handlerName]);
                    }else{
                        target.registerNetworkUpdateHandler(mesh.name, meshDefaultTransformHandler.bind(target));
                    }

                    setupSync();
                    addServerMeshState();
                }
            },
            enumerable: true,
            configurable: true
        });

        function addServerMeshState() {
            // Logic to add initial state of the mesh to the server
            room = target['colyseusRoom'];
            let rotQ = mesh.rotationQuaternion ?
                        mesh.rotationQuaternion.clone() :
                        BABYLON.Quaternion.FromEulerVector(mesh.rotation);
            room.send('addMeshTransform', {
                id: mesh.name,
                position: mesh.position.asArray(),
                rotation: rotQ.asArray(),
                scaling: mesh.scaling.asArray(),
            });
        }

        function meshDefaultTransformHandler(key, newTransform){
            mesh.position = new BABYLON.Vector3(newTransform.position.x, newTransform.position.y, newTransform.position.z);
            mesh.rotationQuaternion = new BABYLON.Quaternion(newTransform.rotation.x, newTransform.rotation.y, newTransform.rotation.z,
                newTransform.rotation.w);
            mesh.scaling = new BABYLON.Vector3(newTransform.scaling.x, newTransform.scaling.y, newTransform.scaling.z);
        }

        function setupSync() {
            room = target['colyseusRoom'];
            if (!mesh || !room) return;

            // Initialize the last known state
            lastPosition = mesh.position.clone();
            lastRotation = mesh.rotationQuaternion ?
                mesh.rotationQuaternion.clone() :
                BABYLON.Quaternion.FromEulerVector(mesh.rotation);
            lastScaling = mesh.scaling.clone();

            // Function to send updates to the server
            const sendUpdate = () => {
                const meshOwner = target.networkObjOwnerships.get(mesh.name);
                isOwner = (meshOwner === room.sessionId)
                //handle "scene" object:
                if(meshOwner == "" && hasChanged()){
                    let rotQ = mesh.rotationQuaternion ?
                    mesh.rotationQuaternion.clone() :
                    BABYLON.Quaternion.FromEulerVector(mesh.rotation);
                    
                    //this will also be used to parse data from server
                    //{x:, y:, z:} instead of array
                    meshDefaultTransformHandler(mesh.name, {
                        id: mesh.name,
                        //position: mesh.position.asArray(),
                        position: mesh.position,
                        //rotation: rotQ.asArray(),
                        rotation: rotQ,
                        //scaling: mesh.scaling.asArray()
                        scaling: mesh.scaling
                    });

                    // Update the last known state
                    lastPosition = mesh.position.clone();
                    lastRotation = rotQ;
                    lastScaling = mesh.scaling.clone();                
                }

                if ((meshOwner == room.sessionId) && hasChanged()) {
                    let rotQ = mesh.rotationQuaternion ?
                        mesh.rotationQuaternion.clone() :
                        BABYLON.Quaternion.FromEulerVector(mesh.rotation);

                    room.send('transformUpdate', {
                        id: mesh.name,
                        position: mesh.position.asArray(),
                        rotation: rotQ.asArray(),
                        scaling: mesh.scaling.asArray()
                    });

                    // Update the last known state
                    lastPosition = mesh.position.clone();
                    lastRotation = rotQ;
                    lastScaling = mesh.scaling.clone();
                }
            };

            // Add listener for mesh transformations
            mesh.onAfterWorldMatrixUpdateObservable.add(sendUpdate);

            // ... other existing implementation ...

        }

        // Check if there's a change in position, rotation, or scaling
        function hasChanged() {
            let rotQ = mesh.rotationQuaternion ?
                mesh.rotationQuaternion.clone() :
                BABYLON.Quaternion.FromEulerVector(mesh.rotation);
            return !mesh.position.equals(lastPosition) ||
                   !rotQ.equals(lastRotation) ||
                   !mesh.scaling.equals(lastScaling);
        }
    };
}

export function broadcastEvent(handlerName: string = "") {
    return function (target: any, propertyKey: string) {
        let eventObj: any = target[propertyKey];
        let room: Room<any> | null = null;
        let lastEventObj: any = eventObj;

        // Custom setter for the field
        Object.defineProperty(target, propertyKey, {
            get: () => eventObj,
            set: (newEventObj: any) => {
                room = target['colyseusRoom'];                 
                eventObj = newEventObj;
                if (room) {
                    handleUpdate();
                }
            },
            enumerable: true,
            configurable: true
        });

        function handleUpdate() {
           
            if (!target.networkUpdateHandlers.has(propertyKey)){
                if (handlerName && typeof target.instanceReference[handlerName] === 'function') {
                    target.registerNetworkUpdateHandler(propertyKey,  target.instanceReference[handlerName]);      
                }else{
                    target.registerNetworkUpdateHandler(propertyKey, defualNetworkHandler.bind(target));
                }           
            }         
            eventObj["key"] = propertyKey;
            if(hasChanged(eventObj, lastEventObj)){
                const handler = target.networkUpdateHandlers.get(propertyKey);
                handler(eventObj);
                room.send('broadcastEvent', {
                    senderID: room.sessionId,  // Using the constructed key
                    value: eventObj
                });
                lastEventObj = eventObj;
            }

        }

        function defualNetworkHandler(message){
            console.log("broadcastEvent defualNetworkHandler" + JSON.stringify(message));
        }

    };
}

export function constructKey(objectName, propertyName) {
    const unitSeparator = '\x1F';
    return `${objectName}${unitSeparator}${propertyName}`;
}

// Helper function to parse the key
function parseKey(key) {
    const parts = key.split('\x1F');
    return parts.length === 2 ? parts : [key, undefined]; // Handle cases with no propertyName
}

function serializeValue(propName, value) {
    let serializedValue;
    let type;
    //handle special case when propName is rotationQ and it's null at the begining
    if(propName == "rotationQuaternion" && value == null){
        serializedValue = { x: 0, y: 0, z: 0, w: 1 };
        type = 'Quaternion';
    }else{

        if (value instanceof BABYLON.Vector3) {
            serializedValue = { x: value.x, y: value.y, z: value.z };
            type = 'Vector3';
        } else if (value instanceof BABYLON.Quaternion) {
            serializedValue = { x: value.x, y: value.y, z: value.z, w: value.w };
            type = 'Quaternion';
        } else if (typeof value === 'object' && value !== null) {
            serializedValue = JSON.stringify(value);
            type = 'object';
        } else {
            // Handle primitive types (number, boolean, string)
            serializedValue = value;
            type = typeof value;
        }
    }

    return { serializedValue, type };
}


function isDeepEqual(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    }
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) {
        return false;
    }
    let keys1 = Object.keys(obj1);
    let keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (let key of keys1) {
        if (!keys2.includes(key) || !isDeepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }
    return true;
}

function hasChanged(currentValue, lastValue) {
    if (currentValue instanceof BABYLON.Vector3) {
        return !currentValue.equals(lastValue);
    } else if (currentValue instanceof BABYLON.Quaternion) {
        return !currentValue.equals(lastValue);
    } else if (typeof currentValue === 'object' && currentValue !== null) {
        // Deep comparison for generic objects
        return !isDeepEqual(currentValue, lastValue);
    } else {
        // Fallback for primitive types and others
        return currentValue !== lastValue;
    }
}

function deepCopy(value) {
    if (value instanceof BABYLON.Vector3) {
        return value.clone();
    } else if (value instanceof BABYLON.Quaternion) {
        return value.clone();
    } else if (typeof value === 'object' && value !== null) {
        // Deep copy for plain objects
        return JSON.parse(JSON.stringify(value));
    } else {
        // This handles primitive types (string, number, boolean)
        return value;
    }
}

export function claimOwnership(room: Room<any>, key: string) {

    if(MultiuserManager.prototype["checkNetworkUpdateHandler"](key)){
        room.send('claimOwnership', { id: key });
      
    }else{
        //target._syncedProperties[key] = { objectKey: propertyKey, propertyKey: prop };    
        for (const propKey in MultiuserManager.prototype["_syncedProperties"]){
            const objectKey = MultiuserManager.prototype["_syncedProperties"][propKey]["objectKey"];
            const propertyKey =  MultiuserManager.prototype["_syncedProperties"][propKey]["propertyKey"];
            if(objectKey == key){
                room.send('claimOwnership', { id: propKey });
            }
        }

    }
}

export function releaseOwnership(room: Room<any>, key: string) {

    if(MultiuserManager.prototype["checkNetworkUpdateHandler"](key)){
        room.send('releaseOwnership', {  id: key });
    }else{  
        for (const propKey in MultiuserManager.prototype["_syncedProperties"]){
            const objectKey = MultiuserManager.prototype["_syncedProperties"][propKey]["objectKey"];
            const propertyKey =  MultiuserManager.prototype["_syncedProperties"][propKey]["propertyKey"];    
            if(objectKey == key){
                room.send('releaseOwnership', { id: propKey });
            }
        }

    }
}

