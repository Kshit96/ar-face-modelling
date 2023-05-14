import {useRef,useEffect} from 'react';
import './App.css';
import * as faceapi from 'face-api.js';
import * as THREE from 'three';
import eyeglassModel from './eyeglas.glb';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';


let eyeglassMesh;
async function loadGlass() {
//   const loader = new GLTFLoader();
// loader.load('/models/glasses.glb', (gltf) => {
//   glassesModel = gltf.scene;
//   glassesModel.scale.set(10, 10, 10);
//   glassesModel.visible = false;
//   scene.add(glassesModel);
// })
 const loader = new THREE.ObjectLoader();
const eyeglassObject = await loader.loadAsync(eyeglassModel);
const eyeglassMesh = eyeglassObject.children[0];
eyeglassMesh.scale.set(0.5, 0.5, 0.5); 
}

function App(){
  const videoRef = useRef()
  const canvasRef = useRef()

  // LOAD FROM USEEFFECT
  useEffect(()=>{
    startVideo()
    videoRef && loadModels()

  },[])



  // OPEN YOU FACE WEBCAM
  const startVideo = ()=>{
    navigator.mediaDevices.getUserMedia({video:true})
    .then((currentStream)=>{
      videoRef.current.srcObject = currentStream
    })
    .catch((err)=>{
      console.log(err)
    })
  }
  // LOAD MODELS FROM FACE API

  const loadModels = ()=>{
    Promise.all([
      // THIS FOR FACE DETECT AND LOAD FROM YOU PUBLIC/MODELS DIRECTORY
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      loadGlass(),

      ]).then(()=>{
      faceMyDetect()
    })
  }


  const faceMyDetect = ()=>{
    setInterval(async()=>{

      const scene = new THREE.Scene();


      
      const detections = await faceapi.detectAllFaces(videoRef.current,
        new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()

      // DRAW YOU FACE IN WEBCAM
      // canvasRef.current.innerHtml = faceapi.createCanvasFromMedia(videoRef.current)

      const canvasWidth = videoRef.current.videoWidth;
const canvasHeight = videoRef.current.videoHeight;

  const resized = faceapi.resizeResults(detections,{
        width:videoRef.current.videoWidth,
        height:videoRef.current.videoHeight,
        
      }, true)

const face = resized[0].detection.box;
const faceWidth = face.width;
const faceHeight = face.height;
const faceCenterX = face.x + faceWidth / 2;
const faceCenterY = face.y + faceHeight / 2;

const aspectRatio = canvasWidth / canvasHeight;
const fov = 75;
const camera = new THREE.PerspectiveCamera(fov, aspectRatio, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
  canvas: canvasRef.current,
  alpha: true,
});
renderer.setSize(canvasWidth, canvasHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const eyeglassPositionX = (faceCenterX / canvasWidth) * 2 - 1;
const eyeglassPositionY = -(faceCenterY / canvasHeight) * 2 + 1;
eyeglassMesh.position.set(eyeglassPositionX, eyeglassPositionY, 0);
eyeglassMesh.rotation.y = Math.PI; // flip the eyeglass to face the user
scene.add(eyeglassMesh);

renderer.render(scene, camera);

      // faceapi.matchDimensions(canvasRef.current,{
      //   width:videoRef.current.videoWidth,
      //   height:videoRef.current.videoHeight,
      // }, true)

      // const resized = faceapi.resizeResults(detections,{
      //   width:videoRef.current.videoWidth,
      //   height:videoRef.current.videoHeight,
        
      // }, true)

      // faceapi.draw.drawDetections(canvasRef.current,resized)
      // faceapi.draw.drawFaceLandmarks(canvasRef.current,resized)
      // faceapi.draw.drawFaceExpressions(canvasRef.current,resized)


    },1000/120)
  }

  return (
    <div>
    <h1>FAce Detection</h1>
      <div style={{"position": "relative"}}>
        
        <video crossOrigin="anonymous" ref={videoRef} autoPlay style={{"width": "640px"}}></video>
        <canvas ref={canvasRef} style={{"position": "absolute", "top": "0px", "left": "0px"}} />
       
      </div>
    </div>
    )

}

export default App;