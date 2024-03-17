import * as anu from '@jpmorganchase/anu'
import iris from './data/iris.json'; //Our data
import { extent, scaleOrdinal, scaleLinear, map, } from "d3";
import { ActionManager, ExecuteCodeAction, Vector3 } from '@babylonjs/core';
import { MultiuserManager } from './MultiuserManager';
import { claimOwnership } from './network/collabxr-decorator';
import { releaseOwnership } from './network/collabxr-decorator';

export const anuMultiuserVis = function (_scene) {
  const scene = _scene
  var scaleX = scaleLinear().domain(extent(map(iris, (d) => { return d.sepalLength }))).range([-1, 1]).nice();
  var scaleY = scaleLinear().domain(extent(map(iris, (d) => { return d.petalLength }))).range([-1, 1]).nice();
  var scaleZ = scaleLinear().domain(extent(map(iris, (d) => { return d.sepalWidth }))).range([-1, 1]).nice();

  var scaleC = scaleOrdinal(anu.ordinalChromatic('d310').toStandardMaterial())

  let CoT = anu.create("cot", "center", {}, {});

  let chart = anu.selectName('center', scene);

  let dataPoints = chart.bind('sphere', { diameter: 0.05 }, iris);

  const hoverDataPointHandler = (message: any) => {
 
    const selectedMesh = dataPoints.filter((d, n, i) => {
      return (n.id == message.dataPointID)
    }).selected[0];
  
    const scaleVec = new Vector3(message.scaleVec.x, message.scaleVec.y, message.scaleVec.z); 
    selectedMesh.scaling = scaleVec;
  
  }

  MultiuserManager.getInstance().hoverEventHandler = hoverDataPointHandler;

  dataPoints
    .positionX((d) => scaleX(d.sepalLength))
    .positionY((d) => scaleY(d.petalLength))
    .positionZ((d) => scaleZ(d.sepalWidth))
    .material((d, m, i) => scaleC(d.species))
    .action((d, n, i) => new ExecuteCodeAction(
      ActionManager.OnPointerOverTrigger,
          () => {
            console.log("index: " + i + " , " + JSON.stringify(d));
            MultiuserManager.getInstance().hoverEventObj = {"dataPointID" : n.id, "scaleVec" : {x:1.5,y:1.5,z:1.5}};
          }
    ))
    .action((d, n, i) => new ExecuteCodeAction(
      ActionManager.OnPointerOutTrigger,
          () => {
            console.log("index: " + i + " , " + JSON.stringify(d));
            MultiuserManager.getInstance().hoverEventObj = { "dataPointID": n.id, "scaleVec": { x: 1.0, y: 1.0, z: 1.0 } };

          }
    ))
    .prop("id", (d, n, i)=>{
      return CoT.name + "-"+i;
    })

  anu.createAxes('test', scene, { parent: chart, scale: { x: scaleX, y: scaleY, z: scaleZ } });

  chart.positionUI({billboard: false})
    .scaleUI({ minimum: 0.5, maximum: 2 })
    .rotateUI({billboard: false});

  MultiuserManager.getInstance().plotCoT = CoT;
  MultiuserManager.getInstance().plotCoT.position = new Vector3(0, 2, 1.5);

  anu.selectName("centerPositionUI", scene).action(new ExecuteCodeAction(
    ActionManager.OnPickDownTrigger,
    () => {
      console.log("centerPositionUI OnPickDownTrigger")
      claimOwnership(MultiuserManager.getInstance().lobbyRoom, "plotCoT");
    }
  )).action(new ExecuteCodeAction(
    ActionManager.OnPickOutTrigger,
    () => {
      console.log("centerPositionUI OnPickOutTrigger")
      releaseOwnership(MultiuserManager.getInstance().lobbyRoom, "plotCoT");
    }
  )).action(new ExecuteCodeAction(
    ActionManager.OnPickUpTrigger,
      () => {
        console.log("centerPositionUI OnPickUpTrigger")
        releaseOwnership(MultiuserManager.getInstance().lobbyRoom, "plotCoT");
      }
    ))

  return { CoT, dataPoints };

};