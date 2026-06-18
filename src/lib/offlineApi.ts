import footballersData from '../../footballer-db.json';

// TYPES
interface Footballer {
  name: string;
  synonyms: string[];
  nationality: string;
  clubs: string[];
  managers: string[];
  trophies: string[];
  leagues: string[];
  partners: string[];
}

const FOOTBALLERS: Footballer[] = footballersData as Footballer[];

// === TIC-TAC-TOE DATA ===
const TTT_CURATED_GRIDS = [
  {
    rows: [
      { type: 'Club', value: 'Chelsea' },
      { type: 'Club', value: 'Real Madrid' },
      { type: 'Nationality', value: 'France' }
    ],
    cols: [
      { type: 'Club', value: 'Juventus' },
      { type: 'Club', value: 'Arsenal' },
      { type: 'Trophy', value: 'Won World Cup' }
    ]
  },
  {
    rows: [
      { type: 'Club', value: 'Manchester United' },
      { type: 'Club', value: 'Barcelona' },
      { type: 'Nationality', value: 'England' }
    ],
    cols: [
      { type: 'Club', value: 'Real Madrid' },
      { type: 'Club', value: 'PSG' },
      { type: 'Trophy', value: 'Won Champions League' }
    ]
  },
  {
    rows: [
      { type: 'Club', value: 'Liverpool' },
      { type: 'Club', value: 'Bayern Munich' },
      { type: 'Nationality', value: 'Netherlands' }
    ],
    cols: [
      { type: 'Club', value: 'Barcelona' },
      { type: 'Club', value: 'Manchester City' },
      { type: 'Trophy', value: 'Won Champions League' }
    ]
  }
];

const TTT_MUSIC_CURATED_GRIDS = [
  {
    rows: [
      { type: 'Genre', value: 'Pop Music' },
      { type: 'Genre', value: 'Rock / Alternative' },
      { type: 'Nationality', value: 'United Kingdom' }
    ],
    cols: [
      { type: 'Type', value: 'Solo Artist' },
      { type: 'Type', value: 'Band or Group' },
      { type: 'Award', value: 'Grammy Award' }
    ]
  }
];

const TTT_MOVIES_CURATED_GRIDS = [
  {
    rows: [
      { type: 'Director', value: 'Christopher Nolan' },
      { type: 'Director', value: 'Steven Spielberg' },
      { type: 'Genre', value: 'Sci-Fi' }
    ],
    cols: [
      { type: 'Award', value: 'Won Oscar' },
      { type: 'Type', value: 'Franchise Release' },
      { type: 'Genre', value: 'Drama' }
    ]
  }
];

// === TENABLE PRESETS ===
const TENABLE_FOOTBALL_TOPICS = [
  {
    id: "f-1",
    title: "English Clubs to Win the Champions League / European Cup",
    category: "Clubs",
    hint: "Only 6 English Clubs have ever lifted this trophy!",
    answers: ["liverpool", "manchester united", "chelsea", "nottingham forest", "aston villa", "manchester city"]
  },
  {
    id: "f-2",
    title: "Top 10 All-Time Premier League Goal Scorers",
    category: "Records",
    hint: "Includes retirees and active legends holding English scoring records.",
    answers: ["alan shearer", "harry kane", "wayne rooney", "andy cole", "sergio aguero", "frank lampard", "thierry henry", "robbie fowler", "jermain defoe", "mohamed salah"]
  }
];

const TENABLE_MUSIC_TOPICS = [
  {
    id: "m-1",
    title: "Artists with Grammy Award for Album of the Year",
    category: "Awards",
    hint: "Think Taylor Swift, Adele, Billie Eilish, or classic groups.",
    answers: ["taylor swift", "adele", "billie eilish", "daft punk", "brunomars", "bruno mars", "coldplay", "u2", "arcade fire", "mumford & sons", "mumford and sons", "jon batiste", "harry styles"]
  }
];

const TENABLE_MOVIES_TOPICS = [
  {
    id: "mv-1",
    title: "Movies Directed by Christopher Nolan",
    category: "Directors",
    hint: "Brain-bending sci-fi, dark knight adaptations, and dramatic historical recounts.",
    answers: ["inception", "interstellar", "the dark knight", "dark knight", "oppenheimer", "tenet", "memento", "dunkirk", "the prestige", "prestige", "batman begins", "the dark knight rises", "insomnia", "following"]
  }
];

// === CAREER PATH PRESETS ===
const CAREER_PRESETS = [
  {
    id: "c-1",
    playerName: "Lionel Messi",
    target: { clubs: ["Barcelona", "PSG", "Inter Miami"], trophies: ["World Cup", "Ballon d'Or", "Champions League", "Copa America"], managers: ["Pep Guardiola", "Lionel Scaloni"], partners: ["Neymar", "Luis Suarez"] }
  },
  {
    id: "c-2",
    playerName: "Cristiano Ronaldo",
    target: { clubs: ["Manchester United", "Real Madrid", "Juventus", "Al Nassr"], trophies: ["Ballon d'Or", "Champions League", "Premier League", "La Liga", "Euros"], managers: ["Alex Ferguson", "Zinedine Zidane"], partners: ["Wayne Rooney", "Karim Benzema"] }
  },
  {
    id: "c-3",
    playerName: "Frank Lampard",
    target: { clubs: ["West Ham", "Chelsea", "Manchester City"], trophies: ["Premier League", "Champions League", "FA Cup"], managers: ["Jose Mourinho", "Carlo Ancelotti"], partners: ["John Terry", "Didier Drogba"] }
  }
];

// === LEADERBOARDS STORAGE ===
const getLeaderboard = () => {
  try {
    const raw = localStorage.getItem('gridblitz_leaderboards');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveLeaderboard = (list: any[]) => {
  try {
    localStorage.setItem('gridblitz_leaderboards', JSON.stringify(list));
  } catch (e) {}
};

// === HARDCODED MUSIC AND MOVIE REF DICTIONARY ===
// For Tic-Tac-Toe mock verify
const MUSIC_PROFILES: Record<string, { genres: string[], nationality: string, type: string, awards: string[], charts: string[] }> = {
  "taylor swift": { genres: ['pop', 'country', 'rock', 'alternative'], nationality: 'united states', type: 'solo artist', awards: ['grammy', 'billboard'], charts: ['billboard', 'spotify'] },
  "the beatles": { genres: ['rock', 'pop'], nationality: 'united kingdom', type: 'band or group', awards: ['grammy'], charts: ['billboard'] },
  "queen": { genres: ['rock', 'pop'], nationality: 'united kingdom', type: 'band or group', awards: ['grammy', 'brit'], charts: ['billboard'] },
  "michael jackson": { genres: ['pop', 'r&b', 'dance'], nationality: 'united states', type: 'solo artist', awards: ['grammy'], charts: ['billboard'] },
  "ed sheeran": { genres: ['pop', 'acoustic'], nationality: 'united kingdom', type: 'solo artist', awards: ['grammy', 'brit'], charts: ['billboard', 'spotify'] },
  "coldplay": { genres: ['rock', 'alternative', 'pop'], nationality: 'united kingdom', type: 'band or group', awards: ['grammy', 'brit'], charts: ['billboard', 'spotify'] },
  "eminem": { genres: ['hip hop', 'rap', 'r&b'], nationality: 'united states', type: 'solo artist', awards: ['grammy'], charts: ['billboard', 'spotify'] },
  "rihanna": { genres: ['pop', 'r&b', 'dance'], nationality: 'united states', type: 'solo artist', awards: ['grammy'], charts: ['billboard', 'spotify'] },
  "daft punk": { genres: ['electronic', 'dance', 'house'], nationality: 'france', type: 'duo', awards: ['grammy'], charts: ['spotify'] },
  "adele": { genres: ['pop', 'soul'], nationality: 'united kingdom', type: 'solo artist', awards: ['grammy', 'brit'], charts: ['billboard', 'spotify'] },
  "drake": { genres: ['hip hop', 'rap', 'pop'], nationality: 'canada', type: 'solo artist', awards: ['grammy'], charts: ['billboard', 'spotify'] },
  "the weeknd": { genres: ['r&b', 'pop', 'electronic'], nationality: 'canada', type: 'solo artist', awards: ['grammy'], charts: ['billboard', 'spotify'] }
};

const MOVIE_PROFILES: Record<string, { type: string, genres: string[], awards: string[], films: string[] }> = {
  "christopher nolan": { type: 'director', genres: ['sci-fi', 'thriller', 'action', 'drama'], awards: ['oscar', 'academy award'], films: ['inception', 'interstellar', 'the dark knight', 'dark knight', 'oppenheimer', 'memento'] },
  "steven spielberg": { type: 'director', genres: ['sci-fi', 'adventure', 'drama'], awards: ['oscar', 'academy award'], films: ['jurassic park', 'schindler\'s list', 'jaws', 'saving private ryan', 'et', 'e.t.'] },
  "martin scorsese": { type: 'director', genres: ['crime', 'drama', 'thriller'], awards: ['oscar', 'academy award'], films: ['goodfellas', 'taxi driver', 'the departed', 'wolf of wall street', 'shutter island'] }
};


// === MAIN ENGINE REQUEST MULTIPLEXER ===
export async function handleOfflineRequest(url: string, method: string, body: any): Promise<any> {
  const normUrl = url.replace(/\/+$/, ''); // clean duplicate slashes

  console.log(`[PWA Offline Server] Routing request ${normUrl} [${method}]`);

  // 1. TIC TAC TOE: CREATE BOARD
  if (normUrl === '/api/tic-tac-toe/create') {
    const theme = body.theme || 'football';
    let pool = TTT_CURATED_GRIDS;
    if (theme === 'music') pool = TTT_MUSIC_CURATED_GRIDS;
    if (theme === 'movies') pool = TTT_MOVIES_CURATED_GRIDS;

    const idx = Math.floor(Math.random() * pool.length);
    const selected = pool[idx];
    return {
      rows: selected.rows,
      cols: selected.cols,
      solvable: true,
      id: `${theme}-curated-pwa-${idx}`
    };
  }

  // 2. TIC TAC TOE: VERIFY SQUARE
  if (normUrl === '/api/tic-tac-toe/verify') {
    const { playerName, rowCriteria, colCriteria, theme } = body;
    const lowerName = playerName ? playerName.toLowerCase().trim() : '';

    if (theme === 'football') {
      // Find matches in our footballer database loaded client-side!
      const player = FOOTBALLERS.find(f => 
        f.name.toLowerCase() === lowerName || 
        f.synonyms.some(syn => syn.toLowerCase() === lowerName)
      );

      if (!player) {
        return { success: false, clarification: `The offline referee couldn't verify "${playerName}" in our Football archive.` };
      }

      const matchCriteria = (entity: Footballer, type: string, value: string): boolean => {
        const v = value.toLowerCase();
        const t = type.toLowerCase();
        if (t === 'club') return entity.clubs.some(c => c.toLowerCase() === v || v.includes(c.toLowerCase()));
        if (t === 'nationality') return entity.nationality.toLowerCase() === v || v.includes(entity.nationality.toLowerCase());
        if (t === 'trophy') return entity.trophies.some(tr => tr.toLowerCase() === v || v.includes(tr.toLowerCase()));
        if (t === 'league') return entity.leagues.some(l => l.toLowerCase() === v || v.includes(l.toLowerCase()));
        if (t === 'partner' || t === 'partners') return entity.partners.some(p => p.toLowerCase() === v);
        return false;
      };

      const satisfiesRow = matchCriteria(player, rowCriteria.type, rowCriteria.value);
      const satisfiesCol = matchCriteria(player, colCriteria.type, colCriteria.value);

      if (satisfiesRow && satisfiesCol) {
        return {
          success: true,
          clarification: `⭐ PWA Guard: ${player.name} (${player.nationality}) fits both ${rowCriteria.value} and ${colCriteria.value}!`
        };
      }
      return {
        success: false,
        clarification: `${player.name} satisfies some criteria details, but failed cross-examination for Row: ${rowCriteria.value} & Col: ${colCriteria.value}.`
      };
    }

    // Music Verification offline
    if (theme === 'music') {
      const prof = MUSIC_PROFILES[lowerName];
      if (!prof) {
        return { success: false, clarification: `Type a famous British/American band or singer offline (e.g., Taylor Swift, The Beatles, Queen).` };
      }
      const checkMusic = (p: any, cr: any): boolean => {
        const cv = cr.value.toLowerCase();
        const ct = cr.type.toLowerCase();
        if (ct === 'genre') return p.genres.some((g: string) => cv.includes(g) || g.includes(cv));
        if (ct === 'nationality') return cv.includes(p.nationality) || p.nationality.includes(cv);
        if (ct === 'award') return p.awards.some((a: string) => cv.includes(a));
        if (ct === 'type') return cv.includes(p.type) || p.type.includes(cv);
        return false;
      };
      if (checkMusic(prof, rowCriteria) && checkMusic(prof, colCriteria)) {
        return { success: true, clarification: `Verified! ${playerName} satisfies standard conditions.` };
      }
      return { success: false, clarification: `Ref verdict: matches identity but doesn't reconcile with categories.` };
    }

    // Movies Verification offline
    if (theme === 'movies') {
      const prof = MOVIE_PROFILES[lowerName];
      if (!prof) {
        return { success: false, clarification: `For movies offline, try directors like Christopher Nolan, Steven Spielberg, or Martin Scorsese.` };
      }
      const checkMovie = (p: any, cr: any): boolean => {
        const cv = cr.value.toLowerCase();
        const ct = cr.type.toLowerCase();
        if (ct === 'award') return p.awards.some((a: string) => cv.includes(a));
        if (ct === 'director' || ct === 'type') return cv.includes(p.type) || p.type.includes(cv);
        if (ct === 'genre') return p.genres.some((g: string) => cv.includes(g));
        return false;
      };
      if (checkMovie(prof, rowCriteria) && checkMovie(prof, colCriteria)) {
        return { success: true, clarification: `Verified successfully offline!` };
      }
      return { success: false, clarification: `Verification failed.` };
    }

    return { success: true, clarification: "Generous offline pass!" };
  }

  // 3. TENABLE: CREATE GAME
  if (normUrl === '/api/tenable/create') {
    const theme = body.theme || 'football';
    let pool = TENABLE_FOOTBALL_TOPICS;
    if (theme === 'music') pool = TENABLE_MUSIC_TOPICS;
    if (theme === 'movies') pool = TENABLE_MOVIES_TOPICS;

    const idx = Math.floor(Math.random() * pool.length);
    const selected = pool[idx];
    return {
      id: selected.id,
      title: selected.title,
      category: selected.category,
      hint: selected.hint,
      totalCount: selected.answers.length
    };
  }

  // 4. TENABLE: VERIFY GUESS
  if (normUrl === '/api/tenable/verify-guess') {
    const { tenableTitle, guess, alreadyGuessed } = body;
    const cleanGuess = guess ? guess.toLowerCase().trim() : '';

    // Search inside our preset collections
    const allPresets = [...TENABLE_FOOTBALL_TOPICS, ...TENABLE_MUSIC_TOPICS, ...TENABLE_MOVIES_TOPICS];
    const category = allPresets.find(p => p.title === tenableTitle);

    if (!category) {
      // Fallback if custom generated was requested
      return {
        success: true,
        officialName: guess,
        rationale: "Correct! The local referee approves your answer in offline mode."
      };
    }

    const isMatch = category.answers.some(ans => ans === cleanGuess || cleanGuess.includes(ans) || ans.includes(cleanGuess));
    if (isMatch) {
      const normalizedAns = category.answers.find(ans => ans === cleanGuess || cleanGuess.includes(ans) || ans.includes(cleanGuess)) || guess;
      return {
        success: true,
        officialName: normalizedAns.toUpperCase(),
        rationale: "Factual Match: This satisfies our offline board dictionary database."
      };
    }

    return {
      success: false,
      rationale: "Not matching the primary preset solutions offline."
    };
  }

  // 5. CAREER PATH: CREATE BOARD
  if (normUrl === '/api/career/create') {
    const idx = Math.floor(Math.random() * CAREER_PRESETS.length);
    const current = CAREER_PRESETS[idx];
    return {
      id: current.id,
      playerName: current.playerName,
      stats: {
        clubsNeeded: current.target.clubs.length,
        trophiesNeeded: current.target.trophies.length,
        managersNeeded: current.target.managers.length,
        partnersNeeded: current.target.partners.length
      }
    };
  }

  // 6. CAREER PATH: VERIFY GUESS
  if (normUrl === '/api/career/verify-guess') {
    const { playerName, category, guess } = body;
    const lowerGuess = guess ? guess.toLowerCase().trim() : '';
    
    const puzzle = CAREER_PRESETS.find(p => p.playerName === playerName);
    if (!puzzle) {
      return { success: true, officialName: guess, rationale: "Approved offline!" };
    }

    const key = category.toLowerCase() as 'clubs' | 'trophies' | 'managers' | 'partners';
    const activeList = puzzle.target[key] || [];

    const foundMatch = activeList.find(item => item.toLowerCase() === lowerGuess || item.toLowerCase().includes(lowerGuess) || lowerGuess.includes(item.toLowerCase()));
    
    if (foundMatch) {
      return {
        success: true,
        officialName: foundMatch,
        rationale: `Success: Verified correlation with ${playerName} under "${category}" selection!`
      };
    }
    return {
      success: false,
      rationale: `Incorrect attribute connection.`
    };
  }

  // 7. LEADERBOARDS: SUBMIT SCORE
  if (normUrl === '/api/leaderboards/submit') {
    const { playerName, score, gameType, tenableTopic } = body;
    const db = getLeaderboard();
    const newRecord = {
      id: `record-${Date.now()}-${Math.floor(Math.random()*100)}`,
      playerName,
      score,
      gameType: gameType || 'tenable',
      tenableTopic: tenableTopic || 'PWA Blitz',
      timestamp: new Date().toISOString()
    };
    db.push(newRecord);
    db.sort((a: any, b: any) => b.score - a.score);
    saveLeaderboard(db);
    return { success: true, entry: newRecord };
  }

  // 8. LEADERBOARDS: LIST SCORE
  if (normUrl === '/api/leaderboards/list') {
    const db = getLeaderboard();
    // Pre-populate with some mock records to make high scores look great on empty loads
    if (db.length === 0) {
      const mockRecords = [
        { id: "mock-1", playerName: "ProTrivStar", score: 9, gameType: "tenable", tenableTopic: "Nolan Directors", timestamp: new Date().toISOString() },
        { id: "mock-2", playerName: "matthew", score: 8, gameType: "tic-tac-toe", tenableTopic: "Grid Match", timestamp: new Date().toISOString() },
        { id: "mock-3", playerName: "TrivWiz_99", score: 7, gameType: "career_path", tenableTopic: "Messi Path", timestamp: new Date().toISOString() }
      ];
      saveLeaderboard(mockRecords);
      return mockRecords;
    }
    return db;
  }

  // 9. DISPUTE
  if (normUrl === '/api/dispute') {
    return {
      approved: true,
      refVerdict: "VAR REVIEW SUCCESSFUL! The Chief Referee reviewed the video footage at the pitch-side screen. The initial decision is overturned. YOUR ENTRY HAS BEEN AWARDED AND APPROVED WITH ACCORDING HIGH RATINGS!"
    };
  }

  // 10. UNLIMITED CARD GAME: GENERATE CARD
  if (normUrl === '/api/card-game/generate-card') {
    const theme = body.theme || 'football';
    // Return a random card statically!
    const fallbackId = `fc-pwa-random-${Date.now()}`;
    if (theme === 'music') {
      return {
        id: fallbackId,
        title: "Grammy Award winners for Album of the Year",
        category: "Awards",
        hint: "Adele, Billie Eilish, Taylor Swift, Coldplay, Bruno Mars..."
      };
    } else if (theme === 'movies') {
      return {
        id: fallbackId,
        title: "Movies directed by Christopher Nolan",
        category: "Directors",
        hint: "Inception, Interstellar, Oppenheimer, Dunkirk, Prestige..."
      };
    } else {
      return {
        id: fallbackId,
        title: "Active English Football teams with over 3 European Trophies",
        category: "Teams",
        hint: "Liverpool, Manchester United, Chelsea, Nottingham Forest, etc."
      };
    }
  }

  // 11. UNLIMITED CARD GAME: VERIFY GUESS & SOLUTIONS
  if (normUrl === '/api/card-game/verify-answer') {
    return {
      success: true,
      officialName: body.guess,
      rationale: "VAR Approved: Offline verification accepted! (Connect to our cloud engine for full live references)."
    };
  }
  if (normUrl === '/api/card-game/get-possible-answers') {
    return {
      answers: ["Oasis", "Thierry Henry", "Interstellar", "Taylor Swift", "Wayne Rooney", "Nolan", "Inception"]
    };
  }

  return { success: true };
}
