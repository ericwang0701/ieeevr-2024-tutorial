import { Schema, type } from "@colyseus/schema";
import { QuaternionSchema, Vector3Schema, complexTypes } from "./DataTypeSchema";

export class Entity extends Schema {
    @type("string") entityID: string = "";
    @type(Vector3Schema) pos: Vector3Schema = new Vector3Schema();
    @type(QuaternionSchema) rot: QuaternionSchema = new QuaternionSchema();
    @type(Vector3Schema) scale: Vector3Schema = new Vector3Schema();
    @type("string") ownerUserID: string = "";

    constructor(data?: Partial<Entity>){
        super();

        if (data) {
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && this.hasOwnProperty(key)) {
                    const property = this[key];
                    if (this[key] instanceof Schema) {
                        // For complex schema types, use the helper function
                        //console.log(`Updating complex property: ${key}`, data[key]); // Log complex property update
                        this.updateSchemaProperty(this[key], data[key]);
                    } else {
                        (this[key] as any) = data[key];
                    }
                }
            });
        }
        
    }

    // Helper function to update complex schema properties
    private updateSchemaProperty(schemaProperty: Schema, updateData: any) {
        if (complexTypes.some(cls => schemaProperty instanceof cls)) {
            
            Object.keys(updateData).forEach(key => {             
                schemaProperty[key] = updateData[key];
            });
        } else {
            console.warn("Unhandled schema property type:", schemaProperty);
        }
    }

    updateEntityState(data: any) {
        Object.keys(data).forEach(key => {
            if (this[key] instanceof Schema) {
                // For complex schema types, use the helper function
                //console.log(`Updating complex property: ${key}`, data[key]); // Log complex property update
                this.updateSchemaProperty(this[key], data[key]);
            } else {
                // For primitive types, assign directly
                this[key] = data[key];
            }
        });
    }

}