
import React, { useState, useEffect, useRef } from 'react';
import { Scene } from './components/Scene';
import { Menu } from './components/Menu';
import { 
  Player, 
  GameMode, 
  GameStatus, 
  BoardState, 
  Coordinate,
  RoomInfo
} from './types';
import { getKey, isValidMove, checkWin } from './utils/gameLogic';
import { getBestMove } from './utils/ai';
import { PeerService } from './services/PeerService';

// Predefined room IDs for the lobby
const PUBLIC_ROOM_COUNT = 5;
const BASE_ROOM_ID = 'connect6-3d-public-room-';

const App: React.FC = () => {
  // Game State
  const [status, setStatus] = useState<GameStatus>(GameStatus.Menu);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.Local);
  const [board, setBoard] = useState<BoardState>(new Map());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.Black);
  const [winner, setWinner] = useState<Player | null>(null);
  const [winningLine, setWinningLine] = useState<Coordinate[] | null>(null);
  const [lastMove, setLastMove] = useState<Coordinate | null>(null);
  const [hoverPos, setHoverPos] = useState<Coordinate | null>(null);
  const [resetCameraFlag, setResetCameraFlag] = useState(0);

  // Network State
  const [myId, setMyId] = useState<string>('');
  const [localPlayerRole, setLocalPlayerRole] = useState<Player>(Player.Black); 
  const peerService = useRef<PeerService | null>(null);

  // Lobby State
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  
  // Lock for AI turn
  const [isAITurn, setIsAITurn] = useState(false);

  // Initialize Room List
  useEffect(() => {
      const initialRooms: RoomInfo[] = [];
      for (let i = 1; i <= PUBLIC_ROOM_COUNT; i++) {
          initialRooms.push({
              id: `${BASE_ROOM_ID}${i}`,
              name: `Public Room ${i}`,
              status: 'unknown'
          });
      }
      setRooms(initialRooms);
  }, []);

  // --- Game Logic ---

  const resetGame = () => {
    setBoard(new Map());
    setCurrentPlayer(Player.Black);
    setWinner(null);
    setWinningLine(null);
    setLastMove(null);
    setIsAITurn(false);
    setStatus(GameStatus.Playing);
  };

  const handleWin = (player: Player, line: Coordinate[]) => {
    setWinner(player);
    setWinningLine(line);
    setStatus(GameStatus.Ended);
  };

  const executeMove = (row: number, col: number, player: Player) => {
    const key = getKey(row, col);
    if (board.has(key)) return;

    setBoard(prev => {
      const newBoard = new Map(prev);
      newBoard.set(key, player);
      return newBoard;
    });
    
    const moveCoord = { row, col };
    setLastMove(moveCoord);

    const tempBoard = new Map<string, Player>(board);
    tempBoard.set(key, player);
    
    const winLine = checkWin(tempBoard, moveCoord, player);
    
    if (winLine) {
      handleWin(player, winLine);
      return;
    }

    const nextPlayer = player === Player.Black ? Player.White : Player.Black;
    setCurrentPlayer(nextPlayer);
  };

  // AI Turn Effect
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (status === GameStatus.Playing && gameMode === GameMode.AI && currentPlayer === Player.White && !isAITurn && !winner) {
        setIsAITurn(true);
        timer = setTimeout(() => {
            try {
                const aiMove = getBestMove(board, Player.White);
                if (aiMove && aiMove.row >= 0 && aiMove.col >= 0) {
                    executeMove(aiMove.row, aiMove.col, Player.White);
                }
            } catch (e) {
                console.error("AI Execution Error", e);
            } finally {
                setIsAITurn(false);
            }
        }, 500);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [status, gameMode, currentPlayer, board, isAITurn, winner]);

  const onCellClick = (row: number, col: number) => {
    if (status !== GameStatus.Playing) return;
    if (!isValidMove(board, row, col)) return;
    if (gameMode === GameMode.AI && isAITurn) return;
    if (gameMode !== GameMode.Local && gameMode !== GameMode.AI) {
      if (currentPlayer !== localPlayerRole) return;
    }

    executeMove(row, col, currentPlayer);

    if ((gameMode === GameMode.OnlineHost || gameMode === GameMode.OnlineJoin) && peerService.current) {
      peerService.current.send({
        type: 'move',
        payload: { row, col, player: currentPlayer }
      });
    }
  };

  const onCellHover = (row: number, col: number) => {
    if (row === -1) {
        setHoverPos(null);
        return;
    }
    
    if (status === GameStatus.Playing && isValidMove(board, row, col)) {
       let canInteract = false;
       if (gameMode === GameMode.Local) canInteract = true;
       if (gameMode === GameMode.AI && currentPlayer === Player.Black && !isAITurn) canInteract = true;
       if ((gameMode === GameMode.OnlineHost || gameMode === GameMode.OnlineJoin) && currentPlayer === localPlayerRole) canInteract = true;

       if (canInteract) setHoverPos({ row, col });
       else setHoverPos(null);
    } else {
      setHoverPos(null);
    }
  };

  // --- Network & Lobby Handlers ---

  const initPeerWithLogic = (mode: GameMode, specificId?: string) => {
      if (peerService.current) peerService.current.destroy();

      peerService.current = new PeerService({
        onOpen: (id) => {
          setMyId(id);
          if (mode === GameMode.OnlineHost) setLocalPlayerRole(Player.Black);
        },
        onData: (data: any) => {
          if (data.type === 'connected') {
             if (mode === GameMode.OnlineHost) {
                 resetGame();
                 peerService.current?.send({ type: 'start' });
             }
          }
          else if (data.type === 'move') {
            executeMove(data.payload.row, data.payload.col, data.payload.player);
          } 
          else if (data.type === 'start') {
             setLocalPlayerRole(Player.White);
             resetGame();
          } 
          else if (data.type === 'restart') {
             resetGame();
          }
        },
        onClose: () => {
           setStatus(GameStatus.Menu); 
        },
        onError: (errStr) => {
            if (errStr === 'ID_TAKEN') {
                alert("This Public Room is already occupied by someone else.");
                scanRooms(); // Refresh status
            } else if (errStr === 'PEER_NOT_FOUND') {
                alert("Could not connect to room. The host may have disconnected.");
                scanRooms();
            } else {
                console.warn("Network Error:", errStr);
            }
        }
      });

      peerService.current.init(specificId);
  };

  const startLocalGame = () => {
    setGameMode(GameMode.Local);
    resetGame();
  };

  const startAIGame = () => {
    setGameMode(GameMode.AI);
    resetGame();
    setLocalPlayerRole(Player.Black);
  }

  const handleHostPrivate = () => {
      setGameMode(GameMode.OnlineHost);
      initPeerWithLogic(GameMode.OnlineHost); // Random ID
  };

  const handleHostPublic = (roomId: string) => {
      setGameMode(GameMode.OnlineHost);
      initPeerWithLogic(GameMode.OnlineHost, roomId);
  };

  const handleJoin = (id: string) => {
      setGameMode(GameMode.OnlineJoin);
      
      if (peerService.current) peerService.current.destroy();
      
      peerService.current = new PeerService({
          onOpen: (_myId) => {
              setMyId(_myId);
              peerService.current?.connect(id);
          },
          onData: (data: any) => {
             if (data.type === 'start') {
                 setLocalPlayerRole(Player.White);
                 resetGame();
             } else if (data.type === 'move') {
                 executeMove(data.payload.row, data.payload.col, data.payload.player);
             } else if (data.type === 'restart') {
                 resetGame();
             }
          },
          onClose: () => setStatus(GameStatus.Menu),
          onError: (err) => {
             alert(err === 'PEER_NOT_FOUND' ? "Room not found. Host might be offline." : err);
          }
      });
      peerService.current.init();
  };

  const handleRestart = () => {
      resetGame();
      if ((gameMode === GameMode.OnlineHost || gameMode === GameMode.OnlineJoin) && peerService.current) {
          peerService.current.send({ type: 'restart' });
      }
  };

  const handleLeave = () => {
      if (peerService.current) peerService.current.destroy();
      setStatus(GameStatus.Menu);
      setGameMode(GameMode.Local);
      setBoard(new Map());
  };

  const scanRooms = async () => {
      // Set all to checking
      setRooms(prev => prev.map(r => ({...r, status: 'checking'})));

      // Check sequentially to be gentle on the network
      const newRooms = [...rooms];
      
      for (let i = 0; i < newRooms.length; i++) {
          const room = newRooms[i];
          try {
              const status = await PeerService.checkRoomStatus(room.id);
              newRooms[i] = { ...room, status: status };
              // Partial update to UI
              setRooms([...newRooms]);
          } catch (e) {
              newRooms[i] = { ...room, status: 'offline' };
              setRooms([...newRooms]);
          }
      }
  };

  return (
    <div className="relative w-full h-full bg-stone-900">
      <Scene 
        board={board}
        hoverPos={hoverPos}
        currentPlayer={currentPlayer}
        lastMove={lastMove}
        onCellClick={onCellClick}
        onCellHover={onCellHover}
        winningLine={winningLine}
        resetCameraTrigger={resetCameraFlag}
      />
      
      <Menu 
        status={status}
        gameMode={gameMode}
        currentPlayer={currentPlayer}
        localPlayer={localPlayerRole}
        winner={winner}
        myId={myId}
        rooms={rooms}
        onStartLocal={startLocalGame}
        onStartAI={startAIGame}
        onHost={handleHostPrivate}
        onHostPublic={handleHostPublic}
        onJoin={handleJoin}
        onRestart={handleRestart}
        onLeave={handleLeave}
        onScanRooms={scanRooms}
      />

      {/* Reset View Button */}
      {status === GameStatus.Playing && (
        <div className="absolute bottom-4 left-4 z-10 flex gap-2">
            <button 
                onClick={() => setResetCameraFlag(f => f + 1)}
                className="flex items-center gap-2 bg-stone-800/80 hover:bg-stone-700 text-amber-100/80 hover:text-amber-100 px-4 py-2 rounded-lg transition text-sm border border-white/10 backdrop-blur shadow-lg"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                </svg>
                Reset View
            </button>
            {gameMode === GameMode.AI && isAITurn && (
                <div className="flex items-center gap-2 bg-indigo-900/80 text-white px-4 py-2 rounded-lg text-sm border border-white/10 backdrop-blur shadow-lg animate-pulse">
                   Thinking...
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default App;
