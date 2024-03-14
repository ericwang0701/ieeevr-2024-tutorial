import { AbstractMesh, Color3, Scene, StandardMaterial, Vector3, WebXRControllerComponent, WebXRFeatureName, WebXRFeaturesManager } from "@babylonjs/core";
import {CustomColors} from "./utils";
import { MultiuserManager } from "./MultiuserManager";

export const initXRInteraction = async (scene: Scene, teleportMeshes: AbstractMesh[]) => {

    // Default settings for the movement controls
    const defaultMovementSettings = {
        locomotionType: "teleport", // "teleport" or "movement"
        // Movement settings
        movementEnabled: true,
        movementSpeed: 0.5, // 1 is too fast most of the time
        rotationEnabled: true,
        rotationSpeed: 0.25,
        // Teleport settings
        parabolicCheckRadius: 5,
        rotationAngle: 0.25, // teleport rotation angle, not movement controls
        backwardsTeleportationDistance: 0.7
    };

    let xr = await scene.createDefaultXRExperienceAsync({
        floorMeshes: teleportMeshes,
        pointerSelectionOptions: {
            enablePointerSelectionOnAllControllers: true
        }
    });
    
    //const VRsupported = await xr.baseExperience.sessionManager.isSessionSupportedAsync('immersive-vr');

    // Move the player when thet enter immersive mode
    xr.baseExperience.onInitialXRPoseSetObservable.add((xrCamera) => {
        console.log("Entering Immersive Mode with camera", xrCamera);
        
        //place for init xrCamera pose.
        //it will be the main camera postiino before enterXR.
        //xrCamera.position.z = -2;
        MultiuserManager.getInstance().onEnterWebXR();
    });

    const setupCameraForCollisions = (camera) => {
        camera.checkCollisions = true;
        camera.applyGravity = true;
        camera.ellipsoid = new Vector3(0.7, 1, 0.7);
        camera.ellipsoidOffset = new Vector3(0, 0.5, 0);
    };

    const useMovementControls = (featureManager) => {
        // Turn off the other feature
        featureManager.disableFeature(WebXRFeatureName.TELEPORTATION);
        // Configure and enable the movement controls
        const swappedHandednessConfiguration = [
            {
                allowedComponentTypes: [WebXRControllerComponent.THUMBSTICK_TYPE, WebXRControllerComponent.TOUCHPAD_TYPE],
                forceHandedness: "right",
                axisChangedHandler: (axes, movementState, featureContext) => {
                    movementState.rotateX = Math.abs(axes.x) > featureContext.rotationThreshold ? axes.x : 0;
                    movementState.rotateY = Math.abs(axes.y) > featureContext.rotationThreshold ? axes.y : 0;
                }
            },
            {
                allowedComponentTypes: [WebXRControllerComponent.THUMBSTICK_TYPE, WebXRControllerComponent.TOUCHPAD_TYPE],
                forceHandedness: "left",
                axisChangedHandler: (axes, movementState, featureContext) => {
                    movementState.moveX = Math.abs(axes.x) > featureContext.movementThreshold ? axes.x : 0;
                    movementState.moveY = Math.abs(axes.y) > featureContext.movementThreshold ? axes.y : 0;
                }
            }
        ];

        setupCameraForCollisions(xr.input.xrCamera);

        featureManager.enableFeature(WebXRFeatureName.MOVEMENT, "latest", {
            xrInput: xr.input,
            customRegistrationConfigurations: swappedHandednessConfiguration,
            movementEnabled: defaultMovementSettings.movementEnabled,
            movementSpeed: defaultMovementSettings.movementSpeed,
            rotationEnabled: defaultMovementSettings.rotationEnabled,
            rotationSpeed: defaultMovementSettings.rotationSpeed
        });
    };

    const useTeleportControls = (featureManager: WebXRFeaturesManager) => {
        // Turn off the other feature
        featureManager.disableFeature(WebXRFeatureName.MOVEMENT);
        // Configure and enable the teleportation feature
        const createTeleportationSetup = () => {
            const teleportRingMat = new StandardMaterial("grab-mat1", scene);
            teleportRingMat.diffuseColor = CustomColors["light1"];
            teleportRingMat.specularColor = new Color3(0.2, 0.2, 0.2);

            let setup = {
                xrInput: xr.input,
                floorMeshes: teleportMeshes
            };

            setup["defaultTargetMeshOptions"] = {
                teleportationFillColor: "#3e4a5d",
                teleportationBorderColor: "#8854d0",
                torusArrowMaterial: teleportRingMat
            };

            setup["renderingGroupId"] = 1;

            return setup;
        };

        const teleportControlManager = featureManager.enableFeature(WebXRFeatureName.TELEPORTATION, "stable", createTeleportationSetup());
        xr.teleportation.parabolicCheckRadius = defaultMovementSettings.parabolicCheckRadius;
        xr.teleportation.rotationAngle = defaultMovementSettings.rotationAngle;
        xr.teleportation.backwardsTeleportationDistance = defaultMovementSettings.backwardsTeleportationDistance;
        xr.teleportation.rotationEnabled = false; // rotation while teleport is disabled
    };

    const featureManager: WebXRFeaturesManager = xr.baseExperience.featuresManager;
    if (defaultMovementSettings.locomotionType === "movement") {
        useMovementControls(featureManager);
    } else {
        useTeleportControls(featureManager);
    }

    //controller input
    xr.input.onControllerAddedObservable.add((controller) => {
        const isHand = controller.inputSource.hand;

        controller.onMotionControllerInitObservable.add((motionController) => {
            if (motionController.handness === "left") {
                MultiuserManager.getInstance().leftController = xr.input.controllers[1].pointer;
                
                controller.onMeshLoadedObservable.add((mesh:AbstractMesh) => {         
                });

                const xr_ids = motionController.getComponentIds();
                let triggerComponent = motionController.getComponent(xr_ids[0]); //xr-standard-trigger
                triggerComponent?.onButtonStateChangedObservable.add(async () => {
                    if (triggerComponent.pressed) {
                        console.log("Left Trigger Pressed");
                    }
                });
                let squeezeComponent = motionController.getComponent(xr_ids[1]); //xr-standard-squeeze
                squeezeComponent?.onButtonStateChangedObservable.add(async () => {
                    if (squeezeComponent.pressed) {
                        console.log("Left Grip Pressed");
                    }
                });
                let thumbstickComponent = motionController.getComponent(xr_ids[2]); //xr-standard-thumbstick
                thumbstickComponent?.onButtonStateChangedObservable.add(() => {
                    if (thumbstickComponent.pressed) {
                      console.log("Left Thumbstick Pressed");
                    }
                });
                thumbstickComponent.onAxisValueChangedObservable.add((axes) => {
                  console.log("Left Axises: " + axes.x + " " + axes.y);
                });

                let xButtonComponent = motionController.getComponent(xr_ids[3]); //x-button
                xButtonComponent?.onButtonStateChangedObservable.add(async () => {
                    
                    if (xButtonComponent.pressed) {
                        console.log("X Button Pressed");
                    }
                });
                let yButtonComponent = motionController.getComponent(xr_ids[4]); //y-button
                yButtonComponent?.onButtonStateChangedObservable.add(async () => {

                    if (yButtonComponent.pressed) {
                        console.log("Y Button Pressed");
                    }
                });
            }

            // END LEFT CONTROLLER ------------------------------------------------------------

            if (motionController.handness === "right") {

                MultiuserManager.getInstance().rightController = xr.input.controllers[0].pointer;
                controller.onMeshLoadedObservable.add((mesh:AbstractMesh) => {
                });

                const xr_ids = motionController.getComponentIds();
                let triggerComponent = motionController.getComponent(xr_ids[0]); //xr-standard-trigger
                triggerComponent?.onButtonStateChangedObservable.add(() => {
                    if (triggerComponent.pressed) {
                        console.log("Right Trigger Pressed");
                    }
                });
                let squeezeComponent = motionController.getComponent(xr_ids[1]); //xr-standard-squeeze
                squeezeComponent?.onButtonStateChangedObservable.add(() => {
                    if (squeezeComponent.pressed) {
                        console.log("Right Grip Pressed");
                    }
                });
                let thumbstickComponent = motionController.getComponent(xr_ids[2]); //xr-standard-thumbstick
                thumbstickComponent?.onButtonStateChangedObservable.add(() => {
                    if (thumbstickComponent.pressed) {
                      console.log("Right Thumbstick Pressed");
                    }
                });

                let aButtonComponent = motionController.getComponent(xr_ids[3]); //a-button
                aButtonComponent?.onButtonStateChangedObservable.add(() => {
                    if (aButtonComponent.pressed) {
                        console.log("A Button Pressed");
                    }
                });
                let bButtonComponent = motionController.getComponent(xr_ids[4]); //b-button
                bButtonComponent?.onButtonStateChangedObservable.add(() => {
                    if (bButtonComponent.pressed) {
                        console.log("B Button Pressed");
                    }
                });
            }
        });
    });

    return { xr };

    // END WebXR --------------------------------------------------
};