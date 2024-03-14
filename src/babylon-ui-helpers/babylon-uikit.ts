import { Color3, MeshBuilder, SixDofDragBehavior, Vector3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Checkbox, Control, Rectangle, Slider, TextBlock } from "@babylonjs/gui";

export const CustomColors = {
  purple: Color3.FromHexString("#8854d0"),
  blue: Color3.FromHexString("#3867d6"),
  teal: Color3.FromHexString("#2d98da"),
  cyan: Color3.FromHexString("#0fb9b1"),

  green: Color3.FromHexString("#20bf6b"),
  yellow: Color3.FromHexString("#f7b731"),
  orange: Color3.FromHexString("#fa8231"),
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

// A styled 2D GUI card with a plane and ADT
export const createCard = (width, height, scene) => {
  const plane = MeshBuilder.CreatePlane("lab-card-rect-mesh", { width: width, height: height }, scene);

  const advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane, 1024 * (width / 10), 1024 * (height / 10));
  advancedTexture.name = "lab-card-rect-texture";

  const rect = new Rectangle("rect");
  rect.cornerRadius = 48;
  rect.background = CustomColors.slate2.toHexString();
  rect.alpha = 0.9;
  rect.color = CustomColors.slate8.toHexString();
  rect.thickness = 2;
  rect.zIndex = -10;
  advancedTexture.addControl(rect);

  return {
    plane,
    advancedTexture
  };
};

// A styped button for 2D GUI
export const createButton = (name, label) => {
  const button = Button.CreateSimpleButton(name, label);
  button.width = 0.2;
  button.height = "50px";
  button.fontSize = "24px";
  button.color = CustomColors.slate8.toHexString();
  button.cornerRadius = 20;
  button.background = CustomColors.slate2.toHexString();
  button.thickness = 2;

  return button;
};

export const createWindowGroup = (scene) => {

  const { plane: windowGroupMesh, advancedTexture: windowGroupTexture } = createCard(2, 0.8, scene);
  windowGroupMesh.name = "window-group-mesh";
  windowGroupMesh.position = new Vector3(0, 0.5, -0.05);
  windowGroupMesh.scaling = new Vector3(0.2, 0.2, 0.2);
  windowGroupTexture.name = "window-group-texture";
  const windowGroupRect = windowGroupTexture.getControlByName("rect");
  if (windowGroupRect) {
    windowGroupRect.alpha = 0;
  }

  // Add a grab behavior to the toolbar plane
  const windowGroupDragBehavior = new SixDofDragBehavior();
  windowGroupDragBehavior.allowMultiPointer = true;
  windowGroupMesh.addBehavior(windowGroupDragBehavior);
  windowGroupDragBehavior.draggableMeshes = [windowGroupMesh];

  const windowGroupDragIndicator = new Rectangle("window-group-drag-indicator");
  windowGroupDragIndicator.width = "200px";
  windowGroupDragIndicator.height = "20px";
  windowGroupDragIndicator.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  windowGroupDragIndicator.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  windowGroupDragIndicator.thickness = 0;
  windowGroupDragIndicator.background = CustomColors.slate7.toHexString();
  windowGroupDragIndicator.cornerRadius = 20;
  windowGroupDragIndicator.top = -30;
  windowGroupTexture.addControl(windowGroupDragIndicator);

  return windowGroupMesh;
};

export const createGridMenuLabel = (text) => {
  const label = new TextBlock();
  label.text = text;
  label.height = "60px";
  label.fontSize = "40px";
  label.color = CustomColors.slate8.toHexString();
  label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  return label;
};

export const createGridMenuSlider = (options) => {
  const { min, max, step, value } = options;
  const slider = new Slider();
  slider.minimum = min;
  slider.maximum = max;
  slider.step = step;
  slider.value = value;
  slider.height = "60px";
  slider.width = "100%";
  slider.color = CustomColors.blue.toHexString();
  slider.background = CustomColors.slate4.toHexString();
  slider.thumbWidth = "60px";
  slider.isThumbCircle = true;
  slider.isThumbClamped = true;

  return slider;
};

export const createGridMenuCheckbox = () => {
  const checkbox = new Checkbox();
  checkbox.isChecked = true;
  checkbox.height = "60px";
  checkbox.width = "70px";
  checkbox.color = CustomColors.blue.toHexString();
  checkbox.background = CustomColors.slate4.toHexString();
  checkbox.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  return checkbox;
};