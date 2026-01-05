import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navigation/Navbar";
import GameUI from "@/components/game/GameUI";
import {
  leadershipGameScenarios,
  calculateGameResults,
  type ColorType,
  type GameScenario,
} from "@/lib/leadershipGameScenarios";
import { ChevronRight, Gamepad2, Loader2, Volume2, VolumeX, MapPin } from "lucide-react";

const officeNPCs = [
  { id: 1, name: "Alex", position: [-8, 0, -6] as [number, number, number], color: 0x4299e1 },
  { id: 2, name: "Jordan", position: [-4, 0, -6] as [number, number, number], color: 0x48bb78 },
  { id: 3, name: "Sam", position: [0, 0, -6] as [number, number, number], color: 0xecc94b },
  { id: 4, name: "Taylor", position: [4, 0, -6] as [number, number, number], color: 0xf56565 },
  { id: 5, name: "Casey", position: [-8, 0, -3] as [number, number, number], color: 0x9f7aea },
  { id: 6, name: "Morgan", position: [-4, 0, -3] as [number, number, number], color: 0xed8936 },
  { id: 7, name: "Riley", position: [8, 0, -1] as [number, number, number], color: 0x38b2ac },
  { id: 8, name: "Quinn", position: [8, 0, 1] as [number, number, number], color: 0xe53e3e },
  { id: 9, name: "Blake", position: [-10, 0, 7] as [number, number, number], color: 0x667eea },
];

const npcScenarioMap: Record<number, number[]> = {
  1: [1, 2],
  2: [3, 4],
  3: [5, 6],
  4: [7, 8],
  5: [9, 10],
  6: [11, 12],
  7: [13],
  8: [14],
  9: [15],
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Minimap component
function Minimap({ 
  playerPosition, 
  playerRotation, 
  completedScenarios 
}: { 
  playerPosition: { x: number; z: number }; 
  playerRotation: number;
  completedScenarios: Set<number>;
}) {
  const mapSize = 120;
  const scale = mapSize / 30; // 30 is the office size
  
  const toMapCoord = (worldX: number, worldZ: number) => ({
    x: (worldX + 15) * scale,
    y: (worldZ + 15) * scale,
  });

  const hasAvailableScenario = (npcId: number) => {
    const ids = npcScenarioMap[npcId] || [];
    return ids.some(id => !completedScenarios.has(id));
  };

  return (
    <div className="absolute bottom-4 right-4 z-30 pointer-events-none">
      <div 
        className="relative bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-600 overflow-hidden"
        style={{ width: mapSize, height: mapSize }}
      >
        {/* Office walls */}
        <div className="absolute inset-2 border-2 border-slate-500 rounded" />
        
        {/* Desk areas */}
        <div className="absolute bg-amber-900/50 rounded" style={{ left: 20, top: 15, width: 60, height: 25 }} />
        <div className="absolute bg-amber-900/50 rounded" style={{ left: 20, top: 45, width: 40, height: 15 }} />
        
        {/* Meeting area */}
        <div className="absolute bg-slate-700/50 rounded" style={{ left: 85, top: 45, width: 25, height: 30 }} />
        
        {/* NPCs */}
        {officeNPCs.map((npc) => {
          const pos = toMapCoord(npc.position[0], npc.position[2]);
          const hasScenario = hasAvailableScenario(npc.id);
          return (
            <div
              key={npc.id}
              className={`absolute w-2.5 h-2.5 rounded-full border border-white/50 ${
                hasScenario ? 'animate-pulse' : 'opacity-50'
              }`}
              style={{
                left: pos.x - 5,
                top: pos.y - 5,
                backgroundColor: `#${npc.color.toString(16).padStart(6, '0')}`,
              }}
              title={npc.name}
            />
          );
        })}
        
        {/* Player */}
        <div
          className="absolute w-0 h-0 transition-all duration-75"
          style={{
            left: toMapCoord(playerPosition.x, playerPosition.z).x,
            top: toMapCoord(playerPosition.x, playerPosition.z).y,
            transform: `translate(-50%, -50%) rotate(${-playerRotation * (180 / Math.PI)}deg)`,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderBottom: '10px solid #22c55e',
          }}
        />
        
        {/* Legend */}
        <div className="absolute bottom-1 left-1 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-green-500" />
          <span className="text-[8px] text-slate-400">You</span>
        </div>
      </div>
    </div>
  );
}

export default function LeadershipGame3D() {
  const navigate = useNavigate();

  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const [activeNPC, setActiveNPC] = useState<number | null>(null);
  const [hoveredNPC, setHoveredNPC] = useState<{ name: string; id: number } | null>(null);

  const [currentScenario, setCurrentScenario] = useState<GameScenario | null>(null);
  const [showOutcome, setShowOutcome] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);

  const [choices, setChoices] = useState<Record<number, ColorType>>({});
  const [completedScenarios, setCompletedScenarios] = useState<Set<number>>(new Set());
  
  const [playerPosition, setPlayerPosition] = useState({ x: 0, z: 5 });
  const [playerRotation, setPlayerRotation] = useState(0);

  // Audio refs
  const ambienceRef = useRef<HTMLAudioElement | null>(null);
  const interactSoundRef = useRef<HTMLAudioElement | null>(null);

  // Refs for immediate reads inside event handlers / RAF
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hoveredNpcIdRef = useRef<number | null>(null);
  const currentScenarioRef = useRef<GameScenario | null>(null);
  const completedRef = useRef<Set<number>>(new Set());
  const choicesRef = useRef<Record<number, ColorType>>({});
  const isMutedRef = useRef(false);

  useEffect(() => {
    currentScenarioRef.current = currentScenario;
  }, [currentScenario]);
  useEffect(() => {
    completedRef.current = completedScenarios;
  }, [completedScenarios]);
  useEffect(() => {
    choicesRef.current = choices;
  }, [choices]);
  useEffect(() => {
    isMutedRef.current = isMuted;
    if (ambienceRef.current) {
      ambienceRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const hasAvailableScenario = useCallback((npcId: number) => {
    const ids = npcScenarioMap[npcId] || [];
    return ids.some((id) => !completedRef.current.has(id));
  }, []);

  const getNextScenarioForNPC = useCallback((npcId: number): GameScenario | null => {
    const scenarioIds = npcScenarioMap[npcId] || [];
    for (const id of scenarioIds) {
      if (!completedRef.current.has(id)) {
        return leadershipGameScenarios.find((s) => s.id === id) || null;
      }
    }
    return null;
  }, []);

  const playInteractSound = useCallback(() => {
    if (isMutedRef.current) return;
    // Play a simple click/interact sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Audio not supported
    }
  }, []);

  const handleNPCInteract = useCallback(
    (npcId: number) => {
      const scenario = getNextScenarioForNPC(npcId);
      if (!scenario) return;

      playInteractSound();
      
      setActiveNPC(npcId);
      setCurrentScenario(scenario);
      setShowOutcome(false);
      setSelectedOutcome(null);

      if (document.pointerLockElement) document.exitPointerLock();
    },
    [getNextScenarioForNPC, playInteractSound]
  );

  const handleChoiceSelect = useCallback(
    (choice: { text: string; color: ColorType; outcome: string }) => {
      if (!currentScenarioRef.current) return;
      const scenarioId = currentScenarioRef.current.id;

      playInteractSound();
      setChoices((prev) => ({ ...prev, [scenarioId]: choice.color }));
      setSelectedOutcome(choice.outcome);
      setShowOutcome(true);
    },
    [playInteractSound]
  );

  const handleContinue = useCallback(() => {
    const scenario = currentScenarioRef.current;
    if (!scenario) return;

    const scenarioId = scenario.id;

    setCompletedScenarios((prev) => new Set([...prev, scenarioId]));
    setCurrentScenario(null);
    setActiveNPC(null);
    setShowOutcome(false);
    setSelectedOutcome(null);

    const nextCompletedSize = completedRef.current.size + 1;
    if (nextCompletedSize >= leadershipGameScenarios.length) {
      const finalChoices = choicesRef.current;
      const results = calculateGameResults(finalChoices);
      localStorage.setItem("leadershipGameResults", JSON.stringify(results));
      localStorage.setItem("assessmentType", "game");
      navigate("/leadership-results");
    }
  }, [navigate]);

  const handleCloseDialog = useCallback(() => {
    if (showOutcome) return;
    setCurrentScenario(null);
    setActiveNPC(null);
  }, [showOutcome]);

  const npcIndexById = useMemo(() => {
    const m = new Map<number, number>();
    officeNPCs.forEach((n, idx) => m.set(n.id, idx));
    return m;
  }, []);

  // Three.js scene setup
  useEffect(() => {
    if (!isStarted) return;
    if (!canvasRef.current) return;

    let raf = 0;
    const canvas = canvasRef.current;

    // Start ambient audio
    const startAmbience = () => {
      if (isMutedRef.current) return;
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create ambient noise
        const bufferSize = audioContext.sampleRate * 2;
        const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.02; // Very quiet white noise
        }
        
        const noise = audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        
        const gain = audioContext.createGain();
        gain.gain.value = 0.05;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);
        
        noise.start();
        
        // Store reference for cleanup
        (canvas as any).__ambienceContext = audioContext;
        (canvas as any).__ambienceNoise = noise;
      } catch (e) {
        // Audio not supported
      }
    };

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1220);
    scene.fog = new THREE.Fog(0x0b1220, 10, 55);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 1.6, 5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(6, 12, 6);
    scene.add(dir);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x3b4252, roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.95 });
    const makeWall = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      m.position.set(x, y, z);
      scene.add(m);
    };
    makeWall(30, 4, 0.2, 0, 2, -15);
    makeWall(30, 4, 0.2, 0, 2, 15);
    makeWall(0.2, 4, 30, -15, 2, 0);
    makeWall(0.2, 4, 30, 15, 2, 0);

    // Desks
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x7a4a2a, roughness: 0.8 });
    const deskLegMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
    const deskTopGeo = new THREE.BoxGeometry(1.5, 0.1, 0.8);
    const legGeo = new THREE.BoxGeometry(0.1, 0.75, 0.1);

    const addDesk = (x: number, z: number) => {
      const g = new THREE.Group();
      const top = new THREE.Mesh(deskTopGeo, deskMat);
      top.position.set(0, 0.75, 0);
      g.add(top);
      const legs = [[-0.6, 0.375, -0.3], [0.6, 0.375, -0.3], [-0.6, 0.375, 0.3], [0.6, 0.375, 0.3]];
      legs.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, deskLegMat);
        leg.position.set(lx, ly, lz);
        g.add(leg);
      });
      g.position.set(x, 0, z);
      scene.add(g);
    };

    addDesk(-8, -8);
    addDesk(-4, -8);
    addDesk(0, -8);
    addDesk(4, -8);
    addDesk(-8, -4);
    addDesk(-4, -4);

    // NPCs
    const npcObjects: THREE.Object3D[] = [];
    const npcBodyMaterialsById = new Map<number, THREE.MeshStandardMaterial>();
    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 16);
    const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd, roughness: 0.9 });

    for (const npc of officeNPCs) {
      const group = new THREE.Group();
      group.position.set(npc.position[0], npc.position[1], npc.position[2]);
      group.userData = { npcId: npc.id, name: npc.name };

      const active = hasAvailableScenario(npc.id);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: active ? npc.color : 0x666666,
        roughness: 0.7,
      });
      npcBodyMaterialsById.set(npc.id, bodyMat);

      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(0, 0.6, 0);
      group.add(body);

      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(0, 1.4, 0);
      group.add(head);

      scene.add(group);
      npcObjects.push(group);
    }

    // Controls
    const keys = { w: false, a: false, s: false, d: false, e: false };
    const yawPitch = { yaw: 0, pitch: 0 };

    const onKeyDown = (e: KeyboardEvent) => {
      if (currentScenarioRef.current) return;
      if (e.code === "KeyW" || e.code === "ArrowUp") keys.w = true;
      if (e.code === "KeyS" || e.code === "ArrowDown") keys.s = true;
      if (e.code === "KeyA" || e.code === "ArrowLeft") keys.a = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.d = true;
      if (e.code === "KeyE") {
        // Interact with E key
        if (hoveredNpcIdRef.current && document.pointerLockElement === canvas) {
          handleNPCInteract(hoveredNpcIdRef.current);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyW" || e.code === "ArrowUp") keys.w = false;
      if (e.code === "KeyS" || e.code === "ArrowDown") keys.s = false;
      if (e.code === "KeyA" || e.code === "ArrowLeft") keys.a = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.d = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      if (currentScenarioRef.current) return;

      const sensitivity = 0.002;
      yawPitch.yaw -= e.movementX * sensitivity;
      yawPitch.pitch -= e.movementY * sensitivity;
      yawPitch.pitch = clamp(yawPitch.pitch, -Math.PI / 3, Math.PI / 3);

      camera.rotation.order = "YXZ";
      camera.rotation.y = yawPitch.yaw;
      camera.rotation.x = yawPitch.pitch;
      
      setPlayerRotation(yawPitch.yaw);
    };

    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);
    let lastHoverName: string | null = null;
    let lastHoverId: number | null = null;

    const onCanvasClick = () => {
      if (currentScenarioRef.current) return;

      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
        startAmbience();
        return;
      }

      if (hoveredNpcIdRef.current) {
        handleNPCInteract(hoveredNpcIdRef.current);
      }
    };

    const onPointerLockChange = () => {
      if (document.pointerLockElement !== canvas) {
        hoveredNpcIdRef.current = null;
        lastHoverId = null;
        lastHoverName = null;
        setHoveredNPC(null);
      }
    };

    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      if (clientWidth === 0 || clientHeight === 0) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight, false);
    };

    let prev = performance.now();
    const tick = () => {
      raf = requestAnimationFrame(tick);

      const now = performance.now();
      const delta = Math.min(0.05, (now - prev) / 1000);
      prev = now;

      resize();

      const dialogOpen = !!currentScenarioRef.current;
      if (!dialogOpen) {
        const speed = 4;
        const dir = new THREE.Vector3();
        const forward = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
        const side = (keys.a ? 1 : 0) - (keys.d ? 1 : 0);
        if (forward !== 0 || side !== 0) {
          dir.set(side, 0, forward).normalize().multiplyScalar(speed * delta);
          dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawPitch.yaw);

          const nx = clamp(camera.position.x + dir.x, -14, 14);
          const nz = clamp(camera.position.z + dir.z, -14, 14);
          camera.position.x = nx;
          camera.position.z = nz;
          
          setPlayerPosition({ x: nx, z: nz });
        }

        raycaster.setFromCamera(center, camera);
        const intersects = raycaster.intersectObjects(npcObjects, true);

        const hit = intersects.find((i) => {
          const g = (i.object.parent && i.object.parent.userData?.npcId) ? i.object.parent : i.object;
          const npcId = g.userData?.npcId as number | undefined;
          return typeof npcId === "number" && hasAvailableScenario(npcId);
        });

        if (hit) {
          const g = (hit.object.parent && hit.object.parent.userData?.npcId) ? hit.object.parent : hit.object;
          const npcId = g.userData?.npcId as number;
          const name = g.userData?.name as string;

          hoveredNpcIdRef.current = npcId;
          if (name !== lastHoverName) {
            lastHoverName = name;
            lastHoverId = npcId;
            setHoveredNPC({ name, id: npcId });
          }
        } else {
          hoveredNpcIdRef.current = null;
          if (lastHoverName !== null) {
            lastHoverName = null;
            lastHoverId = null;
            setHoveredNPC(null);
          }
        }

        const t = now * 0.002;
        for (const obj of npcObjects) {
          const npcId = obj.userData?.npcId as number | undefined;
          if (!npcId) continue;
          const isActive = hoveredNpcIdRef.current === npcId;
          obj.position.y = isActive ? Math.sin(t * 3) * 0.08 : 0;
        }
      }

      renderer.render(scene, camera);
    };

    window.addEventListener("resize", resize);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    canvas.addEventListener("click", onCanvasClick);

    resize();
    setIsLoading(false);
    tick();

    return () => {
      cancelAnimationFrame(raf);

      window.removeEventListener("resize", resize);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      canvas.removeEventListener("click", onCanvasClick);

      if (document.pointerLockElement === canvas) document.exitPointerLock();

      // Stop ambient audio
      try {
        const ctx = (canvas as any).__ambienceContext;
        const noise = (canvas as any).__ambienceNoise;
        if (noise) noise.stop();
        if (ctx) ctx.close();
      } catch (e) {}

      renderer.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      bodyGeo.dispose();
      headGeo.dispose();
      headMat.dispose();
      deskTopGeo.dispose();
      legGeo.dispose();
      wallMat.dispose();
      deskMat.dispose();
      deskLegMat.dispose();
      npcBodyMaterialsById.forEach((m) => m.dispose());

      hoveredNpcIdRef.current = null;
      setHoveredNPC(null);
    };
  }, [hasAvailableScenario, handleNPCInteract, isStarted, npcIndexById]);

  useEffect(() => {
    completedRef.current = completedScenarios;
  }, [completedScenarios]);

  useEffect(() => {
    if (completedScenarios.size >= leadershipGameScenarios.length && Object.keys(choices).length >= leadershipGameScenarios.length) {
      const results = calculateGameResults(choices);
      localStorage.setItem("leadershipGameResults", JSON.stringify(results));
      localStorage.setItem("assessmentType", "game");
      navigate("/leadership-results");
    }
  }, [choices, completedScenarios.size, navigate]);

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-4xl mx-auto px-4 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-8">
              <Gamepad2 className="w-10 h-10 text-primary" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              3D Office <span className="gradient-text-primary">Leadership Simulation</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Explore a 3D office and talk to your team members. Each interaction unlocks a leadership scenario.
            </p>

            <Card className="max-w-xl mx-auto mb-8">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-lg">How to Play</h3>
                <div className="grid grid-cols-2 gap-4 text-left text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">W A S D</Badge>
                    <span>Move around</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Mouse</Badge>
                    <span>Look around</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">E</Badge>
                    <span>Interact with NPC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">ESC</Badge>
                    <span>Release mouse</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" onClick={() => setIsStarted(true)}>
                Enter the Office
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/leadership-game")}>
                Play Text Version Instead
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center"
          >
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading office environment...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* NPC Nameplate Overlay */}
      <AnimatePresence>
        {hoveredNPC && !currentScenario && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none z-20"
          >
            <div className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary/50 shadow-lg">
              <p className="text-lg font-semibold text-center">{hoveredNPC.name}</p>
              <p className="text-sm text-muted-foreground text-center">Press E to interact</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crosshair */}
      {!currentScenario && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className={`w-2 h-2 rounded-full border-2 ${hoveredNPC ? 'border-primary bg-primary/30' : 'border-white/50'}`} />
        </div>
      )}

      {/* Minimap */}
      <Minimap 
        playerPosition={playerPosition} 
        playerRotation={playerRotation}
        completedScenarios={completedScenarios}
      />

      <GameUI
        scenario={currentScenario}
        npcName={null}
        onChoiceSelect={handleChoiceSelect}
        onClose={handleCloseDialog}
        completedCount={completedScenarios.size}
        totalCount={leadershipGameScenarios.length}
        showOutcome={showOutcome}
        selectedOutcome={selectedOutcome}
        onContinue={handleContinue}
      />

      {/* Top bar with exit and mute */}
      <div className="absolute top-4 left-4 right-4 z-40 flex justify-between items-center pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (document.pointerLockElement) document.exitPointerLock();
              navigate("/");
            }}
            className="bg-background/80 backdrop-blur-sm"
          >
            Exit Game
          </Button>
        </div>
        
        <div className="flex gap-2 pointer-events-auto">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="bg-background/80 backdrop-blur-sm"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Instructions overlay when starting */}
      {completedScenarios.size === 0 && !currentScenario && !hoveredNPC && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10">
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-white text-lg font-medium drop-shadow-lg"
          >
            Click to look around, find team members to interact with
          </motion.p>
        </div>
      )}
    </div>
  );
}
