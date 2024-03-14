import { MapSchema, Schema, Context, type } from "@colyseus/schema";
import { QuaternionSchema, Vector3Schema } from "./DataTypeSchema";
import { Entity } from "./Entity";

export class PlayerSchema extends Entity {
  @type(Vector3Schema) leftHandPos: Vector3Schema = new Vector3Schema();
  @type(QuaternionSchema) leftHandRot: QuaternionSchema = new QuaternionSchema();
  @type(Vector3Schema) rightHandPos: Vector3Schema = new Vector3Schema();
  @type(QuaternionSchema) rightHandRot: QuaternionSchema = new QuaternionSchema();
  @type("number") visMode: number = 1;
  @type("number") avatarAnim:number = 0;
  @type("number") facialAnim:number = 0;
  @type("number") handPose:number = 0;
  @type("number") audioAmplitude:number = 0;
  @type("number") platform:number = 0;

  constructor(data?: Partial<PlayerSchema>) {
    super(data); // Pass data to the superclass constructor

    // Initialize PlayerSchema-specific properties
    if (data) {
      if (data.leftHandPos) {
        this.leftHandPos = new Vector3Schema(data.leftHandPos.x, data.leftHandPos.y, data.leftHandPos.z);
      }
      if (data.leftHandRot) {
        this.leftHandRot = new QuaternionSchema(data.leftHandRot.x, data.leftHandRot.y, data.leftHandRot.z, data.leftHandRot.w);
      }
      if (data.rightHandPos) {
        this.rightHandPos = new Vector3Schema(data.rightHandPos.x, data.rightHandPos.y, data.rightHandPos.z);
      }
      if (data.rightHandRot) {
        this.rightHandRot = new QuaternionSchema(data.rightHandRot.x, data.rightHandRot.y, data.rightHandRot.z, data.rightHandRot.w);
      }
      if (data.visMode !== undefined) {
        this.visMode = data.visMode;
      }
      if (data.avatarAnim !== undefined) {
        this.avatarAnim = data.avatarAnim;
      }
      if (data.facialAnim !== undefined) {
        this.facialAnim = data.facialAnim;
      }
      if (data.handPose !== undefined) {
        this.handPose = data.handPose;
      }

      if (data.audioAmplitude !== undefined) {
        this.audioAmplitude = data.audioAmplitude;
      }

      if (data.platform !== undefined) {
        this.platform = data.platform;
      }

    }
  }

}
