import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Trophy, Calendar, Filter, Sparkles, User, RefreshCw, Layers, Award, Clock } from 'lucide-react';
import { getPlayerPhoto, getFlagUrl } from '../lib/images';
import { SafeImage } from './SafeImage';

interface LeaderboardEntry {
  id: string;
  playerName: string;
  gameType: 'tictactoe' | 'tenable';
  score: number;
  date: string;
  // Tic-Tac-Toe details
  tttSolvable: boolean;
  guessesCount: number;
  mistakesCount: number;
  tttMode: 'single' | 'two-player';
  // Tenable details
  tenableTopic: string;
  tenableTimerMode: 'none' | 'round' | 'full';
  tenableLivesMode: 'custom' | 'zero' | 'infinite';
  completionTimeSeconds?: number;
}

export default function LeaderboardsView() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorWord, setErrorWord] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Game tab filter in leaderboards
  const [activeSegment, setActiveSegment] = useState<'tictactoe' | 'tenable'>('tictactoe');
  
  // Tic-Tac-Toe subfilters
  const [solvableFilter, setSolvableFilter] = useState<'all' | 'solvable' | 'chaotic'>('all');
  
  // Tenable subfilters
  const [timerFilter, setTimerFilter] = useState<'all' | 'none' | 'round' | 'full'>('all');
  const [livesFilter, setLivesFilter] = useState<'all' | 'zero' | 'custom' | 'infinite'>('all');

  const fetchScores = async () => {
    setLoading(true);
    setErrorWord(null);
    try {
      const response = await apiFetch('/api/leaderboards/list');
      if (!response.ok) throw new Error('Bad network response');
      const data = await response.json();
      setEntries(data);
    } catch (err) {
      setErrorWord('Unable to synchronized leaderboard standings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  // Filter & Rank
  const filteredEntries = entries
    .filter(item => item.gameType === activeSegment)
    .filter(item => {
      // Search query
      if (!searchQuery.trim()) return true;
      return item.playerName.toLowerCase().includes(searchQuery.toLowerCase().trim());
    })
    .filter(item => {
      // TTT subfilters
      if (activeSegment === 'tictactoe') {
        if (solvableFilter === 'all') return true;
        if (solvableFilter === 'solvable') return item.tttSolvable;
        if (solvableFilter === 'chaotic') return !item.tttSolvable;
      }
      // Tenable subfilters
      if (activeSegment === 'tenable') {
        const timerMatch = timerFilter === 'all' || item.tenableTimerMode === timerFilter;
        const livesMatch = livesFilter === 'all' || item.tenableLivesMode === livesFilter;
        return timerMatch && livesMatch;
      }
      return true;
    })
    .sort((a, b) => {
      if (activeSegment === 'tictactoe') {
        // High score first, then low mistakesCount
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.mistakesCount - b.mistakesCount;
      } else {
        // Tenable: High correct guesses first, then lowest completion time
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        const aTime = a.completionTimeSeconds ?? 9999;
        const bTime = b.completionTimeSeconds ?? 9999;
        return aTime - bTime;
      }
    });

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-left" id="global-scores-deck">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-black font-sans text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <Trophy className="text-amber-500 animate-pulse" /> Global Standings Arena
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Real-time score submissions from trivia champions globally. Sort and filter below to discover who dominates the tactical board games.
          </p>
        </div>
        
        <button
          onClick={fetchScores}
          disabled={loading}
          className="self-start md:self-auto bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          {loading ? (
            <RefreshCw className="animate-spin text-white" size={14} />
          ) : (
            <RefreshCw size={14} />
          )}
          REFRESH RANKS
        </button>
      </div>

      {/* Main Tabs Segment Control */}
      <div className="grid grid-cols-2 gap-2 bg-slate-150 p-1.5 rounded-xl mt-5">
        <button
          onClick={() => {
            setActiveSegment('tictactoe');
            setSearchQuery('');
          }}
          className={`py-3 rounded-lg text-xs font-black transition-all uppercase tracking-wide cursor-pointer ${
            activeSegment === 'tictactoe'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          🏟️ Football Tic-Tac-Toe
        </button>
        <button
          onClick={() => {
            setActiveSegment('tenable');
            setSearchQuery('');
          }}
          className={`py-3 rounded-lg text-xs font-black transition-all uppercase tracking-wide cursor-pointer ${
            activeSegment === 'tenable'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          🔟 Football Tenable / Tension
        </button>
      </div>

      {/* Filters Deck */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        
        {/* Search Input */}
        <div className="md:col-span-4 relative">
          <label className="text-[10px] font-mono font-extrabold text-slate-500 uppercase block mb-1">Search Player</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Filter by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 focus:border-slate-800 text-xs rounded-lg pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 transition-all focus:outline-hidden"
            />
          </div>
        </div>

        {/* Dynamic Filters depending on Segment */}
        {activeSegment === 'tictactoe' ? (
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono font-extrabold text-slate-500 uppercase block mb-1">Grid Solvability</label>
              <select
                value={solvableFilter}
                onChange={(e) => setSolvableFilter(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg text-xs py-2 px-2.5 focus:border-slate-805 text-slate-700 font-medium cursor-pointer focus:outline-hidden"
              >
                <option value="all">All Modes (Any Grid)</option>
                <option value="solvable">Solvable Grids Only</option>
                <option value="chaotic">Chaotic (Unsolvable) Grids</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono font-extrabold text-slate-500 uppercase block mb-1">Timer Countdown</label>
              <select
                value={timerFilter}
                onChange={(e) => setTimerFilter(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg text-xs py-2 px-2.5 focus:border-slate-805 text-slate-700 font-medium cursor-pointer focus:outline-hidden"
              >
                <option value="all">All Timers</option>
                <option value="none">No Time Limit</option>
                <option value="round">Time Per Guess</option>
                <option value="full">Time Match Board</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono font-extrabold text-slate-500 uppercase block mb-1">Striker Lives Mode</label>
              <select
                value={livesFilter}
                onChange={(e) => setLivesFilter(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg text-xs py-2 px-2.5 focus:border-slate-850 text-slate-700 font-medium cursor-pointer focus:outline-hidden"
              >
                <option value="all">All Lives Allocations</option>
                <option value="zero">Sudden Death (0 incorrect)</option>
                <option value="custom">Standard Lives</option>
                <option value="infinite">Unlimited Lives</option>
              </select>
            </div>
          </div>
        )}

      </div>

      {/* Ranks Table Container */}
      <div className="mt-5 border border-slate-200 rounded-xl overflow-hidden bg-white">
        {errorWord && (
          <div className="p-8 text-center text-rose-600 text-xs font-mono font-bold">
            ⚠️ {errorWord}
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="animate-spin text-emerald-600" size={24} />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Syncing Arena Leaderboards...</span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-16 text-center text-slate-450 text-xs font-serif italic">
            No record matches found inside the current standings filter. Be the first to secure a spot!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono font-black text-slate-450 uppercase tracking-widest">
                  <th className="py-3.5 px-4 text-center w-12">Rank</th>
                  <th className="py-3.5 px-4">Contender</th>
                  <th className="py-3.5 px-4 text-center">Score</th>
                  <th className="py-3.5 px-4">Rules & Conditions</th>
                  <th className="py-3.5 px-4 text-right">Match Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredEntries.map((item, index) => {
                  const medalColors = [
                    'bg-amber-100 text-amber-800 border-amber-300 ring-amber-400',
                    'bg-slate-150 text-slate-800 border-slate-350 ring-slate-400',
                    'bg-amber-50 text-amber-900 border-amber-200 ring-amber-300'
                  ];
                  const isTopThree = index < 3;
                  
                  // Try to get nationality mock flag or look up based on Player Name (e.g. Gary Lineker is England)
                  let flagUrl = null;
                  if (item.playerName.toLowerCase().includes("lineker") || item.playerName.toLowerCase().includes("shearer") || item.playerName.toLowerCase().includes("kane")) {
                    flagUrl = getFlagUrl("England");
                  } else if (item.playerName.toLowerCase().includes("henry") || item.playerName.toLowerCase().includes("mbappe")) {
                    flagUrl = getFlagUrl("France");
                  } else if (item.playerName.toLowerCase().includes("bellingham")) {
                    flagUrl = getFlagUrl("England");
                  } else if (item.playerName.toLowerCase().includes("palmer") || item.playerName.toLowerCase().includes("smith")) {
                    flagUrl = getFlagUrl("England");
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/55 transition-all">
                      {/* Rank Column */}
                      <td className="py-4 px-4 text-center font-mono font-bold">
                        {isTopThree ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full border ring-2 ring-offset-1 font-black ${medalColors[index]}`}>
                            {index + 1}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-bold">{index + 1}</span>
                        )}
                      </td>

                      {/* Contender Column */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <SafeImage
                            src={getPlayerPhoto(item.playerName)}
                            alt={item.playerName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-slate-100 shadow-xxs shrink-0"
                            fallbackType="player"
                            fallbackName={item.playerName}
                          />
                          <div>
                            <div className="font-extrabold text-slate-850 uppercase tracking-tight flex items-center gap-1.5">
                              {item.playerName}
                              {flagUrl && (
                                <SafeImage 
                                  src={flagUrl} 
                                  alt="flag" 
                                  className="w-4 h-3 rounded-xs object-cover border border-slate-100" 
                                  fallbackType="flag"
                                  fallbackName={item.playerName}
                                />
                              )}
                            </div>
                            {activeSegment === 'tenable' && item.tenableTopic && (
                              <div className="text-[10px] text-slate-400 font-mono line-clamp-1 max-w-[200px] mt-0.5">
                                BOARD: {item.tenableTopic}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Score Column */}
                      <td className="py-4 px-4 text-center font-mono">
                        {activeSegment === 'tictactoe' ? (
                          <div className="flex flex-col items-center">
                            <span className="font-black text-slate-905">{item.score}/9</span>
                            <span className="text-[9px] text-slate-400 font-bold">GRID CELLS</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="font-black text-emerald-600">{item.score}/10</span>
                            {item.completionTimeSeconds !== undefined && (
                              <span className="text-[9px] text-slate-400 font-bold flex items-center justify-center gap-0.5 mt-0.5">
                                <Clock size={8} /> {item.completionTimeSeconds}s
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Rules & Conditions Column */}
                      <td className="py-4 px-4">
                        {item.gameType === 'tictactoe' ? (
                          <div className="flex flex-wrap gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase border ${
                              item.tttSolvable 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                                : 'bg-red-50 text-red-700 border-red-150'
                            }`}>
                              {item.tttSolvable ? 'SOLVABLE GRID' : 'CHAOTIC GRID'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600 border border-slate-205 font-mono">
                              MISTAKES: {item.mistakesCount}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[9px] bg-slate-900 text-slate-100 border border-slate-900 font-mono text-[9px] font-black uppercase">
                              LIVES: {item.tenableLivesMode === 'zero' ? 'SUDDEN DEATH' : item.tenableLivesMode === 'custom' ? 'STANDARD' : 'UNLIMITED'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600 border border-slate-205 font-mono text-[9px] uppercase font-bold">
                              CLOCK: {item.tenableTimerMode === 'none' ? 'UNTIMED' : item.tenableTimerMode === 'round' ? 'ROUND COUNTDOWN' : 'MATCH COUNTDOWN'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Date Column */}
                      <td className="py-4 px-4 text-right font-mono text-[10px] text-slate-450">
                        <div className="flex items-center justify-end gap-1.5">
                          <Calendar size={11} />
                          {new Date(item.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
