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
    from: isGhost ? { scale: 1, y: position[1] } : { scale: 0, y: 5 },
    to: { scale: 1, y: position[1] },
    config: { mass: 1, tension: 280, friction: 60 },
    immediate: isGhost
  });

  // Pulsing glow animation for last move indicator
  const { glowScale, glowOpacity } = useSpring({
    from: { glowScale: 1.2, glowOpacity: 0.4 },
    to: async (next) => {
      while (isLastMove && !isGhost) {
        await next({ glowScale: 1.35, glowOpacity: 0.6 });
        await next({ glowScale: 1.2, glowOpacity: 0.3 });
      }
    },
    config: { duration: 1500 },
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

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Stone Body */}
      {isGhost ? (
        <mesh
          position-y={position[1]}
          scale={[1, FLATTEN_RATIO, 1]}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[RADIUS, 32, 24]} />
          <primitive object={material} attach="material" />
        </mesh>
      ) : (
        <animated.mesh
          position-y={y}
          scale={scale.to(s => [s, s * FLATTEN_RATIO, s])}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[RADIUS, 32, 24]} />
          <primitive object={material} attach="material" />
        </animated.mesh>
      )}
      
      {/* Last Move Indicator - Glowing Effect */}
      {isLastMove && !isGhost && (
        <>
          {/* Outer Glow - Larger transparent sphere with pulse */}
          <animated.mesh
            position={[0, position[1], 0]}
            scale={glowScale.to(s => [s, s * FLATTEN_RATIO, s])}
          >
            <sphereGeometry args={[RADIUS, 32, 24]} />
            <animated.meshBasicMaterial
              color="#60a5fa"
              transparent
              opacity={glowOpacity.to(o => o * 0.5)}
              side={THREE.BackSide}
            />
          </animated.mesh>

          {/* Inner Glow - Medium transparent sphere */}
          <animated.mesh
            position={[0, position[1], 0]}
            scale={glowScale.to(s => [(s + 1) / 2, ((s + 1) / 2) * FLATTEN_RATIO, (s + 1) / 2])}
          >
            <sphereGeometry args={[RADIUS, 32, 24]} />
            <animated.meshBasicMaterial
              color="#3b82f6"
              transparent
              opacity={glowOpacity}
            />
          </animated.mesh>
        </>
      )}
    </group>
  );
};