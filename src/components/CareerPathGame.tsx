import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { CareerPathPlayer, CareerPathItem, CareerPathSetup } from '../types';
import { Loader2, ArrowRight, Eye, RefreshCw, AlertCircle, CheckCircle, Info, Landmark, HelpCircle, ToggleLeft, ToggleRight, Trophy, Users, User } from 'lucide-react';
import { getPlayerPhoto, getFlagUrl, getTrophyPhoto, getClubLogo } from '../lib/images';
import { SafeImage } from './SafeImage';

export default function CareerPathGame({ theme = "football" }: { theme?: 'football' | 'music' | 'movies' }) {
  const [setup, setSetup] = useState<CareerPathSetup>({
    hideYears: false
  });

  const [player, setPlayer] = useState<CareerPathPlayer | null>(null);
  const [loading, setLoading] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [guessError, setGuessError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(
    theme === "music" ? "Study the release history and guess the canonical name of this artist/band!" :
    theme === "movies" ? "Study the filmography and guess the canonical name of this actor/director!" :
    "Study the stats and guess the canonical name of this footballer!"
  );
  
  // Game state
  const [incorrectGuessesCount, setIncorrectGuessesCount] = useState(0);
  const [guessedNames, setGuessedNames] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  
  // Clues revealed status
  const [cluesUnlocked, setCluesUnlocked] = useState<boolean[]>([false, false, false]);
  const [customRequest, setCustomRequest] = useState('');

  // Dispute and VAR status variables
  const [lastFailedVerify, setLastFailedVerify] = useState<{
    guess: string;
    trueName: string;
  } | null>(null);
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeFeedback, setDisputeFeedback] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState<string>("");

  // Multiplayer and Leaderboard States
  const [careerMode, setCareerMode] = useState<'single' | 'two-player'>('single');
  const [currentTurn, setCurrentTurn] = useState<'Player 1' | 'Player 2'>('Player 1');
  const [submitted, setSubmitted] = useState(false);
  const [submitName, setSubmitName] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Start new career puzzle
  const generateNewPuzzle = async (customText?: string) => {
    setLoading(true);
    setGuessError(null);
    setFeedback("Sourcing biographical details from archives...");
    setIncorrectGuessesCount(0);
    setGuessedNames([]);
    setIsGameOver(false);
    setIsWon(false);
    setCluesUnlocked([false, false, false]);
    setGuessInput('');

    // Reset leaderboard submission and multiplayer
    setSubmitted(false);
    setSubmitName('');
    setCurrentTurn('Player 1');

    try {
      const response = await apiFetch('/api/career/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customRequest: customText ? customText : undefined, theme })
      });
      const data = await response.json();
      setPlayer(data);
      const initialFeedback = theme === 'music' 
        ? "New Wiki music timeline loaded! All milestones are currently redacted. Make a guess to start revealing career rows." 
        : (theme === 'movies' 
          ? "New Wiki film timeline loaded! All film projects are currently redacted. Make a guess to start revealing film projects." 
          : "New Wiki career path loaded! All clubs are currently redacted. Make a guess to start revealing team rows.");
      setFeedback(initialFeedback);
    } catch (err) {
      setGuessError("Failed to fetch biographical database. Please play in offline demo mode.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateNewPuzzle();
  }, [theme]);

  const handleDispute = async () => {
    if (!lastFailedVerify || disputeLoading) return;
    setDisputeLoading(true);
    setDisputeFeedback(null);

    try {
      const res = await apiFetch("/api/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: "career-path",
          guess: lastFailedVerify.guess,
          trueName: lastFailedVerify.trueName,
          theme,
          userExplanation: disputeReason
        })
      });

      const data = await res.json();
      if (data.actualCorrect) {
        // Dispute was approved! Re-establish victory state!
        setIsWon(true);
        setIsGameOver(true);
        const labelOverrule = theme === "music" ? "RECORD LABEL COMPREHENSION REVERSED" : (theme === "movies" ? "AGENT COMPELLED OVERRULE APPROVED" : "VAR OVERRULE APPROVED");
        const matchLabel = theme === "music" ? "record label verified" : (theme === "movies" ? "agent confirmed" : "referee confirmed");
        if (careerMode === 'two-player') {
          setFeedback(`🎉 ${labelOverrule}! The ${matchLabel} that "${lastFailedVerify.guess}" matches ${lastFailedVerify.trueName}! ${currentTurn} wins the Match! Proof: ${data.proof}`);
        } else {
          setFeedback(`🎉 ${labelOverrule}! The ${matchLabel} that "${lastFailedVerify.guess}" matches ${lastFailedVerify.trueName}! Proof: ${data.proof}`);
        }
        setGuessError(null);
        setLastFailedVerify(null);
        setDisputeReason("");
      } else {
        const rejectLabel = theme === "music" ? "RECORD LABEL REJECTED APPEAL" : (theme === "movies" ? "TALENT AGENT DETECTED NO CONTRACT MATCH" : "VAR CONFIRMED REF CALL");
        setDisputeFeedback(`✖️ ${rejectLabel}: ${data.proof}`);
      }
    } catch (err) {
      console.error(err);
      setDisputeFeedback("❌ Connection error with supreme ref.");
    } finally {
      setDisputeLoading(false);
    }
  };

  const handleGuessSubmit = async () => {
    if (!guessInput.trim() || !player || isGameOver || loading) return;

    setLoading(true);
    setGuessError(null);
    setLastFailedVerify(null);
    setDisputeFeedback(null);

    const normGuess = guessInput.trim();
    
    // Strict duplicate check if repeats is disabled
    const cleanGuess = normGuess.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "");
    if (!setup.allowRepeats) {
      const alreadyGuessed = guessedNames.some(g => {
        const gClean = g.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "");
        return gClean === cleanGuess;
      });
      if (alreadyGuessed) {
        setGuessError(`❌ You already guessed "${guessInput}" in this round! Duplicate player choices are disabled in options.`);
        setGuessInput('');
        setLoading(false);
        return;
      }
    }

    setGuessedNames(prev => [...prev, normGuess]);

    try {
      const response = await apiFetch('/api/career/verify-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guess: normGuess,
          trueName: player.name
        })
      });

      const result = await response.json();

      if (result.isCorrect) {
        // Correct! Reveal everything!
        setIsWon(true);
        setIsGameOver(true);
        if (careerMode === 'two-player') {
          setFeedback(`🎉 MAGNIFICENT! ${currentTurn} identified ${result.correction} and wins the Match!`);
        } else {
          setFeedback(`🎉 MAGNIFICENT! You correctly identified ${result.correction}! It took you ${incorrectGuessesCount} incorrect guesses.`);
        }
      } else {
        // Incorrect guess - Record dispute candidate
        setLastFailedVerify({
          guess: normGuess,
          trueName: player.name
        });

        const nextIncorrectCount = incorrectGuessesCount + 1;
        setIncorrectGuessesCount(nextIncorrectCount);

        // Check lose condition
        const totalClubsCount = player.career.length;
        if (nextIncorrectCount >= totalClubsCount) {
          setIsGameOver(true);
          setGuessError(`💥 Out of attempts! The mystery player has retired. His name was "${player.name}".`);
          setFeedback("Take a look at the full unmasked Wikipedia infobox below!");
        } else {
          if (careerMode === 'two-player') {
            const nextTurn = currentTurn === 'Player 1' ? 'Player 2' : 'Player 1';
            setCurrentTurn(nextTurn);
            setGuessError(`❌ "${normGuess}" is incorrect! Chronological Row #${nextIncorrectCount} has been unmasked.`);
            setFeedback(`Turn passes to ${nextTurn}! Study the newly unlocked row to re-adjust!`);
          } else {
            setGuessError(`❌ "${normGuess}" is incorrect! Chronological Row #${nextIncorrectCount} has been unmasked.`);
            setFeedback(`Revealed row index ${nextIncorrectCount}. Study the newly unlocked row to re-adjust your sights!`);
          }
        }
      }
    } catch {
      setGuessError("API validation failed. Try typing standard spelling.");
    } finally {
      setLoading(false);
      setGuessInput('');
    }
  };

  // Give up and show player
  const giveUpAndReveal = () => {
    if (!player) return;
    setIsGameOver(true);
    setGuessError(`Exposed: The correct player is "${player.name}".`);
    setFeedback("Wiki senior career table fully unmasked below!");
  };

  // Toggle clue unlock index
  const toggleClue = (idx: number) => {
    setCluesUnlocked(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  return (
    <div className="w-full flex flex-col gap-6" id="career-path-lobby">
      
      {/* Settings bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        
        <div className="flex flex-col gap-1 w-full md:w-auto text-left">
          <label className="text-[10px] font-mono text-emerald-600 font-extrabold tracking-wider uppercase">Wikipedia Hardness Options</label>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <button
              onClick={() => setSetup(prev => ({ ...prev, hideYears: !prev.hideYears }))}
              className="flex items-center gap-2 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-all"
            >
              {setup.hideYears ? (
                <ToggleRight className="text-emerald-500" size={18} />
              ) : (
                <ToggleLeft className="text-slate-400" size={18} />
              )}
              <span>Hide Years (Extreme)</span>
            </button>

            <button
              onClick={() => setSetup(prev => ({ ...prev, allowRepeats: !prev.allowRepeats }))}
              className={`flex items-center gap-2 hover:bg-slate-105 text-slate-705 font-bold text-xs cursor-pointer px-3 py-1.5 rounded-lg border transition-all ${
                setup.allowRepeats
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              🔄 {setup.allowRepeats ? "Allow Choice Repeats" : "No Repeating Guesses"}
            </button>

            {/* Game Mode Selector */}
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={() => setCareerMode('single')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  careerMode === 'single'
                    ? 'bg-slate-100 border border-slate-300 text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <User size={13} />
                <span>Single Player</span>
              </button>
              <button
                onClick={() => setCareerMode('two-player')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  careerMode === 'two-player'
                    ? 'bg-emerald-605 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-emerald-650'
                }`}
              >
                <Users size={13} />
                <span>2 Player Clash</span>
              </button>
            </div>
          </div>
        </div>

        {/* Generate specific entities via prompt */}
        <div className="flex gap-2 w-full md:w-auto max-w-sm flex-1">
          <input
            type="text"
            value={customRequest}
            onChange={(e) => setCustomRequest(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateNewPuzzle(customRequest)}
            placeholder={
              theme === "music" 
                ? "Type any music artist... (e.g. Swift)" 
                : theme === "movies" 
                  ? "Type any cinematic star... (e.g. Nolan)" 
                  : "Type any player name... (e.g. Zidane)"
            }
            className={`flex-1 bg-white border-2 border-slate-200 focus:outline-hidden text-xs rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 transition-all font-mono ${
              theme === "music"
                ? "focus:border-purple-500"
                : theme === "movies"
                  ? "focus:border-amber-500"
                  : "focus:border-emerald-500"
            }`}
            disabled={loading}
          />
          <button
            onClick={() => generateNewPuzzle(customRequest)}
            disabled={loading}
            className={`px-4 py-2 font-extrabold text-xs rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs uppercase tracking-wider ${
              theme === "music"
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : theme === "movies"
                  ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : 'Compile'}
          </button>
        </div>

        <div>
          <button
            onClick={() => { setCustomRequest(''); generateNewPuzzle(); }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 font-black rounded-lg text-xs flex items-center gap-1.5 text-white cursor-pointer uppercase tracking-wider"
            disabled={loading}
          >
            <RefreshCw size={12} /> {
              theme === "music" 
                ? "Random Famous Artist" 
                : theme === "movies" 
                  ? "Random Famous Star" 
                  : "Random Famous Player"
            }
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left animate-fade-in">
        
        {/* Wikipedia Infobox column */}
        <div className="lg:col-span-6 flex flex-col items-center">
          
          {player ? (
            /* WIKIPEDIA STYLE INFOBOX CARD */
            <div className="w-full max-w-sm bg-stone-100 dark:bg-stone-100 text-stone-900 border border-stone-300 rounded-xs shadow-md p-1 font-sans">
              
              {/* Header Box */}
              <div className={`text-center py-2.5 px-3 border border-stone-300 mb-1 rounded-2xs ${
                theme === "music" ? "bg-purple-100" : theme === "movies" ? "bg-amber-100" : "bg-[#b3e2cd]"
              }`}>
                <h3 className="text-base font-bold tracking-tight text-stone-900 font-sans">
                  {isGameOver || isWon 
                    ? player.name 
                    : (theme === "music" 
                      ? "Mystery Artist" 
                      : (theme === "movies" ? "Mystery Film Star" : "Mystery Player"))}
                </h3>
                <p className="text-[10px] font-mono tracking-wider text-stone-700 mt-0.5">
                  {theme === "music" ? "WIKIPEDIA DISCOGRAPHY PROFILE" : theme === "movies" ? "WIKIPEDIA FILMOGRAPHY PROFILE" : "SENIOR STATISTICS PROFILE"}
                </p>
              </div>

              {/* Wiki Image Placeholder */}
              <div className="border border-stone-300 bg-stone-200 h-44 flex flex-col items-center justify-center text-stone-500 py-1 text-center mb-1 relative rounded-2xs overflow-hidden">
                {isGameOver || isWon ? (
                  <SafeImage
                    src={getPlayerPhoto(player.name, theme)}
                    alt={player.name}
                    className="w-full h-full object-contain bg-stone-100"
                    fallbackType="player"
                    fallbackName={player.name}
                  />
                ) : (
                  <>
                    <Landmark size={36} className="opacity-40" />
                    <span className="text-[10px] font-mono tracking-wider mt-1 block uppercase text-stone-600 font-bold">Wikipedia Infobox</span>
                    <span className="text-[9px] font-semibold italic text-stone-500 mt-0.5">
                      {theme === "music" ? "Discography Portal" : theme === "movies" ? "Cinematic Career Portal" : "Senior Career Portal"}
                    </span>
                  </>
                )}

                {isWon && (
                  <div className="absolute inset-0 bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                    <div className="bg-white/95 text-emerald-800 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                      <CheckCircle size={14} className="text-emerald-600 animate-bounce" /> Verified Match
                    </div>
                  </div>
                )}
              </div>

              {/* Personal Info Header */}
              <div className="bg-[#eaecf0] px-2 py-1 text-[11px] font-bold border border-stone-300 text-stone-800">
                Personal information
              </div>

              <table className="w-full text-xs text-left text-stone-800 mb-1 border-collapse">
                <tbody>
                  <tr className="border-b border-stone-200">
                    <th className="py-2.5 px-2 w-[110px] font-bold align-top text-stone-600 text-[10.5px]">
                      {theme === "music" ? "Role / Style" : theme === "movies" ? "Profession" : "Positions"}
                    </th>
                    <td className="py-2.5 px-2 font-medium align-top">
                      {isGameOver || isWon 
                        ? player.positions 
                        : (theme === "music" 
                          ? "Singer / Songwriter / Artist" 
                          : theme === "movies" ? "Lead Actor / Filmmaker" : "Forward / Midfielder / Defender")}
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <th className="py-2.5 px-2 font-bold align-top text-stone-600 text-[10.5px]">
                      {theme === "music" ? "Born / Formed" : "Born"}
                    </th>
                    <td className="py-2.5 px-2 font-medium align-top">
                      {isGameOver || isWon 
                        ? `${player.birthYear} (Age ${2026 - parseInt(player.birthYear)})` 
                        : "•••• (Age ••)"}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-2.5 px-2 font-bold align-top text-stone-600 text-[10.5px]">Nationality</th>
                    <td className="py-2.5 px-2 font-medium align-top flex items-center gap-2">
                      {isGameOver || isWon ? (
                        <span className="flex items-center gap-2 font-bold">
                          {player.nationality}
                          {getFlagUrl(player.nationality) && (
                            <SafeImage
                              src={getFlagUrl(player.nationality)!}
                              alt={player.nationality}
                              className="w-5 h-3.5 rounded-xs object-cover border border-stone-300 shadow-xxs shrink-0"
                              fallbackType="flag"
                              fallbackName={player.nationality}
                            />
                          )}
                        </span>
                      ) : (
                        <span className="text-stone-400 italic text-[11px] select-none">Make guess to unlock</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Senior Career Header */}
              <div className="bg-[#eaecf0] px-2 py-1 text-[11px] font-bold border border-stone-300 text-stone-800">
                {theme === "music" ? "Key Discography" : theme === "movies" ? "Key Filmography" : "Senior career*"}
              </div>

              <table className="w-full text-[11px] text-stone-800 border-collapse table-fixed font-sans">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-stone-300 font-bold text-stone-600">
                    <th className="py-2 px-1 text-left w-[85px]">Years</th>
                    <th className="py-2 px-1 text-left">
                      {theme === "music" ? "Album / Band" : theme === "movies" ? "Film / Project" : "Team"}
                    </th>
                    <th className="py-2 px-1 text-right w-[50px]">
                      {theme === "music" ? "Type" : theme === "movies" ? "Role" : "Apps"}
                    </th>
                    <th className="py-2 px-1 text-right w-[60px]">
                      {theme === "music" ? "Peak" : theme === "movies" ? "Award" : "(Gls)"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {player.career.map((item, idx) => {
                    // Decide if this row is revealed
                    // By default, showing 0 rows at incorrectGuessesCount = 0.
                    // When incorrectGuessesCount = 1, show rows[0].
                    // When incorrectGuessesCountCount = 2, show rows[0, 1].
                    // If won or game over, reveal literally everything!
                    const isRowRevealed = isWon || isGameOver || idx < incorrectGuessesCount;
                    
                    // Specific toggle for years column
                    const isYearRevealed = isRowRevealed && (!setup.hideYears || isGameOver || isWon);

                    return (
                      <tr key={`career-row-${idx}`} className={`border-b border-stone-200 hover:bg-stone-200/50 ${!isRowRevealed ? 'bg-stone-50' : ''}`}>
                        
                        {/* Years */}
                        <td className="py-2 px-1 text-mono font-medium text-stone-500 whitespace-nowrap overflow-hidden text-ellipsis">
                          {isYearRevealed ? (
                            item.years
                          ) : (
                            <span className="text-stone-300 select-none font-mono">••••–••</span>
                          )}
                        </td>

                        {/* Team (Redacted blocks) */}
                        <td className="py-2 px-1 font-semibold text-stone-800 tracking-tight relative">
                          {isRowRevealed ? (
                            <span className="text-[#0645ad] hover:underline font-bold flex items-center gap-1.5">
                              {theme === 'football' && (
                                <SafeImage
                                  src={getClubLogo(item.club, theme)}
                                  alt={item.club}
                                  className="w-4 h-4 rounded-full object-contain border border-stone-250 bg-white p-0.5 shadow-xxs shrink-0"
                                  fallbackType="league"
                                  fallbackName={item.club}
                                  theme={theme}
                                />
                              )}
                              <span className="truncate">{item.club}</span>
                            </span>
                          ) : (
                            <span className="bg-stone-300 border border-stone-400 text-[9px] text-stone-600 px-1 py-0.5 rounded italic">
                              REDACTED ROW
                            </span>
                          )}
                        </td>

                        {/* Apps (Always visible as solid numerical clues!) */}
                        <td className="py-2 px-1 font-mono text-right text-stone-600">
                          {item.apps}
                        </td>

                        {/* Goals */}
                        <td className="py-2 px-1 font-mono text-right text-stone-600">
                          ({item.goals})
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="bg-[#f8f9fa] border-t border-stone-300 p-1 text-[9px] text-stone-500 leading-snug">
                * Senior club appearances and goals counted for the domestic league only.
              </div>

            </div>
          ) : (
            <div className="w-full max-w-sm h-96 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-xs">
              <Loader2 className="animate-spin text-emerald-650" size={32} />
            </div>
          )}

        </div>

        {/* Input & Feedback Portal */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          
          {/* Main prompt controller */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 shadow-xs text-slate-800">
            
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <span className={`text-[10px] font-mono font-extrabold uppercase tracking-wider block ${
                theme === "music" ? "text-purple-600" : theme === "movies" ? "text-amber-600" : "text-emerald-600"
              }`}>wikipedia guess portal</span>
              <span className="text-xs font-mono font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                REVEALED ROWS: {incorrectGuessesCount} / {player?.career.length || 0}
              </span>
            </div>

            {/* Game state turn details */}
            {careerMode === 'two-player' && !isGameOver && (
              <div className={`text-xs px-3.5 py-2.5 rounded-lg font-bold flex items-center justify-between border ${
                theme === "music" 
                  ? "bg-purple-50 text-purple-800 border-purple-200" 
                  : theme === "movies" 
                    ? "bg-amber-50 text-amber-900 border-amber-200" 
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}>
                <span className="flex items-center gap-1">🎮 ACTIVE CHALLENGER:</span>
                <span className={`font-mono text-xs uppercase text-white px-2.5 py-1 rounded-md animate-pulse font-black shadow-xxs ${
                  theme === "music" ? "bg-purple-600" : theme === "movies" ? "bg-amber-500 text-slate-950" : "bg-emerald-600"
                }`}>{currentTurn}</span>
              </div>
            )}

            {/* Input area */}
            {!isGameOver ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-slate-550 font-medium select-none">
                  Enter guess for this {theme === "music" ? "artist/band" : theme === "movies" ? "star profile" : "player profile"}:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={guessInput}
                    onChange={(e) => setGuessInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGuessSubmit()}
                    placeholder={
                      theme === "music" 
                        ? "e.g. Taylor Swift, Coldplay, Queen..." 
                        : theme === "movies" 
                          ? "e.g. Tom Hanks, Christopher Nolan, Meryl Streep..." 
                          : "e.g. Zlatan Ibrahimovic, Zidane, Ronaldinho..."
                    }
                    className={`flex-1 bg-white border-2 border-slate-200 focus:outline-hidden text-sm rounded px-3 py-2 text-slate-900 placeholder-slate-400 transition-all font-sans ${
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
                    className={`font-extrabold px-4 py-2 rounded text-sm flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                      theme === "music" 
                        ? "bg-purple-600 hover:bg-purple-700 text-white" 
                        : theme === "movies" 
                          ? "bg-amber-500 hover:bg-amber-600 text-slate-950" 
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {loading ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={14} />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col gap-4 text-center leading-tight">
                <div>
                  {isWon ? (
                    <p className="text-sm font-black text-emerald-600 uppercase tracking-widest">🏆 WIKIPEDIA PROFILE MATCHED!</p>
                  ) : (
                    <p className="text-xs font-black text-rose-600 uppercase tracking-widest">💥 MATCH LIMIT EXCEEDED!</p>
                  )}
                  <p className="text-[10px] text-slate-500 font-mono mt-1.5 uppercase font-bold">
                    Incorrect Guesses: {incorrectGuessesCount} / {player?.career.length}
                  </p>
                </div>

                {/* Score submission option */}
                {isWon && careerMode === 'single' && (
                  <div className="border-t border-slate-200/60 pt-3 text-left w-full flex flex-col gap-2">
                    <span className="text-[10px] font-mono text-emerald-600 font-extrabold tracking-widest uppercase flex items-center gap-1">
                      <Trophy size={11} className="text-emerald-600 animate-pulse" /> Register Record Solution
                    </span>
                    {!submitted ? (
                      <div className="flex flex-col gap-1.5">
                        <input
                          type="text"
                          value={submitName}
                          onChange={(e) => setSubmitName(e.target.value)}
                          placeholder="Your identity code..."
                          className="w-full bg-white border border-slate-250 text-xs rounded-lg p-2 text-slate-800 placeholder-slate-400 focus:outline-hidden"
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
                                  gameType: 'career',
                                  score: 10 - incorrectGuessesCount, // higher score is better (fewer incorrect guesses)
                                  careerPlayerName: player?.name,
                                  careerHideYears: setup.hideYears
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
                          className="w-full bg-emerald-600 hover:bg-emerald-550 text-white text-xs font-bold py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-xxs"
                        >
                          {submitLoading ? <Loader2 size={11} className="animate-spin" /> : <Trophy size={11} />}
                          Save to Rankings
                        </button>
                      </div>
                    ) : (
                      <div className="py-2 bg-emerald-50 border border-emerald-300 rounded text-[10px] font-mono font-bold text-emerald-600 text-center uppercase tracking-wider">
                        🎉 PROFILE STANDING PUBLISHED!
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => { setCustomRequest(''); generateNewPuzzle(); }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-lg transition-all shadow-xs cursor-pointer uppercase tracking-wider mt-1"
                >
                  Solve Another Profile
                </button>
              </div>
            )}

            {/* Alerts */}
            {guessError && (
              <div className="flex flex-col gap-2 w-full">
                <div className="bg-rose-50 border border-rose-200 p-3 rounded text-xs text-rose-800 flex items-start gap-2 leading-relaxed font-bold">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-600" />
                  <div>{guessError}</div>
                </div>

                {!isGameOver && lastFailedVerify && (
                  <div className="border border-amber-300 bg-amber-50 advisory-panel rounded-lg p-3 text-left flex flex-col gap-2 shadow-xxs">
                    <p className="text-[11px] text-amber-900 font-sans leading-normal">
                      🙋‍♂️ <strong>{
                        theme === "music" 
                          ? "Dispute Artist Name?" 
                          : theme === "movies" 
                            ? "Dispute Star Name?" 
                            : "Dispute Player Name?"
                      }</strong> If you believe <strong>"{lastFailedVerify.guess}"</strong> is the correct {
                        theme === "music" ? "artist/band" : theme === "movies" ? "star or filmmaker" : "athlete"
                      } for this profile, {
                        theme === "music" 
                          ? "call your record label to appeal the catalog entry." 
                          : theme === "movies" 
                            ? "call your talent agent to challenge this casting list." 
                            : "call for a VAR review."
                      }
                    </p>
                    <div className="flex flex-col gap-1.5 my-1 text-left align-left">
                      <label id="career-dispute-reason-label" className="text-[10px] uppercase font-bold text-amber-800 font-mono">
                        Provide evidence to prove your claim & convince VAR:
                      </label>
                      <input
                        id="career-dispute-reason-input"
                        type="text"
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder={
                          theme === "music"
                            ? "e.g., Lead vocalist released this solo album in 2024..."
                            : theme === "movies"
                              ? "e.g., Directed under a pseudonym or executive produced..."
                              : "e.g., Transferred from PSG to Man City in late 2024 season..."
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
                          ? "📞 Record label checking sheets..." 
                          : theme === "movies" 
                            ? "📞 Talent agent looking up credits..." 
                            : "⚖️ Supreme Ref checking sheets..."
                      ) : (
                        theme === "music" 
                          ? "📞 Call My Record Label!" 
                          : theme === "movies" 
                            ? "📞 Call My Talent Agent!" 
                            : "⚖️ Dispute & Call VAR"
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
            {feedback && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded text-xs text-slate-800 flex items-start gap-2 leading-relaxed font-semibold">
                <Info size={14} className="shrink-0 mt-0.5 text-emerald-600" />
                <div>{feedback}</div>
              </div>
            )}

          </div>

          {/* Trivia helper clues (Accordian or unlockable badges) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3.5 shadow-xs text-slate-800">
            
            <div>
              <h4 className="text-[10px] font-mono text-emerald-600 font-extrabold uppercase tracking-wider block">Bio Clue Board</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Toggle these clues if you need minor hints to help trace the player!</p>
            </div>

            <div className="flex flex-col gap-2">
              {player?.clues.map((clue, idx) => {
                const isUnlocked = cluesUnlocked[idx];
                return (
                  <div
                    key={`clue-${idx}`}
                    className={`p-3 rounded-lg border text-xs leading-relaxed transition-all flex items-center justify-between ${
                      isUnlocked
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 select-none pr-3">
                      <HelpCircle size={14} className={isUnlocked ? 'text-emerald-600' : 'text-slate-400'} />
                      {isUnlocked ? (
                        <p className="font-semibold">{clue}</p>
                      ) : (
                        <p className="font-mono italic text-[11px]">Unmask trivia clue #{idx + 1}</p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => toggleClue(idx)}
                      className={`px-3 py-1 rounded text-[10px] font-black tracking-wider uppercase cursor-pointer transition-all ${
                        isUnlocked
                          ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          : 'bg-[#b3e2cd] hover:bg-opacity-80 text-emerald-950 border border-emerald-500'
                      }`}
                    >
                      {isUnlocked ? 'Hide Clue' : 'Show Clue'}
                    </button>
                  </div>
                );
              })}
            </div>

            {!isGameOver && (
              <button
                onClick={giveUpAndReveal}
                className="w-full text-center py-2 text-[10px] font-black font-mono tracking-wider text-rose-700 hover:bg-rose-50 uppercase bg-white p-2 border border-rose-200 rounded-lg cursor-pointer mt-1"
              >
                Reveal True Wikipedia Identity
              </button>
            )}

            {guessedNames.length > 0 && (
              <div className="mt-2.5 pt-3 border-t border-slate-200 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mr-1">Tries:</span>
                {guessedNames.map((gn, gIdx) => (
                  <span key={`guessed-${gIdx}`} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-600 font-mono text-[10px]">
                    {gn}
                  </span>
                ))}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
