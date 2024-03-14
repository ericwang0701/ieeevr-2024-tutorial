import * as BABYLON from '@babylonjs/core'
import "@babylonjs/inspector";
import { anuVis } from './anuVis';
import { MultiuserManager } from './MultiuserManager';
import { anuMultiuserVis } from './anuMultiuserVis';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

var camera = new BABYLON.UniversalCamera("mainCamera", new BABYLON.Vector3(0, 0.7, 0), scene);
camera.fov = 90 * Math.PI / 180;
camera.minZ = 0.1;
camera.speed = 0.05;

const ambientLight1 = new BABYLON.HemisphericLight("light-01", new BABYLON.Vector3(5, 5, 5), scene);
ambientLight1.intensity = 0.8;
const ambientLight2 = new BABYLON.HemisphericLight("light-02", new BABYLON.Vector3(-5, 5, -5), scene);
ambientLight2.intensity = 0.8;

camera.attachControl(true);

scene.createDefaultEnvironment();
anuVis(scene);

// let babylonManager = new MultiuserManager(scene, engine);
// await babylonManager.start();
// anuMultiuserVis(scene);



engine.runRenderLoop(() => {
    scene.render();
});


window.addEventListener('resize', () => {
    engine.resize();
});

window.addEventListener("keydown", async (ev) => {
    // Shift+Ctrl+Alt+I
    if (ev.key === "l") {
        if (scene.debugLayer.isVisible()) {
            scene.debugLayer.hide();
        } else {
            scene.debugLayer.show();
        }
    }

})
