import { createPlaneMarker } from "./objects/PlaneMarker";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { handleXRHitTest } from "./utils/hitTest";

import {
  AmbientLight,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  XRFrame,
  MeshLambertMaterial,
  Vector3,
  Color,
  Float32BufferAttribute,
  BoxGeometry,
  MeshBasicMaterial
} from "three";

import * as dat from 'dat.gui';

 import * as math from 'mathjs';

 import * as Parser from 'expr-eval';


import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
export function createScene(renderer: WebGLRenderer) {
  const scene = new Scene();
  console.log(":ASD")
  const camera = new PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.02,
    20,
  );

  let shadeMaterial: MeshLambertMaterial;
  let parameters: any;
  let gui_xMin, gui_xMax, gui_yMin, gui_yMax, gui_ZFuncText: any; 
  let xMin: -10;
  let xMax: 10;
  let xRange: any;
  let yRange: any;
  let yMax: 10;
  let yMin: -10;
  let zFun: any;
  let graphGeometry: any;
  let segments: 20;
  let zMin: 10, zMax: 20, zRange: any;
  let graphMesh: any;
  let x, y, target: any;
  let a : {xMax:10, xMin:-10, yMax:10, yMin:-10, zFuncText: String};
  let parser: any;

  /**
   * Add some simple ambient lights to illuminate the model.
   */
  const ambientLight = new AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);
  let gui = new dat.GUI();
  init();
  createGraph();
  // const stats = Stats;
  // console.log(stats);
  
  /**
   * Load the gLTF model and assign result to variable.
   */
  const gltfLoader = new GLTFLoader();

  let koalaModel: Object3D;

  gltfLoader.load("../assets/models/koala.glb", (gltf: GLTF) => {
    koalaModel = gltf.scene.children[0];
  });

 

  /**
   * Create the plane marker to show on tracked surfaces.
   */
  const planeMarker: Mesh = createPlaneMarker();
  scene.add(planeMarker);
  
  /**
   * Setup the controller to get input from the XR space.
   */
  const controller = renderer.xr.getController(0);
  scene.add(controller);

  controller.addEventListener("select", onSelect);

  /**
   * The onSelect function is called whenever we tap the screen
   * in XR mode.
   */
  function onSelect() {
    if (planeMarker.visible) {
      //const model = koalaModel.clone();
      
      // const geometry = new BoxGeometry( 1, 1, 1 );
      // const material = new MeshBasicMaterial( {color: 0x00ff00} );
      // const cube = new Mesh( geometry, material );
      // cube.position.setFromMatrixPosition(planeMarker.matrix);
      // cube.rotation.y = Math.random() * (Math.PI * 2);
      // cube.visible = true;
      // scene.add( cube );
      // Place the model on the spot where the marker is showing.
      //model.position.setFromMatrixPosition(planeMarker.matrix);

      // Rotate the model randomly to give a bit of variation.
      //model.rotation.y = Math.random() * (Math.PI * 2);
      //model.visible = true;

      //scene.add(model);
    }
  }

  /**
   * Called whenever a new hit test result is ready.
   */
  function onHitTestResultReady(hitPoseTransformed: Float32Array) {
    if (hitPoseTransformed) {
      planeMarker.visible = true;
      planeMarker.matrix.fromArray(hitPoseTransformed);
    }
  }

  /**
   * Called whenever the hit test is empty/unsuccesful.
   */
  function onHitTestResultEmpty() {
    planeMarker.visible = false;
  }

  

  function init(){
    a = {xMax:10, xMin:-10, yMax:10, yMin:-10, zFuncText: "sin(sqrt(a*x^2  + b*y^2))"}
    parameters = 
	{
		graphFunc: function() { createGraph(); },
	};

    console.log("hello")

    gui_xMin = gui.add( a, 'xMin' ).name('x Minimum = ');
    gui_xMax = gui.add( a, 'xMax' ).name('x Minimum = ');
    gui_yMin = gui.add( a, 'yMax' ).name('y Manimum = ');
    gui_yMax = gui.add( a, 'yMin' ).name('y Manimum = ');
    gui_ZFuncText = gui.add( a, 'zFuncText' ).name('Function= ');
    gui.add( parameters, 'graphFunc' ).name("Graph Function");
    gui_ZFuncText.setValue("sin(sqrt(a*x^2  + b*y^2))");
    parser = new Parser.Parser();
  
 
  }

function createGraph()
{
	xRange = a.xMax -a.xMin;
	yRange = a.yMax - a.yMin;
 // xMin = -10;
 // yMax = 10;
  //yMin = -10;
  //console.log("RANGE",xRange,a);
	//zFunc = Parser.parse(zFuncText).toJSFunction( ['x','y'] );
	let meshFunction = function(x1:any, y1:any, target:any) 
	{
    console.log(a);

		x = xRange * x1 + a.xMin;
		y = yRange * y1 + a.yMin;
  
		//var z = Parser.parse(a.zFuncText).toJSFunction( ['x','y'] ); 
    var f= parser.parse('sin(x) + y').toJSFunction("x,y");
    var z = f(x,y);
    console.log("Z",z);
		if ( isNaN(z) )
			return target.set(0,0,0); // TODO: better fix
		else
			return target.set(x,y,z);
	};
	
	// true => sensible image tile repeat...
	graphGeometry = new ParametricGeometry( meshFunction, segments, segments );
	
	///////////////////////////////////////////////
	// calculate vertex colors based on Z values //
	///////////////////////////////////////////////
	graphGeometry.computeBoundingBox();
  
	zMin = graphGeometry.boundingBox.min.z;
	zMax = graphGeometry.boundingBox.max.z;
  //console.log("Z",zMax);
	zRange = zMax - zMin;
	var color, point, face, numberOfSides, vertexIndex;
	// faces are indexed using characters

	const positionAttribute = graphGeometry.getAttribute('position');
	const colorAttr = graphGeometry.attributes.color;
	const vertexG=  new Vector3();
	let colors = [];
	//console.log(graphGeometry.attributes.position.count);
	for ( var i = 0; i < positionAttribute.count; i++ ) 
	{
		vertexG.fromBufferAttribute(positionAttribute,i);
		// colorAttr.setXYZ(i, 1,0,0);
		//console.log(vertexG);
		// point = graphGeometry.vertices[ i ];
		color = new Color( 0xff00ff );
		color.setHSL( 0.7 * (zMax - vertexG.z) / zRange, 1, 0.5 );
		colors.push(color.r, color.g, color.b);

	}
	graphGeometry.setAttribute('color', new Float32BufferAttribute( colors, 3 ));

	///////////////////////
	// end vertex colors //
	///////////////////////
	
	// material choices: vertexColorMaterial, wireMaterial , normMaterial , shadeMaterial
	
	// if (graphMesh) 
	// {
	// 	scene.remove( graphMesh );
	// 	// renderer.deallocateObject( graphMesh );
	// }
  shadeMaterial = new MeshLambertMaterial( { vertexColors: true } );
	graphMesh = new Mesh( graphGeometry, shadeMaterial );
	graphMesh.doubleSided = true;
  graphMesh.position.setFromMatrixPosition(planeMarker.matrix);
  graphMesh.visible = true;
  graphMesh.scale.set(0.01,0.01,0.01);
	scene.add(graphMesh);
  console.log(graphMesh);
}


  

  /**
   * The main render loop.
   *
   * This is where we perform hit-tests and update the scene
   * whenever anything changes.
   */
  const renderLoop = (timestamp: any, frame?: XRFrame) => {
    if (renderer.xr.isPresenting) {
      if (frame) {
        handleXRHitTest(
          renderer,
          frame,
          onHitTestResultReady,
          onHitTestResultEmpty,
        );
      }

      renderer.render(scene, camera);
    }
  };

  renderer.setAnimationLoop(renderLoop);
}
