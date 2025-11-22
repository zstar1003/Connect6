import React, { useState, useEffect, useRef } from 'react';
import { Scene } from './components/Scene';
import { Menu } from './components/Menu';
import { DebugLogger } from './components/DebugLogger';
import {
  Player,
  GameMode,
  GameStatus,
  BoardState,
  Coordinate,
  AIDifficulty
} from './types';
import { getKey, isValidMove, checkWin } from './utils/gameLogic';
import { getBestMove } from './utils/ai';
import { PeerService } from './services/PeerService';
import { soundManager } from './utils/soundManager';
import { roomService, RoomInfo } from './services/RoomService';
import { useLanguage } from './i18n/LanguageContext';

const App: React.FC = () => {
  const { t } = useLanguage();

  // Game State
  const [status, setStatus] = useState<GameStatus>(GameStatus.Menu);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.Local);
  const [board, setBoard] = useState<BoardState>(new Map());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.Black);
  const [winner, setWinner] = useState<Player | null>(null);
  const [winningLine, setWinningLine] = useState<Coordinate[] | null>(null);
  const [lastMove, setLastMove] = useState<Coordinate | null>(null);
  const [lastMoves, setLastMoves] = useState<Coordinate[]>([]); // Track all stones placed in current turn
  const [hoverPos, setHoverPos] = useState<Coordinate | null>(null);
  const [resetCameraFlag, setResetCameraFlag] = useState(0);

  // Connect-6 rule: track stones placed in current turn
  const [stonesPlacedThisTurn, setStonesPlacedThisTurn] = useState(0);
  const [isFirstMove, setIsFirstMove] = useState(true); // First move only places 1 stone

  // Network State
  const [myId, setMyId] = useState<string>('');
  const [localPlayerRole, setLocalPlayerRole] = useState<Player>(Player.Black);
  const peerService = useRef<PeerService | null>(null);
  const [restartRequested, setRestartRequested] = useState(false); // Track if opponent requested restart
  const [waitingForOpponent, setWaitingForOpponent] = useState(false); // Track if we're waiting for opponent's restart confirmation
  const [availableRooms, setAvailableRooms] = useState<RoomInfo[]>([]); // Available rooms list

  // Lock for AI turn
  const [isAITurn, setIsAITurn] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>(AIDifficulty.Hard);

  // Ref to always get latest board in AI effect
  const boardRef = useRef<BoardState>(board);
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  // Refresh room list manually (no auto-polling)
  const refreshRoomList = async () => {
    const rooms = await roomService.getAllRooms();
    setAvailableRooms(rooms);
  };

  // Cleanup room service on unmount
  useEffect(() => {
    return () => {
      roomService.cleanup();
    };
  }, []);

  // --- Game Logic ---

  const resetGame = () => {
    setBoard(new Map());
    setCurrentPlayer(Player.Black);
    setWinner(null);
    setWinningLine(null);
    setLastMove(null);
    setLastMoves([]);
    setIsAITurn(false);
    setStonesPlacedThisTurn(0);
    setIsFirstMove(true);
    setStatus(GameStatus.Playing);
  };

  const handleWin = (player: Player, line: Coordinate[]) => {
    setWinner(player);
    setWinningLine(line);
    setStatus(GameStatus.Ended);

    // Play appropriate sound effect
    if (gameMode === GameMode.Local || gameMode === GameMode.AI) {
      // In local/AI mode, always play win sound
      soundManager.playWin();
    } else if (gameMode === GameMode.OnlineHost || gameMode === GameMode.OnlineJoin) {
      // In online mode, play win if local player won, fail if opponent won
      if (player === localPlayerRole) {
        soundManager.playWin();
      } else {
        soundManager.playFail();
      }
    }

    // Send win message to opponent in online games
    if ((gameMode === GameMode.OnlineHost || gameMode === GameMode.OnlineJoin) && peerService.current) {
      peerService.current.send({
        type: 'win',
        payload: { winner: player, line }
      });
    }
  };

  const executeMove = (row: number, col: number, player: Player, isRemoteMove: boolean = false) => {
    const key = getKey(row, col);
    if (board.has(key)) return;

    // If this is the first stone of a new turn, clear previous turn's highlights
    // BUT: In online mode, only clear when it's a local move (not a remote move)
    // Remote moves will be handled by the network sync logic
    if (stonesPlacedThisTurn === 0 && !isRemoteMove) {
      setLastMoves([]);
    }

    // Play stone placement sound
    soundManager.playPlaceStone();

    setBoard(prev => {
      const newBoard = new Map(prev);
      newBoard.set(key, player);
      return newBoard;
    });

    const moveCoord = { row, col };
    setLastMove(moveCoord);

    // Add to lastMoves array for this turn
    setLastMoves(prev => [...prev, moveCoord]);

    const tempBoard = new Map<string, Player>(board);
    tempBoard.set(key, player);

    const winLine = checkWin(tempBoard, moveCoord, player);

    if (winLine) {
      handleWin(player, winLine);
      return;
    }

    // Connect-6 rule: determine stones per turn
    const stonesPerTurn = isFirstMove ? 1 : 2;
    const newStonesPlaced = stonesPlacedThisTurn + 1;

    if (newStonesPlaced >= stonesPerTurn) {
      // Turn complete, switch player
      const nextPlayer = player === Player.Black ? Player.White : Player.Black;
      setCurrentPlayer(nextPlayer);
      setStonesPlacedThisTurn(0);
      setIsFirstMove(false);
      // lastMoves will be cleared when next player places first stone
    } else {
      // Same player continues
      setStonesPlacedThisTurn(newStonesPlaced);
    }
  };

  // AI Turn Effect - handles AI placing 1 or 2 stones per turn
  useEffect(() => {
    if (status === GameStatus.Playing && gameMode === GameMode.AI && currentPlayer === Player.White && !isAITurn && !winner) {
        setIsAITurn(true);

        const timer = setTimeout(() => {
            try {
                // Clear previous turn's highlights before AI starts
                setLastMoves([]);

                // Determine how many stones AI needs to place
                const stonesToPlace = isFirstMove ? 1 : 2;
                let currentBoard = new Map(boardRef.current);
                const aiMoves: Coordinate[] = [];

                for (let i = 0; i < stonesToPlace; i++) {
                    const aiMove = getBestMove(currentBoard, Player.White, aiDifficulty);
                    if (aiMove && aiMove.row >= 0 && aiMove.col >= 0) {
                        const key = getKey(aiMove.row, aiMove.col);
                        currentBoard.set(key, Player.White);

                        // Play sound for each stone
                        soundManager.playPlaceStone();

                        setBoard(new Map(currentBoard));
                        setLastMove({ row: aiMove.row, col: aiMove.col });

                        // Add to AI's moves for this turn
                        aiMoves.push({ row: aiMove.row, col: aiMove.col });

                        // Check for win
                        const winLine = checkWin(currentBoard, { row: aiMove.row, col: aiMove.col }, Player.White);
                        if (winLine) {
                            setLastMoves(aiMoves); // Set highlights before winning
                            handleWin(Player.White, winLine);
                            setIsAITurn(false);
                            return;
                        }
                    }
                }

                // Update lastMoves with all AI moves
                setLastMoves(aiMoves);

                // Update boardRef for next turn
                boardRef.current = currentBoard;

                // After AI completes its turn, switch to Black
                setCurrentPlayer(Player.Black);
                setStonesPlacedThisTurn(0);
                setIsFirstMove(false);
            } catch (e) {
                console.error("AI Execution Error", e);
            } finally {
                setIsAITurn(false);
            }
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }
  }, [status, gameMode, currentPlayer, winner]);

  const onCellClick = (row: number, col: number) => {
    if (status !== GameStatus.Playing) return;
    if (!isValidMove(board, row, col)) return;
    if (gameMode === GameMode.AI && isAITurn) return;

    // Online game: check if it's this player's turn
    if (gameMode !== GameMode.Local && gameMode !== GameMode.AI) {
      // Simply check if current player matches local player role
      // The turn state synchronization is handled by executeMove and network messages
      if (currentPlayer !== localPlayerRole) return;
    }

    executeMove(row, col, currentPlayer);

    if ((gameMode === GameMode.OnlineHost || gameMode === GameMode.OnlineJoin) && peerService.current) {
      // Calculate what the state will be after this move
      const stonesPerTurn = isFirstMove ? 1 : 2;
      const newStonesPlaced = stonesPlacedThisTurn + 1;
      const turnComplete = newStonesPlaced >= stonesPerTurn;

      // Get current turn's moves (will include the stone we just placed)
      const currentTurnMoves = [...lastMoves, { row, col }];

      peerService.current.send({
        type: 'move',
        payload: {
          row,
          col,
          player: currentPlayer,
          stonesPlacedThisTurn: newStonesPlaced,
          isFirstMove: isFirstMove,
          turnComplete: turnComplete, // Tell opponent if turn is complete
          nextPlayer: turnComplete ? (currentPlayer === Player.Black ? Player.White : Player.Black) : currentPlayer,
          currentTurnMoves: currentTurnMoves // Send all stones placed in current turn
        }
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

  const handleHost = () => {
      setGameMode(GameMode.OnlineHost);

      if (peerService.current) peerService.current.destroy();

      peerService.current = new PeerService({
        onOpen: async (id) => {
          setMyId(id);
          setLocalPlayerRole(Player.Black);

          // Register room in room service
          await roomService.createRoom(id, 'Host');
          console.log('[Host] Room registered:', id);

          // Enter waiting room
          setStatus(GameStatus.WaitingRoom);
        },
        onData: (data: any) => {
          console.log('[Host] Received data:', data);
          if (data.type === 'connected') {
             console.log('[Host] Client connected, starting game...');
             resetGame();
             // Small delay to ensure client's data handler is ready
             setTimeout(() => {
               peerService.current?.send({ type: 'start' });
               console.log('[Host] Sent start message');
             }, 100);
          }
          else if (data.type === 'move') {
            // Receive move from client with explicit state synchronization
            const { row, col, player, stonesPlacedThisTurn: opponentStonesPlaced, isFirstMove: opponentIsFirstMove, turnComplete, nextPlayer, currentTurnMoves } = data.payload;

            console.log('[Host] Syncing state:', { opponentStonesPlaced, opponentIsFirstMove, turnComplete, nextPlayer, currentTurnMoves });

            // Execute the move on our board (mark as remote move to prevent clearing lastMoves)
            executeMove(row, col, player, true);

            // Force synchronize state with opponent's authoritative state
            // This ensures both players have exactly the same game state
            // Use setTimeout to ensure executeMove's state updates have completed
            setTimeout(() => {
              if (turnComplete) {
                setCurrentPlayer(nextPlayer);
                setStonesPlacedThisTurn(0);
                setIsFirstMove(false);
              } else {
                setCurrentPlayer(player); // Keep same player
                setStonesPlacedThisTurn(opponentStonesPlaced);
                setIsFirstMove(opponentIsFirstMove);
              }
              // Always sync the glow effect with opponent's current turn moves
              // This shows what they just placed, whether turn is complete or not
              if (currentTurnMoves && currentTurnMoves.length > 0) {
                setLastMoves(currentTurnMoves);
              }
              console.log('[Host] State synchronized:', { nextPlayer, opponentStonesPlaced, turnComplete, currentTurnMoves });
            }, 0);
          }
          else if (data.type === 'win') {
            // Receive win notification from client
            setWinner(data.payload.winner);
            setWinningLine(data.payload.line);
            setStatus(GameStatus.Ended);

            // Play appropriate sound
            if (data.payload.winner === localPlayerRole) {
              soundManager.playWin();
            } else {
              soundManager.playFail();
            }
          }
          else if (data.type === 'restart_request') {
            console.log('[Host] Client requested restart');
            if (waitingForOpponent) {
              // Both agreed, restart the game
              console.log('[Host] Both players agreed, restarting...');
              setRestartRequested(false);
              setWaitingForOpponent(false);
              resetGame();
              peerService.current?.send({ type: 'restart' });
            } else {
              // Mark that opponent requested restart
              setRestartRequested(true);
            }
          }
          else if (data.type === 'restart') {
             console.log('[Host] Restart confirmed by client');
             setRestartRequested(false);
             setWaitingForOpponent(false);
             resetGame();
          }
        },
        onClose: () => {
           setStatus(GameStatus.Menu);
           setMyId('');
        },
        onError: (errStr) => {
            alert("Network Error: " + errStr);
            setStatus(GameStatus.Menu);
            setMyId('');
        }
      });

      peerService.current.init(); // Random ID
  };

  const startLocalGame = () => {
    setGameMode(GameMode.Local);
    resetGame();
  };

  const startAIGame = (difficulty: AIDifficulty) => {
    setGameMode(GameMode.AI);
    setAiDifficulty(difficulty);
    resetGame();
    setLocalPlayerRole(Player.Black);
  }

  const handleJoin = (id: string) => {
      console.log('[Client] ========== JOIN GAME ==========');
      console.log('[Client] Joining room:', id);
      setGameMode(GameMode.OnlineJoin);

      if (peerService.current) peerService.current.destroy();

      peerService.current = new PeerService({
          onOpen: (_myId) => {
              console.log('[Client] My ID:', _myId);
              setMyId(_myId);
              console.log('[Client] Connecting to host:', id);
              peerService.current?.connect(id);
          },
          onData: (data: any) => {
             console.log('[Client] <<<< Received data:', data);
             if (data.type === 'start') {
                 console.log('[Client] ✓ Starting game...');
                 setLocalPlayerRole(Player.White);
                 resetGame();
             } else if (data.type === 'move') {
                 // Receive move from host with explicit state synchronization
                 const { row, col, player, stonesPlacedThisTurn: opponentStonesPlaced, isFirstMove: opponentIsFirstMove, turnComplete, nextPlayer, currentTurnMoves } = data.payload;

                 console.log('[Client] Syncing state:', { opponentStonesPlaced, opponentIsFirstMove, turnComplete, nextPlayer, currentTurnMoves });

                 // Execute the move on our board (mark as remote move to prevent clearing lastMoves)
                 executeMove(row, col, player, true);

                 // Force synchronize state with opponent's authoritative state
                 // This ensures both players have exactly the same game state
                 // Use setTimeout to ensure executeMove's state updates have completed
                 setTimeout(() => {
                   if (turnComplete) {
                     setCurrentPlayer(nextPlayer);
                     setStonesPlacedThisTurn(0);
                     setIsFirstMove(false);
                   } else {
                     setCurrentPlayer(player); // Keep same player
                     setStonesPlacedThisTurn(opponentStonesPlaced);
                     setIsFirstMove(opponentIsFirstMove);
                   }
                   // Always sync the glow effect with opponent's current turn moves
                   // This shows what they just placed, whether turn is complete or not
                   if (currentTurnMoves && currentTurnMoves.length > 0) {
                     setLastMoves(currentTurnMoves);
                   }
                   console.log('[Client] State synchronized:', { nextPlayer, opponentStonesPlaced, turnComplete, currentTurnMoves });
                 }, 0);
             } else if (data.type === 'win') {
                 // Receive win notification from host
                 console.log('[Client] Received win:', data.payload);
                 setWinner(data.payload.winner);
                 setWinningLine(data.payload.line);
                 setStatus(GameStatus.Ended);

                 // Play appropriate sound
                 if (data.payload.winner === localPlayerRole) {
                   soundManager.playWin();
                 } else {
                   soundManager.playFail();
                 }
             } else if (data.type === 'restart_request') {
                 console.log('[Client] Host requested restart');
                 if (waitingForOpponent) {
                   // Both agreed, restart the game
                   console.log('[Client] Both players agreed, restarting...');
                   setRestartRequested(false);
                   setWaitingForOpponent(false);
                   resetGame();
                   peerService.current?.send({ type: 'restart' });
                 } else {
                   // Mark that opponent requested restart
                   setRestartRequested(true);
                 }
             } else if (data.type === 'restart') {
                 console.log('[Client] Restart confirmed by host');
                 setRestartRequested(false);
                 setWaitingForOpponent(false);
                 resetGame();
             }
          },
          onClose: () => {
              console.log('[Client] Connection closed');
              setStatus(GameStatus.Menu);
              setMyId('');
          },
          onError: (err) => {
             console.error('[Client] Error:', err);
             alert(err === 'PEER_NOT_FOUND' ? "Room not found. Host might be offline." : err);
             setStatus(GameStatus.Menu);
             setMyId('');
          }
      });
      peerService.current.init();
  };

  const handleRestart = () => {
      if (gameMode === GameMode.OnlineHost || gameMode === GameMode.OnlineJoin) {
          if (restartRequested) {
              // Opponent already requested, so both agreed
              console.log('Both players agreed to restart');
              setRestartRequested(false);
              setWaitingForOpponent(false);
              resetGame();
              peerService.current?.send({ type: 'restart' });
          } else {
              // Send restart request and wait for opponent
              console.log('Sending restart request to opponent');
              setWaitingForOpponent(true);
              peerService.current?.send({ type: 'restart_request' });
          }
      } else {
          // Local or AI game, just restart
          resetGame();
      }
  };

  const handleCloseWinDialog = () => {
      // Close the dialog but keep the game in ended state
      setStatus(GameStatus.EndedDialogClosed);
  };

  const handleLeave = () => {
      if (peerService.current) peerService.current.destroy();

      // Clean up room if hosting
      if (gameMode === GameMode.OnlineHost && myId) {
        roomService.removeRoom(myId);
      }

      setStatus(GameStatus.Menu);
      setGameMode(GameMode.Local);
      setBoard(new Map());
      setMyId('');
  };

  return (
    <div className="relative w-full h-full bg-stone-900">
      <Scene
        board={board}
        hoverPos={hoverPos}
        currentPlayer={currentPlayer}
        lastMove={lastMove}
        lastMoves={lastMoves}
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
        stonesPlacedThisTurn={stonesPlacedThisTurn}
        isFirstMove={isFirstMove}
        restartRequested={restartRequested}
        waitingForOpponent={waitingForOpponent}
        availableRooms={availableRooms}
        onStartLocal={startLocalGame}
        onStartAI={startAIGame}
        onHost={handleHost}
        onJoin={handleJoin}
        onRestart={handleRestart}
        onCloseWinDialog={handleCloseWinDialog}
        onLeave={handleLeave}
        onRefreshRooms={refreshRoomList}
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
                {t.resetView}
            </button>
            {gameMode === GameMode.AI && isAITurn && (
                <div className="flex items-center gap-2 bg-indigo-900/80 text-white px-4 py-2 rounded-lg text-sm border border-white/10 backdrop-blur shadow-lg animate-pulse">
                   {t.thinking}
                </div>
            )}
        </div>
      )}

      {/* Debug Logger - disabled */}
      {/* {import.meta.env.DEV && <DebugLogger />} */}
    </div>
  );
};

export default App;
