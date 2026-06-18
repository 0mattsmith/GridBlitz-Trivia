import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { GridCriteria, GridCellState, GridSetup } from '../types';
import { HelpCircle, RefreshCw, User, Users, CheckCircle, XCircle, Info, Loader2, ArrowRight, Trophy } from 'lucide-react';
import { getFlagUrl, getPlayerPhoto, getManagerPhoto, getLeagueLogo, getTrophyPhoto, getClubLogo } from '../lib/images';
import { SafeImage } from './SafeImage';

export default function TicTacToeGame({ theme = "football" }: { theme?: 'football' | 'music' | 'movies' }) {
  const [setup, setSetup] = useState<GridSetup>({
    rows: [],
    cols: [],
    solvable: true,
    gameMode: 'single'
  });
  
  const [cells, setCells] = useState<GridCellState[]>(
    Array(9).fill(null).map((_, i) => ({
      index: i,
      owner: null,
      playerGuess: null,
      checkedByAI: false
    }))
  );

  const [currentTurn, setCurrentTurn] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<'X' | 'O' | 'draw' | null>(null);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [guessInput, setGuessInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [infoText, setInfoText] = useState<string | null>("Select a cell to place your guess!");
  const [logs, setLogs] = useState<string[]>([]);
  const [guessesCount, setGuessesCount] = useState(0);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [boardDisabled, setBoardDisabled] = useState(false);

  // Dispute / VAR Tracker variables
  const [lastFailedVerify, setLastFailedVerify] = useState<{
    cellIndex: number;
    guessedPlayerName: string;
    playerSymbol: 'X' | 'O';
    rowCrit: any;
    colCrit: any;
  } | null>(null);
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeFeedback, setDisputeFeedback] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState<string>("");

  // Leaderboard Submitting States
  const [submitted, setSubmitted] = useState(false);
  const [submitName, setSubmitName] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Initialize first game on mount or when theme changes
  useEffect(() => {
    generateNewGrid(true);
  }, [theme]);

  // Monitor grid completion/winner in 2 player mode
  useEffect(() => {
    if (setup.gameMode === 'two-player') {
      const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
        [0, 4, 8], [2, 4, 6]             // Diagonals
      ];

      for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (cells[a].owner && cells[a].owner === cells[b].owner && cells[a].owner === cells[c].owner) {
          setWinner(cells[a].owner);
          setBoardDisabled(true);
          return;
        }
      }

      // Check draw
      const allFilled = cells.every(c => c.owner !== null);
      if (allFilled) {
        // Count who has the most cells
        const countX = cells.filter(c => c.owner === 'X').length;
        const countO = cells.filter(c => c.owner === 'O').length;
        if (countX > countO) {
          setWinner('X');
        } else if (countO > countX) {
          setWinner('O');
        } else {
          setWinner('draw');
        }
        setBoardDisabled(true);
      }
    } else {
      // Single player mode: Check if all cells filled successfully
      const allFilled = cells.every(c => c.owner === 'X');
      if (allFilled) {
        setWinner('X'); // Completed!
        setBoardDisabled(true);
      }
    }
  }, [cells, setup.gameMode]);

  const generateNewGrid = async (isSolvable: boolean) => {
    setLoading(true);
    setErrorText(null);
    setInfoText("Creating strategic grid match-up...");
    setWinner(null);
    setBoardDisabled(false);
    setGuessesCount(0);
    setMistakesCount(0);
    setLogs(["New match started!"]);
    setCurrentTurn('X');
    
    // Reset submission panel
    setSubmitted(false);
    setSubmitName('');
    
    setCells(
      Array(9).fill(null).map((_, i) => ({
        index: i,
        owner: null,
        playerGuess: null,
        checkedByAI: false
      }))
    );

    try {
      const response = await apiFetch('/api/tic-tac-toe/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ solvable: isSolvable, theme })
      });
      const data = await response.json();
      setSetup(prev => ({
        ...prev,
        rows: data.rows,
        cols: data.cols,
        solvable: isSolvable
      }));
      setInfoText(
        isSolvable 
          ? `Certified solvable ${theme} grid generated! Fill cells with correct answers.`
          : `Randomized extreme ${theme} grid generated! Solutions might be rare and tricky.`
      );
    } catch (err) {
      console.error(err);
      setErrorText("Failed to retrieve football grid coefficients. Playing in offline fallback.");
    } finally {
      setLoading(false);
    }
  };

  const getCellCriteria = (idx: number) => {
    const rowIdx = Math.floor(idx / 3);
    const colIdx = idx % 3;
    const rowCrit = setup.rows[rowIdx];
    const colCrit = setup.cols[colIdx];
    return { rowCrit, colCrit };
  };

  const handleCellClick = (idx: number) => {
    if (boardDisabled) return;
    if (cells[idx].owner) {
      setInfoText(`This cell was already claimed by ${cells[idx].owner === 'X' ? 'Player 1' : 'Player 2'} with "${cells[idx].playerGuess}"`);
      return;
    }
    setActiveCell(idx);
    setGuessInput('');
    setErrorText(null);
    setLastFailedVerify(null);
    setDisputeFeedback(null);
    const { rowCrit, colCrit } = getCellCriteria(idx);
    setInfoText(`Target Cell: Played for ${rowCrit?.value} AND meets criteria: ${colCrit?.value}`);
  };

  const handleDispute = async () => {
    if (!lastFailedVerify || disputeLoading) return;
    setDisputeLoading(true);
    setDisputeFeedback(null);

    try {
      const res = await apiFetch("/api/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: "tic-tac-toe",
          playerName: lastFailedVerify.guessedPlayerName,
          rowCriteria: lastFailedVerify.rowCrit,
          colCriteria: lastFailedVerify.colCrit,
          theme,
          userExplanation: disputeReason
        })
      });

      const data = await res.json();
      if (data.actualCorrect) {
        // Dispute was approved! Claim cell and deduct mistake
        setCells(prev => {
          const next = [...prev];
          next[lastFailedVerify.cellIndex] = {
            index: lastFailedVerify.cellIndex,
            owner: lastFailedVerify.playerSymbol,
            playerGuess: lastFailedVerify.guessedPlayerName,
            checkedByAI: true
          };
          return next;
        });

        const overruleLabel = theme === "music" ? "🎵 OVERRULE APPROVED BY RECORD LABEL" : (theme === "movies" ? "🎬 OVERRULE APPROVED BY AGENT" : "⚖️ VAR OVERRULED");
        const logMsg = `${overruleLabel}: Cell row ${Math.floor(lastFailedVerify.cellIndex/3)+1}, col ${(lastFailedVerify.cellIndex%3)+1} claimed for ${lastFailedVerify.playerSymbol === 'X' ? 'Player 1 (X)' : 'Player 2 (O)'} with "${lastFailedVerify.guessedPlayerName}"!`;
        setLogs(prev => [logMsg, ...prev]);
        setInfoText(`🎉 ${theme === "music" ? "RECORD LABEL OVERRULED CRITICS" : theme === "movies" ? "AGENT COMPELLED STUDIO REVERSAL" : "VAR OVERRULE APPROVED"}: ${data.proof}`);
        setErrorText(null);
        setLastFailedVerify(null); // Clear disputed item on successful overturn
        setDisputeReason("");
      } else {
        const confirmLabel = theme === "music" ? "✖️ RECORD LABEL AGREED WITH CRITICS" : (theme === "movies" ? "✖️ AGENT AGREED WITH STUDIO HEAD" : "✖️ VAR CONFIRMED REF CALL");
        setDisputeFeedback(`${confirmLabel}: ${data.proof}`);
      }
    } catch (err) {
      console.error(err);
      setDisputeFeedback("❌ Communication with AI referee timed out.");
    } finally {
      setDisputeLoading(false);
    }
  };

  const submitGuess = async () => {
    if (activeCell === null || !guessInput.trim() || loading) return;

    setLoading(true);
    setErrorText(null);
    setLastFailedVerify(null);
    setDisputeFeedback(null);
    const cellIdx = activeCell;
    const { rowCrit, colCrit } = getCellCriteria(cellIdx);
    
    // Check Repeat Player Rule
    const cleanGuess = guessInput.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "");
    if (!setup.allowRepeats) {
      const alreadyGuessed = cells.some(c => {
        if (!c.playerGuess) return false;
        const cClean = c.playerGuess.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "");
        return cClean === cleanGuess;
      });
      if (alreadyGuessed) {
        setErrorText(`❌ "${guessInput}" has already been used on this grid! Duplicate player choices are disabled.`);
        setLoading(false);
        return;
      }
    }

    setGuessesCount(p => p + 1);

    try {
      const response = await apiFetch('/api/tic-tac-toe/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerName: guessInput,
          rowCriteria: rowCrit,
          colCriteria: colCrit,
          theme
        })
      });

      const result = await response.json();

      if (result.success) {
        // Correct answer!
        const correctPlayerName = result.correctName || guessInput;

        setCells(prev => {
          const next = [...prev];
          next[cellIdx] = {
            index: cellIdx,
            owner: currentTurn,
            playerGuess: correctPlayerName,
            checkedByAI: true
          };
          return next;
        });

        const logMsg = `${currentTurn === 'X' ? 'Player 1 (X)' : 'Player 2 (O)'} scored at row ${Math.floor(cellIdx/3)+1}, col ${(cellIdx%3)+1} with "${correctPlayerName}"`;
        setLogs(prev => [logMsg, ...prev]);
        setInfoText(result.clarification);
        setActiveCell(null);

        // Switch turns in 2-player mode
        if (setup.gameMode === 'two-player') {
          setCurrentTurn(prev => prev === 'X' ? 'O' : 'X');
        }
      } else {
        // Wrong answer
        setMistakesCount(p => p + 1);
        setErrorText(result.clarification);
        
        setLastFailedVerify({
          cellIndex: cellIdx,
          guessedPlayerName: guessInput,
          playerSymbol: currentTurn,
          rowCrit,
          colCrit
        });

        const logMsg = `❌ Incorrect guess "${guessInput}" for row ${Math.floor(cellIdx/3)+1}, col ${(cellIdx%3)+1}`;
        setLogs(prev => [logMsg, ...prev]);

        // In 2-player mode, we switch turn on incorrect guess as well
        if (setup.gameMode === 'two-player') {
          setCurrentTurn(prev => prev === 'X' ? 'O' : 'X');
          setActiveCell(null); // Deselect cell
        }
      }
    } catch {
      setErrorText("Communication latency occurred. Let's assume that guess couldn't be checked.");
    } finally {
      setLoading(false);
    }
  };

  const currentCellCriteria = activeCell !== null ? getCellCriteria(activeCell) : null;

  // Render visual graphic logos in criteria headers
  function renderCriteriaBadge(crit: { value: string; type: string } | undefined) {
    if (!crit) return null;
    const val = crit.value;
    const t = crit.type.toLowerCase();
    
    // Nationality country flags
    if (t === "nationality") {
      const flag = getFlagUrl(val);
      if (flag) {
        return (
          <SafeImage 
            src={flag} 
            alt={val} 
            className="w-7 h-5 rounded object-cover border border-slate-300 shadow-xxs shrink-0 mt-1 mb-1.5" 
            fallbackType="flag"
            fallbackName={val}
          />
        );
      }
    }
    
    // Manager headshots
    if (t === "manager" || t === "managed_by") {
      return (
        <SafeImage 
          src={getManagerPhoto(val, theme)} 
          alt={val} 
          className="w-7 h-7 rounded-full object-cover border border-slate-300 shadow-xxs shrink-0 mt-1 mb-1.5" 
          fallbackType="manager"
          fallbackName={val}
        />
      );
    }
    
    // Professional league crest visual
    if (t === "league") {
      return (
        <SafeImage 
          src={getLeagueLogo(val, theme)} 
          alt={val} 
          className="w-7 h-7 rounded-full object-contain border border-slate-300 bg-white p-0.5 shadow-xxs shrink-0 mt-1 mb-1.5" 
          fallbackType="league"
          fallbackName={val}
        />
      );
    }

    // Professional club crest visual
    if (t === "club" || t === "team") {
      return (
        <SafeImage 
          src={getClubLogo(val, theme)} 
          alt={val} 
          className="w-7 h-7 rounded-full object-contain border border-slate-300 bg-white p-0.5 shadow-xxs shrink-0 mt-1 mb-1.5" 
          fallbackType="league"
          fallbackName={val}
          theme={theme}
        />
      );
    }
    
    // Trophy pictures
    if (t === "trophy" || val.toLowerCase().includes("win") || val.toLowerCase().includes("championship") || val.toLowerCase().includes("cup") || val.toLowerCase().includes("ballon")) {
      return (
        <SafeImage 
          src={getTrophyPhoto(val, theme)} 
          alt={val} 
          className="w-7 h-7 rounded-lg object-cover border border-slate-300 shadow-xxs shrink-0 mt-1 mb-1.5" 
          fallbackType="trophy"
          fallbackName={val}
        />
      );
    }
    
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-6" id="football-grid-game">
      {/* Settings Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row gap-5 items-center justify-between shadow-xs">
        <div className="flex flex-col gap-1.5 align-left text-left w-full md:w-auto">
          <label className="text-xs font-mono text-emerald-600 tracking-wider font-extrabold uppercase">Match Settings</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSetup(prev => ({ ...prev, gameMode: 'single' }));
                generateNewGrid(setup.solvable);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                setup.gameMode === 'single'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
              }`}
            >
              <User size={14} /> Single Player
            </button>
            <button
              onClick={() => {
                setSetup(prev => ({ ...prev, gameMode: 'two-player' }));
                generateNewGrid(setup.solvable);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                setup.gameMode === 'two-player'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
              }`}
            >
              <Users size={14} /> Local 2 Player
            </button>
            <button
              onClick={() => {
                setSetup(prev => ({ ...prev, allowRepeats: !prev.allowRepeats }));
              }}
              className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                setup.allowRepeats
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                  : 'bg-slate-150 hover:bg-slate-200 text-slate-500 border border-slate-200'
              }`}
            >
              🔄 {setup.allowRepeats ? "Allow Player Repeats" : "No Repeating Players"}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 align-left text-left w-full md:w-auto">
          <label className="text-xs font-mono text-emerald-600 tracking-wider font-extrabold uppercase">Solvability</label>
          <div className="flex gap-2">
            <button
              onClick={() => generateNewGrid(true)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                setup.solvable
                  ? 'bg-emerald-50 border-emerald-500 text-slate-950 font-black'
                  : 'bg-slate-100 border-slate-250 text-slate-500 hover:text-slate-800'
              }`}
            >
              Must Be Solvable
            </button>
            <button
              onClick={() => generateNewGrid(false)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                !setup.solvable
                  ? 'bg-rose-500 border-rose-500 text-white font-black'
                  : 'bg-slate-100 border-slate-250 text-slate-500 hover:text-slate-800'
              }`}
            >
              Chaotic Mode
            </button>
          </div>
        </div>

        <div className="w-full md:w-auto text-right">
          <button
            onClick={() => generateNewGrid(setup.solvable)}
            className="w-full md:w-auto px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer text-xs uppercase tracking-wider"
            disabled={loading}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            New Grid Pairings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Game Main Area */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Active Turn/Winner Callout scoreboard */}
          <div className="bg-slate-900 border-t-4 border-emerald-500 rounded-xl p-4 flex items-center justify-between text-center text-white shadow-md">
            {setup.gameMode === 'two-player' ? (
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${cells.filter(c => c.owner === 'X').length > cells.filter(c => c.owner === 'O').length ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>X</span>
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400 font-mono font-bold uppercase leading-none">PLAYER 1 (Blue)</p>
                    <p className="text-xs font-bold text-slate-200 mt-1">{cells.filter(c => c.owner === 'X').length} claimed</p>
                  </div>
                </div>
                <div>
                  {winner ? (
                    <div className="text-base font-black text-emerald-400 uppercase tracking-tight">
                      {winner === 'draw' ? "Match Draw!" : `${winner === 'X' ? 'Player 1' : 'Player 2'} Wins! 🎉`}
                    </div>
                  ) : (
                    <div className="px-3 py-1 bg-slate-800 rounded text-[10px] font-mono font-bold text-amber-400 animate-pulse uppercase tracking-wider border border-slate-700">
                      TURN: {currentTurn === 'X' ? 'PLAYER 1' : 'PLAYER 2'}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-mono font-bold uppercase leading-none">PLAYER 2 (Orange)</p>
                    <p className="text-xs font-bold text-slate-200 mt-1">{cells.filter(c => c.owner === 'O').length} claimed</p>
                  </div>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${cells.filter(c => c.owner === 'O').length > cells.filter(c => c.owner === 'X').length ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'}`}>O</span>
                </div>
              </div>
            ) : (
              <div className="w-full flex items-center justify-between">
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 font-mono font-bold">SINGLE PLAYER GAME</p>
                  <p className="text-sm font-black text-slate-100 mt-0.5 uppercase tracking-wide">Fill all 9 grid combinations</p>
                </div>
                <div className="flex gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400">GUESSES:</span> <span className="font-bold text-emerald-400">{guessesCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">FAILED:</span> <span className="font-bold text-rose-400">{mistakesCount}</span>
                  </div>
                </div>
                {winner && (
                  <div className="text-xs font-bold text-emerald-450 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded flex items-center gap-1">
                    <CheckCircle size={12} /> Grid Completed!
                  </div>
                )}
              </div>
            )}
          </div>
 
          {/* Immaculate Grid Container */}
          <div className="bg-slate-200 border border-slate-350 rounded-2xl p-2 relative shadow-sm overflow-x-auto">
            
            {/* Loading Cover */}
            {loading && setup.rows.length === 0 && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3 rounded-2xl z-20">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
                <p className="text-xs font-mono text-slate-600 font-semibold tracking-wider">Analyzing football statistics...</p>
              </div>
            )}
 
            <div className="min-w-[500px] grid grid-cols-4 gap-1.5 p-1 bg-slate-250 rounded-xl">
              {/* Corner Empty cell */}
              <div className="aspect-square flex items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200 relative">
                <span className="absolute bottom-2 right-2 font-mono text-[9px] font-bold text-slate-400 uppercase">GOALGRID</span>
              </div>
 
              {/* Column Headers */}
              {setup.cols.map((col, idx) => (
                <div key={`col-${idx}`} className="aspect-square flex flex-col items-center justify-center p-3 text-center rounded-xl bg-slate-100 border border-slate-200 shadow-xs relative">
                  <span className="absolute top-2 left-2 text-[8px] text-slate-500 font-black tracking-wider font-mono">COLUMN {idx+1}</span>
                  {renderCriteriaBadge(col)}
                  <div className="mt-1 font-black text-slate-800 text-[11px] sm:text-xs line-clamp-2 leading-tight uppercase tracking-tight">
                    {col.value}
                  </div>
                  <span className="text-[8px] font-mono text-slate-400 mt-1 uppercase tracking-wider">{col.type}</span>
                </div>
              ))}

              {/* Rows with Headers & Cells */}
              {[0, 1, 2].map((rowIdx) => {
                const rowCrit = setup.rows[rowIdx];
                return (
                  <div key={`row-wrapper-${rowIdx}`} className="contents">
                    {/* Row Header */}
                    <div className="aspect-square flex flex-col items-center justify-center p-3 text-center rounded-xl bg-slate-100 border border-slate-200 shadow-xs relative">
                      <span className="absolute top-2 left-2 text-[8px] text-slate-500 font-black tracking-wider font-mono">ROW {rowIdx+1}</span>
                      {renderCriteriaBadge(rowCrit)}
                      <div className="mt-1 font-black text-slate-800 text-[11px] sm:text-xs line-clamp-2 leading-tight uppercase tracking-tight">
                        {rowCrit?.value || "..."}
                      </div>
                      <span className="text-[8px] font-mono text-slate-400 mt-1 uppercase tracking-wider">{rowCrit?.type}</span>
                    </div>

                    {/* Cells */}
                    {[0, 1, 2].map((colIdx) => {
                      const cellIdx = rowIdx * 3 + colIdx;
                      const cell = cells[cellIdx];
                      const isActive = activeCell === cellIdx;

                      return (
                        <div
                          key={`cell-${cellIdx}`}
                          onClick={() => handleCellClick(cellIdx)}
                          className={`aspect-square rounded-xl flex flex-col items-center justify-center p-3 text-center relative cursor-pointer border transition-all ${
                            isActive
                              ? 'bg-emerald-50 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                              : cell.owner === 'X'
                              ? 'bg-indigo-50 border-2 border-indigo-400 text-indigo-900 shadow-xs'
                              : cell.owner === 'O'
                              ? 'bg-orange-50 border-2 border-orange-400 text-orange-900 shadow-xs'
                              : 'bg-white hover:bg-emerald-50/50 border-slate-250'
                          }`}
                        >
                          {cell.owner ? (
                            <div className="flex flex-col items-center justify-center gap-1 h-full w-full">
                              <div className="relative shrink-0">
                                <SafeImage 
                                  src={getPlayerPhoto(cell.playerGuess || "", theme)}
                                  alt={cell.playerGuess || ""}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-250 bg-slate-100 shadow-xxs shrink-0"
                                  fallbackType="player"
                                  fallbackName={cell.playerGuess || ""}
                                />
                                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center font-black text-[8px] border border-white text-white ${
                                  cell.owner === 'X' ? 'bg-indigo-600' : 'bg-orange-500'
                                }`}>
                                  {cell.owner}
                                </span>
                              </div>
                              <p className="text-slate-805 font-black text-[10px] sm:text-[11px] line-clamp-1 leading-tight uppercase mt-1">
                                {cell.playerGuess}
                              </p>
                              <span className="text-[7px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1 border border-emerald-250 rounded tracking-wide uppercase">
                                VERIFIED
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-350 hover:text-slate-600 transition-all gap-1">
                              <HelpCircle size={18} className={isActive ? 'text-emerald-500' : 'opacity-40'} />
                              <span className="text-[9px] font-mono font-bold tracking-wider uppercase">SELECT...</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
 
        {/* Input & Logs Area */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Submitting Container */}
          {winner !== null ? (
            <div className="bg-slate-900 border-2 border-emerald-500 rounded-xl p-5 flex flex-col gap-3.5 shadow-md text-white text-left animate-fade-in relative overflow-hidden">
              <div className="flex items-center gap-2">
                <Trophy className="text-amber-405 shrink-0 animate-bounce" size={16} />
                <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-amber-400">Post Match Score</span>
              </div>
              <p className="text-xs text-slate-300 leading-snug">
                You successfully claimed <span className="font-mono font-black text-white">{cells.filter(c => c.owner === 'X').length}/9</span> cells with <span className="font-mono text-white font-bold">{mistakesCount}</span> {mistakesCount === 1 ? 'mistake' : 'mistakes'}. Post this to the world leaderboard!
              </p>
              
              {!submitted ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={submitName}
                    onChange={(e) => setSubmitName(e.target.value)}
                    placeholder="Enter contender name..."
                    className="bg-slate-950 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 placeholder-slate-600 focus:border-emerald-500 font-sans focus:outline-hidden"
                    maxLength={20}
                    autoFocus
                  />
                  <button
                    onClick={async () => {
                      if (!submitName.trim() || submitLoading) return;
                      setSubmitLoading(true);
                      try {
                        const res = await apiFetch('/api/leaderboards/submit', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            playerName: submitName.trim(),
                            gameType: 'tictactoe',
                            score: cells.filter(c => c.owner === 'X').length,
                            tttSolvable: setup.solvable,
                            guessesCount: guessesCount,
                            mistakesCount: mistakesCount,
                            tttMode: setup.gameMode
                          })
                        });
                        if (res.ok) {
                          setSubmitted(true);
                          setLogs(prev => ["🏅 Score successfully posted to global leaderboards!", ...prev]);
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setSubmitLoading(false);
                      }
                    }}
                    disabled={!submitName.trim() || submitLoading}
                    className="bg-emerald-600 hover:bg-emerald-550 text-white text-xs font-black py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
                  >
                    {submitLoading ? <Loader2 size={12} className="animate-spin" /> : <Trophy size={12} />}
                    Publish Ranks
                  </button>
                </div>
              ) : (
                <div className="py-2.5 px-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs leading-normal font-mono font-bold text-emerald-400 text-center uppercase tracking-wide">
                  🎉 SCORE RECORDED IN LEADERBOARDS!
                </div>
              )}
            </div>
          ) : activeCell !== null && currentCellCriteria ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4 shadow-sm text-left align-left">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h3 className={`text-xs font-mono font-extrabold uppercase tracking-wider ${
                  theme === "music" ? "text-purple-600" : theme === "movies" ? "text-amber-600" : "text-emerald-600"
                }`}>Vetting Station</h3>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[10px] font-bold">
                  CELL #{activeCell + 1}
                </span>
              </div>
 
              <div className="flex flex-col gap-1.5 align-left">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  Needs {theme === "music" ? "artist/band" : theme === "movies" ? "actor/director" : "player"} who matches:
                </div>
                <div className="flex flex-col gap-1.5 text-xs font-semibold bg-slate-50 p-3 rounded-lg border border-slate-150">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-bold bg-slate-200 text-slate-700 px-1 py-0.5 rounded">ROW {Math.floor(activeCell/3)+1}</span>
                    <span className="text-slate-855 font-bold">{currentCellCriteria.rowCrit?.value}</span>
                  </div>
                  <div className="h-[1px] bg-slate-200 w-full my-0.5"></div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-bold bg-slate-200 text-slate-700 px-1 py-0.5 rounded">COL {(activeCell%3)+1}</span>
                    <span className="text-slate-855 font-bold">{currentCellCriteria.colCrit?.value}</span>
                  </div>
                </div>
              </div>
 
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  Enter {theme === "music" ? "Artist or Band" : theme === "movies" ? "Actor or Director" : "Player Name"}:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={guessInput}
                    onChange={(e) => setGuessInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitGuess()}
                    placeholder={
                      theme === "music" 
                        ? "e.g. Taylor Swift, The Beatles, Ed Sheeran..." 
                        : theme === "movies" 
                          ? "e.g. Leonardo DiCaprio, Tom Hanks, Christopher Nolan..." 
                          : "e.g. Lionel Messi, Zidane, Cole Palmer..."
                    }
                    className={`flex-1 bg-white border-2 border-slate-200 focus:outline-hidden rounded px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-all font-sans ${
                      theme === "music" 
                        ? "focus:border-purple-500" 
                        : theme === "movies" 
                          ? "focus:border-amber-500" 
                          : "focus:border-emerald-500"
                    }`}
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    onClick={submitGuess}
                    disabled={loading || !guessInput.trim()}
                    className={`font-bold px-4 py-2 rounded text-xs uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 ${
                      theme === "music" 
                        ? "bg-purple-600 hover:bg-purple-700 text-white" 
                        : theme === "movies" 
                          ? "bg-amber-500 hover:bg-amber-600 text-slate-950" 
                          : "bg-emerald-600 hover:bg-emerald-500 text-white"
                    }`}
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 border-dashed rounded-xl p-6 text-center text-slate-400 flex flex-col items-center justify-center gap-2 min-h-[180px] shadow-xs">
              <Info size={20} className="opacity-40 text-slate-400" />
              <p className="text-xs max-w-[200px] leading-relaxed font-medium">
                Select any active grid block above to evaluate a matching {theme === "music" ? "artist or band" : theme === "movies" ? "actor or director" : "footballer"}!
              </p>
            </div>
          )}
 
          {/* Feedback & Referee Alert */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2 shadow-xs text-left align-left">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">
              {theme === "music" ? "Record Label Vetting" : theme === "movies" ? "Studio Vetting" : "Referee Evaluation"}
            </span>
            {errorText ? (
              <div className="flex flex-col gap-2 w-full">
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded flex gap-2 items-start leading-snug">
                  <XCircle size={14} className="shrink-0 mt-0.5 text-rose-500" />
                  <div className="font-semibold">{errorText}</div>
                </div>
                
                {lastFailedVerify && (
                  <div className="border border-amber-250 bg-amber-50/50 rounded-lg p-3 flex flex-col gap-2">
                    <p className="text-[11px] text-amber-900 leading-normal">
                      🙋‍♂️ <strong>{
                        theme === "music" 
                          ? "Dispute Critic Ruling?" 
                          : theme === "movies" 
                            ? "Dispute Studio Reject?" 
                            : "Dispute Referee Call?"
                      }</strong> If you believe <strong>"{lastFailedVerify.guessedPlayerName}"</strong> legitimately matches <strong>{lastFailedVerify.rowCrit.value}</strong> and satisfies <strong>{lastFailedVerify.colCrit.value}</strong>, {
                        theme === "music" 
                          ? "call your record label manager to check the album databases." 
                          : theme === "movies" 
                            ? "call your talent agent to review the film contracts." 
                            : "summon the Supreme Referee VAR check."
                      }
                    </p>
                    <div className="flex flex-col gap-1.5 my-1">
                      <label id="ttt-dispute-reason-label" className="text-[10px] uppercase font-bold text-amber-800 font-mono">
                        Provide evidence to prove your claim & convince VAR:
                      </label>
                      <input
                        id="ttt-dispute-reason-input"
                        type="text"
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder={
                          theme === "music"
                            ? "e.g., Released under alternate moniker, charted in 2025..."
                            : theme === "movies"
                              ? "e.g., Starred in an uncredited cameo or executive produced..."
                              : "e.g., Transferred to Man City in 2024, won UCL with PSG in 2025..."
                        }
                        className="w-full bg-white border border-amber-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-400"
                      />
                    </div>

                    <button
                      onClick={handleDispute}
                      disabled={disputeLoading}
                      className={`px-3 py-1.5 disabled:opacity-50 text-white font-bold text-[10px] uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 self-start shadow-xxs ${
                        theme === "music" 
                          ? "bg-purple-600 hover:bg-purple-500" 
                          : theme === "movies" 
                            ? "bg-amber-600 hover:bg-amber-500 text-white" 
                            : "bg-amber-600 hover:bg-amber-500"
                      }`}
                    >
                      {disputeLoading ? (
                        <>
                          <Loader2 size={11} className="animate-spin" /> {
                            theme === "music" 
                              ? "Record label checking release logs..." 
                              : theme === "movies" 
                                ? "Talent agent checking film contracts..." 
                                : "Deep checking archives..."
                          }
                        </>
                      ) : (
                        theme === "music" 
                          ? "📞 Call My Record Label!" 
                          : theme === "movies" 
                            ? "📞 Call My Talent Agent!" 
                            : "⚖️ Launch VAR Dispute Check"
                      )}
                    </button>
                    {disputeFeedback && (
                      <div className="text-[11px] font-medium text-rose-800 bg-rose-50 p-2.5 border border-rose-200 rounded leading-relaxed mt-1">
                        {disputeFeedback}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : infoText ? (
              <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 p-2.5 rounded flex gap-2 items-start leading-snug">
                <CheckCircle size={14} className="shrink-0 mt-0.5 text-emerald-600" />
                <div className="font-semibold">{infoText}</div>
              </div>
            ) : null}
          </div>
 
          {/* Activity Logs */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2.5 shadow-xs flex-1 min-h-[150px] max-h-[250px] overflow-y-auto text-left align-left">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase block">Grid Match History</span>
            <div className="flex flex-col gap-1.5 overflow-y-auto pr-1">
              {logs.length > 0 ? (
                logs.map((log, lIdx) => (
                  <div key={`log-${lIdx}`} className="text-[11px] font-mono border-l-2 border-slate-300 pl-2 leading-relaxed text-slate-600">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 font-mono italic">No actions registered yet.</div>
              )}
            </div>
          </div>
 
        </div>
      </div>
    </div>
  );
}
