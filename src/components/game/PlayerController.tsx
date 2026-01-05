import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface PlayerControllerProps {
  speed?: number;
}

export default function PlayerController({ speed = 5 }: PlayerControllerProps) {
  const { camera } = useThree();
  const moveState = useRef({ forward: false, backward: false, left: false, right: false });
  const mouseState = useRef({ isLocked: false, rotationX: 0, rotationY: 0 });
  
  useEffect(() => {
    // Initialize camera position
    camera.position.set(0, 1.6, 5);
    camera.rotation.set(0, 0, 0);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          moveState.current.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          moveState.current.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          moveState.current.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          moveState.current.right = true;
          break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          moveState.current.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          moveState.current.backward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          moveState.current.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          moveState.current.right = false;
          break;
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseState.current.isLocked) return;
      
      const sensitivity = 0.002;
      mouseState.current.rotationY -= e.movementX * sensitivity;
      mouseState.current.rotationX -= e.movementY * sensitivity;
      
      // Clamp vertical rotation
      mouseState.current.rotationX = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, mouseState.current.rotationX)
      );
    };
    
    const handlePointerLockChange = () => {
      mouseState.current.isLocked = document.pointerLockElement !== null;
    };
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "CANVAS") {
        target.requestPointerLock();
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    document.addEventListener("click", handleClick);
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      document.removeEventListener("click", handleClick);
    };
  }, [camera]);
  
  useFrame((_, delta) => {
    // Update camera rotation
    camera.rotation.order = "YXZ";
    camera.rotation.y = mouseState.current.rotationY;
    camera.rotation.x = mouseState.current.rotationX;
    
    // Calculate movement direction
    const direction = new THREE.Vector3();
    const frontVector = new THREE.Vector3(
      0,
      0,
      (moveState.current.backward ? 1 : 0) - (moveState.current.forward ? 1 : 0)
    );
    const sideVector = new THREE.Vector3(
      (moveState.current.left ? 1 : 0) - (moveState.current.right ? 1 : 0),
      0,
      0
    );
    
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(speed * delta)
      .applyEuler(new THREE.Euler(0, mouseState.current.rotationY, 0));
    
    // Update position with boundary checks
    const newX = camera.position.x + direction.x;
    const newZ = camera.position.z + direction.z;
    
    if (newX > -14 && newX < 14) camera.position.x = newX;
    if (newZ > -14 && newZ < 14) camera.position.z = newZ;
  });
  
  return null;
}
