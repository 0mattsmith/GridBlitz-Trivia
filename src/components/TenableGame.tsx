import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/api';
import { TenableTopic, TenableSetup } from '../types';
import { RefreshCw, Play, Volume2, ShieldCheck, Heart, AlertCircle, Loader2, ArrowUpCircle, Keyboard, Timer, Swords, Compass, Trophy } from 'lucide-react';
import { getPlayerPhoto, getFlagUrl, getTrophyPhoto, getLeagueLogo } from '../lib/images';
import { SafeImage } from './SafeImage';

export default function TenableGame({ theme = "football" }: { theme?: 'football' | 'music' | 'movies' }) {
  const [setup, setSetup] = useState<TenableSetup>({
    livesMode: 'custom',
    livesCount: 5,
    timerMode: 'none',
    timerDuration: 30
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [topic, setTopic] = useState<TenableTopic | null>(null);
  const [revealedItems, setRevealedItems] = useState<(string | null)[]>(Array(10).fill(null));
  const [guessInput, setGuessInput] = useState('');
  const [livesRemaining, setLivesRemaining] = useState(5);
  const [loading, setLoading] = useState(false);
  const [gameResult, setGameResult] = useState<'playing' | 'won' | 'lost' | 'idle'>('idle');
  const [customPrompt, setCustomPrompt] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [infoText, setInfoText] = useState<string | null>("Configure your options and kick off the challenge!");
  
  // Elapsed time stats
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dispute / VAR states
  const [lastFailedVerify, setLastFailedVerify] = useState<{
    guess: string;
    topicTitle: string;
    correctItems: string[];
  } | null>(null);
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeFeedback, setDisputeFeedback] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState<string>("");

  // Leaderboard states
  const [submitted, setSubmitted] = useState(false);
  const [submitName, setSubmitName] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Timer States
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
  const [totalTimerActive, setTotalTimerActive] = useState(false);
  const [roundTimerActive, setRoundTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Monitor theme changes for category reset
  useEffect(() => {
    setIsPlaying(false);
    setGameResult('idle');
    setTopic(null);
    setRevealedItems(Array(10).fill(null));
    setErrorText(null);
    setInfoText(`Switched to ${theme.toUpperCase()} mode! Click "Kick Off Game" to start a new tenable board.`);
  }, [theme]);

  // Timer loop
  useEffect(() => {
    if (isPlaying && gameResult === 'playing') {
      if (setup.timerMode !== 'none') {
        setTimerSecondsLeft(setup.timerDuration);
        
        if (timerRef.current) clearInterval(timerRef.current);
        
        timerRef.current = setInterval(() => {
          setTimerSecondsLeft(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current!);
              // Handle timeout
              handleTimerTimeout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, gameResult, setup.timerMode]);

  // Manage elapsed stopwatch time for leaderboard placement
  useEffect(() => {
    if (isPlaying && gameResult === 'playing') {
      elapsedIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
        elapsedIntervalRef.current = null;
      }
    }
    return () => {
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
        elapsedIntervalRef.current = null;
      }
    };
  }, [isPlaying, gameResult]);

  // Round timer reset helper - called on guess
  const resetRoundTimerOnGuess = () => {
    if (setup.timerMode === 'round' && gameResult === 'playing') {
      setTimerSecondsLeft(setup.timerDuration);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimerSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimerTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleTimerTimeout = () => {
    if (setup.timerMode === 'round') {
      // Lose a life on round timeout
      setLivesRemaining(l => {
        const next = l - 1;
        if (next <= 0 && setup.livesMode !== 'infinite') {
          triggerGameOver(false, "Out of time on that round!");
          return 0;
        }
        setInfoText("⏰ Time's up for that guess! Lost a life. Next round timer started.");
        resetRoundTimerOnGuess();
        return next;
      });
    } else if (setup.timerMode === 'full') {
      // Lose game immediately on full board timeout
      triggerGameOver(false, "Out of time on the global timer!");
    }
  };

  const startNewGame = async () => {
    setLoading(true);
    setErrorText(null);
    setInfoText("Retrieving Tenable board configuration...");
    
    // Reset stopwatch & leaderboard submission settings
    setElapsedSeconds(0);
    setSubmitted(false);
    setSubmitName('');

    // Set initial lives state
    let initialLives = 5;
    if (setup.livesMode === 'zero') initialLives = 1;
    else if (setup.livesMode === 'custom') initialLives = setup.livesCount;
    else initialLives = 99; // Represents infinite
    
    setLivesRemaining(initialLives);
    setRevealedItems(Array(10).fill(null));
    setGuessInput('');

    try {
      const response = await apiFetch('/api/tenable/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customTopicRequest: customPrompt ? customPrompt : undefined, theme })
      });
      const data = await response.json();
      
      setTopic(data);
      setIsPlaying(true);
      setGameResult('playing');
      setInfoText(`The category is: ${data.title}. Good luck!`);
    } catch (err) {
      setErrorText("Problem seeding the trivia category. Ready in offline default modes.");
    } finally {
      setLoading(false);
    }
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
          gameType: "tenable",
          guess: lastFailedVerify.guess,
          topicTitle: lastFailedVerify.topicTitle,
          correctItems: lastFailedVerify.correctItems,
          theme,
          userExplanation: disputeReason
        })
      });

      const data = await res.json();
      if (data.actualCorrect) {
        // Dispute was approved! Re-establish slot
        let emptyIdx = revealedItems.findIndex(item => item === null);
        if (emptyIdx === -1) emptyIdx = 0;

        setRevealedItems(prev => {
          const next = [...prev];
          next[emptyIdx] = data.correctedValue || lastFailedVerify.guess;
          return next;
        });

        // Compensate life if lost
        if (setup.livesMode !== 'infinite') {
          setLivesRemaining(l => l + 1);
        }

        const labelApproved = theme === "music" ? "RECORD LABEL OVERRULE APPROVED!" : (theme === "movies" ? "AGENT REVERSAL APPROVED!" : "VAR OVERRULE APPROVED!");
        setInfoText(`🎉 ${labelApproved} verified list entry: "${data.correctedValue || lastFailedVerify.guess}" at Slot #${emptyIdx + 1}. Proof: ${data.proof}`);
        setErrorText(null);
        setLastFailedVerify(null);
        setDisputeReason("");

        // Check Win Condition
        const currentRevealedCount = revealedItems.filter(item => item !== null).length + 1;
        const targetToGuessCount = Math.min(10, topic?.items.length || 10);
        if (currentRevealedCount >= targetToGuessCount) {
          const winConfirm = theme === "music" ? "Record label verified your final hit!" : theme === "movies" ? "Agent confirmed your box office breakthrough!" : "VAR confirmed your final correct item!";
          triggerGameOver(true, `Perfect board! ${winConfirm}`);
        }
      } else {
        const confirmName = theme === "music" ? "LABELS/CRITICS CONFIRMED NEGATIVE CALL" : (theme === "movies" ? "AGENTS/STUDIO CONFIRMED REJECTION" : "VAR CONFIRMED REF CALL");
        setDisputeFeedback(`✖️ ${confirmName}: ${data.proof}`);
      }
    } catch (err) {
      console.error(err);
      setDisputeFeedback("❌ Connection with Supreme Ref failed.");
    } finally {
      setDisputeLoading(false);
    }
  };

  const handleGuessSubmit = async () => {
    if (!guessInput.trim() || !topic || gameResult !== 'playing' || loading) return;

    setLoading(true);
    setErrorText(null);
    setLastFailedVerify(null);
    setDisputeFeedback(null);

    // Normalize guess to prevent tiny format tricks bypassing duplicate check
    const normInput = guessInput.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "");

    // Strict duplicate check
    const isAlreadyGuessed = revealedItems.some(item => {
      if (!item) return false;
      const normItem = item.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "");
      return normItem === normInput;
    });

    if (isAlreadyGuessed) {
      if (!setup.allowRepeats && setup.livesMode !== 'infinite') {
        const nextLives = livesRemaining - 1;
        setLivesRemaining(nextLives);
        if (nextLives <= 0) {
          triggerGameOver(false, `No lives left! Grid failed. Duplicates are restricted.`);
        } else {
          setErrorText(`❌ "${guessInput}" was already revealed on the board! Duplicate guesses are disabled - lost a life. Remaining: ${nextLives}`);
          resetRoundTimerOnGuess();
        }
      } else {
        setInfoText(`"${guessInput}" was already revealed on the board!`);
      }
      setGuessInput('');
      setLoading(false);
      return;
    }

    try {
      const response = await apiFetch('/api/tenable/verify-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guess: guessInput,
          correctItems: topic.items
        })
      });

      const data = await response.json();

      if (data.isCorrect) {
        const targetIndex = data.matchedIndex;
        // Double safety verify index
        if (revealedItems[targetIndex] !== null) {
          if (!setup.allowRepeats && setup.livesMode !== 'infinite') {
            const nextLives = livesRemaining - 1;
            setLivesRemaining(nextLives);
            if (nextLives <= 0) {
              triggerGameOver(false, `No lives left! Grid failed. True answers revealed.`);
            } else {
              setErrorText(`❌ "${data.matchedValue}" matches an already revealed position! Lost a life. Remaining: ${nextLives}`);
              resetRoundTimerOnGuess();
            }
          } else {
            setInfoText(`"${data.matchedValue}" is correct but that ranking slot was already revealed!`);
          }
        } else {
          // Correct and unrevealed!
          setRevealedItems(prev => {
            const next = [...prev];
            next[targetIndex] = data.matchedValue;
            return next;
          });
          setInfoText(`⭐ Superb guess! Revealed Rank #${targetIndex + 1}: ${data.matchedValue}`);
          setGuessInput('');

          // Reset the round timer if active
          resetRoundTimerOnGuess();

          // Check Win Condition
          const currentRevealedCount = revealedItems.filter(item => item !== null).length + 1; // including the new one
          const targetToGuessCount = Math.min(10, topic.items.length);
          
          if (currentRevealedCount >= targetToGuessCount) {
            triggerGameOver(true, "Perfect board! You named all 10 answers!");
          }
        }
      } else {
        // Incorrect guess - Record and penalize
        setLastFailedVerify({
          guess: guessInput,
          topicTitle: topic.title,
          correctItems: topic.items
        });

        if (setup.livesMode !== 'infinite') {
          const nextLives = livesRemaining - 1;
          setLivesRemaining(nextLives);
          
          if (nextLives <= 0) {
            triggerGameOver(false, `No lives left! Grid failed. True answers revealed.`);
          } else {
            setErrorText(`❌ "${guessInput}" is incorrect! Lost a life. Remaining: ${nextLives}`);
            resetRoundTimerOnGuess();
          }
        } else {
          setErrorText(`❌ "${guessInput}" is not on our board! Unlimited lives, try again.`);
          resetRoundTimerOnGuess();
        }
        setGuessInput('');
      }
    } catch {
      setErrorText("Communication mismatch. Try re-typing that guess.");
    } finally {
      setLoading(false);
    }
  };

  const triggerGameOver = (won: boolean, reason: string) => {
    setGameResult(won ? 'won' : 'lost');
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (won) {
      setInfoText(`🏆 CONGRATULATIONS! ${reason}`);
    } else {
      setErrorText(`💥 GAME OVER! ${reason}`);
      // Reveal all answers
      if (topic) {
        setRevealedItems(topic.items);
      }
    }
  };

  const giveUpAndReveal = () => {
    if (!topic) return;
    triggerGameOver(false, "Forfeited the board. Master answers revealed below!");
  };

  const exitToLobby = () => {
    setIsPlaying(false);
    setGameResult('idle');
    setTopic(null);
    setRevealedItems(Array(10).fill(null));
    setErrorText(null);
    setInfoText("Configure your options and kick off the challenge!");
  };

  return (
    <div className="w-full flex flex-col gap-6" id="tenable-game-board">
      
      {!isPlaying ? (
        /* SETUP PAGE */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col lg:grid lg:grid-cols-12 gap-8 text-left">
          
          {/* Settings Section */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-black font-sans text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                <Swords className="text-emerald-600" /> Football Tenable Arena
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Inspired by the iconic TV gameshow. We give you a topical football query. Can you name all 10 correct answers on the board before running out of striker lives?
              </p>
            </div>

            {/* Lives config */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-mono text-emerald-600 font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                <Heart size={12} className="text-rose-500 fill-rose-500" /> Striker Lives Settings
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSetup(p=>({...p, livesMode: 'zero', livesCount: 1}))}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    setup.livesMode === 'zero'
                      ? 'bg-rose-600 border-rose-650 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Sudden Death (0 Lives Allowed)
                </button>
                <button
                  onClick={() => setSetup(p=>({...p, livesMode: 'custom', livesCount: 5}))}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    setup.livesMode === 'custom'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Standard Lives ({setup.livesCount})
                </button>
                <button
                  onClick={() => setSetup(p=>({...p, livesMode: 'infinite'}))}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    setup.livesMode === 'infinite'
                      ? 'bg-slate-900 border-slate-905 text-emerald-400 shadow-inner'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Unlimited Lives
                </button>
              </div>

              {setup.livesMode === 'custom' && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-600 font-mono">Custom Lives Allocation:</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSetup(p => ({...p, livesCount: Math.max(2, p.livesCount - 1)}))}
                      className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded font-black cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-slate-800">{setup.livesCount}</span>
                    <button 
                      onClick={() => setSetup(p => ({...p, livesCount: Math.min(10, p.livesCount + 1)}))}
                      className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded font-black cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Timer Config */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-mono text-emerald-600 font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                <Timer size={12} /> Optional Countdowns
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSetup(p=>({...p, timerMode: 'none'}))}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    setup.timerMode === 'none'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  No Clock Constraint
                </button>
                <button
                  onClick={() => setSetup(p=>({...p, timerMode: 'round', timerDuration: 30}))}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    setup.timerMode === 'round'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Time Per Guess
                </button>
                <button
                  onClick={() => setSetup(p=>({...p, timerMode: 'full', timerDuration: 120}))}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    setup.timerMode === 'full'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Time Match Board
                </button>
              </div>

              {setup.timerMode !== 'none' && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-600 font-mono">
                    {setup.timerMode === 'round' ? 'Round Countdown duration:' : 'Total Match duration:'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSetup(p => ({...p, timerDuration: Math.max(10, p.timerDuration - 10)}))}
                      className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded font-black cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-slate-800">{setup.timerDuration}s</span>
                    <button 
                      onClick={() => setSetup(p => ({...p, timerDuration: Math.min(300, p.timerDuration + 10)}))}
                      className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded font-black cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Repetition Rules */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-mono text-emerald-600 font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                🔄 Answer Repetition Restrictions
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSetup(p => ({ ...p, allowRepeats: false }))}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    !setup.allowRepeats
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Strict Duplicates (Lose Life)
                </button>
                <button
                  onClick={() => setSetup(p => ({ ...p, allowRepeats: true }))}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    setup.allowRepeats
                      ? 'bg-emerald-600 border-emerald-650 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Forgive Repeat Guesses
                </button>
              </div>
            </div>
          </div>

          {/* Topic seed / Generation section */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 p-5 rounded-xl flex flex-col gap-4 self-stretch justify-between shadow-xs">
            <div className="flex flex-col gap-3">
              <label className="text-xs font-mono text-emerald-600 font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                <Compass size={12} /> Topic Matchmaker
              </label>
              
              <div className="text-xs text-slate-500 leading-relaxed bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
                <span className="font-bold text-slate-800">Play Mode Options:</span>
                <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-500">
                  <li>Leave prompt empty for balanced pool of pre-curated football boards.</li>
                  <li>Type custom specifications to make Gemini compile a topic on any footballer, club history, and trophies.</li>
                </ul>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-slate-700 font-bold">Gemini Prompt Compiler (Optional)</span>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g., 'French Premier League winners', 'Inter Milan Champions league strikers', 'Managers who coached Zlatan'"
                  className="w-full bg-white border-2 border-slate-200 focus:border-emerald-500 focus:outline-hidden text-xs rounded p-3 min-h-[75px] max-h-[120px] placeholder-slate-400 text-slate-805 transition-all font-mono"
                />
              </div>
            </div>

            <button
              onClick={startNewGame}
              disabled={loading}
              className="w-full bg-emerald-600 text-white font-extrabold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-550 transition-all shadow-xs cursor-pointer text-xs uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin text-white" size={14} />
                  compiling tenable board...
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" />
                  KICK OFF TENABLE MATCH
                </>
              )}
            </button>
          </div>

        </div>
      ) : (
        /* ACTIVE BOARD PAGE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left animate-fade-in">
          
          {/* Main Tenable Board Vertical Columns */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-1 shadow-xs">
              <span className="text-[9px] font-mono text-emerald-600 font-extrabold uppercase tracking-widest leading-none">ACTIVE CATEGORY</span>
              <h2 className="text-lg font-black text-slate-900 font-sans tracking-tight pt-1 leading-snug uppercase">
                {topic?.title}
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-snug font-medium pb-1">{topic?.description}</p>
            </div>

            {/* List 1-10 Gameshow style metallic tower board */}
            <div className="bg-slate-950 border-4 border-slate-900 rounded-2xl p-4 flex flex-col gap-2.5 shadow-lg relative overflow-hidden">
              
              <div className="absolute top-0 bottom-0 left-[38px] w-[2px] bg-slate-900/60 flex flex-col items-center justify-between py-1 z-0"></div>

              {Array(10).fill(null).map((_, idx) => {
                const answer = revealedItems[idx];
                const isRevealed = answer !== null;
                const isDynamicTopicLongerThanCurrent = topic && topic.items.length > idx;
                
                // If the topic generated fewer than 10 items (unlikely but possible), gray out irrelevant items
                const isValidSlot = topic ? idx < topic.items.length : true;

                if (!isValidSlot) return null;

                return (
                  <div
                    key={`slot-${idx}`}
                    className={`h-11 rounded-lg flex items-center pr-4 font-mono text-xs sm:text-sm pl-2 transition-all relative z-10 ${
                      isRevealed
                        ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 shadow-inner'
                        : 'bg-slate-900/50 border border-slate-800/40 select-none'
                    }`}
                  >
                    {/* Position circle indicator or Football image */}
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black mr-4 overflow-hidden shrink-0 bg-slate-800 text-slate-400 border border-slate-700">
                      {isRevealed ? (
                        <SafeImage 
                          src={getPlayerPhoto(answer || "", theme)} 
                          alt="" 
                          className="w-full h-full object-cover rounded-full" 
                          fallbackType="player"
                          fallbackName={answer || ""}
                        />
                      ) : (
                        idx + 1
                      )}
                    </div>

                    <div className="flex-1 font-bold">
                      {isRevealed ? (
                        <span className="text-emerald-350 font-bold uppercase tracking-wider">
                          {answer}
                        </span>
                      ) : (
                        <span className="text-slate-650 tracking-widest text-[10px] select-none">
                          •••••••••••••••••••••
                        </span>
                      )}
                    </div>

                    {isRevealed && (
                      <span className="text-[9px] font-sans bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-sm font-black uppercase tracking-wider border border-emerald-500/20">
                        RANKED
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column Handlers */}
          <div className="lg:col-span-5 flex flex-col gap-4 sticky top-4 font-sans align-left">
            
            {/* Countdown / Stats board */}
            <div className="bg-slate-900 border-t-4 border-emerald-500 rounded-xl p-5 flex flex-col gap-4 shadow-md text-white">
              
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-850 select-none">
                <div className="flex flex-col gap-0.5 text-left items-start">
                  <span className="text-[9px] font-mono text-slate-450 uppercase font-black tracking-widest leading-none">Striker Lives</span>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {setup.livesMode === 'infinite' ? (
                      <span className="text-emerald-400 text-xs font-mono font-bold tracking-widest uppercase">UNLIMITED</span>
                    ) : (
                      <div className="flex gap-1">
                        {Array(Math.max(0, Math.min(10, livesRemaining))).fill(null).map((_, i) => (
                          <Heart key={`heart-${i}`} size={14} className="text-rose-500 fill-rose-500 animate-pulse" />
                        ))}
                        {livesRemaining <= 0 && <span className="text-xs text-rose-450 font-mono uppercase font-bold leading-none mt-1">SUDDEN LOSS</span>}
                      </div>
                    )}
                  </div>
                </div>

                {setup.timerMode !== 'none' && (
                  <div className="flex flex-col gap-0.5 items-end">
                    <span className="text-[9px] font-mono text-slate-450 uppercase font-black tracking-widest">
                      {setup.timerMode === 'round' ? 'ROUND COUNTDOWN' : 'MATCH COUNTDOWN'}
                    </span>
                    <span className={`font-mono text-base font-black tracking-wider mt-1 ${
                      timerSecondsLeft <= 5 ? 'text-rose-400 animate-ping' : 'text-amber-400'
                    }`}>
                      {timerSecondsLeft}s
                    </span>
                  </div>
                )}
              </div>

              {/* Status Board alerts */}
              {errorText && (
                <div className="flex flex-col gap-2 w-full">
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded flex items-start gap-2 leading-relaxed text-left">
                    <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-500" />
                    <div className="font-bold">{errorText}</div>
                  </div>
                  
                  {lastFailedVerify && (
                    <div className="border border-amber-300 bg-amber-50 advisory-panel rounded-lg p-3 text-left flex flex-col gap-2">
                      <p className="text-[11px] text-amber-900 font-sans leading-normal">
                        🙋‍♂️ <strong>{
                          theme === "music" 
                            ? "Dispute Record Ruling?" 
                            : theme === "movies" 
                              ? "Dispute Star/Film Ruling?" 
                              : "Dispute Tenable Ruling?"
                        }</strong> If you believe <strong>"{lastFailedVerify.guess}"</strong> genuinely fits the category of <strong>"{lastFailedVerify.topicTitle}"</strong>, {
                          theme === "music" 
                            ? "call your record label to appeal the tracking chart rejects." 
                            : theme === "movies" 
                              ? "call your talent agent to challenge this film inclusion." 
                              : "summon the Supreme Referee's VAR review."
                        }
                      </p>
                      <div className="flex flex-col gap-1.5 my-1 text-left align-left">
                        <label id="tenable-dispute-reason-label" className="text-[10px] uppercase font-bold text-amber-800 font-mono">
                          Provide evidence to prove your claim & convince VAR:
                        </label>
                        <input
                          id="tenable-dispute-reason-input"
                          type="text"
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          placeholder={
                            theme === "music"
                              ? "e.g., Hit #1 on Billboard top albums in 2026..."
                              : theme === "movies"
                                ? "e.g., Directed by Christopher Nolan, budget exceeded..."
                                : "e.g., He has 100+ Champions League caps, played for PSG and Man City..."
                          }
                          className="w-full bg-white border border-amber-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-400"
                        />
                      </div>
                      <button
                        onClick={handleDispute}
                        disabled={disputeLoading}
                        className={`px-2.5 py-1.5 disabled:opacity-50 text-white font-bold text-[10px] uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1 self-start shadow-xs ${
                          theme === "music" 
                            ? "bg-purple-600 hover:bg-purple-500" 
                            : theme === "movies" 
                              ? "bg-amber-600 hover:bg-amber-500 text-white" 
                              : "bg-amber-600 hover:bg-amber-500"
                        }`}
                      >
                        {disputeLoading ? (
                          theme === "music" 
                            ? "📞 RECORD LABEL AUDITING GRAPH..." 
                            : theme === "movies" 
                              ? "📞 CALLING PRODUCERS FOR RE-EDIT..." 
                              : "⚖️ Supreme Ref reviewing archives..."
                        ) : (
                          theme === "music" 
                            ? "📞 Call My Record Label!" 
                            : theme === "movies" 
                              ? "📞 Call My Talent Agent!" 
                              : "⚖️ Dispute Answer & Call VAR"
                        )}
                      </button>
                      {disputeFeedback && (
                        <div className="text-[11px] font-medium text-rose-800 bg-rose-50 p-2.5 border border-rose-250 rounded mt-1">
                          {disputeFeedback}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {infoText && (
                <div className="bg-slate-50 border border-slate-200 text-slate-800 text-xs p-3 rounded flex items-start gap-2 leading-relaxed text-left">
                  <ShieldCheck size={14} className="shrink-0 mt-0.5 text-emerald-600" />
                  <div className="font-bold">{infoText}</div>
                </div>
              )}

              {/* Input section */}
              {gameResult === 'playing' ? (
                <div className="flex flex-col gap-2 text-left">
                  <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Answer Input:</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={guessInput}
                      onChange={(e) => setGuessInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGuessSubmit()}
                      placeholder={
                        theme === "music" 
                          ? "e.g. Taylor Swift, Michael Jackson, Abbey Road..." 
                          : theme === "movies" 
                            ? "e.g. Inception, Leonardo DiCaprio, Tom Hanks..." 
                            : "e.g. Didier Drogba, Chelsea, Real Madrid..."
                      }
                      className={`flex-1 bg-slate-950 border border-slate-800 focus:outline-hidden text-sm rounded px-3 py-2 text-slate-100 placeholder-slate-600 transition-all font-sans ${
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
                      onClick={handleGuessSubmit}
                      disabled={loading || !guessInput.trim()}
                      className={`px-4 py-2 rounded font-bold text-xs uppercase flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 ${
                        theme === "music" 
                          ? "bg-purple-600 hover:bg-purple-700 text-white" 
                          : theme === "movies" 
                            ? "bg-amber-500 hover:bg-amber-600 text-slate-950" 
                            : "bg-emerald-600 hover:bg-emerald-555 text-white"
                      }`}
                    >
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <ArrowUpCircle size={14} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed italic mt-1 bg-slate-950/30 p-2.5 border border-slate-800 rounded-sm">
                    💡 Gemini spell check. Surnames, orthographic slips, or short names are dynamically evaluated and validated.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 py-1 bg-slate-950 p-4 border border-slate-850 rounded-lg">
                  <div className={`text-center py-3 rounded font-black text-sm uppercase ${
                    gameResult === 'won' ? 'text-emerald-400 font-sans' : 'text-rose-500 font-sans'
                  }`}>
                    {gameResult === 'won' ? '🏆 BOARD CONQUERED!' : '💥 BOARD EXPIRED.'}
                    <p className="text-[10px] text-slate-450 font-mono tracking-wide mt-1 uppercase font-bold">
                      Guesses completed: {revealedItems.filter(item => item !== null).length} / 10
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono tracking-wide mt-0.5">
                      Time elapsed: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
                    </p>
                  </div>

                  {/* Leaderboard Submission Form */}
                  <div className="mt-2 text-left border-t border-slate-800/60 pt-3 flex flex-col gap-2">
                    <span className="text-[10px] font-mono text-amber-400 font-black tracking-widest uppercase flex items-center gap-1">
                      <Trophy size={11} className="text-amber-400 animate-pulse" /> Register Post-Match Score
                    </span>
                    {!submitted ? (
                      <div className="flex flex-col gap-1.5">
                        <input
                          type="text"
                          value={submitName}
                          onChange={(e) => setSubmitName(e.target.value)}
                          placeholder="Your contender name..."
                          className="bg-slate-900 border border-slate-800 text-xs rounded p-2 text-slate-200 placeholder-slate-600 focus:outline-hidden font-sans"
                          maxLength={20}
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
                                  gameType: 'tenable',
                                  score: revealedItems.filter(item => item !== null).length,
                                  tenableTopicId: topic?.title || 'football',
                                  tenableLivesMode: setup.livesMode,
                                  tenableTimerMode: setup.timerMode,
                                  elapsedSeconds: elapsedSeconds
                                })
                              });
                              if (res.ok) {
                                setSubmitted(true);
                              }
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setSubmitLoading(false);
                            }
                          }}
                          disabled={!submitName.trim() || submitLoading}
                          className="bg-emerald-600 hover:bg-emerald-550 text-white text-xs font-bold py-1.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1 uppercase tracking-wider"
                        >
                          {submitLoading ? <Loader2 size={11} className="animate-spin" /> : <Trophy size={11} />}
                          Publish to Standings
                        </button>
                      </div>
                    ) : (
                      <div className="py-2 bg-emerald-950/40 border border-emerald-500/30 rounded text-[10px] font-mono font-bold text-emerald-400 text-center uppercase tracking-wide">
                        🎉 STANDINGS RECORDED!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Utility actions */}
              <div className="flex gap-2 mt-2">
                {gameResult === 'playing' ? (
                  <button
                    onClick={giveUpAndReveal}
                    className="flex-1 py-2 rounded text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 transition-all cursor-pointer text-center"
                  >
                    Give Up & Show Answers
                  </button>
                ) : (
                  <button
                    onClick={startNewGame}
                    className="flex-1 py-2.5 rounded text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs uppercase tracking-wider"
                  >
                    <RefreshCw size={12} /> Replay board
                  </button>
                )}
                
                <button
                  onClick={exitToLobby}
                  className="px-4 py-2 rounded text-xs font-bold border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer text-center bg-slate-950/40"
                >
                  Exit To lobby
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
