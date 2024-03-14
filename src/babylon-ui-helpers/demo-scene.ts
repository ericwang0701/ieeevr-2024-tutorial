import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { GridMaterial } from "@babylonjs/materials";
import { Color3, Mesh, Scene, MeshBuilder, Vector3, SixDofDragBehavior, HemisphericLight, UniversalCamera, Color4, StandardMaterial } from "@babylonjs/core";
import { Grid, TextBlock } from "@babylonjs/gui";
import { CustomColors, createCard, createGridMenuCheckbox, createGridMenuLabel, createGridMenuSlider, createWindowGroup } from "./babylon-uikit";


export const createDefaultGridEnv = (scene) => {
  let lightTheme = false;

  var camera = new UniversalCamera("mainCamera", new Vector3(0, 0.7, 0), scene);
  camera.fov = 90 * Math.PI / 180;
  camera.minZ = 0.1;
  camera.speed = 0.05;

  // This attaches the camera to the canvas
  camera.attachControl(true);

  // Add a ground plane to the scene. Used for WebXR teleportation
  const ground = MeshBuilder.CreateGround("ground", { height: 20, width: 20, subdivisions: 4 }, scene);
  // ground.position.y = 10;
  ground.overrideMaterialSideOrientation = Mesh.DOUBLESIDE;
  const groundMaterial = new GridMaterial("ground-mat", scene);
  groundMaterial.majorUnitFrequency = 5;
  groundMaterial.minorUnitVisibility = 0.1;
  groundMaterial.gridRatio = 1;
  groundMaterial.backFaceCulling = false;

  if (!lightTheme) {
    groundMaterial.mainColor = CustomColors.light1;
    groundMaterial.lineColor = new Color3(1.0, 1.0, 1.0);
  } else {
    groundMaterial.lineColor = CustomColors.slate8;
    groundMaterial.mainColor = CustomColors.slate7;
  }

  groundMaterial.opacity = 0.98;
  ground.material = groundMaterial;
  ground.checkCollisions = true;

  // Note: the rotation of these elements is set to put the face of the plane/ground facing the inside of the room so that collisions will work.
  const wall1 = MeshBuilder.CreateGround("wall1", { height: 10, width: 20, subdivisions: 4 }, scene);
  wall1.rotation = new Vector3(Math.PI / 2, Math.PI, Math.PI / 2);
  wall1.position = new Vector3(-10, 5, 0);
  wall1.material = groundMaterial;
  wall1.overrideMaterialSideOrientation = Mesh.DOUBLESIDE;
  wall1.checkCollisions = true;

  const wall2 = wall1.clone("wall2");
  wall2.rotation.z = -Math.PI / 2;
  wall2.position = new Vector3(10, 5, 0);

  console.log("wall rotation", wall1.rotation, wall2.rotation);
  const wall3 = wall1.clone("wall3");
  wall3.rotation = new Vector3(Math.PI / 2, Math.PI / 2, Math.PI / 2);
  wall3.position = new Vector3(0, 5, -10);

  const wall4 = wall3.clone("wall4");
  wall4.rotation.z = -Math.PI / 2;
  wall4.position = new Vector3(0, 5, 10);

  // Customize the scene lighting and background color
  const ambientLight1 = new HemisphericLight("light-01", new Vector3(5, 5, 5), scene);
  ambientLight1.intensity = 0.8;
  const ambientLight2 = new HemisphericLight("light-02", new Vector3(-5, 5, -5), scene);
  ambientLight2.intensity = 0.8;
  if (!lightTheme) {
    scene.clearColor = Color4.FromColor3(CustomColors.dark1, 1.0);
  } else {
    scene.clearColor = Color4.FromColor3(CustomColors.slate1, 1.0);
  }

  return [ground];
}

export const createDebugPanel = (scene) => {
  const { plane, advancedTexture } = createCard(25, 4, scene);
  plane.name = "debugPanel";
  plane.position = new Vector3(0, 2, 2);
  plane.scaling = new Vector3(0.15, 0.15, 0.15);
  advancedTexture.name = "card-texture";

  const titleText = new TextBlock("title-text");
  titleText.text = "Test";
  titleText.color = "black";
  titleText.fontSize = 30;
  advancedTexture.addControl(titleText);

  const sixDofDragBehavior = new SixDofDragBehavior();
  sixDofDragBehavior.allowMultiPointer = true;
  plane.addBehavior(sixDofDragBehavior);

  plane.actionManager = new BABYLON.ActionManager(scene);
  plane.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
    BABYLON.ActionManager.OnPickDownTrigger,
      () => {
        console.log("plane click")
      }
    )
  )

  return { plane, advancedTexture };
}

export const generateDataCard = (scene) => {
  const { plane, advancedTexture } = createCard(7.4, 4, scene);
  plane.name = "dataCard";
  plane.position = new Vector3(0, 2, 2);
  plane.scaling = new Vector3(0.15, 0.15, 0.15);
  advancedTexture.name = "card-texture";

  const titleText = new TextBlock("title-text");
  titleText.text = "Pick a data point";
  titleText.color = "black";
  titleText.fontSize = 30;
  advancedTexture.addControl(titleText);

  const sixDofDragBehavior = new SixDofDragBehavior();
  sixDofDragBehavior.allowMultiPointer = true;
  plane.addBehavior(sixDofDragBehavior);

  return { plane, advancedTexture };
};

export const createUICard = (scene) => {
  // Create a window group object
  const windowGroupMesh = createWindowGroup(scene);
  windowGroupMesh.scaling = new Vector3(0.1, 0.1, 0.1);
  windowGroupMesh.position = new Vector3(1, 0.7, 1.2);
  windowGroupMesh.rotation = new Vector3(0, 0.4, 0);

  const cardMaterial = new StandardMaterial("menu-card-material", scene);
  cardMaterial.diffuseColor = CustomColors.slate1;

  const { plane, advancedTexture } = createCard(9, 5.4, scene);
  advancedTexture.name = "menu-texture";

  plane.parent = windowGroupMesh;
  plane.position.y = 3;

  const grid = new Grid();
  grid.addColumnDefinition(40, true);
  grid.addColumnDefinition(0.5);
  grid.addColumnDefinition(0.5);
  grid.addColumnDefinition(40, true);

  // Layout the grid content
  // Add rows to the grid and attach controls to the rows, using the current row count.
  // This makes it easy to reorder these in code without having to reindex the grid content.
  grid.addRowDefinition(36, true); // empty row

  // grid.addRowDefinition(72, true).addControl(minPedtalLengthLabel, grid.rowCount, 1).addControl(minPedtalLengthSlider, grid.rowCount, 2);
  // grid.addRowDefinition(72, true).addControl(maxPedtalLengthLabel, grid.rowCount, 1).addControl(maxPedtalLengthSlider, grid.rowCount, 2);
  // grid.addRowDefinition(72, true).addControl(showSpeciesLabel, grid.rowCount, 1).addControl(showSpeciesToggle, grid.rowCount, 2);
  //grid.addRowDefinition(36, true); // empty row

  advancedTexture.addControl(grid);

  return grid;
};

// Function to create a slider
export function createSlider(grid, label, min, max, step, initialValue) {
  const sliderLabel = createGridMenuLabel(`${label}: ${initialValue}`);
  const slider = createGridMenuSlider({
      min: min,
      max: max,
      step: step,
      value: initialValue
  });
  slider.onValueChangedObservable.add(function (value) {
      //onChange(value);
      sliderLabel.text = `${label}: ${value}`;
  });
  addControlToGrid(grid, sliderLabel, slider);
  return slider;
}

// Function to create a checkbox
export function createCheckbox(grid, label, initialValue) {
  const checkboxLabel = createGridMenuLabel(label);
  const checkbox = createGridMenuCheckbox();
  checkbox.isChecked = initialValue;
  //checkbox.onIsCheckedChangedObservable.add(onChange);
  addControlToGrid(grid, checkboxLabel, checkbox);
  return checkbox;
}

// Function to add controls to a grid
export function addControlToGrid(grid, labelControl, inputControl) {
  grid.addRowDefinition(72, true)
      .addControl(labelControl, grid.rowCount, 1)
      .addControl(inputControl, grid.rowCount, 2);
}