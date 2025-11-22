
import React, { useState, useEffect } from 'react';
import { GameMode, Player, GameStatus, AIDifficulty } from '../types';
import { RoomInfo } from '../services/RoomService';
import { WIN_COUNT } from '../constants';
import { useLanguage } from '../i18n/LanguageContext';
import { canUseOnlineMode } from '../utils/environment';

interface MenuProps {
  status: GameStatus;
  gameMode: GameMode;
  currentPlayer: Player;
  localPlayer: Player; // For network games
  winner: Player | null;
  myId: string;
  stonesPlacedThisTurn: number; // For Connect-6 rule
  isFirstMove: boolean; // For Connect-6 rule
  restartRequested: boolean; // Opponent requested restart
  waitingForOpponent: boolean; // Waiting for opponent to confirm restart
  availableRooms: RoomInfo[]; // Available rooms list
  onStartLocal: () => void;
  onStartAI: (difficulty: AIDifficulty) => void;
  onHost: (roomName?: string) => void;
  onJoin: (id: string) => void;
  onRestart: () => void;
  onCloseWinDialog: () => void;
  onLeave: () => void;
  onRefreshRooms: () => void;
}

export const Menu: React.FC<MenuProps> = ({
  status,
  gameMode,
  currentPlayer,
  localPlayer,
  winner,
  myId,
  stonesPlacedThisTurn,
  isFirstMove,
  restartRequested,
  waitingForOpponent,
  availableRooms,
  onStartLocal,
  onStartAI,
  onHost,
  onJoin,
  onRestart,
  onCloseWinDialog,
  onLeave,
  onRefreshRooms,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [menuView, setMenuView] = useState<'main' | 'lobby' | 'difficulty'>('main');
  const [roomName, setRoomName] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Refresh room list when entering lobby view
  useEffect(() => {
    if (menuView === 'lobby') {
      onRefreshRooms();
    }
  }, [menuView]);

  // Copy room link to clipboard
  const copyRoomLink = () => {
    const roomLink = `${window.location.origin}${window.location.pathname}?room=${myId}`;
    navigator.clipboard.writeText(roomLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Waiting Room - Host is waiting for players to join
  if (status === GameStatus.WaitingRoom) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
        <div className="bg-stone-900 p-8 rounded-2xl border border-stone-700 shadow-2xl max-w-md w-full relative overflow-hidden">
          <h2 className="text-2xl font-bold text-amber-200 mb-2 text-center">{t.waitingForPlayer}</h2>
          <p className="text-stone-400 text-center mb-6 text-sm">
            {t.shareRoomId}
          </p>

          {/* Room Link - Copy to share */}
          <div className="mb-6 bg-black/30 border border-stone-700 rounded-lg p-4">
            <div className="text-xs text-stone-500 uppercase mb-2 font-semibold">Share this link with your friend</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}${window.location.pathname}?room=${myId}`}
                className="flex-1 bg-stone-950 text-stone-300 text-sm px-3 py-2 rounded border border-stone-700 font-mono"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={copyRoomLink}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded transition font-medium text-sm"
              >
                {linkCopied ? '✓' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Waiting Animation */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400"></div>
              <span className="text-stone-300">{t.waitingForOpponent}</span>
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>

          {/* Cancel Button */}
          <button
            onClick={onLeave}
            className="w-full py-3 px-4 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 font-semibold rounded-lg transition"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    );
  }

  if (status === GameStatus.Menu) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
        <div className="bg-stone-900 p-8 rounded-2xl border border-stone-700 shadow-2xl max-w-md w-full relative overflow-hidden">

          {/* Header - Only show in main view */}
          {menuView === 'main' && (
            <>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-600 mb-2 text-center">
                {t.gameTitle}
              </h1>
              <p className="text-stone-400 text-center mb-6 text-sm">
                {t.gameSubtitle}<br/>
                <span className="text-amber-400 text-xs">{language === 'zh' ? '黑方先下1子，之后每回合各下2子' : language === 'ja' ? '黒が最初に1つ置き、その後各ターン2つずつ置く' : 'Black places 1 stone first, each player places 2 stones per turn.'}</span>
              </p>
            </>
          )}

          {/* Main View */}
          {menuView === 'main' && (
            <div className="space-y-4 animate-in slide-in-from-left duration-300">
              <button
                onClick={() => setMenuView('difficulty')}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-lg transition shadow-lg transform hover:scale-[1.02]"
              >
                {t.playVsComputer}
              </button>

              <button
                onClick={onStartLocal}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-lg transition shadow-lg transform hover:scale-[1.02]"
              >
                {t.localOneVsOne}
              </button>

              {/* Only show online multiplayer option if not on itch.io */}
              {canUseOnlineMode() && (
                <>
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-stone-700"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-stone-900 px-2 text-stone-500">{t.onlineMultiplayer}</span></div>
                  </div>

                  <button
                    onClick={() => setMenuView('lobby')}
                    className="w-full py-3 px-4 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-amber-100 font-semibold rounded-lg transition group flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:text-amber-400 transition"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    {t.onlineLobby}
                  </button>
                </>
              )}

              {/* Language Selector */}
              <div className="pt-4 border-t border-stone-700">
                <div className="text-xs text-stone-500 text-center mb-3">{t.language}</div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      language === 'en'
                        ? 'bg-amber-600 text-white shadow-lg'
                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-300'
                    }`}
                  >
                    <span className="text-lg">🇺🇸</span>
                    <span className="text-sm font-medium">EN</span>
                  </button>
                  <button
                    onClick={() => setLanguage('zh')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      language === 'zh'
                        ? 'bg-amber-600 text-white shadow-lg'
                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-300'
                    }`}
                  >
                    <span className="text-lg">🇨🇳</span>
                    <span className="text-sm font-medium">中文</span>
                  </button>
                  <button
                    onClick={() => setLanguage('ja')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      language === 'ja'
                        ? 'bg-amber-600 text-white shadow-lg'
                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-300'
                    }`}
                  >
                    <span className="text-lg">🇯🇵</span>
                    <span className="text-sm font-medium">日本語</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lobby View */}
          {menuView === 'lobby' && (
            <div className="animate-in slide-in-from-right duration-300">
               <div className="flex items-center justify-between mb-6">
                   <button onClick={() => setMenuView('main')} className="text-stone-400 hover:text-white text-sm flex items-center gap-1">
                     ← {t.back}
                   </button>
               </div>

               {/* Host Section */}
               <div className="bg-gradient-to-br from-stone-950 to-stone-900 border border-stone-700 rounded-xl p-5 mb-5 shadow-lg">
                  <div className="text-xs text-stone-500 font-semibold uppercase mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    {t.hostARoom}
                  </div>

                  {myId && gameMode === GameMode.OnlineHost ? (
                    <>
                      <div className="mt-3 text-xs text-stone-500 flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                        <span>{t.waitingForOpponent}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Room name (optional)"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="w-full mb-3 px-4 py-2 bg-stone-950 border border-stone-700 rounded-lg text-stone-300 placeholder-stone-600 focus:border-amber-500 focus:outline-none transition"
                        maxLength={20}
                      />
                      <button
                        onClick={() => onHost(roomName.trim() || undefined)}
                        className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-lg transition shadow-lg transform hover:scale-[1.02]"
                      >
                        {t.createRoom}
                      </button>
                    </>
                  )}
               </div>

               {/* Divider */}
               <div className="relative py-3">
                 <div className="absolute inset-0 flex items-center">
                   <span className="w-full border-t border-stone-700"></span>
                 </div>
                 <div className="relative flex justify-center text-xs uppercase">
                   <span className="bg-stone-900 px-3 text-stone-500">{t.or}</span>
                 </div>
               </div>

               {/* Join Section - Room List */}
               <div className="bg-gradient-to-br from-stone-950 to-stone-900 border border-stone-700 rounded-xl p-5 shadow-lg">
                  <div className="text-xs text-stone-500 font-semibold uppercase mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                      {t.availableRooms}
                    </div>
                    <button
                      onClick={onRefreshRooms}
                      className="p-1.5 rounded-md hover:bg-stone-800 transition text-stone-400 hover:text-amber-400"
                      title="Refresh room list"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                        <path d="M21 3v5h-5"/>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                        <path d="M3 21v-5h5"/>
                      </svg>
                    </button>
                  </div>

                  {gameMode === GameMode.OnlineJoin && myId ? (
                    <>
                      <div className="text-stone-400 text-sm mb-3">
                        {t.connectingToHost}
                      </div>
                      <div className="flex items-center gap-3 bg-black/50 p-4 rounded-lg border border-stone-800">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-400"></div>
                        <span className="text-stone-300 text-sm">{t.pleaseWait}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {availableRooms.length === 0 ? (
                        <div className="text-center py-8">
                          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-stone-600">
                            <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                          <p className="text-stone-500 text-sm">{t.noRoomsAvailable}</p>
                          <p className="text-stone-600 text-xs mt-1">{t.createRoomToStart}</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {availableRooms.map((room) => (
                            <button
                              key={room.id}
                              onClick={() => onJoin(room.id)}
                              className="w-full bg-black/30 hover:bg-black/50 border border-stone-700 hover:border-amber-500/50 rounded-lg p-4 transition text-left group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <span className="text-white font-semibold group-hover:text-amber-200 transition">
                                      {room.hostName}'s Room
                                    </span>
                                  </div>
                                  <div className="text-xs text-stone-400">
                                    {t.playersCount}: {room.playerCount}/{room.maxPlayers}
                                  </div>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-600 group-hover:text-amber-400 transition">
                                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                                </svg>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
               </div>
            </div>
          )}

          {/* Difficulty Selection View */}
          {menuView === 'difficulty' && (
            <div className="animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between mb-8">
                <button onClick={() => setMenuView('main')} className="text-stone-400 hover:text-white text-sm flex items-center gap-1">
                  ← {t.back}
                </button>
              </div>

              <div className="text-stone-300 text-center mb-8">
                <h3 className="text-2xl font-bold text-amber-200 mb-2">{t.selectDifficulty}</h3>
                <p className="text-sm text-stone-400">{t.chooseDifficulty}</p>
              </div>

              <div className="space-y-4">
                {/* Easy */}
                <button
                  onClick={() => {
                    onStartAI(AIDifficulty.Easy);
                  }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg transition shadow-lg transform hover:scale-[1.02] text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-lg">{t.difficultyEasy}</div>
                      <div className="text-xs text-green-100 opacity-80">{t.difficultyEasyDesc}</div>
                    </div>
                  </div>
                </button>

                {/* Medium */}
                <button
                  onClick={() => {
                    onStartAI(AIDifficulty.Medium);
                  }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white rounded-lg transition shadow-lg transform hover:scale-[1.02] text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-lg">{t.difficultyMedium}</div>
                      <div className="text-xs text-yellow-100 opacity-80">{t.difficultyMediumDesc}</div>
                    </div>
                  </div>
                </button>

                {/* Hard */}
                <button
                  onClick={() => {
                    onStartAI(AIDifficulty.Hard);
                  }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg transition shadow-lg transform hover:scale-[1.02] text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-lg">{t.difficultyHard}</div>
                      <div className="text-xs text-red-100 opacity-80">{t.difficultyHardDesc}</div>
                    </div>
                  </div>
                </button>
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
          <div className="text-xs text-stone-400 uppercase tracking-wider mb-1">{t.currentTurn}</div>
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${currentPlayer === Player.Black ? 'bg-black border border-gray-600' : 'bg-white'}`}></div>
            <span className="font-bold text-xl">
              {currentPlayer === Player.Black ? t.black : t.white}
            </span>
          </div>
          {status === GameStatus.Playing && (
            <div className="mt-2 text-xs text-amber-400">
              {t.stoneCount} {stonesPlacedThisTurn + 1} {t.of} {isFirstMove ? '1' : '2'}
            </div>
          )}
          {gameMode !== GameMode.Local && gameMode !== GameMode.AI && (
            <div className="mt-2 text-xs text-stone-500">
              {t.playingAs}: {localPlayer === Player.Black ? t.black : t.white}
            </div>
          )}
          {gameMode === GameMode.AI && (
             <div className="mt-2 text-xs text-indigo-300">
                {t.modeVsComputer}
             </div>
          )}
        </div>
      </div>

      {/* Game Over Modal */}
      {status === GameStatus.Ended && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
          <div className="bg-stone-900 p-8 rounded-2xl border border-amber-500/30 shadow-2xl text-center animate-in fade-in zoom-in duration-300 relative">
            {/* Close button */}
            <button
              onClick={onCloseWinDialog}
              className="absolute top-4 right-4 text-stone-400 hover:text-white transition"
              title="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h2 className="text-5xl font-black text-white mb-2">
              {winner === Player.Black ? t.black : t.white} {t.wins}
            </h2>
            <p className="text-stone-400 mb-8">{t.victory}</p>

            {/* Show waiting status for online games */}
            {(gameMode === GameMode.OnlineHost || gameMode === GameMode.OnlineJoin) && (
              <div className="mb-6">
                {restartRequested && (
                  <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-3 mb-4">
                    <p className="text-amber-200 text-sm">
                      {t.opponentWantsRematch}
                    </p>
                  </div>
                )}
                {waitingForOpponent && (
                  <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3 mb-4 flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                    <p className="text-blue-200 text-sm">
                      {t.waitingForOpponentDecision}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={onRestart}
                className="py-3 px-8 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-full shadow-lg transition hover:scale-105"
              >
                {(gameMode === GameMode.OnlineHost || gameMode === GameMode.OnlineJoin) && restartRequested
                  ? t.acceptAndPlayAgain
                  : t.playAgain}
              </button>
              <button
                onClick={onLeave}
                className="py-3 px-8 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-full transition"
              >
                {t.mainMenu}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Ended - Control Panel (when dialog is closed) */}
      {status === GameStatus.EndedDialogClosed && (
        <div className="absolute inset-x-0 bottom-0 p-6 flex justify-center z-20">
          <div className="bg-stone-900/95 backdrop-blur-lg rounded-2xl border border-amber-500/30 shadow-2xl p-6 max-w-2xl w-full">
            {/* Game Result */}
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-white mb-2">
                {winner === Player.Black ? t.black : t.white} {t.wins}
              </h3>
              <p className="text-stone-400 text-sm">{t.gameEnded}</p>
            </div>

            {/* Online game status */}
            {(gameMode === GameMode.OnlineHost || gameMode === GameMode.OnlineJoin) && (
              <div className="mb-6">
                {/* Opponent wants to play again */}
                {restartRequested && (
                  <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-4 mb-3 flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                    </svg>
                    <div className="flex-1">
                      <p className="text-amber-200 font-semibold">{t.opponentReady}</p>
                      <p className="text-amber-300/70 text-xs">{t.clickToStart}</p>
                    </div>
                  </div>
                )}

                {/* Waiting for opponent */}
                {waitingForOpponent && (
                  <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 mb-3 flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    <div className="flex-1">
                      <p className="text-blue-200 font-semibold">{t.waitingForOpponentDecision}</p>
                      <p className="text-blue-300/70 text-xs">{t.readyForNext}</p>
                    </div>
                  </div>
                )}

                {/* No action yet */}
                {!restartRequested && !waitingForOpponent && (
                  <div className="bg-stone-800/50 border border-stone-700 rounded-lg p-4 mb-3 flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <div className="flex-1">
                      <p className="text-stone-300 font-semibold">{t.opponentViewing}</p>
                      <p className="text-stone-400 text-xs">{t.waitingForDecision}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={onRestart}
                className="flex items-center gap-2 py-3 px-8 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-full shadow-lg transition hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                </svg>
                {(gameMode === GameMode.OnlineHost || gameMode === GameMode.OnlineJoin) && restartRequested
                  ? t.acceptAndPlayAgain
                  : t.playAgain}
              </button>
              <button
                onClick={onLeave}
                className="flex items-center gap-2 py-3 px-8 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-full transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                {t.mainMenu}
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
            {t.exitGame}
          </button>
      </div>
    </>
  );
};
