// Real image and asset URLs for Football Trivia Arena

// 1. Nationality country code mapper for flagcdn.com (including exhaustiveness)
export const COUNTRY_FLAG_CODES: { [key: string]: string } = {
  "portugal": "pt",
  "argentina": "ar",
  "france": "fr",
  "sweden": "se",
  "belgium": "be",
  "croatia": "hr",
  "norway": "no",
  "england": "gb-eng",
  "spain": "es",
  "brazil": "br",
  "uruguay": "uy",
  "germany": "de",
  "italy": "it",
  "netherlands": "nl",
  "switzerland": "ch",
  "poland": "pl",
  "senegal": "sn",
  "egypt": "eg",
  "united states": "us",
  "usa": "us",
  "wales": "gb-wls",
  "scotland": "gb-sct",
  "ireland": "ie",
  "united kingdom": "gb",
  "uk": "gb",
  "canada": "ca",
  "australia": "au",
  "colombia": "co",
  "chile": "cl",
  "japan": "jp",
  "south korea": "kr",
  "mexico": "mx",
  "india": "in",
  "china": "cn",
  "jamaica": "jm",
  "nigeria": "ng",
  "south africa": "za",
  "new zealand": "nz",
  "austria": "at",
  "ivory coast": "ci",
  "cote d'ivoire": "ci",
  "ghana": "gh",
  "cameroon": "cm",
  "morocco": "ma",
  "algeria": "dz",
  "tunisia": "tn",
  "turkey": "tr",
  "greece": "gr",
  "ukraine": "ua",
  "denmark": "dk",
  "finland": "fi",
  "hungary": "hu",
  "czech republic": "cz",
  "romania": "ro"
};

export function getFlagUrl(nationality: string): string {
  if (!nationality) return "https://flagcdn.com/w40/un.png";
  const norm = nationality.toLowerCase().trim();
  const code = COUNTRY_FLAG_CODES[norm];
  if (code) {
    return `https://flagcdn.com/w40/${code}.png`;
  }
  // Try finding substring
  for (const country of Object.keys(COUNTRY_FLAG_CODES)) {
    if (norm.includes(country) || country.includes(norm)) {
      return `https://flagcdn.com/w40/${COUNTRY_FLAG_CODES[country]}.png`;
    }
  }
  // Return United Nations flag as standard high fidelity photographic substitute flag rather than an emoji
  return "https://flagcdn.com/w40/un.png";
}

// 2. High-quality human photo portrait list for smart hashing fallbacks
// This guarantees that any player, partner, or manager always gets a high fidelity human photograph representation!
export const PORTRAIT_FALLBACKS = [
  "https://images.unsplash.com/photo-1543326119-7053de017531?auto=format&fit=crop&q=80&w=300", // Soccer Player green
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=300", // Professional athlete stance
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=300", // Athlete fitness portrait
  "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=300", // Professional Manager/Coach looking focused
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300", // Manager suite portrait
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300", // Active male candidate face
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300", // Female athlete headshot
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300", // Smiling male portrait
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300", // Candid human portrait 1
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=300", // Candid human portrait 2
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300", // Focused younger player face
  "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=300", // Young athletic face
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300", // Female professional director profile
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=300"  // Pop artist/Musician style
];

function getDeterministicNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getFallbackPortrait(name: string): string {
  const hash = getDeterministicNumber(name);
  const idx = hash % PORTRAIT_FALLBACKS.length;
  return PORTRAIT_FALLBACKS[idx];
}

// 3. Wikipedia & high-quality Wikimedia Commons headshots for players, musicians, and film stars
export const PLAYER_PHOTOS: { [key: string]: string } = {
  // Football db players
  "messi": "https://upload.wikimedia.org/wikipedia/commons/c/c1/Lionel_Messi_20180626.jpg",
  "ronaldo": "https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg",
  "lampard": "https://upload.wikimedia.org/wikipedia/commons/6/62/Frank_Lampard_on_15_August_2018_%28cropped%29.jpg",
  "frank lampard": "https://upload.wikimedia.org/wikipedia/commons/6/62/Frank_Lampard_on_15_August_2018_%28cropped%29.jpg",
  "hazard": "https://upload.wikimedia.org/wikipedia/commons/2/23/Eden_Hazard_2018.jpg",
  "eden hazard": "https://upload.wikimedia.org/wikipedia/commons/2/23/Eden_Hazard_2018.jpg",
  "palmer": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Cole_Palmer_Chelsea_v_Burnley_2024.jpg",
  "cole palmer": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Cole_Palmer_Chelsea_v_Burnley_2024.jpg",
  "haaland": "https://upload.wikimedia.org/wikipedia/commons/0/07/Erling_Haaland_2023.jpg",
  "erling haaland": "https://upload.wikimedia.org/wikipedia/commons/0/07/Erling_Haaland_2023.jpg",
  "de bruyne": "https://upload.wikimedia.org/wikipedia/commons/4/40/Kevin_De_Bruyne_20180609.jpg",
  "kevin de bruyne": "https://upload.wikimedia.org/wikipedia/commons/4/40/Kevin_De_Bruyne_20180609.jpg",
  "kdb": "https://upload.wikimedia.org/wikipedia/commons/4/40/Kevin_De_Bruyne_20180609.jpg",
  "benzema": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Karim_Benzema_v_Al-Hilal%2C_Saudi_Super_Cup_2024.jpg",
  "karim benzema": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Karim_Benzema_v_Al-Hilal%2C_Saudi_Super_Cup_2024.jpg",
  "henry": "https://upload.wikimedia.org/wikipedia/commons/5/55/Thierry_Henry_2014.jpg",
  "thierry henry": "https://upload.wikimedia.org/wikipedia/commons/5/55/Thierry_Henry_2014.jpg",
  "terry": "https://upload.wikimedia.org/wikipedia/commons/d/de/John_Terry_2017.jpg",
  "john terry": "https://upload.wikimedia.org/wikipedia/commons/d/de/John_Terry_2017.jpg",
  "drogba": "https://upload.wikimedia.org/wikipedia/commons/b/b8/Didier_Drogba_2015_%28cropped%29.jpg",
  "didier drogba": "https://upload.wikimedia.org/wikipedia/commons/b/b8/Didier_Drogba_2015_%28cropped%29.jpg",
  "bergkamp": "https://upload.wikimedia.org/wikipedia/commons/d/da/Dennis_Bergkamp_Legends_2016.jpg",
  "dennis bergkamp": "https://upload.wikimedia.org/wikipedia/commons/d/da/Dennis_Bergkamp_Legends_2016.jpg",
  "gerrard": "https://upload.wikimedia.org/wikipedia/commons/d/dd/Steven_Gerrard_2015.jpg",
  "steven gerrard": "https://upload.wikimedia.org/wikipedia/commons/d/dd/Steven_Gerrard_2015.jpg",
  "kante": "https://upload.wikimedia.org/wikipedia/commons/5/53/N%27Golo_Kant%C3%A9_2018.jpg",
  "n'golo kante": "https://upload.wikimedia.org/wikipedia/commons/5/53/N%27Golo_Kant%C3%A9_2018.jpg",
  "ngolo kante": "https://upload.wikimedia.org/wikipedia/commons/5/53/N%27Golo_Kant%C3%A9_2018.jpg",
  "van dijk": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Virgil_van_Dijk_2022.jpg",
  "virgil van dijk": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Virgil_van_Dijk_2022.jpg",
  "vvd": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Virgil_van_Dijk_2022.jpg",
  "salah": "https://upload.wikimedia.org/wikipedia/commons/c/c1/Mohamed_Salah_2018.jpg",
  "mohamed salah": "https://upload.wikimedia.org/wikipedia/commons/c/c1/Mohamed_Salah_2018.jpg",
  "mo salah": "https://upload.wikimedia.org/wikipedia/commons/c/c1/Mohamed_Salah_2018.jpg",
  "modric": "https://upload.wikimedia.org/wikipedia/commons/e/e9/Luka_Modri%C4%87_2018.jpg",
  "luka modric": "https://upload.wikimedia.org/wikipedia/commons/e/e9/Luka_Modri%C4%87_2018.jpg",
  "kroos": "https://upload.wikimedia.org/wikipedia/commons/1/12/Toni_Kroos_2018.jpg",
  "toni kroos": "https://upload.wikimedia.org/wikipedia/commons/1/12/Toni_Kroos_2018.jpg",
  "ibrahimovic": "https://upload.wikimedia.org/wikipedia/commons/0/01/Zlatan_Ibrahimgovic_June_2018.jpg",
  "zlatan": "https://upload.wikimedia.org/wikipedia/commons/0/01/Zlatan_Ibrahimgovic_June_2018.jpg",
  "kane": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Harry_Kane_2018.jpg",
  "harry kane": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Harry_Kane_2018.jpg",
  "zidane": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Zinedine_Zidane_by_Tasnim_01.jpg",
  "zinedine zidane": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Zinedine_Zidane_by_Tasnim_01.jpg",
  "ronaldinho": "https://upload.wikimedia.org/wikipedia/commons/e/e8/Ronaldinho_in_2019.jpg",
  "rooney": "https://upload.wikimedia.org/wikipedia/commons/1/10/Wayne_Rooney_2014.jpg",
  "wayne rooney": "https://upload.wikimedia.org/wikipedia/commons/1/10/Wayne_Rooney_2014.jpg",
  "suarez": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Luis_Su%C3%A1rez_2018.jpg",
  "luis suarez": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Luis_Su%C3%A1rez_2018.jpg",
  "lineker": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Gary_Lineker_sculpture_copy_copy.jpg",
  "gary lineker": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Gary_Lineker_sculpture_copy_copy.jpg",
  "shearer": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Alan_Shearer_St_James%27_Park.jpg",
  "alan shearer": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Alan_Shearer_St_James%27_Park.jpg",
  "bellingham": "https://upload.wikimedia.org/wikipedia/commons/0/0f/Jude_Bellingham_2024.jpg",
  "jude bellingham": "https://upload.wikimedia.org/wikipedia/commons/0/0f/Jude_Bellingham_2024.jpg",
  "mbappe": "https://upload.wikimedia.org/wikipedia/commons/5/53/Kylian_Mbapp%C3%A9_Pr%C3%A9sentation_Real_Madrid_%28cropped%29.jpg",
  "kylian mbappe": "https://upload.wikimedia.org/wikipedia/commons/5/53/Kylian_Mbapp%C3%A9_Pr%C3%A9sentation_Real_Madrid_%28cropped%29.jpg",
  "saka": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Bukayo_Saka_at_the_2022_FIFA_World_Cup_vs_Iran_%28cropped%29.jpg",
  "bukayo saka": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Bukayo_Saka_at_the_2022_FIFA_World_Cup_vs_Iran_%28cropped%29.jpg",
  "foden": "https://upload.wikimedia.org/wikipedia/commons/e/ea/Phil_Foden_2022_%28cropped%29.jpg",
  "phil foden": "https://upload.wikimedia.org/wikipedia/commons/e/ea/Phil_Foden_2022_%28cropped%29.jpg",
  "iniesta": "https://upload.wikimedia.org/wikipedia/commons/6/67/Andres_Iniesta_2018.jpg",
  "andres iniesta": "https://upload.wikimedia.org/wikipedia/commons/6/67/Andres_Iniesta_2018.jpg",
  "xavi": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Xavi_Hernandez_with_AlSadd_Sport_Club.jpg",
  "xavi hernandez": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Xavi_Hernandez_with_AlSadd_Sport_Club.jpg",
  "neymar": "https://upload.wikimedia.org/wikipedia/commons/8/83/Bra-Cos_%281%29_%28cropped%29.jpg",
  "neymar jr": "https://upload.wikimedia.org/wikipedia/commons/8/83/Bra-Cos_%281%29_%28cropped%29.jpg",

  // Music Artists / Bands
  "taylor swift": "https://upload.wikimedia.org/wikipedia/commons/b/b8/Taylor_Swift_at_the_2018_American_Music_Awards_%28cropped%29.jpg",
  "swift": "https://upload.wikimedia.org/wikipedia/commons/b/b8/Taylor_Swift_at_the_2018_American_Music_Awards_%28cropped%29.jpg",
  "the weeknd": "https://upload.wikimedia.org/wikipedia/commons/f/f1/The_Weeknd_Cannes_2023_2_%28cropped%29.jpg",
  "weeknd": "https://upload.wikimedia.org/wikipedia/commons/f/f1/The_Weeknd_Cannes_2023_2_%28cropped%29.jpg",
  "drake": "https://upload.wikimedia.org/wikipedia/commons/2/28/Drake_at_The_Come_Up_Show_Live.jpg",
  "bad bunny": "https://upload.wikimedia.org/wikipedia/commons/f/f1/Bad_Bunny_El_Ultimo_Tour_Del_Mundo_2022_%28cropped%29.jpg",
  "ed sheeran": "https://upload.wikimedia.org/wikipedia/commons/c/c1/Ed_Sheeran_2018.jpg",
  "sheeran": "https://upload.wikimedia.org/wikipedia/commons/c/c1/Ed_Sheeran_2018.jpg",
  "justin bieber": "https://upload.wikimedia.org/wikipedia/commons/d/da/Justin_Bieber_in_2015_by_Lou_Stejskal.jpg",
  "bieber": "https://upload.wikimedia.org/wikipedia/commons/d/da/Justin_Bieber_in_2015_by_Lou_Stejskal.jpg",
  "ariana grande": "https://upload.wikimedia.org/wikipedia/commons/d/dd/Ariana_Grande_at_the_Met_Gala_2024_%28cropped%29.jpg",
  "grande": "https://upload.wikimedia.org/wikipedia/commons/d/dd/Ariana_Grande_at_the_Met_Gala_2024_%28cropped%29.jpg",
  "eminem": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Eminem_by_George_De_Sota_2002.jpg",
  "bruno mars": "https://upload.wikimedia.org/wikipedia/commons/b/b0/Bruno_Mars_at_the_2018_Grammy_Awards_%28cropped%29.jpg",
  "post malone": "https://upload.wikimedia.org/wikipedia/commons/f/f6/Post_Malone_at_the_Pre-Grammy_Gala_2020_%28cropped%29.jpg",
  "the beatles": "https://upload.wikimedia.org/wikipedia/commons/d/df/The_Beatles_members_at_the_arrival_of_John_Lennon_Airport_cropped.jpg",
  "beatles": "https://upload.wikimedia.org/wikipedia/commons/d/df/The_Beatles_members_at_the_arrival_of_John_Lennon_Airport_cropped.jpg",
  "queen": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Queen_rock_band_1976.jpg",
  "pink floyd": "https://upload.wikimedia.org/wikipedia/commons/2/2a/Pink_Floyd_-_1971.jpg",
  "led zeppelin": "https://upload.wikimedia.org/wikipedia/commons/4/4c/Led_Zeppelin_group_1973.jpg",
  "coldplay": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Coldplay_Chorz%C3%B3w_2022_07.jpg",
  "the rolling stones": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Rolling_Stones_1975_Promo.jpg",
  "rolling stones": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Rolling_Stones_1975_Promo.jpg",
  "oasis": "https://upload.wikimedia.org/wikipedia/commons/0/0e/Oasis_1994_WhiteRoom.png",
  "radiohead": "https://upload.wikimedia.org/wikipedia/commons/5/53/Radiohead_concert_in_Barcelona_2016_%28cropped%29.jpg",
  "michael jackson": "https://upload.wikimedia.org/wikipedia/commons/3/31/Michael_Jackson_in_1984.jpg",
  "jackson": "https://upload.wikimedia.org/wikipedia/commons/3/31/Michael_Jackson_in_1984.jpg",
  "beyonce": "https://upload.wikimedia.org/wikipedia/commons/1/17/Beyonc%C3%A9_at_the_2016_MTV_Video_Music_Awards.jpg",
  "harry styles": "https://upload.wikimedia.org/wikipedia/commons/8/87/Harry_Styles_at_the_2022_Toronto_International_Film_Festival_%28cropped%29.jpg",
  "justin timberlake": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Justin_Timberlake_by_Gage_Skidmore_2.jpg",
  "paul mccartney": "https://upload.wikimedia.org/wikipedia/commons/d/d6/Paul_McCartney_in_October_2018.jpg",
  "john lennon": "https://upload.wikimedia.org/wikipedia/commons/8/85/John_Lennon_1969_cropped.jpg",
  "madonna": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Madonna_by_Gage_Skidmore_2019_%28cropped%29.jpg",
  "rihanna": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Rihanna_at_Fenty_Beauty_launch%2C_September_2017.jpg",
  "whitney houston": "https://upload.wikimedia.org/wikipedia/commons/f/f5/Whitney_Houston_Welcome_Home_Heroes_1991_03_%28cropped%29.jpg",
  "daft punk": "https://upload.wikimedia.org/wikipedia/commons/0/05/Daft_Punk_at_the_Grammys_2014.jpg",
  "avicii": "https://upload.wikimedia.org/wikipedia/commons/2/23/Avicii_2014_003.jpg",
  "calvin harris": "https://upload.wikimedia.org/wikipedia/commons/3/3b/Calvin_Harris_at_the_Grammy_Awards_2012.jpg",
  "david guetta": "https://upload.wikimedia.org/wikipedia/commons/3/33/David_Guetta_at_the_Grammy_Awards_2013.jpg",

  // Film Stars / Directors / Movies
  "joaquin phoenix": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Joaquin_Phoenix_at_the_2018_Cannes_Film_Festival_%28cropped%29.jpg",
  "phoenix": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Joaquin_Phoenix_at_the_2018_Cannes_Film_Festival_%28cropped%29.jpg",
  "leonardo dicaprio": "https://upload.wikimedia.org/wikipedia/commons/2/25/Leonardo_DiCaprio_2014.jpg",
  "dicaprio": "https://upload.wikimedia.org/wikipedia/commons/2/25/Leonardo_DiCaprio_2014.jpg",
  "tom hanks": "https://upload.wikimedia.org/wikipedia/commons/a/a9/Tom_Hanks_TIFF_2019.jpg",
  "hanks": "https://upload.wikimedia.org/wikipedia/commons/a/a9/Tom_Hanks_TIFF_2019.jpg",
  "daniel day-lewis": "https://upload.wikimedia.org/wikipedia/commons/b/ba/Daniel_Day-Lewis_-_Golden_Globes_2013_%28cropped%29.jpg",
  "matthew mcconaughey": "https://upload.wikimedia.org/wikipedia/commons/8/8e/Matthew_McConaughey_-_Gold_Geneva_2017_%28cropped%29.jpg",
  "cillian murphy": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Cillian_Murphy_at_the_25th_Irish_Times_Irish_Theatre_Awards_in_2023_%28cropped%29.jpg",
  "murphy": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Cillian_Murphy_at_the_25th_Irish_Times_Irish_Theatre_Awards_in_2023_%28cropped%29.jpg",
  "christian bale": "https://upload.wikimedia.org/wikipedia/commons/0/0a/Christian_Bale-7977_%28cropped%29.jpg",
  "bale": "https://upload.wikimedia.org/wikipedia/commons/0/0a/Christian_Bale-7977_%28cropped%29.jpg",
  "russell crowe": "https://upload.wikimedia.org/wikipedia/commons/a/a7/Russell_Crowe_at_the_Cannes_Film_Festival_2010_%28cropped%29.jpg",
  "crowe": "https://upload.wikimedia.org/wikipedia/commons/a/a7/Russell_Crowe_at_the_Cannes_Film_Festival_2010_%28cropped%29.jpg",
  "anthony hopkins": "https://upload.wikimedia.org/wikipedia/commons/2/25/Anthony_Hopkins_Cannes_2016_2_%28cropped%29.jpg",
  "hopkins": "https://upload.wikimedia.org/wikipedia/commons/2/25/Anthony_Hopkins_Cannes_2016_2_%28cropped%29.jpg",
  "rami malek": "https://upload.wikimedia.org/wikipedia/commons/8/87/Rami_Malek_at_the_2019_Goldene_Kamera_Awards_%28cropped%29.jpg",
  "malek": "https://upload.wikimedia.org/wikipedia/commons/8/87/Rami_Malek_at_the_2019_Goldene_Kamera_Awards_%28cropped%29.jpg",
  "meryl streep": "https://upload.wikimedia.org/wikipedia/commons/4/46/Meryl_Streep_at_the_Tokyo_International_Film_Festival_2016_%28cropped%29.jpg",
  "streep": "https://upload.wikimedia.org/wikipedia/commons/4/46/Meryl_Streep_at_the_Tokyo_International_Film_Festival_2016_%28cropped%29.jpg",
  "christopher nolan": "https://upload.wikimedia.org/wikipedia/commons/9/95/Christopher_Nolan_Cannes_2018.jpg",
  "nolan": "https://upload.wikimedia.org/wikipedia/commons/9/95/Christopher_Nolan_Cannes_2018.jpg",
  "steven spielberg": "https://upload.wikimedia.org/wikipedia/commons/6/67/Steven_Spielberg_by_Gage_Skidmore.jpg",
  "spielberg": "https://upload.wikimedia.org/wikipedia/commons/6/67/Steven_Spielberg_by_Gage_Skidmore.jpg",
  "martin scorsese": "https://upload.wikimedia.org/wikipedia/commons/d/df/Martin_Scorsese_at_the_Berlinale_2024_%28cropped%29.jpg",
  "scorsese": "https://upload.wikimedia.org/wikipedia/commons/d/df/Martin_Scorsese_at_the_Berlinale_2024_%28cropped%29.jpg",
  "quentin tarantino": "https://upload.wikimedia.org/wikipedia/commons/0/0b/Quentin_Tarantino_by_Gage_Skidmore_2019.jpg",
  "tarantino": "https://upload.wikimedia.org/wikipedia/commons/0/0b/Quentin_Tarantino_by_Gage_Skidmore_2019.jpg",
  "james cameron": "https://upload.wikimedia.org/wikipedia/commons/f/fd/James_Cameron_by_Gage_Skidmore.jpg",
  "cameron": "https://upload.wikimedia.org/wikipedia/commons/f/fd/James_Cameron_by_Gage_Skidmore.jpg",
  "avatar": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=300",
  "avengers": "https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&q=80&w=300",
  "titanic": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=300",
  "star wars": "https://images.unsplash.com/photo-1472457897821-70d3819a0e24?auto=format&fit=crop&q=80&w=300",
  "spider-man": "https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&q=80&w=300",
  "jurassic": "https://images.unsplash.com/photo-1547483238-f400e65ccd56?auto=format&fit=crop&q=80&w=300",
  "oppenheimer": "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=300",
  "inception": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=300",
  "interstellar": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=300"
};

export function getPlayerPhoto(name: string, theme?: string): string {
  if (!name) return "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=300";
  const norm = name.toLowerCase().trim();
  for (const key of Object.keys(PLAYER_PHOTOS)) {
    if (norm === key || norm.includes(key) || key.includes(norm)) {
      return PLAYER_PHOTOS[key];
    }
  }

  // Use dynamic deterministic portraits so *every single player* receives an actual high quality photograph!
  return getFallbackPortrait(name);
}

// 4. Manager / Director / Legend photos
export const MANAGER_PHOTOS: { [key: string]: string } = {
  // Football
  "mourinho": "https://upload.wikimedia.org/wikipedia/commons/8/80/Jos%C3%A9_Mourinho_August_2020.jpg",
  "jose mourinho": "https://upload.wikimedia.org/wikipedia/commons/8/80/Jos%C3%A9_Mourinho_August_2020.jpg",
  "guardiola": "https://upload.wikimedia.org/wikipedia/commons/0/02/Pep_Guardiola_2015.jpg",
  "pep guardiola": "https://upload.wikimedia.org/wikipedia/commons/0/02/Pep_Guardiola_2015.jpg",
  "klopp": "https://upload.wikimedia.org/wikipedia/commons/c/c5/J%C3%BCrgen_Klopp%2C_Liverpool_FC_manager_%28cropped%29.jpg",
  "jurgen klopp": "https://upload.wikimedia.org/wikipedia/commons/c/c5/J%C3%BCrgen_Klopp%2C_Liverpool_FC_manager_%28cropped%29.jpg",
  "ancelotti": "https://upload.wikimedia.org/wikipedia/commons/1/1d/Carlo_Ancelotti_2021.jpg",
  "carlo ancelotti": "https://upload.wikimedia.org/wikipedia/commons/1/1d/Carlo_Ancelotti_2021.jpg",
  "ferguson": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Alex_Ferguson_2009.jpg",
  "alex ferguson": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Alex_Ferguson_2009.jpg",
  "wenger": "https://upload.wikimedia.org/wikipedia/commons/8/8b/Ars%C3%A8ne_Wenger_2014.jpg",
  "arsene wenger": "https://upload.wikimedia.org/wikipedia/commons/8/8b/Ars%C3%A8ne_Wenger_2014.jpg",
  "conte": "https://upload.wikimedia.org/wikipedia/commons/2/27/Antonio_Conte_2017.jpg",
  "antonio conte": "https://upload.wikimedia.org/wikipedia/commons/2/27/Antonio_Conte_2017.jpg",
  "solskjaer": "https://upload.wikimedia.org/wikipedia/commons/a/af/Ole_Gunnar_Solskj%C3%A6r_2019_%28cropped%29.jpg",
  "ole gunnar solskjaer": "https://upload.wikimedia.org/wikipedia/commons/a/af/Ole_Gunnar_Solskj%C3%A6r_2019_%28cropped%29.jpg",
  "tuchel": "https://upload.wikimedia.org/wikipedia/commons/d/df/Thomas_Tuchel_2020.jpg",
  "thomas tuchel": "https://upload.wikimedia.org/wikipedia/commons/d/df/Thomas_Tuchel_2020.jpg",
  "ten hag": "https://upload.wikimedia.org/wikipedia/commons/2/24/Erik_ten_Hag_2022_%28cropped%29.jpg",
  "erik ten hag": "https://upload.wikimedia.org/wikipedia/commons/2/24/Erik_ten_Hag_2022_%28cropped%29.jpg",
  "deschamps": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Didier_Deschamps_2018.jpg",
  "didier deschamps": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Didier_Deschamps_2018.jpg",
  "scaloni": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Lionel_Scaloni_Qatar_2022.jpg",
  "lionel scaloni": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Lionel_Scaloni_Qatar_2022.jpg",
  "maradona": "https://upload.wikimedia.org/wikipedia/commons/b/b1/Diego_Maradona_2018.jpg",
  "diego maradona": "https://upload.wikimedia.org/wikipedia/commons/b/b1/Diego_Maradona_2018.jpg",

  // Film (additional director map safety)
  "nolan": "https://upload.wikimedia.org/wikipedia/commons/9/95/Christopher_Nolan_Cannes_2018.jpg",
  "spielberg": "https://upload.wikimedia.org/wikipedia/commons/6/67/Steven_Spielberg_by_Gage_Skidmore.jpg",
  "scorsese": "https://upload.wikimedia.org/wikipedia/commons/d/df/Martin_Scorsese_at_the_Berlinale_2024_%28cropped%29.jpg",
  "tarantino": "https://upload.wikimedia.org/wikipedia/commons/0/0b/Quentin_Tarantino_by_Gage_Skidmore_2019.jpg",
  "cameron": "https://upload.wikimedia.org/wikipedia/commons/f/fd/James_Cameron_by_Gage_Skidmore.jpg"
};

export function getManagerPhoto(name: string, theme?: string): string {
  if (!name) return "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=300";
  const norm = name.toLowerCase().trim();
  for (const key of Object.keys(MANAGER_PHOTOS)) {
    if (norm === key || norm.includes(key)) {
      return MANAGER_PHOTOS[key];
    }
  }

  // Fallback to the human portrait generator so *every single manager* gets an actual photograph!
  return getFallbackPortrait(name);
}

// 5. Club logos / visual thumbnails / crests
// 5. Club logos / visual thumbnails / crests
export const CLUB_IDENTIFIERS: { [key: string]: number } = {
  // English Clubs
  "manchester united": 33,
  "man united": 33,
  "man utd": 33,
  "manchester city": 50,
  "man city": 50,
  "chelsea": 49,
  "chelsea fc": 49,
  "liverpool": 40,
  "liverpool fc": 40,
  "arsenal": 42,
  "arsenal fc": 42,
  "tottenham": 47,
  "tottenham hotspur": 47,
  "spurs": 47,
  "west ham": 48,
  "west ham united": 48,
  "west ham united fc": 48,
  "leicester city": 46,
  "leicester": 46,
  "nottingham forest": 65,
  "aston villa": 66,
  "southampton": 41,
  "everton": 45,
  "wolves": 39,
  "wolverhampton": 39,
  "wolverhampton wanderers": 39,
  "newcastle": 34,
  "newcastle united": 34,
  "crystal palace": 52,
  "fulham": 36,
  "brentford": 55,
  "brighton": 51,
  "leeds": 63,
  "leeds united": 63,
  "norwich": 71,
  "watford": 38,
  
  // Spanish Clubs
  "real madrid": 541,
  "real madrid cf": 541,
  "barcelona": 529,
  "fc barcelona": 529,
  "barca": 529,
  "atletico madrid": 530,
  "atletico": 530,
  "sevilla": 536,
  "sevilla fc": 536,
  "real sociedad": 548,
  "villarreal": 533,
  "athletic bilbao": 531,
  "athletic club": 531,
  "bilbao": 531,
  "valencia": 532,
  "valencia cf": 532,
  "real betis": 543,
  "betis": 543,
  "girona": 547,
  "espanyol": 540,
  "getafe": 546,
  "almeria": 724,
  "celta vigo": 538,
  "osasuna": 542,
  
  // Italian Clubs
  "inter milan": 505,
  "internazionale": 505,
  "inter": 505,
  "fc internazionale": 505,
  "ac milan": 489,
  "milan": 489,
  "juventus": 496,
  "juve": 496,
  "roma": 497,
  "as roma": 497,
  "napoli": 492,
  "ssc napoli": 492,
  "lazio": 487,
  "atalanta": 499,
  "fiorentina": 502,
  "monza": 503,
  "brescia": 512,
  "genoa": 495,
  "reggina": 4405,
  "sampdoria": 498,
  "bologna": 500,
  "torino": 504,
  "sassuolo": 488,
  "udinese": 494,
  "lecce": 491,
  "parma": 501,
  "verona": 506,
  "lumezzane": 2104,
  
  // German Clubs
  "bayern munich": 157,
  "bayern": 157,
  "fc bayern": 157,
  "borussia dortmund": 165,
  "dortmund": 165,
  "bvb": 165,
  "bayer leverkusen": 168,
  "leverkusen": 168,
  "rb leipzig": 173,
  "leipzig": 173,
  "borussia monchengladbach": 163,
  "monchengladbach": 163,
  "wolfsburg": 161,
  "vfl wolfsburg": 161,
  "borussia wolfsburg": 161,
  "werder bremen": 162,
  "schalke": 174,
  "schalke 04": 174,
  "eintracht frankfurt": 169,
  "frankfurt": 169,
  "stuttgart": 172,
  "freiburg": 160,
  "hoffenheim": 167,
  "mainz": 164,
  "hertha berlin": 159,
  "koln": 166,
  "cologne": 166,
  "hamburger sv": 175,
  "hamburg": 175,
  "karlsruher sc": 192,
  
  // French Clubs
  "psg": 85,
  "paris saint-germain": 85,
  "paris sg": 85,
  "monaco": 91,
  "monaco fc": 91,
  "as monaco": 91,
  "lyon": 80,
  "olympique lyonnais": 80,
  "marseille": 81,
  "olympique de marseille": 81,
  "lille": 79,
  "losc lille": 79,
  "nice": 84,
  "ogc nice": 84,
  "rennes": 94,
  "stade rennais": 94,
  "lens": 116,
  "rc lens": 116,
  "nantes": 83,
  "boulogne": 3826,
  "caen": 88,
  "le mans": 225,
  "guingamp": 217,
  "reims": 93,
  "strasbourg": 95,
  "toulouse": 96,
  "montpellier": 82,

  // Portuguese Clubs
  "benfica": 211,
  "sl benfica": 211,
  "porto": 212,
  "fc porto": 212,
  "sporting cp": 228,
  "sporting lisbon": 228,
  "sporting": 228,
  "braga": 217,
  "vitoria guimaraes": 220,

  // Dutch Clubs
  "ajax": 194,
  "ajax amsterdam": 194,
  "psv": 197,
  "psv eindhoven": 197,
  "feyenoord": 209,
  "feyenoord rotterdam": 209,
  "groningen": 195,
  "fc groningen": 195,
  "alkmaar": 191,
  "az alkmaar": 191,
  "twente": 204,
  "utrecht": 205,

  // MLS Clubs
  "inter miami": 1605,
  "inter miami cf": 1605,
  "la galaxy": 1602,
  "los angeles galaxy": 1602,
  "new york city fc": 1608,
  "new york city": 1608,
  "new york red bulls": 1611,
  "montreal impact": 1615,
  "cf montreal": 1615,
  "phoenix rising": 1888,
  "lafc": 1616,
  "los angeles fc": 1616,
  "seattle sounders": 1595,
  "atlanta united": 1601,
  "toronto fc": 1604,

  // Saudi Arabian Clubs
  "al nassr": 2939,
  "al-nassr": 2939,
  "al hilal": 2936,
  "al-hilal": 2936,
  "al ittihad": 2938,
  "al-ittihad": 2938,
  "al ahli": 2931,
  "al-ahli": 2931,
  "al ettifaq": 2935,
  "al-ettifaq": 2935,
  "al shabab": 2932,
  "al-shabab": 2932,

  // Other European / Rest of World Clubs
  "celtic": 247,
  "celtic fc": 247,
  "rangers": 252,
  "rangers fc": 252,
  "shakhtar": 550,
  "shakhtar donetsk": 550,
  "dynamo kyiv": 570,
  "zenit": 558,
  "boca juniors": 1007,
  "river plate": 1010,
  "corinthians": 131,
  "cruzeiro": 125,
  "botafogo": 120,
  "flamengo": 127,
  "palmeiras": 121,
  "santos": 128,
  "sao paulo": 126,
  "galatasaray": 359,
  "fenerbahce": 361,
  "besiktas": 362,
  "adana demirspor": 3551,
  "bryne": 2018,
  "molde": 2590,
  "molde fk": 2590,
  "salzburg": 187,
  "red bull salzburg": 187,
  "genk": 111,
  "krc genk": 111,
  "basel": 181,
  "fc basel": 181,
  "sion": 277,
  "fc sion": 277,
  "dinamo zagreb": 434,
  "zrinjski mostar": 2227,
  "inter zapresic": 2289,
  "malmo ff": 317,
  "malmo": 317,
  "shanghai shenhua": 1242,
  "el mokawloon": 1059,
};

export const CLUB_LOGOS: { [key: string]: string } = {
  "fc barcelona": "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
  "barcelona": "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
  "chelsea": "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg",
  "chelsea fc": "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg",
  "real madrid": "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
  "real madrid cf": "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
  "psg": "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg",
  "paris saint-germain": "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg",
  "inter miami": "https://upload.wikimedia.org/wikipedia/en/1/14/Inter_Miami_CF_logo.svg",
  "inter miami cf": "https://upload.wikimedia.org/wikipedia/en/1/14/Inter_Miami_CF_logo.svg",
  "sporting cp": "https://upload.wikimedia.org/wikipedia/en/3/3e/Sporting_Clube_de_Portugal.svg",
  "sporting lisbon": "https://upload.wikimedia.org/wikipedia/en/3/3e/Sporting_Clube_de_Portugal.svg",
  "manchester united": "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg",
  "juventus": "https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg",
  "al nassr": "https://upload.wikimedia.org/wikipedia/en/c/c7/Al-Nassr_FC_logo.svg",
  "al-nassr": "https://upload.wikimedia.org/wikipedia/en/c/c7/Al-Nassr_FC_logo.svg",
  "manchester city": "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
  "arsenal": "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
  "liverpool": "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
  "bayern munich": "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg",
  "borussia dortmund": "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg",
  "boca juniors": "https://upload.wikimedia.org/wikipedia/commons/e/ee/Boca_crest.svg",
  "river plate": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Escudo_del_C_A_River_Plate.svg",
  "tottenham": "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg",
  "tottenham hotspur": "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg",
  "inter milan": "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021_logo.svg",
  "ac milan": "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg",
  "lille": "https://upload.wikimedia.org/wikipedia/commons/5/55/LOSC_Lille_crest_2018.svg",
  "lyon": "https://upload.wikimedia.org/wikipedia/en/c/c6/Olympique_Lyonnais_logo.svg",
  "marseille": "https://upload.wikimedia.org/wikipedia/commons/b/b1/Olympique_de_Marseille_logo.svg",
  "west ham": "https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg",
  "roma": "https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg",
  "napoli": "https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Napoli_2024.svg",
  "al hilal": "https://upload.wikimedia.org/wikipedia/en/b/bc/Al_Hilal_SFC_logo.svg",
  "leicester city": "https://upload.wikimedia.org/wikipedia/en/2/2d/Leicester_City_FC_crest.svg",
  "benfica": "https://upload.wikimedia.org/wikipedia/en/a/a2/SL_Benfica_logo.svg",
  "porto": "https://upload.wikimedia.org/wikipedia/en/f/f1/FC_Porto.svg",
  "ajax": "https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg",
  "nottingham forest": "https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg",
  "aston villa": "https://upload.wikimedia.org/wikipedia/en/f/f9/Aston_Villa_FC_crest_%282016%29.svg",
  "al ittihad": "https://upload.wikimedia.org/wikipedia/en/2/2a/Al-Ittihad_Saudi_Club_logo.svg",
  "al-ittihad": "https://upload.wikimedia.org/wikipedia/en/2/2a/Al-Ittihad_Saudi_Club_logo.svg",
  "new york city fc": "https://upload.wikimedia.org/wikipedia/en/f/f6/New_York_City_FC_badge.svg",
  "new york city": "https://upload.wikimedia.org/wikipedia/en/f/f6/New_York_City_FC_badge.svg",
  "new york red bulls": "https://upload.wikimedia.org/wikipedia/en/1/14/New_York_Red_Bulls_logo.svg",
  "west ham united": "https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg",
  "monaco": "https://upload.wikimedia.org/wikipedia/en/a/ad/AS_Monaco_FC_crest.svg",
  "monaco fc": "https://upload.wikimedia.org/wikipedia/en/a/ad/AS_Monaco_FC_crest.svg",
  "salzburg": "https://upload.wikimedia.org/wikipedia/en/8/80/FC_Red_Bull_Salzburg_logo.svg",
  "red bull salzburg": "https://upload.wikimedia.org/wikipedia/en/8/80/FC_Red_Bull_Salzburg_logo.svg",
  "dortmund": "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg",
  "molde": "https://upload.wikimedia.org/wikipedia/en/3/3a/Molde_FK_logo.svg",
  "werder bremen": "https://upload.wikimedia.org/wikipedia/en/b/be/SV-Werder-Bremen-Logo.svg",
  "wolfsburg": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Logo_VfL_Wolfsburg.svg",
  "borussia wolfsburg": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Logo_VfL_Wolfsburg.svg",
  "genk": "https://upload.wikimedia.org/wikipedia/en/c/cd/KRC_Genk_logo.svg",
};

export function getClubLogo(clubName: string, theme?: string): string {
  if (!clubName) return "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=150";
  const norm = clubName.toLowerCase().trim();

  // 1. Check API-Football ID Map (cross-referencing with official API values)
  for (const key of Object.keys(CLUB_IDENTIFIERS)) {
    if (norm === key || norm.includes(key) || key.includes(norm)) {
      return `https://media.api-sports.io/football/teams/${CLUB_IDENTIFIERS[key]}.png`;
    }
  }

  // 2. Check traditional local standard Wikimedia backup
  for (const key of Object.keys(CLUB_LOGOS)) {
    if (norm === key || norm.includes(key) || key.includes(norm)) {
      return CLUB_LOGOS[key];
    }
  }

  if (theme === 'music') {
    return "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=150"; // Vinyl compilation
  }
  if (theme === 'movies') {
    return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=150"; // Cinema/Studio fallback
  }

  // Return a stunning professional soccer stadium/field photographic background as a club fallback
  return "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=150";
}

// 6. League logos / visual thumbnails / Studios
export const LEAGUE_LOGOS: { [key: string]: string } = {
  // Football Leagues
  "premier league": "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg",
  "la liga": "https://upload.wikimedia.org/wikipedia/commons/0/0f/LaLiga_logo_2023.svg",
  "serie a": "https://upload.wikimedia.org/wikipedia/commons/e/e9/Serie_A_logo_2024.svg",
  "bundesliga": "https://upload.wikimedia.org/wikipedia/commons/d/df/Bundesliga_logo_%282017%29.svg",
  "ligue 1": "https://upload.wikimedia.org/wikipedia/commons/9/9b/Ligue_1_logo_2024.svg",
  "champions league": "https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg",
  "uefa champions league": "https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg",
  "mls": "https://upload.wikimedia.org/wikipedia/commons/7/76/MLS_crest_logo_RGB_gradient.svg",
  "major league soccer": "https://upload.wikimedia.org/wikipedia/commons/7/76/MLS_crest_logo_RGB_gradient.svg",
  "primeira liga": "https://upload.wikimedia.org/wikipedia/commons/0/0e/Liga_Portugal_2023.svg",
  "saudi pro league": "https://upload.wikimedia.org/wikipedia/commons/c/cb/Saudi_Pro_League_Spl_logo.png",
  "championship": "https://upload.wikimedia.org/wikipedia/en/4/45/EFL_Championship_logo.svg",
  "eredivisie": "https://upload.wikimedia.org/wikipedia/commons/0/0f/Eredivisie_nieuw_logo.svg",
  "super lig": "https://upload.wikimedia.org/wikipedia/commons/f/f9/S%C3%BCper_Lig_logo.png",

  // Movie Studios / Entertainment (Tic-Tac-Toe cells)
  "warner bors.": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=300",
  "warner bros.": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=300",
  "marvel": "https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&q=80&w=300",
  "disney": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=300",
  "universal": "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=300",
  "sony": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=300"
};

export function getLeagueLogo(league: string, theme?: string): string {
  if (!league) return "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=150";
  const norm = league.toLowerCase().trim();
  for (const key of Object.keys(LEAGUE_LOGOS)) {
    if (norm === key || norm.includes(key)) {
      return LEAGUE_LOGOS[key];
    }
  }

  if (theme === 'music') {
    return "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=150"; // Vinyl compilation
  }
  if (theme === 'movies') {
    return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=150"; // Film reel
  }

  return "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=150";
}

// 7. Trophy / Award Pictures
export const TROPHY_PHOTOS: { [key: string]: string } = {
  // Football
  "champions league": "https://images.unsplash.com/photo-1543326119-7053de017531?auto=format&fit=crop&q=80&w=300",
  "uefa champions league": "https://images.unsplash.com/photo-1543326119-7053de017531?auto=format&fit=crop&q=80&w=300",
  "world cup": "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&q=80&w=300",
  "premier league": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=300",
  "ballon d'or": "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?auto=format&fit=crop&q=80&w=300",
  "la liga": "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&q=80&w=300",
  "ligue 1": "https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&q=80&w=300",
  "serie a": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=300",
  "bundesliga": "https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&q=80&w=300",
  "europa league": "https://images.unsplash.com/photo-1543326119-7053de017531?auto=format&fit=crop&q=80&w=300",
  "fa cup": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=300",
  "league cup": "https://images.unsplash.com/photo-1543326119-7053de017531?auto=format&fit=crop&q=80&w=300",
  "copa america": "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&q=80&w=300",
  "copa del rey": "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&q=80&w=300",
  "club world cup": "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&q=80&w=300",
  "euros": "https://images.unsplash.com/photo-1543326119-7053de017531?auto=format&fit=crop&q=80&w=300",
  "european championship": "https://images.unsplash.com/photo-1543326119-7053de017531?auto=format&fit=crop&q=80&w=300",
  "eredivisie": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=300",
  "super lig": "https://images.unsplash.com/photo-1543326119-7053de017531?auto=format&fit=crop&q=80&w=300",

  // Music & Movies awards (Grammy, Oscar, etc.)
  "grammy": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=300",
  "grammy award": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=300",
  "brit": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300",
  "or": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300",
  "vma": "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=300",
  "oscar": "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=300",
  "won oscar": "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=300",
  "academy": "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=300",
  "globe": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=300",
  "bafta": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=300"
};

export function getTrophyPhoto(trophy: string, theme?: string): string {
  if (!trophy) return "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&q=80&w=300";
  const norm = trophy.toLowerCase().trim();
  for (const key of Object.keys(TROPHY_PHOTOS)) {
    if (norm === key || norm.includes(key) || key.includes(norm)) {
      return TROPHY_PHOTOS[key];
    }
  }

  if (theme === 'music' || norm.includes("grammy") || norm.includes("brit") || norm.includes("vma") || norm.includes("award")) {
    return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300"; // Golden MIC setup / trophy
  }
  if (theme === 'movies' || norm.includes("oscar") || norm.includes("globe") || norm.includes("bafta")) {
    return "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=300"; // Film style trophy fallback
  }

  // Beautiful golden cup trophy default
  return "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&q=80&w=300";
}

// 8. General multi-purpose Category Image mapping
// This maps categories like "Pop Music", "Genre", nationalities, or general headers to actual, high-quality images!
export function getCategoryPhoto(title: string, type: string, theme?: string): string {
  const normTitle = title.toLowerCase().trim();
  const normType = type.toLowerCase().trim();

  // If nationality category
  if (normType === 'nationality') {
    // If we have a country name in the category title, use its flag!
    const cleanCountry = normTitle.replace("nationality:", "").replace("country:", "").trim();
    const flag = getFlagUrl(cleanCountry);
    if (flag) return flag;
  }

  // If club category
  if (normType === 'club') {
    const cleanClub = normTitle.replace("club:", "").trim();
    return getClubLogo(cleanClub, theme);
  }

  // If league category
  if (normType === 'league') {
    const cleanLeague = normTitle.replace("league:", "").trim();
    return getLeagueLogo(cleanLeague, theme);
  }

  // If trophy category
  if (normType === 'trophy' || normType === 'award') {
    const cleanAward = normTitle.replace("trophy:", "").replace("award:", "").trim();
    return getTrophyPhoto(cleanAward, theme);
  }

  // If manager category
  if (normType === 'manager' || normType === 'managed_by' || normType === 'director') {
    const cleanManager = normTitle.replace("manager:", "").replace("director:", "").trim();
    return getManagerPhoto(cleanManager, theme);
  }

  // General theme based fallback scenes
  if (normTitle.includes("pop") || theme === 'music') {
    return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300"; // Pop microphone scene
  }
  if (normTitle.includes("rock") || normTitle.includes("alt")) {
    return "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=300"; // Rock concert guitar scene
  }
  if (normTitle.includes("drama") || normTitle.includes("sci-fi") || theme === 'movies') {
    return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=300"; // Movie film reel/seat placeholder
  }

  // Standard high contrast professional soccer/sports stadium view as high quality visual representation
  return "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=300";
}
