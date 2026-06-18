import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Grid3X3, ListOrdered, Landmark, Trophy, ShieldCheck, Mail, HelpCircle, Award, Layers, Compass } from 'lucide-react';
import TicTacToeGame from './components/TicTacToeGame';
import TenableGame from './components/TenableGame';
import CareerPathGame from './components/CareerPathGame';
import LeaderboardsView from './components/LeaderboardsView';
import TheFootballGame from './components/TheFootballGame';
import SpotleGame from './components/SpotleGame';

enum ActiveTab {
  TIC_TAC_TOE = 'tic_tac_toe',
  TENABLE = 'tenable',
  CAREER_PATH = 'career_path',
  THE_FOOTBALL_GAME = 'football_game',
  CLUE_SPOTLE = 'clue_spotle',
  LEADERBOARD = 'leaderboard'
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.TIC_TAC_TOE);
  const [activeTheme, setActiveTheme] = useState<'football' | 'music' | 'movies'>('football');

  const getThemeColorClass = () => {
    if (activeTheme === 'music') return 'border-b-4 border-purple-500';
    if (activeTheme === 'movies') return 'border-b-4 border-amber-500';
    return 'border-b-4 border-emerald-500';
  };

  const getThemeIconColorClass = () => {
    if (activeTheme === 'music') return 'bg-purple-600 text-white';
    if (activeTheme === 'movies') return 'bg-amber-500 text-slate-950';
    return 'bg-emerald-500 text-slate-100';
  };

  const getThemeAccentClass = () => {
    if (activeTheme === 'music') return 'text-purple-400';
    if (activeTheme === 'movies') return 'text-amber-400';
    return 'text-emerald-300';
  };

  const getThemeTextClass = () => {
    if (activeTheme === 'music') return 'text-purple-400';
    if (activeTheme === 'movies') return 'text-amber-400';
    return 'text-emerald-500/80';
  };

  const getThemeLabel = () => {
    if (activeTheme === 'music') return 'GridBlitz Rhythm';
    if (activeTheme === 'movies') return 'GridBlitz Cinema';
    return 'GridBlitz Football';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans" id="football-main-lobby">
      
      {/* Main Header / Scoreboard HUD */}
      <header className={`h-16 bg-slate-900 text-white flex items-center justify-between px-6 sm:px-8 shadow-md transition-all duration-300 ${getThemeColorClass()}`}>
        <div className="flex items-center space-x-3">
          <div className={`p-1.5 rounded-lg flex items-center justify-center transition-colors duration-300 ${getThemeIconColorClass()}`}>
            <Trophy size={18} className="animate-pulse" />
          </div>
          <span className="text-lg sm:text-xl font-black tracking-tighter uppercase text-white transition-all duration-300">
            {getThemeLabel()}
          </span>
        </div>
        
        {/* Navigation Info Dashboard */}
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold leading-none">PLAYER IN SESSION</p>
              <p className="text-xs font-bold text-slate-200">0matthewsmith@gmail.com</p>
            </div>
            <div className="w-[1px] h-6 bg-slate-700"></div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold leading-none">MATCH TIME (UTC)</p>
              <p className={`text-xs font-mono font-bold transition-colors duration-300 ${getThemeAccentClass()}`}>
                2026-06-09 14:47
              </p>
            </div>
          </div>
          <div className={`w-9 h-9 rounded-full ${activeTheme === "music" ? "bg-purple-600" : activeTheme === "movies" ? "bg-amber-500" : "bg-emerald-500"} border-2 border-white flex items-center justify-center font-bold text-slate-950 text-xs shadow-inner transition-colors duration-300`}>
            MS
          </div>
        </div>
      </header>

      {/* Main Lobby Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* TOP MODE SWITCHER TABS */}
        <div className="flex justify-center">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center space-x-1 border border-slate-200 shadow-inner max-w-xl w-full">
            <button
              id="theme-tab-football"
              onClick={() => setActiveTheme('football')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                activeTheme === 'football'
                  ? 'bg-slate-900 text-emerald-400 shadow-md scale-102'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span>⚽</span>
              <span className="uppercase tracking-tight text-[10px] sm:text-xs">Football</span>
            </button>
            <button
              id="theme-tab-music"
              onClick={() => setActiveTheme('music')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                activeTheme === 'music'
                  ? 'bg-slate-900 text-purple-400 shadow-md scale-102'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span>🎵</span>
              <span className="uppercase tracking-tight text-[10px] sm:text-xs">Music</span>
            </button>
            <button
              id="theme-tab-movies"
              onClick={() => setActiveTheme('movies')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                activeTheme === 'movies'
                  ? 'bg-slate-900 text-amber-400 shadow-md scale-102'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span>🎬</span>
              <span className="uppercase tracking-tight text-[10px] sm:text-xs">Movies & TV</span>
            </button>
          </div>
        </div>

        {/* Navigation Selector Tabs */}
        <div className="w-full bg-white border border-slate-200 p-1.5 rounded-xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 shadow-sm">
          <button
            onClick={() => setActiveTab(ActiveTab.TIC_TAC_TOE)}
            className={`py-3 px-2 rounded-lg text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer relative ${
              activeTab === ActiveTab.TIC_TAC_TOE
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Grid3X3 size={16} className={activeTab === ActiveTab.TIC_TAC_TOE ? getThemeAccentClass() : 'opacity-60'} />
            <div className="flex flex-col sm:items-start leading-none text-center sm:text-left">
              <span className="block font-sans text-xs sm:text-sm">Tic-Tac-Toe Grid</span>
              <span className={`text-[8px] font-mono hidden md:block uppercase font-bold tracking-wider mt-0.5 ${
                activeTab === ActiveTab.TIC_TAC_TOE ? getThemeTextClass() : 'text-slate-400'
              }`}>Immaculate Game Mode</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab(ActiveTab.TENABLE)}
            className={`py-3 px-2 rounded-lg text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer relative ${
              activeTab === ActiveTab.TENABLE
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <ListOrdered size={16} className={activeTab === ActiveTab.TENABLE ? getThemeAccentClass() : 'opacity-60'} />
            <div className="flex flex-col sm:items-start leading-none text-center sm:text-left">
              <span className="block font-sans text-xs sm:text-sm">Tenable / Tension</span>
              <span className={`text-[8px] font-mono hidden md:block uppercase font-bold tracking-wider mt-0.5 ${
                activeTab === ActiveTab.TENABLE ? getThemeTextClass() : 'text-slate-400'
              }`}>Top 10 Board Game</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab(ActiveTab.CAREER_PATH)}
            className={`py-3 px-2 rounded-lg text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer relative ${
              activeTab === ActiveTab.CAREER_PATH
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Landmark size={16} className={activeTab === ActiveTab.CAREER_PATH ? getThemeAccentClass() : 'opacity-60'} />
            <div className="flex flex-col sm:items-start leading-none text-center sm:text-left">
              <span className="block font-sans text-xs sm:text-sm">Trivia Career</span>
              <span className={`text-[8px] font-mono hidden md:block uppercase font-bold tracking-wider mt-0.5 ${
                activeTab === ActiveTab.CAREER_PATH ? getThemeTextClass() : 'text-slate-400'
              }`}>Mystery Puzzle</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab(ActiveTab.THE_FOOTBALL_GAME)}
            className={`py-3 px-2 rounded-lg text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer relative ${
              activeTab === ActiveTab.THE_FOOTBALL_GAME
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Layers size={16} className={activeTab === ActiveTab.THE_FOOTBALL_GAME ? getThemeAccentClass() : 'opacity-60'} />
            <div className="flex flex-col sm:items-start leading-none text-center sm:text-left">
              <span className="block font-sans text-xs sm:text-sm">Topic Cards</span>
              <span className={`text-[8px] font-mono hidden md:block uppercase font-bold tracking-wider mt-0.5 ${
                activeTab === ActiveTab.THE_FOOTBALL_GAME ? getThemeTextClass() : 'text-slate-400'
              }`}>Unlimited Quiz</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab(ActiveTab.CLUE_SPOTLE)}
            className={`py-3 px-2 rounded-lg text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer relative ${
              activeTab === ActiveTab.CLUE_SPOTLE
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Compass size={16} className={activeTab === ActiveTab.CLUE_SPOTLE ? getThemeAccentClass() : 'opacity-60'} />
            <div className="flex flex-col sm:items-start leading-none text-center sm:text-left">
              <span className="block font-sans text-xs sm:text-sm">Spotle / Clues</span>
              <span className={`text-[8px] font-mono hidden md:block uppercase font-bold tracking-wider mt-0.5 ${
                activeTab === ActiveTab.CLUE_SPOTLE ? getThemeTextClass() : 'text-slate-400'
              }`}>10 Guesses Grid</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab(ActiveTab.LEADERBOARD)}
            className={`py-3 px-2 rounded-lg text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer relative ${
              activeTab === ActiveTab.LEADERBOARD
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Award size={16} className={activeTab === ActiveTab.LEADERBOARD ? getThemeAccentClass() : 'opacity-60'} />
            <div className="flex flex-col sm:items-start leading-none text-center sm:text-left">
              <span className="block font-sans text-xs sm:text-sm">Global Standings</span>
              <span className={`text-[8px] font-mono hidden md:block uppercase font-bold tracking-wider mt-0.5 ${
                activeTab === ActiveTab.LEADERBOARD ? getThemeTextClass() : 'text-slate-400'
              }`}>High Scores & Ranks</span>
            </div>
          </button>
        </div>

        {/* Transition Switch Content */}
        <div className="flex-1 w-full bg-transparent min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${activeTheme}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="w-full h-full"
            >
              {activeTab === ActiveTab.TIC_TAC_TOE && <TicTacToeGame theme={activeTheme} />}
              {activeTab === ActiveTab.TENABLE && <TenableGame theme={activeTheme} />}
              {activeTab === ActiveTab.CAREER_PATH && <CareerPathGame theme={activeTheme} />}
              {activeTab === ActiveTab.THE_FOOTBALL_GAME && <TheFootballGame theme={activeTheme} />}
              {activeTab === ActiveTab.CLUE_SPOTLE && <SpotleGame theme={activeTheme} />}
              {activeTab === ActiveTab.LEADERBOARD && <LeaderboardsView />}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* Footer Area */}
      <footer className="h-10 bg-slate-100 border-t border-slate-200 flex items-center justify-between px-6 sm:px-8 mt-6">
        <div className="flex space-x-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>V1.5.0 STABLE</span>
          <span className="hidden sm:inline">SERVERS: OPTIMAL</span>
          <span className="hidden sm:inline">THEME: {activeTheme.toUpperCase()}</span>
        </div>
        <div className={`flex space-x-4 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${activeTheme === "music" ? "text-purple-600" : activeTheme === "movies" ? "text-amber-600" : "text-emerald-600"}`}>
          <span>15,310 Active Strikers Online</span>
        </div>
      </footer>

    </div>
  );
}
