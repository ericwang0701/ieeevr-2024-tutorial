import * as BABYLON from '@babylonjs/core'
import {Color3} from "@babylonjs/core";

export const unitSeparator = '\x1F';

export interface IVector3 {
    x: number;
    y: number;
    z: number;
}

export interface IQuaternion {
    x: number;
    y: number;
    z: number;
    w: number;

}

export const AvatarBaseBoneList: string[] = [
    "Hips", "Spine",
    "Neck", "Head", "RightHand", "LeftHand"
];

export const AvatarFingerBoneList: string[] = [
    "RightHandIndex1", "RightHandIndex2", "RightHandIndex3",
    "RightHandMiddle1", "RightHandMiddle2", "RightHandMiddle3",
    "RightHandPinky1", "RightHandPinky2", "RightHandPinky3",
    "RightHandRing1", "RightHandRing2", "RightHandRing3",
    "RightHandThumb1", "RightHandThumb2", "RightHandThumb3",
    "LeftHandIndex1", "LeftHandIndex2", "LeftHandIndex3",
    "LeftHandMiddle1", "LeftHandMiddle2", "LeftHandMiddle3",
    "LeftHandPinky1", "LeftHandPinky2", "LeftHandPinky3",
    "LeftHandRing1", "LeftHandRing2", "LeftHandRing3",
    "LeftHandThumb1", "LeftHandThumb2", "LeftHandThumb3"
];

export const AvatarFullBoneList: string[] = [
    "Hips", "Spine",
    "Neck", "Head", "RightHand", "LeftHand",
    "RightHandIndex1", "RightHandIndex2", "RightHandIndex3",
    "RightHandMiddle1", "RightHandMiddle2", "RightHandMiddle3",
    "RightHandPinky1", "RightHandPinky2", "RightHandPinky3",
    "RightHandRing1", "RightHandRing2", "RightHandRing3",
    "RightHandThumb1", "RightHandThumb2", "RightHandThumb3",
    "LeftHandIndex1", "LeftHandIndex2", "LeftHandIndex3",
    "LeftHandMiddle1", "LeftHandMiddle2", "LeftHandMiddle3",
    "LeftHandPinky1", "LeftHandPinky2", "LeftHandPinky3",
    "LeftHandRing1", "LeftHandRing2", "LeftHandRing3",
    "LeftHandThumb1", "LeftHandThumb2", "LeftHandThumb3"
];

export const PosCopyBoneNameList: string[] = [
    "Hips", "Spine", "Neck", "Head", "RightHand", "LeftHand",
];

export interface IPose {
    position: BABYLON.Vector3
    rotation: BABYLON.Vector3
    scaling: BABYLON.Vector3
}

export interface IAvatarHBPose {
    "Hips": IPose,
    "Spine": IPose,
    "Neck": IPose,
    "Head": IPose,
    "RightHand": IPose,
    "LeftHand": IPose
}

export const getRandomRPMUserProfile = () => {

    const totalRandomNames = 24;
    const index = Math.floor(Math.random() * totalRandomNames) + 1;
    let userProfile = {
        avatarID: index,
        fullName: "user-" + index,
        platform: "desktop"
    };

    return userProfile;

}

export function isMobileDevice(): any {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export const downloadGLTFModel = async (url: string, fileName: string): Promise<File> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: blob.type });

        return file;
    } catch (error) {
        console.error('Error downloading GLTF model:', error);
        throw error;
    }
}

export const CustomColors = {
    purple: Color3.FromHexString("#8854d0"),
    blue: Color3.FromHexString("#3867d6"),
    teal: Color3.FromHexString("#2d98da"),
    cyan: Color3.FromHexString("#0fb9b1"),
  
    green: Color3.FromHexString("#20bf6b"),
    yellow: Color3.FromHexString("#f7b731"),
    orange:Color3.FromHexString("#fa8231"),
    red: Color3.FromHexString("#eb3b5a"),
  
    dark1: Color3.FromHexString("#2a323e"),
    dark2: Color3.FromHexString("#3e4a5d"),
    dark3: Color3.FromHexString("#49576c"),
    dark4: Color3.FromHexString("#53637b"),
  
    light1: Color3.FromHexString("#a5b1c2"),
    light2: Color3.FromHexString("#b4becc"),
    light3: Color3.FromHexString("#c3cbd7"),
    light4: Color3.FromHexString("#d3d9e1"),

    slate8: Color3.FromHexString("#1e293b"),
    slate7: Color3.FromHexString("#334155"),
    slate6: Color3.FromHexString("#475569"),
    slate5: Color3.FromHexString("#64748b"),
    slate4: Color3.FromHexString("#94a3b8"),
    slate3: Color3.FromHexString("#cbd5e1"),
    slate2: Color3.FromHexString("#e2e8f0"),
    slate1: Color3.FromHexString("#f1f5f9"),
  };


export class AvatarBoneHelper {
    private static readonly ARMATURE_HIPS_LEFT_UP_LEG_BONE_NAME = "LeftUpLeg";
    private static readonly HALF_BODY_LEFT_EYE_BONE_NAME = "LeftEye";
    private static readonly FULL_BODY_LEFT_EYE_BONE_NAME = "LeftEye";
    private static readonly HALF_BODY_RIGHT_EYE_BONE_NAME = "RightEye";
    private static readonly FULL_BODY_RIGHT_EYE_BONE_NAME = "RightEye";

    public static isFullBodySkeleton(avatarRoot: BABYLON.TransformNode): boolean {
        return !!avatarRoot.getChildTransformNodes(false).find(node => node.name === this.ARMATURE_HIPS_LEFT_UP_LEG_BONE_NAME);
    }

    public static getLeftEyeBone(avatarRoot: BABYLON.TransformNode, isFullBody: boolean): BABYLON.TransformNode | null {
        const boneName = isFullBody ? this.FULL_BODY_LEFT_EYE_BONE_NAME : this.HALF_BODY_LEFT_EYE_BONE_NAME;
        return avatarRoot.getChildTransformNodes(false).find(node => node.name === boneName) || null;
    }

    public static getRightEyeBone(avatarRoot: BABYLON.TransformNode, isFullBody: boolean): BABYLON.TransformNode | null {
        const boneName = isFullBody ? this.FULL_BODY_RIGHT_EYE_BONE_NAME : this.HALF_BODY_RIGHT_EYE_BONE_NAME;
        return avatarRoot.getChildTransformNodes(false).find(node => node.name === boneName) || null;
    }
}


