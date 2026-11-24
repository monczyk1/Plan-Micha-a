// Plan startowy A/B (Michał i każda nowa osoba bez własnego planu) oraz rozgrzewka.
const DAYS = ["A", "B"];
const DAYLBL = { A: "A", B: "B" };
const PLAN = {
  A: {
    sub: "Klatka · plecy · barki · ramiona",
    ex: [
      { k: "incline", m: 1, n: "Wyciskanie hantli na ławce skośnej dodatniej", s: 3, r: "6–10" },
      { k: "bench", m: 1, n: "Wyciskanie sztangi leżąc", s: 3, r: "6–10" },
      { k: "chestrow", m: 1, n: "Wiosłowanie hantlami z klatką opartą o ławkę", s: 3, r: "8–12" },
      { k: "pull", n: "Podciąganie nachwytem lub podchwytem", s: 3, r: "6–10" },
      { k: "latraise", n: "Unoszenie hantli bokiem", s: 3, r: "12–20" },
      { k: "curl", n: "Uginanie ramion z hantlami", s: 3, r: "8–12" },
      { k: "skull", n: "Francuskie wyciskanie hantli leżąc", s: 3, r: "10–15" },
    ],
  },
  B: {
    sub: "Plecy · barki · klatka · ramiona",
    ex: [
      { k: "dbohp", m: 1, n: "Wyciskanie hantli siedząc", s: 3, r: "6–10" },
      { k: "bbrow", m: 1, n: "Wiosłowanie sztangą", s: 3, r: "8–12" },
      { k: "dbbench", m: 1, n: "Wyciskanie hantli na ławce płaskiej", s: 3, r: "8–12" },
      { k: "chinup", n: "Podciąganie podchwytem", s: 3, r: "6–10" },
      { k: "latraise", n: "Unoszenie hantli bokiem", s: 3, r: "12–20" },
      { k: "reversefly", n: "Odwrotne rozpiętki z hantlami, klatka oparta o ławkę", s: 2, r: "12–20" },
      { k: "hammer", n: "Uginanie młotkowe hantli", s: 3, r: "10–15" },
      { k: "ohext", n: "Prostowanie hantla nad głową oburącz", s: 3, r: "10–15" },
    ],
  },
};
const W = {
  cardio: (n, c) => ({ n, d: "3 min", c: c || "Spokojnie, tętno 120–135, da się swobodnie mówić", f: "cardio" }),
  book: {
    n: "Otwieranie książki",
    d: "5/str.",
    c: "Leżysz na boku, kolana ugięte. Górną rękę prowadzisz łukiem na drugą stronę, wzrok za dłonią.",
    f: "openbook",
  },
  cat: { n: "Koci grzbiet", d: "8", c: "Na czworakach powoli zaokrąglasz i wyginasz plecy, z oddechem.", f: "catcow" },
  hip90: {
    n: "Biodro 90/90",
    d: "5/str.",
    c: "Siedzisz, obie nogi zgięte pod kątem 90°. Przekładasz kolana z jednej strony na drugą, tułów prosto.",
    f: "kneel",
  },
  flex: {
    n: "Rozciąganie zginacza biodra w klęku",
    d: "30 s/str.",
    c: "Klęk jednonóż. Napnij pośladek nogi z tyłu i przesuń biodro lekko w przód.",
    f: "kneel",
  },
  bridge: {
    n: "Mostek biodrowy",
    d: "10",
    c: "Leżysz, stopy blisko pośladków. Unieś biodra, ściśnij pośladki, 1 s na górze.",
    f: "bridge",
  },
  pull: {
    n: "Rozciąganie gumy przed sobą",
    d: "15",
    c: "Proste ręce na wysokości barków, rozciągasz gumę ściągając łopatki.",
    f: "band",
  },
};
const WARM = {
  A: [
    {
      n: "Pajacyki lub marsz w miejscu",
      d: "2 min",
      c: "Spokojnie, do lekkiego rozgrzania i przyspieszonego oddechu.",
      f: "jj",
    },
    { n: "Krążenia ramion", d: "10 w przód + 10 w tył", c: "Duże, powolne koła prostymi rękami.", f: "circles" },
    W.book,
    {
      n: "Ślizgi rąk po ścianie",
      d: "8",
      c: "Plecy i ręce przy ścianie. Przesuwasz ręce w górę i w dół bez odrywania lędźwi.",
      f: "wall",
    },
    {
      n: "Pompki łopatkowe",
      d: "10",
      c: "Podpór na prostych rękach. Ruch tylko łopatkami: zbliżasz i rozsuwasz.",
      f: "scap",
    },
    { n: "Zwis na drążku", d: "20 s", c: "Luźny zwis, barki lekko aktywne – przygotowanie do podciągania.", f: "hang" },
    {
      n: "Serie dochodzące – wyciskanie na skosie",
      d: "2 serie",
      c: "Około 50% × 8 → 75% × 4, potem serie robocze.",
      f: "incline",
    },
  ],
  B: [
    {
      n: "Pajacyki lub marsz w miejscu",
      d: "2 min",
      c: "Spokojnie, do lekkiego rozgrzania i przyspieszonego oddechu.",
      f: "jj",
    },
    { n: "Krążenia ramion", d: "10 w przód + 10 w tył", c: "Duże, powolne koła prostymi rękami.", f: "circles" },
    W.cat,
    W.book,
    {
      n: "Ślizgi rąk po ścianie",
      d: "8",
      c: "Plecy i ręce przy ścianie. Przesuwasz ręce w górę i w dół bez odrywania lędźwi.",
      f: "wall",
    },
    { n: "Wiosłowanie hantlem lekko", d: "10/str.", c: "Lekki hantel, spokojnie, łopatka do tyłu.", f: "dbrow" },
    {
      n: "Serie dochodzące – wyciskanie siedząc",
      d: "2 serie",
      c: "Około 50% × 8 → 75% × 4, potem serie robocze.",
      f: "dbohp",
    },
  ],
};
