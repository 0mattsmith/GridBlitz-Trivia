import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, RefreshCw, Play, ShieldCheck, AlertCircle, Loader2, HelpCircle, 
  Send, CheckCircle2, XCircle, Clock, Flame, BookOpen, Layers, Settings, Swords
} from 'lucide-react';

interface TopicCard {
  id: string;
  title: string;
  category: string;
  hint: string;
}

interface CorrectAnswer {
  guess: string;
  officialName: string;
  rationale: string;
  index: number;
}

export default function TheFootballGame({ theme = 'football' }: { theme?: 'football' | 'music' | 'movies' }) {
  // Game Setup States
  const [isPlaying, setIsPlaying] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60); // 45s, 60s, 90s, 0 (infinite)
  const [strikesLimit, setStrikesLimit] = useState(3); // 3, 5, 0 (infinite)
  const [timeMode, setTimeMode] = useState<'standard' | 'blitz' | 'marathon' | 'zen'>('standard');
  const [customTopicRequest, setCustomTopicRequest] = useState('');
  const [customTopicActive, setCustomTopicActive] = useState(false);

  // Active Game States
  const [card, setCard] = useState<TopicCard | null>(null);
  const [guessInput, setGuessInput] = useState('');
  const [correctGuesses, setCorrectGuesses] = useState<CorrectAnswer[]>([]);
  const [strikesCount, setStrikesCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStatus, setGameStatus] = useState<'playing' | 'revealing' | 'submitted' | 'idle'>('idle');
  const [loading, setLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);

  // Hints and answers
  const [showHint, setShowHint] = useState(false);
  const [revealSolutions, setRevealSolutions] = useState<string[]>([]);
  const [solutionsLoading, setSolutionsLoading] = useState(false);

  // Feedbacks
  const [feedback, setFeedback] = useState<{
    status: 'correct' | 'incorrect' | 'duplicate' | null;
    message: string;
    detail?: string;
  }>({ status: null, message: '' });

  // Timers and Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Name Submission
  const [playerNickname, setPlayerNickname] = useState('0matthewsmith@gmail.com');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Setup options mapping
  useEffect(() => {
    if (timeMode === 'zen') {
      setTimerDuration(0);
    } else if (timeMode === 'blitz') {
      setTimerDuration(45);
    } else if (timeMode === 'marathon') {
      setTimerDuration(120);
    } else {
      setTimerDuration(60);
    }
  }, [timeMode]);

  // Clean-up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer countdown hook
  useEffect(() => {
    if (isPlaying && gameStatus === 'playing' && timerDuration > 0) {
      setTimeLeft(timerDuration);
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            triggerRoundEnd("Time is out! The referee blew the final whistle.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, gameStatus, timerDuration, card]);

  // Handle Theme Details
  const getThemeConfig = () => {
    switch (theme) {
      case 'music':
        return {
          banner: 'bg-gradient-to-r from-purple-800 to-indigo-900 border-purple-500',
          accentText: 'text-purple-400',
          accentBg: 'bg-purple-100 text-purple-800 border-purple-200',
          ringColor: 'focus:ring-purple-500',
          glowBorder: 'border-purple-500/50 shadow-purple-500/10 shadow-lg',
          primaryBtn: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-800/20',
          secondaryBtn: 'border-purple-300 text-purple-700 hover:bg-purple-50',
          hudBorder: 'border-purple-200',
          pillColor: 'bg-purple-500',
          strikeIcon: '🎵',
          lobbyTitle: 'The Sound Track Card Trivia',
          helpHint: 'Name artists, singers, albums, or band members associated with the card!'
        };
      case 'movies':
        return {
          banner: 'bg-gradient-to-r from-amber-700 to-rose-950 border-amber-500',
          accentText: 'text-amber-400',
          accentBg: 'bg-amber-100 text-amber-800 border-amber-200',
          ringColor: 'focus:ring-amber-500',
          glowBorder: 'border-amber-500/50 shadow-amber-500/10 shadow-lg',
          primaryBtn: 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20 font-black',
          secondaryBtn: 'border-amber-300 text-amber-700 hover:bg-amber-50',
          hudBorder: 'border-amber-200',
          pillColor: 'bg-amber-500',
          strikeIcon: '🎬',
          lobbyTitle: 'Cinematic Cinema Board Trivia',
          helpHint: 'Name actors, directors, releases, or details associated with the film card!'
        };
      default:
        return {
          banner: 'bg-gradient-to-r from-emerald-800 to-slate-900 border-emerald-500',
          accentText: 'text-emerald-400',
          accentBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          ringColor: 'focus:ring-emerald-500',
          glowBorder: 'border-emerald-500/50 shadow-emerald-500/10 shadow-lg',
          primaryBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-800/20',
          secondaryBtn: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
          hudBorder: 'border-emerald-200',
          pillColor: 'bg-emerald-500',
          strikeIcon: '⚽',
          lobbyTitle: 'The Football Topic Game',
          helpHint: 'Name players, managers, teams or championships matching our smart Card standards!'
        };
    }
  };

  const themeConfig = getThemeConfig();

  // Draw Card API
  const getNextCard = async (isCustomRequest = false) => {
    setCardLoading(true);
    setFeedback({ status: null, message: '' });
    setShowHint(false);
    setRevealSolutions([]);
    setCorrectGuesses([]);
    setStrikesCount(0);
    setSubmitSuccess(false);

    try {
      const response = await apiFetch('/api/card-game/generate-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          customPrompt: isCustomRequest ? customTopicRequest : undefined
        })
      });
      if (!response.ok) throw new Error('Network response not ok');
      const data: TopicCard = await response.json();
      setCard(data);
      if (isCustomRequest) {
        setCustomTopicActive(true);
      } else {
        setCustomTopicActive(false);
        setCustomTopicRequest('');
      }
      setGameStatus('playing');
      setIsPlaying(true);
    } catch (e) {
      console.error(e);
      // Hard fallback
      setCard({
        id: 'fc-fallback',
        title: theme === 'music' 
          ? 'Legendary British Rock Bands' 
          : theme === 'movies' 
          ? 'Star Wars theatrical movies' 
          : 'Players who have won the Premiership (Premier League)',
        category: 'Legendary',
        hint: 'Think of extremely successful legends of recent eras!'
      });
      setGameStatus('playing');
      setIsPlaying(true);
    } finally {
      setCardLoading(false);
    }
  };

  // Submit/Verify Guess API
  const handleVerifyGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanGuess = guessInput.trim();
    if (!cleanGuess || !card || loading) return;

    setLoading(true);
    setFeedback({ status: null, message: '' });

    try {
      const response = await apiFetch('/api/card-game/verify-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          topicTitle: card.title,
          guess: cleanGuess,
          alreadyGuessed: correctGuesses.map(cg => cg.officialName)
        })
      });

      if (!response.ok) throw new Error('Validation failed');
      const data = await response.json();

      if (data.duplicate) {
        setFeedback({
          status: 'duplicate',
          message: '❌ Duplicate Answer!',
          detail: data.explanation
        });
        setGuessInput('');
      } else if (data.success) {
        // Correct answer!
        const newCorrect: CorrectAnswer = {
          guess: cleanGuess,
          officialName: data.officialName || cleanGuess,
          rationale: data.rationale || 'Referee validates this answer.',
          index: correctGuesses.length + 1
        };
        setCorrectGuesses(prev => [newCorrect, ...prev]);
        setFeedback({
          status: 'correct',
          message: `✅ CORRECT! matches "${newCorrect.officialName}"`,
          detail: data.rationale
        });
        setGuessInput('');
      } else {
        // Red card or strike!
        const nextStrikes = strikesCount + 1;
        setStrikesCount(nextStrikes);

        setFeedback({
          status: 'incorrect',
          message: `❌ REJECTED: "${cleanGuess}"`,
          detail: data.rationale || 'Does not fit the card criteria according to the official referee.'
        });

        if (strikesLimit > 0 && nextStrikes >= strikesLimit) {
          triggerRoundEnd(`Game Over! You reached ${strikesLimit} strikes.`);
        }
        setGuessInput('');
      }
    } catch (error) {
      console.error(error);
      setFeedback({
        status: 'incorrect',
        message: 'ERROR checking answer. Referee fell asleep. Please retry!'
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerRoundEnd = (message: string) => {
    setGameStatus('revealing');
    if (timerRef.current) clearInterval(timerRef.current);
    
    setFeedback(prev => ({
      status: prev.status || 'incorrect',
      message: message,
      detail: prev.detail || 'The board trivia round has concluded.'
    }));

    // Procure potential solutions to display for the user
    fetchRoundSolutions();
  };

  const fetchRoundSolutions = async () => {
    if (!card) return;
    setSolutionsLoading(true);
    try {
      const response = await apiFetch('/api/card-game/get-possible-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          topicTitle: card.title
        })
      });
      const data = await response.json();
      setRevealSolutions(data.answers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSolutionsLoading(false);
    }
  };

  // Submit high score to Leaderboard endpoint
  const handleSubmitScore = async () => {
    if (!playerNickname || correctGuesses.length === 0 || submitLoading) return;
    setSubmitLoading(true);
    try {
      const response = await apiFetch('/api/leaderboards/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: playerNickname,
          gameType: 'tenable', // Place in Tenable or use custom
          score: correctGuesses.length,
          tenableTopic: `[Card Blitz] ${card?.title}`,
          tenableTimerMode: timerDuration > 0 ? 'round' : 'none',
          tenableLivesMode: strikesLimit > 0 ? 'custom' : 'infinite'
        })
      });
      if (response.ok) {
        setSubmitSuccess(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetLobby = () => {
    setIsPlaying(false);
    setGameStatus('idle');
    setCard(null);
    setCorrectGuesses([]);
    setStrikesCount(0);
    setFeedback({ status: null, message: '' });
    setCustomTopicActive(false);
    setCustomTopicRequest('');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden relative" id="the-football-game-mode">
      
      {/* Header Banner */}
      <div className={`p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center ${themeConfig.banner} border-b transition-colors duration-300`}>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">{themeConfig.strikeIcon}</span>
            <span className="text-xs uppercase font-extrabold tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
              Topic Cards Mode
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter mt-1">
            {themeConfig.lobbyTitle}
          </h1>
          <p className="text-xs text-white/80 max-w-xl mt-1">
            Name as many answers as you can for the drawn trivia topic card. The Chief Referee uses Gemini AI and Google Search to verify correct answers instantly!
          </p>
        </div>
        {isPlaying && (
          <button
            onClick={resetLobby}
            className="mt-4 md:mt-0 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm flex items-center space-x-1.5 cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Reset Match</span>
          </button>
        )}
      </div>

      {/* Main Content Arena */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {!isPlaying ? (
            /* ================= SETUP LOBBY VIEW ================= */
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-2xl mx-auto flex flex-col gap-6 py-6"
            >
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150 space-y-4">
                <div className="flex items-center space-x-2 text-slate-850">
                  <Swords size={18} className={themeConfig.accentText} />
                  <h3 className="text-sm font-black uppercase font-mono tracking-tight">Configure Your Match Rules</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Preset Timer Modes */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Time Countdown Limit</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => setTimeMode('standard')}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                          timeMode === 'standard' 
                            ? 'bg-slate-900 border-slate-900 text-white' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        ⏱️ Standard (60s)
                      </button>
                      <button
                        onClick={() => setTimeMode('blitz')}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                          timeMode === 'blitz' 
                            ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        ⚡ Blitz (45s)
                      </button>
                      <button
                        onClick={() => setTimeMode('marathon')}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                          timeMode === 'marathon' 
                            ? 'bg-slate-900 border-slate-900 text-white' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        🏃 Marathon (120s)
                      </button>
                      <button
                        onClick={() => setTimeMode('zen')}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                          timeMode === 'zen' 
                            ? 'bg-slate-900 border-slate-900 text-white' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        🧘 Infinite Zen
                      </button>
                    </div>
                  </div>

                  {/* Strikes / Mistakes */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Referee Strikes / Red Cards</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[3, 5, 0].map(s => (
                        <button
                          key={s}
                          onClick={() => setStrikesLimit(s)}
                          className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                            strikesLimit === s 
                              ? 'bg-slate-900 border-slate-900 text-white' 
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {s === 0 ? '♾️ Unlimited' : `❌ ${s} Strikes`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom AI Card Request Box */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🧠</span>
                  <h3 className="text-sm font-black uppercase font-mono text-slate-850">Custom Card Generator</h3>
                </div>
                <p className="text-xs text-slate-600">
                  Want to play a highly specific topic? Type your prompt below and Gemini will generate a custom card on-the-fly (e.g. <i>"Current players with tattoos"</i> or <i>"Singers who have starred in Disney series"</i>).
                </p>
                <div className="flex space-x-2 mt-2">
                  <input
                    type="text"
                    value={customTopicRequest}
                    onChange={(e) => setCustomTopicRequest(e.target.value)}
                    placeholder="E.g. Footballers who played for both Arsenal and Chelsea..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-slate-950 focus:outline-none"
                  />
                  {customTopicRequest.trim().length > 0 && (
                    <button
                      onClick={() => getNextCard(true)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-colors flex items-center space-x-1.5 cursor-pointer ${themeConfig.primaryBtn}`}
                    >
                      <span>Create & Play</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Start Curated Game Action */}
              <div className="pt-2 text-center flex flex-col gap-2 items-center">
                <button
                  onClick={() => getNextCard(false)}
                  disabled={cardLoading}
                  className={`w-full py-4 text-sm font-black uppercase tracking-wider rounded-2xl flex items-center justify-center space-x-2 transition-all scale-102 hover:scale-103 duration-200 cursor-pointer ${themeConfig.primaryBtn}`}
                >
                  {cardLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Shuffling Deck...</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      <span>Deal Random Curated Card</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">
                  Contains over 250+ digital card permutations!
                </span>
              </div>
            </motion.div>
          ) : (
            /* ================= ACTIVE GAMEPLAY VIEW ================= */
            <motion.div
              key="gameplay"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              ref={containerRef}
            >
              {/* LEFT SIDE: Card and Input */}
              <div className="col-span-1 lg:col-span-7 space-y-6">
                
                {/* Visual Physics Card Mock */}
                {card && (
                  <motion.div
                    whileHover={{ scale: 1.01, rotateY: 1 }}
                    style={{ perspective: 1000 }}
                    className={`rounded-2xl p-6 border-2 flex flex-col justify-between min-h-[220px] bg-slate-900 text-white relative overflow-hidden transition-all duration-300 ${themeConfig.glowBorder}`}
                  >
                    {/* Retro Football Card Background Patterns */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/2 rounded-full blur-xl -ml-6 -mb-6"></div>

                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded-md font-bold tracking-widest text-[#FFF]">
                        {card.category || 'Topic Card'}
                      </span>
                      {customTopicActive && (
                        <span className="text-[9px] font-bold font-mono tracking-tight bg-emerald-500 text-slate-900 px-1.5 py-0.5 rounded">
                          ✨ AI Custom Card
                        </span>
                      )}
                    </div>

                    <div className="my-4">
                      <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight leading-tight">
                        {card.title}
                      </h2>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <button
                        onClick={() => setShowHint(!showHint)}
                        className="text-xs font-mono underline hover:text-slate-300 flex items-center space-x-1 cursor-pointer"
                      >
                        <BookOpen size={13} />
                        <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {card.id}</span>
                    </div>

                    {showHint && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 p-3 bg-white/10 rounded-xl text-xs text-slate-200 border border-white/5"
                      >
                        💡 <strong>Hint:</strong> {card.hint}
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Submitting Guesses Section */}
                {gameStatus === 'playing' && (
                  <form onSubmit={handleVerifyGuess} className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={guessInput}
                        onChange={(e) => setGuessInput(e.target.value)}
                        placeholder="Type answer here (e.g. Messi, Oasis, Inception)..."
                        autoFocus
                        disabled={loading}
                        className={`w-full bg-slate-50 border border-slate-300 rounded-2xl px-5 py-4 font-bold text-slate-900 placeholder-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:bg-white text-base sm:text-lg transition-all ${themeConfig.ringColor}`}
                      />
                      <button
                        type="submit"
                        disabled={loading || !guessInput.trim()}
                        className={`absolute right-3.5 top-3.5 p-2 rounded-xl transition-all cursor-pointer ${
                          guessInput.trim() ? 'bg-slate-900 text-white hover:scale-105' : 'text-slate-300'
                        }`}
                      >
                        {loading ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Send size={18} />
                        )}
                      </button>
                    </div>

                    {/* Referee Review HUD Spinner */}
                    {loading && (
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center space-x-3 text-slate-600 animate-pulse">
                        <Loader2 size={16} className="animate-spin text-slate-900" />
                        <span className="text-xs font-black font-mono uppercase tracking-tight">
                          👮 Chief Referee Vetting guess against Deep Archives...
                        </span>
                      </div>
                    )}

                    {/* Feedback Messages */}
                    {feedback.status && !loading && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl border ${
                          feedback.status === 'correct' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : feedback.status === 'duplicate'
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                        }`}
                      >
                        <div className="flex items-center space-x-2 font-bold text-sm">
                          {feedback.status === 'correct' ? (
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle size={16} className="text-rose-600 shrink-0" />
                          )}
                          <span>{feedback.message}</span>
                        </div>
                        {feedback.detail && (
                          <p className="text-xs mt-1 text-slate-700 font-medium pl-6 leading-relaxed">
                            {feedback.detail}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </form>
                )}

                {/* GAME END / REF DETAILS REVEAL */}
                {gameStatus === 'revealing' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-black uppercase text-slate-900">Round Review</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        You finished the card round with <strong className="text-slate-800">{correctGuesses.length} correct answers</strong>.
                      </p>
                    </div>

                    {/* Submit High Score Flow */}
                    <div className="p-4 bg-white border border-slate-150 rounded-xl space-y-3">
                      <div className="flex items-center space-x-1.5">
                        <Trophy size={15} className="text-amber-500" />
                        <h4 className="text-xs font-black uppercase font-mono tracking-tight text-slate-850">Submit Score to Global Standings</h4>
                      </div>
                      
                      {!submitSuccess ? (
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={playerNickname}
                            onChange={(e) => setPlayerNickname(e.target.value)}
                            placeholder="Enter your name..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-slate-950 focus:outline-none"
                          />
                          <button
                            onClick={handleSubmitScore}
                            disabled={submitLoading || !playerNickname.trim() || correctGuesses.length === 0}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer ${themeConfig.primaryBtn}`}
                          >
                            {submitLoading ? 'Saving...' : 'Submit Score'}
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-emerald-700 font-bold flex items-center space-x-1">
                          <span>✅ Score saved successfully on the leaderboard!</span>
                        </div>
                      )}
                    </div>

                    {/* Possible Answers Table */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono uppercase bg-slate-200 px-2.5 py-0.5 rounded-md font-bold tracking-widest text-slate-700">
                          Possible Correct Answers
                        </span>
                        {solutionsLoading && <Loader2 size={12} className="animate-spin text-slate-400" />}
                      </div>

                      {solutionsLoading ? (
                        <div className="text-center py-4 text-xs text-slate-400 font-mono uppercase">
                          Generating possible correct answers via Gemini...
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {revealSolutions.map((sol, index) => (
                            <div key={index} className="p-2.5 bg-white border border-slate-150 rounded-lg text-xs text-slate-700 font-medium font-mono text-center truncate">
                              🔹 {sol}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action bar */}
                    <div className="pt-2 flex space-x-2">
                      <button
                        onClick={() => getNextCard(false)}
                        className={`flex-1 py-3 text-xs font-bold uppercase rounded-xl cursor-pointer ${themeConfig.primaryBtn}`}
                      >
                        Next Topic Card 🃏
                      </button>
                      <button
                        onClick={resetLobby}
                        className="py-3 px-4 border border-slate-350 hover:bg-slate-100 rounded-xl text-xs font-bold uppercase text-slate-700 cursor-pointer"
                      >
                        Back to Lobby
                      </button>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* RIGHT SIDE: HUD, Stats and Decoded Answers */}
              <div className="col-span-1 lg:col-span-5 space-y-6">
                
                {/* Scoreboard Hud Panel */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-[10px] uppercase font-black font-mono tracking-widest text-slate-500">Live Match HUD</span>
                    <span className="text-xs font-bold text-slate-400 uppercase">RULE SET</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Score */}
                    <div className="bg-white border border-slate-150 p-3 rounded-xl text-center shadow-inner">
                      <p className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-tight">SCORE</p>
                      <p className="text-xl font-extrabold text-slate-900 mt-0.5">{correctGuesses.length}</p>
                    </div>

                    {/* Lives / Strikes */}
                    <div className="bg-white border border-slate-150 p-3 rounded-xl text-center shadow-inner">
                      <p className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-tight">STRIKES</p>
                      {strikesLimit > 0 ? (
                        <div className="flex justify-center items-center space-x-0.5 mt-1 font-mono text-xs font-black">
                          {Array.from({ length: strikesLimit }).map((_, i) => (
                            <span 
                              key={i} 
                              className={i < strikesCount ? 'text-rose-500 animate-bounce' : 'text-slate-300 opacity-60'}
                            >
                              ❌
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xl font-extrabold text-[#10b981] mt-0.5">♾️</p>
                      )}
                    </div>

                    {/* Timer Countdown */}
                    <div className="bg-white border border-slate-150 p-3 rounded-xl text-center shadow-inner relative overflow-hidden">
                      <p className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-tight">TIME LEFT</p>
                      {timerDuration > 0 ? (
                        <p className={`text-xl font-black font-mono mt-0.5 ${timeLeft <= 10 ? 'text-rose-600 animate-pulse scale-102' : 'text-slate-900'}`}>
                          {timeLeft}s
                        </p>
                      ) : (
                        <p className="text-xl font-extrabold text-slate-900 mt-0.5">ZEN</p>
                      )}
                    </div>
                  </div>

                  {gameStatus === 'playing' && (
                    <button
                      onClick={() => triggerRoundEnd("Gave up! Round surrendered to inspect referee answers.")}
                      className="w-full py-2 bg-slate-200 border border-slate-300 text-slate-700 hover:bg-slate-300 hover:text-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      🏳️ Surrender / End Round
                    </button>
                  )}
                </div>

                {/* Score Log Stack Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 flex flex-col min-h-[250px]">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-[10px] uppercase font-black font-mono tracking-widest text-slate-500">Correct Answers ({correctGuesses.length})</span>
                    <span className="text-[8px] font-mono text-slate-400 font-bold uppercase">Chronological order</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[350px] pr-1">
                    <AnimatePresence>
                      {correctGuesses.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 font-mono text-xs py-10">
                          <span>📭 Empty Sheet</span>
                          <span className="text-[10px] mt-0.5 text-slate-400">Successfully vetted answers list here</span>
                        </div>
                      ) : (
                        correctGuesses.map((cg, idx) => (
                          <motion.div
                            key={cg.index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="bg-white border border-slate-150 rounded-xl p-3 shadow-sm hover:border-slate-300 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                                <span className={`w-4 h-4 rounded-full text-[9px] text-white flex items-center justify-center font-bold font-mono ${themeConfig.pillColor}`}>
                                  {correctGuesses.length - idx}
                                </span>
                                <span>{cg.officialName}</span>
                              </span>
                              <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.25 rounded font-black tracking-tighter uppercase shrink-0">
                                Approved
                              </span>
                            </div>
                            <p className="text-[10px] leading-snug font-medium text-slate-500 mt-1 pl-5">
                              {cg.rationale}
                            </p>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
