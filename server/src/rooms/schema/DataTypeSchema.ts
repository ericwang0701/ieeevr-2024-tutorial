import { MapSchema, Schema, Context, type } from "@colyseus/schema";


export class Vector3Schema extends Schema {
    @type("number") x: number;
    @type("number") y: number;
    @type("number") z: number;

    constructor(_x = 0, _y = 0, _z = 0) {
        super();
        this.x = _x;
        this.y = _y;
        this.z = _z;
    }
}

export class QuaternionSchema extends Schema {
    @type("number") x: number;
    @type("number") y: number;
    @type("number") z: number;
    @type("number") w: number;

    constructor(_x = 0, _y = 0, _z = 0, _w = 1) {
        super();
        this.x = _x;
        this.y = _y;
        this.z = _z;
        this.w = _w;
    }
}

export class NetworkNumberSchema extends Schema {
    @type("string") id:string
    @type("number") value: number;
    @type("string") owner: string;

    constructor(value = 0, owner = "") {
        super();
        this.id = "";
        this.value = value;
        this.owner = owner;
    }
}

export class NetworkBooleanSchema extends Schema {
    @type("string") id:string
    @type("boolean") value: boolean;
    @type("string") owner: string;

    constructor(value = false, owner = "") {
        super();
        this.id = "";
        this.value = value;
        this.owner = owner;
    }
}

export class NetworkStringSchema extends Schema {
    @type("string") id:string
    @type("string") value: string;
    @type("string") owner: string;

    constructor(value = "",owner = "") {
        super();
        this.id = "";
        this.value = value;
        this.owner = owner;
    }
}

export class NetworkVector3Schema extends Schema{
    @type("string") id:string
    @type(Vector3Schema) vector3:Vector3Schema
    @type("string") owner: string;

    constructor(x = 0, y = 0, z = 0, owner = "") {
        //super(x, y, z);
        super();
        this.id = "";
        this.vector3 = new Vector3Schema(x, y, z);
        this.owner = owner;
    }
}

export class NetworkQuaternionSchema extends Schema {
    @type("string") id:string
    @type(QuaternionSchema) quaternion:QuaternionSchema
    @type("string") owner: string;

    constructor(x = 0, y = 0, z = 0, w = 1, owner = "") {
        // super(x, y, z, w);
        // this.owner = owner;
        super();
        this.quaternion = new QuaternionSchema(x, y, z,w);
        this.owner = owner;

    }
}

export class NetworkTransformSchema extends Schema {
    @type("string") id:string
    @type(Vector3Schema) position: Vector3Schema;
    @type(QuaternionSchema) rotation: QuaternionSchema;
    @type(Vector3Schema) scaling: Vector3Schema;
    @type("string") owner: string;

    constructor() {
        super();
        this.id = "";
        this.position = new Vector3Schema();
        this.rotation = new QuaternionSchema();
        this.scaling = new Vector3Schema(1, 1, 1);
        this.owner = "";
    }
}




export const complexTypes = [ Vector3Schema, QuaternionSchema];
