import * as anu from '@jpmorganchase/anu' 
import iris from './data/iris.json' assert {type: 'json'}; 
import {Vector3, ActionManager, InterpolateValueAction} from '@babylonjs/core'; 
import {extent, scaleOrdinal, scaleLinear, map,} from "d3";

export const anuVis = function(scene){

  /*
  Step 1: Create scale functions for our visualization using d3.
  scaleLinear().domain([data_min, data_max]).range([space_min, space_max]).nice() 
  or
  scaleOrdinal() for categorical data
  scaleBand() for categorical data with spans and gaps (bar charts)
  and more https://d3js.org/d3-scale

  d3.extent returns [min, max] from a data array use d3.map to return a value from our json like
  extent(map(data, (d) => {return d.my_data_column}))
  */
  

  /*
  Step 2: create a root node for our visualization

  either create a mesh (anu.create()) and select it (anu.selectName()) or use anu.bind to return a selection
  */
  


  /*
  Step 3: call bind() from our root node to create spheres for each line in our data

  then use our scales to position and color the mesh
  */

  /*
  Step 4: Use anu.createAxes() to add and axis to our chart using our scales
  */


  /*
  Step 5: Add some interactions using actions and anu facet position UI
  */

  
    return scene;
    
};