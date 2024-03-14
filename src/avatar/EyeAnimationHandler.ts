import { Scene, Mesh, TransformNode, Quaternion, Vector3 } from '@babylonjs/core';
import { AvatarBoneHelper } from '../utils';

export class EyeAnimationHandler {
    private scene: Scene;
    private headMesh: Mesh;
    private leftEyeBone: TransformNode | null;
    private rightEyeBone: TransformNode | null;

    private readonly VERTICAL_MARGIN = 15;
    private readonly HORIZONTAL_MARGIN = 5;
    private readonly EYE_BLINK_LEFT_BLEND_SHAPE_NAME = "eyeBlinkLeft";
    private readonly EYE_BLINK_RIGHT_BLEND_SHAPE_NAME = "eyeBlinkRight";
    private readonly EYE_BLINK_MULTIPLIER = 1.0;
    private readonly HALFBODY_OFFSET_X = 90;
    private readonly HALFBODY_OFFSET_Z = 180;

    private _blinkDuration = 0.1; // seconds
    private _blinkInterval = 3; // seconds
    private lastBlinkTime: number = 0;

    private isFullBody = false;
    private hasBlinkBlendShapes = false;
    private hasEyeBones = false;

    private leftBlinkIndex: number | null = null;
    private rightBlinkIndex: number | null = null;

    //TODO - need to diable idle eye animation when playing a custom facial anim.

    constructor(scene: Scene, avatarRoot: TransformNode, headMesh: Mesh) {
        this.scene = scene;
        this.headMesh = headMesh;

        this.isFullBody = AvatarBoneHelper.isFullBodySkeleton(avatarRoot);
        this.leftEyeBone = AvatarBoneHelper.getLeftEyeBone(avatarRoot, this.isFullBody);
        this.rightEyeBone = AvatarBoneHelper.getRightEyeBone(avatarRoot, this.isFullBody);

        this.validateSkeleton();
        this.initializeBlinkBlendShapes();

        //this.animateEyes();
        scene.onBeforeRenderObservable.add(()=>{
            if (this.hasEyeBones || this.hasBlinkBlendShapes) {
                const now = Date.now();
                if(now - this.lastBlinkTime > this._blinkInterval*1000){
                    this.rotateEyes();
                    this.blinkEyes();
                    this.lastBlinkTime = now;
                }    
            }
        })
        
    }

    get BlinkDuration(): number {
        return this._blinkDuration;
    }

    set BlinkDuration(value: number) {
        this._blinkDuration = value;
    }

    get BlinkInterval(): number {
        return this._blinkInterval;
    }

    set BlinkInterval(value: number) {
        this._blinkInterval = value;
    }

    private validateSkeleton(): void {
        this.hasEyeBones = Boolean(this.leftEyeBone && this.rightEyeBone);
        console.log("validateSkeleton: " + this.hasEyeBones);
        
    }

    private initializeBlinkBlendShapes(): void {
        const morphTargetManager = this.headMesh.morphTargetManager;
        if (morphTargetManager) {
            for (let i = 0; i < morphTargetManager.numTargets; i++) {
                const target = morphTargetManager.getTarget(i);
                if (target.name === this.EYE_BLINK_LEFT_BLEND_SHAPE_NAME) {
                    this.leftBlinkIndex = i;
                } else if (target.name === this.EYE_BLINK_RIGHT_BLEND_SHAPE_NAME) {
                    this.rightBlinkIndex = i;
                }
            }
            this.hasBlinkBlendShapes = this.leftBlinkIndex !== null && this.rightBlinkIndex !== null;
            console.log("initializeBlinkBlendShapes: " + this.hasBlinkBlendShapes + ", " + this.leftBlinkIndex + ", " + this.rightBlinkIndex);
        }
    }

    private rotateEyes(): void {
        if (!this.hasEyeBones) return;

        const rotation = this.getRandomLookRotation();
        if (this.leftEyeBone) this.leftEyeBone.rotationQuaternion = rotation;
        if (this.rightEyeBone) this.rightEyeBone.rotationQuaternion = rotation;
    }

    private getRandomLookRotation(): Quaternion {
        const vertical = (Math.random() - 0.5) * 2 * this.VERTICAL_MARGIN;
        const horizontal = (Math.random() - 0.5) * 2 * this.HORIZONTAL_MARGIN;
        const verticalRad = vertical * (Math.PI / 180);
        const horizontalRad = horizontal * (Math.PI / 180);

        if (this.isFullBody) {
            return Quaternion.FromEulerAngles(horizontalRad, verticalRad, 0);
        } else {
            return Quaternion.FromEulerAngles(horizontalRad - this.HALFBODY_OFFSET_X * (Math.PI / 180), 0, verticalRad + this.HALFBODY_OFFSET_Z * (Math.PI / 180));
        }
    }

    private blinkEyes(): void {
        
        if (!this.hasBlinkBlendShapes || this.leftBlinkIndex === null || this.rightBlinkIndex === null) return;

        const morphTargetManager = this.headMesh.morphTargetManager;
        if (morphTargetManager) {
            morphTargetManager.getTarget(this.leftBlinkIndex).influence = this.EYE_BLINK_MULTIPLIER;
            morphTargetManager.getTarget(this.rightBlinkIndex).influence = this.EYE_BLINK_MULTIPLIER;

            console.log("blinkEyes: " + morphTargetManager.getTarget(this.leftBlinkIndex).influence)

            setTimeout(()=>{
                morphTargetManager.getTarget(this.leftBlinkIndex).influence = 0;
                morphTargetManager.getTarget(this.rightBlinkIndex).influence = 0;
            }, this._blinkDuration * 1000)
        }
    }
}