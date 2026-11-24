// Rysunki ćwiczeń (SVG) i link do filmu z techniką.

const SV = (b) =>
  '<svg viewBox="0 0 120 90" class="fig" aria-hidden="true"><line x1="4" y1="86" x2="116" y2="86" class="gr"/>' +
  b +
  "</svg>";
const H = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="6" class="hd"/>';
const L = (pts) =>
  pts
    .split(" M")
    .map((p) => '<polyline points="' + p + '" class="lb"/>')
    .join("");
const BAR = (x, y) =>
  '<line x1="' +
  (x - 22) +
  '" y1="' +
  y +
  '" x2="' +
  (x + 22) +
  '" y2="' +
  y +
  '" class="br"/><rect x="' +
  (x - 26) +
  '" y="' +
  (y - 7) +
  '" width="5" height="14" class="pl"/><rect x="' +
  (x + 21) +
  '" y="' +
  (y - 7) +
  '" width="5" height="14" class="pl"/>';
const FIG = {
  rope: SV(
    H(60, 18) +
      L("60,25 60,54") +
      L("60,54 55,80 M60,54 65,80") +
      L("60,32 44,48 M60,32 76,48") +
      '<path d="M44 48 C 20 70, 30 90, 60 86 C 90 90, 100 70, 76 48" fill="none" class="ar"/>'
  ),
  cardio: SV(
    H(46, 22) +
      L("50,29 64,48") +
      L("64,48 74,64 70,80 M64,48 58,66 62,80") +
      L("54,34 82,40") +
      '<circle cx="70" cy="74" r="12" fill="none" class="ar"/><rect x="58" y="44" width="16" height="4" class="pl"/>'
  ),
  ball: SV(
    H(44, 20) +
      L("44,27 46,56") +
      L("46,56 38,86 M46,56 56,86") +
      L("45,34 66,36 M45,36 66,40") +
      '<circle cx="76" cy="38" r="8" class="pl"/><path d="M90 38 h20 l-4 -3 M110 38 l-4 3" class="ar"/>'
  ),
  slam: SV(
    H(60, 16) +
      L("60,23 60,54") +
      L("60,54 52,86 M60,54 70,86") +
      L("60,28 52,10 M60,28 68,10") +
      '<circle cx="60" cy="8" r="7" class="pl"/><path d="M92 20 v40 l-3 -4 M92 60 l3 -4" class="ar"/>'
  ),
  jump: SV(
    '<rect x="74" y="56" width="34" height="30" class="pl"/>' +
      H(48, 22) +
      L("48,29 50,52") +
      L("50,52 40,62 46,74 M50,52 58,64 54,76") +
      L("49,34 36,44 M49,34 62,42") +
      '<path d="M24 74 q 30 -60 60 -24" fill="none" class="ar"/>'
  ),
  rot: SV(
    H(58, 18) +
      L("58,25 60,54") +
      L("60,54 50,86 M60,54 72,86") +
      L("58,32 82,40 M58,32 80,46") +
      '<circle cx="88" cy="42" r="7" class="pl"/><path d="M30 56 a 30 18 0 0 0 56 4" fill="none" class="ar"/>'
  ),
  side: SV(H(22, 40) + L("28,44 100,76") + L("34,46 34,84") + L("100,76 104,84")),
  kneel: SV(H(50, 16) + L("50,23 50,52") + L("50,52 74,58 74,86 M50,52 40,72 18,82") + L("50,30 44,50 M50,30 58,48")),
  quad: SV(
    H(26, 44) +
      L("32,48 84,48") +
      L("36,48 36,84 M84,48 84,84") +
      L("84,48 104,40") +
      '<path d="M58 30 q 0 -10 10 -10" fill="none" class="ar"/>'
  ),
  open: SV(
    H(22, 70) +
      L("28,72 80,74") +
      L("80,74 90,84") +
      L("40,72 60,50 M40,72 66,84") +
      '<path d="M60 44 a 24 24 0 0 1 20 28" fill="none" class="ar"/>'
  ),
  band: SV(
    H(60, 18) +
      L("60,25 60,56") +
      L("60,56 54,86 M60,56 66,86") +
      L("60,32 34,36 M60,32 86,36") +
      '<line x1="34" y1="36" x2="86" y2="36" class="ar"/><path d="M20 50 h14 l-3 -3 M34 50 l-3 3 M100 50 h-14 l3 -3 M86 50 l3 3" class="ar"/>'
  ),
  squat: SV(
    H(58, 22) +
      L("62,29 70,52") +
      L("70,52 54,66 58,86") +
      L("62,32 50,34") +
      BAR(60, 32) +
      '<path d="M36 18 v14 l-3 -4 M36 32 l3 -4" class="ar"/>'
  ),
  hinge: SV(
    H(36, 36) +
      L("42,40 76,48") +
      L("76,48 78,68 76,86") +
      L("50,42 54,64") +
      BAR(54, 66) +
      '<path d="M92 40 a14 14 0 0 0 -6 -10" class="ar"/>'
  ),
  hpush: SV(
    '<rect x="20" y="58" width="70" height="6" class="pl"/>' +
      H(24, 52) +
      L("30,54 80,56") +
      L("80,56 92,72 92,86") +
      L("50,54 50,36") +
      BAR(50, 34) +
      '<path d="M64 46 v-12 l-3 4 M64 34 l3 4" class="ar"/>'
  ),
  hpull: SV(
    H(32, 30) +
      L("38,35 70,50") +
      L("70,50 70,68 70,86") +
      L("50,40 52,58") +
      '<rect x="44" y="58" width="16" height="7" rx="2" class="pl"/>' +
      '<path d="M84 60 v-14 l-3 4 M84 46 l3 4" class="ar"/>'
  ),
  vpush: SV(
    H(60, 30) +
      L("60,37 60,62") +
      L("60,62 54,86 M60,62 66,86") +
      L("60,40 48,22 M60,40 72,22") +
      BAR(60, 16) +
      '<path d="M92 30 v-14 l-3 4 M92 16 l3 4" class="ar"/>'
  ),
  vpull: SV(
    '<line x1="24" y1="10" x2="96" y2="10" class="br"/>' +
      H(60, 28) +
      L("60,35 60,60") +
      L("60,60 56,78 M60,60 66,78") +
      L("60,38 44,10 M60,38 76,10") +
      '<path d="M92 50 v-14 l-3 4 M92 36 l3 4" class="ar"/>'
  ),
  lunge: SV(
    H(56, 18) +
      L("56,25 56,52") +
      L("56,52 78,66 78,86 M56,52 40,72 30,84") +
      L("56,30 52,52 M56,30 62,52") +
      '<rect x="48" y="52" width="6" height="10" class="pl"/><rect x="60" y="52" width="6" height="10" class="pl"/>'
  ),
  carry: SV(
    H(60, 16) +
      L("60,23 60,54") +
      L("60,54 52,86 M60,54 70,86") +
      L("60,28 46,56 M60,28 74,56") +
      '<rect x="40" y="56" width="10" height="16" class="pl"/><rect x="70" y="56" width="10" height="16" class="pl"/><path d="M90 76 h18 l-4 -3 M108 76 l-4 3" class="ar"/>'
  ),
  core: SV(H(24, 60) + L("30,62 96,74") + L("30,64 30,84") + L("96,74 100,84")),
  bridge: SV(
    '<rect x="10" y="50" width="26" height="12" class="pl"/>' +
      H(20, 44) +
      L("28,50 66,46") +
      L("66,46 76,64 76,86") +
      BAR(56, 40) +
      '<path d="M90 64 v-14 l-3 4 M90 50 l3 4" class="ar"/>'
  ),
  iso: SV(
    H(60, 20) +
      L("60,27 60,58") +
      L("60,58 54,86 M60,58 66,86") +
      L("60,32 38,34 M60,32 82,34") +
      '<rect x="30" y="30" width="8" height="8" class="pl"/><rect x="82" y="30" width="8" height="8" class="pl"/>'
  ),
  calf: SV(
    H(60, 16) +
      L("60,23 60,56") +
      L("60,56 58,80 M60,56 62,80") +
      '<rect x="48" y="80" width="26" height="6" class="pl"/>' +
      '<path d="M84 76 v-14 l-3 4 M84 62 l3 4" class="ar"/>'
  ),
};
/* Ilustracje ćwiczeń – sylwetka z boku/przodu, sprzęt, strzałka ruchu. viewBox 160×110, podłoga y=104 */
const FX = (() => {
  const pl = (c, pts) => '<polyline class="' + c + '" points="' + pts.map((p) => p.join(",")).join(" ") + '"/>';
  const N = (...p) => pl("lb", p); // kończyny bliższe
  const Fr = (...p) => pl("lf", p); // kończyny dalsze (jaśniej)
  const T = (a, b) => pl("tr", [a, b]); // tułów
  const Hd = (x, y) => '<circle class="hd" cx="' + x + '" cy="' + y + '" r="7.5"/>';
  const floor = '<line class="fl" x1="4" y1="104" x2="156" y2="104"/>';
  const bench = (x1, y1, x2, y2, legs) =>
    '<line class="pad" x1="' +
    x1 +
    '" y1="' +
    y1 +
    '" x2="' +
    x2 +
    '" y2="' +
    y2 +
    '"/>' +
    (legs || [])
      .map((l) => '<line class="eq" x1="' + l[0] + '" y1="' + l[1] + '" x2="' + l[2] + '" y2="104"/>')
      .join("");
  const plate = (x, y, r) =>
    '<circle class="wt" cx="' +
    x +
    '" cy="' +
    y +
    '" r="' +
    (r || 11) +
    '"/><circle class="hub" cx="' +
    x +
    '" cy="' +
    y +
    '" r="2.5"/>';
  const dbE = (x, y) => '<circle class="wt" cx="' + x + '" cy="' + y + '" r="6.5"/>'; // hantel widziany z boku (koniec)
  const dbH = (x, y) =>
    '<rect class="wt" x="' +
    (x - 12) +
    '" y="' +
    (y - 4) +
    '" width="7" height="8" rx="2"/><rect class="wt" x="' +
    (x + 5) +
    '" y="' +
    (y - 4) +
    '" width="7" height="8" rx="2"/><line class="eq" x1="' +
    (x - 5) +
    '" y1="' +
    y +
    '" x2="' +
    (x + 5) +
    '" y2="' +
    y +
    '"/>'; // hantel poziomo
  const dbV = (x, y) =>
    '<rect class="wt" x="' +
    (x - 4) +
    '" y="' +
    (y - 12) +
    '" width="8" height="7" rx="2"/><rect class="wt" x="' +
    (x - 4) +
    '" y="' +
    (y + 5) +
    '" width="8" height="7" rx="2"/><line class="eq" x1="' +
    x +
    '" y1="' +
    (y - 5) +
    '" x2="' +
    x +
    '" y2="' +
    (y + 5) +
    '"/>'; // hantel pionowo
  const bar = (x1, y, x2) => '<line class="eq" x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '"/>';
  const head = (x, y, ang) => {
    const a = (ang * Math.PI) / 180,
      l = 6,
      s = 0.5;
    return (
      '<path class="ah" d="M' +
      x +
      " " +
      y +
      " L" +
      (x - l * Math.cos(a - s)).toFixed(1) +
      " " +
      (y - l * Math.sin(a - s)).toFixed(1) +
      " L" +
      (x - l * Math.cos(a + s)).toFixed(1) +
      " " +
      (y - l * Math.sin(a + s)).toFixed(1) +
      'Z"/>'
    );
  };
  const ar = (x1, y1, x2, y2) =>
    '<line class="ar" x1="' +
    x1 +
    '" y1="' +
    y1 +
    '" x2="' +
    x2 +
    '" y2="' +
    y2 +
    '"/>' +
    head(x2, y2, (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI);
  const ar2 = (x1, y1, x2, y2) => ar(x1, y1, x2, y2) + head(x1, y1, (Math.atan2(y1 - y2, x1 - x2) * 180) / Math.PI); // ruch tam i z powrotem
  const arc = (d, x, y, ang) => '<path class="ar" d="' + d + '"/>' + head(x, y, ang);
  const svg = (b) => '<svg viewBox="0 0 160 110" class="fig" aria-hidden="true">' + b + "</svg>";
  // postać stojąca z boku (głowa x, y=14)
  const standSide = (x, arms) =>
    Fr([x, 62], [x - 3, 83], [x - 6, 104]) +
    N([x, 62], [x + 2, 83], [x + 1, 104]) +
    T([x, 24], [x, 62]) +
    Hd(x, 14) +
    (arms || "");
  // postać stojąca z przodu
  const standFront = (arms, legs) =>
    (legs || N([74, 62], [72, 83], [71, 104]) + N([86, 62], [88, 83], [89, 104])) +
    T([80, 24], [80, 62]) +
    '<line class="tr" x1="68" y1="30" x2="92" y2="30"/>' +
    Hd(80, 14) +
    arms;
  const F = {};

  /* ===== klatka ===== */
  F.incline = svg(
    floor +
      bench(90, 76, 46, 44, [
        [58, 54, 52],
        [96, 78, 96],
      ]) +
      bench(88, 78, 112, 78) +
      Fr([88, 72], [110, 68], [116, 104]) +
      N([88, 72], [112, 70], [118, 104]) +
      T([88, 72], [52, 48]) +
      Hd(43, 40) +
      N([54, 47], [56, 28], [56, 11]) +
      dbE(56, 9) +
      ar2(72, 34, 72, 12)
  );
  F.bench = svg(
    floor +
      '<line class="eq" x1="34" y1="6" x2="34" y2="104"/><line class="eq" x1="28" y1="30" x2="40" y2="30"/>' +
      bench(26, 75, 108, 75, [
        [36, 75, 36],
        [100, 75, 100],
      ]) +
      Fr([92, 67], [116, 64], [122, 104]) +
      N([92, 67], [116, 66], [118, 104]) +
      T([42, 67], [92, 67]) +
      Hd(30, 64) +
      N([46, 66], [46, 46], [46, 26]) +
      plate(46, 24) +
      ar2(68, 46, 68, 18)
  );
  F.dbbench = svg(
    floor +
      bench(26, 75, 108, 75, [
        [36, 75, 36],
        [100, 75, 100],
      ]) +
      Fr([92, 67], [116, 64], [122, 104]) +
      N([92, 67], [116, 66], [118, 104]) +
      T([42, 67], [92, 67]) +
      Hd(30, 64) +
      N([46, 66], [46, 46], [46, 26]) +
      dbE(46, 22) +
      ar2(66, 46, 66, 18)
  );
  F.skull = svg(
    floor +
      bench(26, 75, 108, 75, [
        [36, 75, 36],
        [100, 75, 100],
      ]) +
      Fr([92, 67], [116, 64], [122, 104]) +
      N([92, 67], [116, 66], [118, 104]) +
      T([42, 67], [92, 67]) +
      Hd(30, 64) +
      N([46, 66], [40, 40], [22, 50]) +
      dbE(20, 49) +
      arc("M16 40 Q20 20 40 22", 40, 22, 10)
  );
  F.fly = svg(
    floor +
      bench(26, 75, 108, 75, [
        [36, 75, 36],
        [100, 75, 100],
      ]) +
      Fr([92, 67], [116, 64], [122, 104]) +
      N([92, 67], [116, 66], [118, 104]) +
      T([42, 67], [92, 67]) +
      Hd(30, 64) +
      N([46, 66], [50, 44], [48, 24]) +
      dbE(48, 22) +
      arc("M78 50 Q72 26 54 22", 54, 22, 190)
  );
  F.pushup = svg(
    floor +
      N([40, 58], [42, 82], [44, 104]) +
      Fr([40, 58], [46, 82], [48, 104]) +
      T([40, 58], [124, 84]) +
      N([124, 84], [146, 100]) +
      Hd(28, 54) +
      ar2(24, 78, 24, 98)
  );
  F.dips = svg(
    '<line class="eq" x1="40" y1="56" x2="120" y2="56"/><line class="eq" x1="56" y1="56" x2="56" y2="104"/><line class="eq" x1="104" y1="56" x2="104" y2="104"/>' +
      N([80, 30], [70, 44], [80, 56]) +
      T([80, 30], [82, 66]) +
      N([82, 66], [96, 76], [86, 92]) +
      Fr([82, 66], [94, 80], [84, 96]) +
      Hd(80, 20) +
      ar2(130, 30, 130, 58)
  );
  /* ===== plecy ===== */
  F.pull = svg(
    '<line class="eq" x1="36" y1="26" x2="124" y2="26"/>' +
      N([68, 36], [54, 44], [60, 28]) +
      N([92, 36], [106, 44], [100, 28]) +
      '<line class="tr" x1="68" y1="36" x2="92" y2="36"/>' +
      T([80, 34], [80, 68]) +
      N([76, 68], [72, 86], [82, 98]) +
      N([84, 68], [88, 86], [80, 100]) +
      Hd(80, 18) +
      ar(138, 92, 138, 58)
  );
  F.hang = svg(
    '<line class="eq" x1="36" y1="8" x2="124" y2="8"/>' +
      N([68, 32], [64, 20], [62, 9]) +
      N([92, 32], [96, 20], [98, 9]) +
      '<line class="tr" x1="68" y1="32" x2="92" y2="32"/>' +
      T([80, 30], [80, 66]) +
      N([76, 66], [74, 86], [74, 104]) +
      N([84, 66], [86, 86], [86, 104]) +
      Hd(80, 22)
  );
  F.latpd = svg(
    floor +
      '<line class="eq" x1="132" y1="6" x2="132" y2="104"/><circle class="eq" cx="120" cy="10" r="4"/><line class="cab" x1="116" y1="12" x2="84" y2="40"/>' +
      bench(64, 78, 96, 78, [[80, 78, 80]]) +
      '<line class="pad" x1="104" y1="66" x2="114" y2="66"/>' +
      Fr([78, 74], [104, 72], [106, 104]) +
      N([78, 74], [102, 74], [104, 104]) +
      T([78, 74], [72, 40]) +
      Hd(70, 30) +
      N([73, 42], [62, 58], [84, 40]) +
      '<line class="eq" x1="78" y1="40" x2="92" y2="40"/>' +
      ar(100, 16, 94, 40)
  );
  F.cablerow = svg(
    floor +
      '<rect class="eqf" x="132" y="70" width="8" height="34"/><line class="cab" x1="132" y1="78" x2="70" y2="64"/>' +
      bench(36, 86, 100, 86, [
        [50, 86, 50],
        [90, 86, 90],
      ]) +
      '<line class="pad" x1="114" y1="72" x2="114" y2="90"/>' +
      Fr([56, 80], [86, 70], [112, 80]) +
      N([56, 80], [88, 72], [112, 82]) +
      T([56, 80], [58, 46]) +
      Hd(58, 36) +
      N([59, 48], [42, 60], [66, 64]) +
      ar(96, 52, 72, 52)
  );
  F.chestrow = svg(
    floor +
      bench(62, 90, 100, 52, [
        [70, 82, 66],
        [92, 62, 104],
      ]) +
      N([66, 80], [52, 88], [40, 104]) +
      Fr([66, 80], [56, 92], [44, 104]) +
      T([66, 80], [98, 50]) +
      Hd(108, 40) +
      N([96, 52], [82, 40], [90, 62]) +
      dbE(90, 64) +
      ar(120, 96, 120, 66)
  );
  F.rfly = svg(
    floor +
      bench(62, 90, 100, 52, [
        [70, 82, 66],
        [92, 62, 104],
      ]) +
      N([66, 80], [52, 88], [40, 104]) +
      Fr([66, 80], [56, 92], [44, 104]) +
      T([66, 80], [98, 50]) +
      Hd(108, 40) +
      N([96, 52], [86, 38], [76, 26]) +
      dbE(74, 24) +
      arc("M112 88 Q124 56 96 30", 96, 30, 215)
  );
  F.bbrow = svg(
    floor +
      Fr([70, 64], [80, 84], [74, 104]) +
      N([70, 64], [86, 84], [80, 104]) +
      T([70, 64], [104, 46]) +
      Hd(114, 40) +
      N([100, 48], [84, 44], [90, 66]) +
      plate(90, 70, 12) +
      ar(128, 98, 128, 70)
  );
  F.dbrow = svg(
    floor +
      bench(40, 74, 112, 74, [
        [48, 74, 48],
        [104, 74, 104],
      ]) +
      Fr([66, 52], [62, 72], [44, 72]) +
      Fr([104, 50], [106, 72]) +
      N([66, 52], [60, 78], [58, 104]) +
      T([66, 52], [104, 50]) +
      Hd(114, 46) +
      N([100, 50], [86, 36], [90, 56]) +
      dbE(90, 59) +
      ar(130, 92, 130, 62)
  );
  /* ===== barki ===== */
  F.latraise = svg(
    floor +
      standFront(N([68, 31], [52, 33], [36, 36]) + N([92, 31], [108, 33], [124, 36]) + dbV(33, 36) + dbV(127, 36)) +
      arc("M30 62 Q22 48 30 40", 30, 40, -70) +
      arc("M130 62 Q138 48 130 40", 130, 40, -110)
  );
  F.dbohp = svg(
    floor +
      bench(52, 80, 108, 80, [
        [56, 80, 56],
        [104, 80, 104],
      ]) +
      N([72, 72], [66, 84], [64, 104]) +
      N([88, 72], [94, 84], [96, 104]) +
      T([80, 34], [80, 72]) +
      '<line class="tr" x1="68" y1="38" x2="92" y2="38"/>' +
      Hd(80, 24) +
      N([68, 38], [58, 22], [62, 8]) +
      N([92, 38], [102, 22], [98, 8]) +
      dbH(62, 7) +
      dbH(98, 7) +
      ar2(140, 40, 140, 10)
  );
  F.ohp = svg(
    floor +
      standFront(
        N([68, 31], [58, 16], [64, 2]) +
          N([92, 31], [102, 16], [96, 2]) +
          bar(40, 3, 120) +
          plate(40, 3, 7) +
          plate(120, 3, 7)
      ) +
      ar2(140, 44, 140, 12)
  );
  F.facepull = svg(
    floor +
      '<rect class="eqf" x="140" y="10" width="8" height="94"/><line class="cab" x1="140" y1="30" x2="94" y2="28"/>' +
      standSide(66, N([66, 28], [58, 22], [84, 26])) +
      ar(120, 40, 96, 40)
  );
  F.arnold = F.dbohp;
  /* ===== ramiona ===== */
  F.curl = svg(
    floor + standSide(76, N([76, 28], [76, 52], [92, 36]) + dbE(94, 34)) + arc("M104 60 Q112 44 100 30", 100, 30, -120)
  );
  F.hammer = svg(
    floor + standSide(76, N([76, 28], [76, 52], [92, 36]) + dbV(94, 34)) + arc("M108 62 Q116 46 104 30", 104, 30, -120)
  );
  F.ohext = svg(
    floor + standSide(80, N([80, 28], [88, 10], [68, 22]) + dbV(64, 24)) + arc("M54 40 Q52 14 74 6", 74, 6, -20)
  );
  F.pushdown = svg(
    floor +
      '<rect class="eqf" x="110" y="4" width="8" height="100"/><line class="cab" x1="110" y1="8" x2="88" y2="56"/>' +
      standSide(70, N([70, 28], [72, 50], [90, 62])) +
      ar(100, 40, 100, 66)
  );
  /* ===== nogi ===== */
  F.squat = svg(
    floor +
      Fr([78, 76], [106, 78], [90, 104]) +
      N([78, 76], [110, 80], [94, 104]) +
      T([78, 76], [96, 44]) +
      Hd(102, 32) +
      plate(92, 40) +
      N([96, 44], [84, 56], [94, 42]) +
      ar2(134, 92, 134, 52)
  );
  F.goblet = svg(
    floor +
      Fr([78, 76], [106, 78], [90, 104]) +
      N([78, 76], [110, 80], [94, 104]) +
      T([78, 76], [92, 44]) +
      Hd(98, 32) +
      N([92, 46], [104, 58], [104, 44]) +
      dbV(106, 50) +
      ar2(134, 92, 134, 52)
  );
  F.rdl = svg(
    floor +
      Fr([70, 62], [80, 84], [76, 104]) +
      N([70, 62], [84, 82], [80, 104]) +
      T([70, 62], [110, 52]) +
      Hd(120, 50) +
      N([108, 54], [106, 70], [104, 84]) +
      plate(104, 86, 11) +
      arc("M132 92 Q140 66 128 44", 128, 44, -105)
  );
  F.dbrdl = svg(
    floor +
      Fr([70, 62], [80, 84], [76, 104]) +
      N([70, 62], [84, 82], [80, 104]) +
      T([70, 62], [110, 52]) +
      Hd(120, 50) +
      N([108, 54], [106, 70], [104, 84]) +
      dbH(104, 88) +
      arc("M132 92 Q140 66 128 44", 128, 44, -105)
  );
  F.lunge = svg(
    floor +
      N([82, 72], [108, 78], [110, 104]) +
      Fr([82, 72], [68, 100], [48, 100]) +
      T([82, 72], [82, 38]) +
      Hd(82, 28) +
      N([82, 40], [84, 56], [84, 72]) +
      dbV(86, 76) +
      ar2(136, 62, 136, 92)
  );
  F.stepup = svg(
    floor +
      '<rect class="eqf" x="92" y="78" width="44" height="26"/>' +
      N([84, 52], [104, 60], [106, 78]) +
      Fr([84, 52], [80, 78], [78, 104]) +
      T([84, 52], [84, 20]) +
      Hd(84, 10) +
      N([84, 24], [86, 42], [86, 58]) +
      dbV(88, 62) +
      ar(146, 70, 146, 40)
  );
  F.legpress = svg(
    floor +
      '<line class="eq" x1="92" y1="104" x2="150" y2="46"/><line class="pad" x1="62" y1="94" x2="40" y2="56"/><line class="pad" x1="40" y1="94" x2="66" y2="94"/><line class="eq" x1="102" y1="56" x2="122" y2="84"/>' +
      N([60, 88], [86, 58], [110, 70]) +
      Fr([60, 88], [84, 62], [108, 74]) +
      T([60, 88], [44, 58]) +
      Hd(40, 47) +
      N([46, 60], [56, 74], [62, 86]) +
      ar2(124, 44, 142, 26)
  );
  F.thrust = svg(
    floor +
      bench(16, 62, 46, 62, [
        [22, 62, 22],
        [40, 62, 40],
      ]) +
      N([80, 54], [106, 56], [106, 104]) +
      Fr([80, 54], [102, 58], [102, 104]) +
      T([42, 58], [80, 54]) +
      Hd(30, 54) +
      plate(80, 44) +
      N([46, 58], [62, 48], [78, 44]) +
      ar(126, 92, 126, 58)
  );
  F.bridge = svg(
    floor +
      N([82, 76], [104, 80], [108, 104]) +
      Fr([82, 76], [100, 82], [104, 104]) +
      T([40, 98], [82, 76]) +
      Hd(28, 96) +
      N([44, 96], [60, 104]) +
      ar(126, 100, 126, 70)
  );
  F.legcurl = svg(
    floor +
      bench(30, 74, 118, 74, [
        [40, 74, 40],
        [110, 74, 110],
      ]) +
      T([40, 66], [88, 66]) +
      Hd(28, 62) +
      N([88, 66], [120, 66], [106, 40]) +
      '<circle class="pad2" cx="108" cy="38" r="5"/>' +
      N([40, 68], [50, 74]) +
      arc("M136 64 Q140 40 118 30", 118, 30, 200)
  );
  F.legext = svg(
    floor +
      bench(40, 80, 90, 80, [
        [50, 80, 50],
        [84, 80, 84],
      ]) +
      '<line class="pad" x1="44" y1="80" x2="40" y2="44"/>' +
      T([50, 74], [46, 40]) +
      Hd(46, 30) +
      N([50, 74], [86, 74], [116, 64]) +
      '<circle class="pad2" cx="118" cy="66" r="5"/>' +
      N([48, 44], [60, 60], [66, 76]) +
      arc("M110 98 Q132 92 128 70", 128, 70, -80)
  );
  F.calf = svg(
    floor +
      '<rect class="eqf" x="66" y="92" width="40" height="12"/>' +
      standSide(82, N([82, 28], [82, 50], [84, 62])) +
      ar2(122, 96, 122, 70)
  );
  F.calf = svg(
    floor +
      '<rect class="eqf" x="66" y="94" width="44" height="10"/>' +
      Fr([82, 56], [80, 76], [84, 92]) +
      N([82, 56], [85, 76], [88, 92]) +
      '<line class="lb" x1="88" y1="92" x2="100" y2="96"/>' +
      T([82, 18], [82, 56]) +
      Hd(82, 8) +
      N([82, 22], [82, 42], [84, 54]) +
      ar2(124, 96, 124, 66)
  );
  F.swing = svg(
    floor +
      Fr([70, 62], [80, 84], [74, 104]) +
      N([70, 62], [84, 82], [80, 104]) +
      T([70, 62], [100, 34]) +
      Hd(106, 24) +
      N([98, 36], [118, 40], [136, 40]) +
      '<circle class="wt" cx="142" cy="42" r="8"/>' +
      arc("M120 90 Q150 80 146 54", 146, 54, -80)
  );
  F.farmer = svg(floor + standSide(70, N([70, 28], [70, 48], [70, 64]) + dbH(70, 68)) + ar(100, 60, 132, 60));
  F.carry1 = F.farmer;
  F.plank = svg(
    floor +
      T([40, 74], [128, 92]) +
      N([128, 92], [140, 104]) +
      N([42, 76], [42, 104], [62, 104]) +
      Hd(28, 68) +
      '<line class="ar" x1="40" y1="64" x2="128" y2="82" stroke-dasharray="4 4"/>'
  );
  F.sideplank = svg(
    floor +
      T([40, 68], [130, 96]) +
      N([130, 96], [140, 104]) +
      N([40, 70], [40, 104]) +
      N([44, 70], [56, 44]) +
      Hd(28, 62)
  );
  F.deadbug = svg(
    floor +
      T([40, 96], [86, 96]) +
      Hd(28, 94) +
      N([42, 94], [40, 62]) +
      Fr([46, 94], [22, 78]) +
      N([86, 96], [100, 72], [118, 72]) +
      Fr([86, 96], [118, 90]) +
      arc("M14 72 Q10 86 20 92", 20, 92, 60)
  );
  F.hangraise = svg(
    '<line class="eq" x1="36" y1="8" x2="124" y2="8"/>' +
      N([70, 30], [66, 18], [64, 9]) +
      N([90, 30], [94, 18], [96, 9]) +
      T([80, 28], [80, 62]) +
      Hd(80, 20) +
      N([80, 62], [104, 56], [106, 80]) +
      arc("M128 96 Q136 72 116 56", 116, 56, 210)
  );
  F.pallof = svg(
    floor +
      '<rect class="eqf" x="6" y="10" width="8" height="94"/><line class="cab" x1="14" y1="40" x2="92" y2="42"/>' +
      standFront(N([68, 31], [76, 40], [92, 42]) + N([92, 31], [94, 40], [92, 42])) +
      ar2(100, 56, 124, 56)
  );
  F.woodchop = svg(
    floor +
      '<rect class="eqf" x="6" y="4" width="8" height="100"/><line class="cab" x1="14" y1="10" x2="104" y2="64"/>' +
      standFront(N([68, 31], [84, 48], [104, 64]) + N([92, 31], [100, 48], [104, 64])) +
      arc("M40 20 Q70 40 112 78", 112, 78, 40)
  );
  F.slam = svg(
    floor +
      standSide(80, N([80, 28], [84, 10], [86, 4]) + '<circle class="wt" cx="88" cy="2" r="7"/>') +
      ar(110, 10, 110, 90)
  );
  F.throw = svg(
    floor +
      '<rect class="eqf" x="146" y="4" width="8" height="100"/>' +
      standSide(70, N([70, 28], [90, 32], [110, 32]) + '<circle class="wt" cx="118" cy="32" r="7"/>') +
      ar(126, 32, 142, 32)
  );
  F.jump = svg(
    floor +
      '<rect class="eqf" x="98" y="70" width="46" height="34"/>' +
      N([72, 58], [60, 68], [74, 78]) +
      Fr([72, 58], [62, 74], [76, 84]) +
      T([72, 58], [80, 26]) +
      Hd(84, 16) +
      N([80, 30], [96, 34], [104, 22]) +
      arc("M40 96 Q70 30 118 58", 118, 58, 30)
  );
  /* ===== rozgrzewka ===== */
  F.jj = svg(
    floor +
      standFront(
        N([68, 31], [58, 16], [50, 4]) + N([92, 31], [102, 16], [110, 4]),
        N([74, 62], [64, 83], [56, 104]) + N([86, 62], [96, 83], [104, 104])
      ) +
      arc("M30 50 Q26 26 44 10", 44, 10, -45) +
      arc("M130 50 Q134 26 116 10", 116, 10, -135)
  );
  F.circles = svg(
    floor +
      standFront(N([68, 31], [52, 31], [36, 31]) + N([92, 31], [108, 31], [124, 31])) +
      '<circle class="ar" cx="30" cy="31" r="10" fill="none"/><circle class="ar" cx="130" cy="31" r="10" fill="none"/>' +
      head(30, 21, 0) +
      head(130, 21, 180)
  );
  F.openbook = svg(
    floor +
      T([40, 96], [90, 96]) +
      Hd(28, 94) +
      N([90, 96], [110, 80], [124, 96]) +
      Fr([90, 96], [106, 86], [120, 100]) +
      Fr([42, 96], [66, 96]) +
      N([44, 94], [44, 70], [36, 52]) +
      arc("M62 70 Q50 44 26 54", 26, 54, 160)
  );
  F.wall = svg(
    '<rect class="wallr" x="40" y="0" width="80" height="104"/>' +
      floor +
      standFront(N([68, 31], [54, 26], [56, 8]) + N([92, 31], [106, 26], [104, 8])) +
      ar2(30, 40, 30, 10) +
      ar2(130, 40, 130, 10)
  );
  F.scap = svg(
    floor +
      N([40, 58], [42, 82], [44, 104]) +
      Fr([40, 58], [46, 82], [48, 104]) +
      T([40, 58], [124, 84]) +
      N([124, 84], [146, 100]) +
      Hd(28, 54) +
      ar2(60, 46, 60, 30)
  );
  F.catcow = svg(
    floor +
      N([46, 64], [44, 104]) +
      Fr([50, 64], [50, 104]) +
      N([104, 64], [104, 104], [132, 104]) +
      '<path class="tr" d="M46 64 Q75 44 104 64" fill="none"/>' +
      Hd(34, 64) +
      arc("M60 34 Q75 26 90 34", 90, 34, 20) +
      head(60, 34, 200)
  );
  F.ramp = F.incline;

  /* przypisanie: ćwiczenie → rysunek */
  const MAP = {
    incline: "incline",
    inclinebar: "incline",
    bench: "bench",
    smithbench: "bench",
    machpress: "dbbench",
    dbbench: "dbbench",
    cgbench: "bench",
    skull: "skull",
    fly: "fly",
    cablecross: "fly",
    pushup: "pushup",
    dips: "dips",
    pull: "pull",
    chinup: "pull",
    hang: "hang",
    latpd: "latpd",
    closepd: "latpd",
    straightpd: "pushdown",
    cablerow: "cablerow",
    machrow: "cablerow",
    chestrow: "chestrow",
    reversefly: "rfly",
    bbrow: "bbrow",
    tbar: "bbrow",
    dbrow: "dbrow",
    invrow: "cablerow",
    latraise: "latraise",
    cablelat: "latraise",
    dbohp: "dbohp",
    machohp: "dbohp",
    arnold: "dbohp",
    ohp: "ohp",
    landmine: "ohp",
    facepull: "facepull",
    curl: "curl",
    bbcurl: "curl",
    cablecurl: "curl",
    hammer: "hammer",
    ohext: "ohext",
    pushdown: "pushdown",
    squat: "squat",
    frontsquat: "squat",
    smithsquat: "squat",
    hacksquat: "squat",
    goblet: "goblet",
    bss: "lunge",
    lunge: "lunge",
    revlunge: "lunge",
    stepup: "stepup",
    stepdown: "stepup",
    legpress: "legpress",
    legext: "legext",
    rdl: "rdl",
    dl: "rdl",
    dbrdl: "dbrdl",
    hyper: "rdl",
    pullthrough: "rdl",
    kbswing: "swing",
    thrust: "thrust",
    glutebridge: "bridge",
    legcurl: "legcurl",
    seatcurl: "legcurl",
    nordic: "legcurl",
    abductor: "legext",
    calf: "calf",
    seatcalf: "calf",
    slcalf: "calf",
    tib: "calf",
    farmer: "farmer",
    suitcase: "farmer",
    plank: "plank",
    sideplank: "sideplank",
    copen: "sideplank",
    deadbug: "deadbug",
    hollow: "deadbug",
    core: "plank",
    hangraise: "hangraise",
    kneeraise: "hangraise",
    cablecrunch: "woodchop",
    pallof: "pallof",
    woodchop: "woodchop",
    mbslam: "slam",
    mbchest: "throw",
    mbrot: "throw",
    boxjump: "jump",
    broadjump: "jump",
  };
  return { F, MAP };
})();

function figFor(k, pat) {
  return FX.F[FX.MAP[k]] || FIG[pat] || "";
}
function vidLink(n) {
  return (
    '<a class="vid" href="https://www.youtube.com/results?search_query=' +
    encodeURIComponent(n + " technika ćwiczenia") +
    '" target="_blank" rel="noopener">▶ Zobacz film</a>'
  );
}
