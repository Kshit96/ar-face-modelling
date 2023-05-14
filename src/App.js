import './App.css';
import React, { useRef, useState } from 'react'
import * as faceapi from 'face-api.js';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber'

function Box(props) {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef()
  // Hold state for hovered and clicked events
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)
  // Subscribe this component to the render-loop, rotate the mesh every frame
  // useFrame((state, delta) => {
  //   return ref.current.rotation.x += delta
  // })
  function getLandmarkCenter(landmarks) {
    const x = landmarks.reduce((sum, landmark) => sum + landmark.x, 0) / landmarks.length
    const y = landmarks.reduce((sum, landmark) => sum + landmark.y, 0) / landmarks.length
    return new THREE.Vector2(x, y)
  }

  useFrame(async (state, delta) => {
    const video = document.querySelector('video')
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
    if (detections.length == 0) {
      return ref.current.scale.x 
    }
    const landmarks = detections[0].landmarks
    const leftEye = landmarks.getLeftEye()
    const rightEye = landmarks.getRightEye()
    const nose = landmarks.getNose()
    const leftEyeCenter = getLandmarkCenter(leftEye)
    const rightEyeCenter = getLandmarkCenter(rightEye)
    const eyeglassesWidth = rightEyeCenter.x - leftEyeCenter.x
    const eyeglassesHeight = eyeglassesWidth * 0.2

    return ref.current.scale.x
  })

  useFrame(async (state, delta) => {
    const video = document.querySelector('video')
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
    if (detections.length == 0) {
      return ref.current.position.x 
    }
    const landmarks = detections[0].landmarks
    const leftEye = landmarks.getLeftEye()
    const rightEye = landmarks.getRightEye()
    const nose = landmarks.getNose()
    const leftEyeCenter = getLandmarkCenter(leftEye)
    const rightEyeCenter = getLandmarkCenter(rightEye)
    const eyeglassesWidth = rightEyeCenter.x - leftEyeCenter.x
    const eyeglassesHeight = eyeglassesWidth * 0.2
    console.log('Position',ref.current.position.x)
    console.log('Eye',leftEyeCenter.x)
    return ref.current.position.x = leftEyeCenter.x * 0.01
  })
  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? 1.5 : 1}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => hover(true)}
      onPointerOut={(event) => hover(false)}>
      <boxGeometry args={[1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  )
}


function App() {
  const [modelsLoaded, setModelsLoaded] = React.useState(false);
  const [captureVideo, setCaptureVideo] = React.useState(false);

  const videoRef = React.useRef();
  const videoHeight = 480;
  const videoWidth = 640;
  const canvasRef = React.useRef();

  React.useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + '/models';

      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]).then(setModelsLoaded(true));
    }
    loadModels();
  }, []);

  const startVideo = () => {
    setCaptureVideo(true);
    navigator.mediaDevices
      .getUserMedia({ video: { width: 300 } })
      .then(stream => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
      })
      .catch(err => {
        console.error("error:", err);
      });
  }

  const handleVideoOnPlay = () => {
    setInterval(async () => {
      if (canvasRef && canvasRef.current) {
        canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current);
        const displaySize = {
          width: videoWidth,
          height: videoHeight
        }

        faceapi.matchDimensions(canvasRef.current, displaySize);

        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        canvasRef && canvasRef.current && canvasRef.current.getContext('2d').clearRect(0, 0, videoWidth, videoHeight);
        canvasRef && canvasRef.current && faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        canvasRef && canvasRef.current && faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        canvasRef && canvasRef.current && faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);
      }
    }, )
  }

  const closeWebcam = () => {
    videoRef.current.pause();
    videoRef.current.srcObject.getTracks()[0].stop();
    setCaptureVideo(false);
  }

  const goggles_element = () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    const eyeglassesMesh = new THREE.Mesh(geometry, material)

    return eyeglassesMesh
  }

  const build_goggles = (eyeglassesMesh) => {
    // const geometry = new THREE.BoxGeometry(1, 1, 1)
    // const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    // const eyeglassesMesh = new THREE.Mesh(geometry, material)

    const video = document.querySelector('video')
    const canvas = document.querySelector('canvas')

    setInterval(async () => {
      // Get the dimensions of the video stream
      
      const width = video.videoWidth
      const height = video.videoHeight
      // Set the canvas dimensions to match the video stream
      canvas.width = width
      canvas.height = height
      // Draw the current video frame to the canvas
      // const context = canvas.getContext('2d')
      // context.drawImage(video, 0, 0, width, height)
      // Detect the face landmarks in the current video frame
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
      console.log(detections)
      // If a face is detected, position the eyeglasses over the eyes
      if (detections.length > 0) {
        const landmarks = detections[0].landmarks
        const leftEye = landmarks.getLeftEye()
        const rightEye = landmarks.getRightEye()
        const nose = landmarks.getNose()
        const leftEyeCenter = getLandmarkCenter(leftEye)
        const rightEyeCenter = getLandmarkCenter(rightEye)
        const eyeglassesWidth = rightEyeCenter.x - leftEyeCenter.x
        const eyeglassesHeight = eyeglassesWidth * 0.2
        eyeglassesMesh.position.set(leftEyeCenter.x, leftEyeCenter.y, nose[0].z)
        eyeglassesMesh.scale.set(eyeglassesWidth, eyeglassesHeight, 1)
      } else {
        // If no face is detected, hide the eyeglasses
        eyeglassesMesh.visible = false
      }
    }, 100)
  }

  function getLandmarkCenter(landmarks) {
    const x = landmarks.reduce((sum, landmark) => sum + landmark.x, 0) / landmarks.length
    const y = landmarks.reduce((sum, landmark) => sum + landmark.y, 0) / landmarks.length
    return new THREE.Vector2(x, y)
  }

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '10px' }}>
        {
          captureVideo && modelsLoaded ?
            <button onClick={closeWebcam} style={{ cursor: 'pointer', backgroundColor: 'green', color: 'white', padding: '15px', fontSize: '25px', border: 'none', borderRadius: '10px' }}>
              Close Webcam
            </button>
            :
            <button onClick={startVideo} style={{ cursor: 'pointer', backgroundColor: 'green', color: 'white', padding: '15px', fontSize: '25px', border: 'none', borderRadius: '10px' }}>
              Open Webcam
            </button>
        }
      </div>
      {
        captureVideo ?
          modelsLoaded ?
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
                <video ref={videoRef} height={videoHeight} width={videoWidth} style={{ borderRadius: '10px', position: 'absolute' }} />
                <Canvas style={{position: 'absolute', height: 480, width: 640}}>
                  <ambientLight />
                  <pointLight position={[10, 10, 10]} />
                  <Box position={[-1.2, 0, 0]} />
                  <Box position={[1.2, 0, 0]} />
                </Canvas>
              </div>
            </div>
            :
            <div>loading...</div>
          :
          <>
          </>
      }
    </div>
  );
}

export default App;
