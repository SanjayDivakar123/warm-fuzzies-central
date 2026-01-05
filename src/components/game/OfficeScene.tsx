import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, Cylinder, Plane } from "@react-three/drei";
import * as THREE from "three";

interface NPCProps {
  position: [number, number, number];
  color: string;
  name: string;
  isActive: boolean;
  onClick: () => void;
}

const NPC = ({ position, color, isActive, onClick }: NPCProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const baseY = position[1];
  
  useFrame((state) => {
    if (meshRef.current) {
      if (isActive) {
        meshRef.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      } else {
        meshRef.current.position.y = baseY;
      }
    }
  });

  return (
    <group ref={meshRef} position={position} onClick={onClick}>
      {/* Body */}
      <Cylinder args={[0.3, 0.4, 1.2, 16]} position={[0, 0.6, 0]}>
        <meshStandardMaterial color={color} />
      </Cylinder>
      {/* Head */}
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#FFE0BD" />
      </mesh>
      {/* Interaction indicator */}
      {isActive && (
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
};

const Desk = ({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) => (
  <group position={position} rotation={[0, rotation, 0]}>
    {/* Desk top */}
    <Box args={[1.5, 0.1, 0.8]} position={[0, 0.75, 0]}>
      <meshStandardMaterial color="#8B4513" />
    </Box>
    {/* Legs */}
    {[[-0.6, 0, -0.3], [0.6, 0, -0.3], [-0.6, 0, 0.3], [0.6, 0, 0.3]].map((pos, i) => (
      <Box key={i} args={[0.1, 0.75, 0.1]} position={[pos[0], 0.375, pos[2]]}>
        <meshStandardMaterial color="#5C4033" />
      </Box>
    ))}
    {/* Computer monitor */}
    <Box args={[0.6, 0.4, 0.05]} position={[0, 1.1, -0.2]}>
      <meshStandardMaterial color="#333333" />
    </Box>
    <Box args={[0.55, 0.35, 0.02]} position={[0, 1.1, -0.18]}>
      <meshStandardMaterial color="#4488FF" emissive="#4488FF" emissiveIntensity={0.2} />
    </Box>
  </group>
);

const Chair = ({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <Box args={[0.5, 0.1, 0.5]} position={[0, 0.5, 0]}>
      <meshStandardMaterial color="#1a1a2e" />
    </Box>
    <Box args={[0.5, 0.5, 0.1]} position={[0, 0.75, -0.2]}>
      <meshStandardMaterial color="#1a1a2e" />
    </Box>
    <Cylinder args={[0.05, 0.05, 0.4, 8]} position={[0, 0.2, 0]}>
      <meshStandardMaterial color="#333333" />
    </Cylinder>
  </group>
);

const MeetingTable = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <Box args={[3, 0.1, 1.5]} position={[0, 0.75, 0]}>
      <meshStandardMaterial color="#654321" />
    </Box>
    {[[-1.2, 0, -0.5], [0, 0, -0.5], [1.2, 0, -0.5], [-1.2, 0, 0.5], [0, 0, 0.5], [1.2, 0, 0.5]].map((pos, i) => (
      <Box key={i} args={[0.15, 0.75, 0.15]} position={[pos[0], 0.375, pos[2]]}>
        <meshStandardMaterial color="#4A3728" />
      </Box>
    ))}
  </group>
);

const Whiteboard = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <Box args={[2.5, 1.5, 0.1]} position={[0, 1.5, 0]}>
      <meshStandardMaterial color="#EEEEEE" />
    </Box>
    <Box args={[2.6, 1.6, 0.05]} position={[0, 1.5, -0.05]}>
      <meshStandardMaterial color="#666666" />
    </Box>
  </group>
);

const Plant = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <Cylinder args={[0.2, 0.25, 0.4, 8]} position={[0, 0.2, 0]}>
      <meshStandardMaterial color="#8B4513" />
    </Cylinder>
    <mesh position={[0, 0.6, 0]}>
      <sphereGeometry args={[0.35, 8, 8]} />
      <meshStandardMaterial color="#228B22" />
    </mesh>
  </group>
);

interface OfficeSceneProps {
  npcs: Array<{
    id: number;
    name: string;
    position: [number, number, number];
    color: string;
  }>;
  activeNPC: number | null;
  onNPCClick: (id: number) => void;
}

export default function OfficeScene({ npcs, activeNPC, onNPCClick }: OfficeSceneProps) {
  return (
    <>
      {/* Floor */}
      <Plane args={[30, 30]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#4A5568" />
      </Plane>

      {/* Ceiling */}
      <Plane args={[30, 30]} rotation={[Math.PI / 2, 0, 0]} position={[0, 4, 0]}>
        <meshStandardMaterial color="#E2E8F0" />
      </Plane>

      {/* Walls */}
      <Plane args={[30, 4]} position={[0, 2, -15]}>
        <meshStandardMaterial color="#CBD5E0" />
      </Plane>
      <Plane args={[30, 4]} rotation={[0, Math.PI, 0]} position={[0, 2, 15]}>
        <meshStandardMaterial color="#CBD5E0" />
      </Plane>
      <Plane args={[30, 4]} rotation={[0, Math.PI / 2, 0]} position={[-15, 2, 0]}>
        <meshStandardMaterial color="#CBD5E0" />
      </Plane>
      <Plane args={[30, 4]} rotation={[0, -Math.PI / 2, 0]} position={[15, 2, 0]}>
        <meshStandardMaterial color="#CBD5E0" />
      </Plane>

      {/* Windows on back wall */}
      {[-6, 0, 6].map((x, i) => (
        <Box key={i} args={[3, 2, 0.1]} position={[x, 2.2, -14.9]}>
          <meshStandardMaterial color="#87CEEB" transparent opacity={0.6} />
        </Box>
      ))}

      {/* Desks - workstation area */}
      <Desk position={[-8, 0, -8]} rotation={0} />
      <Chair position={[-8, 0, -7]} rotation={Math.PI} />
      
      <Desk position={[-4, 0, -8]} rotation={0} />
      <Chair position={[-4, 0, -7]} rotation={Math.PI} />
      
      <Desk position={[0, 0, -8]} rotation={0} />
      <Chair position={[0, 0, -7]} rotation={Math.PI} />
      
      <Desk position={[4, 0, -8]} rotation={0} />
      <Chair position={[4, 0, -7]} rotation={Math.PI} />

      {/* Second row of desks */}
      <Desk position={[-8, 0, -4]} rotation={Math.PI} />
      <Chair position={[-8, 0, -5]} rotation={0} />
      
      <Desk position={[-4, 0, -4]} rotation={Math.PI} />
      <Chair position={[-4, 0, -5]} rotation={0} />

      {/* Meeting room area */}
      <MeetingTable position={[8, 0, 0]} />
      <Whiteboard position={[12, 0, 0]} />
      
      {/* Break area */}
      <Box args={[2, 1, 0.8]} position={[-10, 0.5, 8]}>
        <meshStandardMaterial color="#718096" />
      </Box>

      {/* Plants for decoration */}
      <Plant position={[-12, 0, -12]} />
      <Plant position={[12, 0, -12]} />
      <Plant position={[-12, 0, 8]} />

      {/* NPCs */}
      {npcs.map((npc) => (
        <NPC
          key={npc.id}
          position={npc.position}
          color={npc.color}
          name={npc.name}
          isActive={activeNPC === npc.id}
          onClick={() => onNPCClick(npc.id)}
        />
      ))}

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
      <pointLight position={[-8, 3, -8]} intensity={0.5} color="#FFF5E0" />
      <pointLight position={[8, 3, 0]} intensity={0.5} color="#FFF5E0" />
      <pointLight position={[-10, 3, 8]} intensity={0.3} color="#FFF5E0" />
    </>
  );
}
