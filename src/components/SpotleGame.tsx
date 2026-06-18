import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api';
import { 
  Trophy, RefreshCw, Play, Volume2, ShieldCheck, HelpCircle, 
  Search, ArrowUp, ArrowDown, HelpCircle as QuestionIcon, Plus, 
  MapPin, Clock, Star, Flame, Eye, Sparkles, User, Users, Compass, CheckCircle2, ChevronRight, AlertCircle, RefreshCcw
} from 'lucide-react';
import { getPlayerPhoto, getFlagUrl } from '../lib/images';
import { SafeImage } from './SafeImage';

// Clue Entity Interface
interface SpotleEntity {
  id: string;
  name: string;
  debut: number; // Year
  members: string; // Solo, Trio, Group (5), or Attacker, Defender (for Football), or Actor, Actress, Director (for movies)
  popularity: number; // Rank #1 (highest) to #500
  gender: string; // Male, Female, Mixed
  genre: string; // Hip Hop, Rock, etc. or Premier League, La Liga (for football), or Drama, Action (for Movies)
  nationality: string; // Country name
}

const MUSIC_CANDIDATES: SpotleEntity[] = [
  { id: "m1", name: "Taylor Swift", debut: 2006, members: "Solo", popularity: 1, gender: "Female", genre: "Pop", nationality: "USA" },
  { id: "m2", name: "The Beatles", debut: 1962, members: "Group (4)", popularity: 8, gender: "Male", genre: "Rock", nationality: "UK" },
  { id: "m3", name: "Drake", debut: 2006, members: "Solo", popularity: 3, gender: "Male", genre: "Hip Hop", nationality: "Canada" },
  { id: "m4", name: "Billie Eilish", debut: 2015, members: "Solo", popularity: 5, gender: "Female", genre: "Pop", nationality: "USA" },
  { id: "m5", name: "Coldplay", debut: 1996, members: "Group (4)", popularity: 12, gender: "Male", genre: "Rock", nationality: "UK" },
  { id: "m6", name: "Eminem", debut: 1996, members: "Solo", popularity: 4, gender: "Male", genre: "Hip Hop", nationality: "USA" },
  { id: "m7", name: "The Weeknd", debut: 2010, members: "Solo", popularity: 2, gender: "Male", genre: "R&B", nationality: "Canada" },
  { id: "m8", name: "Rihanna", debut: 2005, members: "Solo", popularity: 6, gender: "Female", genre: "Pop", nationality: "Barbados" },
  { id: "m9", name: "Daft Punk", debut: 1993, members: "Duo", popularity: 35, gender: "Male", genre: "Electronic", nationality: "France" },
  { id: "m10", name: "The Strokes", debut: 1998, members: "Group (5)", popularity: 110, gender: "Male", genre: "Rock", nationality: "USA" },
  { id: "m11", name: "Travis Scott", debut: 2013, members: "Solo", popularity: 15, gender: "Male", genre: "Hip Hop", nationality: "USA" },
  { id: "m12", name: "Olivia Rodrigo", debut: 2021, members: "Solo", popularity: 14, gender: "Female", genre: "Pop", nationality: "USA" },
  { id: "m13", name: "Adele", debut: 2008, members: "Solo", popularity: 9, gender: "Female", genre: "Pop", nationality: "UK" },
  { id: "m14", name: "Oasis", debut: 1991, members: "Group (5)", popularity: 74, gender: "Male", genre: "Rock", nationality: "UK" },
  { id: "m15", name: "Bruno Mars", debut: 2010, members: "Solo", popularity: 7, gender: "Male", genre: "Pop", nationality: "USA" },
  { id: "m16", name: "Kendrick Lamar", debut: 2009, members: "Solo", popularity: 10, gender: "Male", genre: "Hip Hop", nationality: "USA" },
  { id: "m17", name: "One Direction", debut: 2010, members: "Group (5)", popularity: 25, gender: "Male", genre: "Pop", nationality: "UK" },
  { id: "m18", name: "Beyoncé", debut: 1997, members: "Solo", popularity: 11, gender: "Female", genre: "R&B", nationality: "USA" },
  { id: "m19", name: "Dua Lipa", debut: 2015, members: "Solo", popularity: 13, gender: "Female", genre: "Pop", nationality: "UK" },
  { id: "m20", name: "Ed Sheeran", debut: 2011, members: "Solo", popularity: 16, gender: "Male", genre: "Pop", nationality: "UK" },
  { id: "m21", name: "Justin Bieber", debut: 2009, members: "Solo", popularity: 17, gender: "Male", genre: "Pop", nationality: "Canada" },
  { id: "m22", name: "Kanye West", debut: 2004, members: "Solo", popularity: 18, gender: "Male", genre: "Hip Hop", nationality: "USA" },
  { id: "m23", name: "BTS", debut: 2013, members: "Group (7)", popularity: 20, gender: "Male", genre: "K-Pop", nationality: "South Korea" },
  { id: "m24", name: "Blackpink", debut: 2016, members: "Group (4)", popularity: 28, gender: "Female", genre: "K-Pop", nationality: "South Korea" },
  { id: "m25", name: "Shakira", debut: 1990, members: "Solo", popularity: 22, gender: "Female", genre: "Pop", nationality: "Colombia" },
  { id: "m26", name: "Post Malone", debut: 2015, members: "Solo", popularity: 19, gender: "Male", genre: "Hip Hop", nationality: "USA" },
  { id: "m27", name: "Lil Baby", debut: 2017, members: "Solo", popularity: 56, gender: "Male", genre: "Hip Hop", nationality: "USA" },
  { id: "m28", name: "Kodak Black", debut: 2013, members: "Solo", popularity: 215, gender: "Male", genre: "Hip Hop", nationality: "USA" },
  { id: "m29", name: "Jack Harlow", debut: 2015, members: "Solo", popularity: 150, gender: "Male", genre: "Hip Hop", nationality: "USA" },
  { id: "m35", name: "Arctic Monkeys", debut: 2002, members: "Group (4)", popularity: 45, gender: "Male", genre: "Rock", nationality: "UK" },
  { id: "m36", name: "Queen", debut: 1970, members: "Group (4)", popularity: 24, gender: "Male", genre: "Rock", nationality: "UK" },
  { id: "m37", name: "Michael Jackson", debut: 1964, members: "Solo", popularity: 29, gender: "Male", genre: "Pop", nationality: "USA" },
  { id: "m38", name: "Lady Gaga", debut: 2005, members: "Solo", popularity: 23, gender: "Female", genre: "Pop", nationality: "USA" },
  { id: "m39", name: "SZA", debut: 2012, members: "Solo", popularity: 21, gender: "Female", genre: "R&B", nationality: "USA" },
  { id: "m40", name: "Bad Bunny", debut: 2016, members: "Solo", popularity: 30, gender: "Male", genre: "Latin", nationality: "Puerto Rico" },
  { id: "m41", name: "Frank Ocean", debut: 2011, members: "Solo", popularity: 44, gender: "Male", genre: "R&B", nationality: "USA" },
  { id: "m42", name: "Linkin Park", debut: 1996, members: "Group (6)", popularity: 32, gender: "Male", genre: "Rock", nationality: "USA" },
  { id: "m43", name: "Doja Cat", debut: 2014, members: "Solo", popularity: 27, gender: "Female", genre: "Hip Hop", nationality: "USA" },
  { id: "m44", name: "Lana Del Rey", debut: 2010, members: "Solo", popularity: 29, gender: "Female", genre: "Pop", nationality: "USA" },
  { id: "m45", name: "Tyler, the Creator", debut: 2009, members: "Solo", popularity: 36, gender: "Male", genre: "Hip Hop", nationality: "USA" },
  { id: "m46", name: "Harry Styles", debut: 2010, members: "Solo", popularity: 33, gender: "Male", genre: "Pop", nationality: "UK" },
  { id: "m47", name: "Nicki Minaj", debut: 2007, members: "Solo", popularity: 34, gender: "Female", genre: "Hip Hop", nationality: "Trinidad and Tobago" },
  { id: "m48", name: "Sabrina Carpenter", debut: 2014, members: "Solo", popularity: 11, gender: "Female", genre: "Pop", nationality: "USA" },
  { id: "m49", name: "Chappell Roan", debut: 2017, members: "Solo", popularity: 31, gender: "Female", genre: "Pop", nationality: "USA" },
  { id: "m50", name: "Charli XCX", debut: 2008, members: "Solo", popularity: 48, gender: "Female", genre: "Pop", nationality: "UK" }
];

const FOOTBALL_CANDIDATES: SpotleEntity[] = [
  { id: "f1", name: "Lionel Messi", debut: 2004, members: "Attacker", popularity: 1, gender: "Male", genre: "MLS", nationality: "Argentina" },
  { id: "f2", name: "Cristiano Ronaldo", debut: 2002, members: "Attacker", popularity: 2, gender: "Male", genre: "Saudi Pro League", nationality: "Portugal" },
  { id: "f3", name: "Kylian Mbappé", debut: 2015, members: "Attacker", popularity: 3, gender: "Male", genre: "La Liga", nationality: "France" },
  { id: "f4", name: "Erling Haaland", debut: 2015, members: "Attacker", popularity: 4, gender: "Male", genre: "Premier League", nationality: "Norway" },
  { id: "f5", name: "Harry Kane", debut: 2010, members: "Attacker", popularity: 7, gender: "Male", genre: "Bundesliga", nationality: "England" },
  { id: "f6", name: "Kevin De Bruyne", debut: 2008, members: "Midfielder", popularity: 5, gender: "Male", genre: "Premier League", nationality: "Belgium" },
  { id: "f7", name: "Jude Bellingham", debut: 2019, members: "Midfielder", popularity: 6, gender: "Male", genre: "La Liga", nationality: "England" },
  { id: "f8", name: "Mohamed Salah", debut: 2010, members: "Attacker", popularity: 8, gender: "Male", genre: "Premier League", nationality: "Egypt" },
  { id: "f9", name: "Virgil van Dijk", debut: 2011, members: "Defender", popularity: 10, gender: "Male", genre: "Premier League", nationality: "Netherlands" },
  { id: "f10", name: "Robert Lewandowski", debut: 2006, members: "Attacker", popularity: 9, gender: "Male", genre: "La Liga", nationality: "Poland" },
  { id: "f11", name: "Bukayo Saka", debut: 2018, members: "Attacker", popularity: 12, gender: "Male", genre: "Premier League", nationality: "England" },
  { id: "f12", name: "Bruno Fernandes", debut: 2012, members: "Midfielder", popularity: 13, gender: "Male", genre: "Premier League", nationality: "Portugal" },
  { id: "f13", name: "Antoine Griezmann", debut: 2009, members: "Attacker", popularity: 15, gender: "Male", genre: "La Liga", nationality: "France" },
  { id: "f14", name: "Luka Modrić", debut: 2003, members: "Midfielder", popularity: 11, gender: "Male", genre: "La Liga", nationality: "Croatia" },
  { id: "f15", name: "Toni Kroos", debut: 2007, members: "Midfielder", popularity: 14, gender: "Male", genre: "La Liga", nationality: "Germany" },
  { id: "f16", name: "Manuel Neuer", debut: 2006, members: "Goalkeeper", popularity: 18, gender: "Male", genre: "Bundesliga", nationality: "Germany" },
  { id: "f17", name: "Son Heung-min", debut: 2010, members: "Attacker", popularity: 16, gender: "Male", genre: "Premier League", nationality: "South Korea" },
  { id: "f18", name: "Vinicius Junior", debut: 2017, members: "Attacker", popularity: 17, gender: "Male", genre: "La Liga", nationality: "Brazil" },
  { id: "f19", name: "Rodri", debut: 2015, members: "Midfielder", popularity: 19, gender: "Male", genre: "Premier League", nationality: "Spain" },
  { id: "f20", name: "Declan Rice", debut: 2015, members: "Midfielder", popularity: 20, gender: "Male", genre: "Premier League", nationality: "England" },
  { id: "f21", name: "Bernardo Silva", debut: 2013, members: "Midfielder", popularity: 22, gender: "Male", genre: "Premier League", nationality: "Portugal" },
  { id: "f22", name: "Luis Díaz", debut: 2016, members: "Attacker", popularity: 25, gender: "Male", genre: "Premier League", nationality: "Colombia" },
  { id: "f23", name: "Phil Foden", debut: 2017, members: "Midfielder", popularity: 21, gender: "Male", genre: "Premier League", nationality: "England" },
  { id: "f24", name: "Martin Ødegaard", debut: 2014, members: "Midfielder", popularity: 23, gender: "Male", genre: "Premier League", nationality: "Norway" },
  { id: "f25", name: "Alisson Becker", debut: 2013, members: "Goalkeeper", popularity: 24, gender: "Male", genre: "Premier League", nationality: "Brazil" }
];

const MOVIE_CANDIDATES: SpotleEntity[] = [
  { id: "mv1", name: "Leonardo DiCaprio", debut: 1989, members: "Actor", popularity: 1, gender: "Male", genre: "Drama", nationality: "USA" },
  { id: "mv2", name: "Margot Robbie", debut: 2008, members: "Actress", popularity: 2, gender: "Female", genre: "Comedy", nationality: "Australia" },
  { id: "mv3", name: "Cillian Murphy", debut: 1996, members: "Actor", popularity: 5, gender: "Male", genre: "Drama", nationality: "Ireland" },
  { id: "mv4", name: "Christopher Nolan", debut: 1998, members: "Director", popularity: 3, gender: "Male", genre: "Sci-Fi", nationality: "UK" },
  { id: "mv5", name: "Tom Hanks", debut: 1980, members: "Actor", popularity: 4, gender: "Male", genre: "Drama", nationality: "USA" },
  { id: "mv6", name: "Robert Downey Jr.", debut: 1970, members: "Actor", popularity: 6, gender: "Male", genre: "Action", nationality: "USA" },
  { id: "mv7", name: "Zendaya", debut: 2009, members: "Actress", popularity: 7, gender: "Female", genre: "Drama", nationality: "USA" },
  { id: "mv8", name: "Scarlett Johansson", debut: 1994, members: "Actress", popularity: 8, gender: "Female", genre: "Action", nationality: "USA" },
  { id: "mv9", name: "Bradley Cooper", debut: 1999, members: "Actor", popularity: 12, gender: "Male", genre: "Drama", nationality: "USA" },
  { id: "mv10", name: "Timothée Chalamet", debut: 2008, members: "Actor", popularity: 9, gender: "Male", genre: "Drama", nationality: "USA" },
  { id: "mv11", name: "Meryl Streep", debut: 1971, members: "Actress", popularity: 10, gender: "Female", genre: "Drama", nationality: "USA" },
  { id: "mv12", name: "Quentin Tarantino", debut: 1987, members: "Director", popularity: 11, gender: "Male", genre: "Action", nationality: "USA" },
  { id: "mv13", name: "Jennifer Lawrence", debut: 2006, members: "Actress", popularity: 13, gender: "Female", genre: "Sci-Fi", nationality: "USA" },
  { id: "mv14", name: "Brad Pitt", debut: 1987, members: "Actor", popularity: 14, gender: "Male", genre: "Drama", nationality: "USA" },
  { id: "mv15", name: "Keanu Reeves", debut: 1984, members: "Actor", popularity: 15, gender: "Male", genre: "Action", nationality: "Canada" },
  { id: "mv16", name: "Ryan Gosling", debut: 1993, members: "Actor", popularity: 16, gender: "Male", genre: "Drama", nationality: "Canada" },
  { id: "mv17", name: "Emma Stone", debut: 2004, members: "Actress", popularity: 17, gender: "Female", genre: "Comedy", nationality: "USA" },
  { id: "mv18", name: "Pedro Pascal", debut: 1996, members: "Actor", popularity: 18, gender: "Male", genre: "Drama", nationality: "Chile" },
  { id: "mv19", name: "Jenna Ortega", debut: 2012, members: "Actress", popularity: 19, gender: "Female", genre: "Horror", nationality: "USA" },
  { id: "mv20", name: "Florence Pugh", debut: 2014, members: "Actress", popularity: 20, gender: "Female", genre: "Drama", nationality: "UK" }
];

// Continent map definitions
const COUNTRY_CONTINENT: { [key: string]: string } = {
  "USA": "North America",
  "Canada": "North America",
  "Mexico": "North America",
  "UK": "Europe",
  "England": "Europe",
  "Ireland": "Europe",
  "France": "Europe",
  "Germany": "Europe",
  "Spain": "Europe",
  "Portugal": "Europe",
  "Italy": "Europe",
  "Netherlands": "Europe",
  "Belgium": "Europe",
  "Poland": "Europe",
  "Norway": "Europe",
  "Sweden": "Europe",
  "Austria": "Europe",
  "Croatia": "Europe",
  "Argentina": "South America",
  "Brazil": "South America",
  "Colombia": "South America",
  "Barbados": "North America",
  "South Korea": "Asia",
  "Japan": "Asia",
  "China": "Asia",
  "Australia": "Oceania",
  "New Zealand": "Oceania",
  "Chile": "South America",
  "Egypt": "Africa",
  "Puerto Rico": "North America",
  "Trinidad and Tobago": "North America"
};

// Neighbor helper list
const DIRECT_BORDERS: { [key: string]: string[] } = {
  'USA': ['Canada', 'Mexico', 'Puerto Rico'],
  'Canada': ['USA'],
  'UK': ['Ireland', 'France', 'Belgium'],
  'England': ['Scotland', 'Ireland', 'Wales', 'France'],
  'Ireland': ['UK', 'England'],
  'France': ['Spain', 'Italy', 'Germany', 'Belgium', 'Switzerland', 'UK'],
  'Germany': ['France', 'Austria', 'Switzerland', 'Poland', 'Denmark', 'Netherlands', 'Belgium'],
  'Portugal': ['Spain'],
  'Spain': ['Portugal', 'France'],
  'Argentina': ['Brazil', 'Chile', 'Uruguay', 'Paraguay', 'Bolivia'],
  'Brazil': ['Argentina', 'Colombia', 'Uruguay', 'Paraguay', 'Bolivia', 'Peru', 'Venezuela'],
  'Colombia': ['Brazil', 'Venezuela', 'Ecuador', 'Peru', 'Panama']
};

export default function SpotleGame({ theme = 'football' }: { theme?: 'football' | 'music' | 'movies' }) {
  // Pool setup
  const getPool = (): SpotleEntity[] => {
    if (theme === 'music') return MUSIC_CANDIDATES;
    if (theme === 'movies') return MOVIE_CANDIDATES;
    return FOOTBALL_CANDIDATES;
  };

  const pool = getPool();

  const getThemeLabels = () => {
    switch (theme) {
      case 'music':
        return {
          title: "Artist & Band Spotle",
          subtitle: "Crack the secret chart artist or rock band in 10 tactical guesses",
          inputPlace: "Search for a musical group or solo singer...",
          fieldMembers: "Members",
          fieldGenre: "Genre",
          tag: "Rhythm",
          accentColorText: "text-purple-400",
          accentColorBg: "bg-purple-900 border-purple-500",
          accentFocusRing: "focus:ring-purple-500",
          accentBtn: "bg-purple-600 hover:bg-purple-700 active:bg-purple-805",
          debutLabel: "Debut Album",
          listLabel: "Listener Rank"
        };
      case 'movies':
        return {
          title: "Cinema Star Spotle",
          subtitle: "Ascertain the mystery actor, actress, or film director in 10 guesses",
          inputPlace: "Search Hollywood stars or movie directors...",
          fieldMembers: "Role",
          fieldGenre: "Genre",
          tag: "Cinema",
          accentColorText: "text-amber-400",
          accentColorBg: "bg-amber-950 border-amber-600",
          accentFocusRing: "focus:ring-amber-500",
          accentBtn: "bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-slate-950 font-black",
          debutLabel: "Debut Work",
          listLabel: "Star Power"
        };
      default:
        return {
          title: "Striker Grid Spotle",
          subtitle: "Pinpoint the master football superstar with interactive characteristics",
          inputPlace: "Search a famous footballer candidate...",
          fieldMembers: "Position",
          fieldGenre: "League",
          tag: "Football",
          accentColorText: "text-emerald-400",
          accentColorBg: "bg-slate-900 border-emerald-500",
          accentFocusRing: "focus:ring-emerald-500",
          accentBtn: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800",
          debutLabel: "Senior Debut",
          listLabel: "World Rank"
        };
    }
  };

  const labels = getThemeLabels();

  // Active game states
  const [secret, setSecret] = useState<SpotleEntity | null>(null);
  const [guesses, setGuesses] = useState<SpotleEntity[]>([]);
  const [inputText, setInputText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  
  // Highscore state
  const [nickname, setNickname] = useState('0matthewsmith@gmail.com');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Dropdown reference
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset or Start game
  const initGame = () => {
    const activePool = getPool();
    const randomIndex = Math.floor(Math.random() * activePool.length);
    setSecret(activePool[randomIndex]);
    setGuesses([]);
    setInputText('');
    setGameEnded(false);
    setHasWon(false);
    setSubmitted(false);
    setShowDropdown(false);
  };

  // Run initial select
  useEffect(() => {
    initGame();
  }, [theme]);

  // Click outside dropdown handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter pool based on input text and already guessed
  const guessedIds = guesses.map(g => g.id);
  const dropdownOptions = pool
    .filter(item => !guessedIds.includes(item.id))
    .filter(item => item.name.toLowerCase().includes(inputText.toLowerCase().trim()))
    .slice(0, 8); // Max 8 suggestions

  const handleSelectOption = (item: SpotleEntity) => {
    makeGuess(item);
    setInputText('');
    setShowDropdown(false);
  };

  // Compare nationality
  const compareNationality = (guessNat: string, targetNat: string) => {
    const normG = guessNat.trim().toLowerCase();
    const normT = targetNat.trim().toLowerCase();
    
    if (normG === normT) return 'green';
    
    const standardize = (name: string) => {
      if (name.includes('england') || name.includes('scotland') || name.includes('wales') || name.includes('uk') || name.includes('united kingdom')) return 'UK';
      if (name.includes('usa') || name.includes('united states')) return 'USA';
      return name;
    };
    
    const stdG = standardize(normG);
    const stdT = standardize(normT);
    
    const contG = COUNTRY_CONTINENT[stdG] || COUNTRY_CONTINENT[guessNat] || '';
    const contT = COUNTRY_CONTINENT[stdT] || COUNTRY_CONTINENT[targetNat] || '';
    
    const bordersG = DIRECT_BORDERS[stdG] || [];
    const isDirectBorder = bordersG.some(b => b.toLowerCase() === stdT.toLowerCase());
    
    if (isDirectBorder || (contG && contG === contT)) {
      return 'orange';
    }
    
    return 'grey';
  };

  // Main matching mechanism
  const makeGuess = (guessItem: SpotleEntity) => {
    if (!secret || gameEnded) return;

    const newGuesses = [guessItem, ...guesses]; // Reverse-chronological order: latest at the top
    setGuesses(newGuesses);

    if (guessItem.id === secret.id) {
      setHasWon(true);
      setGameEnded(true);
    } else if (newGuesses.length >= 10) {
      setGameEnded(true);
    }
  };

  // Submit Score to global standings
  const handleSubmitScore = async () => {
    if (!nickname.trim() || submitting || submitted) return;
    setSubmitting(true);
    try {
      // Score in Spotle can be 11 - number of guesses (fewest guesses gets highest score!)
      const scoreValue = hasWon ? (11 - guesses.length) : 0;
      await apiFetch('/api/leaderboards/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: nickname.trim(),
          gameType: 'tenable', // Place in Tenable or general grid
          score: scoreValue,
          tenableTopic: `[Spotle Mode] ${labels.title} (${theme.toUpperCase()})`,
          tenableTimerMode: 'none',
          tenableLivesMode: 'custom'
        })
      });
      setSubmitted(true);
    } catch (e) {
      console.error("Score submission failed", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6" id="spotle-game-root">
      
      {/* Title Showcase Card */}
      <div className={`p-6 sm:p-8 rounded-2xl border text-white ${labels.accentColorBg} shadow-md overflow-hidden relative`}>
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-black uppercase tracking-widest bg-white/20 text-white ${labels.accentColorText}`}>
                {labels.tag} Clue Spotter
              </span>
              <span className="bg-emerald-500 text-slate-950 font-bold text-[9px] px-2 py-0.5 rounded-md uppercase animate-pulse">
                New Mode
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-sans tracking-tight uppercase mt-2">
              {labels.title}
            </h1>
            <p className="text-xs text-slate-350 mt-1 max-w-xl">
              {labels.subtitle}
            </p>
          </div>
          
          <button
            onClick={initGame}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all uppercase self-start sm:self-auto cursor-pointer"
          >
            <RefreshCcw size={13} />
            Reset Mystery Target
          </button>
        </div>
      </div>

      {/* Main Grid: Input and progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Control Column (Search & Tutorial Clue Guide) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* Active Search Console */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Progress Matrix
              </span>
              <span className="font-mono text-xs font-black bg-slate-150 px-2.5 py-1 rounded-lg text-slate-800">
                GUESS {guesses.length} OF 10
              </span>
            </div>

            {/* Input & Dropdown Autocomplete Area */}
            <div className="relative ref-dropdown" ref={dropdownRef}>
              <div className="flex items-center border-2 border-slate-200 focus-within:border-slate-800 bg-slate-50 rounded-xl px-3 py-2.5 transition-all">
                <Search className="text-slate-400 mr-2" size={18} />
                <input
                  type="text"
                  disabled={gameEnded}
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder={gameEnded ? "Mystery solved! Click Reset below to play again." : labels.inputPlace}
                  className="bg-transparent flex-1 focus:outline-none text-sm text-slate-900 placeholder:text-slate-400"
                />
                {inputText && (
                  <button onClick={() => setInputText('')} className="text-slate-400 hover:text-slate-600 text-xs px-1 font-bold cursor-pointer">
                    Clear
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown suggestions list */}
              <AnimatePresence>
                {showDropdown && inputText.trim().length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.1 }}
                    className="absolute z-20 top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 overflow-hidden"
                  >
                    {dropdownOptions.length > 0 ? (
                      <div className="flex flex-col py-1">
                        {dropdownOptions.map(item => (
                          <button
                            key={item.id}
                            onClick={() => handleSelectOption(item)}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm font-semibold text-slate-800 flex items-center justify-between border-b border-slate-50 last:border-0 cursor-pointer"
                          >
                            <div className="flex items-center space-x-3">
                              <SafeImage
                                src={getPlayerPhoto(item.name, theme)}
                                alt={item.name}
                                fallbackType="player"
                                fallbackName={item.name}
                                theme={theme}
                                className="w-7 h-7 rounded-full object-cover border border-slate-100"
                              />
                              <span>{item.name}</span>
                            </div>
                            <ChevronRight size={14} className="text-slate-400" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400 font-medium">
                        No matches remaining. Try another spelling or artist!
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Helper guidelines wrapper */}
            <div className="mt-4 flex flex-col gap-1">
              <div className="flex space-x-1.5 items-center">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></div>
                <span className="text-[10px] sm:text-xs text-slate-600 font-bold">Green = Perfect match</span>
              </div>
              <div className="flex space-x-1.5 items-center">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></div>
                <span className="text-[10px] sm:text-xs text-slate-600 font-bold">Orange = Close proximity (Debut within 5 yrs / Pop. rank within 50 / Adjacent country or same continent)</span>
              </div>
              <div className="flex space-x-1.5 items-center">
                <div className="w-2.5 h-2.5 bg-slate-400 rounded-sm"></div>
                <span className="text-[10px] sm:text-xs text-slate-600 font-bold">Grey = No match & far distance</span>
              </div>
            </div>
          </div>

          {/* End Match Verdict Sheet if completed */}
          <AnimatePresence>
            {gameEnded && secret && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-md flex flex-col items-center text-center"
              >
                {hasWon ? (
                  <div className="p-3 bg-emerald-500 text-slate-950 rounded-full mb-3 animate-bounce">
                    <Trophy size={28} />
                  </div>
                ) : (
                  <div className="p-3 bg-rose-500 text-slate-950 rounded-full mb-3">
                    <AlertCircle size={28} />
                  </div>
                )}
                
                <h3 className="text-xl font-black uppercase tracking-tight">
                  {hasWon ? "Victory Achieved!" : "Out of Guesses"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {hasWon 
                    ? `Brilliant deduction! You unlocked the mystery in ${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'}!` 
                    : "Excellent effort, but you're out of attempts! Here is the actual target:"}
                </p>

                {/* Target Reveal Profile Card */}
                <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-4 w-full mt-4 flex flex-col items-center">
                  <SafeImage
                    src={getPlayerPhoto(secret.name, theme)}
                    alt={secret.name}
                    fallbackType="player"
                    fallbackName={secret.name}
                    theme={theme}
                    className="w-20 h-20 rounded-full object-cover border-2 border-white/15 shadow-md mb-2"
                  />
                  <h4 className="text-md font-bold text-white leading-none mb-1">
                    {secret.name}
                  </h4>
                  <p className="text-xs text-slate-300 font-medium">
                    {secret.nationality} • {secret.genre}
                  </p>
                  
                  {/* Stats list */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-slate-700/60 w-full text-left text-xs text-slate-400">
                    <div>Debut: <span className="text-white font-bold">{secret.debut}</span></div>
                    <div>Popularity rank: <span className="text-white font-bold">#{secret.popularity}</span></div>
                    <div>Gender: <span className="text-white font-bold">{secret.gender}</span></div>
                    <div>{labels.fieldMembers}: <span className="text-white font-bold">{secret.members}</span></div>
                  </div>
                </div>

                {/* Standing upload panel */}
                {hasWon && (
                  <div className="w-full mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2">
                    {!submitted ? (
                      <>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider leading-none">
                          Post scoreboard to standings
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Your Nickname"
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 min-w-0 flex-1"
                          />
                          <button
                            onClick={handleSubmitScore}
                            disabled={submitting}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer"
                          >
                            {submitting ? "SUBMITTING..." : "SUBMIT"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 size={14} /> Scoreboard standings updated successfully!
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={initGame}
                  className="w-full mt-4 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm py-2.5 rounded-xl uppercase tracking-tighter transition-all cursor-pointer shadow-md"
                >
                  Play Another Target
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Clue Matrix / Guess List Board Column */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest">
              Active Feedback Deck
            </h3>
            <span className="text-xs text-slate-400 font-medium font-mono">
              {guesses.length} recorded attempts
            </span>
          </div>

          <div className="flex flex-col gap-4 max-h-[700px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {guesses.length > 0 ? (
                guesses.map((item, index) => {
                  const isCorrectDebut = item.debut === secret?.debut;
                  const absDebutDiff = Math.abs(item.debut - (secret?.debut || 0));
                  const isNearDebut = absDebutDiff <= 5 && !isCorrectDebut;
                  
                  const isCorrectMembers = item.members === secret?.members;
                  
                  const isCorrectPopularity = item.popularity === secret?.popularity;
                  const absPopDiff = Math.abs(item.popularity - (secret?.popularity || 0));
                  const isNearPopularity = absPopDiff <= 50 && !isCorrectPopularity;
                  
                  const isCorrectGender = item.gender === secret?.gender;
                  const isCorrectGenre = item.genre === secret?.genre;
                  
                  const natMatchStatus = compareNationality(item.nationality, secret?.nationality || '');

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -15, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5"
                    >
                      {/* Name/Avatar Header row */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center space-x-3.5">
                          <SafeImage
                            src={getPlayerPhoto(item.name, theme)}
                            alt={item.name}
                            fallbackType="player"
                            fallbackName={item.name}
                            theme={theme}
                            className="w-9 h-9 rounded-full object-cover border border-slate-100 bg-slate-100"
                          />
                          <div>
                            <h4 className="text-sm font-black text-slate-900 leading-tight">
                              {item.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
                              Guess {guesses.length - index} of 10
                            </p>
                          </div>
                        </div>
                        {item.id === secret?.id && (
                          <span className="bg-emerald-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase">
                            MATCHED TARGET
                          </span>
                        )}
                      </div>

                      {/* 3x2 Grid layout for Mobile / Desktop responsive clue boxes */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-white">
                        
                        {/* 1. DEBUT */}
                        <div className={`p-2.5 rounded-xl flex flex-col justify-center items-center transition-all ${
                          isCorrectDebut ? 'bg-emerald-500' : isNearDebut ? 'bg-amber-500' : 'bg-slate-400'
                        } border-b-2 ${
                          isCorrectDebut ? 'border-emerald-600' : isNearDebut ? 'border-amber-600' : 'border-slate-500'
                        }`}>
                          <span className="text-[8px] font-mono uppercase text-white/70 block leading-none mb-1">
                            {labels.debutLabel}
                          </span>
                          <span className="text-xs sm:text-sm font-black flex items-center gap-1 font-mono">
                            {item.debut}
                            {!isCorrectDebut && secret && (
                              item.debut < secret.debut ? <ArrowUp size={12} className="animate-bounce" /> : <ArrowDown size={12} className="animate-bounce" />
                            )}
                          </span>
                        </div>

                        {/* 2. MEMBERS / POS / ROLE */}
                        <div className={`p-2.5 rounded-xl flex flex-col justify-center items-center transition-all ${
                          isCorrectMembers ? 'bg-emerald-500' : 'bg-slate-400'
                        } border-b-2 ${
                          isCorrectMembers ? 'border-emerald-600' : 'border-slate-500'
                        }`}>
                          <span className="text-[8px] font-mono uppercase text-white/70 block leading-none mb-1">
                            {labels.fieldMembers}
                          </span>
                          <span className="text-xs sm:text-sm font-black truncate max-w-full">
                            {item.members}
                          </span>
                        </div>

                        {/* 3. POPULARITY */}
                        <div className={`p-2.5 rounded-xl flex flex-col justify-center items-center transition-all ${
                          isCorrectPopularity ? 'bg-emerald-500' : isNearPopularity ? 'bg-amber-500' : 'bg-slate-400'
                        } border-b-2 ${
                          isCorrectPopularity ? 'border-emerald-600' : isNearPopularity ? 'border-amber-600' : 'border-slate-500'
                        }`}>
                          <span className="text-[8px] font-mono uppercase text-white/70 block leading-none mb-1">
                            {labels.listLabel}
                          </span>
                          <span className="text-xs sm:text-sm font-black flex items-center gap-1 font-mono">
                            #{item.popularity}
                            {!isCorrectPopularity && secret && (
                              // Remember Rank order: #1 is HIGHER rank, worse popularity has higher numbers
                              // If guess Rank is #215 and secret is #56, we show ^ (go up to #56)
                              // If guess Rank is #9 and secret is #150, we show v (go down to #150)
                              item.popularity > secret.popularity ? <ArrowUp size={12} className="animate-bounce" /> : <ArrowDown size={12} className="animate-bounce" />
                            )}
                          </span>
                        </div>

                        {/* 4. GENDER */}
                        <div className={`p-2.5 rounded-xl flex flex-col justify-center items-center transition-all ${
                          isCorrectGender ? 'bg-emerald-500' : 'bg-slate-400'
                        } border-b-2 ${
                          isCorrectGender ? 'border-emerald-600' : 'border-slate-500'
                        }`}>
                          <span className="text-[8px] font-mono uppercase text-white/70 block leading-none mb-1">
                            Gender
                          </span>
                          <span className="text-xs sm:text-sm font-black truncate">
                            {item.gender}
                          </span>
                        </div>

                        {/* 5. GENRE / LEAGUE */}
                        <div className={`p-2.5 rounded-xl flex flex-col justify-center items-center transition-all ${
                          isCorrectGenre ? 'bg-emerald-500' : 'bg-slate-400'
                        } border-b-2 ${
                          isCorrectGenre ? 'border-emerald-600' : 'border-slate-500'
                        }`}>
                          <span className="text-[8px] font-mono uppercase text-white/70 block leading-none mb-1">
                            {labels.fieldGenre}
                          </span>
                          <span className="text-[11px] sm:text-xs font-black truncate max-w-full leading-tight">
                            {item.genre}
                          </span>
                        </div>

                        {/* 6. NATIONALITY / COUNTRY */}
                        <div className={`p-2.5 rounded-xl flex flex-col justify-center items-center transition-all ${
                          natMatchStatus === 'green' ? 'bg-emerald-500' : natMatchStatus === 'orange' ? 'bg-amber-500' : 'bg-slate-400'
                        } border-b-2 ${
                          natMatchStatus === 'green' ? 'border-emerald-600' : natMatchStatus === 'orange' ? 'border-amber-600' : 'border-slate-500'
                        }`}>
                          <span className="text-[8px] font-mono uppercase text-white/70 block leading-none mb-1">
                            Nationality
                          </span>
                          <span className="text-xs sm:text-sm font-black flex items-center gap-1.5 justify-center">
                            <SafeImage
                              src={getFlagUrl(item.nationality)}
                              alt={item.nationality}
                              fallbackType="flag"
                              fallbackName={item.nationality}
                              className="w-5 h-3.5 object-cover rounded shadow-xs shrink-0"
                            />
                            <span className="truncate max-w-[50px] sm:max-w-none">{item.nationality}</span>
                          </span>
                        </div>

                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center text-center justify-center min-h-[300px]">
                  <Compass className="text-slate-400 animate-spin-slow mb-3" size={32} />
                  <p className="text-sm font-bold text-slate-500">Board is empty</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Type and select a target choice in the search bar to reveal comparison clues!
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

    </div>
  );
}
