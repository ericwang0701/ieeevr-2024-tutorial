import * as BABYLON from '@babylonjs/core'
import { NetworkedEntity } from "../network/NetworkedEntity";
import { PlayerSchema } from "../schema/PlayerSchema";
import { AdvancedDynamicTexture, GUI3DManager, MeshButton3D, PlanePanel, Rectangle, TextBlock } from '@babylonjs/gui';
import { AvatarFullBoneList, IPose, getRandomRPMUserProfile} from '../utils';
import { QuaternionSchema, Vector3Schema } from '../schema/DataTypeSchema';
import { MultiuserManager } from '../MultiuserManager';
import { EyeAnimationHandler } from './EyeAnimationHandler';
import { IdleMovementHandler } from './IdleMovementHandler';

export class AvatarHB extends NetworkedEntity<PlayerSchema>{
    protected entityType = "player";

    public avatarMeshes: BABYLON.AbstractMesh[];
	public avatarRootMesh: BABYLON.TransformNode;
	public avatarFullBoneNodes: { [key: string]: BABYLON.TransformNode }
	public avatarRestPose: { [key: string]: IPose }
    private rootToEyeOffset: BABYLON.Vector3;

	private updateFrequencies: number;
	private framesToCompensate: number;

    public avatarCam: BABYLON.UniversalCamera;

    private GUI3Dmanager: GUI3DManager;
	private planePanel: PlanePanel;
	private namePlaneAnchor: BABYLON.TransformNode;
	private nameMeshButton: MeshButton3D;

	public morphTargetManager: BABYLON.Nullable<BABYLON.MorphTargetManager>;
	private headMesh:BABYLON.Mesh;
	private handMesh:BABYLON.Mesh;

    protected async initialize(userID:string, initPose?:IPose, playerSchema?:PlayerSchema): Promise<void> {
		
        this.rootToEyeOffset = new BABYLON.Vector3(0.0, 0.6, 0.0);
		this.morphTargetManager = null;
		this.avatarFullBoneNodes = {};
		this.avatarRestPose = {};

		this.updateFrequencies = 100;
		this.framesToCompensate = 1 + (this.updateFrequencies / 1000) * 60;

        if(initPose == null){
            initPose = {
                position: BABYLON.Vector3.Zero(),
                rotation: BABYLON.Vector3.Zero(),
                scaling: BABYLON.Vector3.One(),
            }
        }

        // when user generate their own local avatar
		if (playerSchema == null) {
			this.schema.entityID = userID;
			this.schema.ownerUserID = userID;
			this.schema.pos = new Vector3Schema(initPose.position.x, initPose.position.y, initPose.position.z);
			const playerRotQ = BABYLON.Quaternion.FromEulerVector(initPose.rotation);
			this.schema.rot = new QuaternionSchema(playerRotQ.x, playerRotQ.y, playerRotQ.z, playerRotQ.w);
			this.schema.scale = new Vector3Schema(initPose.scaling.x, initPose.scaling.y, initPose.scaling.z);
		}else{
            Object.assign(this.schema, playerSchema);
        }

        const userProfile = this.getUserProfile();

		const avatarID = "avatar-" + userProfile.avatarID; //modelID
		let loadAvatarResult = await this.loadAvatarFromAssets(userProfile.avatarID);
		if (loadAvatarResult) {
			this.avatarMeshes = loadAvatarResult.meshes;
		} else {
			console.log("load avatar failed: " + avatarID);
		}

        //the this.avatarMeshes[0] will has rot y 180 and scale 1, 1, -1 from left-handed ro right handed
		this.avatarRootMesh = new BABYLON.TransformNode("Avatar-" + this.schema.entityID);
		this.avatarMeshes[0].parent = this.avatarRootMesh;
		this.avatarRootMesh.position = initPose.position;
		this.avatarRootMesh.rotationQuaternion = BABYLON.Quaternion.FromEulerVector(initPose.rotation);

		this.avatarRootMesh.getChildTransformNodes().forEach((trasnformNode) => {
			MultiuserManager.getInstance().scene.stopAnimation(trasnformNode);
		})

		for (let i = 0; i < this.avatarMeshes.length; i++) {
			if(this.avatarMeshes[i].name == "Wolf3D_Head"){
				this.morphTargetManager = this.avatarMeshes[i].morphTargetManager;
				this.headMesh = this.avatarMeshes[i] as BABYLON.Mesh;
			}else if(this.avatarMeshes[i].name == "Wolf3D_Hands"){
				this.handMesh =  this.avatarMeshes[i] as BABYLON.Mesh;
			}
		}

        this.initTransformNodeMap();

        this.avatarFullBoneNodes["LeftHand"].position = new BABYLON.Vector3(0.3, 0, 0.3);
		this.avatarFullBoneNodes["RightHand"].position = new BABYLON.Vector3(-0.3, 0, 0.3);
		//using nQuaternion since webxr tracking and retargeted gestures are using Quaternion
		this.avatarFullBoneNodes["LeftHand"].rotationQuaternion = BABYLON.Quaternion.FromEulerVector(new BABYLON.Vector3(0, -Math.PI / 2, -Math.PI / 2));
		this.avatarFullBoneNodes["RightHand"].rotationQuaternion = BABYLON.Quaternion.FromEulerVector(new BABYLON.Vector3(0, Math.PI / 2, Math.PI / 2));

		//this.updateAvatarRestPose();

        this.createAvatarCam();

		//testing eye animation:
		const eyeAnimationHandler = new EyeAnimationHandler(MultiuserManager.getInstance().scene, this.avatarRootMesh, this.headMesh);
		eyeAnimationHandler.BlinkDuration = 0.1;
		eyeAnimationHandler.BlinkInterval = 3;

		const idleMovementHandler = new IdleMovementHandler(this.scene, this.avatarFullBoneNodes["Neck"]);

        this.GUI3Dmanager = new GUI3DManager(MultiuserManager.getInstance().scene);

		this.namePlaneAnchor = new BABYLON.TransformNode("namePlaneAnchor");
		this.planePanel = new PlanePanel();
		this.GUI3Dmanager.addControl(this.planePanel);
		this.planePanel.linkToTransformNode(this.namePlaneAnchor);

		//namePlane
		this.namePlaneAnchor.parent = this.avatarFullBoneNodes["Head"];
		this.namePlaneAnchor.position = new BABYLON.Vector3(0.0, 0.32, 0.0);
        let userName = userProfile.fullName;
		if (!userProfile.fullName) {
			userName = "undefined";
		}
		if (userProfile.platform == "desktop") {
			this.nameMeshButton = this.createNameLabel(userName, false);
		} else {
			this.nameMeshButton = this.createNameLabel(userName, true);
		}

        this.createNewEntity(this.schema);
        this.avatarRootMesh.metadata = { player: this };

    }

    private initTransformNodeMap = () => {
        this.avatarFullBoneNodes = {};
		this.avatarRootMesh.getChildTransformNodes().forEach((trasnformNode) => {
			if (AvatarFullBoneList.includes(trasnformNode.name)) {
				this.avatarFullBoneNodes[trasnformNode.name] = trasnformNode;
			}
		})
	}

    private createAvatarCam = () => {
		// This creates and positions a first-person camera (non-mesh)
		this.avatarCam = new BABYLON.UniversalCamera("AvatarCam", new BABYLON.Vector3(0, 0.0, 0), MultiuserManager.getInstance().scene);
		this.avatarCam.fov = 90 * Math.PI / 180;
		this.avatarCam.minZ = 0.1;
		this.avatarCam.speed = 0.05;
		this.avatarCam.parent = this.avatarFullBoneNodes["Head"];
	}

    private getUserProfile() {
		//TODO - get userProfile from userID
		return getRandomRPMUserProfile();
	}

    private loadAvatarFromAssets = async (avatarID:number)=>{
		const loadAvatarResult = await BABYLON.SceneLoader.ImportMeshAsync('', 'assets/avatars/', "avatar-" + avatarID + ".glb", MultiuserManager.getInstance().scene)
		return loadAvatarResult;
	}

    public createNameLabel = (name: string, isMobileUser: boolean): MeshButton3D => {
		var rect = new Rectangle();
		rect.name = "AvatarLabel"
		rect.width = 1; //0.2
		rect.height = 1;
		rect.cornerRadius = 20;
		rect.color = "white";
		rect.thickness = 20;
		if (isMobileUser) {
			rect.background = "#1ad2d2";
		} else {
			rect.background = "black";
		}

		var label = new TextBlock();
		label.text = name;
		label.scaleX = 6;
		label.scaleY = 24;

		rect.addControl(label);

		var plane = BABYLON.MeshBuilder.CreatePlane("namePlane", { width: 1, height: 1 });
		const namePlaneMeshButton = new MeshButton3D(plane, "namePlaneMeshButton");
		this.planePanel.addControl(namePlaneMeshButton);
		namePlaneMeshButton.mesh.position = new BABYLON.Vector3(0, 0, 0);
		namePlaneMeshButton.mesh.rotation = new BABYLON.Vector3(0, 0, 0);
		namePlaneMeshButton.mesh.scaling = new BABYLON.Vector3(0.6, 0.15, 1);

		var advancedTexture = AdvancedDynamicTexture.CreateForMesh(namePlaneMeshButton.mesh);
		advancedTexture.addControl(rect);

		return namePlaneMeshButton;
	};

    public getUserNameMeshButton = () => {
		return this.nameMeshButton;
	}

	public getUserNamePlane = () => {
		return this.nameMeshButton.mesh;
	}

    public toggleNameLabel = (isVisible: boolean) => {
		this.nameMeshButton.mesh.setEnabled(isVisible);
	}

	public toggleHandMesh = (isVisible: boolean) => {
		this.handMesh.setEnabled(isVisible);
	}

    public toggleAvatarVisibility = (userID:string, visMode: number) => {
        if(visMode == 1){
            this.avatarRootMesh.setEnabled(true);
        }else if (visMode == 2){
			this.avatarRootMesh.setEnabled(true);
		}
		else{
            this.avatarRootMesh.setEnabled(false);
        }

	}

    private followCam(){
        
        let cam = MultiuserManager.getInstance().scene.activeCamera;
		
        if (cam instanceof BABYLON.UniversalCamera) {

			// if(this.handMesh.isEnabled()){
			// 	this.toggleHandMesh(false);
			// }

			this.schema.platform = 0;
			
			this.schema.pos = new Vector3Schema(MultiuserManager.getInstance().scene.activeCamera.position.x, MultiuserManager.getInstance().scene.activeCamera.position.y, 
				MultiuserManager.getInstance().scene.activeCamera.position.z);
			this.schema.rot = new QuaternionSchema(MultiuserManager.getInstance().scene.activeCamera.absoluteRotation.x, MultiuserManager.getInstance().scene.activeCamera.absoluteRotation.y,
				MultiuserManager.getInstance().scene.activeCamera.absoluteRotation.z, MultiuserManager.getInstance().scene.activeCamera.absoluteRotation.w);

			if(MultiuserManager.getInstance().leftController != null){
				const leftControllerPos = MultiuserManager.getInstance().leftController.position.clone();
				const leftControllerRotQ=  MultiuserManager.getInstance().leftController.rotationQuaternion.clone();
				this.schema.leftHandPos = new Vector3Schema(leftControllerPos.x, leftControllerPos.y, leftControllerPos.z);
				
				this.schema.leftHandRot = new QuaternionSchema(leftControllerRotQ.x, leftControllerRotQ.y, leftControllerRotQ.z, leftControllerRotQ.w);
			}

			if(MultiuserManager.getInstance().rightController != null){
				const rightControllerPos = MultiuserManager.getInstance().rightController.position.clone();
				const rightControllerRotQ=  MultiuserManager.getInstance().rightController.rotationQuaternion.clone();
				this.schema.rightHandPos = new Vector3Schema(rightControllerPos.x, rightControllerPos.y, rightControllerPos.z);
				this.schema.rightHandRot = new QuaternionSchema(rightControllerRotQ.x, rightControllerRotQ.y, rightControllerRotQ.z, rightControllerRotQ.w);
			}

		} else if (cam instanceof BABYLON.WebXRCamera) {
			if(!this.handMesh.isEnabled()){
				this.toggleHandMesh(true);
			}

			this.schema.platform = 1;

			this.schema.pos = new Vector3Schema(MultiuserManager.getInstance().scene.activeCamera.position.x, MultiuserManager.getInstance().scene.activeCamera.position.y, 
				MultiuserManager.getInstance().scene.activeCamera.position.z);
			this.schema.rot = new QuaternionSchema(MultiuserManager.getInstance().scene.activeCamera.absoluteRotation.x, MultiuserManager.getInstance().scene.activeCamera.absoluteRotation.y,
				MultiuserManager.getInstance().scene.activeCamera.absoluteRotation.z, MultiuserManager.getInstance().scene.activeCamera.absoluteRotation.w);


			if(MultiuserManager.getInstance().leftController != null){
				const leftControllerPos = MultiuserManager.getInstance().leftController.position.clone();
				const leftControllerRotQ=  MultiuserManager.getInstance().leftController.rotationQuaternion.clone();
				this.schema.leftHandPos = new Vector3Schema(leftControllerPos.x, leftControllerPos.y, leftControllerPos.z);
				this.schema.leftHandRot = new QuaternionSchema(leftControllerRotQ.x, leftControllerRotQ.y, leftControllerRotQ.z, leftControllerRotQ.w);
			}

			if(MultiuserManager.getInstance().rightController != null){
				const rightControllerPos = MultiuserManager.getInstance().rightController.position.clone();
				const rightControllerRotQ=  MultiuserManager.getInstance().rightController.rotationQuaternion.clone();
				this.schema.rightHandPos = new Vector3Schema(rightControllerPos.x, rightControllerPos.y, rightControllerPos.z);
				this.schema.rightHandRot = new QuaternionSchema(rightControllerRotQ.x, rightControllerRotQ.y, rightControllerRotQ.z, rightControllerRotQ.w);
			}

			
		}
    }

    protected handleLocalUpdates(deltaTime: number): void {
        this.followCam();
		this.updateAvatarFromSchema();
        this.updateNetworkSchema(this.schema);
    }

	private updateAvatarFromSchema() {

		if (this.schema.platform == 0) {

			const newCamGlobalPos = new BABYLON.Vector3(this.schema.pos.x, this.schema.pos.y, this.schema.pos.z);
			let envRootWorldMatrix = MultiuserManager.getInstance().envRoot.computeWorldMatrix(true).clone();
			envRootWorldMatrix = envRootWorldMatrix.invert();
			let newCamLocalPos = BABYLON.Vector3.TransformCoordinates(newCamGlobalPos, envRootWorldMatrix);

			const newAvatarLocalPos = newCamLocalPos.subtract(this.rootToEyeOffset)

			const newCamGlobalRotQ = new BABYLON.Quaternion(this.schema.rot.x, -this.schema.rot.y, -this.schema.rot.z, this.schema.rot.w);
			let newCamLocalRotQ = newCamGlobalRotQ.multiply(BABYLON.Quaternion.FromRotationMatrix(envRootWorldMatrix.getRotationMatrix()));
			newCamLocalRotQ.normalize();

			BABYLON.Animation.CreateAndStartAnimation("AvatarRootPosAnim",
				this.avatarRootMesh,
				"position", 60, this.framesToCompensate,
				this.avatarRootMesh.position,
				newAvatarLocalPos, 0);
			
			BABYLON.Animation.CreateAndStartAnimation("AvatarNeckRotAnim",
				this.avatarFullBoneNodes["Neck"],
				"rotationQuaternion", 60, this.framesToCompensate,
				this.avatarFullBoneNodes["Neck"].rotationQuaternion,
				newCamLocalRotQ,
				0);

			
			var leftHandParentInvertWorldMatrix = (this.avatarFullBoneNodes["LeftHand"].parent as BABYLON.TransformNode).computeWorldMatrix(true).clone();
			leftHandParentInvertWorldMatrix = leftHandParentInvertWorldMatrix.invert();
			const newLeftControllerPos = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(this.schema.leftHandPos.x, this.schema.leftHandPos.y, this.schema.leftHandPos.z), leftHandParentInvertWorldMatrix);

			const leftControllerRotQ = new BABYLON.Quaternion(this.schema.leftHandRot.x, -this.schema.leftHandRot.y, -this.schema.leftHandRot.z, this.schema.leftHandRot.w);
			let newLeftControllerRotQ = leftControllerRotQ.multiply(BABYLON.Quaternion.FromRotationMatrix(leftHandParentInvertWorldMatrix));
			newLeftControllerRotQ.normalize();
			
			BABYLON.Animation.CreateAndStartAnimation("AvatarLeftHandPosAnim",
				this.avatarFullBoneNodes["LeftHand"],
				"position", 60, this.framesToCompensate,
				this.avatarFullBoneNodes["LeftHand"].position,
				newLeftControllerPos, 0);
			
			
			
			BABYLON.Animation.CreateAndStartAnimation("AvatarLeftHandRotAnim",
				this.avatarFullBoneNodes["LeftHand"],
				"rotationQuaternion", 60, this.framesToCompensate,
				this.avatarFullBoneNodes["LeftHand"].rotationQuaternion,
				newLeftControllerRotQ,
				0);

			var rightControllerParentInvertWorldMatrix = (this.avatarFullBoneNodes["RightHand"].parent as BABYLON.TransformNode).computeWorldMatrix(true).clone();
			rightControllerParentInvertWorldMatrix = rightControllerParentInvertWorldMatrix.invert();
			const newRightControllerPos = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(this.schema.rightHandPos.x, this.schema.rightHandPos.y, this.schema.rightHandPos.z), rightControllerParentInvertWorldMatrix);

			const rightControllerRotQ = new BABYLON.Quaternion(this.schema.rightHandRot.x, -this.schema.rightHandRot.y, -this.schema.rightHandRot.z, this.schema.rightHandRot.w);
			let newRightControllerRotQ = rightControllerRotQ.multiply(BABYLON.Quaternion.FromRotationMatrix(rightControllerParentInvertWorldMatrix));
			newRightControllerRotQ.normalize();
			
			BABYLON.Animation.CreateAndStartAnimation("AvatarRightHandPosAnim",
				this.avatarFullBoneNodes["RightHand"],
				"position", 60, this.framesToCompensate,
				this.avatarFullBoneNodes["RightHand"].position,
				newRightControllerPos, 0);

			BABYLON.Animation.CreateAndStartAnimation("AvatarrightHandRotAnim",
				this.avatarFullBoneNodes["RightHand"],
				"rotationQuaternion", 60, this.framesToCompensate,
				this.avatarFullBoneNodes["RightHand"].rotationQuaternion,
				newRightControllerRotQ,
				0);



		} else if (this.schema.platform == 1) {
			const newCamGlobalPos = new BABYLON.Vector3(this.schema.pos.x, this.schema.pos.y, this.schema.pos.z);
			let envRootWorldMatrix = MultiuserManager.getInstance().envRoot.computeWorldMatrix(true).clone();
			envRootWorldMatrix = envRootWorldMatrix.invert();
			let newCamLocalPos = BABYLON.Vector3.TransformCoordinates(newCamGlobalPos, envRootWorldMatrix);
			const newAvatarLocalPos = newCamLocalPos.subtract(this.rootToEyeOffset)

			const newCamGlobalRotQ = new BABYLON.Quaternion(this.schema.rot.x, this.schema.rot.y, this.schema.rot.z, this.schema.rot.w);
			let newCamLocalRotQ = newCamGlobalRotQ.multiply(BABYLON.Quaternion.FromRotationMatrix(envRootWorldMatrix.getRotationMatrix()));
			newCamLocalRotQ.normalize();

			BABYLON.Animation.CreateAndStartAnimation("AvatarRootPosAnim",
				this.avatarRootMesh,
				"position", 60, this.framesToCompensate,
				this.avatarRootMesh.position,
				newAvatarLocalPos, 0);
			
			BABYLON.Animation.CreateAndStartAnimation("AvatarNeckRotAnim",
				this.avatarFullBoneNodes["Neck"],
				"rotationQuaternion", 60, this.framesToCompensate,
				this.avatarFullBoneNodes["Neck"].rotationQuaternion,
				newCamLocalRotQ,
				0);


			var leftHandParentInvertWorldMatrix = (this.avatarFullBoneNodes["LeftHand"].parent as BABYLON.TransformNode).computeWorldMatrix(true).clone();
			leftHandParentInvertWorldMatrix = leftHandParentInvertWorldMatrix.invert();
			const newLeftControllerPos = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(this.schema.leftHandPos.x, this.schema.leftHandPos.y, this.schema.leftHandPos.z), leftHandParentInvertWorldMatrix);

			const leftControllerRotQ = new BABYLON.Quaternion(this.schema.leftHandRot.x, -this.schema.leftHandRot.y, -this.schema.leftHandRot.z, this.schema.leftHandRot.w);
			let newLeftControllerRotQ = leftControllerRotQ.multiply(BABYLON.Quaternion.FromRotationMatrix(leftHandParentInvertWorldMatrix));
			newLeftControllerRotQ.normalize();
			newLeftControllerRotQ = newLeftControllerRotQ.multiply(BABYLON.Quaternion.FromEulerVector(new BABYLON.Vector3(0, -Math.PI / 2, -Math.PI / 2)))

			BABYLON.Animation.CreateAndStartAnimation("AvatarLeftHandPosAnim",
				this.avatarFullBoneNodes["LeftHand"],
				"position", 60, this.framesToCompensate,
				this.avatarFullBoneNodes["LeftHand"].position,
				newLeftControllerPos, 0);
			
			BABYLON.Animation.CreateAndStartAnimation("AvatarLeftHandRotAnim",
				this.avatarFullBoneNodes["LeftHand"],
				"rotationQuaternion", 60, this.framesToCompensate,
				this.avatarFullBoneNodes["LeftHand"].rotationQuaternion,
				newLeftControllerRotQ,
				0);

			var rightControllerParentInvertWorldMatrix = (this.avatarFullBoneNodes["RightHand"].parent as BABYLON.TransformNode).computeWorldMatrix(true).clone();
			rightControllerParentInvertWorldMatrix = rightControllerParentInvertWorldMatrix.invert();
			const newRightControllerPos = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(this.schema.rightHandPos.x, this.schema.rightHandPos.y, this.schema.rightHandPos.z), rightControllerParentInvertWorldMatrix);

			const rightControllerRotQ = new BABYLON.Quaternion(this.schema.rightHandRot.x, -this.schema.rightHandRot.y, -this.schema.rightHandRot.z, this.schema.rightHandRot.w);
			let newRightControllerRotQ = rightControllerRotQ.multiply(BABYLON.Quaternion.FromRotationMatrix(rightControllerParentInvertWorldMatrix));
			newRightControllerRotQ.normalize();
			newRightControllerRotQ = newRightControllerRotQ.multiply(BABYLON.Quaternion.FromEulerVector(new BABYLON.Vector3(0, Math.PI / 2, Math.PI / 2)))

			BABYLON.Animation.CreateAndStartAnimation("AvatarRightHandPosAnim",
				this.avatarFullBoneNodes["RightHand"],
				"position", 60, this.framesToCompensate,
				this.avatarFullBoneNodes["RightHand"].position,
				newRightControllerPos, 0);

			BABYLON.Animation.CreateAndStartAnimation("AvatarrightHandRotAnim",
				this.avatarFullBoneNodes["RightHand"],
				"rotationQuaternion", 60, this.framesToCompensate,
				this.avatarFullBoneNodes["RightHand"].rotationQuaternion,
				newRightControllerRotQ,
				0);

		}

	}

    protected handleNetworkUpdates(deltaTime: number): void {
        this.updateAvatarFromSchema();
    }

    protected onSchemaUpdated(): void {
       if (this.schema.entityID == this.room.sessionId) {
            this.isLocal = true;
        } else {
            this.isLocal = false;    
        }
    }

    public dispose(): void {
        this.avatarRootMesh.dispose(false,true);
    }
    
}