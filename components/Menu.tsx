
import React, { useState, useEffect } from 'react';
import { GameMode, Player, GameStatus, RoomInfo } from '../types';
import { WIN_COUNT } from '../constants';

interface MenuProps {
  status: GameStatus;
  gameMode: GameMode;
  currentPlayer: Player;
  localPlayer: Player; // For network games
  winner: Player | null;
  myId: string;
  rooms: RoomInfo[];
  onStartLocal: () => void;
  onStartAI: () => void;
  onHost: () => void;
  onJoin: (id: string) => void;
  onRestart: () => void;
  onLeave: () => void;
  onScanRooms: () => void;
  onHostPublic: (roomId: string) => void;
}

export const Menu: React.FC<MenuProps> = ({
  status,
  gameMode,
  currentPlayer,
  localPlayer,
  winner,
  myId,
  rooms,
  onStartLocal,
  onStartAI,
  onHost,
  onJoin,
  onRestart,
  onLeave,
  onScanRooms,
  onHostPublic
}) => {
  const [menuView, setMenuView] = useState<'main' | 'lobby'>('main');
  const [joinId, setJoinId] = useState('');
  const [copied, setCopied] = useState(false);

  // Auto-scan when entering lobby
  useEffect(() => {
      if (menuView === 'lobby') {
          onScanRooms();
      }
  }, [menuView]);

  const copyId = () => {
    navigator.clipboard.writeText(myId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === GameStatus.Menu) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
        <div className="bg-stone-900 p-8 rounded-2xl border border-stone-700 shadow-2xl max-w-md w-full relative overflow-hidden">
          
          {/* Header */}
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-600 mb-2 text-center">
            Connect 6 Master
          </h1>
          <p className="text-stone-400 text-center mb-6 text-sm">
            First to connect {WIN_COUNT} stones wins.
          </p>

          {/* Main View */}
          {menuView === 'main' && (
            <div className="space-y-4 animate-in slide-in-from-left duration-300">
              <button 
                onClick={onStartAI}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-lg transition shadow-lg transform hover:scale-[1.02]"
              >
                Play vs CPU
              </button>

              <button 
                onClick={onStartLocal}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-lg transition shadow-lg transform hover:scale-[1.02]"
              >
                Local 1v1
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-stone-700"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-stone-900 px-2 text-stone-500">Online Multiplayer</span></div>
              </div>

              <button 
                onClick={() => setMenuView('lobby')}
                className="w-full py-3 px-4 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-amber-100 font-semibold rounded-lg transition group flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:text-amber-400 transition"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Online Lobby
              </button>
            </div>
          )}

          {/* Lobby View */}
          {menuView === 'lobby' && (
            <div className="animate-in slide-in-from-right duration-300 h-[400px] flex flex-col">
               <div className="flex items-center justify-between mb-4">
                   <button onClick={() => setMenuView('main')} className="text-stone-400 hover:text-white text-sm flex items-center gap-1">
                     ← Back
                   </button>
                   <button onClick={onScanRooms} className="text-amber-500 hover:text-amber-400 text-sm flex items-center gap-1">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                     Refresh
                   </button>
               </div>

               <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  <div className="text-xs text-stone-500 font-semibold uppercase mb-2 sticky top-0 bg-stone-900 py-1">Public Rooms</div>
                  {rooms.map((room) => (
                      <div key={room.id} className="bg-stone-950/50 border border-stone-800 rounded-lg p-3 flex items-center justify-between hover:border-stone-700 transition">
                          <div className="flex flex-col">
                              <span className="text-stone-300 font-medium text-sm">{room.name}</span>
                              <div className="flex items-center gap-1.5 mt-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                      room.status === 'online' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 
                                      room.status === 'checking' ? 'bg-yellow-500 animate-pulse' : 
                                      room.status === 'unknown' ? 'bg-stone-600' :
                                      'bg-stone-700'
                                  }`}></div>
                                  <span className="text-[10px] text-stone-500 uppercase tracking-wide">
                                      {room.status === 'online' ? 'Online' : 
                                       room.status === 'checking' ? 'Scanning...' : 
                                       room.status === 'unknown' ? 'Wait' : 'Empty'}
                                  </span>
                              </div>
                          </div>
                          <div>
                              {room.status === 'online' ? (
                                  <button 
                                    onClick={() => onJoin(room.id)}
                                    className="px-3 py-1.5 bg-green-900/30 hover:bg-green-900/50 text-green-400 text-xs font-bold rounded border border-green-800/50 transition"
                                  >
                                    JOIN
                                  </button>
                              ) : room.status === 'offline' ? (
                                  <button 
                                    onClick={() => onHostPublic(room.id)}
                                    className="px-3 py-1.5 bg-stone-800 hover:bg-amber-900/30 text-stone-400 hover:text-amber-500 text-xs font-bold rounded border border-stone-700 hover:border-amber-800/50 transition"
                                  >
                                    HOST
                                  </button>
                              ) : (
                                  <span className="px-3 py-1.5 text-stone-600 text-xs font-bold">...</span>
                              )}
                          </div>
                      </div>
                  ))}
               </div>

               <div className="mt-4 pt-4 border-t border-stone-800">
                  <div className="text-xs text-stone-500 font-semibold uppercase mb-2">Private Game</div>
                  <div className="flex gap-2">
                      <button onClick={onHost} className="flex-1 py-2 bg-stone-800 hover:bg-stone-700 rounded text-xs font-bold text-stone-300 border border-stone-700">
                          Host Private
                      </button>
                      <div className="flex-[1.5] flex gap-1">
                          <input 
                            placeholder="ID..." 
                            className="w-full bg-stone-950 border border-stone-700 rounded px-2 text-xs text-stone-300 focus:border-amber-500 focus:outline-none"
                            value={joinId}
                            onChange={(e) => setJoinId(e.target.value)}
                          />
                          <button onClick={() => onJoin(joinId)} disabled={!joinId} className="px-3 bg-stone-800 hover:bg-stone-700 rounded text-xs font-bold text-stone-300 border border-stone-700 disabled:opacity-50">
                              Join
                          </button>
                      </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // HUD logic remains mostly the same
  return (
    <>
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none z-10">
        <div className="bg-black/50 backdrop-blur-md rounded-lg p-4 text-white border border-white/10 pointer-events-auto shadow-lg">
          <div className="text-xs text-stone-400 uppercase tracking-wider mb-1">Current Turn</div>
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${currentPlayer === Player.Black ? 'bg-black border border-gray-600' : 'bg-white'}`}></div>
            <span className="font-bold text-xl">
              {currentPlayer === Player.Black ? 'Black' : 'White'}
            </span>
          </div>
          {gameMode !== GameMode.Local && gameMode !== GameMode.AI && (
            <div className="mt-2 text-xs text-stone-500">
              Playing as: {localPlayer === Player.Black ? 'Black' : 'White'}
            </div>
          )}
          {gameMode === GameMode.AI && (
             <div className="mt-2 text-xs text-indigo-300">
                Mode: vs CPU
             </div>
          )}
        </div>

        {gameMode !== GameMode.Local && gameMode !== GameMode.AI && (
           <div className="bg-black/50 backdrop-blur-md rounded-lg p-3 text-white border border-white/10 pointer-events-auto flex flex-col items-end">
             <div className="text-xs text-stone-400 mb-1">Room ID</div>
             <div className="flex items-center gap-2">
               <code className="bg-black/50 px-2 py-1 rounded text-amber-200 select-all max-w-[150px] truncate">{myId}</code>
               <button onClick={copyId} className="text-xs hover:text-white text-stone-400">
                 {copied ? 'Copied!' : 'Copy'}
               </button>
             </div>
           </div>
        )}
      </div>

      {/* Game Over Modal */}
      {status === GameStatus.Ended && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
          <div className="bg-stone-900 p-8 rounded-2xl border border-amber-500/30 shadow-2xl text-center animate-in fade-in zoom-in duration-300">
            <h2 className="text-5xl font-black text-white mb-2">
              {winner === Player.Black ? 'Black' : 'White'} Wins!
            </h2>
            <p className="text-stone-400 mb-8">Victory achieved by connecting {WIN_COUNT} stones.</p>
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={onRestart}
                className="py-3 px-8 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-full shadow-lg transition hover:scale-105"
              >
                Play Again
              </button>
              <button 
                onClick={onLeave}
                className="py-3 px-8 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-full transition"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Back Button (bottom right) */}
      <div className="absolute bottom-4 right-4 z-10">
          <button 
            onClick={onLeave}
            className="bg-black/40 hover:bg-red-900/80 backdrop-blur text-white/70 hover:text-white px-4 py-2 rounded-lg transition text-sm border border-white/10"
          >
            Exit Game
          </button>
      </div>
    </>
  );
};
