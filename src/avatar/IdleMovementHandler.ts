import { Quaternion, Scene, TransformNode, Vector3 } from '@babylonjs/core';

export class IdleMovementHandler {
    private scene: Scene;
    private avatarNode: TransformNode; // Reference to the avatar or chest node
    private breathingRate: number; // Breaths per minute
    private breathingAmplitude: number; // Max vertical displacement for breathing

    constructor(scene: Scene, avatarNode: TransformNode, breathingRate: number = 12, breathingAmplitude: number = 0.02) {
        this.scene = scene;
        this.avatarNode = avatarNode;
        this.breathingRate = breathingRate; // Default to 12 breaths per minute
        this.breathingAmplitude = breathingAmplitude; // Default vertical displacement
        this.breathingRate = 16
        this.breathingAmplitude = 0.005
        this.applyBreathingMovement();
    }

    private applyBreathingMovement() {
        const originalPosition = this.avatarNode.position.clone();
        let elapsedTime = 0;
       
        this.scene.onBeforeRenderObservable.add(() => {
            const deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0; // Convert deltaTime to seconds
            elapsedTime += deltaTime;

            // Calculate the current phase of the breathing cycle
            const cycleTime = 60.0 / this.breathingRate; // Cycle time in seconds
            const phase = (elapsedTime % cycleTime) / cycleTime; // Current phase of the cycle
           
            // Calculate vertical displacement based on a sine wave for smooth oscillation
            const displacement = Math.sin(phase * 2 * Math.PI) * this.breathingAmplitude;
           
            // Apply the calculated displacement to the avatar's Y position
            this.avatarNode.position.y = originalPosition.y + displacement;
        });
    }
}