import { MapSchema, Schema, Context, type } from "@colyseus/schema";
import { QuaternionSchema, Vector3Schema } from "./DataTypeSchema";

export class CollabObjectSchema extends Schema {
    @type("string") objectID: string = "";
    @type(Vector3Schema) pos: Vector3Schema = new Vector3Schema();
    @type(QuaternionSchema) rot: QuaternionSchema = new QuaternionSchema();
    @type(Vector3Schema) scale: Vector3Schema = new Vector3Schema();
    @type("boolean") isVisible: boolean = true;
    @type("boolean") isPlayAnim: boolean = false;
    @type("boolean") isEmpty: boolean = true;
    @type("string") color: string = "#1ad2d2";

    constructor(data){
      super();
      Object.assign(this, data);
    }

    updateObjectState(data){
        console.log("updateObjectState update received -> " + this.objectID);
        console.debug(JSON.stringify(data));
    
        //TODO - beter way?
        //Object.assign(this, data); won't work since data is Object type. 
        this.objectID = data.objectID as string
        this.pos = new Vector3Schema(data["pos"].x, data["pos"].y, data["pos"].z);
        this.rot = new QuaternionSchema(data["rot"].x, data["rot"].y, data["rot"].z, data["rot"].w);
        this.scale = new Vector3Schema(data["scale"].x, data["scale"].y, data["scale"].z);
        this.isVisible =  data["isVisible"];
        this.isPlayAnim = data["isPlayAnim"];
        this.isEmpty = data["isEmpty"];
        if(data["color"]){
          this.color = data["color"];
        }
      }
}