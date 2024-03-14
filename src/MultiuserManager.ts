import * as BABYLON from '@babylonjs/core'
import "@babylonjs/loaders/glTF";
import "@babylonjs/core/Helpers/sceneHelpers";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/inspector";
import * as Colyseus from "colyseus.js";
import { AvatarHB } from "./avatar/AvatarHBNetworkedEntity";
import {IPose} from "./utils";
import { initXRInteraction } from "./xr-interaction";
import { PlayerSchema } from "./schema/PlayerSchema";
import { NetworkUpdateHandler, broadcastEvent, syncFields } from "./network/collabxr-decorator";
import { createDefaultGridEnv } from './babylon-ui-helpers/demo-scene';

export class MultiuserManager {
  static instance: MultiuserManager;

  public engine: BABYLON.Engine;
  public scene: BABYLON.Scene;
  public canvas: HTMLCanvasElement;

  private serverEndpoint: string;
  private colyseus: Colyseus.Client;
  private lobbyRoomName = "anu-tutorial"; //need to match the server side setting

  @NetworkUpdateHandler()
  public lobbyRoom: Colyseus.Room<any>;

  @syncFields(["position", "rotationQuaternion"])
  public plotCoT: BABYLON.TransformNode

  @broadcastEvent("hoverEventHandler")
  public hoverEventObj:any;
  public hoverEventHandler:any;

  public playerEntities: { [playerId: string]: AvatarHB } = {};
  private userAvatarHB: AvatarHB;

  public envRoot: BABYLON.TransformNode;
  public teleportGroudMesh: BABYLON.Mesh[];

  public inWebXR: boolean;
  public leftController:BABYLON.AbstractMesh;
  public rightController:BABYLON.AbstractMesh;

  private nonXRCaemeraUpdateObserver: BABYLON.Observer<BABYLON.Scene>

  public constructor(_scene:BABYLON.Scene, _engine:BABYLON.Engine) {

    //For getting class member reference in decorator 
    Object.getPrototypeOf(this).instanceReference = this;

    this.engine = _engine;

    this.engine.displayLoadingUI();

    this.scene = _scene;

    MultiuserManager.instance = this;

    if (window.location.origin.includes("localhost")) {
      this.serverEndpoint = "ws://localhost:2567";
    }
    else {
      //add your remote serverEndpoint
    }

    this.colyseus = new Colyseus.Client(this.serverEndpoint);

    this.init();
    
    this.leftController = null;
    this.rightController = null;

  }

  public static getInstance(): MultiuserManager {
    if (!MultiuserManager.instance) {
      console.log("init BabylonManager with correct canvas element first");
    }
    return MultiuserManager.instance;
  }

  private init = () => {
    for (let playerId in this.playerEntities) {
      this.playerEntities[playerId].dispose();
      delete this.playerEntities[playerId];
    }

    this.playerEntities = {};

    this.inWebXR = false;
    
  }

  private initPlayersInRoom = async (room: Colyseus.Room<any>) => {
    room.state.players.onAdd(async (player:PlayerSchema, sessionId) => {

      const isLocal = (sessionId === room.sessionId);
      console.log("new user joined: " + sessionId + "isLocal: " + isLocal);

      if (!isLocal) {
        let avatarInitPose: IPose = {
          position: new BABYLON.Vector3(player.pos.x, player.pos.y, player.pos.z),
          rotation: new BABYLON.Quaternion(player.rot.x, player.rot.y, player.rot.z, player.rot.w).toEulerAngles(),
          scaling: new BABYLON.Vector3(1, 1, 1),
        }

        const initArgs = [
          player.entityID,
          avatarInitPose
        ]
        let newRemoteUserAvatar = await AvatarHB.create(room, this.scene, PlayerSchema, ...initArgs)  as AvatarHB;
        newRemoteUserAvatar.avatarRootMesh.parent = this.envRoot;
        newRemoteUserAvatar.updateLocalSchema(player); //trigger ownership check

        this.playerEntities[sessionId] = newRemoteUserAvatar;
      }

      player.pos.onChange(() => {
        if (!isLocal) {
          if (this.playerEntities[player.entityID]) {
            this.handlePlayerTransformUpdate(player);
          }
        }
      });

      player.rot.onChange(() => {
        if (!isLocal) {
          if (this.playerEntities[player.entityID]) {
            this.handlePlayerTransformUpdate(player);
          }
        }
      });

      player.leftHandPos.onChange(() => {
        if (!isLocal) {
          if (this.playerEntities[player.entityID]) {
            this.handlePlayerTransformUpdate(player);
          }
        }
      });

      player.leftHandRot.onChange(() => {
        if (!isLocal) {
          if (this.playerEntities[player.entityID]) {
            this.handlePlayerTransformUpdate(player);
          }
        }
      });

      player.rightHandPos.onChange(() => {
        if (!isLocal) {
          if (this.playerEntities[player.entityID]) {
            this.handlePlayerTransformUpdate(player);
          }
        }
      });

      player.rightHandRot.onChange(() => {
        if (!isLocal) {
          if (this.playerEntities[player.entityID]) {
            this.handlePlayerTransformUpdate(player);
          }
        }
      });

      player.listen("visMode", (curVal, prevVal) => {
        console.log(`visMode changed from ${prevVal} to ${curVal}` + JSON.stringify(player));
        this.playerEntities[player.entityID].updateLocalSchema({visMode: curVal});
        this.playerEntities[player.entityID].toggleAvatarVisibility(player.entityID, curVal);
      })

      player.listen("avatarAnim", (curVal, prevVal) => {
        console.log(`avatarAnim changed from ${prevVal} to ${curVal}` + JSON.stringify(player));
        this.playerEntities[player.entityID].updateLocalSchema({avatarAnim: curVal});
      })

      player.listen("facialAnim", (curVal, prevVal) => {
        console.log(`facialAnim changed from ${prevVal} to ${curVal}` + JSON.stringify(player));
        this.playerEntities[player.entityID].updateLocalSchema({facialAnim: curVal});
      })

      player.listen("handPose", (curVal, prevVal) => {
        console.log(`handPose changed from ${prevVal} to ${curVal}` + JSON.stringify(player));
        this.playerEntities[player.entityID].updateLocalSchema({handPose: curVal});
      })

      player.listen("audioAmplitude", (curVal, prevVal) => {
        console.log(`audioAmplitude changed from ${prevVal} to ${curVal}`);
        this.playerEntities[player.entityID].updateLocalSchema({audioAmplitude: curVal});
      })

      player.listen("platform", (curVal, prevVal) => {
        console.log(`platform changed from ${prevVal} to ${curVal}`);
        this.playerEntities[player.entityID].updateLocalSchema({platform: curVal});
      })

    });

    room.state.players.onRemove((player, playerId) => {
      if (this.playerEntities[playerId]) {
        this.playerEntities[playerId].dispose();
        delete this.playerEntities[playerId];
      }
    });

    room.onLeave(code => {
      //TODO
    })

    let avatarInitPose: IPose = {
      position: new BABYLON.Vector3(0, 0, 0),
      rotation: new BABYLON.Vector3(0, 0, 0),
      scaling: new BABYLON.Vector3(1, 1, 1),
    }

    const initArgs = [
      room.sessionId,
      avatarInitPose
    ]

    let newLocalUserAvatar = await AvatarHB.create(room, this.scene, PlayerSchema, ...initArgs)  as AvatarHB;
    this.playerEntities[room.sessionId] = newLocalUserAvatar;
    this.userAvatarHB = newLocalUserAvatar;
    this.userAvatarHB.avatarRootMesh.parent = this.envRoot;
    //local user only saw their hand. avoid visual occlusion from first person view
    for (let i = 0; i < this.userAvatarHB.avatarMeshes.length; i++) {
      if (this.userAvatarHB.avatarMeshes[i].name != "Wolf3D_Hands") {
        this.userAvatarHB.avatarMeshes[i].isVisible = false;
      }
    }
    this.userAvatarHB.toggleNameLabel(false);
  }

  private handlePlayerTransformUpdate(player:PlayerSchema) {
    this.playerEntities[player.entityID].updateLocalSchema(player);
  }

  private createDemoScene = () => {
    this.envRoot = new BABYLON.TransformNode("envRoot", this.scene);
    this.teleportGroudMesh = createDefaultGridEnv(this.scene);
  }

  private nonXRCaemeraUpdate = () =>{
     //modify nonXR universal camera control
     if (this.scene.activeCamera instanceof BABYLON.UniversalCamera) {
      this.scene.activeCamera.cameraRotation.x = 0;
      this.scene.activeCamera.position.y = 1.7; //disable flying

      const cameraWorldMatrix = this.scene.activeCamera.computeWorldMatrix();
      if(this.leftController == null){
        this.leftController = new BABYLON.AbstractMesh("leftController", this.scene);
      }

      if(this.rightController == null){
        this.rightController = new BABYLON.AbstractMesh("rightController", this.scene);
      }

      const leftControllerWorldPos = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(-0.25,-0.2,0.4), cameraWorldMatrix);
      this.leftController.position = leftControllerWorldPos;

      const rightControllerWorldPos = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0.25,-0.2,0.4), cameraWorldMatrix);
      this.rightController.position = rightControllerWorldPos;

      this.leftController.rotationQuaternion = this.scene.activeCamera.absoluteRotation.multiply(BABYLON.Quaternion.FromEulerVector(new BABYLON.Vector3(0, Math.PI / 2, Math.PI / 2)))
      this.rightController.rotationQuaternion = this.scene.activeCamera.absoluteRotation.multiply(BABYLON.Quaternion.FromEulerVector(new BABYLON.Vector3(0, -Math.PI / 2, -Math.PI / 2)))
    }
  }

  // Method to call when entering WebXR mode
  onEnterWebXR() {

    this.inWebXR = true;
    //reset leftController/rightController
    this.leftController = null;
    this.rightController = null;

    this.scene.onBeforeRenderObservable.remove(this.nonXRCaemeraUpdateObserver); 

  }

  start = async () => {

    this.lobbyRoom = await this.colyseus.joinOrCreate(this.lobbyRoomName);
    this.createDemoScene();

    this.scene.activeCamera.position = this.envRoot.position.clone();
    
    initXRInteraction(this.scene, this.teleportGroudMesh);


    await this.initPlayersInRoom(this.lobbyRoom);

    this.nonXRCaemeraUpdateObserver = this.scene.onBeforeRenderObservable.add(this.nonXRCaemeraUpdate);
    
    this.engine.hideLoadingUI();
  }
}