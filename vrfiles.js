/* global ThreeMeshUI */

import * as THREE from './node_modules/three/build/three.module.js';

const VRFiles = {
  callback: null,
  controller: null,
  cropContainer: null,
  cropContainerWidth: 2.5,
  directoryContainer: null,
  fileIndex: 0,
  files: [],
  firstFile: 0,
  fontSize: 0.1,
  initialised: false,
  interLine: 0.05,
  knob: null,
  knobCaptured: false,
  knobOriginalPosition: null,
  knobSelected: false,
  margin: 0.1,
  maxfiles: 15,
  mouseOriginalPosition: new THREE.Vector3(),
  normal: new THREE.Vector3(),
  offset: 0.01,
  plane: new THREE.Plane(),
  point: new THREE.Vector3(),
  position: new THREE.Vector3(),
  raycaster: new THREE.Raycaster(),
  scene: null,
  scrollerContainer: null,
  tempMatrix: new THREE.Matrix4(),
  textContainer: null,
  textContainerWidth: 3,
  textureFile: null,
  textureFolder: null,
  
  selectFile: function (fileIndex) {
    for(const file of VRFiles.files) {
      file.container.backgroundColor.set("#9999ff");
    }

    if(typeof VRFiles.files[fileIndex] !== "undefined") {
      VRFiles.files[fileIndex].container.backgroundColor.set("white");
    }
  },

  setFiles: async function (files) {
    const directory = files[0].name;
    VRFiles.files = [
      {name: "..", type: "d"},
      ...files.slice(1)
    ];
  
    // configure directory
    VRFiles.directoryContainer.set( {content: ` ${directory}`} );

    // configure files inside cropContainer
    if (VRFiles.textContainer) {
      VRFiles.cropContainer.remove(VRFiles.textContainer);
      VRFiles.scrollerContainer.remove(VRFiles.knob);
      VRFiles.textContainer.clear();
      VRFiles.knob.clear();
    }

    VRFiles.textContainer = new ThreeMeshUI.Block({
      width: VRFiles.textContainerWidth,
      height: VRFiles.files.length*(VRFiles.fontSize + VRFiles.interLine),
      backgroundOpacity: 0,
      offset: VRFiles.offset,
      contentDirection: 'column',
      alignContent: 'left',
      justifyContent: 'center'
    });
    VRFiles.cropContainer.add(VRFiles.textContainer);

    for(const file of VRFiles.files) {
      const fileContainer = new ThreeMeshUI.Block({
        width: VRFiles.textContainerWidth,
        height: VRFiles.fontSize + VRFiles.interLine,
        backgroundColor: new THREE.Color(0x9999ff),
        backgroundOpacity: 0.2,
        interLine: 0,
        offset: VRFiles.offset,
        contentDirection: 'row',
        alignContent: 'center',
        justifyContent: 'start'
      });

      const imageBlock = new ThreeMeshUI.Block({
        width: VRFiles.fontSize,
        height: VRFiles.fontSize,
        backgroundTexture: (file.type==="d")?VRFiles.textureFolder:VRFiles.textureFile
      });
      fileContainer.add(imageBlock);    

      const textBlock = new ThreeMeshUI.Block({
        width: VRFiles.textContainerWidth - VRFiles.fontSize,
        height: VRFiles.fontSize + VRFiles.interLine,
        alignContent: 'left',
        justifyContent: 'center',
        backgroundOpacity: 0
      });
      fileContainer.add(textBlock);

      const textPanel = new ThreeMeshUI.Text({
        content: ` ${file.name}`
      });
      textBlock.add(textPanel);

      VRFiles.textContainer.add(fileContainer);
      file.container = fileContainer;
    }
    VRFiles.cropContainer.update(true, true, true);

    // configure scroller knob inside scrollerContainer
    VRFiles.firstFile = 0;
    const railWidth = 0.2 - VRFiles.margin;
    const railHeight = VRFiles.maxfiles*(VRFiles.fontSize + VRFiles.interLine);
    const knobHeight = Math.min(VRFiles.maxfiles/VRFiles.files.length, 1)*VRFiles.maxfiles*(VRFiles.fontSize + VRFiles.interLine);
    const knobGeometry = new THREE.PlaneGeometry(railWidth, knobHeight);
    const knobMaterial = new THREE.MeshBasicMaterial({color:"white"});
    VRFiles.knob = new THREE.Mesh(knobGeometry, knobMaterial);
    VRFiles.knob.position.y = (railHeight - knobHeight)/2 - (VRFiles.firstFile/VRFiles.files.length)*railHeight;
    VRFiles.knob.position.z = 0.01;
    knobGeometry.computeFaceNormals();
    VRFiles.scrollerContainer.add(VRFiles.knob);

    ThreeMeshUI.update();
  },
  
  setup: async function (scene, controller, callback) {
    VRFiles.scene = scene;
    VRFiles.controller = controller;
    VRFiles.callback = callback;

    const loader = new THREE.TextureLoader();
    VRFiles.textureFolder = await new Promise(resolve => {
      loader.load("./assets/folder.png", resolve);
    });
    VRFiles.textureFile = await new Promise(resolve => {
      loader.load("./assets/file.png", resolve);
    });

    const group = new THREE.Group();
    group.position.set(0,2,-2);
    scene.add(group);

    // main container
    const mainContainer = new ThreeMeshUI.Block({
      backgroundOpacity: 0.2,
      contentDirection: 'column',
      fontSize: VRFiles.fontSize,
      fontFamily: './assets/Roboto-msdf.json',
      fontTexture: './assets/Roboto-msdf.png'
    });
    group.add(mainContainer);

    // title
    const titleContainer = new ThreeMeshUI.Block({
      width: VRFiles.cropContainerWidth + 3*VRFiles.margin,
      height: VRFiles.fontSize + VRFiles.interLine,
      backgroundOpacity: 0.3,
      alignContent: 'left',
      justifyContent: 'center'
    });
    mainContainer.add(titleContainer);

    VRFiles.directoryContainer = new ThreeMeshUI.Text({
      content: "",
    });
    titleContainer.add(VRFiles.directoryContainer);

    // files container
    const container = new ThreeMeshUI.Block({
      width: VRFiles.cropContainerWidth + 3*VRFiles.margin,
      height: VRFiles.maxfiles*(VRFiles.fontSize + VRFiles.interLine) + VRFiles.margin,
      contentDirection: 'row',
      // backgroundColor: new THREE.Color("red"),
      backgroundOpacity: 0,
    });
    mainContainer.add(container);

    // text crop container
    VRFiles.cropContainer = new ThreeMeshUI.Block({
      width: VRFiles.cropContainerWidth,
      height: VRFiles.maxfiles*(VRFiles.fontSize + VRFiles.interLine),
      margin: VRFiles.margin/2,
      hiddenOverflow: true,
      contentDirection: 'column',
      alignContent: 'left',
      justifyContent: 'start',
      backgroundSize: 'stretch',
      backgroundOpacity: 0.2,
      offset: VRFiles.offset
    });
    container.add(VRFiles.cropContainer);

    // scroller rail
    const railWidth = 0.2 - VRFiles.margin;
    const railHeight = VRFiles.maxfiles*(VRFiles.fontSize + VRFiles.interLine);
    VRFiles.scrollerContainer = new ThreeMeshUI.Block({
      width: railWidth,
      height: railHeight,
      margin: VRFiles.margin/2,
      backgroundColor: new THREE.Color('black'),
      backgroundOpacity: 0.2
    });
    container.add(VRFiles.scrollerContainer);

    // connect event handlers
    controller.addEventListener( 'selectstart', VRFiles.onGripStart );
    controller.addEventListener( 'selectend', VRFiles.onGripEnd );

    VRFiles.initialised = true;
  },
  
  planeNormal: function (plane) {
    // compute normals needs to be called upon creation of the plane
    const arr = plane.geometry.attributes.normal.array;
    VRFiles.normal.set(arr[0], arr[1], arr[2]);
    return VRFiles.normal;
  },
  
  raycastOnKnobPlane: function () {
    VRFiles.normal = VRFiles.planeNormal(VRFiles.knob);
    VRFiles.knob.getWorldPosition(VRFiles.position);
    VRFiles.plane.setFromNormalAndCoplanarPoint(VRFiles.normal, VRFiles.position);

    VRFiles.tempMatrix.identity().extractRotation( VRFiles.controller.matrixWorld );
    VRFiles.raycaster.ray.origin.setFromMatrixPosition( VRFiles.controller.matrixWorld );
    VRFiles.raycaster.ray.direction.set( 0, 0, -1 ).applyMatrix4( VRFiles.tempMatrix );

    VRFiles.raycaster.ray.intersectPlane(VRFiles.plane, VRFiles.point);
    return VRFiles.point;
  },
  
  moveKnob: function ( ) {
    VRFiles.point = VRFiles.raycastOnKnobPlane();
    const y = VRFiles.knobOriginalPosition.y + VRFiles.point.y - VRFiles.mouseOriginalPosition.y;
    const railHeight = VRFiles.maxfiles*(VRFiles.fontSize + VRFiles.interLine);
    const knobHeight = Math.min(VRFiles.maxfiles/VRFiles.files.length, 1)*VRFiles.maxfiles*(VRFiles.fontSize + VRFiles.interLine);
    VRFiles.firstFile = Math.floor(((railHeight - knobHeight)/2 - y)*VRFiles.files.length/railHeight);
    VRFiles.firstFile = Math.max(VRFiles.firstFile, 0);
    VRFiles.firstFile = Math.min(VRFiles.firstFile, VRFiles.files.length - VRFiles.maxfiles);
    VRFiles.knob.position.y = (railHeight - knobHeight)/2 - (VRFiles.firstFile/VRFiles.files.length)*railHeight;
  },
  
  onGripStart: function () {
    if(VRFiles.knobSelected) {
      VRFiles.knobCaptured = true;
      VRFiles.mouseOriginalPosition.copy(VRFiles.raycastOnKnobPlane());
      VRFiles.knobOriginalPosition = {x: VRFiles.knob.position.x, y: VRFiles.knob.position.y, z: VRFiles.knob.position.z};
    } else {
      VRFiles.callback({
        name: VRFiles.files[VRFiles.firstFile + VRFiles.fileIndex].name,
        type: VRFiles.files[VRFiles.firstFile + VRFiles.fileIndex].type
      });
    }
  },
  
  onGripEnd: function () {
    VRFiles.knobCaptured = false;
  },
  
  loop: function () {
    ThreeMeshUI.update();

    // offset to first file
    if(VRFiles.files.length) {
      const textContainerOffset = -(VRFiles.textContainer.getHeight() - VRFiles.cropContainer.getHeight())/2;
      VRFiles.textContainer.position.y = textContainerOffset + VRFiles.firstFile*(VRFiles.fontSize + VRFiles.interLine);
    }

    // set raycaster
    VRFiles.tempMatrix.identity().extractRotation( VRFiles.controller.matrixWorld );
    VRFiles.raycaster.ray.origin.setFromMatrixPosition( VRFiles.controller.matrixWorld );
    VRFiles.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( VRFiles.tempMatrix );
    
    // check text hover
    const cropContainerFrame = VRFiles.cropContainer.getObjectByName("MeshUI-Frame");
    if(cropContainerFrame) {
      const intersect = VRFiles.raycaster.intersectObject( cropContainerFrame );
      if(intersect.length) {
        VRFiles.fileIndex = parseInt(VRFiles.maxfiles * (1 - intersect[0].uv.y));
        VRFiles.selectFile(VRFiles.firstFile + VRFiles.fileIndex);
      }
    }

    // check knob hover
    if(VRFiles.files.length) {
      const intersect = VRFiles.raycaster.intersectObject( VRFiles.knob );
      VRFiles.knobSelected = intersect.length>0;
      if(VRFiles.knobSelected || VRFiles.knobCaptured) {
        VRFiles.knob.material.color.set( 0xff0000 );
      } else {
        VRFiles.knob.material.color.set( 0xffffff );
      }
      if(VRFiles.knobCaptured) { VRFiles.moveKnob(); }
    }
  },

  /**
   * Websockets
   */

  socket: null,

  displayFiles: function (el, content) {
    const selection = Math.min(11, content.length);
    let text;
    text = `${content[0].file}\n`;
    text += content.slice(1, selection).map((o) => {
      return `[${o.type}] ${o.file}`;
    }).join("\n");
    const files = content.map((o) => {return {name: o.file, type: o.type}});
    VRFiles.setFiles(files);
  },
  
  liveServerSocket: async function () {
    const delay = 1000;
    const timeout = 10000;
    const now = new Date();
    const ws = await new Promise((resolve, reject) => {
      const check = () => {
        if(new Date() - now > timeout) {
          reject(new Error("timeout"));
        }
  
        if(typeof window.LiveServerWebsocket !== "undefined") {
          resolve(window.LiveServerWebsocket);
        }
        setTimeout(check, delay);
      }
      check();
    });
    return ws;
  },
  
  onSocketMessage: function (msg) {
    if(msg.data === "connected") { return; }
    try {
      const data = JSON.parse(msg.data);
      console.log(data.type);
      switch(data.type) {
        case "ls":
          VRFiles.displayFiles(document.querySelector("#vrfiles"), data.content);
          break;
        case "open":
          console.log("open", data.content);
          break;
        default:
          console.log("Unknown message type:", data.type);
      }
    } catch(err) {
      console.log("socket message:", msg.data);
      throw new Error(err);
    }
  },
      
  initSocket: async function () {
    try {
      VRFiles.socket = await VRFiles.liveServerSocket();
    } catch(err) {
      throw new Error(err);
    }
    console.log("Got socket", VRFiles.socket)
  
    const originalOnmessageFn = VRFiles.socket.onmessage;
    VRFiles.socket.send('ls');
    VRFiles.socket.onmessage = (msg) => {
      originalOnmessageFn(msg);
      VRFiles.onSocketMessage(msg);
    }
  }
}

window.VRFiles = VRFiles;
