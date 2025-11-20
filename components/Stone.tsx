import React, { useMemo } from 'react';
import { useSpring, animated } from '@react-spring/three';
import { Player } from '../types';
import { CELL_SIZE, COLOR_BLACK_STONE, COLOR_WHITE_STONE } from '../constants';
import * as THREE from 'three';

interface StoneProps {
  position: [number, number, number];
  player: Player;
  isLastMove?: boolean;
  isGhost?: boolean;
}

export const Stone: React.FC<StoneProps> = ({ position, player, isLastMove, isGhost }) => {
  const color = player === Player.Black ? COLOR_BLACK_STONE : COLOR_WHITE_STONE;
  
  // Real stones are flattened spheres (oblate spheroids/lenticular).
  // We increase the base radius to fill the cell nicely, then flatten the Y axis.
  const FLATTEN_RATIO = 0.42; 
  const RADIUS = CELL_SIZE * 0.48;

  const { scale, y } = useSpring({
    from: { scale: 0, y: 5 },
    to: { scale: 1, y: position[1] },
    config: { mass: 1, tension: 280, friction: 60 },
    delay: isGhost ? 0 : 0,
    immediate: isGhost
  });

  const material = useMemo(() => {
    if (isGhost) {
      return new THREE.MeshStandardMaterial({
        color: color,
        opacity: 0.5,
        transparent: true,
        roughness: 0.3,
      });
    }
    return new THREE.MeshPhysicalMaterial({
      color: color,
      roughness: player === Player.Black ? 0.65 : 0.1, // Slate (matte) vs Shell (glossy)
      metalness: 0.05,
      clearcoat: player === Player.White ? 0.8 : 0.1,
      clearcoatRoughness: 0.15,
      reflectivity: 0.5,
    });
  }, [player, isGhost, color]);

  // Calculate height offset for the marker based on flattened geometry
  // Center Y is at position[1] (0.2), Height radius is RADIUS * FLATTEN_RATIO (~0.2)
  // Top of stone is ~0.4. Marker at 0.45 sits just above.
  const markerY = CELL_SIZE * 0.45;

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Stone Body */}
      <animated.mesh
        position-y={isGhost ? position[1] : y}
        // Apply non-uniform scale to create the lenticular shape [1, 0.42, 1]
        scale={isGhost 
          ? [1, FLATTEN_RATIO, 1] 
          : scale.to(s => [s, s * FLATTEN_RATIO, s])
        }
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[RADIUS, 32, 24]} />
        <primitive object={material} attach="material" />
      </animated.mesh>
      
      {/* Last Move Indicator */}
      {isLastMove && !isGhost && (
        <mesh position={[0, markerY, 0]}>
          <ringGeometry args={[0.1, 0.15, 32]} />
          <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
};