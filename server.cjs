var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
import_dotenv.default.config();
var app = (0, import_express.default)();
app.use(import_express.default.json());
var footballerCache = [];
var DB_PATH = import_path.default.join(process.cwd(), "footballer-db.json");
function loadDb() {
  try {
    if (import_fs.default.existsSync(DB_PATH)) {
      const raw = import_fs.default.readFileSync(DB_PATH, "utf-8");
      footballerCache = JSON.parse(raw);
      console.log(`Loaded ${footballerCache.length} footballers from database cache.`);
    } else {
      console.log("No footballer DB file found. Starting empty cache.");
      footballerCache = [];
    }
  } catch (err) {
    console.error("Error loading footballer DB:", err);
    footballerCache = [];
  }
}
function saveDb() {
  try {
    import_fs.default.writeFileSync(DB_PATH, JSON.stringify(footballerCache, null, 2), "utf-8");
    console.log(`Saved ${footballerCache.length} footballers to database cache.`);
  } catch (err) {
    console.error("Error saving footballer DB:", err);
  }
}
loadDb();
function checkFuzzyMatch(array, query) {
  if (!array || !query) return false;
  const qClean = query.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "");
  return array.some((item) => {
    const itemClean = item.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "");
    return itemClean === qClean || itemClean.includes(qClean) || qClean.includes(itemClean);
  });
}
function checkPlayerCriteria(player, type, value) {
  const normType = type.toLowerCase().trim();
  const val = value.toLowerCase().trim();
  if (normType === "nationality") {
    const playerNat = player.nationality.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "");
    const testNat = val.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "");
    return playerNat === testNat || playerNat.includes(testNat) || testNat.includes(playerNat);
  }
  if (normType === "club") {
    return checkFuzzyMatch(player.clubs, value);
  }
  if (normType === "manager" || normType === "managed_by" || normType === "managed by") {
    return checkFuzzyMatch(player.managers, value);
  }
  if (normType === "trophy") {
    return checkFuzzyMatch(player.trophies, value);
  }
  if (normType === "league") {
    return checkFuzzyMatch(player.leagues, value);
  }
  if (normType === "partner" || normType === "played_with" || normType === "played with") {
    return checkFuzzyMatch(player.partners, value) || checkFuzzyMatch(player.synonyms, value);
  }
  return false;
}
function findFootballerInCache(name) {
  const cleanName = name.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "");
  if (!cleanName) return null;
  let found = footballerCache.find((f) => {
    if (f.name.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "") === cleanName) {
      return true;
    }
    return f.synonyms.some((s) => s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "") === cleanName);
  });
  if (found) return found;
  found = footballerCache.find((f) => {
    const nameParts = f.name.toLowerCase().split(/\s+/).map((p) => p.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, ""));
    const guessParts = cleanName.split(/\s+/);
    if (guessParts.length === 1 && nameParts.includes(cleanName) && cleanName.length > 3) {
      return true;
    }
    return false;
  });
  return found || null;
}
var PORT = 3e3;
var aiClient = null;
function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
    return null;
  }
  if (!aiClient) {
    aiClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
var TTT_CURATED_GRIDS = [
  {
    rows: [
      { type: "Club", value: "Chelsea" },
      { type: "Club", value: "Real Madrid" },
      { type: "Nationality", value: "France" }
    ],
    cols: [
      { type: "Club", value: "Juventus" },
      { type: "Club", value: "Arsenal" },
      { type: "Trophy", value: "Won World Cup" }
    ]
  },
  {
    rows: [
      { type: "Club", value: "Manchester United" },
      { type: "Club", value: "Barcelona" },
      { type: "Nationality", value: "England" }
    ],
    cols: [
      { type: "Club", value: "Real Madrid" },
      { type: "Club", value: "PSG" },
      { type: "Trophy", value: "Won Champions League" }
    ]
  },
  {
    rows: [
      { type: "Club", value: "Liverpool" },
      { type: "Club", value: "Bayern Munich" },
      { type: "Nationality", value: "Netherlands" }
    ],
    cols: [
      { type: "Club", value: "Barcelona" },
      { type: "Club", value: "Manchester City" },
      { type: "Trophy", value: "Won Champions League" }
    ]
  },
  {
    rows: [
      { type: "Club", value: "AC Milan" },
      { type: "Club", value: "Atletico Madrid" },
      { type: "Nationality", value: "Brazil" }
    ],
    cols: [
      { type: "Club", value: "Inter Milan" },
      { type: "Club", value: "Chelsea" },
      { type: "Trophy", value: "Won World Cup" }
    ]
  },
  {
    rows: [
      { type: "Club", value: "Borussia Dortmund" },
      { type: "Club", value: "Arsenal" },
      { type: "Nationality", value: "Spain" }
    ],
    cols: [
      { type: "Club", value: "Bayern Munich" },
      { type: "Club", value: "Chelsea" },
      { type: "Trophy", value: "Won Ballon d'Or" }
    ]
  },
  {
    rows: [
      { type: "Club", value: "PSG" },
      { type: "Club", value: "Juventus" },
      { type: "Nationality", value: "Portugal" }
    ],
    cols: [
      { type: "Club", value: "Real Madrid" },
      { type: "Club", value: "Manchester United" },
      { type: "Trophy", value: "Won Champions League" }
    ]
  },
  {
    rows: [
      { type: "Club", value: "Inter Milan" },
      { type: "Club", value: "Bayern Munich" },
      { type: "Club", value: "Real Madrid" }
    ],
    cols: [
      { type: "Club", value: "AC Milan" },
      { type: "Club", value: "PSG" },
      { type: "Trophy", value: "Won Ballon d'Or" }
    ]
  },
  {
    rows: [
      { type: "Club", value: "Manchester United" },
      { type: "Club", value: "Chelsea" },
      { type: "Club", value: "Arsenal" }
    ],
    cols: [
      { type: "Club", value: "Liverpool" },
      { type: "Club", value: "Tottenham" },
      { type: "Trophy", value: "Won World Cup" }
    ]
  },
  {
    rows: [
      { type: "Club", value: "Borussia Dortmund" },
      { type: "Club", value: "Atletico Madrid" },
      { type: "Club", value: "Juventus" }
    ],
    cols: [
      { type: "Club", value: "Barcelona" },
      { type: "Club", value: "Manchester City" },
      { type: "Trophy", value: "Won Champions League" }
    ]
  },
  {
    rows: [
      { type: "Nationality", value: "Netherlands" },
      { type: "Nationality", value: "France" },
      { type: "Nationality", value: "Spain" }
    ],
    cols: [
      { type: "Club", value: "Bayern Munich" },
      { type: "Club", value: "Real Madrid" },
      { type: "Trophy", value: "Won Champions League" }
    ]
  },
  {
    rows: [
      { type: "Club", value: "Real Madrid" },
      { type: "Club", value: "Liverpool" },
      { type: "Club", value: "Bayern Munich" }
    ],
    cols: [
      { type: "Club", value: "Chelsea" },
      { type: "Club", value: "Inter Milan" },
      { type: "Trophy", value: "Won Ballon d'Or" }
    ]
  },
  {
    rows: [
      { type: "Club", value: "Manchester United" },
      { type: "Club", value: "Juventus" },
      { type: "Club", value: "Barcelona" }
    ],
    cols: [
      { type: "Club", value: "Inter Milan" },
      { type: "Club", value: "PSG" },
      { type: "Trophy", value: "Won World Cup" }
    ]
  }
];
var TENABLE_CURATED_TOPICS = [
  {
    id: "t1",
    title: "Top 10 Premier League Goalscorers of All Time",
    description: "Name the top ten players with the most career goals in Premier League history.",
    items: [
      "Alan Shearer",
      "Harry Kane",
      "Wayne Rooney",
      "Andy Cole",
      "Sergio Aguero",
      "Frank Lampard",
      "Thierry Henry",
      "Robbie Fowler",
      "Jermain Defoe",
      "Mohamed Salah"
    ]
  },
  {
    id: "t2",
    title: "10 Clubs Managed by Jose Mourinho During His Senior Career",
    description: "Name 10 of the senior professional clubs that the Portuguese tactician 'The Special One' has managed.",
    items: [
      "Benfica",
      "Uniao de Leiria",
      "Porto",
      "Chelsea",
      "Inter Milan",
      "Real Madrid",
      "Manchester United",
      "Tottenham Hotspur",
      "Roma",
      "Fenerbahce"
    ]
  },
  {
    id: "t3",
    title: "10 Players Who Have Played for Both Chelsea and Arsenal",
    description: "Name 10 famous professional footballers who made at least one official senior appearance for both London rivals.",
    items: [
      "Ashley Cole",
      "Cesc Fabregas",
      "Petr Cech",
      "Olivier Giroud",
      "David Luiz",
      "Nicolas Anelka",
      "William Gallas",
      "Willian",
      "Emmanuel Petit",
      "Kai Havertz",
      "Pierre-Emerick Aubameyang",
      "Jorginho"
    ]
  },
  {
    id: "t4",
    title: "10 Players with 5 or More UEFA Champions League Titles",
    description: "Name 10 players who have lifted the UEFA Champions League / European Cup trophy 5 times or more in their career.",
    items: [
      "Paco Gento",
      "Cristiano Ronaldo",
      "Toni Kroos",
      "Luka Modric",
      "Karim Benzema",
      "Dani Carvajal",
      "Nacho",
      "Marcelo",
      "Casemiro",
      "Gareth Bale",
      "Isco"
    ]
  },
  {
    id: "t5",
    title: "10 Managers Who Have Won the UEFA Champions League",
    description: "Name 10 different managers who have won the UEFA Champions League / European Cup at least once in their coaching career.",
    items: [
      "Carlo Ancelotti",
      "Pep Guardiola",
      "Zinedine Zidane",
      "Alex Ferguson",
      "Jose Mourinho",
      "Jupp Heynckes",
      "Ottmar Hitzfeld",
      "Jurgen Klopp",
      "Thomas Tuchel",
      "Luis Enrique",
      "Rafael Benitez",
      "Louis van Gaal",
      "Vicente del Bosque"
    ]
  },
  {
    id: "t6",
    title: "10 Countries with the Most FIFA World Cup Winner Titles",
    description: "Name the countries / national teams who have won at least one FIFA World Cup, ranked by total titles first.",
    items: [
      "Brazil",
      "Germany",
      "Italy",
      "Argentina",
      "France",
      "Uruguay",
      "England",
      "Spain"
    ]
  },
  {
    id: "t7",
    title: "10 Clubs with English Premier League or First Division Champion Titles",
    description: "Name 10 different English clubs who have won the top-flight championship title (Premier League or First Division) at least twice.",
    items: [
      "Manchester United",
      "Liverpool",
      "Arsenal",
      "Everton",
      "Aston Villa",
      "Sunderland",
      "Manchester City",
      "Chelsea",
      "Newcastle United",
      "Blackburn Rovers",
      "Leeds United",
      "Wolverhampton Wanderers"
    ]
  },
  {
    id: "t8",
    title: "10 Clubs Managed by Pep Guardiola or Carlo Ancelotti",
    description: "Name 10 senior professional football clubs managed by either Pep Guardiola or Carlo Ancelotti.",
    items: [
      "Reggiana",
      "Parma",
      "Juventus",
      "AC Milan",
      "Chelsea",
      "Paris Saint-Germain",
      "Real Madrid",
      "Bayern Munich",
      "Napoli",
      "Everton",
      "Barcelona",
      "Manchester City"
    ]
  },
  {
    id: "t9",
    title: "10 Players with 4 or More Premier League Titles",
    description: "Name 10 professional football players who have won the English Premier League champion medal 4 or more times.",
    items: [
      "Ryan Giggs",
      "Paul Scholes",
      "Gary Neville",
      "Denis Irwin",
      "Roy Keane",
      "David Beckham",
      "Phil Neville",
      "Nicky Butt",
      "Ole Gunnar Solskjaer",
      "John Terry",
      "Petr Cech",
      "Didier Drogba",
      "Ferdinand",
      "Wayne Rooney",
      "Sergio Aguero",
      "Fernandinho",
      "Ederson",
      "Kevin De Bruyne",
      "Phil Foden",
      "Bernardo Silva",
      "Riyad Mahrez"
    ]
  },
  {
    id: "t10",
    title: "10 European Nationalities with a Ballon d'Or Winner",
    description: "Name 10 European countries / nationalities who have produced at least one male Ballon d'Or winner in football history.",
    items: [
      "England",
      "France",
      "Germany",
      "Italy",
      "Netherlands",
      "Portugal",
      "Spain",
      "Soviet Union",
      "Croatia",
      "Czech Republic",
      "Czechoslovakia",
      "Denmark",
      "Hungary",
      "Northern Ireland",
      "Scotland",
      "Ukraine",
      "Bulgaria"
    ]
  },
  {
    id: "t11",
    title: "10 Famous Clubs with a UEFA Champions League / European Cup Title",
    description: "Name 10 different European football clubs who have won the UEFA Champions League or original European Cup at least once.",
    items: [
      "Real Madrid",
      "AC Milan",
      "Bayern Munich",
      "Liverpool",
      "Barcelona",
      "Ajax",
      "Inter Milan",
      "Manchester United",
      "Juventus",
      "Benfica",
      "Chelsea",
      "Nottingham Forest",
      "Porto",
      "Celtic",
      "Hamburg",
      "Feyenoord",
      "Aston Villa",
      "PSV Eindhoven",
      "Red Star Belgrade",
      "Marseille",
      "Borussia Dortmund",
      "Manchester City"
    ]
  },
  {
    id: "t12",
    title: "10 Active Footballers with 50+ International Goals",
    description: "Name 10 currently active male professional footballers who have scored 50 or more goals for their senior national team.",
    items: [
      "Cristiano Ronaldo",
      "Lionel Messi",
      "Robert Lewandowski",
      "Ali Mabkhout",
      "Romelu Lukaku",
      "Sunil Chhetri",
      "Neymar",
      "Luis Suarez",
      "Harry Kane",
      "Edin Dzeko",
      "Mitrovic",
      "Alexis Sanchez",
      "Eran Zahavi",
      "Sadio Mane",
      "Kylian Mbappe"
    ]
  },
  {
    id: "t13",
    title: "10 Players Who Have Played for Both Real Madrid and Barcelona",
    description: "Name 10 players who crossed the El Clasico divide and played senior official matches for both Barcelona and Real Madrid.",
    items: [
      "Luis Figo",
      "Ronaldo Nazario",
      "Michael Laudrup",
      "Luis Enrique",
      "Samuel Eto'o",
      "Javier Saviola",
      "Gheorghe Hagi",
      "Robert Prosinecki",
      "Albert Celades",
      "Alfonso Perez",
      "Bernd Schuster",
      "Julen Lopetegui"
    ]
  },
  {
    id: "t14",
    title: "10 Premier League Assists Kings of All Time",
    description: "Name 10 of the best playmakers with the most career assists in English Premier League history.",
    items: [
      "Ryan Giggs",
      "Cesc Fabregas",
      "Wayne Rooney",
      "Kevin De Bruyne",
      "Frank Lampard",
      "Dennis Bergkamp",
      "Steven Gerrard",
      "James Milner",
      "David Beckham",
      "Teddy Sheringham"
    ]
  },
  {
    id: "t15",
    title: "10 Ballon d'Or Winners Who Played for Real Madrid",
    description: "Name 10 legendary players who won the ultimate individual honor (Ballon d'Or) and wore the Real Madrid jersey.",
    items: [
      "Alfredo Di Stefano",
      "Raymond Kopa",
      "Luis Figo",
      "Ronaldo Nazario",
      "Fabio Cannavaro",
      "Cristiano Ronaldo",
      "Luka Modric",
      "Karim Benzema",
      "Zinedine Zidane",
      "Michael Owen"
    ]
  },
  {
    id: "t16",
    title: "10 Striker Legends with 100+ Champions League Appearances",
    description: "Name 10 legendary football players who crossed the 100-match milestone in modern UEFA Champions League history.",
    items: [
      "Cristiano Ronaldo",
      "Lionel Messi",
      "Robert Lewandowski",
      "Karim Benzema",
      "Thomas Muller",
      "Raul Gonzalez",
      "Zlatan Ibrahimovic",
      "Thierry Henry",
      "Filippo Inzaghi",
      "Harry Kane"
    ]
  },
  {
    id: "t17",
    title: "10 Clubs Outside Top Five Leagues with European Cups / UCL Titles",
    description: "Name 10 clubs from outside the top 5 European divisions (EPL, LaLiga, SerieA, Bundesliga, Ligue1) who won a European Cup / UCL.",
    items: [
      "Ajax",
      "Benfica",
      "Porto",
      "Celtic",
      "Feyenoord",
      "PSV Eindhoven",
      "Steaua Bucuresti",
      "Red Star Belgrade"
    ]
  },
  {
    id: "t18",
    title: "10 Legendary French Players with 100+ International Caps",
    description: "Name 10 world-renowned French internationals who broke the 100 appearance milestone for Les Bleus.",
    items: [
      "Hugo Lloris",
      "Lilian Thuram",
      "Olivier Giroud",
      "Thierry Henry",
      "Marcel Desailly",
      "Antoine Griezmann",
      "Zinedine Zidane",
      "Patrick Vieira",
      "Didier Deschamps",
      "Laurent Blanc"
    ]
  },
  {
    id: "t19",
    title: "10 Famous Managers Who Directed Chelsea",
    description: "Name 10 prominent professional head coaches who took the hotseat at Chelsea FC.",
    items: [
      "Jose Mourinho",
      "Carlo Ancelotti",
      "Antonio Conte",
      "Thomas Tuchel",
      "Guus Hiddink",
      "Roberto Di Matteo",
      "Claudio Ranieri",
      "Maurizio Sarri",
      "Frank Lampard",
      "Gianluca Vialli"
    ]
  },
  {
    id: "t20",
    title: "10 Legendary Italian Clubs Who Placed in Serie A history",
    description: "Name 10 iconic traditional Italian clubs who achieved historic stature in Serie A.",
    items: [
      "Juventus",
      "AC Milan",
      "Inter Milan",
      "Roma",
      "Lazio",
      "Napoli",
      "Fiorentina",
      "Atalanta",
      "Torino",
      "Bologna"
    ]
  }
];
var CAREER_CURATED_PLAYERS = [
  {
    id: "p1",
    name: "Cristiano Ronaldo",
    nationality: "Portugal",
    positions: "Forward / Winger",
    birthYear: "1985",
    clues: ["5-time Ballon d'Or winner", "All-time top scorer in international football", "Won Euros in 2016"],
    career: [
      { years: "2002\u20132003", club: "Sporting CP", apps: "25", goals: "3" },
      { years: "2003\u20132009", club: "Manchester United", apps: "196", goals: "84" },
      { years: "2009\u20132018", club: "Real Madrid", apps: "292", goals: "311" },
      { years: "2018\u20132021", club: "Juventus", apps: "98", goals: "81" },
      { years: "2021\u20132022", club: "Manchester United", apps: "40", goals: "19" },
      { years: "2023\u2013", club: "Al Nassr", apps: "64", goals: "62" }
    ]
  },
  {
    id: "p2",
    name: "Lionel Messi",
    nationality: "Argentina",
    positions: "Forward / Attacking Midfielder",
    birthYear: "1987",
    clues: ["8-time Ballon d'Or winner", "World Cup winner in 2022", "La Liga all-time top scorer"],
    career: [
      { years: "2004\u20132021", club: "Barcelona", apps: "520", goals: "474" },
      { years: "2021\u20132023", club: "Paris Saint-Germain", apps: "58", goals: "22" },
      { years: "2023\u2013", club: "Inter Miami", apps: "35", goals: "32" }
    ]
  },
  {
    id: "p3",
    name: "Zlatan Ibrahimovic",
    nationality: "Sweden",
    positions: "Striker",
    birthYear: "1981",
    clues: ["Scored in four different decades", "Famous for acrobatic bicycle goals", "Never won the Champions League"],
    career: [
      { years: "1999\u20132001", club: "Malmo FF", apps: "40", goals: "16" },
      { years: "2001\u20132004", club: "Ajax", apps: "74", goals: "35" },
      { years: "2004\u20132006", club: "Juventus", apps: "70", goals: "23" },
      { years: "2006\u20132009", club: "Inter Milan", apps: "88", goals: "57" },
      { years: "2009\u20132011", club: "Barcelona", apps: "29", goals: "16" },
      { years: "2010\u20132012", club: "AC Milan", apps: "61", goals: "42" },
      { years: "2012\u20132016", club: "Paris Saint-Germain", apps: "122", goals: "113" },
      { years: "2016\u20132018", club: "Manchester United", apps: "33", goals: "17" },
      { years: "2018\u20132019", club: "LA Galaxy", apps: "56", goals: "52" },
      { years: "2020\u20132023", club: "AC Milan", apps: "64", goals: "34" }
    ]
  },
  {
    id: "p4",
    name: "Thierry Henry",
    nationality: "France",
    positions: "Forward / Winger",
    birthYear: "1977",
    clues: ["Arsenal's all-time record goalscorer", "Won 1998 World Cup and Euro 2000", "Premier League Hall of Fame inductee"],
    career: [
      { years: "1994\u20131999", club: "Monaco", apps: "105", goals: "20" },
      { years: "1999", club: "Juventus", apps: "16", goals: "3" },
      { years: "1999\u20132007", club: "Arsenal", apps: "254", goals: "174" },
      { years: "2007\u20132010", club: "Barcelona", apps: "80", goals: "35" },
      { years: "2010\u20132014", club: "New York Red Bulls", apps: "122", goals: "51" },
      { years: "2012", club: "Arsenal (loan)", apps: "4", goals: "1" }
    ]
  },
  {
    id: "p5",
    name: "Eden Hazard",
    nationality: "Belgium",
    positions: "Winger / Attacking Midfielder",
    birthYear: "1991",
    clues: ["Premier League Player of the Season with Chelsea", "Retired in 2023", "Bronze Ball winner at the 2018 World Cup"],
    career: [
      { years: "2007\u20132012", club: "Lille", apps: "147", goals: "36" },
      { years: "2012\u20132019", club: "Chelsea", apps: "245", goals: "85" },
      { years: "2019\u20132023", club: "Real Madrid", apps: "54", goals: "4" }
    ]
  },
  {
    id: "p6",
    name: "Luka Modric",
    nationality: "Croatia",
    positions: "Midfielder",
    birthYear: "1985",
    clues: ["Won Ballon d'Or in 2018", "World Cup Silver / Bronze Medalist", "Won 6 Champions Leagues with Real Madrid"],
    career: [
      { years: "2003\u20132008", club: "Dinamo Zagreb", apps: "94", goals: "26" },
      { years: "2003\u20132004", club: "Zrinjski Mostar (loan)", apps: "22", goals: "8" },
      { years: "2004\u20132005", club: "Inter Zapresic (loan)", apps: "18", goals: "4" },
      { years: "2008\u20132012", club: "Tottenham Hotspur", apps: "127", goals: "13" },
      { years: "2012\u2013", club: "Real Madrid", apps: "359", goals: "28" }
    ]
  },
  {
    id: "p7",
    name: "Erling Haaland",
    nationality: "Norway",
    positions: "Striker",
    birthYear: "2000",
    clues: ["Broke the Premier League single season scoring record", "Won Continental Treble in his debut Man City season", "Known as 'The Terminator'"],
    career: [
      { years: "2016", club: "Bryne 2", apps: "4", goals: "2" },
      { years: "2016\u20132017", club: "Bryne", apps: "16", goals: "0" },
      { years: "2017\u20132018", club: "Molde", apps: "39", goals: "14" },
      { years: "2019\u20132020", club: "Red Bull Salzburg", apps: "16", goals: "17" },
      { years: "2020\u20132022", club: "Borussia Dortmund", apps: "67", goals: "62" },
      { years: "2022\u2013", club: "Manchester City", apps: "66", goals: "63" }
    ]
  },
  {
    id: "p8",
    name: "Harry Kane",
    nationality: "England",
    positions: "Striker",
    birthYear: "1993",
    clues: ["England's all-time record goalscorer", "Tottenham's all-time top scorer", "Won 2018 World Cup Golden Boot"],
    career: [
      { years: "2009\u20132023", club: "Tottenham Hotspur", apps: "317", goals: "213" },
      { years: "2011", club: "Leyton Orient (loan)", apps: "18", goals: "5" },
      { years: "2012", club: "Millwall (loan)", apps: "22", goals: "7" },
      { years: "2012\u20132013", club: "Norwich City (loan)", apps: "3", goals: "0" },
      { years: "2013", club: "Leicester City (loan)", apps: "13", goals: "2" },
      { years: "2023\u2013", club: "Bayern Munich", apps: "34", goals: "36" }
    ]
  },
  {
    id: "p9",
    name: "Zinedine Zidane",
    nationality: "France",
    positions: "Attacking Midfielder",
    birthYear: "1972",
    clues: ["Won Ballon d'Or in 1998", "Famously scored a volley in the 2002 Champions League final", "Sent off in the 2006 World Cup final"],
    career: [
      { years: "1989\u20131992", club: "Cannes", apps: "61", goals: "6" },
      { years: "1992\u20131996", club: "Bordeaux", apps: "139", goals: "28" },
      { years: "1996\u20132001", club: "Juventus", apps: "151", goals: "24" },
      { years: "2001\u20132006", club: "Real Madrid", apps: "155", goals: "37" }
    ]
  },
  {
    id: "p10",
    name: "Ronaldinho",
    nationality: "Brazil",
    positions: "Attacking Midfielder / Winger",
    birthYear: "1980",
    clues: ["Won 2002 World Cup", "2005 Ballon d'Or winner", "Received standing ovation from Real Madrid fans at the Bernabeu"],
    career: [
      { years: "1998\u20132001", club: "Gremio", apps: "52", goals: "21" },
      { years: "2001\u20132003", club: "Paris Saint-Germain", apps: "55", goals: "17" },
      { years: "2003\u20132008", club: "Barcelona", apps: "145", goals: "70" },
      { years: "2008\u20132011", club: "AC Milan", apps: "76", goals: "20" },
      { years: "2011\u20132012", club: "Flamengo", apps: "33", goals: "15" },
      { years: "2012\u20132014", club: "Atletico Mineiro", apps: "48", goals: "16" },
      { years: "2014\u20132015", club: "Quer\xE9taro", apps: "25", goals: "8" },
      { years: "2015", club: "Fluminense", apps: "7", goals: "0" }
    ]
  },
  {
    id: "p11",
    name: "Wayne Rooney",
    nationality: "England",
    positions: "Forward / Midfielder",
    birthYear: "1985",
    clues: ["Manchester United's all-time record goalscorer", "Burst onto the scene with Everton as a 16-year old", "Scored an overhead kick against Man City"],
    career: [
      { years: "2002\u20132004", club: "Everton", apps: "67", goals: "15" },
      { years: "2004\u20132017", club: "Manchester United", apps: "393", goals: "183" },
      { years: "2017\u20132018", club: "Everton", apps: "31", goals: "10" },
      { years: "2018\u20132019", club: "D.C. United", apps: "48", goals: "23" },
      { years: "2020\u20132021", club: "Derby County", apps: "30", goals: "6" }
    ]
  },
  {
    id: "p12",
    name: "Luis Suarez",
    nationality: "Uruguay",
    positions: "Striker",
    birthYear: "1987",
    clues: ["Won European Golden Shoe twice", "Formed the legendary 'MSN' trio", "Controversially blocked a goal with his hands at the 2010 World Cup"],
    career: [
      { years: "2005\u20132006", club: "Nacional", apps: "27", goals: "10" },
      { years: "2006\u20132007", club: "Groningen", apps: "29", goals: "10" },
      { years: "2007\u20132011", club: "Ajax", apps: "110", goals: "81" },
      { years: "2011\u20132014", club: "Liverpool", apps: "110", goals: "69" },
      { years: "2014\u20132020", club: "Barcelona", apps: "191", goals: "147" },
      { years: "2020\u20132022", club: "Atletico Madrid", apps: "67", goals: "32" },
      { years: "2022", club: "Nacional", apps: "14", goals: "8" },
      { years: "2023", club: "Gremio", apps: "33", goals: "17" },
      { years: "2024\u2013", club: "Inter Miami", apps: "20", goals: "16" }
    ]
  },
  {
    id: "p13",
    name: "Robert Lewandowski",
    nationality: "Poland",
    positions: "Striker",
    birthYear: "1988",
    clues: ["Scored five goals in nine minutes as a substitute against Wolfsburg in 2015", "Won the treble with Bayern Munich in 2020", "Undisputed greatest Polish goalscorer in history"],
    career: [
      { years: "2005", club: "Delta Warsaw", apps: "17", goals: "4" },
      { years: "2005\u20132006", club: "Legia Warsaw II", apps: "13", goals: "2" },
      { years: "2006\u20132008", club: "Znicz Pruszk\xF3w", apps: "59", goals: "36" },
      { years: "2008\u20132010", club: "Lech Pozna\u0144", apps: "58", goals: "32" },
      { years: "2010\u20132014", club: "Borussia Dortmund", apps: "131", goals: "74" },
      { years: "2014\u20132022", club: "Bayern Munich", apps: "253", goals: "238" },
      { years: "2022\u2013", club: "Barcelona", apps: "69", goals: "42" }
    ]
  },
  {
    id: "p14",
    name: "Mohamed Salah",
    nationality: "Egypt",
    positions: "Forward / Winger",
    birthYear: "1992",
    clues: ["Holds the Premier League record for most goals scored in a 38-game season (32)", "Crowned African Footballer of the Year twice", "Revered across Egypt and known as 'The Egyptian King'"],
    career: [
      { years: "2010\u20132012", club: "Al Mokawloon Al Arab", apps: "38", goals: "11" },
      { years: "2012\u20132014", club: "Basel", apps: "47", goals: "9" },
      { years: "2014\u20132016", club: "Chelsea", apps: "13", goals: "2" },
      { years: "2015", club: "Fiorentina (loan)", apps: "16", goals: "6" },
      { years: "2015\u20132017", club: "Roma", apps: "65", goals: "29" },
      { years: "2017\u2013", club: "Liverpool", apps: "251", goals: "155" }
    ]
  },
  {
    id: "p15",
    name: "Kylian Mbappe",
    nationality: "France",
    positions: "Forward / Winger",
    birthYear: "1998",
    clues: ["Scored a hat-trick in a World Cup final", "Paris Saint-Germain's all-time record goalscorer", "Burst onto the international scene as a teenager in the 2018 World Cup"],
    career: [
      { years: "2015\u20132016", club: "Monaco B", apps: "12", goals: "4" },
      { years: "2015\u20132017", club: "Monaco", apps: "44", goals: "16" },
      { years: "2017\u20132018", club: "Paris Saint-Germain (loan)", apps: "27", goals: "13" },
      { years: "2018\u20132024", club: "Paris Saint-Germain", apps: "178", goals: "162" },
      { years: "2024\u2013", club: "Real Madrid", apps: "0", goals: "0" }
    ]
  },
  {
    id: "p16",
    name: "Kevin De Bruyne",
    nationality: "Belgium",
    positions: "Playmaker / Midfielder",
    birthYear: "1991",
    clues: ["Recognized for extraordinary passing vision and tactical intellect", "Twice named PFA Players' Player of the Year", "First player to record 100+ Premier League assists in record-breaking speed"],
    career: [
      { years: "2008\u20132012", club: "Genk", apps: "97", goals: "16" },
      { years: "2012\u20132014", club: "Chelsea", apps: "3", goals: "0" },
      { years: "2012\u20132013", club: "Werder Bremen (loan)", apps: "33", goals: "10" },
      { years: "2014\u20132015", club: "VfL Wolfsburg", apps: "51", goals: "13" },
      { years: "2015\u2013", club: "Manchester City", apps: "251", goals: "67" }
    ]
  },
  {
    id: "p17",
    name: "Thierry Henry",
    nationality: "France",
    positions: "Forward / Striker",
    birthYear: "1977",
    clues: ["Arsenal's all-time record goalscorer", "Won the World Cup in 1998 and Euros in 2000", "Won the historic Treble under Pep Guardiola"],
    career: [
      { years: "1994\u20131999", club: "Monaco", apps: "105", goals: "20" },
      { years: "1999", club: "Juventus", apps: "16", goals: "3" },
      { years: "1999\u20132007", club: "Arsenal", apps: "254", goals: "174" },
      { years: "2007\u20132010", club: "Barcelona", apps: "80", goals: "35" },
      { years: "2010\u20132014", club: "New York Red Bulls", apps: "122", goals: "51" },
      { years: "2012", club: "Arsenal (loan)", apps: "4", goals: "1" }
    ]
  },
  {
    id: "p18",
    name: "Luka Modric",
    nationality: "Croatia",
    positions: "Midfielder",
    birthYear: "1985",
    clues: ["Won the Ballon d'Or in 2018", "Led Croatia to a historic World Cup final in 2018", "Won 6 Champions League trophies with Real Madrid"],
    career: [
      { years: "2003\u20132008", club: "Dinamo Zagreb", apps: "94", goals: "26" },
      { years: "2004\u20132005", club: "Inter Zapresic (loan)", apps: "18", goals: "4" },
      { years: "2008\u20132012", club: "Tottenham Hotspur", apps: "127", goals: "13" },
      { years: "2012\u2013", club: "Real Madrid", apps: "359", goals: "28" }
    ]
  },
  {
    id: "p19",
    name: "Karim Benzema",
    nationality: "France",
    positions: "Forward / Striker",
    birthYear: "1987",
    clues: ["Won the Ballon d'Or in 2022", "Real Madrid's second all-time top goalscorer", "Won 5 UEFA Champions League titles"],
    career: [
      { years: "2004\u20132009", club: "Lyon", apps: "112", goals: "43" },
      { years: "2009\u20132023", club: "Real Madrid", apps: "439", goals: "238" },
      { years: "2023\u2013", club: "Al-Ittihad", apps: "21", goals: "9" }
    ]
  },
  {
    id: "p20",
    name: "Eden Hazard",
    nationality: "Belgium",
    positions: "Winger / Attacking Midfielder",
    birthYear: "1991",
    clues: ["Acclaimed Premier League Player of the Season with Chelsea", "Famous for incredible dribbling, quick strides, and close control", "Helped Lille win a historic Ligue 1 double in 2011"],
    career: [
      { years: "2007\u20132012", club: "Lille", apps: "147", goals: "36" },
      { years: "2012\u20132019", club: "Chelsea", apps: "245", goals: "85" },
      { years: "2019\u20132023", club: "Real Madrid", apps: "54", goals: "4" }
    ]
  },
  {
    id: "p21",
    name: "Neymar",
    nationality: "Brazil",
    positions: "Forward / Winger",
    birthYear: "1992",
    clues: ["All-time top scorer for Brazil national team (surpassing Pele)", "Most expensive transfer in football history (\u20AC222M)", "Won the treble with Barcelona in 2015"],
    career: [
      { years: "2009\u20132013", club: "Santos", apps: "102", goals: "54" },
      { years: "2013\u20132017", club: "Barcelona", apps: "123", goals: "68" },
      { years: "2017\u20132023", club: "Paris Saint-Germain", apps: "112", goals: "82" },
      { years: "2023\u2013", club: "Al Hilal", apps: "3", goals: "0" }
    ]
  },
  {
    id: "p22",
    name: "Ronaldinho",
    nationality: "Brazil",
    positions: "Attacking Midfielder / Winger",
    birthYear: "1980",
    clues: ["Won the Ballon d'Or in 2005", "Famous for his incredible flair, tricks, and trademark smile", "Won the World Cup in 2002 and Champions League in 2006"],
    career: [
      { years: "1998\u20132001", club: "Gremio", apps: "52", goals: "21" },
      { years: "2001\u20132003", club: "Paris Saint-Germain", apps: "55", goals: "17" },
      { years: "2003\u20132008", club: "Barcelona", apps: "145", goals: "70" },
      { years: "2008\u20132011", club: "AC Milan", apps: "76", goals: "20" },
      { years: "2011\u20132012", club: "Flamengo", apps: "33", goals: "15" },
      { years: "2012\u20132014", club: "Atletico Mineiro", apps: "47", goals: "16" }
    ]
  }
];
var TTT_MUSIC_CURATED_GRIDS = [
  {
    rows: [
      { type: "Genre", value: "Pop Music" },
      { type: "Genre", value: "Rock / Alternative" },
      { type: "Nationality", value: "United Kingdom" }
    ],
    cols: [
      { type: "Award", value: "Won Grammy Award" },
      { type: "Type", value: "Solo Artist" },
      { type: "Chart", value: "Has Billboard #1 Hit" }
    ]
  },
  {
    rows: [
      { type: "Genre", value: "Hip Hop / R&B" },
      { type: "Genre", value: "Electronic / Dance" },
      { type: "Nationality", value: "United States" }
    ],
    cols: [
      { type: "Award", value: "Won Grammy Award" },
      { type: "Type", value: "Band or Group" },
      { type: "Chart", value: "Has Billboard #1 Hit" }
    ]
  },
  {
    rows: [
      { type: "Genre", value: "Hip Hop / R&B" },
      { type: "Genre", value: "Pop Music" },
      { type: "Nationality", value: "United States" }
    ],
    cols: [
      { type: "Chart", value: "Has Billboard #1 Hit" },
      { type: "Type", value: "Solo Artist" },
      { type: "Award", value: "Won Grammy Award" }
    ]
  },
  {
    rows: [
      { type: "Genre", value: "Rock / Alternative" },
      { type: "Genre", value: "Electronic / Dance" },
      { type: "Nationality", value: "United Kingdom" }
    ],
    cols: [
      { type: "Type", value: "Band or Group" },
      { type: "Chart", value: "Has 1B+ Spotify Streams" },
      { type: "Award", value: "Won Brit Award" }
    ]
  },
  {
    rows: [
      { type: "Genre", value: "Pop Music" },
      { type: "Nationality", value: "Canada" },
      { type: "Nationality", value: "United States" }
    ],
    cols: [
      { type: "Chart", value: "Has Billboard #1 Hit" },
      { type: "Award", value: "Won Grammy Award" },
      { type: "Type", value: "Solo Artist" }
    ]
  },
  {
    rows: [
      { type: "Genre", value: "Rock / Alternative" },
      { type: "Genre", value: "Pop Music" },
      { type: "Nationality", value: "United Kingdom" }
    ],
    cols: [
      { type: "Type", value: "Duo" },
      { type: "Award", value: "Won Grammy Award" },
      { type: "Chart", value: "Has 1B+ Spotify Streams" }
    ]
  }
];
var TENABLE_MUSIC_CURATED_TOPICS = [
  {
    id: "m_t1",
    title: "Top 10 Most Streamed Artists on Spotify of All Time",
    description: "Name 10 of the most-streamed artists globally on the Spotify stream platform.",
    items: [
      "Taylor Swift",
      "The Weeknd",
      "Drake",
      "Bad Bunny",
      "Ed Sheeran",
      "Justin Bieber",
      "Ariana Grande",
      "Eminem",
      "Bruno Mars",
      "Post Malone"
    ]
  },
  {
    id: "m_t2",
    title: "10 Famous Albums That Won Grammy Album of the Year",
    description: "Name 10 legendary studio albums that won the coveted Album of the Year title.",
    items: [
      "Thriller",
      "Rumours",
      "21",
      "1989",
      "25",
      "Random Access Memories",
      "24K Magic",
      "Fearless",
      "Midnights",
      "Sgt Pepper's Lonely Hearts Club Band"
    ]
  },
  {
    id: "m_t3",
    title: "10 Legendary UK Bands Who Conquered the World",
    description: "Name 10 world-renowned bands originating from the United Kingdom.",
    items: [
      "The Beatles",
      "Queen",
      "Pink Floyd",
      "Led Zeppelin",
      "Coldplay",
      "The Rolling Stones",
      "Oasis",
      "The Who",
      "Radiohead",
      "Black Sabbath"
    ]
  },
  {
    id: "m_t4",
    title: "10 Legendary Singer-Songwriters Who Started in Groups",
    description: "Name 10 major solo singers who initially launched their career inside a famous band or group.",
    items: [
      "Michael Jackson",
      "Beyonce",
      "Harry Styles",
      "Justin Timberlake",
      "Paul McCartney",
      "John Lennon",
      "Phil Collins",
      "George Michael",
      "Sting",
      "Robbie Williams"
    ]
  },
  {
    id: "m_t5",
    title: "10 Elite Artists with 10 or More Billboard Hot 100 #1 Hits",
    description: "Name 10 iconic musicians or singers who have reached #1 on the Billboard Hot 100 chart 10 or more times.",
    items: [
      "The Beatles",
      "Mariah Carey",
      "Rihanna",
      "Michael Jackson",
      "Madonna",
      "Taylor Swift",
      "Drake",
      "Stevie Wonder",
      "Janet Jackson",
      "Whitney Houston"
    ]
  },
  {
    id: "m_t6",
    title: "10 Acclaimed Electronic / EDM Musicians / DJs",
    description: "Name 10 world-famous electronic, club, or house music DJs and production artists.",
    items: [
      "Daft Punk",
      "Avicii",
      "Calvin Harris",
      "David Guetta",
      "Armin van Buuren",
      "Tiesto",
      "Skrillex",
      "Kygo",
      "Marshmello",
      "Deadmau5"
    ]
  },
  {
    id: "m_t7",
    title: "10 Legendary Singer-Songwriters of All Time",
    description: "Name 10 of the most acclaimed singer-songwriters with massive catalogs of historic songs.",
    items: [
      "Elton John",
      "Bob Dylan",
      "Paul McCartney",
      "David Bowie",
      "Stevie Wonder",
      "Prince",
      "Bruce Springsteen",
      "John Lennon",
      "Neil Young",
      "Joni Mitchell"
    ]
  },
  {
    id: "m_t8",
    title: "10 Artists Who Have Won 15 or More Grammy Awards",
    description: "Name 10 recording artists or producers with at least 15 career Grammy wins.",
    items: [
      "Georg Solti",
      "Quincy Jones",
      "Beyonce",
      "Pierre Boulez",
      "Stevie Wonder",
      "U2",
      "John Williams",
      "Jay-Z",
      "Kanye West",
      "Aretha Franklin",
      "Taylor Swift"
    ]
  },
  {
    id: "m_t9",
    title: "10 Famous Pop Divas Who Ruled the Billboard Charts",
    description: "Name 10 solo female singers widely celebrated for multiple billboard hits and iconic staging.",
    items: [
      "Madonna",
      "Whitney Houston",
      "Mariah Carey",
      "Celine Dion",
      "Janet Jackson",
      "Britney Spears",
      "Lady Gaga",
      "Beyonce",
      "Rihanna",
      "Taylor Swift",
      "Ariana Grande"
    ]
  },
  {
    id: "m_t10",
    title: "10 Hip Hop Icons with Huge Cultural Impact",
    description: "Name 10 pioneers or chart-destroyers of modern commercial hip-hop.",
    items: [
      "Eminem",
      "Tupac Shakur",
      "The Notorious B.I.G.",
      "Jay-Z",
      "Kanye West",
      "Kendrick Lamar",
      "Snoop Dogg",
      "Lil Wayne",
      "Dr. Dre",
      "Drake"
    ]
  },
  {
    id: "m_t11",
    title: "10 Acclaimed Bands with 5 or More Studio Albums",
    description: "Name 10 famous musical groups with a comprehensive and highly productive discography.",
    items: [
      "The Beatles",
      "The Rolling Stones",
      "Pink Floyd",
      "U2",
      "Queen",
      "Coldplay",
      "Radiohead",
      "Red Hot Chili Peppers",
      "Foo Fighters",
      "Green Day"
    ]
  },
  {
    id: "m_t12",
    title: "10 Iconic Albums with over 30 Million Sales Worldwide",
    description: "Name 10 of the highest-selling physical albums in global recorded music history.",
    items: [
      "Thriller",
      "Back in Black",
      "The Dark Side of the Moon",
      "The Bodyguard",
      "Rumours",
      "Saturday Night Fever",
      "Led Zeppelin IV",
      "Come On Over",
      "Bad",
      "Falling into You"
    ]
  }
];
var CAREER_MUSIC_CURATED_PLAYERS = [
  {
    id: "m_p1",
    name: "The Beatles",
    nationality: "United Kingdom",
    positions: "Rock / Pop Band",
    birthYear: "1960",
    clues: ["Hailed from Liverpool, England", "Led the British Invasion of the US in 1964", "Released 'Abbey Road' and 'Sgt. Pepper'"],
    career: [
      { years: "1960\u20131962", club: "The Hamburg Residency Years", apps: "Indie Club Circuit", goals: "First Studio Audio Recordings" },
      { years: "1962", club: "Signed to Parlophone (EMI Records)", apps: "Love Me Do", goals: "UK Debut Top Hit" },
      { years: "1963", club: "Please Please Me & With The Beatles Albums", apps: "Beatlemania Ignites", goals: "Prepping for USA" },
      { years: "1964\u20131966", club: "World Tours & Massive Stadium Concerts", apps: "Ed Sullivan Show", goals: "Absolute Global Superstars" },
      { years: "1967", club: "Sgt. Pepper's & Summer of Love", apps: "Psychedelic Era", goals: "Recording Masterpieces" },
      { years: "1969\u20131970", club: "Abbey Road & Let It Be", apps: "Final Rooftop Show", goals: "Official Group Breakup" }
    ]
  },
  {
    id: "m_p2",
    name: "Taylor Swift",
    nationality: "United States",
    positions: "Pop / Country Singer-Songwriter",
    birthYear: "1989",
    clues: ["Holds the record for most Grammy Album of the Year wins by an artist (4)", "Her monumental stadium performance was turned into the highest-grossing concert film", "Famous for her highly-dedicated fan base called 'Swifties'"],
    career: [
      { years: "2006", club: "Debut Album (Taylor Swift)", apps: "Nashville Country Scene", goals: "First Country Gold" },
      { years: "2008", club: "Fearless", apps: "Love Story & You Belong With Me", goals: "First Album of the Year Grammy" },
      { years: "2012", club: "Red", apps: "Transitioning to Pop", goals: "First Billboard #1 Single" },
      { years: "2014", club: "1989", apps: "Full Pop Superstardom", goals: "Grammy Album of the Year (Second)" },
      { years: "2020", club: "Folklore & Evermore (Indie Folk)", apps: "Surprise Pandemic Releases", goals: "Grammy Album of the Year (Third)" },
      { years: "2022\u20132024", club: "Midnights & The Eras Tour", apps: "Historic Concert Tour", goals: "Grammy Album of the Year (Fourth)" }
    ]
  },
  {
    id: "m_p3",
    name: "Daft Punk",
    nationality: "France",
    positions: "Electronic Music Duo",
    birthYear: "1993",
    clues: ["Famous French electronic duo who wore metallic robotic helmets", "Won Grammy Album of the Year in 2014 with Random Access Memories", "Collaborated with The Weeknd, Kanye West, and Pharrell Williams"],
    career: [
      { years: "1997", club: "Homework", apps: "Da Funk, Around the World", goals: "French House Icon" },
      { years: "2001", club: "Discovery", apps: "One More Time, Harder Better Faster", goals: "Anime Film Collaboration" },
      { years: "2005", club: "Human After All", apps: "Robot Rock", goals: "Technologic Breakthrough" },
      { years: "2010", club: "Tron: Legacy Soundtrack", apps: "Orchestral Synth Score", goals: "Disney Collaboration" },
      { years: "2013\u20132014", club: "Random Access Memories", apps: "Get Lucky, Lose Yourself", goals: "Multiple Grammys & Best Album" },
      { years: "2021", club: "Epilogue Video Release", apps: "Duo Breakup Tribute", goals: "Official Retirement" }
    ]
  },
  {
    id: "m_p4",
    name: "Queen",
    nationality: "United Kingdom",
    positions: "Bombastic Arena-Rock Band",
    birthYear: "1970",
    clues: ["Fronted by the legendary powerhouse vocalist Freddie Mercury", "Famous for anthems like 'We Will Rock You' and 'Bohemian Rhapsody'", "Delivered a revered 21-minute set at Live Aid 1985"],
    career: [
      { years: "1973\u20131974", club: "Early Albums (Queen I & II)", apps: "Heavy/Prog Rock Intro", goals: "Killer Queen UK Debut Hit" },
      { years: "1975", club: "A Night at the Opera", apps: "Bohemian Rhapsody", goals: "Global Masterpiece" },
      { years: "1977", club: "News of the World", apps: "We Are the Champions", goals: "Stadium Sports Anthems" },
      { years: "1980", club: "The Game", apps: "Another One Bites the Dust", goals: "Synthesizer & Funk Fusion" },
      { years: "1985", club: "Live Aid Concert", apps: "Wembley Stadium performance", goals: "Crown Best Live Set Ever" },
      { years: "1991", club: "Innuendo & Tribute Concert", apps: "Passings and Memorials", goals: "Freddie Mercury Legacy" }
    ]
  },
  {
    id: "m_p5",
    name: "Michael Jackson",
    nationality: "United States",
    positions: "Pop Solo Artist",
    birthYear: "1958",
    clues: ["Known worldwide as the 'King of Pop'", "His 1982 album Thriller remains the best-selling album of all time", "Pioneered iconic dance moves like the Moonwalk and the anti-gravity lean"],
    career: [
      { years: "1964\u20131975", club: "The Jackson 5 (Motown)", apps: "I Want You Back, ABC", goals: "Childhood Pop Icon" },
      { years: "1979", club: "Off the Wall", apps: "Don't Stop 'Til You Get Enough", goals: "Adult Solo Breakthrough" },
      { years: "1982", club: "Thriller", apps: "Billie Jean, Beat It", goals: "Highest Selling Album Ever" },
      { years: "1987", club: "Bad", apps: "Smooth Criminal, Bad", goals: "Five Consecutive Billboard Hot 100 #1 Hits" },
      { years: "1991", club: "Dangerous", apps: "Black or White", goals: "New Jack Swing Era" },
      { years: "2009", club: "This Is It Concert Series", apps: "Pre-Show Rehearsals", goals: "Posthumous Concert Legacy" }
    ]
  },
  {
    id: "m_p6",
    name: "Ed Sheeran",
    nationality: "United Kingdom",
    positions: "Pop / Folk Solo Artist",
    birthYear: "1991",
    clues: ["Famous for performing solo with just an acoustic guitar and a loop pedal", "His math-themed albums (+, x, \xF7, =, -) are record-breaking worldwide successes", "His hit 'Shape of You' became one of the most-streamed songs on Spotify history"],
    career: [
      { years: "2011", club: "+ (Plus) Debut Album", apps: "The A Team", goals: "UK Breakthrough Folk Sensation" },
      { years: "2014", club: "x (Multiply)", apps: "Thinking Out Loud & Sing", goals: "Global Superstardom & Grammy Wins" },
      { years: "2017", club: "\xF7 (Divide) & Shape of You", apps: "Shape of You / Perfect", goals: "Record-Breaking Billboard Runs" },
      { years: "2019", club: "No.6 Collaborations Project", apps: "Justin Bieber & Travis Scott features", goals: "Collaborative Pop Hits" },
      { years: "2021\u20132023", club: "= (Equals) & - (Subtract)", apps: "Bad Habits / Eyes Closed", goals: "Stadium Tour Dominance" }
    ]
  },
  {
    id: "m_p7",
    name: "Eminem",
    nationality: "United States",
    positions: "Hip Hop Legends / Rapper",
    birthYear: "1972",
    clues: ["Revered as 'Slim Shady' and one of the best-selling solo artists ever", "Won the Academy Award for Best Original Song with 'Lose Yourself' in '8 Mile'", "First artist to win Best Rap Album Grammy for three consecutive records"],
    career: [
      { years: "1999", club: "The Slim Shady LP", apps: "My Name Is (Debut Single)", goals: "Mainstream Breakthrough & Controversy" },
      { years: "2000", club: "The Marshall Mathers LP", apps: "The Real Slim Shady & Stan", goals: "Fastest-Selling Solo Album In History" },
      { years: "2002", club: "The Eminem Show & 8 Mile Film", apps: "Lose Yourself & Without Me", goals: "Double Oscar & Grammy Triumph" },
      { years: "2010", club: "Recovery", apps: "Love the Way You Lie (feat. Rihanna)", goals: "Chart-Topping Comeback Epic" },
      { years: "2020\u20132024", club: "Music to Be Murdered By & Death of Slim Shady", apps: "Godzilla / Houdini", goals: "Multi-Decade Chart Longevity" }
    ]
  },
  {
    id: "m_p8",
    name: "Coldplay",
    nationality: "United Kingdom",
    positions: "Alternative Pop-Rock Band",
    birthYear: "1996",
    clues: ["Fronted by Chris Martin, famous for highly colorful, neon stadium shows", "Won Grammy Song of the Year for the violin-led anthem 'Viva la Vida'", "Known for iconic early 2000s melancholic hits like 'Yellow' and 'The Scientist'"],
    career: [
      { years: "2000", club: "Parachutes", apps: "Yellow (Breakthrough Single)", goals: "Alternative Indie Darling" },
      { years: "2002", club: "A Rush of Blood to the Head", apps: "Clocks / The Scientist", goals: "Global Stadium Sensation" },
      { years: "2005", club: "X&Y", apps: "Fix You & Speed of Sound", goals: "UK/US Album Charts #1" },
      { years: "2008", club: "Viva la Vida or Death and All His Friends", apps: "Viva la Vida (Chamber Pop)", goals: "Grammy Song & Album of the Year" },
      { years: "2015\u20132021", club: "A Head Full of Dreams & Music of the Spheres", apps: "Adventure of a Lifetime / My Universe with BTS", goals: "Highest-Grossing Pop-Rock Tour Ever" }
    ]
  },
  {
    id: "m_p9",
    name: "Beyonce",
    nationality: "United States",
    positions: "R&B / Pop Icon",
    birthYear: "1981",
    clues: ["Highest-awarded individual at the Grammy Awards with 32 wins", "Gained fame in the late 1990s as the lead singer of Destiny's Child", "Released critical video concept albums Lemonade and Renaissance"],
    career: [
      { years: "1997\u20132003", club: "Destiny's Child Group", apps: "Say My Name / Survivor", goals: "R&B Band Masterpiece" },
      { years: "2003", club: "Dangerously in Love (Solo)", apps: "Crazy in Love / Baby Boy", goals: "Double Billboard #1 Debut" },
      { years: "2008", club: "I Am... Sasha Fierce", apps: "Single Ladies / Halo", goals: "Grammy Song of the Year Match" },
      { years: "2013", club: "BEYONCE (Self-Titled Album)", apps: "Drunk in Love (Surprise Release)", goals: "Changed Digital Album Conventions" },
      { years: "2016\u20132024", club: "Lemonade & Cowboy Carter (Country)", apps: "Formation / Texas Hold 'Em", goals: "First Black Woman with Country #1 Hit" }
    ]
  },
  {
    id: "m_p10",
    name: "Rihanna",
    nationality: "Barbados",
    positions: "R&B / Dance-Pop Artist",
    birthYear: "1988",
    clues: ["Famous Barbadian singer who performed a record-breaking solo Super Bowl Halftime show", "Has 14 Billboard Hot 100 #1 singles (behind only Beatles & Mariah)", "Founded the highly successful global cosmetics empire Fenty Beauty"],
    career: [
      { years: "2005", club: "Music of the Sun", apps: "Pon de Replay", goals: "Dancehall Sensation" },
      { years: "2007", club: "Good Girl Gone Bad", apps: "Umbrella (feat. Jay-Z) / Don't Stop the Music", goals: "First Grammy Win & Global Icon status" },
      { years: "2010\u20132011", club: "Loud & Talk That Talk Albums", apps: "Only Girl in the World / We Found Love", goals: "Unrivaled Club Pop Dominance" },
      { years: "2016", club: "Anti Album", apps: "Work / Needed Me", goals: "Critical Acclaim R&B Masterpiece" },
      { years: "2018\u2013", club: "Fenty Brand focus & Super Bowl 2023", apps: "Lift Me Up (Black Panther)", goals: "Billionaire Fashion and Music Icon" }
    ]
  }
];
var TTT_MOVIES_CURATED_GRIDS = [
  {
    rows: [
      { type: "Genre", value: "Sci-Fi / Fantasy" },
      { type: "Genre", value: "Drama" },
      { type: "Franchise / Studio", value: "Warner Bros." }
    ],
    cols: [
      { type: "Award", value: "Won Academy Award (Oscar)" },
      { type: "Director", value: "Directed by Christopher Nolan" },
      { type: "Director", value: "Directed by Steven Spielberg" }
    ]
  },
  {
    rows: [
      { type: "Genre", value: "Action / Adventure" },
      { type: "Genre", value: "Crime / Thriller" },
      { type: "Franchise / Studio", value: "Marvel Cinematic Universe" }
    ],
    cols: [
      { type: "Award", value: "Won Academy Award (Oscar)" },
      { type: "Stat", value: "Grossed Over $1 Billion" },
      { type: "Origin", value: "United States" }
    ]
  },
  {
    rows: [
      { type: "Genre", value: "Sci-Fi / Fantasy" },
      { type: "Genre", value: "Action / Adventure" },
      { type: "Genre", value: "Comedy" }
    ],
    cols: [
      { type: "Director", value: "Directed by Steven Spielberg" },
      { type: "Stat", value: "Grossed Over $1 Billion" },
      { type: "Award", value: "Won Academy Award (Oscar)" }
    ]
  },
  {
    rows: [
      { type: "Genre", value: "Drama" },
      { type: "Franchise / Studio", value: "Marvel Cinematic Universe" },
      { type: "Genre", value: "Horror" }
    ],
    cols: [
      { type: "Award", value: "Won Academy Award (Oscar)" },
      { type: "Director", value: "Directed by Christopher Nolan" },
      { type: "Stat", value: "Starred Leonardo DiCaprio" }
    ]
  },
  {
    rows: [
      { type: "Genre", value: "Drama" },
      { type: "Genre", value: "Crime / Thriller" },
      { type: "Director", value: "Directed by Martin Scorsese" }
    ],
    cols: [
      { type: "Award", value: "Won Academy Award (Oscar)" },
      { type: "Stat", value: "Grossed Over $1 Billion" },
      { type: "Origin", value: "United States" }
    ]
  },
  {
    rows: [
      { type: "Genre", value: "Sci-Fi / Fantasy" },
      { type: "Genre", value: "Action / Adventure" },
      { type: "Director", value: "Directed by James Cameron" }
    ],
    cols: [
      { type: "Stat", value: "Grossed Over $1 Billion" },
      { type: "Award", value: "Won Academy Award (Oscar)" },
      { type: "Origin", value: "United States" }
    ]
  }
];
var TENABLE_MOVIES_CURATED_TOPICS = [
  {
    id: "f_t1",
    title: "Top 10 Highest Grossing Movies of All Time",
    description: "Name 10 of the highest earning movies at the worldwide box office (unadjusted for inflation).",
    items: [
      "Avatar",
      "Avengers: Endgame",
      "Avatar: The Way of Water",
      "Titanic",
      "Star Wars: The Force Awakens",
      "Avengers: Infinity War",
      "Spider-Man: No Way Home",
      "Jurassic World",
      "The Lion King",
      "The Avengers"
    ]
  },
  {
    id: "f_t2",
    title: "10 Iconic Christopher Nolan Movie Directorials",
    description: "Name 10 of the mind-bending feature films directed by British filmmaker Christopher Nolan.",
    items: [
      "Memento",
      "Batman Begins",
      "The Prestige",
      "The Dark Knight",
      "Inception",
      "The Dark Knight Rises",
      "Interstellar",
      "Dunkirk",
      "Tenet",
      "Oppenheimer"
    ]
  },
  {
    id: "f_t3",
    title: "10 Iconic Steven Spielberg Blockbusters",
    description: "Name 10 hit adventure or action films directed by Steven Spielberg.",
    items: [
      "Jaws",
      "E.T.",
      "Jurassic Park",
      "Raiders of the Lost Ark",
      "Saving Private Ryan",
      "Schindler's List",
      "Close Encounters of the Third Kind",
      "Catch Me If You Can",
      "Minority Report",
      "Hook"
    ]
  },
  {
    id: "f_t4",
    title: "10 Celebrated Actors Who Won a Lead Oscar in the 21st Century",
    description: "Name 10 actors who won the Academy Award for Best Actor or Best Actress since the year 2000.",
    items: [
      "Joaquin Phoenix",
      "Leonardo DiCaprio",
      "Tom Hanks",
      "Daniel Day-Lewis",
      "Matthew McConaughey",
      "Cillian Murphy",
      "Christian Bale",
      "Russell Crowe",
      "Anthony Hopkins",
      "Rami Malek"
    ]
  },
  {
    id: "f_t5",
    title: "10 Highly Successful Movie Franchises & Cinematic Universes",
    description: "Name 10 highly successful commercial movie franchises or shared universes.",
    items: [
      "Marvel Cinematic Universe",
      "Star Wars",
      "Harry Potter",
      "Spider-Man",
      "James Bond",
      "Middle-earth",
      "Fast and Furious",
      "DC Extended Universe",
      "Jurassic Park",
      "Batman"
    ]
  },
  {
    id: "f_t6",
    title: "10 Famous Movies Directed by Martin Scorsese",
    description: "Name 10 highly celebrated and gritty feature films directed by Martin Scorsese.",
    items: [
      "Taxi Driver",
      "Raging Bull",
      "Goodfellas",
      "Casino",
      "The Departed",
      "The Wolf of Wall Street",
      "Shutter Island",
      "Gangs of New York",
      "Killers of the Flower Moon",
      "The Aviator"
    ]
  },
  {
    id: "f_t7",
    title: "10 Blockbuster Movies Directed by James Cameron",
    description: "Name 10 massive sci-fi or disaster spectacle feature films directed by James Cameron.",
    items: [
      "Avatar",
      "Titanic",
      "Avatar: The Way of Water",
      "The Terminator",
      "Terminator 2: Judgment Day",
      "Aliens",
      "The Abyss",
      "True Lies",
      "Piranha II",
      "Strange Days"
    ]
  },
  {
    id: "f_t8",
    title: "10 Highly-Acclaimed Marvel Cinematic Universe Films",
    description: "Name 10 of the best-received superhero blockbusters inside the MCU.",
    items: [
      "Iron Man",
      "The Avengers",
      "Captain America: The Winter Soldier",
      "Guardians of the Galaxy",
      "Captain America: Civil War",
      "Black Panther",
      "Avengers: Infinity War",
      "Avengers: Endgame",
      "Spider-Man: No Way Home",
      "Iron Man 3"
    ]
  },
  {
    id: "f_t9",
    title: "10 Cinematic Masterpieces Directed by Quentin Tarantino",
    description: "Name 10 highly stylized, dialog-rich indie films written and directed by Quentin Tarantino.",
    items: [
      "Reservoir Dogs",
      "Pulp Fiction",
      "Jackie Brown",
      "Kill Bill: Volume 1",
      "Kill Bill: Volume 2",
      "Death Proof",
      "Inglourious Basterds",
      "Django Unchained",
      "The Hateful Eight",
      "Once Upon a Time in Hollywood"
    ]
  },
  {
    id: "f_t10",
    title: "10 Iconic Actors Who Played Batman in Cinema",
    description: "Name 10 actors who have physically or vocally portrayed the Caped Crusader in major movies.",
    items: [
      "Adam West",
      "Michael Keaton",
      "Val Kilmer",
      "George Clooney",
      "Christian Bale",
      "Ben Affleck",
      "Robert Pattinson",
      "Will Arnett",
      "Kevin Conroy",
      "Diedrich Bader"
    ]
  },
  {
    id: "f_t11",
    title: "10 Highest-Grossing Animation Movies of All Time",
    description: "Name 10 of the highest earning animated feature films at the global box office.",
    items: [
      "The Lion King",
      "Frozen II",
      "The Super Mario Bros. Movie",
      "Frozen",
      "Incredibles 2",
      "Minions",
      "Toy Story 4",
      "Toy Story 3",
      "Despicable Me 3",
      "Finding Dory"
    ]
  },
  {
    id: "f_t12",
    title: "10 Highly Successful Sci-Fi Movies Released after 2000",
    description: "Name 10 futuristic or space-themed sci-fi box office triumphs released in the 21st century.",
    items: [
      "Avatar",
      "Avatar: The Way of Water",
      "Inception",
      "Interstellar",
      "The Matrix Reloaded",
      "Gravity",
      "The Martian",
      "Dune: Part Two",
      "Dune",
      "Arrival"
    ]
  }
];
var CAREER_MOVIES_CURATED_PLAYERS = [
  {
    id: "f_p1",
    name: "Leonardo DiCaprio",
    nationality: "United States",
    positions: "Hollywood Lead Actor",
    birthYear: "1974",
    clues: ["Won his first Best Actor Oscar after fighting a bear in 'The Revenant'", "Frequently collaborates with legendary director Martin Scorsese", "Starred in the 1997 disaster-romance that became the first film to reach $1B box office"],
    career: [
      { years: "1993", club: "What's Eating Gilbert Grape", apps: "Arnie Grape (Co-Star)", goals: "First Oscar Nomination" },
      { years: "1996", club: "Romeo + Juliet", apps: "Romeo Montague", goals: "Modern Shakespeare Success" },
      { years: "1997", club: "Titanic", apps: "Jack Dawson (Lead)", goals: "Global Superstardom" },
      { years: "2002", club: "Catch Me If You Can & Gangs of NY", apps: "Frank Abagnale Jr.", goals: "Scorsese Partnership Starts" },
      { years: "2010", club: "Inception & Shutter Island", apps: "Dom Cobb / Teddy Daniels", goals: "Mindbending Masterpieces" },
      { years: "2013", club: "The Wolf of Wall Street", apps: "Jordan Belfort (Lead)", goals: "Meme Gold & Oscar Nominee" },
      { years: "2015", club: "The Revenant", apps: "Hugh Glass (Survivalist)", goals: "Won Best Actor Oscar" }
    ]
  },
  {
    id: "f_p2",
    name: "Tom Hanks",
    nationality: "United States",
    positions: "Legendary Leading Actor",
    birthYear: "1956",
    clues: ["Won back-to-back Best Actor Oscars in 1993 and 1994", "Voiced the iconic sheriff cowboy Woody in 'Toy Story'", "Stranded on a desert island with a volleyball named Wilson"],
    career: [
      { years: "1988", club: "Big", apps: "Josh Baskin (Young Boy)", goals: "First Academy Award Nomination" },
      { years: "1993", club: "Philadelphia", apps: "Andrew Beckett (Attorney)", goals: "First Best Actor Oscar" },
      { years: "1994", club: "Forrest Gump", apps: "Forrest Gump (Title Role)", goals: "Second Consecutive Best Actor Oscar" },
      { years: "1995", club: "Toy Story & Apollo 13", apps: "Sheriff Woody (Voice Lead)", goals: "Iconic Childhood Role" },
      { years: "1998", club: "Saving Private Ryan", apps: "Captain John Miller", goals: "D-Day Military Epic" },
      { years: "2000", club: "Cast Away", apps: "Chuck Noland (FedEx)", goals: "Volleyball Co-Star Wilson" }
    ]
  },
  {
    id: "f_p3",
    name: "Meryl Streep",
    nationality: "United States",
    positions: "Oscar-Winning Leading Actress",
    birthYear: "1949",
    clues: ["Holds the record for the most Academy Award acting nominations in history (21 nominations)", "Played the terrifying fashion editor-in-chief in The Devil Wears Prada", "Won an Oscar for playing UK Prime Minister Margaret Thatcher in The Iron Lady"],
    career: [
      { years: "1978", club: "The Deer Hunter", apps: "Linda", goals: "First Oscar Nomination" },
      { years: "1979", club: "Kramer vs. Kramer", apps: "Joanna Kramer", goals: "Won Supporting Actress Oscar" },
      { years: "1982", club: "Sophie's Choice", apps: "Zofia Zawistowski", goals: "Won Best Actress Oscar" },
      { years: "2006", club: "The Devil Wears Prada", apps: "Miranda Priestly", goals: "Iconic Fashion Villain" },
      { years: "2008", club: "Mamma Mia!", apps: "Donna Sheridan", goals: "Musical Comedy Blockbuster" },
      { years: "2011", club: "The Iron Lady", apps: "Margaret Thatcher", goals: "Third Academy Award Win" }
    ]
  },
  {
    id: "f_p4",
    name: "Christopher Nolan",
    nationality: "United Kingdom",
    positions: "Visionary Film Director",
    birthYear: "1970",
    clues: ["Visionary director known for mind-bending narrative structures and advocating IMAX", "Finally won Best Director and Best Picture Oscars for his 2023 biographical epic Oppenheimer", "Directed the highly acclaimed Dark Knight Batman Trilogy"],
    career: [
      { years: "2000", club: "Memento", apps: "Director & Writer", goals: "Reverse-Chronological Indie Success" },
      { years: "2005", club: "Batman Begins", apps: "Director / Rebooter", goals: "Revived Batman Franchise" },
      { years: "2008", club: "The Dark Knight", apps: "Director & Co-Writer", goals: "First Superhero Film to Reach $1B" },
      { years: "2010", club: "Inception", apps: "Director & Creator", goals: "Dream Thief Sci-Fi Masterpiece" },
      { years: "2014", club: "Interstellar", apps: "Director / Space Explorer", goals: "Scientific Accuracy & Black Holes" },
      { years: "2023", club: "Oppenheimer", apps: "Director & Producer", goals: "Won Best Director & Best Picture Oscars" }
    ]
  },
  {
    id: "f_p5",
    name: "Steven Spielberg",
    nationality: "United States",
    positions: "Master Film Director",
    birthYear: "1946",
    clues: ["Co-founded DreamWorks Studios and popularized the Hollywood summer blockbuster", "Won Best Director Oscars for Schindler's List and Saving Private Ryan", "Directed landmark films: Jaws, Jurassic Park, and E.T. the Extra-Terrestrial"],
    career: [
      { years: "1975", club: "Jaws", apps: "Director", goals: "Invented the Modern Summer Blockbuster" },
      { years: "1982", club: "E.T. the Extra-Terrestrial", apps: "Director", goals: "Beloved Childhood Sci-Fi Classic" },
      { years: "1993", club: "Jurassic Park & Schindler's List", apps: "Director & Producer", goals: "Highest Grosser & Best Director Oscar Wins" },
      { years: "1998", club: "Saving Private Ryan", apps: "Director & Producer", goals: "Iconic Normandy Beach Landing & 2nd Best Director Win" },
      { years: "2012", club: "Lincoln", apps: "Director", goals: "Historical Drama & Best Actor Daniel Day-Lewis Win" }
    ]
  },
  {
    id: "f_p6",
    name: "Quentin Tarantino",
    nationality: "United States",
    positions: "Indie Dialogue Director",
    birthYear: "1963",
    clues: ["Famous for stylized dialogue, nonlinear stories, and intense cinematic violence", "Won two Academy Awards for Best Original Screenplay with Pulp Fiction and Django Unchained", "Created the iconic yellow-tracksuit clad revenge epic Kill Bill"],
    career: [
      { years: "1992", club: "Reservoir Dogs", apps: "Director / Writer", goals: "Independent Crime Sensation Debut" },
      { years: "1994", club: "Pulp Fiction", apps: "Director / Writer", goals: "Palme d'Or Winner & Original Screenplay Oscar" },
      { years: "2003\u20132004", club: "Kill Bill: Vol 1 & 2", apps: "Director", goals: "Double Martial Arts Revenge Epic" },
      { years: "2009", club: "Inglourious Basterds", apps: "Director / Writer", goals: "Satirical Alternative WWII Masterpiece" },
      { years: "2012", club: "Django Unchained", apps: "Director / Writer", goals: "2nd Best Original Screenplay Oscar Success" }
    ]
  },
  {
    id: "f_p7",
    name: "Scarlett Johansson",
    nationality: "United States",
    positions: "Hollywood Leading Actress",
    birthYear: "1984",
    clues: ["World's highest-paid actress in 2018 and 2019", "Played the lethal Avenger Natasha Romanoff (Black Widow) in the MCU", "Earned double Academy Award acting nominations in the same year (2020)"],
    career: [
      { years: "2003", club: "Lost in Translation", apps: "Charlotte", goals: "BAFTA Award for Best Actress in Leading Role" },
      { years: "2010", club: "Iron Man 2", apps: "Natasha Romanoff (Black Widow)", goals: "MCU Superhero Debut" },
      { years: "2012", club: "The Avengers", apps: "Natasha Romanoff", goals: "Major Franchise Milestone" },
      { years: "2019", club: "Marriage Story & Jojo Rabbit", apps: "Nicole Barber / Rosie Betzler", goals: "Double Oscar Actor Nominations" },
      { years: "2021", club: "Black Widow", apps: "Black Widow (Lead)", goals: "Solo Marvel Feature Film" }
    ]
  },
  {
    id: "f_p8",
    name: "Cillian Murphy",
    nationality: "Ireland",
    positions: "Oscar-Winning Leading Actor",
    birthYear: "1976",
    clues: ["Won his first Best Actor Academy Award in 2024 for playing J. Robert Oppenheimer", "Famous for starring as gang boss Tommy Shelby in Peaky Blinders", "Frequently featured in Christopher Nolan's films like Inception and the Batman trilogy"],
    career: [
      { years: "2002", club: "28 Days Later", apps: "Jim (Survivor)", goals: "Mainstream Horror Breakthrough" },
      { years: "2005", club: "Batman Begins", apps: "Dr. Jonathan Crane (Scarecrow)", goals: "Iconic Supervillain Debut" },
      { years: "2010", club: "Inception", apps: "Robert Fischer", goals: "Sci-Fi Mind Theft Heist Hit" },
      { years: "2013\u20132022", club: "Peaky Blinders Television", apps: "Thomas Shelby (Lead Actor)", goals: "Worldwide Pop Culture Phenomenon" },
      { years: "2023", club: "Oppenheimer", apps: "J. Robert Oppenheimer (Lead)", goals: "Academy Award for Best Actor in a Leading Role" }
    ]
  },
  {
    id: "f_p9",
    name: "Brad Pitt",
    nationality: "United States",
    positions: "Famous Leading Actor & Producer",
    birthYear: "1963",
    clues: ["Won his first acting Oscar for playing stuntman Cliff Booth in Once Upon a Time in Hollywood", "Co-founded Plan B Entertainment, producing Best Picture winners like 12 Years a Slave", "Played Soapmaker Tyler Durden in cult classic Fight Club"],
    career: [
      { years: "1991", club: "Thelma & Louise", apps: "J.D. (Hitchhiker)", goals: "Mainstream Sex Symbol Breakthrough" },
      { years: "1995", club: "Seven & 12 Monkeys", apps: "Detective David Mills / Jeffrey Goines", goals: "First Academy Award Actor Nomination" },
      { years: "1999", club: "Fight Club", apps: "Tyler Durden", goals: "Cult Classic Sensation" },
      { years: "2011", club: "Moneyball", apps: "Billy Beane", goals: "Double Actor & Producer Oscar Nominee" },
      { years: "2019", club: "Once Upon a Time in Hollywood", apps: "Cliff Booth (Stuntman)", goals: "Won Best Supporting Actor Oscar" }
    ]
  }
];
app.post("/api/tic-tac-toe/create", async (req, res) => {
  const { solvable } = req.body;
  const theme = req.body.theme || "football";
  const ai = getGemini();
  if (solvable) {
    if (theme === "music") {
      const idx = Math.floor(Math.random() * TTT_MUSIC_CURATED_GRIDS.length);
      const selected = TTT_MUSIC_CURATED_GRIDS[idx];
      return res.json({
        rows: selected.rows,
        cols: selected.cols,
        solvable: true,
        id: `music-curated-${idx}`
      });
    } else if (theme === "movies") {
      const idx = Math.floor(Math.random() * TTT_MOVIES_CURATED_GRIDS.length);
      const selected = TTT_MOVIES_CURATED_GRIDS[idx];
      return res.json({
        rows: selected.rows,
        cols: selected.cols,
        solvable: true,
        id: `movies-curated-${idx}`
      });
    } else {
      const idx = Math.floor(Math.random() * TTT_CURATED_GRIDS.length);
      const selected = TTT_CURATED_GRIDS[idx];
      return res.json({
        rows: selected.rows,
        cols: selected.cols,
        solvable: true,
        id: `curated-${idx}`
      });
    }
  }
  if (!ai) {
    if (theme === "music") {
      const rTypes = ["Genre", "Nationality", "Award", "Type", "Chart"];
      const rGenres = ["Pop Music", "Rock / Alternative", "Hip Hop / R&B", "Electronic / Dance", "Country", "Jazz / Soul"];
      const rNationalities = ["United Kingdom", "United States", "Canada", "France", "Sweden", "Australia", "Colombia"];
      const rAwards = ["Won Grammy Award", "Won Brit Award", "Won MTV VMA"];
      const rTypesOfArtist = ["Solo Artist", "Duo", "Band or Group"];
      const rCharts = ["Has Billboard #1 Hit", "Has 1B+ Spotify Streams", "Has UK #1 Hit"];
      const getCriteria = () => {
        const type = rTypes[Math.floor(Math.random() * rTypes.length)];
        let value = "";
        if (type === "Genre") value = rGenres[Math.floor(Math.random() * rGenres.length)];
        else if (type === "Nationality") value = rNationalities[Math.floor(Math.random() * rNationalities.length)];
        else if (type === "Award") value = rAwards[Math.floor(Math.random() * rAwards.length)];
        else if (type === "Type") value = rTypesOfArtist[Math.floor(Math.random() * rTypesOfArtist.length)];
        else value = rCharts[Math.floor(Math.random() * rCharts.length)];
        return { type, value };
      };
      return res.json({ rows: [getCriteria(), getCriteria(), getCriteria()], cols: [getCriteria(), getCriteria(), getCriteria()], solvable: false });
    } else if (theme === "movies") {
      const rTypes = ["Genre", "Director", "Award", "Franchise / Studio", "Stat"];
      const rGenres = ["Sci-Fi / Fantasy", "Drama", "Action / Adventure", "Comedy", "Horror", "Romance"];
      const rDirectors = ["Directed by Christopher Nolan", "Directed by Steven Spielberg", "Directed by Martin Scorsese", "Directed by Quentin Tarantino", "Directed by James Cameron"];
      const rAwards = ["Won Academy Award (Oscar)", "Won Golden Globe", "Won BAFTA Winner"];
      const rStudios = ["Warner Bros.", "Marvel Cinematic Universe", "Walt Disney Pictures", "Universal Pictures", "Sony Pictures"];
      const rStats = ["Grossed Over $1 Billion", "90%+ Rotten Tomatoes", "Starred Leonardo DiCaprio", "Starred Tom Hanks"];
      const getCriteria = () => {
        const type = rTypes[Math.floor(Math.random() * rTypes.length)];
        let value = "";
        if (type === "Genre") value = rGenres[Math.floor(Math.random() * rGenres.length)];
        else if (type === "Director") value = rDirectors[Math.floor(Math.random() * rDirectors.length)];
        else if (type === "Award") value = rAwards[Math.floor(Math.random() * rAwards.length)];
        else if (type === "Franchise / Studio") value = rStudios[Math.floor(Math.random() * rStudios.length)];
        else value = rStats[Math.floor(Math.random() * rStats.length)];
        return { type, value };
      };
      return res.json({ rows: [getCriteria(), getCriteria(), getCriteria()], cols: [getCriteria(), getCriteria(), getCriteria()], solvable: false });
    } else {
      const rTypes = ["Club", "Club", "Nationality", "Trophy", "Manager", "League", "Partner"];
      const rClubs = ["Real Madrid", "Barcelona", "Chelsea", "Arsenal", "Manchester United", "Liverpool", "Juventus", "AC Milan", "PSG", "Bayern Munich", "Inter Milan", "Atletico Madrid", "Borussia Dortmund", "Tottenham"];
      const rNationalities = ["Brazil", "France", "England", "Spain", "Argentina", "Italy", "Germany", "Portugal", "Netherlands", "Belgium", "Croatia", "Uruguay"];
      const rTrophies = ["Won Champions League", "Won World Cup", "Won Premier League", "Won Ballon d'Or"];
      const rManagers = ["Managed by Mourinho", "Managed by Guardiola", "Managed by Klopp", "Managed by Ancelotti", "Managed by Ferguson"];
      const rLeagues = ["Played in Premier League", "Played in La Liga", "Played in Serie A", "Played in Bundesliga", "Played in Ligue 1"];
      const rPartners = ["Played with Messi", "Played with Ronaldo", "Played with Ibrahimovic", "Played with Neymar"];
      const getCriteria = () => {
        const type = rTypes[Math.floor(Math.random() * rTypes.length)];
        let value = "";
        if (type === "Club") value = rClubs[Math.floor(Math.random() * rClubs.length)];
        else if (type === "Nationality") value = rNationalities[Math.floor(Math.random() * rNationalities.length)];
        else if (type === "Trophy") value = rTrophies[Math.floor(Math.random() * rTrophies.length)];
        else if (type === "Manager") value = rManagers[Math.floor(Math.random() * rManagers.length)];
        else if (type === "League") value = rLeagues[Math.floor(Math.random() * rLeagues.length)];
        else value = rPartners[Math.floor(Math.random() * rPartners.length)];
        return { type, value };
      };
      const rows = [getCriteria(), getCriteria(), getCriteria()];
      const cols = [getCriteria(), getCriteria(), getCriteria()];
      return res.json({ rows, cols, solvable: false });
    }
  }
  try {
    let customPrompt = "";
    if (theme === "music") {
      customPrompt = `Generate a 3x3 music artist/band trivia grid options (rows and columns). It is allowed to be very difficult, challenging, or potentially UNSOLVABLE (or having very few answers).
Row and column criteria should be of these types:
- "Genre" (e.g. Pop Music, Rock / Alternative, Hip Hop / R&B, Country, Electronic / Dance, etc)
- "Nationality" (e.g. United Kingdom, United States, Canada, France, Colombia, etc)
- "Award" (e.g. Won Grammy Award, Won Brit Award, Won MTV VMA, etc)
- "Chart" (e.g. Has Billboard #1 Hit, Has 1B+ Spotify Streams, Has UK #1 Hit, etc)
- "Type" (e.g. Solo Artist, Duo, Band or Group, etc)`;
    } else if (theme === "movies") {
      customPrompt = `Generate a 3x3 film/movie trivia grid options (rows and columns). It is allowed to be very difficult or challenging.
Row and column criteria should correspond to:
- "Genre" (e.g. Sci-Fi / Fantasy, Drama, Comedy, Action / Adventure, Horror, etc)
- "Director" (e.g. Directed by Christopher Nolan, Directed by Steven Spielberg, Directed by Martin Scorsese, Directed by Quentin Tarantino, etc)
- "Award" (e.g. Won Academy Award (Oscar), Won Golden Globe, Won BAFTA Winner, etc)
- "Franchise / Studio" (e.g. Warner Bros., Marvel Cinematic Universe, Walt Disney Pictures, Universal Pictures, etc)
- "Stat" (e.g. Grossed Over $1 Billion, 90%+ Rotten Tomatoes, Starred Leonardo DiCaprio, Starred Tom Hanks, etc)`;
    } else {
      customPrompt = `Generate a 3x3 football grid options (rows and columns). It is allowed to be very difficult, challenging, or potentially UNSOLVABLE (or having very few answers).
Row and column criteria should be of these types:
- "Club" (e.g. Manchester united, Chelsea, PSG, Inter Milan, AC Milan, Barcelona, etc)
- "Nationality" (e.g. French, Brazilian, English, Spanish, Argentine, etc)
- "Trophy" (e.g. Won World Cup, Won Champions League, Won Ballon d'Or, etc)
- "League" (e.g. Played in Premier League, Played in Serie A, Played in La Liga, etc)
- "Manager" (e.g. Managed by Guardiola, Managed by Mourinho, Managed by Ancelotti, etc)
- "Partner" (e.g. Played with Messi, Played with Ronaldo, Played with Ibrahimovic, Played with Hazard)`;
    }
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `${customPrompt}

Return a JSON array representing exactly:
{
  "rows": [{"type": "Genre"|"Nationality"|"Award"|"Chart"|"Type"|"Club"|"Trophy"|"League"|"Manager"|"Partner"|"Director"|"Franchise / Studio"|"Stat", "value": string}, ... 3 items],
  "cols": [{"type": "Genre"|"Nationality"|"Award"|"Chart"|"Type"|"Club"|"Trophy"|"League"|"Manager"|"Partner"|"Director"|"Franchise / Studio"|"Stat", "value": string}, ... 3 items]
}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          required: ["rows", "cols"],
          properties: {
            rows: {
              type: import_genai.Type.ARRAY,
              items: {
                type: import_genai.Type.OBJECT,
                required: ["type", "value"],
                properties: {
                  type: { type: import_genai.Type.STRING },
                  value: { type: import_genai.Type.STRING }
                }
              }
            },
            cols: {
              type: import_genai.Type.ARRAY,
              items: {
                type: import_genai.Type.OBJECT,
                required: ["type", "value"],
                properties: {
                  type: { type: import_genai.Type.STRING },
                  value: { type: import_genai.Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    const data = JSON.parse(response.text.trim());
    return res.json({
      rows: data.rows,
      cols: data.cols,
      solvable: false
    });
  } catch (error) {
    console.error("Gemini grid creation failed, using curated:", error);
    const selected = theme === "music" ? TTT_MUSIC_CURATED_GRIDS[0] : theme === "movies" ? TTT_MOVIES_CURATED_GRIDS[0] : TTT_CURATED_GRIDS[0];
    return res.json({
      rows: selected.rows,
      cols: selected.cols,
      solvable: false
    });
  }
});
function runOfflineVerify(playerName, rowCriteria, colCriteria, theme) {
  const lowerName = playerName.toLowerCase().trim();
  if (lowerName.length < 3) {
    return { success: false, clarification: "Incorrect or incomplete name." };
  }
  if (theme === "music") {
    const taylor = { genres: ["pop", "country", "rock", "alternative"], nationality: "united states", type: "solo artist", awards: ["grammy", "billboard"], charts: ["billboard", "spotify"] };
    const beatles = { genres: ["rock", "pop"], nationality: "united kingdom", type: "band or group", awards: ["grammy"], charts: ["billboard"] };
    const queen = { genres: ["rock", "pop"], nationality: "united kingdom", type: "band or group", awards: ["grammy", "brit"], charts: ["billboard"] };
    const jackson = { genres: ["pop", "r&b", "dance"], nationality: "united states", type: "solo artist", awards: ["grammy"], charts: ["billboard"] };
    const sheeran = { genres: ["pop", "acoustic"], nationality: "united kingdom", type: "solo artist", awards: ["grammy", "brit"], charts: ["billboard", "spotify"] };
    const coldplay = { genres: ["rock", "alternative", "pop"], nationality: "united kingdom", type: "band or group", awards: ["grammy", "brit"], charts: ["billboard", "spotify"] };
    const eminem = { genres: ["hip hop", "rap", "r&b"], nationality: "united states", type: "solo artist", awards: ["grammy"], charts: ["billboard", "spotify"] };
    const rihanna = { genres: ["pop", "r&b", "dance"], nationality: "united states", type: "solo artist", awards: ["grammy"], charts: ["billboard", "spotify"] };
    const daftpunk = { genres: ["electronic", "dance", "house"], nationality: "france", type: "duo", awards: ["grammy"], charts: ["spotify"] };
    const adele = { genres: ["pop", "soul"], nationality: "united kingdom", type: "solo artist", awards: ["grammy", "brit"], charts: ["billboard", "spotify"] };
    const drake = { genres: ["hip hop", "rap", "pop"], nationality: "canada", type: "solo artist", awards: ["grammy"], charts: ["billboard", "spotify"] };
    const weeknd = { genres: ["r&b", "pop", "electronic"], nationality: "canada", type: "solo artist", awards: ["grammy"], charts: ["billboard", "spotify"] };
    const getMusicProfile = (name) => {
      const n = name.toLowerCase();
      if (n.includes("swift") || n.includes("taylor")) return taylor;
      if (n.includes("beatles")) return beatles;
      if (n.includes("queen")) return queen;
      if (n.includes("jackson")) return jackson;
      if (n.includes("sheeran")) return sheeran;
      if (n.includes("coldplay")) return coldplay;
      if (n.includes("eminem")) return eminem;
      if (n.includes("rihanna")) return rihanna;
      if (n.includes("daft") || n.includes("punk")) return daftpunk;
      if (n.includes("adele")) return adele;
      if (n.includes("drake")) return drake;
      if (n.includes("weeknd")) return weeknd;
      return null;
    };
    const profile = getMusicProfile(lowerName);
    if (!profile) {
      return {
        success: false,
        clarification: `Could not verify "${playerName}" offline. For music mode offline, try searching for Taylor Swift, The Beatles, Queen, Michael Jackson, Ed Sheeran, Coldplay, Eminem, Rihanna, Daft Punk, Adele, Drake, The Weeknd, etc.`
      };
    }
    const checkMusicCriteria = (prof, crit) => {
      const t = crit.type.toLowerCase();
      const v = crit.value.toLowerCase();
      if (t === "genre") return prof.genres.some((g) => v.includes(g) || g.includes(v));
      if (t === "nationality") return v.includes(prof.nationality) || prof.nationality.includes(v);
      if (t === "award") return prof.awards.some((a) => v.includes(a));
      if (t === "chart") return prof.charts.some((c) => v.includes(c));
      if (t === "type") return v.includes(prof.type) || prof.type.includes(v);
      return false;
    };
    const matchRow = checkMusicCriteria(profile, rowCriteria);
    const matchCol = checkMusicCriteria(profile, colCriteria);
    const totalSuccess = matchRow && matchCol;
    return {
      success: totalSuccess,
      clarification: totalSuccess ? `Verified (Offline): "${playerName}" satisfies: ${rowCriteria.value} and ${colCriteria.value}.` : `Reversed: "${playerName}" does not satisfy both criteria offline.`
    };
  } else if (theme === "movies") {
    const nolanProfile = { type: "director", genres: ["sci-fi", "thriller", "action", "drama"], awards: ["oscar", "academy award"], films: ["inception", "interstellar", "the dark knight", "dark knight", "oppenheimer", "memento"] };
    const spielbergProfile = { type: "director", genres: ["sci-fi", "adventure", "drama"], awards: ["oscar", "academy award"], films: ["jurassic park", "schindler's list", "jaws", "saving private ryan", "et", "e.t."] };
    const scorseseProfile = { type: "director", genres: ["crime", "drama", "thriller"], awards: ["oscar", "academy award"], films: ["goodfellas", "taxi driver", "the departed", "wolf of wall street", "shutter island"] };
    const cameronProfile = { type: "director", genres: ["sci-fi", "action", "drama"], awards: ["oscar", "academy award"], films: ["titanic", "avatar", "terminator", "aliens"] };
    const dicaprio = { type: "actor", genres: ["drama", "action", "sci-fi", "romance"], awards: ["oscar", "academy award"], films: ["titanic", "inception", "shutter island", "the departed", "wolf of wall street", "the revenant"], directorMatched: ["scorsese", "nolan", "cameron"] };
    const hanks = { type: "actor", genres: ["drama", "comedy"], awards: ["oscar", "academy award"], films: ["forrest gump", "toy story", "saving private ryan", "cast away"], directorMatched: ["spielberg"] };
    const getMovieProfile = (name) => {
      const n = name.toLowerCase();
      if (n.includes("nolan")) return nolanProfile;
      if (n.includes("spielberg")) return spielbergProfile;
      if (n.includes("scorsese")) return scorseseProfile;
      if (n.includes("cameron")) return cameronProfile;
      if (n.includes("dicaprio") || n.includes("leonardo")) return dicaprio;
      if (n.includes("hanks") || n.includes("tom hanks")) return hanks;
      return null;
    };
    const profile = getMovieProfile(lowerName);
    if (!profile) {
      return {
        success: false,
        clarification: `Could not verify "${playerName}" offline. For movies mode offline, try searching for Christopher Nolan, Steven Spielberg, Martin Scorsese, James Cameron, Leonardo DiCaprio, Tom Hanks, etc.`
      };
    }
    const checkMovieCriteria = (prof, crit) => {
      const t = crit.type.toLowerCase();
      const v = crit.value.toLowerCase();
      if (t === "genre") return prof.genres.some((g) => v.includes(g) || g.includes(v));
      if (t === "director") {
        if (prof.type === "director") return v.includes(prof.directorMatched?.[0] || "");
        return prof.directorMatched?.some((d) => v.includes(d)) || false;
      }
      if (t === "award") return prof.awards.some((a) => v.includes(a));
      if (t === "stat" && v.includes("1 billion")) return prof.films?.some((f) => ["avatar", "titanic", "inception", "toy story", "the dark knight", "dark knight"].includes(f)) || false;
      return false;
    };
    const matchRow = checkMovieCriteria(profile, rowCriteria);
    const matchCol = checkMovieCriteria(profile, colCriteria);
    const totalSuccess = matchRow && matchCol;
    return {
      success: totalSuccess,
      clarification: totalSuccess ? `Verified (Offline): "${playerName}" satisfies: ${rowCriteria.value} and ${colCriteria.value}.` : `Reversed: "${playerName}" does not satisfy both criteria offline.`
    };
  } else {
    const chelsea = ["cole", "hazard", "kante", "chelsea", "terry", "lampard", "drogba", "cech", "mikel", "giroud", "morata", "fabregas", "silva", "james", "palmer", "enrique", "enner", "enzo", "willian", "havertz", "fernandez", "oscar", "mata"];
    const realmadrid = ["ronaldo", "benzema", "bale", "modric", "kroos", "casillas", "marcelo", "ramos", "zidane", "mbappe", "vinicius", "rodrygo", "hazard", "morata", "casemiro", "figo", "beckham", "owen", "cannavaro", "odegaard", "ozil", "james"];
    const arsenal = ["henry", "bergkamp", "pires", "viera", "saka", "odegaard", "ozil", "fabregas", "nasri", "giroud", "sanchez", "wright", "cech", "martinelli", "rice", "saliba", "gabriel", "van persie", "adebayor", "havertz"];
    const manu = ["rooney", "ronaldo", "scholes", "giggs", "keane", "beckham", "ferdinand", "vidic", "de gea", "rashford", "fernandes", "pogba", "ibrahimovic", "cavani", "garnacho", "mainoo", "maguire", "lukaku", "van persie", "rvp", "evra", "nani"];
    const barcelona = ["messi", "iniesta", "xavi", "neymar", "suarez", "busquets", "pique", "puyol", "ronaldinho", "ebry", "henry", "rivaldo", "eto'o", "lewandowski", "yamal", "pedri", "gavi", "de jong", "aubameyang", "cruyff", "ter stegen", "alves"];
    const psg = ["mbappe", "neymar", "messi", "zlatan", "ibrahimovic", "cavani", "silva", "marquinhos", "verratti", "di maria", "navas", "hakimi", "dembele", "buffon", "beckham", "ramos", "luiz", "lavezzi", "donnarumma", "marquinhos"];
    const bayern = ["lewandowski", "muller", "robben", "ribery", "neuer", "lahm", "schweinsteiger", "kane", "musiala", "kimmich", "gnabry", "sane", "coman", "alaba", "boateng", "klose", "alonso", "thiago", "martinez", "goretzka"];
    const dortmund = ["reus", "hummels", "lewandowski", "haaland", "sancho", "bellingham", "gotze", "aubameyang", "kagawa", "gundogan", "piszczek", "schmelzer", "weidenfeller", "mkhitaryan", "dembele", "brandt", "kobel", "sabitzer", "can"];
    const juventus = ["buffon", "chiellini", "bonucci", "del piero", "nedved", "pirlo", "pogba", "vidal", "marchisio", "ronaldo", "dybala", "morata", "tevez", "higuain", "evra", "alves", "locatelli", "vlahovic", "chiesa"];
    const atletico = ["griezmann", "godin", "koke", "oblak", "torres", "falcao", "costa", "turan", "suarez", "morata", "depay", "de paul", "llorente", "gimenez", "felipe", "herrera", "courtois", "saviola"];
    const liverpool = ["gerrard", "carragher", "owen", "torres", "suarez", "salah", "mane", "firmino", "henderson", "milner", "van dijk", "alisson", "alexander-arnold", "robertson", "fabinho", "wijnaldum", "jota", "diaz", "nunez", "coutinho"];
    const tottenham = ["kane", "son", "bale", "modric", "allie", "eriksen", "lloris", "vertonghen", "alderweireld", "rose", "walker", "dembele", "romero", "vicario", "maddison", "kulusevski", "bentancur"];
    const inter = ["zanetti", "adriano", "sneijder", "eto", "milito", "martinez", "lukaku", "ibrahimovic", "ronaldo", "figo", "baresi", "materazzi", "chivu", "cambiasso", "maicon", "handanovic", "sommer", "thuram", "calhanoglu", "bastoni", "dimarco", "barella"];
    const acmilan = ["maldini", "nesta", "silva", "dida", "ibrahimovic", "gattuso", "pirlo", "seedorf", "kaka", "shevchenko", "inzaghi", "ronaldinho", "beckham", "balotelli", "leao", "giroud", "hernandez", "maignan", "pulisic", "tomori", "loftus"];
    const isMatch = (array, name) => {
      return array.some((kw) => name.includes(kw));
    };
    const getClubList = (val) => {
      const v = val.toLowerCase();
      if (v.includes("chelsea")) return chelsea;
      if (v.includes("real madrid")) return realmadrid;
      if (v.includes("arsenal")) return arsenal;
      if (v.includes("manchester united") || v.includes("man utd") || v.includes("united")) return manu;
      if (v.includes("barcelona") || v.includes("barca")) return barcelona;
      if (v.includes("psg") || v.includes("paris")) return psg;
      if (v.includes("bayern")) return bayern;
      if (v.includes("dortmund") || v.includes("borussia")) return dortmund;
      if (v.includes("juventus") || v.includes("juve")) return juventus;
      if (v.includes("atletico")) return atletico;
      if (v.includes("liverpool")) return liverpool;
      if (v.includes("tottenham") || v.includes("spurs")) return tottenham;
      if (v.includes("inter milan") || v.includes("internazionale") || v.includes("inter")) return inter;
      if (v.includes("ac milan") || v.includes("milan")) return acmilan;
      return null;
    };
    const getNationList = (val) => {
      const v = val.toLowerCase();
      if (v.includes("france") || v.includes("french")) return ["mbappe", "griezmann", "henry", "zidane", "benzema", "giroud", "pogba", "kante", "ribery", "thuram", "lloris", "vieira", "deschamps", "blanc", "desailly"];
      if (v.includes("spain") || v.includes("spanish")) return ["iniesta", "xavi", "ramos", "casillas", "pique", "puyol", "busquets", "alonso", "villa", "torres", "silva", "rodri", "yamal", "morata"];
      if (v.includes("germany") || v.includes("german")) return ["muller", "neuer", "lahm", "schweinsteiger", "klose", "kroos", "kimmich", "musiala", "sane", "gundogan", "ozil", "podolski", "ballack", "kahm", "klinsmann", "can"];
      if (v.includes("england") || v.includes("english")) return ["rooney", "beckham", "lampard", "gerrard", "terry", "ferdinand", "cole", "kane", "foden", "bellingham", "saka", "palmer", "rice", "walker", "rashford", "shearer"];
      if (v.includes("brazil") || v.includes("brazilian")) return ["ronaldo", "messi", "neymar", "ronaldinho", "kaka", "silva", "alves", "casemiro", "vinicius", "rodrygo", "pele", "rivaldo", "marcelo", "dida"];
      if (v.includes("argentina") || v.includes("argentine")) return ["messi", "maradona", "di maria", "aguero", "tevez", "higuain", "dybala", "martinez", "fernandez", "mac allister", "alvarez", "zanetti", "mascherano"];
      if (v.includes("italy") || v.includes("italian")) return ["buffon", "pirlo", "chiellini", "bonucci", "maldini", "totti", "del piero", "nesta", "cannavaro", "gattuso", "inzaghi", "balotelli", "donnarumma", "barella", "chiesa"];
      if (v.includes("netherlands") || v.includes("dutch")) return ["cruyff", "van persie", "robben", "sneijder", "van dijk", "de jong", "depay", "gullit", "van basten", "rijkaard", "koeman", "seedorf", "davids", "de ligt", "simons"];
      if (v.includes("croatia") || v.includes("croatian")) return ["modric", "rakitic", "perisic", "mandzukic", "kovacic", "gvardiol", "suker", "brozovic"];
      return null;
    };
    const getTrophyList = (val) => {
      const v = val.toLowerCase();
      if (v.includes("world cup")) return ["messi", "ronaldo", "mbappe", "griezmann", "pogba", "kante", "giroud", "ramos", "iniesta", "xavi", "casillas", "pique", "puyol", "busquets", "muller", "neuer", "lahm", "schweinsteiger", "klose", "kroos", "ronaldinho", "kaka", "rivaldo", "maldini", "pirlo", "buffon", "gattuso", "inzaghi", "cannavaro", "nesta", "del piero", "totti"];
      if (v.includes("champions league") || v.includes("ucl")) return ["cr7", "ronaldo", "messi", "benzema", "bale", "modric", "kroos", "casemiro", "ramos", "marcelo", "iniesta", "xavi", "pique", "puyol", "busquets", "neymar", "suarez", "muller", "neuer", "lahm", "schweinsteiger", "robben", "ribery", "alaba", "gerrard", "lampard", "terry", "cech", "drogba", "kaka", "seedorf", "pirlo", "maldini", "nesta", "shevchenko", "eto'o", "chivu", "sneijder", "milito", "zanetti", "guardiola", "henry", "haaland", "rodri", "foden", "silva", "de bruyne"];
      if (v.includes("premier league") || v.includes("epl")) return ["rooney", "giggs", "scholes", "keane", "beckham", "ferdinand", "vidic", "de gea", "ronaldo", "henry", "bergkamp", "pires", "viera", "lampard", "terry", "drogba", "cech", "hazard", "kante", "gerrard", "salah", "mane", "firmino", "van dijk", "alisson", "haaland", "de bruyne", "foden", "rodri", "silva", "walker", "milner", "aguero", "kompany", "toure", "david silva"];
      if (v.includes("ballon d'or") || v.includes("ballon dor")) return ["messi", "cristiano", "ronaldo", "benzema", "modric", "kaka", "cannavaro", "ronaldinho", "shevchenko", "nedved", "owen", "figo", "rivaldo", "zidane", "ronaldo nazario", "van basten", "gullit", "baggio", "papin", "matthaus", "platini", "rossi", "rummenigge", "keegan", "simonsen", "cruyff", "beckenbauer", "muller", "rivera", "charlton", "eusebio", "law", "yaschin", "di stefano", "kopa", "matthews"];
      return null;
    };
    const cachedPlayer = findFootballerInCache(playerName);
    let matchRow = false;
    let matchCol = false;
    if (cachedPlayer) {
      matchRow = checkPlayerCriteria(cachedPlayer, rowCriteria.type, rowCriteria.value);
      matchCol = checkPlayerCriteria(cachedPlayer, colCriteria.type, colCriteria.value);
    } else {
      if (rowCriteria.type === "Club") {
        const arr = getClubList(rowCriteria.value);
        matchRow = arr ? isMatch(arr, lowerName) : false;
      } else if (rowCriteria.type === "Nationality") {
        const arr = getNationList(rowCriteria.value);
        matchRow = arr ? isMatch(arr, lowerName) : false;
      } else if (rowCriteria.type === "Trophy") {
        const arr = getTrophyList(rowCriteria.value);
        matchRow = arr ? isMatch(arr, lowerName) : false;
      } else {
        matchRow = false;
      }
      if (colCriteria.type === "Club") {
        const arr = getClubList(colCriteria.value);
        matchCol = arr ? isMatch(arr, lowerName) : false;
      } else if (colCriteria.type === "Nationality") {
        const arr = getNationList(colCriteria.value);
        matchCol = arr ? isMatch(arr, lowerName) : false;
      } else if (colCriteria.type === "Trophy") {
        const arr = getTrophyList(colCriteria.value);
        matchCol = arr ? isMatch(arr, lowerName) : false;
      } else {
        matchCol = false;
      }
    }
    const totalSuccess = matchRow && matchCol;
    return {
      success: totalSuccess,
      clarification: totalSuccess ? `Verified (Offline): Found "${playerName}" meeting both criteria!` : `Referee check failed: "${playerName}" does not satisfy the required criteria for this position (${rowCriteria.value} + ${colCriteria.value}).`
    };
  }
}
app.post("/api/tic-tac-toe/verify", async (req, res) => {
  const { playerName, rowCriteria, colCriteria } = req.body;
  const theme = req.body.theme || "football";
  const ai = getGemini();
  if (!playerName || !rowCriteria || !colCriteria) {
    return res.status(400).json({ success: false, clarification: "Missing parameters." });
  }
  if (theme === "football") {
    const cachedPlayer = findFootballerInCache(playerName);
    if (cachedPlayer) {
      const matchRow = checkPlayerCriteria(cachedPlayer, rowCriteria.type, rowCriteria.value);
      const matchCol = checkPlayerCriteria(cachedPlayer, colCriteria.type, colCriteria.value);
      if (matchRow && matchCol) {
        console.log(`[Cache Hit] Instant verification success for: ${cachedPlayer.name}`);
        return res.json({
          success: true,
          clarification: `\u2B50 Instant Local Check: Yes, "${cachedPlayer.name}" (${cachedPlayer.nationality}) successfully satisfies both requirements! (Played for/fits ${rowCriteria.value} and ${colCriteria.value})`
        });
      } else {
        console.log(`[Cache Pass] Under local criteria, cached player ${cachedPlayer.name} was not a absolute match. Falling back to Gemini lookup to double-check in case our static details are missing some attributes.`);
      }
    }
  }
  if (!ai) {
    const offlineResult = runOfflineVerify(playerName, rowCriteria, colCriteria, theme);
    return res.json(offlineResult);
  }
  if (false) {
    const lowerName = playerName.toLowerCase().trim();
    if (lowerName.length < 3) {
      return res.json({ success: false, clarification: "Incorrect or incomplete name." });
    }
    if (theme === "music") {
      const taylor = { genres: ["pop", "country", "rock", "alternative"], nationality: "united states", type: "solo artist", awards: ["grammy", "billboard"], charts: ["billboard", "spotify"] };
      const beatles = { genres: ["rock", "pop"], nationality: "united kingdom", type: "band or group", awards: ["grammy"], charts: ["billboard"] };
      const queen = { genres: ["rock", "pop"], nationality: "united kingdom", type: "band or group", awards: ["grammy", "brit"], charts: ["billboard"] };
      const jackson = { genres: ["pop", "r&b", "dance"], nationality: "united states", type: "solo artist", awards: ["grammy"], charts: ["billboard"] };
      const sheeran = { genres: ["pop", "acoustic"], nationality: "united kingdom", type: "solo artist", awards: ["grammy", "brit"], charts: ["billboard", "spotify"] };
      const coldplay = { genres: ["rock", "alternative", "pop"], nationality: "united kingdom", type: "band or group", awards: ["grammy", "brit"], charts: ["billboard", "spotify"] };
      const eminem = { genres: ["hip hop", "rap", "r&b"], nationality: "united states", type: "solo artist", awards: ["grammy"], charts: ["billboard", "spotify"] };
      const rihanna = { genres: ["pop", "r&b", "dance"], nationality: "united states", type: "solo artist", awards: ["grammy"], charts: ["billboard", "spotify"] };
      const daftpunk = { genres: ["electronic", "dance", "house"], nationality: "france", type: "duo", awards: ["grammy"], charts: ["spotify"] };
      const adele = { genres: ["pop", "soul"], nationality: "united kingdom", type: "solo artist", awards: ["grammy", "brit"], charts: ["billboard", "spotify"] };
      const drake = { genres: ["hip hop", "rap", "pop"], nationality: "canada", type: "solo artist", awards: ["grammy"], charts: ["billboard", "spotify"] };
      const weeknd = { genres: ["r&b", "pop", "electronic"], nationality: "canada", type: "solo artist", awards: ["grammy"], charts: ["billboard", "spotify"] };
      const getMusicProfile = (name) => {
        const n = name.toLowerCase();
        if (n.includes("swift") || n.includes("taylor")) return taylor;
        if (n.includes("beatles")) return beatles;
        if (n.includes("queen")) return queen;
        if (n.includes("jackson")) return jackson;
        if (n.includes("sheeran")) return sheeran;
        if (n.includes("coldplay")) return coldplay;
        if (n.includes("eminem")) return eminem;
        if (n.includes("rihanna")) return rihanna;
        if (n.includes("daft punk") || n.includes("daftpunk")) return daftpunk;
        if (n.includes("adele")) return adele;
        if (n.includes("drake")) return drake;
        if (n.includes("weeknd")) return weeknd;
        return null;
      };
      const artist = getMusicProfile(lowerName);
      if (!artist) {
        return res.json({
          success: false,
          clarification: `Could not verify "${playerName}" offline. For music mode offline, try searching for Taylor Swift, The Beatles, Ed Sheeran, Coldplay, Eminem, Adele, Drake, etc.`
        });
      }
      const checkMusicCriteria = (art, crit) => {
        const t = crit.type.toLowerCase();
        const v = crit.value.toLowerCase();
        if (t === "genre") return art.genres.some((g) => v.includes(g) || g.includes(v));
        if (t === "nationality") return v.includes(art.nationality) || art.nationality.includes(v);
        if (t === "type") return art.type.includes(v) || v.includes(art.type);
        if (t === "award") return art.awards.some((a) => v.includes(a));
        if (t === "chart") return art.charts.some((c) => v.includes(c));
        return false;
      };
      const matchRow = checkMusicCriteria(artist, rowCriteria);
      const matchCol = checkMusicCriteria(artist, colCriteria);
      const totalSuccess = matchRow && matchCol;
      return res.json({
        success: totalSuccess,
        clarification: totalSuccess ? `Verified (Offline): "${playerName}" matches both: ${rowCriteria.value} and ${colCriteria.value}.` : `Reversed: "${playerName}" does not satisfy both criteria offline.`
      });
    } else if (theme === "movies") {
      const nolanProfile = { type: "director", genres: ["sci-fi", "drama", "action"], awards: ["oscar", "academy award"], films: ["inception", "interstellar", "oppenheimer", "memento", "dunkirk", "the dark knight", "dark knight"] };
      const spielbergProfile = { type: "director", genres: ["sci-fi", "adventure", "drama"], awards: ["oscar", "academy award"], films: ["jaws", "et", "jurassic park", "schindler", "saving private ryan"] };
      const scorseseProfile = { type: "director", genres: ["drama", "crime"], awards: ["oscar", "academy award"], films: ["taxi driver", "goodfellas", "casino", "the departed", "wolf of wall street", "shutter island"] };
      const cameronProfile = { type: "director", genres: ["sci-fi", "action", "adventure"], awards: ["oscar", "academy award"], films: ["avatar", "titanic", "terminator", "aliens"] };
      const dicaprio = { type: "actor", genres: ["drama", "action", "sci-fi", "romance"], awards: ["oscar", "academy award"], films: ["titanic", "inception", "shutter island", "the departed", "wolf of wall street", "the revenant"], directorMatched: ["scorsese", "nolan", "cameron"] };
      const hanks = { type: "actor", genres: ["drama", "comedy"], awards: ["oscar", "academy award"], films: ["forrest gump", "toy story", "saving private ryan", "cast away"], directorMatched: ["spielberg"] };
      const getMovieProfile = (name) => {
        const n = name.toLowerCase();
        if (n.includes("nolan")) return nolanProfile;
        if (n.includes("spielberg")) return spielbergProfile;
        if (n.includes("scorsese")) return scorseseProfile;
        if (n.includes("cameron")) return cameronProfile;
        if (n.includes("dicaprio") || n.includes("leonardo")) return dicaprio;
        if (n.includes("hanks") || n.includes("tom hanks")) return hanks;
        return null;
      };
      const profile = getMovieProfile(lowerName);
      if (!profile) {
        return res.json({
          success: false,
          clarification: `Could not verify "${playerName}" offline. For movies mode offline, try searching for Christopher Nolan, Steven Spielberg, Martin Scorsese, James Cameron, Leonardo DiCaprio, Tom Hanks, etc.`
        });
      }
      const checkMovieCriteria = (prof, crit) => {
        const t = crit.type.toLowerCase();
        const v = crit.value.toLowerCase();
        if (t === "genre") return prof.genres.some((g) => v.includes(g) || g.includes(v));
        if (t === "director") {
          if (prof.type === "director") return v.includes(prof.directorMatched?.[0] || "");
          return prof.directorMatched?.some((d) => v.includes(d)) || false;
        }
        if (t === "award") return prof.awards.some((a) => v.includes(a));
        if (t === "stat" && v.includes("1 billion")) return prof.films?.some((f) => ["avatar", "titanic", "inception", "toy story", "the dark knight", "dark knight"].includes(f)) || false;
        return false;
      };
      const matchRow = checkMovieCriteria(profile, rowCriteria);
      const matchCol = checkMovieCriteria(profile, colCriteria);
      const totalSuccess = matchRow && matchCol;
      return res.json({
        success: totalSuccess,
        clarification: totalSuccess ? `Verified (Offline): "${playerName}" satisfies: ${rowCriteria.value} and ${colCriteria.value}.` : `Reversed: "${playerName}" does not satisfy both criteria offline.`
      });
    } else {
      const chelsea = ["cole", "hazard", "kante", "chelsea", "terry", "lampard", "drogba", "cech", "mikel", "giroud", "morata", "fabregas", "silva", "james", "palmer", "enrique", "enner", "enzo", "willian", "havertz", "fernandez", "oscar", "mata"];
      const realmadrid = ["ronaldo", "benzema", "bale", "modric", "kroos", "casillas", "marcelo", "ramos", "zidane", "mbappe", "vinicius", "rodrygo", "hazard", "morata", "casemiro", "figo", "beckham", "owen", "cannavaro", "odegaard", "ozil", "james"];
      const arsenal = ["henry", "bergkamp", "pires", "viera", "saka", "odegaard", "ozil", "fabregas", "nasri", "giroud", "sanchez", "wright", "cech", "martinelli", "rice", "saliba", "gabriel", "van persie", "adebayor", "havertz"];
      const manu = ["rooney", "ronaldo", "scholes", "giggs", "keane", "beckham", "ferdinand", "vidic", "de gea", "rashford", "fernandes", "pogba", "ibrahimovic", "cavani", "garnacho", "mainoo", "maguire", "lukaku", "van persie", "rvp", "evra", "nani"];
      const barcelona = ["messi", "iniesta", "xavi", "neymar", "suarez", "busquets", "pique", "puyol", "ronaldinho", "ebry", "henry", "rivaldo", "eto'o", "lewandowski", "yamal", "pedri", "gavi", "de jong", "aubameyang", "cruyff", "ter stegen", "alves"];
      const psg = ["mbappe", "neymar", "messi", "zlatan", "ibrahimovic", "cavani", "silva", "marquinhos", "verratti", "di maria", "navas", "hakimi", "dembele", "buffon", "beckham", "ramos", "luiz", "lavezzi", "donnarumma", "marquinhos"];
      const bayern = ["lewandowski", "muller", "robben", "ribery", "neuer", "lahm", "schweinsteiger", "kane", "musiala", "kimmich", "gnabry", "sane", "coman", "alaba", "boateng", "klose", "alonso", "thiago", "martinez", "goretzka"];
      const dortmund = ["reus", "hummels", "lewandowski", "haaland", "sancho", "bellingham", "gotze", "aubameyang", "kagawa", "gundogan", "piszczek", "schmelzer", "weidenfeller", "mkhitaryan", "dembele", "brandt", "kobel", "sabitzer", "can"];
      const juventus = ["buffon", "chiellini", "bonucci", "del piero", "nedved", "pirlo", "pogba", "vidal", "marchisio", "ronaldo", "dybala", "morata", "tevez", "higuain", "evra", "alves", "locatelli", "vlahovic", "chiesa"];
      const atletico = ["griezmann", "godin", "koke", "oblak", "torres", "falcao", "costa", "turan", "suarez", "morata", "depay", "de paul", "llorente", "gimenez", "felipe", "herrera", "courtois", "saviola"];
      const liverpool = ["gerrard", "carragher", "owen", "torres", "suarez", "salah", "mane", "firmino", "henderson", "milner", "van dijk", "alisson", "alexander-arnold", "robertson", "fabinho", "wijnaldum", "jota", "diaz", "nunez", "coutinho"];
      const tottenham = ["kane", "son", "bale", "modric", "allie", "eriksen", "lloris", "vertonghen", "alderweireld", "rose", "walker", "dembele", "romero", "vicario", "maddison", "kulusevski", "bentancur"];
      const inter = ["zanetti", "adriano", "sneijder", "eto", "milito", "martinez", "lukaku", "ibrahimovic", "ronaldo", "figo", "baresi", "materazzi", "chivu", "cambiasso", "maicon", "handanovic", "sommer", "thuram", "calhanoglu", "bastoni", "dimarco", "barella"];
      const acmilan = ["maldini", "nesta", "silva", "dida", "ibrahimovic", "gattuso", "pirlo", "seedorf", "kaka", "shevchenko", "inzaghi", "ronaldinho", "beckham", "balotelli", "leao", "giroud", "hernandez", "maignan", "pulisic", "tomori", "loftus"];
      const isMatch = (array, name) => {
        return array.some((kw) => name.includes(kw));
      };
      const getClubList = (val) => {
        const v = val.toLowerCase();
        if (v.includes("chelsea")) return chelsea;
        if (v.includes("real madrid")) return realmadrid;
        if (v.includes("arsenal")) return arsenal;
        if (v.includes("manchester united") || v.includes("man utd") || v.includes("united")) return manu;
        if (v.includes("barcelona") || v.includes("barca")) return barcelona;
        if (v.includes("psg") || v.includes("paris")) return psg;
        if (v.includes("bayern")) return bayern;
        if (v.includes("dortmund") || v.includes("borussia")) return dortmund;
        if (v.includes("juventus") || v.includes("juve")) return juventus;
        if (v.includes("atletico")) return atletico;
        if (v.includes("liverpool")) return liverpool;
        if (v.includes("tottenham") || v.includes("spurs")) return tottenham;
        if (v.includes("inter milan") || v.includes("internazionale") || v.includes("inter")) return inter;
        if (v.includes("ac milan") || v.includes("milan")) return acmilan;
        return null;
      };
      const getNationList = (val) => {
        const v = val.toLowerCase();
        if (v.includes("france") || v.includes("french")) return ["mbappe", "griezmann", "henry", "zidane", "benzema", "giroud", "pogba", "kante", "ribery", "thuram", "lloris", "vieira", "deschamps", "blanc", "desailly"];
        if (v.includes("spain") || v.includes("spanish")) return ["iniesta", "xavi", "ramos", "casillas", "pique", "puyol", "busquets", "alonso", "villa", "torres", "silva", "rodri", "yamal", "morata"];
        if (v.includes("germany") || v.includes("german")) return ["muller", "neuer", "lahm", "schweinsteiger", "klose", "kroos", "kimmich", "musiala", "sane", "gundogan", "ozil", "podolski", "ballack", "kahm", "klinsmann", "can"];
        if (v.includes("england") || v.includes("english")) return ["rooney", "beckham", "lampard", "gerrard", "terry", "ferdinand", "cole", "kane", "foden", "bellingham", "saka", "palmer", "rice", "walker", "rashford", "shearer"];
        if (v.includes("brazil") || v.includes("brazilian")) return ["ronaldo", "messi", "neymar", "ronaldinho", "kaka", "silva", "alves", "casemiro", "vinicius", "rodrygo", "pele", "rivaldo", "marcelo", "dida"];
        if (v.includes("argentina") || v.includes("argentine")) return ["messi", "maradona", "di maria", "aguero", "tevez", "higuain", "dybala", "martinez", "fernandez", "mac allister", "alvarez", "zanetti", "mascherano"];
        if (v.includes("italy") || v.includes("italian")) return ["buffon", "pirlo", "chiellini", "bonucci", "maldini", "totti", "del piero", "nesta", "cannavaro", "gattuso", "inzaghi", "balotelli", "donnarumma", "barella", "chiesa"];
        if (v.includes("netherlands") || v.includes("dutch")) return ["cruyff", "van persie", "robben", "sneijder", "van dijk", "de jong", "depay", "gullit", "van basten", "rijkaard", "koeman", "seedorf", "davids", "de ligt", "simons"];
        if (v.includes("croatia") || v.includes("croatian")) return ["modric", "rakitic", "perisic", "mandzukic", "kovacic", "gvardiol", "suker", "brozovic"];
        return null;
      };
      const getTrophyList = (val) => {
        const v = val.toLowerCase();
        if (v.includes("world cup")) return ["messi", "ronaldo", "mbappe", "griezmann", "pogba", "kante", "giroud", "ramos", "iniesta", "xavi", "casillas", "pique", "puyol", "busquets", "muller", "neuer", "lahm", "schweinsteiger", "klose", "kroos", "ronaldinho", "kaka", "rivaldo", "maldini", "pirlo", "buffon", "gattuso", "inzaghi", "cannavaro", "nesta", "del piero", "totti"];
        if (v.includes("champions league") || v.includes("ucl")) return ["cr7", "ronaldo", "messi", "benzema", "bale", "modric", "kroos", "casemiro", "ramos", "marcelo", "iniesta", "xavi", "pique", "puyol", "busquets", "neymar", "suarez", "muller", "neuer", "lahm", "schweinsteiger", "robben", "ribery", "alaba", "gerrard", "lampard", "terry", "cech", "drogba", "kaka", "seedorf", "pirlo", "maldini", "nesta", "shevchenko", "eto'o", "chivu", "sneijder", "milito", "zanetti", "guardiola", "henry", "haaland", "rodri", "foden", "silva", "de bruyne"];
        if (v.includes("premier league") || v.includes("epl")) return ["rooney", "giggs", "scholes", "keane", "beckham", "ferdinand", "vidic", "de gea", "ronaldo", "henry", "bergkamp", "pires", "viera", "lampard", "terry", "drogba", "cech", "hazard", "kante", "gerrard", "salah", "mane", "firmino", "van dijk", "alisson", "haaland", "de bruyne", "foden", "rodri", "silva", "walker", "milner", "aguero", "kompany", "toure", "david silva"];
        if (v.includes("ballon d'or") || v.includes("ballon dor")) return ["messi", "cristiano", "ronaldo", "benzema", "modric", "kaka", "cannavaro", "ronaldinho", "shevchenko", "nedved", "owen", "figo", "rivaldo", "zidane", "ronaldo nazario", "van basten", "gullit", "baggio", "papin", "matthaus", "platini", "rossi", "rummenigge", "keegan", "simonsen", "cruyff", "beckenbauer", "muller", "rivera", "charlton", "eusebio", "law", "yaschin", "di stefano", "kopa", "matthews"];
        return null;
      };
      const cachedPlayer = findFootballerInCache(playerName);
      let matchRow = false;
      let matchCol = false;
      if (cachedPlayer) {
        matchRow = checkPlayerCriteria(cachedPlayer, rowCriteria.type, rowCriteria.value);
        matchCol = checkPlayerCriteria(cachedPlayer, colCriteria.type, colCriteria.value);
      } else {
        if (rowCriteria.type === "Club") {
          const arr = getClubList(rowCriteria.value);
          matchRow = arr ? isMatch(arr, lowerName) : false;
        } else if (rowCriteria.type === "Nationality") {
          const arr = getNationList(rowCriteria.value);
          matchRow = arr ? isMatch(arr, lowerName) : false;
        } else if (rowCriteria.type === "Trophy") {
          const arr = getTrophyList(rowCriteria.value);
          matchRow = arr ? isMatch(arr, lowerName) : false;
        } else {
          matchRow = false;
        }
        if (colCriteria.type === "Club") {
          const arr = getClubList(colCriteria.value);
          matchCol = arr ? isMatch(arr, lowerName) : false;
        } else if (colCriteria.type === "Nationality") {
          const arr = getNationList(colCriteria.value);
          matchCol = arr ? isMatch(arr, lowerName) : false;
        } else if (colCriteria.type === "Trophy") {
          const arr = getTrophyList(colCriteria.value);
          matchCol = arr ? isMatch(arr, lowerName) : false;
        } else {
          matchCol = false;
        }
      }
      const totalSuccess = matchRow && matchCol;
      return res.json({
        success: totalSuccess,
        clarification: totalSuccess ? `Verified (Offline): Found "${playerName}" meeting both criteria!` : `Referee check failed: "${playerName}" does not satisfy the required criteria for this position (${rowCriteria.value} + ${colCriteria.value}).`
      });
    }
  }
  try {
    let promptGenre = "";
    if (theme === "music") {
      promptGenre = `You are a music trivia master. Verify if the music artist (musician, band, singer, group, or producer) "${playerName}" satisfies BOTHCriterion 1 and Criterion 2.
    
    Criterion 1:
    - Type: ${rowCriteria.type}
    - Value: ${rowCriteria.value}
    
    Criterion 2:
    - Type: ${colCriteria.type}
    - Value: ${colCriteria.value}

    Verification Guidelines for Music:
    - "Genre": The artist must be widely recognized for playing or releasing music in that genre (e.g., "Pop Music", "Rock / Alternative", "Hip Hop / R&B", "Electronic / Dance", etc.).
    - "Nationality": The country the artist or group originated or resides in (e.g., "United Kingdom", "United States", "France", "Canada", etc.).
    - "Award": Confirmed to have won or received that award (e.g., "Won Grammy Award", "Won Brit Award", etc. - must be an actual winner).
    - "Chart": Reached #1 on that chart or milestone (e.g. "Has Billboard #1 Hit", "Has 1B+ Spotify Streams", etc.).
    - "Type": Fits the physical structure of the act (e.g., "Solo Artist", "Duo", "Band or Group").`;
    } else if (theme === "movies") {
      promptGenre = `You are a movie and cinematography trivia master. Verify if the film, movie, actor, actress, or director "${playerName}" satisfies BOTH Criterion 1 and Criterion 2.
    
    Criterion 1:
    - Type: ${rowCriteria.type}
    - Value: ${rowCriteria.value}
    
    Criterion 2:
    - Type: ${colCriteria.type}
    - Value: ${colCriteria.value}

    Verification Guidelines for Movies & Cinema:
    - "Genre": The movie, actor, or director has major works in that genre (e.g. "Sci-Fi / Fantasy", "Drama", "Action / Adventure", "Comedy", "Horror").
    - "Director": The movie was directed by that filmmaker, or the person specified is indeed that director (e.g., "Directed by Christopher Nolan", "Directed by Steven Spielberg").
    - "Award": Won that specific Oscar or Academy Award category (or BAFTA / Golden Globe), or the actor/director has won it.
    - "Franchise / Studio": Starred in, belongs to, or was produced by that entity (e.g., "Warner Bros.", "Marvel Cinematic Universe").
    - "Stat": Fits the milestone (e.g., "Grossed Over $1 Billion" at worldwide box office, "Starred Leonardo DiCaprio", etc.).`;
    } else {
      promptGenre = `You are a professional football (soccer) referee. Verify if the football player "${playerName}" satisfies Criterion 1 and Criterion 2.
    
    Criterion 1:
    - Type: ${rowCriteria.type}
    - Value: ${rowCriteria.value}
    
    Criterion 2:
    - Type: ${colCriteria.type}
    - Value: ${colCriteria.value}

    Verification Guidelines:
    - "Club": Played senior first team match for that club.
    - "Nationality": The international football country team they represent.
    - "Trophy": Won specified elite trophy (World Cup, UCL, EPL, etc. must have won).
    - "League": Played in the league.
    - "Manager": Played matches under that manager.
    - "Partner": Shared senior football team on-field minutes with that player.`;
    }
    const prompt = `${promptGenre}

    CRITICAL TRUTH & FACT-CHECKING RULES:
    1. Double check all facts thoroughly against your historical knowledge. NEVER assume, guess, or hallucinate relationships.
    2. Footballers must have played in at least ONE official senior competitive first-team match for the specified "Club" or "League". Dida NEVER under any circumstances played for Bayern Munich. If a player did not make a physical competitive senior first-team appearance for that club, they fail.
    3. Musicians and Movie performers must have actually been associated, released, directed, or won specified awards.
    4. Resolve spelling typo approximations to the CORRECT canonical spelling of the player/entity (e.g. resolve "Kruyff" to "Johan Cruyff", "Cruyff" to "Johan Cruyff", "Dida" to "Dida"). In the response "foundPlayerProfile" and "correctName", you MUST use the corrected canonical spelling, never the spelling typos.
    5. Prioritize extreme historical precision. If there is even a sliver of doubt, return success as FALSE.

    In addition, please resolve and extract the player's comprehensive profile structure so we can save it to our instantaneous local database (only if they are a real football player). Resolve their correct canonical spelling (e.g. "messi" to "Lionel Messi" or "swift" to "Taylor Swift").
    
    Provide a strict JSON response. Spell-check and use the canonical name in clarification.
    
    JSON Schema:
    {
      "success": boolean,
      "clarification": string (be descriptive but short, e.g. "Yes! Cristiano Ronaldo played for Real Madrid (2009-2018) and has won 5 Champions Leagues."),
      "foundPlayerProfile": {
        "name": string,
        "nationality": string,
        "clubs": string[],
        "managers": string[],
        "trophies": string[],
        "leagues": string[],
        "partners": string[]
      }
    }`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          required: ["success", "clarification"],
          properties: {
            success: { type: import_genai.Type.BOOLEAN },
            clarification: { type: import_genai.Type.STRING },
            foundPlayerProfile: {
              type: import_genai.Type.OBJECT,
              required: ["name", "nationality", "clubs", "managers", "trophies", "leagues", "partners"],
              properties: {
                name: { type: import_genai.Type.STRING },
                nationality: { type: import_genai.Type.STRING },
                clubs: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
                managers: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
                trophies: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
                leagues: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
                partners: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } }
              }
            }
          }
        }
      }
    });
    const verifyData = JSON.parse(response.text.trim());
    if (theme === "football" && verifyData.success && verifyData.foundPlayerProfile) {
      const profile = verifyData.foundPlayerProfile;
      const normGuess = playerName.toLowerCase().trim();
      const synonyms = Array.from(/* @__PURE__ */ new Set([profile.name.toLowerCase().trim(), normGuess, ...profile.synonyms || []]));
      const existing = findFootballerInCache(profile.name) || findFootballerInCache(playerName);
      if (existing) {
        existing.clubs = Array.from(/* @__PURE__ */ new Set([...existing.clubs, ...profile.clubs]));
        existing.managers = Array.from(/* @__PURE__ */ new Set([...existing.managers, ...profile.managers]));
        existing.trophies = Array.from(/* @__PURE__ */ new Set([...existing.trophies, ...profile.trophies]));
        existing.leagues = Array.from(/* @__PURE__ */ new Set([...existing.leagues, ...profile.leagues]));
        existing.partners = Array.from(/* @__PURE__ */ new Set([...existing.partners, ...profile.partners]));
        if (!existing.synonyms.includes(normGuess)) {
          existing.synonyms.push(normGuess);
        }
      } else {
        footballerCache.push({
          name: profile.name,
          synonyms,
          nationality: profile.nationality,
          clubs: profile.clubs,
          managers: profile.managers,
          trophies: profile.trophies,
          leagues: profile.leagues,
          partners: profile.partners
        });
      }
      saveDb();
    }
    const correctName = verifyData.success && verifyData.foundPlayerProfile?.name ? verifyData.foundPlayerProfile.name : playerName;
    return res.json({
      success: verifyData.success,
      clarification: verifyData.clarification,
      correctName
    });
  } catch (error) {
    console.error("Gemini validation error (moving to local fallback):", error);
    const fallbackResult = runOfflineVerify(playerName, rowCriteria, colCriteria, theme);
    return res.json({
      success: fallbackResult.success,
      clarification: `${fallbackResult.clarification} (Note: Running via local check fallback due to temporary connection lag.)`,
      correctName: playerName
    });
  }
});
app.post("/api/tenable/create", async (req, res) => {
  const { customTopicRequest } = req.body;
  const theme = req.body.theme || "football";
  const ai = getGemini();
  const curatedPool = theme === "music" ? TENABLE_MUSIC_CURATED_TOPICS : theme === "movies" ? TENABLE_MOVIES_CURATED_TOPICS : TENABLE_CURATED_TOPICS;
  if (!customTopicRequest && !ai) {
    const idx = Math.floor(Math.random() * curatedPool.length);
    return res.json(curatedPool[idx]);
  }
  if (!ai) {
    const idx = Math.floor(Math.random() * curatedPool.length);
    const selected = { ...curatedPool[idx] };
    selected.description = `(Could not connect to Gemini, fell back to curated) ${selected.description}`;
    return res.json(selected);
  }
  try {
    let promptTheme = "";
    let systemInstruction = "";
    let examplesText = "";
    if (theme === "music") {
      promptTheme = customTopicRequest ? `custom music topic described as: "${customTopicRequest}"` : `a random exciting professional commercial music and history challenge topic`;
      systemInstruction = `You are a designer for the TV game-show "Tenable". Generate a music (singer, artist, rock band, album chart, award) topic that requires listing exactly 10 high-quality, distinctive answers.
      The topic must be unambiguous, real, and verifiable based on charts and awards records.
      Theme requested: ${promptTheme}.`;
      examplesText = `Examples:
      - "10 best-selling music artists of all time according to certified sales"
      - "Top 10 most streamed artists on Spotify of all time"
      - "10 legendary British rock bands"
      - "10 famous albums that won Grammy Award for Album of the Year"`;
    } else if (theme === "movies") {
      promptTheme = customTopicRequest ? `custom TV & film topic described as: "${customTopicRequest}"` : `a random exciting movies, blockbusters, and Hollywood actors challenge topic`;
      systemInstruction = `You are a designer for the TV game-show "Tenable". Generate a cinema, movies & TV show topic that requires listing exactly 10 high-quality, distinctive answers.
      The topic must be unambiguous, real, and verifiable based on international movie and Oscar records.
      Theme requested: ${promptTheme}.`;
      examplesText = `Examples:
      - "Top 10 highest-grossing movies worldwide of all time"
      - "10 iconic films directed by Steven Spielberg"
      - "10 famous actors who won the Best Actor Oscar in the 21st century"
      - "10 highly successful movie franchises list members"`;
    } else {
      promptTheme = customTopicRequest ? `custom topic described as: "${customTopicRequest}"` : `a random exciting professional football (soccer) challenge topic`;
      systemInstruction = `You are a designer for the TV game-show "Tenable". Generate a football (soccer) topic that requires listing exactly 10 high-quality, distinctive answers.
      The topic must be unambiguous, real, and verifiable based on sports records.
      Theme requested: ${promptTheme}.`;
      examplesText = `Examples:
      - "10 players who won the Champions league with both Real Madrid and another club"
      - "Top 10 Premier League goalscorers from South America"
      - "10 clubs managed by Carlo Ancelotti"
      - "10 players who played in the Premier League for Arsenal under Arsene Wenger"`;
    }
    const prompt = `${systemInstruction}
    
    Provide a list of exactly 10 answers.
    ${examplesText}
    
    Important: The 10 answers must be absolute, factual, and correct. Do not output duplicates.
    
    Return a strict JSON format matching:
    {
      "id": "dynamic-tenable",
      "title": string (title of the panel, e.g. "Top 10 South American Premier League Goalscorers"),
      "description": string (instruction for players, e.g. "Name 10 of the highest scoring South American players in EPL history"),
      "items": string[] (Array of exactly 10 correct answers. Keep the strings as standard titles / names, e.g., ["Sergio Ag\xFCero", "Luis Su\xE1rez", "Carlos Tevez"...])
    }`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          required: ["title", "description", "items"],
          properties: {
            title: { type: import_genai.Type.STRING },
            description: { type: import_genai.Type.STRING },
            items: {
              type: import_genai.Type.ARRAY,
              items: { type: import_genai.Type.STRING }
            }
          }
        }
      }
    });
    const data = JSON.parse(response.text.trim());
    return res.json({
      id: `dynamic-${Date.now()}`,
      title: data.title,
      description: data.description,
      items: data.items.slice(0, 10)
      // Limit to exactly 10 elements
    });
  } catch (error) {
    console.error("Gemini Tenable generation failed, using curated:", error);
    const idx = Math.floor(Math.random() * curatedPool.length);
    return res.json(curatedPool[idx]);
  }
});
app.post("/api/tenable/verify-guess", async (req, res) => {
  const { guess, correctItems } = req.body;
  const ai = getGemini();
  if (!guess || !correctItems || !Array.isArray(correctItems)) {
    return res.status(400).json({ isCorrect: false });
  }
  const lowerGuess = guess.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const matchedIndex = correctItems.findIndex((item) => {
    const normItem = item.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normItem === lowerGuess) return true;
    const itemParts = normItem.split(" ");
    const guessParts = lowerGuess.split(" ");
    if (guessParts.length === 1 && itemParts.length > 1) {
      const lastName = itemParts[itemParts.length - 1];
      if (lastName === lowerGuess && lowerGuess.length > 3) {
        return true;
      }
    }
    return false;
  });
  if (matchedIndex !== -1) {
    return res.json({ isCorrect: true, matchedIndex, matchedValue: correctItems[matchedIndex] });
  }
  if (!ai) {
    return res.json({ isCorrect: false });
  }
  try {
    const prompt = `You are a game show host vetting answers. 
    User guessed: "${guess}"
    Target list of correct answers: ${JSON.stringify(correctItems)}

    Determine if the user's guess refers to any of the correct answers in the target list (for example, allowing short names, last names, famous nicknames, common typo-approximations, abbreviations or partial franchise matches, e.g. "ibrahimovic" for "Zlatan Ibrahimovic", "swift" for "Taylor Swift", "Beatles" for "The Beatles", "gravity" for "Interstellar" if applicable, or "star wars" for "Star Wars"). Be highly forgiving of spelling typos and accents!
    
    Return a strict JSON response:
    {
      "isCorrect": boolean,
      "matchedIndex": number (the 0-indexed index in the targets array that matches, or -1 if no match),
      "matchedValue": string (the exact matched string from the target list, or "" if no match)
    }`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          required: ["isCorrect", "matchedIndex", "matchedValue"],
          properties: {
            isCorrect: { type: import_genai.Type.BOOLEAN },
            matchedIndex: { type: import_genai.Type.INTEGER },
            matchedValue: { type: import_genai.Type.STRING }
          }
        }
      }
    });
    const verifyData = JSON.parse(response.text.trim());
    return res.json(verifyData);
  } catch (error) {
    console.error("Gemini tenable verification failed:", error);
    return res.json({ isCorrect: false });
  }
});
app.post("/api/career/create", async (req, res) => {
  const { customRequest } = req.body;
  const theme = req.body.theme || "football";
  const ai = getGemini();
  const curatedPool = theme === "music" ? CAREER_MUSIC_CURATED_PLAYERS : theme === "movies" ? CAREER_MOVIES_CURATED_PLAYERS : CAREER_CURATED_PLAYERS;
  if (!customRequest) {
    const idx = Math.floor(Math.random() * curatedPool.length);
    return res.json(curatedPool[idx]);
  }
  if (!ai) {
    const idx = Math.floor(Math.random() * curatedPool.length);
    const selected = { ...curatedPool[idx] };
    selected.clues = [`(Gemini offline fallback) ${selected.clues[0] || ""}`, ...selected.clues.slice(1)];
    return res.json(selected);
  }
  try {
    let prompt = "";
    if (theme === "music") {
      prompt = `Generate a detailed chronological career outline of a highly famous, legendary professional music artist, singer, band, or musician (e.g., Taylor Swift, Ed Sheeran, Michael Jackson, Queen, The Beatles, Elton John, Billie Eilish, etc.) so that it resembles a Wikipedia discography or career timeline table.
      Use the specified user prompt or idea: "${customRequest}".
      
      Format requirements:
      - Return exact music stats: years (e.g., "2014\u2013Present"), representative album/group/era name (as "club", e.g., "1989 Album" or "The Beatles"), key details (as "apps", e.g. "Main Vocals" or "Studio Album"), chart success/awards (as "goals", e.g., "Billboard #1" or "Grammy Winner").
      - Exclude minor/unreleased works.
      
      Provide:
      1. The canonical artist name
      2. Artist's home country / nationality
      3. Playing positions / Role (e.g., "Lead Singer / Guitarist" or "Pop Superstar")
      4. Birth year / Founded year (e.g. "1989")
      5. Three interesting trivia hints / clues that do not contain their name directly.
      6. Chronological list of Career milestones
      
      Return a strict JSON format matching:
      {
        "name": string (the exact artist name, e.g. "Taylor Swift"),
        "nationality": string (e.g. "United States"),
        "positions": string (e.g. "Pop Singer-Songwriter"),
        "birthYear": string (e.g. "1989"),
        "clues": string[] (3 unique clues),
        "career": [
          { "years": string, "club": string, "apps": string, "goals": string },
          ... in chronological order
        ]
      }`;
    } else if (theme === "movies") {
      prompt = `Generate a detailed chronological career filmography of a highly famous professional film actor, actress, or director (e.g., Tom Hanks, Christopher Nolan, Leonardo DiCaprio, Meryl Streep, Steven Spielberg, Margot Robbie, Robert Downey Jr., etc.) so that it resembles a Wikipedia filmography table.
      Use the specified user prompt or idea: "${customRequest}".
      
      Format requirements:
      - Return exact movie stats: years (e.g., "2010"), movie/director masterpiece name (as "club", e.g., "Inception"), role/character (as "apps", e.g., "Cobb" or "Director"), notable award/milestone (as "goals", e.g., "Oscar Nominated" or "$1.2B Worldwide").
      - Exclude short/minor roles.
      
      Provide:
      1. The canonical name
      2. Home country / nationality
      3. Playing positions / Role (e.g., "Lead Actor" or "Filmmaker")
      4. Birth year (e.g. "1974")
      5. Three interesting trivia hints / clues that do not contain their name directly.
      6. Chronological list of Career films
      
      Return a strict JSON format matching:
      {
        "name": string (the exact actor/filmmaker name, e.g. "Leonardo DiCaprio"),
        "nationality": string (e.g. "United States"),
        "positions": string (e.g. "Actor / Producer"),
        "birthYear": string (e.g. "1974"),
        "clues": string[] (3 unique clues),
        "career": [
          { "years": string, "club": string, "apps": string, "goals": string },
          ... in chronological order
        ]
      }`;
    } else {
      prompt = `Generate a detailed professional career path of a famous well-known professional football (soccer) player (male, active or recently retired) so that it resembles a Wikipedia "Senior career" infobox database.
      Choose a highly famous player (e.g. Virgil van Dijk, Kevin De Bruyne, Robert Lewandowski, Kylian Mbapp\xE9, Mohamed Salah, Karim Benzema, Thomas M\xFCller, etc.) to ensure the career is identifiable.
      User prompt/idea: "${customRequest}".
      
      Format requirements:
      - Return exact professional stats: years (e.g., "2015\u20132019"), club name (e.g., "Leicester City"), senior apps, senior goals.
      - Exclude youth clubs.
      
      Provide:
      1. The canonical player_name
      2. Player's home country / nationality
      3. Senior career list of clubs
      4. Playing positions
      5. Birth year
      6. Three interesting trivia hints / clues that do not contain their name directly.
      
      Return a strict JSON format matching:
      {
        "name": string (the exact player name, e.g. "Virgil van Dijk"),
        "nationality": string (e.g. "Netherlands"),
        "positions": string (e.g. "Defender"),
        "birthYear": string (e.g. "1991"),
        "clues": string[] (3 unique clues),
        "career": [
          { "years": string, "club": string, "apps": string, "goals": string },
          ... in chronological order
        ]
      }`;
    }
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          required: ["name", "nationality", "positions", "birthYear", "clues", "career"],
          properties: {
            name: { type: import_genai.Type.STRING },
            nationality: { type: import_genai.Type.STRING },
            positions: { type: import_genai.Type.STRING },
            birthYear: { type: import_genai.Type.STRING },
            clues: {
              type: import_genai.Type.ARRAY,
              items: { type: import_genai.Type.STRING }
            },
            career: {
              type: import_genai.Type.ARRAY,
              items: {
                type: import_genai.Type.OBJECT,
                required: ["years", "club", "apps", "goals"],
                properties: {
                  years: { type: import_genai.Type.STRING },
                  club: { type: import_genai.Type.STRING },
                  apps: { type: import_genai.Type.STRING },
                  goals: { type: import_genai.Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    const parsed = JSON.parse(response.text.trim());
    return res.json({
      id: `dynamic-${Date.now()}`,
      ...parsed
    });
  } catch (error) {
    console.error("Gemini Career generator failed, using curated:", error);
    const idx = Math.floor(Math.random() * curatedPool.length);
    return res.json(curatedPool[idx]);
  }
});
app.post("/api/career/verify-guess", async (req, res) => {
  const { guess, trueName } = req.body;
  const ai = getGemini();
  if (!guess || !trueName) {
    return res.status(400).json({ isCorrect: false });
  }
  const cleanGuess = guess.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleanTrueName = trueName.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (cleanGuess === cleanTrueName) {
    return res.json({ isCorrect: true, correction: trueName });
  }
  const trueParts = cleanTrueName.split(" ");
  const guessParts = cleanGuess.split(" ");
  if (guessParts.length === 1 && trueParts.length > 1) {
    const lastName = trueParts[trueParts.length - 1];
    if (lastName === cleanGuess && cleanGuess.length > 3) {
      return res.json({ isCorrect: true, correction: trueName });
    }
  }
  if (!ai) {
    return res.json({ isCorrect: false });
  }
  try {
    const prompt = `Verify if raw entity guess (e.g. player, artist, band, movie, filmmaker) "${guess}" refers to the correct canonical entity "${trueName}".
    Allow minor spelling failures, common abbreviations, nicknames, omission of "The" or articles, subtitles, or accents. For example, "Enzo Fernandez" should match "Enzo", "Ronaldo" can match "Cristiano Ronaldo", "Kevin de bruyne" should match "Kevin De Bruyne", "Beatles" should match "The Beatles", "Taylor Swift" can match "Swift", "Christopher Nolan" can match "Nolan", "inception" can match "Inception".
    
    Provide strict JSON:
    {
      "isCorrect": boolean,
      "correction": string (the exact formal name of the entity, e.g. "The Beatles" or "Leonardo DiCaprio")
    }`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          required: ["isCorrect", "correction"],
          properties: {
            isCorrect: { type: import_genai.Type.BOOLEAN },
            correction: { type: import_genai.Type.STRING }
          }
        }
      }
    });
    const verifyData = JSON.parse(response.text.trim());
    return res.json(verifyData);
  } catch (error) {
    console.error("Gemini career verification failed:", error);
    return res.json({ isCorrect: false });
  }
});
var LEADERBOARD_FILE = import_path.default.join(process.cwd(), "leaderboards.json");
var L_SEED_DATA = [
  {
    id: "seed-1",
    playerName: "Gary Lineker",
    gameType: "tictactoe",
    score: 9,
    date: "2026-06-08T14:30:22.000Z",
    tttSolvable: true,
    guessesCount: 11,
    mistakesCount: 2,
    tttMode: "single",
    tenableTopic: "",
    tenableTimerMode: "none",
    tenableLivesMode: "custom"
  },
  {
    id: "seed-2",
    playerName: "Alan Shearer",
    gameType: "tictactoe",
    score: 6,
    date: "2026-06-08T15:10:05.000Z",
    tttSolvable: false,
    guessesCount: 12,
    mistakesCount: 6,
    tttMode: "single",
    tenableTopic: "",
    tenableTimerMode: "none",
    tenableLivesMode: "custom"
  },
  {
    id: "seed-3",
    playerName: "Thierry Henry",
    gameType: "tictactoe",
    score: 9,
    date: "2026-06-09T08:12:44.000Z",
    tttSolvable: true,
    guessesCount: 9,
    mistakesCount: 0,
    tttMode: "single",
    tenableTopic: "",
    tenableTimerMode: "none",
    tenableLivesMode: "custom"
  },
  {
    id: "seed-4",
    playerName: "Jude Bellingham",
    gameType: "tenable",
    score: 10,
    date: "2026-06-08T18:44:00.000Z",
    tttSolvable: true,
    guessesCount: 10,
    mistakesCount: 0,
    tttMode: "single",
    tenableTopic: "Top 10 Premier League Goalscorers of All Time",
    tenableTimerMode: "none",
    tenableLivesMode: "custom",
    completionTimeSeconds: 42
  },
  {
    id: "seed-5",
    playerName: "Harry Kane",
    gameType: "tenable",
    score: 8,
    date: "2026-06-09T09:20:10.000Z",
    tttSolvable: true,
    guessesCount: 10,
    mistakesCount: 2,
    tttMode: "single",
    tenableTopic: "10 Clubs Managed by Jose Mourinho During His Senior Career",
    tenableTimerMode: "round",
    tenableLivesMode: "custom",
    completionTimeSeconds: 58
  },
  {
    id: "seed-6",
    playerName: "Cole Palmer",
    gameType: "tenable",
    score: 10,
    date: "2026-06-09T09:50:35.000Z",
    tttSolvable: true,
    guessesCount: 10,
    mistakesCount: 0,
    tttMode: "single",
    tenableTopic: "10 Players Who Have Played for Both Chelsea and Arsenal",
    tenableTimerMode: "none",
    tenableLivesMode: "zero",
    completionTimeSeconds: 31
  }
];
function readLeaderboards() {
  try {
    if (import_fs.default.existsSync(LEADERBOARD_FILE)) {
      const content = import_fs.default.readFileSync(LEADERBOARD_FILE, "utf-8");
      return JSON.parse(content);
    } else {
      import_fs.default.writeFileSync(LEADERBOARD_FILE, JSON.stringify(L_SEED_DATA, null, 2), "utf-8");
      return L_SEED_DATA;
    }
  } catch (error) {
    console.error("Read/Write leaderboards failed:", error);
  }
  return L_SEED_DATA;
}
function writeLeaderboards(data) {
  try {
    import_fs.default.writeFileSync(LEADERBOARD_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Write leaderboards failed:", error);
  }
}
app.post("/api/leaderboards/submit", (req, res) => {
  const entry = req.body;
  if (!entry.playerName || !entry.gameType) {
    return res.status(400).json({ error: "Player name and game type are required." });
  }
  const list = readLeaderboards();
  const newEntry = {
    id: `score-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    playerName: entry.playerName,
    gameType: entry.gameType,
    score: Number(entry.score ?? 0),
    date: (/* @__PURE__ */ new Date()).toISOString(),
    // Tic-Tac-Toe specifics
    tttSolvable: entry.tttSolvable !== void 0 ? !!entry.tttSolvable : true,
    guessesCount: Number(entry.guessesCount ?? 0),
    mistakesCount: Number(entry.mistakesCount ?? 0),
    tttMode: entry.tttMode ?? "single",
    // Tenable specifics
    tenableTopic: entry.tenableTopic ?? "",
    tenableTimerMode: entry.tenableTimerMode ?? "none",
    tenableLivesMode: entry.tenableLivesMode ?? "custom",
    completionTimeSeconds: entry.completionTimeSeconds ? Number(entry.completionTimeSeconds) : void 0
  };
  list.push(newEntry);
  writeLeaderboards(list);
  res.json({ success: true, entry: newEntry });
});
app.get("/api/leaderboards/list", (req, res) => {
  const { gameType } = req.query;
  const list = readLeaderboards();
  if (gameType) {
    res.json(list.filter((e) => e.gameType === gameType));
  } else {
    res.json(list);
  }
});
app.post("/api/dispute", async (req, res) => {
  const { gameType, userExplanation, ...params } = req.body;
  const ai = getGemini();
  if (!ai) {
    return res.json({
      actualCorrect: false,
      proof: "The AI Referee is currently offline. Deep verification cannot be completed without Gemini connection."
    });
  }
  try {
    if (gameType === "tic-tac-toe") {
      const { playerName, rowCriteria, colCriteria, theme = "football" } = params;
      const courtName = theme === "music" ? "Supreme Court of Music Critics" : theme === "movies" ? "Supreme Court of Film Historians" : "Supreme Court of Football Referees";
      const prompt = `You are the ${courtName}. An active player/user is disputing a negative validation in a trivia grid game!
      The player guessed: "${playerName}"
      For the grid cell with criteria:
      - Criterion 1: ${rowCriteria.type} of "${rowCriteria.value}"
      - Criterion 2: ${colCriteria.type} of "${colCriteria.value}"

      Originally, this was marked as WRONG/INCORRECT. The player insists they are correct.
      
      ${userExplanation ? `The user provided this explanatory note / proof context: "${userExplanation}". Take this explanation into serious clinical consideration when performing your research.` : ""}

      Deeply research if this is a valid answer.
      Should "${playerName}" actually be recognized as correct?

      Respond in STRICT JSON format matching the schema.
      
      JSON Schema:
      {
        "actualCorrect": boolean,
        "proof": string (a short, clear, objective paragraph proving details on why they definitely match or do not match, citing specific years, matches or stats.)
      }`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            required: ["actualCorrect", "proof"],
            properties: {
              actualCorrect: { type: import_genai.Type.BOOLEAN },
              proof: { type: import_genai.Type.STRING }
            }
          }
        }
      });
      const disputeResult = JSON.parse(response.text.trim());
      if (disputeResult.actualCorrect && theme === "football") {
        const normGuess = playerName.toLowerCase().trim();
        let existing = findFootballerInCache(playerName);
        if (existing) {
          if (rowCriteria.type === "Club" && !existing.clubs.some((c) => c.toLowerCase().includes(rowCriteria.value.toLowerCase()))) {
            existing.clubs.push(rowCriteria.value);
          }
          if (colCriteria.type === "Club" && !existing.clubs.some((c) => c.toLowerCase().includes(colCriteria.value.toLowerCase()))) {
            existing.clubs.push(colCriteria.value);
          }
          if (rowCriteria.type === "Nationality") existing.nationality = rowCriteria.value;
          if (colCriteria.type === "Nationality") existing.nationality = colCriteria.value;
          if (rowCriteria.type === "Trophy" && !existing.trophies.some((t) => t.toLowerCase().includes(rowCriteria.value.toLowerCase()))) existing.trophies.push(rowCriteria.value);
          if (colCriteria.type === "Trophy" && !existing.trophies.some((t) => t.toLowerCase().includes(colCriteria.value.toLowerCase()))) existing.trophies.push(colCriteria.value);
          if (rowCriteria.type === "League" && !existing.leagues.some((l) => l.toLowerCase().includes(rowCriteria.value.toLowerCase()))) existing.leagues.push(rowCriteria.value);
          if (colCriteria.type === "League" && !existing.leagues.some((l) => l.toLowerCase().includes(colCriteria.value.toLowerCase()))) existing.leagues.push(colCriteria.value);
          if (rowCriteria.type === "Manager" && !existing.managers.some((m) => m.toLowerCase().includes(rowCriteria.value.toLowerCase()))) existing.managers.push(rowCriteria.value);
          if (colCriteria.type === "Manager" && !existing.managers.some((m) => m.toLowerCase().includes(colCriteria.value.toLowerCase()))) existing.managers.push(colCriteria.value);
          if (rowCriteria.type === "Partner" && !existing.partners.some((p) => p.toLowerCase().includes(rowCriteria.value.toLowerCase()))) existing.partners.push(rowCriteria.value);
          if (colCriteria.type === "Partner" && !existing.partners.some((p) => p.toLowerCase().includes(colCriteria.value.toLowerCase()))) existing.partners.push(colCriteria.value);
        } else {
          footballerCache.push({
            name: playerName,
            synonyms: [normGuess],
            nationality: rowCriteria.type === "Nationality" ? rowCriteria.value : colCriteria.type === "Nationality" ? colCriteria.value : "Unknown",
            clubs: [
              ...rowCriteria.type === "Club" ? [rowCriteria.value] : [],
              ...colCriteria.type === "Club" ? [colCriteria.value] : []
            ],
            managers: [
              ...rowCriteria.type === "Manager" ? [rowCriteria.value] : [],
              ...colCriteria.type === "Manager" ? [colCriteria.value] : []
            ],
            trophies: [
              ...rowCriteria.type === "Trophy" ? [rowCriteria.value] : [],
              ...colCriteria.type === "Trophy" ? [colCriteria.value] : []
            ],
            leagues: [
              ...rowCriteria.type === "League" ? [rowCriteria.value] : [],
              ...colCriteria.type === "League" ? [colCriteria.value] : []
            ],
            partners: [
              ...rowCriteria.type === "Partner" ? [rowCriteria.value] : [],
              ...colCriteria.type === "Partner" ? [colCriteria.value] : []
            ]
          });
        }
        saveDb();
      }
      return res.json(disputeResult);
    } else if (gameType === "tenable") {
      const { guess, topicTitle, correctItems } = params;
      const prompt = `You are the Supreme Court Referee for a Tenable trivia game.
      Topic of the list: "${topicTitle}"
      Original list of 10 correct items: ${JSON.stringify(correctItems)}
      The user guessed: "${guess}" which was rejected by our automatic validation.

      The user is disputing this, claiming it is correct.
      
      ${userExplanation ? `The user provided this explanatory note / proof context: "${userExplanation}". Take this explanation into serious clinical consideration when performing your research.` : ""}

      Deeply research: Is "${guess}" actually a 100% correct and matching member of this specific list/topic (even if it wasn't on our original list, maybe it qualifies as a correct alternate, synonym, nickname, or fact)?
      
      Respond in STRICT JSON format:
      {
        "actualCorrect": boolean,
        "correctedValue": string,
        "proof": string
      }`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            required: ["actualCorrect", "correctedValue", "proof"],
            properties: {
              actualCorrect: { type: import_genai.Type.BOOLEAN },
              correctedValue: { type: import_genai.Type.STRING },
              proof: { type: import_genai.Type.STRING }
            }
          }
        }
      });
      const disputeResult = JSON.parse(response.text.trim());
      return res.json(disputeResult);
    } else if (gameType === "career-path") {
      const { guess, trueName } = params;
      const prompt = `You are a Supreme Court Referee for a Career Path trivia game.
      The target name was: "${trueName}"
      The user guessed: "${guess}" which was rejected as INCORRECT.

      The user claims "${guess}" is actually a valid match, common spelling typo, widely used nickname, or alternate rendering of the correct name "${trueName}".
      
      ${userExplanation ? `The user provided this explanatory note / proof context: "${userExplanation}". Take this explanation into serious clinical consideration when performing your research.` : ""}

      Research: Is "${guess}" a highly recognizable alternate match for "${trueName}"?
      
      Respond in STRICT JSON format:
      {
        "actualCorrect": boolean,
        "proof": string
      }`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            required: ["actualCorrect", "proof"],
            properties: {
              actualCorrect: { type: import_genai.Type.BOOLEAN },
              proof: { type: import_genai.Type.STRING }
            }
          }
        }
      });
      const disputeResult = JSON.parse(response.text.trim());
      return res.json(disputeResult);
    }
    return res.status(400).json({ error: "Invalid gameType for dispute." });
  } catch (error) {
    console.error("Dispute processing error:", error);
    return res.json({
      actualCorrect: false,
      proof: "Referees encountered a technical issue checking deep archives. Please retry."
    });
  }
});
var FOOTBALL_CARDS = [
  { id: "fc-1", title: "Current players playing for Ipswich Town (2025/2026)", category: "Clubs", hint: "Think of recent arrivals or established starters like Sam Szmodics, Leif Davis, Conor Chaplin, Liam Delap." },
  { id: "fc-2", title: "Players who have played for Leeds United", category: "Clubs", hint: "Think of legends like Mark Viduka, Alan Smith, Kalvin Phillips, Raphinha, James Milner." },
  { id: "fc-3", title: "Players who have won English First Division (not Premiership)", category: "Trophies", hint: "Pre-1992 winners, e.g., Kenny Dalglish, Ian Rush, John Barnes, Gary Lineker." },
  { id: "fc-4", title: "Players who have won the Premiership (Premier League)", category: "Trophies", hint: "Any Premier League winner from 1993 onwards: Ryan Giggs, Thierry Henry, John Terry, Phil Foden." },
  { id: "fc-5", title: "English teams to win the UCL or European Cup", category: "Teams", hint: "Only 6 English clubs have ever lifted this trophy!" },
  { id: "fc-6", title: "Players to win the FA Cup", category: "Trophies", hint: "Think of Chelsea, Arsenal, Manchester United, or Manchester City stars of the last 30 years." },
  { id: "fc-7", title: "Scoring Defenders (Defenders known for high goal scoring records)", category: "Positions", hint: "Think John Terry, Sergio Ramos, Ronald Koeman, Steve Bruce, Virgil van Dijk." },
  { id: "fc-8", title: "Hat-trick heroes (Players who have scored a Premier League hat-trick)", category: "Records", hint: "Think Erling Haaland, Alan Shearer, Robbie Fowler, Harry Kane, Sergio Aguero." },
  { id: "fc-9", title: "Portuguese Premiership Players", category: "Nationality", hint: "Think Bernardo Silva, Diogo Jota, Bruno Fernandes, Cristiano Ronaldo, Ruben Dias." },
  { id: "fc-10", title: "Italian Premiership Players", category: "Nationality", hint: "Think Gianfranco Zola, Mario Balotelli, Sandro Tonali, Jorginho, Federico Chiesa." },
  { id: "fc-11", title: "French Premiership Players", category: "Nationality", hint: "Think Thierry Henry, Patrick Vieira, N'Golo Kante, Paul Pogba, Eric Cantona." },
  { id: "fc-12", title: "French players playing in the Bundesliga", category: "Nationality", hint: "Think Kingsley Coman, Dayot Upamecano, Benjamin Pavard, Franck Rib\xE9ry." },
  { id: "fc-13", title: "Irish Premiership Players", category: "Nationality", hint: "Think Roy Keane, Robbie Keane, Seamus Coleman, Damien Duff, Evan Ferguson." },
  { id: "fc-14", title: "American Premiership Players", category: "Nationality", hint: "Think Christian Pulisic, Clint Dempsey, Tim Howard, Brad Friedel, Antonee Robinson." },
  { id: "fc-15", title: "Australian Premiership Players", category: "Nationality", hint: "Think Harry Kewell, Mark Viduka, Tim Cahill, Mark Schwarzer, Mile Jedinak." },
  { id: "fc-16", title: "Managers to bring a team up to the Premiership from the Championship", category: "Managers", hint: "Think Kieran McKenna, Marco Silva, Vincent Kompany, Daniel Farke, Marcelo Bielsa." },
  { id: "fc-17", title: "Players who have earned Back to Back Promotions", category: "Records", hint: "Think players like Wes Burns, Luke Woolfenden, or older promotion legends." },
  { id: "fc-18", title: "Teams that have earned Back to Back Promotions to the Premier League", category: "Teams", hint: "Ipswich Town, Southampton (historical), Watford, Manchester City (historical)." },
  { id: "fc-19", title: "World Cup Winning English players (1966)", category: "Trophies", hint: "Think Bobby Charlton, Geoff Hurst, Bobby Moore, Gordon Banks." },
  { id: "fc-20", title: "World Cup Winning Premiership Players", category: "Trophies", hint: "Think Thierry Henry, Patrick Vieira, Julian Alvarez, Alexis Mac Allister, Paul Pogba." },
  { id: "fc-21", title: "Footballers to play in both Premiership and Ligue 1/Ligue 2", category: "Leagues", hint: "Think Eden Hazard, Didier Drogba, Zlatan Ibrahimovic, David Beckham." },
  { id: "fc-22", title: "Footballers to play in both Premiership and Bundesliga 1/Bundesliga 2", category: "Leagues", hint: "Think Harry Kane, Jadon Sancho, Erling Haaland, Son Heung-min." },
  { id: "fc-23", title: "Footballers to play in both Premiership and La Liga/La Liga 2", category: "Leagues", hint: "Think Cristiano Ronaldo, Gareth Bale, Luka Modric, Thierry Henry, Luis Suarez." },
  { id: "fc-24", title: "Footballers to play in both Premiership and Primeira Liga (Portugal)", category: "Leagues", hint: "Think Bruno Fernandes, Ruben Dias, Diogo Jota, Ederson, David Luiz." },
  { id: "fc-25", title: "Players who have scored in a Champions League Final", category: "Records", hint: "Think Cristiano Ronaldo, Lionel Messi, Didier Drogba, Gareth Bale, Rodri, Kingsley Coman." },
  { id: "fc-26", title: "Players who have played for both Real Madrid and Barcelona", category: "Clubs", hint: "Think Luis Figo, Ronaldo Nazario, Luis Enrique, Samuel Eto'o, Michael Laudrup." },
  { id: "fc-27", title: "Active Premier League managers as players", category: "Managers", hint: "Think Pep Guardiola, Mikel Arteta, Ange Postecoglou, Sean Dyche." },
  { id: "fc-28", title: "Players with over 100 Premier League goals", category: "Records", hint: "Think Alan Shearer, Harry Kane, Wayne Rooney, Mohamed Salah, Son Heung-min." },
  { id: "fc-29", title: "Goalkeepers who have scored a professional goal", category: "Positions", hint: "Think Alisson Becker, Rogerio Ceni, Jose Luis Chilavert, Paul Robinson, Jimmy Glass." },
  { id: "fc-30", title: "African players who have won the Premier League", category: "Nationality", hint: "Think Didier Drogba, Yaya Toure, Mohamed Salah, Sadio Mane, Riyad Mahrez." }
];
var MUSIC_CARDS = [
  { id: "mc-1", title: "Grammy Award winners for Album of the Year", category: "Awards", hint: "Think Taylor Swift, Adele, Billie Eilish, Daft Punk, Bruno Mars, Coldplay." },
  { id: "mc-2", title: "Bands or artists from the United Kingdom", category: "Nationality", hint: "Think The Beatles, Queen, Coldplay, Oasis, Pink Floyd, Arctic Monkeys." },
  { id: "mc-3", title: "Artists who have headlined the Glastonbury Festival", category: "Records", hint: "Think Elton John, Coldplay, Stormzy, Arctic Monkeys, Beyonce, Adele." },
  { id: "mc-4", title: "Artists with more than 5 songs that reached #1 on Billboard Hot 100", category: "Charts", hint: "Think Drake, Rihanna, Taylor Swift, Mariah Carey, Bruno Mars, Michael Jackson." },
  { id: "mc-5", title: "Famous solo artists who previously left a massive band", category: "History", hint: "Think Harry Styles, Robbie Williams, Michael Jackson, Beyonc\xE9, Phil Collins, Zayn Malik." }
];
var MOVIE_CARDS = [
  { id: "mvc-1", title: "Actors who have won the Academy Award for Best Actor/Actress", category: "Awards", hint: "Think Cillian Murphy, Joaquin Phoenix, Leonardo DiCaprio, Meryl Streep, Emma Stone." },
  { id: "mvc-2", title: "Movies directed by Christopher Nolan", category: "Directors", hint: "Inception, Interstellar, The Dark Knight, Oppenheimer, Tenet." },
  { id: "mvc-3", title: "Actors who have played Batman in live-action theatrical films", category: "Characters", hint: "Think Christian Bale, Ben Affleck, Robert Pattinson, Michael Keaton, George Clooney." },
  { id: "mvc-4", title: "Sci-Fi movies set in outer space", category: "Genres", hint: "Think Interstellar, Gravity, Star Wars, Alien, The Martian, Prometheus." },
  { id: "mvc-5", title: "Movie franchises with more than 5 films", category: "Franchises", hint: "Think Star Wars, Marvel Cinematic Universe, Harry Potter, Fast & Furious, James Bond." }
];
app.post("/api/card-game/generate-card", async (req, res) => {
  const theme = req.body.theme || "football";
  const { customPrompt } = req.body;
  const ai = getGemini();
  let cardsPool = FOOTBALL_CARDS;
  if (theme === "music") {
    cardsPool = MUSIC_CARDS;
  } else if (theme === "movies") {
    cardsPool = MOVIE_CARDS;
  }
  if (customPrompt && ai) {
    try {
      const prompt = `You are designing a creative, engaging trivia topic card for a sports/entertainment card board game.
      Theme: ${theme}
      User's request or inspiration: "${customPrompt}"
      
      Generate a customized trivia card that requires players to list as many answers as they can.
      Ensure the card is clear, solvable, and has high-quality answers.
      Provide a helpful hint to get them started.
      
      Return a strict JSON format:
      {
        "id": "custom-${Date.now()}",
        "title": "string (the clear topic of the card, e.g. 'Players who have played for both Leeds United and Ipswich Town')",
        "category": "string (e.g. Clubs, Nationality, Records, Artists, Directors, Awards)",
        "hint": "string (a helpful tip pointing towards a few possible answers)"
      }`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            required: ["id", "title", "category", "hint"],
            properties: {
              id: { type: import_genai.Type.STRING },
              title: { type: import_genai.Type.STRING },
              category: { type: import_genai.Type.STRING },
              hint: { type: import_genai.Type.STRING }
            }
          }
        }
      });
      const card = JSON.parse(response.text.trim());
      return res.json(card);
    } catch (e) {
      console.error("Error generating custom card, falling back", e);
    }
  }
  if (ai && Math.random() < 0.4) {
    try {
      const prompt = `Generate an exciting, professional, and slightly challenging topic card for "The Football Game" card-based board trivia game.
      Theme: ${theme}
      
      For football mode, think of topics about: players who played for specific clubs, international teammates, managers, unique career records, promotion heroes, specific trophies.
      For music mode, think of: artists with specific chart achievements, famous instruments players, award winners, collaborators, festival headliners.
      For movies mode, think of: award winning actors/directors, movie franchises, specific genres in certain eras, box-office milestones.
      
      Return a strict JSON format:
      {
        "id": "gemini-${Date.now()}-${Math.floor(Math.random() * 1e3)}",
        "title": "string (the elegant topic of the card, e.g. 'Players who have scored for both Real Madrid and Arsenal')",
        "category": "string (e.g. Clubs, Country, Records, Directors, Albums)",
        "hint": "string (a short, intelligent clue suggesting 3-4 possible answers)"
      }`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            required: ["id", "title", "category", "hint"],
            properties: {
              id: { type: import_genai.Type.STRING },
              title: { type: import_genai.Type.STRING },
              category: { type: import_genai.Type.STRING },
              hint: { type: import_genai.Type.STRING }
            }
          }
        }
      });
      const card = JSON.parse(response.text.trim());
      return res.json(card);
    } catch (e) {
      console.error("Error generating random Gemini card, falling back", e);
    }
  }
  const idx = Math.floor(Math.random() * cardsPool.length);
  return res.json(cardsPool[idx]);
});
app.post("/api/card-game/verify-answer", async (req, res) => {
  const { theme, topicTitle, guess, alreadyGuessed } = req.body;
  const ai = getGemini();
  if (!guess || !topicTitle) {
    return res.status(400).json({ success: false, explanation: "Guess and topic are required." });
  }
  const cleanedGuess = guess.trim().toLowerCase();
  const isDuplicate = alreadyGuessed.some((g) => {
    const cg = g.trim().toLowerCase();
    return cg === cleanedGuess || cg.length > 4 && cleanedGuess.includes(cg) || cleanedGuess.length > 4 && cg.includes(cleanedGuess);
  });
  if (isDuplicate) {
    return res.json({ success: false, duplicate: true, explanation: `"${guess}" matches an answer you already guessed!` });
  }
  if (!ai) {
    return res.json({
      success: true,
      officialName: guess,
      rationale: "Approved! (Offline self-validation fallback mode. Connect Gemini for official Google Search verification!)"
    });
  }
  try {
    const prompt = `You are the Official Chief Referee for "The Football Game / Cards-Against-Trivia" game.
    We are playing a round of active trivia with theme: "${theme}".
    The active topic card is: "${topicTitle}".
    
    The user is guessing: "${guess}"
    
    Task:
    Use your internal knowledge and GOOGLE SEARCH to verify if "${guess}" is a valid, correct answer for the topic card "${topicTitle}".
    
    Be supportive of the player:
    - Be highly forgiving of search typos, minor spelling errors, accents, and capitalizations.
    - If they type just a last name (e.g. "Klose" or "Rooney"), verify if the prominent player of that surname satisfies the category. If yes, count it as CORRECT!
    - Ensure your decision is strictly factually accurate. Do not let players guess random false names.
    
    Return a strict JSON response:
    {
      "isCorrect": boolean,
      "officialName": "string (the standard, properly capitalized full name of the matching entity, e.g. 'Miroslav Klose')",
      "rationale": "string (a brief 1-sentence friendly confirmation with proof of why they match, e.g. 'Miroslav Klose has scored a World Cup hat-trick and played for Bayern Munich.')"
    }`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          required: ["isCorrect", "officialName", "rationale"],
          properties: {
            isCorrect: { type: import_genai.Type.BOOLEAN },
            officialName: { type: import_genai.Type.STRING },
            rationale: { type: import_genai.Type.STRING }
          }
        }
      }
    });
    const vetting = JSON.parse(response.text.trim());
    return res.json({
      success: vetting.isCorrect,
      officialName: vetting.officialName || guess,
      rationale: vetting.rationale
    });
  } catch (error) {
    console.error("Referee card-game verification failed:", error);
    return res.json({
      success: true,
      officialName: guess,
      rationale: "Referee approved this on technical VAR review!"
    });
  }
});
app.post("/api/card-game/get-possible-answers", async (req, res) => {
  const theme = req.body.theme || "football";
  const { topicTitle } = req.body;
  const ai = getGemini();
  if (!topicTitle) {
    return res.status(400).json({ answers: [] });
  }
  if (!ai) {
    return res.json({
      answers: [
        "Offline mode. Possible answers are unavailable without Gemini.",
        "Submit guesses to let the referee check them!"
      ]
    });
  }
  try {
    const prompt = `Provide a list of 10-15 correct, famous examples of answers for the trivia topic card of theme "${theme}":
    Topic Card: "${topicTitle}"
    
    Return a strict JSON format containing a list of strings:
    {
      "answers": ["Answer 1", "Answer 2", "Answer 3", ...]
    }`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          required: ["answers"],
          properties: {
            answers: {
              type: import_genai.Type.ARRAY,
              items: { type: import_genai.Type.STRING }
            }
          }
        }
      }
    });
    const data = JSON.parse(response.text.trim());
    return res.json(data);
  } catch (error) {
    console.error("Error getting possible answers:", error);
    return res.json({ answers: [] });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
