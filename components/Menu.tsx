
import React, { useState, useEffect } from 'react';
import { GameMode, Player, GameStatus } from '../types';
import { WIN_COUNT } from '../constants';

interface MenuProps {
  status: GameStatus;
  gameMode: GameMode;
  currentPlayer: Player;
  localPlayer: Player; // For network games
  winner: Player | null;
  myId: string;
  onStartLocal: () => void;
  onStartAI: () => void;
  onHost: () => void;
  onJoin: (id: string) => void;
  onRestart: () => void;
  onLeave: () => void;
}

export const Menu: React.FC<MenuProps> = ({
  status,
  gameMode,
  currentPlayer,
  localPlayer,
  winner,
  myId,
  onStartLocal,
  onStartAI,
  onHost,
  onJoin,
  onRestart,
  onLeave,
}) => {
  const [menuView, setMenuView] = useState<'main' | 'lobby'>('main');
  const [joinId, setJoinId] = useState('');
  const [copied, setCopied] = useState(false);

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
                Play vs Computer
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
            <div className="animate-in slide-in-from-right duration-300">
               <div className="flex items-center justify-between mb-6">
                   <button onClick={() => setMenuView('main')} className="text-stone-400 hover:text-white text-sm flex items-center gap-1">
                     ← Back
                   </button>
               </div>

               {/* Host Section */}
               <div className="bg-gradient-to-br from-stone-950 to-stone-900 border border-stone-700 rounded-xl p-5 mb-5 shadow-lg">
                  <div className="text-xs text-stone-500 font-semibold uppercase mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Host a Room
                  </div>

                  {myId ? (
                    <>
                      <div className="text-stone-400 text-sm mb-3">
                        Share this Room ID with others to let them join:
                      </div>
                      <div className="flex items-center gap-2 bg-black/50 p-3 rounded-lg border border-stone-800">
                        <code className="flex-1 text-amber-300 font-mono text-sm select-all break-all">
                          {myId}
                        </code>
                        <button
                          onClick={copyId}
                          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 rounded text-xs font-bold text-stone-300 border border-stone-700 transition whitespace-nowrap"
                        >
                          {copied ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="mt-3 text-xs text-stone-500 flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                        <span>Waiting for another player to join...</span>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={onHost}
                      className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-lg transition shadow-lg transform hover:scale-[1.02]"
                    >
                      Create Room
                    </button>
                  )}
               </div>

               {/* Divider */}
               <div className="relative py-3">
                 <div className="absolute inset-0 flex items-center">
                   <span className="w-full border-t border-stone-700"></span>
                 </div>
                 <div className="relative flex justify-center text-xs uppercase">
                   <span className="bg-stone-900 px-3 text-stone-500">or</span>
                 </div>
               </div>

               {/* Join Section */}
               <div className="bg-gradient-to-br from-stone-950 to-stone-900 border border-stone-700 rounded-xl p-5 shadow-lg">
                  <div className="text-xs text-stone-500 font-semibold uppercase mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    Join a Room
                  </div>

                  <div className="text-stone-400 text-sm mb-3">
                    Enter the host's Room ID to join their game:
                  </div>

                  <div className="flex gap-2">
                    <input
                      placeholder="Paste Room ID here..."
                      className="flex-1 bg-black/50 border border-stone-700 rounded-lg px-4 py-2.5 text-sm text-stone-300 placeholder-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      value={joinId}
                      onChange={(e) => setJoinId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && joinId && onJoin(joinId)}
                    />
                    <button
                      onClick={() => onJoin(joinId)}
                      disabled={!joinId}
                      className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-stone-800 disabled:to-stone-800 rounded-lg text-sm font-bold text-white disabled:text-stone-600 border border-green-800 disabled:border-stone-700 transition disabled:cursor-not-allowed"
                    >
                      Join
                    </button>
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
                Mode: vs Computer
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
