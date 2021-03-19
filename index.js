/* global VRFiles */

import * as THREE from './node_modules/three/build/three.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from './node_modules/three/examples/jsm/webxr/VRButton.js';
import { BoxLineGeometry } from './node_modules/three/examples/jsm/geometries/BoxLineGeometry.js';
import { XRControllerModelFactory } from './node_modules/three/examples/jsm/webxr/XRControllerModelFactory.js';

let scene, camera, renderer, controls;

/**
 * Generic Threejs VR scaffold
 */
function loop() {
  if(VRFiles.initialised) {
    VRFiles.loop();
  }
	controls.update();
	renderer.render( scene, camera );
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

async function initThree() {
  const WIDTH = window.innerWidth;
  const HEIGHT = window.innerHeight;

  // scene
  scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x505050 );

  // camera
  camera = new THREE.PerspectiveCamera( 60, WIDTH / HEIGHT, 0.1, 100 );

  // renderer
  renderer = new THREE.WebGLRenderer({
		antialias: true
	});
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( WIDTH, HEIGHT );
	renderer.xr.enabled = true;
  renderer.localClippingEnabled = true;
  document.body.appendChild( renderer.domElement );

  // VR button
  document.body.appendChild(VRButton.createButton(renderer));

  // controllers
  const controller1 = renderer.xr.getController( 0 );
  scene.add( controller1 );
  const controllerModelFactory = new XRControllerModelFactory();
  const controllerGrip1 = renderer.xr.getControllerGrip( 0 );
  controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
  scene.add( controllerGrip1 );
  // controller2 = renderer.xr.getController( 1 );
  // controller2.addEventListener( 'selectstart', onSelectStart );
  // controller2.addEventListener( 'selectend', onSelectEnd );
  // scene.add( controller2 );
  // const controllerGrip2 = renderer.xr.getControllerGrip( 1 );
  // controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
  // scene.add( controllerGrip2 );

  // lasers
  const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );
  const line = new THREE.Line( geometry );
  line.name = 'line';
  line.scale.z = 5;
  controller1.add( line.clone() );
  // controller2.add( line.clone() );
  
  // controls
	controls = new OrbitControls( camera, renderer.domElement );
	camera.position.set( 0, 1.6, 0 );
	controls.target = new THREE.Vector3( 0, 1, -1.8 );
	controls.update();

  // room
  const room = new THREE.LineSegments(
		new BoxLineGeometry( 6, 6, 6, 10, 10, 10 ).translate( 0, 3, 0 ),
		new THREE.LineBasicMaterial( { color: 0x808080 } )
	);
	scene.add( room );

  // start animation
	renderer.setAnimationLoop( loop );

  // handle resize events
  window.addEventListener('resize', onWindowResize );

  window.addEventListener('load', async function () {
    await VRFiles.setup(
      scene,
      controller1,
      (selectedFile) => {
        const {name, type} = selectedFile;
        VRFiles.socket.send(`open ${name}`);
        // if (type === "d") {
        //   VRFiles.socket.send(`open ${name}`);
        // } else {
        //   console.log(name);
        // }
      });
  });
}

VRFiles.initSocket();
initThree();
