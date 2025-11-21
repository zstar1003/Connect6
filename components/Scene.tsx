import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { Board } from './Board';
import { Stone } from './Stone';
import { BoardState, Player, Coordinate } from '../types';
import { CELL_SIZE, BOARD_SIZE } from '../constants';

interface SceneProps {
  board: BoardState;
  hoverPos: Coordinate | null;
  currentPlayer: Player;
  lastMove: Coordinate | null;
  lastMoves: Coordinate[]; // All stones placed in current turn
  onCellClick: (row: number, col: number) => void;
  onCellHover: (row: number, col: number) => void;
  winningLine: Coordinate[] | null;
  resetCameraTrigger: number;
}

// Helper component to handle controls reset
const CameraHandler: React.FC<{ trigger: number }> = ({ trigger }) => {
  const controlsRef = useRef<any>(null);
  
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, [trigger]);

  return (
    <OrbitControls 
        ref={controlsRef}
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2.2} 
        minDistance={10} 
        maxDistance={40} 
        enablePan={true}
        dampingFactor={0.05}
        makeDefault
    />
  );
};

export const Scene: React.FC<SceneProps> = ({
  board,
  hoverPos,
  currentPlayer,
  lastMove,
  lastMoves,
  onCellClick,
  onCellHover,
  winningLine,
  resetCameraTrigger
}) => {
  const offset = (BOARD_SIZE - 1) * CELL_SIZE / 2;

  const getPosition = (row: number, col: number): [number, number, number] => {
    const x = col * CELL_SIZE - offset;
    const z = row * CELL_SIZE - offset;
    return [x, 0.2, z];
  };

  return (
    <div className="w-full h-full absolute top-0 left-0 z-0">
      <Canvas shadows dpr={[1, 2]}>
        {/* Top-Down Camera View - defined as default position */}
        <PerspectiveCamera makeDefault position={[0, 25, 0]} fov={45} />
        
        <CameraHandler trigger={resetCameraTrigger} />
        
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.8}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
          shadow-camera-near={0.1}
          shadow-camera-far={50}
          shadow-bias={-0.0001}
        />
        <Environment preset="city" />

        {/* Game Objects */}
        <group>
            <Board onCellClick={onCellClick} onCellHover={onCellHover} />
            
            {/* Render Placed Stones */}
            {Array.from(board.entries()).map(([key, player]) => {
                const [row, col] = key.split(',').map(Number);
                // Check if this stone is in the lastMoves array (current turn)
                const isInCurrentTurn = lastMoves.some(move => move.row === row && move.col === col);
                return (
                    <Stone
                        key={key}
                        position={getPosition(row, col)}
                        player={player}
                        isLastMove={isInCurrentTurn}
                    />
                );
            })}

            {/* Render Ghost Stone */}
            {hoverPos && currentPlayer !== Player.None && (
                <Stone 
                    position={getPosition(hoverPos.row, hoverPos.col)} 
                    player={currentPlayer} 
                    isGhost 
                />
            )}

            {/* Winning Line Highlight */}
            {winningLine && (
                <group>
                  {winningLine.map((pos, idx) => {
                     const [x, y, z] = getPosition(pos.row, pos.col);
                     return (
                        <mesh key={`win-${idx}`} position={[x, 0.6, z]}>
                             <sphereGeometry args={[0.2]} />
                             <meshBasicMaterial color="#ffd700" toneMapped={false} />
                        </mesh>
                     )
                  })}
                </group>
            )}
        </group>
      </Canvas>
    </div>
  );
};