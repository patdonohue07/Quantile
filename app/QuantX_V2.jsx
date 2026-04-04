import { useState, useEffect, useRef } from "react";

// ── DESIGN TOKENS ──────────────────────────────────────────────────────────────
const C = {
  bg: "#000000",
  surface: "#0d0d0d",
  surface2: "#111111",
  border: "rgba(255,255,255,0.07)",
  accent: "#3B82F6",
  accentDim: "rgba(59,130,246,0.10)",
  accentBorder: "rgba(59,130,246,0.22)",
  white: "#FFFFFF",
  dim: "rgba(255,255,255,0.50)",
  dimmer: "rgba(255,255,255,0.28)",
  dimmest: "rgba(255,255,255,0.10)",
  green: "#22C55E",
  greenDim: "rgba(34,197,94,0.08)",
  greenBorder: "rgba(34,197,94,0.20)",
  red: "#EF4444",
  redDim: "rgba(239,68,68,0.08)",
  redBorder: "rgba(239,68,68,0.20)",
  yellow: "#F59E0B",
  yellowDim: "rgba(245,158,11,0.10)",
  yellowBorder: "rgba(245,158,11,0.22)",
  font: "'Lora', Georgia, serif",
  mono: "'JetBrains Mono', monospace",
};

// ── STORAGE ────────────────────────────────────────────────────────────────────
const STORAGE_KEY = "quantile-trade-log";

async function loadLog() {
  try {
    const result = await window.storage.get(STORAGE_KEY);
    return result ? JSON.parse(result.value) : [];
  } catch {
    return [];
  }
}

async function saveLog(entries) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

// ── LIVE PRICES ────────────────────────────────────────────────────────────────
async function fetchLivePrices() {
  try {
    const res = await fetch("/api/prices");
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.tickers) return null;
    return data;
  } catch {
    return null;
  }
}

// ── LOGO ───────────────────────────────────────────────────────────────────────
function SignalMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <line
        x1="4"
        y1="18"
        x2="28"
        y2="18"
        stroke="rgba(59,130,246,0.25)"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      <path
        d="M4 22 L9 22 L11 20 L13 14 L16 8 L19 14 L21 20 L23 18 L28 18"
        stroke={C.accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="16" cy="8" r="2.5" fill={C.accent} />
    </svg>
  );
}

// ── DATA ───────────────────────────────────────────────────────────────────────
const PAIRS = [
  {
    lead: "V",
    target: "MA",
    beta: 0.647983,
    th: 75,
    lo: 25,
    label: "Visa · Mastercard",
    stats: { trades: 316, win: 63.6, sharpe: 3.47, sortino: 4.26, maxdd: 3.2 },
    sk: [
      -0.00615841, -4.495e-5, 0.00228136, -0.00086102, 0.00080227, -0.00269413,
      -0.00296063, -5.507e-5, -0.00409487, 0.00319038, 0.00651187, -0.00325114,
      -0.00099557, -0.00149667, 0.00359609, -0.00168036, 0.00091299,
      -0.00071511, 0.00169017, 0.00048608, 0.00348685, 0.01247656, -0.00201131,
      -0.01149043, -0.0001334, 0.00115611, 0.00046822, -0.00092474, -0.00610059,
      -0.00136135, 0.00348965, -0.00303094, -0.00049983, -0.00071401,
      0.00039883, 0.00212828, -0.00040926, 0.00032842, -0.00428162, -0.0013423,
      -0.00574036, -0.00034746, 0.00030048, -0.00106789, -0.00767999,
      -0.00631846, -0.00536395, -0.0090869, 0.0057266, -0.00538521, -0.0075314,
      5.671e-5, 0.00178572, 0.00437719, 0.00045013, -0.00513825, 0.00448051,
      -0.00071104, 0.00162189, -0.00052294, 0.00196661, -8.024e-5, 0.00150338,
      -0.00172715, -0.01344592, -0.01431816, -0.02041012, 0.01110228,
      0.00370738, -0.00245436, 0.00084707, 0.00124861, 0.00340604, -0.00074633,
      0.00234528, -0.00143739, 0.00373118, 0.00483043, -0.00164616, -0.00282962,
      0.00170599, 0.00311503, -0.01935007, -0.00206202, 0.00326004, 0.0001042,
      -0.00106668, 0.00255132, 0.0025757, 0.00121708, 0.0057763, 0.0010344,
      -0.00039981, 0.00024554, 0.00376436, -0.003241, 0.00538681, -0.00332007,
      -0.00050588, -0.00536723, 0.00156409, 7.741e-5, 0.00176855, -0.00177574,
      -0.00098357, -0.00052055, -0.00012618, 0.00301647, 0.00337345, 0.00035391,
      0.00057255, -0.00274575, -0.00145615, -0.00857309, 0.00816014,
      -0.00109737, -0.00159918, -0.0020362, -0.00127581, 0.00488506,
      -0.00157755, 0.00062909, 0.00047845, -0.00044409, -0.00044313,
      -0.00053086, 0.00189856, -0.00146057, 0.00073125, 0.00109759, -0.00321879,
      -0.0052149, -0.00192889, -0.00689567, -0.00164735, 0.00324861,
      -0.00047801, -0.00083901, -0.00089935, 0.00526949, -0.00121909,
      -0.0009042, -0.00087927, 0.00031149, 0.00460652, -0.01660625, -0.00098015,
      0.00183288, 0.00023877, -0.00079879, 0.00060241, 0.00186658, -0.00091563,
      -0.00212406, -0.00284218, 0.00162077, 0.00082342, -0.00218547,
      -0.00082451, 0.0023314, 0.00095574, 0.00075161, 4.83e-6, -0.00023066,
      -0.00090032, 0.00053805, 4.7e-5, -0.00738075, -0.00204153, -0.00012583,
      0.00129608, -0.0007894, 0.0015982, -0.00193681, 0.00012643, -0.00408802,
      0.00088613, -0.00278566, -0.00169018, -0.00148579, 0.00387087, -0.0040725,
      -0.00039633, -0.00021992, 0.0033661, 0.0076439, -0.00096791, 0.00165789,
      0.00043131, -0.00345414, 0.00147272, 0.00184778, 0.00203175, 0.00220507,
      -0.00144274, -0.00177783, -0.00040067, -0.00294556, 0.00413036,
      -0.00198461, 0.00399069, -0.00081414, 0.00105978, 0.0028671, -0.00097008,
      0.00255609, 0.00234795, 0.00136977, 0.00232902, 0.00628303, -0.00294429,
      0.00309916, -0.0021517, -0.00079259, -0.00059868, -0.00129147, 0.00151093,
      0.00189423, -0.00191494, 0.00203083, -0.00111348, 0.00313379, 0.00013371,
      0.00035857, -0.00357977, -0.00074756, 0.0001965, -0.00561212, -0.0023834,
      -0.00488381, -0.00108351, -0.00073463, -0.00170403, 0.00120482,
      -0.00010859, -0.00553106, 0.0013705, -0.00022218, 0.01638929, 0.00383194,
      -0.0010763, -0.0043532, 0.00184731, 0.0027453, 0.00010411, 0.00214748,
      -0.00046946, -0.00101193, -0.00044805, 0.00138021, 0.00032057, 0.00104987,
    ],
    to: [],
    tm: [],
  },
  {
    lead: "PG",
    target: "CL",
    beta: 0.7145,
    th: 90,
    lo: 10,
    label: "Procter & Gamble · Colgate",
    stats: { trades: 156, win: 62.8, sharpe: 1.97, sortino: 1.5, maxdd: 4.42 },
    sk: [
      -0.00128691, 0.00124734, 0.00042272, -0.00171976, 0.00015606, 0.00254876,
      0.00537703, 0.0024201, 0.0023199, 0.00162903, 0.00134288, 0.00317909,
      0.00205796, -6.776e-5, 0.00047233, -0.02121769, -0.00262514, -0.03078388,
      0.0002683, 0.00513284, 0.00767981, -0.00131736, 0.00225135, -0.00079647,
      -0.00175066, 0.00018841, 0.00542645, 0.00644658, 0.00327352, 0.00267778,
      0.00753589, 8.431e-5, -0.00223684, -0.00677248, -0.00041435, 0.00193687,
      0.00023644, -0.00105855, 3.8e-7, -0.00060176, 0.00061261, 0.00026946,
      0.00287205, 0.00291366, -0.0042786, 0.00123517, -0.00206808, 0.00116267,
      0.00054982, 0.00247216, 0.00179199, -0.00189417, 0.00354918, -0.0052908,
      0.00228802, 0.00123888, -0.00341739, -0.0026189, 0.00388796, 0.00491776,
      0.0061019, -0.00140889, -0.00299231, -0.00112011, -0.0013996, -0.00066878,
      -0.00037126, -0.00153058, 0.00230406, 0.00206699, -0.00021949, -0.0020122,
      0.0127673, 0.00039728, 0.00178866, -0.00860685, 0.0008022, -0.00245386,
      0.00358091, -0.00231381, 0.01189034, 0.00314437, 0.0007828, -0.00108114,
      -0.00055123, -0.00227074, 0.00207726, 0.00291464, 0.00027577, 0.00115336,
      0.00070474, 0.00395617, 0.00047047, -0.00050116, 0.00082379, -0.00302265,
      -0.00284047, 0.00108505, -0.00058529, 0.00050331, -0.00061739, 0.00417279,
      -0.00462564, 0.00396149, 0.00195474, -0.00108234, 0.00162811, 0.0023612,
      -0.00350024, 0.01150847, -0.00184167, -5.623e-5, 0.02080391, 0.00018132,
      0.00118563, 0.0026806, 0.00162083, 0.00031484, 0.00097878, 0.00230064,
      -0.0013363, 0.00045687, 0.00274437, -4.898e-5, 0.00126182, 0.00118023,
      -0.00182438, -0.0022076, 0.00285723, -0.00050514, -0.00310546,
      -0.00440571, -0.00030533, -0.00494644, -0.00260674, -0.00123178,
      -0.00093759, -0.00201751, 0.00250059, -0.0047926, 0.00364524, -0.00069182,
      -6.645e-5, 0.00254136, -0.0048532, 9.12e-6, 0.00050046, 0.00267211,
      -0.00493711, 0.00085071, -3.118e-5, 0.00044658, -0.00104442, 0.00140331,
      -0.001289, 0.00022543, 0.00055089, -0.00246875, -1.7e-7, -0.00158747,
      0.00226879, -0.00093135, 4.118e-5, 0.0020217, 0.00288304, -0.00950374,
      -0.00099271, 0.00036366, -0.00755304, -0.00275659, 0.00304758,
      -0.01225304, 0.00036455, 0.0053317, 0.00770377, 0.02596344, -9.4e-6,
      -0.00588282, 0.00137881, 0.00197629, -0.00405974, -0.00086057, 0.02529505,
      0.00013936, 0.00109364, -2.364e-5, -0.00360356, 0.00374969, 0.00384033,
      -0.00125249, 0.00082563, 0.00899634, 0.00109476, -0.00642521, -0.0008462,
      0.00367935, -0.00294066, 5.148e-5, 0.00119442, 0.00448577, 0.00033219,
      0.00046394, -0.00010869, -0.00186916, 0.00220315, -0.00019386,
      -0.00265284, -0.00630835, 0.00329877, -0.00227144, -0.00362534,
      -0.00254275, 5.879e-5, 0.00034807, 0.0018888, 0.00014645, -0.00120179,
      7.97e-6, -0.0064477, -0.00110763, -0.00467578, 0.00141916, -0.00046519,
      8.806e-5, 0.0013331, -0.00068848,
    ],
    to: [],
    tm: [],
  },
  {
    lead: "LOW",
    target: "HD",
    beta: 0.9648,
    th: 70,
    lo: 30,
    label: "Lowe's · Home Depot",
    stats: { trades: 457, win: 59.7, sharpe: 2.44, sortino: 2.86, maxdd: 6.54 },
    sk: [
      -0.00146997, -0.00090795, -0.00329434, 0.00197974, -0.00273915,
      0.00152279, 0.00043252, 0.00172132, -0.00268162, -0.00038193, -0.00637788,
      0.0132942, -0.00257343, -0.00170492, -0.0001955, 0.00297546, 0.00420735,
      -0.00065111, 0.00471802, -0.00598263, 0.00554334, -0.00037327,
      -0.00309169, -0.00172758, -0.00484311, -0.00189333, -0.00175857,
      -0.00227377, -0.00051021, -0.0018848, 0.00344675, 0.000103, -0.00108268,
      -0.00141706, -0.01935594, 0.01178682, 0.00364629, -0.0016501, -0.00861886,
      -0.00244659, 0.00365277, 0.00091222, -0.00846403, 0.00086249, 8.243e-5,
      0.00047668, -0.0007704, 0.0009147, 0.0028606, 0.00259822, 7.812e-5,
      0.0012012, -0.00219471, 0.00794884, 0.0001132, 0.00263664, -0.0067103,
      0.00111721, -0.00687732, 0.00394999, -0.00323358, 0.00255237, 0.00103081,
      0.00020828, 0.00386473, -0.0015883, 0.00420976, 0.00367838, 0.00175272,
      -0.00340202, 0.00583911, -0.00256512, 0.00013637, -0.00230497, -0.0009386,
      0.00049273, 0.00135878, 0.0026347, 0.00090321, 0.00064963, 0.00033771,
      -0.01728168, -0.00074707, 0.00627551, -0.00124992, 0.00075238,
      -0.01017842, -0.00116638, 0.00850059, -0.00057882, -0.00568457,
      0.00266349, -0.00264737, -0.00661904, -0.04284422, 0.00103257, 0.00324332,
      0.00108848, 0.00421765, -0.00110173, -0.00025468, -0.0050486, -0.00112556,
      -0.00055363, -0.00317791, -0.00024429, 0.00072124, 0.00283001,
      -0.00019468, 0.00213942, -0.00073282, 0.00076486, -0.00250797,
      -0.00437634, -0.00386091, -0.00132505, 0.00285359, 0.00765448, 0.00133765,
      -0.00236345, -0.00685265, 0.00439299, 0.00444936, -0.00429249,
      -0.00126711, 0.0050103, -0.0002971, -0.00574077, 9.99e-5, -0.00460897,
      -0.00136245, -0.00103365, -0.00386464, -0.00710861, -0.00237862,
      0.00755875, -0.00179883, 0.00231558, 6.604e-5, 0.00154396, -0.00021558,
      -0.0027551, -0.00032889, -0.00167212, 0.00121091, -0.00760358, 0.00504829,
      0.00109615, -0.0031888, -0.00130267, 0.00152098, -0.00501574, -0.00217977,
      6.861e-5, -0.00114619, 0.00190895, -0.00764895, -0.0051405, 0.00061638,
      -0.00074136, 0.00152896, -0.01320257, -0.00133865, -0.0056478, 0.00159641,
      0.00491725, -0.00299555, -0.00099598, -0.00209258, 0.00430896,
      -0.00023658, 0.0021564, 0.00173205, 0.01036883, 0.00158622, -0.00225462,
      -0.00300491, 0.00127948, 0.00157507, -0.00528448, 0.00545114, -0.00253351,
      0.00562417, 0.00183264, 0.001771, 0.00314866, 0.00148606, -0.00088606,
      0.00232755, 0.00227791, -0.00522252, 0.00380462, -0.00076552, -0.00051127,
      -0.00222927, 0.00250332, -0.00287344, -0.00536352, -0.00177606,
      0.00193829, 0.00059754, -0.00504389, -0.02758376, 0.00572244, -0.01295632,
      0.0001924, -0.00118967, -0.00046405, -0.00625868, -0.0078379, -0.00508537,
      0.00298351, 0.00057678, -0.00333898, 0.01139318, -0.00054688, -0.00915931,
      0.00399532, 0.00218967, 0.00116481, -0.00183145, 0.01733203, -0.00209282,
      -0.00266379, 0.00482145, -0.00116952, 0.00059634, 0.01099854, -0.00079988,
      0.002681, 0.00048144, -0.00187959, 0.00076905, 0.00034738, -0.00109521,
      -0.00098925, -0.00645501, -0.00154396, 0.00327715, -0.00675924,
      -0.00111862, 0.00360806, -0.00359747, -0.00278796, 0.0022745, 0.00100599,
      -0.0011467, -0.00115655, 0.00042987, 0.00403447, 0.00499421, 0.00161982,
      8.782e-5, 0.00300536, 0.00144032, -0.00154883,
    ],
    to: [],
    tm: [],
  },
  {
    lead: "MS",
    target: "GS",
    beta: 0.9726,
    th: 80,
    lo: 20,
    label: "Morgan Stanley · Goldman Sachs",
    stats: { trades: 308, win: 59.1, sharpe: 1.74, sortino: 1.52, maxdd: 8.17 },
    sk: [
      0.00029571, -0.00059366, 0.00177545, -0.00127548, 0.00132702, 0.00130466,
      0.00113792, 0.00057077, -0.0056939, 0.00322798, -0.02737444, 0.00425397,
      -0.01343187, -0.00208902, 0.00185675, 0.00404099, -0.00046804, 0.0054879,
      -0.0016498, 0.00116411, 0.00089555, 0.00534781, 0.00014877, 0.00742756,
      0.00112333, 0.00294956, 0.00064636, 0.00073919, 0.00035178, -0.0029459,
      0.0024573, 0.00317836, 0.00143105, -0.00098822, 0.00087923, 0.00202925,
      -0.00099486, 0.00233737, -0.00526772, -0.00109496, -6.766e-5, 0.001916,
      0.00969534, -0.00203014, -0.00246759, -0.00314036, 0.03133516, 0.00148568,
      0.00190636, -0.00508719, 0.00185673, -0.00097887, -0.00145263,
      -0.00234846, -0.00182683, 0.00074107, -0.00020453, -0.00170552,
      -0.00135803, 0.00070825, 0.00099607, -0.00191872, -0.00552306, 0.00569579,
      0.00060938, -0.0045488, 0.00419974, 0.00159049, -0.0025538, -0.00105309,
      -0.00345892, 0.00321557, 0.00703339, -0.00427123, -0.00283828, -2.165e-5,
      0.00338541, -0.00164135, -0.00031284, -0.00026734, -0.00375075,
      -0.00495965, -0.00172784, -0.00018, -0.00013224, -0.00193897, -0.00602818,
      -3.652e-5, -0.0005099, 0.0021465, 0.00068413, -0.00045095, 0.00259024,
      -0.00156798, -0.00123713, -0.00163731, 0.00137619, -0.00261901,
      0.00341778, 0.00024564, -0.00115777, 0.00042929, 0.00060458, 0.00187399,
      -0.00651925, 0.00517447, 0.00567254, -0.00122959, 0.00108707, 0.00257495,
      -0.00342569, 5.925e-5, -0.00395519, 0.00363835, 0.00015063, -0.00184488,
      0.00391439, 0.00342784, 0.00382912, 0.00127467, 0.00271848, -0.00339056,
      0.00282019, 0.00404343, -0.00254075, -0.00355176, -0.00255148,
      -0.00272952, 0.0038906, 0.00324155, 0.00082521, 0.00076401, -0.00028253,
      0.01497862, -0.00182431, 0.01640598, -0.00636379, 0.00086562, -0.00335018,
      0.00241298, 0.00032634, -0.00113982, -0.00360167, 0.00024469, -0.00144765,
      -0.00241071, -0.00071297, -0.0034171, -0.04159044, 0.00085055, 0.00128081,
      0.00131534, 0.00291087, 0.01275976, -0.00128084, -0.00051661, -0.00345983,
      -0.00231145, 0.001903, -0.00089201, 0.00017442, 0.00044665, 0.00522996,
      -0.00252377, -0.00340118, 0.00142353, -0.00148508, 0.00042194,
      -0.00186146, -0.00452238, -0.00436096, 0.00111438, -0.00538901,
      -0.00257101, 0.00242531, -0.00073379, 0.00013256, 0.00234814, 0.00816381,
      0.00114652, 0.00152199, 0.00046693, -0.00145354, -0.0189905, 0.00141954,
      0.00525864, 0.00204682, 0.00256808, -0.00015506, 0.00195032, -0.00309761,
      7.225e-5, -0.00043791, -0.00132197, 0.00103126, 0.0010015, -0.01071724,
      -0.01470519, 0.00564023, -0.00347241, -0.00297776, -0.00062059,
      0.00104972, 0.00711068, -0.00063737, 0.00029364, -0.00319529, 0.00601641,
      0.0028956, -0.00223967, -0.00038354, -0.01217777, -0.03463572,
      -0.00415662, -0.0004419, 0.00196323, 0.0100336, 0.00055327, -0.00296818,
      -0.00277736, -0.00100329, 0.00264924, -0.00252893, 0.00517595,
      -0.00182136, -0.00444977, 0.00213415, -0.01035227, -0.00171532,
      -0.00347466, 0.00504637, 0.00426648, -0.00144976, 0.00093322, -0.00430326,
      0.00028667, -0.00115694, -0.00453628, -0.00033499, 0.00608296, 0.00083487,
      -0.00062115, 0.00020831, 0.00095672, 0.00302591, -0.00145002, 0.00132504,
      0.00195801, 0.00053822, -0.00070178, 0.00121064, -0.00144344, -0.00770312,
      -0.00365581, -0.00012656, 0.00134539, -0.00031771, 0.00174155, 0.00119326,
      0.00066072, -0.00154967, 0.00018661, -0.00406989, -0.00288721, 0.005042,
      0.00017886, -0.00065723, -0.00143003, 0.00342657, 7.3e-7, -0.00073145,
      -0.00285884, 0.00161322, -0.00268776, -0.00135673, -0.00086953,
      -0.00763832, 0.00083628, -0.00115546, 0.0018511, 0.00184339, -0.00454914,
    ],
    to: [],
    tm: [],
  },
  {
    lead: "BAC",
    target: "JPM",
    beta: 0.79948,
    th: 85,
    lo: 15,
    label: "Bank of America · JPMorgan",
    stats: {
      trades: 177,
      win: 54.2,
      sharpe: 1.16,
      sortino: 1.03,
      maxdd: 11.89,
    },
    sk: [
      0.00610608, -0.00392379, 0.02254339, -0.02079042, 0.00513592, -0.01381332,
      0.00143133, 0.00079419, 0.02050675, -0.01057832, -0.0166792, -0.02389852,
      -0.01025566, -0.01438948, 0.00841537, 0.00581541, -0.0009091, 0.00595231,
      0.01509065, -0.02379181, -0.02345244, -0.01222708, 0.01737422,
      -0.01654048, -0.00720407, 0.00117483, -0.00241193, 0.00158318, 0.01469353,
      -0.01434915, 0.01431504, -0.00578069, 0.00178747, -0.02622679, 0.00429259,
      0.00402437, -0.0079694, 0.00494396, 0.00256456, 0.00847896, 0.01462484,
      0.00099074, -0.01786139, 0.01123552, 0.01038343, 0.00252944, 0.00818425,
      0.0107952, 0.00431477, 0.01724886, 0.00709117, 0.01030068, 0.00878479,
      0.00115512, 0.02052726, 0.02070719, 0.00756082, -0.00072975, -0.01979788,
      -0.01050129, 0.01310036, -0.00549889, -0.01402879, 0.00677064, 0.01842544,
      -0.00115523, -0.01444622, 0.0080985, 0.00902263, -0.00308601, 0.00862826,
      0.00590111, 0.01393782, 0.01747738, -0.00370906, 0.01262577, 0.01357259,
      -0.01919053, -0.02107633, -0.01042697, -0.00649725, -0.00288105,
      -0.01442807, 0.00984653, -0.01579951, -0.00198195, -0.00165429,
      0.00370874, -0.00307322, 0.01161934, 0.00999379, -0.01191474, -0.01525333,
      -0.00181147, 0.00396836, -0.00958615, -0.00826981, 0.00649968, 0.02466899,
      -0.02094549, -0.00707191, -0.00703702, -0.00030203, -0.01158421,
      0.00058454, -0.02683082, -0.03164582, -0.0056434, -0.01493612,
      -0.00192207, -0.00817874, 0.00304569, -0.01140654, 0.00851282, 0.03859378,
      -0.00671215, -0.00239232, 0.00159257, -0.01606407, 0.0276051, 0.02511935,
      -0.0306071, -0.00179676, -0.00766994, -0.00655122, 0.01512571,
      -0.01331932, 0.01550528, 0.00947856, 0.00459153, -0.01004378, -0.00378847,
      -0.01284686, -0.00541759, -0.01640367, 0.02000336, 0.00577656, -0.0023389,
      -0.02629286, -0.02883273, 0.01088855, -0.00128076, -2.8e-7, 0.00501564,
      -0.01167286, 0.0055929, -0.00483949, -0.00114709, 0.00344638, -0.00833979,
      -0.00969724, 0.00093355, 0.00235573, 0.00364664, -0.00506084, -0.00579102,
      0.00625956, -0.00716638, 0.00363744, -0.00583789, 0.00339326, 0.01088257,
      0.00486886, -0.00698547, -0.00523462, 0.01004418, -0.00339555, 0.00582752,
      -0.00546006, -0.00309174, 0.00581257, -0.00619502, 0.00491732,
      -0.00348916, 0.00436965, -0.00302615, 0.00637985, 0.00488372, -0.00557581,
      0.00261547, -0.00516923,
    ],
    to: [],
    tm: [],
  },
];

// ── SIGNAL CALC ────────────────────────────────────────────────────────────────
function calcSig(pair, lpc, lo, tpc, to) {
  const ol = lo / lpc - 1;
  const ot = to / tpc - 1;
  const shock = ol - pair.beta * ot;
  const count = pair.sk.filter((x) => x <= shock).length;
  const p = (count / pair.sk.length) * 100;
  const dir = p >= pair.th ? "UP" : p <= pair.lo ? "DN" : null;
  return { ol, ot, shock, p, dir };
}

// ── PERCENTILE BAR ─────────────────────────────────────────────────────────────
function PctBar({ value, th, lo }) {
  const has = value !== null && value !== undefined;
  const firing = has && (value >= th || value <= lo);
  const isUp = has && value >= th;
  const barColor = firing ? (isUp ? C.green : C.red) : C.accent;
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: C.dimmer,
            letterSpacing: "0.10em",
            fontWeight: 600,
          }}
        >
          PERCENTILE RANK
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: has ? barColor : C.dimmest,
            fontFamily: C.font,
          }}
        >
          {has ? `${value.toFixed(1)}th` : "—"}
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: "rgba(255,255,255,0.05)",
          borderRadius: 3,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            width: `${lo}%`,
            height: "100%",
            background: "rgba(239,68,68,0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 0,
            width: `${100 - th}%`,
            height: "100%",
            background: "rgba(34,197,94,0.12)",
          }}
        />
        {has && (
          <div
            style={{
              position: "absolute",
              left: 0,
              height: "100%",
              width: `${value}%`,
              background: barColor,
              borderRadius: 3,
              transition:
                "width 0.6s cubic-bezier(.4,0,.2,1), background 0.3s ease",
              boxShadow: firing ? `0 0 10px ${barColor}60` : "none",
            }}
          />
        )}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: "rgba(239,68,68,0.35)",
            letterSpacing: "0.06em",
            fontWeight: 500,
          }}
        >
          SHORT ≤{lo}th
        </span>
        <span
          style={{
            fontSize: 9,
            color: "rgba(34,197,94,0.35)",
            letterSpacing: "0.06em",
            fontWeight: 500,
          }}
        >
          LONG ≥{th}th
        </span>
      </div>
    </div>
  );
}

// ── PRICE INPUT ────────────────────────────────────────────────────────────────
function PriceInput({ ticker, sub, value, onChange, locked }) {
  const [focused, setFocused] = useState(false);
  const id = `pi-${ticker}-${sub}`;
  return (
    <div
      onClick={() => !locked && document.getElementById(id)?.focus()}
      style={{
        background: locked
          ? "rgba(255,255,255,0.02)"
          : focused
          ? C.accentDim
          : C.surface,
        border: `1px solid ${focused ? C.accentBorder : C.border}`,
        borderRadius: 10,
        padding: "12px 14px",
        cursor: locked ? "default" : "text",
        transition: "border-color 0.15s, background 0.15s",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: C.dimmer,
            letterSpacing: "0.10em",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          {sub}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: focused ? C.accent : C.dimmer,
            letterSpacing: "0.04em",
            transition: "color 0.15s",
          }}
        >
          {ticker}
        </span>
      </div>
      <input
        id={id}
        type="number"
        step="0.01"
        placeholder="0.00"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        readOnly={locked}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          outline: "none",
          color: value ? (locked ? C.dim : C.white) : "rgba(255,255,255,0.12)",
          fontSize: 16,
          fontWeight: 600,
          fontFamily: C.font,
          cursor: locked ? "default" : "text",
        }}
      />
      {locked && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 12,
            fontSize: 8,
            color: C.accent,
            letterSpacing: "0.10em",
            fontWeight: 700,
            background: C.accentDim,
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          AUTO
        </div>
      )}
    </div>
  );
}

// ── LIVE BADGE ─────────────────────────────────────────────────────────────────
function LiveBadge({ time }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        background: C.accentDim,
        border: `1px solid ${C.accentBorder}`,
        borderRadius: 20,
        padding: "3px 10px",
      }}
    >
      <div
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: C.accent,
          animation: "pulse 2s infinite",
        }}
      />
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: C.accent,
          letterSpacing: "0.10em",
        }}
      >
        LIVE · {time}
      </span>
    </div>
  );
}

// ── HELPERS ────────────────────────────────────────────────────────────────────
function CopyIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function getNextMarketOpen(now) {
  const d = now.getDay(),
    h = now.getHours(),
    m = now.getMinutes();
  const mins = h * 60 + m;
  if (d >= 1 && d <= 5 && mins >= 570 && mins < 960) return null;
  let add = 0;
  if (d === 0) add = 1;
  else if (d === 6) add = 2;
  else if (mins >= 960) add = d === 5 ? 3 : 1;
  const t = new Date(now);
  t.setDate(t.getDate() + add);
  t.setHours(9, 30, 0, 0);
  const diff = Math.max(0, t - now);
  return {
    h: Math.floor(diff / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
    date: t,
  };
}

// ── PAIR ACCORDION ─────────────────────────────────────────────────────────────
function PairAccordion({ pair, open, onToggle, onLogTrade, liveData }) {
  const isLive = !!liveData;
  const [v, setV] = useState({
    lpc: liveData ? String(liveData.lead_prev_close) : "",
    lo: liveData ? String(liveData.lead_open) : "",
    tpc: liveData ? String(liveData.target_prev_close) : "",
    to: liveData ? String(liveData.target_open) : "",
  });

  useEffect(() => {
    if (liveData)
      setV({
        lpc: String(liveData.lead_prev_close),
        lo: String(liveData.lead_open),
        tpc: String(liveData.target_prev_close),
        to: String(liveData.target_open),
      });
  }, [liveData]);

  const upd = (k, val) => {
    if (!isLive) setV((p) => ({ ...p, [k]: val }));
  };
  const filled = +v.lpc && +v.lo && +v.tpc && +v.to;
  const result = filled ? calcSig(pair, +v.lpc, +v.lo, +v.tpc, +v.to) : null;
  const hasSignal = !!result?.dir;
  const isUp = result?.dir === "UP";
  const sc = isUp ? C.green : hasSignal ? C.red : null;
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    const d = new Date();
    const action = isUp
      ? `Short ${pair.lead} \u00b7 Long ${pair.target}`
      : `Long ${pair.lead} \u00b7 Short ${pair.target}`;
    const text = `Quantile Signal \u2014 ${action} \u00b7 ${result.p.toFixed(
      1
    )}th percentile \u00b7 ${d
      .toISOString()
      .slice(0, 10)} ${d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })} ET`;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };

  const handleLog = () => {
    if (!result?.dir) return;
    onLogTrade({
      id: Date.now().toString(),
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      pair: `${pair.lead}/${pair.target}`,
      direction: result.dir,
      action: isUp
        ? `Short ${pair.lead} · Long ${pair.target}`
        : `Long ${pair.lead} · Short ${pair.target}`,
      percentile: result.p.toFixed(1),
      lead_gap: (result.ol * 100).toFixed(3),
      target_gap: (result.ot * 100).toFixed(3),
      entry_lead: +v.lo,
      entry_target: +v.to,
      outcome: "pending",
      pnl: null,
      notes: "",
    });
  };

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${
          hasSignal ? (isUp ? C.greenBorder : C.redBorder) : C.border
        }`,
        borderRadius: 14,
        overflow: "hidden",
        transition: "border-color 0.25s ease, box-shadow 0.25s ease",
        boxShadow: hasSignal
          ? `0 0 24px ${isUp ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)"}`
          : "none",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "18px 20px",
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 17,
                fontWeight: 500,
                color: C.dim,
                letterSpacing: "-0.03em",
                fontFamily: C.font,
              }}
            >
              {pair.lead}
            </span>
            <span style={{ color: C.dimmest, fontSize: 15, fontWeight: 300 }}>
              /
            </span>
            <span
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: C.white,
                letterSpacing: "-0.03em",
                fontFamily: C.font,
              }}
            >
              {pair.target}
            </span>
            {hasSignal && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.10em",
                  color: sc,
                  background: isUp ? C.greenDim : C.redDim,
                  border: `1px solid ${isUp ? C.greenBorder : C.redBorder}`,
                  padding: "3px 8px",
                  borderRadius: 6,
                }}
              >
                {isUp ? "▲ LONG" : "▼ SHORT"}
              </span>
            )}
            {isLive && !hasSignal && (
              <span
                style={{
                  fontSize: 9,
                  color: C.accent,
                  opacity: 0.5,
                  letterSpacing: "0.04em",
                }}
              >
                auto
              </span>
            )}
          </div>
          <span style={{ fontSize: 11, color: C.dimmer }}>{pair.label}</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
            marginLeft: 12,
          }}
        >
          {!open && (
            <span
              style={{
                fontSize: 10,
                color: hasSignal ? C.green : "rgba(255,255,255,0.22)",
                fontFamily: C.font,
                fontWeight: 600,
                transition: "color 0.25s",
              }}
            >
              {pair.stats.win}%
            </span>
          )}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: `1px solid ${open ? C.accentBorder : C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.22s ease, border-color 0.15s",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 4.5L6 8.5L10 4.5"
                stroke={open ? C.accent : C.dimmer}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </button>

      {open && (
        <div
          style={{ padding: "0 20px 20px", animation: "slideDown 0.22s ease" }}
        >
          <div style={{ height: 1, background: C.border, marginBottom: 20 }} />
          <PctBar value={result?.p ?? null} th={pair.th} lo={pair.lo} />
          {hasSignal && result && (
            <div
              style={{
                fontSize: 10,
                color: sc,
                marginTop: -12,
                marginBottom: 12,
                fontFamily: C.font,
                fontWeight: 600,
              }}
            >
              {isUp
                ? `${(result.p - pair.th).toFixed(1)}pts above threshold`
                : `${(pair.lo - result.p).toFixed(1)}pts below threshold`}
            </div>
          )}

          <div
            style={{
              borderRadius: 10,
              padding: "16px 18px",
              textAlign: "center",
              marginBottom: 16,
              background: hasSignal
                ? isUp
                  ? C.greenDim
                  : C.redDim
                : "rgba(255,255,255,0.02)",
              border: `1px solid ${
                hasSignal
                  ? isUp
                    ? C.greenBorder
                    : C.redBorder
                  : "rgba(255,255,255,0.05)"
              }`,
              transition: "all 0.25s ease",
              minHeight: 60,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 4,
            }}
          >
            {hasSignal ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: C.white,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {isUp
                      ? `Short ${pair.lead} · Long ${pair.target}`
                      : `Long ${pair.lead} · Short ${pair.target}`}
                  </div>
                  <button
                    onClick={handleCopy}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: `1px solid ${C.border}`,
                      background: "transparent",
                      color: C.dimmer,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <CopyIcon size={13} />
                  </button>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: sc,
                    letterSpacing: "0.02em",
                    fontWeight: 500,
                  }}
                >
                  {result.p.toFixed(1)}th percentile · enter at open · exit at
                  close
                </div>
                {copied && (
                  <div
                    style={{
                      fontSize: 10,
                      color: C.accent,
                      fontWeight: 600,
                      animation: "fadeUp 0.15s ease",
                    }}
                  >
                    Copied
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 12, color: C.dimmer }}>
                {result
                  ? `${result.p.toFixed(1)}th — need ≥${pair.th} or ≤${pair.lo}`
                  : isLive
                  ? "Prices loaded — no signal today"
                  : "Enter today's opening prices"}
              </div>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <PriceInput
              ticker={pair.lead}
              sub="Prev Close"
              value={v.lpc}
              onChange={(val) => upd("lpc", val)}
              locked={isLive}
            />
            <PriceInput
              ticker={pair.lead}
              sub="Today Open"
              value={v.lo}
              onChange={(val) => upd("lo", val)}
              locked={isLive}
            />
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <PriceInput
              ticker={pair.target}
              sub="Prev Close"
              value={v.tpc}
              onChange={(val) => upd("tpc", val)}
              locked={isLive}
            />
            <PriceInput
              ticker={pair.target}
              sub="Today Open"
              value={v.to}
              onChange={(val) => upd("to", val)}
              locked={isLive}
            />
          </div>

          {result && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginTop: 8,
              }}
            >
              {[
                { label: `${pair.lead} gap`, val: result.ol },
                { label: `${pair.target} gap`, val: result.ot },
              ].map(({ label, val }) => (
                <div
                  key={label}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: "8px 12px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: C.dimmer,
                      marginBottom: 3,
                      letterSpacing: "0.08em",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: C.font,
                      color: val > 0 ? C.green : C.red,
                    }}
                  >
                    {val >= 0 ? "+" : ""}
                    {(val * 100).toFixed(3)}%
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasSignal && (
            <button
              onClick={handleLog}
              style={{
                width: "100%",
                marginTop: 12,
                background: C.accentDim,
                border: `1px solid ${C.accentBorder}`,
                borderRadius: 10,
                padding: "12px 16px",
                color: C.accent,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "0.01em",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(59,130,246,0.18)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = C.accentDim)
              }
            >
              + Log This Trade
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── TRADE LOG ──────────────────────────────────────────────────────────────────
function TradeLogPage({ entries, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [confirmDel, setConfirmDel] = useState(null);

  const wins = entries.filter((e) => e.outcome === "win").length;
  const pending = entries.filter((e) => e.outcome === "pending").length;
  const totalPnl = entries.reduce((s, e) => s + (e.pnl || 0), 0);
  const settled = entries.filter((e) => e.outcome !== "pending");
  const winRate =
    settled.length > 0 ? ((wins / settled.length) * 100).toFixed(1) : null;

  const oc = (o) => (o === "win" ? C.green : o === "loss" ? C.red : C.yellow);
  const ob = (o) =>
    o === "win" ? C.greenDim : o === "loss" ? C.redDim : C.yellowDim;
  const obr = (o) =>
    o === "win" ? C.greenBorder : o === "loss" ? C.redBorder : C.yellowBorder;

  const startEdit = (e) => {
    setEditingId(e.id);
    setEditData({ outcome: e.outcome, pnl: e.pnl ?? "", notes: e.notes ?? "" });
  };
  const saveEdit = (id) => {
    onUpdate(id, {
      outcome: editData.outcome,
      pnl: editData.pnl !== "" ? +editData.pnl : null,
      notes: editData.notes,
    });
    setEditingId(null);
  };

  return (
    <div style={{ padding: "20px 20px 80px" }}>
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            marginBottom: 4,
            color: C.white,
          }}
        >
          Trade Log
        </h2>
        <p style={{ fontSize: 12, color: C.dimmer }}>
          Live paper trading record · $100/leg
        </p>
      </div>

      {entries.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 8,
            marginBottom: 20,
          }}
        >
          {[
            { label: "Trades", value: entries.length, color: C.white },
            {
              label: "Win Rate",
              value: winRate ? `${winRate}%` : "—",
              color: C.green,
            },
            {
              label: "Total P&L",
              value:
                totalPnl !== 0
                  ? `${totalPnl > 0 ? "+" : ""}$${totalPnl.toFixed(0)}`
                  : "—",
              color: totalPnl > 0 ? C.green : totalPnl < 0 ? C.red : C.dim,
            },
            { label: "Pending", value: pending, color: C.yellow },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "12px 10px",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: C.dimmer,
                  letterSpacing: "0.08em",
                  marginBottom: 5,
                  fontWeight: 600,
                }}
              >
                {label.toUpperCase()}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color,
                  letterSpacing: "-0.03em",
                  fontFamily: C.font,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 ? (
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: "48px 20px",
            textAlign: "center",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              marginBottom: 14,
              opacity: 0.15,
              display: "block",
              margin: "0 auto 14px",
            }}
          >
            <rect
              x="5"
              y="3"
              width="14"
              height="18"
              rx="2"
              stroke="#fff"
              strokeWidth="1.5"
            />
            <line
              x1="8"
              y1="8"
              x2="16"
              y2="8"
              stroke="#fff"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="8"
              y1="12"
              x2="16"
              y2="12"
              stroke="#fff"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="8"
              y1="16"
              x2="12"
              y2="16"
              stroke="#fff"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <div style={{ fontSize: 14, color: C.dimmer, marginBottom: 6 }}>
            No trades logged yet
          </div>
          <div style={{ fontSize: 12, color: C.dimmest }}>
            Generate a signal and tap Log This Trade
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...entries].reverse().map((entry) => (
            <div
              key={entry.id}
              style={{
                background: C.surface,
                border: `1px solid ${
                  editingId === entry.id ? C.accentBorder : C.border
                }`,
                borderRadius: 14,
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              <div style={{ padding: "14px 16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        marginBottom: 4,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: C.white,
                          letterSpacing: "-0.02em",
                          fontFamily: C.font,
                        }}
                      >
                        {entry.pair}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          color: entry.direction === "UP" ? C.green : C.red,
                          background:
                            entry.direction === "UP" ? C.greenDim : C.redDim,
                          border: `1px solid ${
                            entry.direction === "UP"
                              ? C.greenBorder
                              : C.redBorder
                          }`,
                          padding: "2px 7px",
                          borderRadius: 6,
                        }}
                      >
                        {entry.direction === "UP" ? "▲ LONG" : "▼ SHORT"}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: oc(entry.outcome),
                          background: ob(entry.outcome),
                          border: `1px solid ${obr(entry.outcome)}`,
                          padding: "2px 7px",
                          borderRadius: 6,
                        }}
                      >
                        {entry.outcome}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: C.dimmer }}>
                      {entry.action}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: C.dimmer,
                        fontFamily: C.font,
                      }}
                    >
                      {entry.date}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: C.dimmest,
                        fontFamily: C.font,
                      }}
                    >
                      {entry.time} ET
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    marginBottom: editingId === entry.id ? 14 : 0,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 8,
                        color: C.dimmer,
                        letterSpacing: "0.08em",
                        marginBottom: 2,
                        fontWeight: 600,
                      }}
                    >
                      PCTILE
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.accent,
                        fontFamily: C.font,
                      }}
                    >
                      {entry.percentile}th
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 8,
                        color: C.dimmer,
                        letterSpacing: "0.08em",
                        marginBottom: 2,
                        fontWeight: 600,
                      }}
                    >
                      LEAD GAP
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: C.font,
                        color: +entry.lead_gap > 0 ? C.green : C.red,
                      }}
                    >
                      {+entry.lead_gap > 0 ? "+" : ""}
                      {entry.lead_gap}%
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 8,
                        color: C.dimmer,
                        letterSpacing: "0.08em",
                        marginBottom: 2,
                        fontWeight: 600,
                      }}
                    >
                      P&L
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: C.font,
                        color:
                          entry.pnl > 0
                            ? C.green
                            : entry.pnl < 0
                            ? C.red
                            : C.dimmer,
                      }}
                    >
                      {entry.pnl !== null
                        ? `${entry.pnl > 0 ? "+" : ""}$${Number(
                            entry.pnl
                          ).toFixed(2)}`
                        : "—"}
                    </div>
                  </div>
                  {entry.notes && (
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 8,
                          color: C.dimmer,
                          letterSpacing: "0.08em",
                          marginBottom: 2,
                          fontWeight: 600,
                        }}
                      >
                        NOTES
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: C.dim,
                          lineHeight: 1.4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.notes}
                      </div>
                    </div>
                  )}
                </div>
                {editingId === entry.id && (
                  <div style={{ animation: "slideDown 0.15s ease" }}>
                    <div
                      style={{
                        height: 1,
                        background: C.border,
                        marginBottom: 14,
                      }}
                    />
                    <div style={{ marginBottom: 10 }}>
                      <div
                        style={{
                          fontSize: 9,
                          color: C.dimmer,
                          letterSpacing: "0.08em",
                          marginBottom: 7,
                          fontWeight: 600,
                        }}
                      >
                        OUTCOME
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {["win", "loss", "pending"].map((o) => (
                          <button
                            key={o}
                            onClick={() =>
                              setEditData((p) => ({ ...p, outcome: o }))
                            }
                            style={{
                              flex: 1,
                              background:
                                editData.outcome === o
                                  ? ob(o)
                                  : "rgba(255,255,255,0.03)",
                              border: `1px solid ${
                                editData.outcome === o ? obr(o) : C.border
                              }`,
                              borderRadius: 8,
                              padding: "9px 0",
                              color: editData.outcome === o ? oc(o) : C.dimmer,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              transition: "all 0.15s",
                            }}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div
                        style={{
                          fontSize: 9,
                          color: C.dimmer,
                          letterSpacing: "0.08em",
                          marginBottom: 7,
                          fontWeight: 600,
                        }}
                      >
                        P&L ($)
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 24.50 or -18.20"
                        value={editData.pnl}
                        onChange={(e) =>
                          setEditData((p) => ({ ...p, pnl: e.target.value }))
                        }
                        style={{
                          width: "100%",
                          background: C.surface2,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: "10px 12px",
                          color: C.white,
                          fontSize: 14,
                          fontFamily: C.font,
                          outline: "none",
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div
                        style={{
                          fontSize: 9,
                          color: C.dimmer,
                          letterSpacing: "0.08em",
                          marginBottom: 7,
                          fontWeight: 600,
                        }}
                      >
                        NOTES
                      </div>
                      <textarea
                        placeholder="Optional notes..."
                        value={editData.notes}
                        onChange={(e) =>
                          setEditData((p) => ({ ...p, notes: e.target.value }))
                        }
                        rows={2}
                        style={{
                          width: "100%",
                          background: C.surface2,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: "10px 12px",
                          color: C.white,
                          fontSize: 12,
                          fontFamily: C.font,
                          outline: "none",
                          resize: "none",
                          lineHeight: 1.5,
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => saveEdit(entry.id)}
                        style={{
                          flex: 1,
                          background: C.accentDim,
                          border: `1px solid ${C.accentBorder}`,
                          borderRadius: 8,
                          padding: "10px",
                          color: C.accent,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          flex: 1,
                          background: "rgba(255,255,255,0.03)",
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: "10px",
                          color: C.dimmer,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {editingId !== entry.id && (
                <div
                  style={{
                    display: "flex",
                    borderTop: `1px solid ${C.border}`,
                  }}
                >
                  <button
                    onClick={() => startEdit(entry)}
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      borderRight: `1px solid ${C.border}`,
                      padding: "10px",
                      color: C.dimmer,
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = C.white)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = C.dimmer)
                    }
                  >
                    Edit
                  </button>
                  {confirmDel === entry.id ? (
                    <>
                      <button
                        onClick={() => {
                          onDelete(entry.id);
                          setConfirmDel(null);
                        }}
                        style={{
                          flex: 1,
                          background: C.redDim,
                          border: "none",
                          borderRight: `1px solid ${C.border}`,
                          padding: "10px",
                          color: C.red,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDel(null)}
                        style={{
                          flex: 1,
                          background: "transparent",
                          border: "none",
                          padding: "10px",
                          color: C.dimmer,
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDel(entry.id)}
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        padding: "10px",
                        color: C.dimmer,
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = C.red)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = C.dimmer)
                      }
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── RESEARCH ───────────────────────────────────────────────────────────────────
function ResearchPage() {
  return (
    <div style={{ padding: "20px 20px 80px" }}>
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            marginBottom: 4,
            color: C.white,
          }}
        >
          Research
        </h2>
        <p style={{ fontSize: 12, color: C.dimmer }}>
          Jan 2023 – Mar 2026 · $100/leg · slippage included · open-to-close
        </p>
      </div>

      <div
        style={{
          background: C.accentDim,
          border: `1px solid ${C.accentBorder}`,
          borderRadius: 14,
          padding: "20px",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: C.accent,
            letterSpacing: "0.14em",
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          COMBINED PORTFOLIO
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          {[
            { label: "Win Rate", value: "59.7%", color: C.green },
            { label: "Sharpe", value: "2.75", color: C.accent },
            { label: "Sortino", value: "3.94", color: C.accent },
            { label: "Max Drawdown", value: "$30", color: C.dim },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: C.dimmer, marginBottom: 5 }}>
                {label}
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color,
                  letterSpacing: "-0.04em",
                  fontFamily: C.font,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {PAIRS.map((pair) => (
        <div
          key={pair.lead}
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: "16px",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 14,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: C.white,
                  marginBottom: 3,
                }}
              >
                {pair.lead}{" "}
                <span style={{ color: C.dimmest, fontWeight: 300 }}>/</span>{" "}
                {pair.target}
              </div>
              <div style={{ fontSize: 11, color: C.dimmer }}>{pair.label}</div>
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.green,
                background: C.greenDim,
                border: `1px solid ${C.greenBorder}`,
                padding: "4px 10px",
                borderRadius: 8,
                fontFamily: C.font,
              }}
            >
              {pair.stats.win}%
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 10,
            }}
          >
            {[
              { label: "Trades", value: pair.stats.trades },
              { label: "Sharpe", value: pair.stats.sharpe },
              { label: "Sortino", value: pair.stats.sortino },
              { label: "Max DD", value: `$${pair.stats.maxdd}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div
                  style={{
                    fontSize: 9,
                    color: C.dimmer,
                    letterSpacing: "0.08em",
                    marginBottom: 3,
                    fontWeight: 600,
                  }}
                >
                  {label.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.dim,
                    fontFamily: C.font,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: "16px",
          marginTop: 4,
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: C.dimmer,
            letterSpacing: "0.14em",
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          METHODOLOGY
        </div>
        {[
          [
            "Strategy",
            "Beta-adjusted overnight gap shock, ranked against 3-year historical distribution",
          ],
          ["Formula", "shock = lead_gap − β × target_gap"],
          ["Entry", "Market open · exit at market close · dollar neutral"],
          ["Data", "Yahoo Finance OHLCV · logic verified vs HTML scorecard"],
        ].map(([k, v]) => (
          <div
            key={k}
            style={{
              display: "flex",
              gap: 14,
              marginBottom: 10,
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: C.dimmer,
                minWidth: 60,
                flexShrink: 0,
                fontWeight: 600,
              }}
            >
              {k}
            </span>
            <span
              style={{
                fontSize: 11,
                color: C.dim,
                fontFamily: C.mono,
                lineHeight: 1.6,
              }}
            >
              {v}
            </span>
          </div>
        ))}
      </div>

      <p
        style={{
          marginTop: 24,
          fontSize: 9,
          color: "rgba(255,255,255,0.08)",
          letterSpacing: "0.08em",
          textAlign: "center",
          lineHeight: 2,
        }}
      >
        FOR RESEARCH AND EDUCATIONAL PURPOSES ONLY · NOT FINANCIAL ADVICE
      </p>
      <a
        href="https://pdonohue3.gumroad.com/l/qobvqy"
        target="_blank"
        style={{
          display: "block",
          marginTop: 14,
          textAlign: "center",
          fontSize: 11,
          color: "rgba(59,130,246,0.55)",
          letterSpacing: "0.04em",
          textDecoration: "none",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = C.accent)}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "rgba(59,130,246,0.55)")
        }
      >
        Want full automation? Get the script — $99 →
      </a>
    </div>
  );
}

// ── APP ────────────────────────────────────────────────────────────────────────
export default function Quantile() {
  const [tab, setTab] = useState("signals");
  const [openSet, setOpenSet] = useState(new Set([0]));
  const [now, setNow] = useState(new Date());
  const [logEntries, setLogEntries] = useState([]);
  const [logLoaded, setLogLoaded] = useState(false);
  const [livePrices, setLivePrices] = useState(null);
  const [livePriceTime, setLivePriceTime] = useState(null);
  const [liveLoadTs, setLiveLoadTs] = useState(null);
  const [onboarded, setOnboarded] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    loadLog().then((e) => {
      setLogEntries(e);
      setLogLoaded(true);
    });
  }, []);
  useEffect(() => {
    try {
      window.storage
        .get("quantile-onboarded")
        .then((r) => {
          if (!r || r.value !== "true") setOnboarded(false);
        })
        .catch(() => {});
    } catch {}
  }, []);
  useEffect(() => {
    const load = async () => {
      const d = await fetchLivePrices();
      if (d) {
        setLivePrices(d.tickers);
        setLivePriceTime(d.time);
        setLiveLoadTs(Date.now());
      }
    };
    load();
    const t = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const toggle = (i) =>
    setOpenSet((prev) => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  const addLogEntry = (entry) => {
    const u = [...logEntries, entry];
    setLogEntries(u);
    saveLog(u);
    setTab("log");
  };
  const updateLogEntry = (id, changes) => {
    const u = logEntries.map((e) => (e.id === id ? { ...e, ...changes } : e));
    setLogEntries(u);
    saveLog(u);
  };
  const deleteLogEntry = (id) => {
    const u = logEntries.filter((e) => e.id !== id);
    setLogEntries(u);
    saveLog(u);
  };
  const getLiveData = (pair) => {
    if (!livePrices) return null;
    const lp = livePrices[pair.lead],
      tp = livePrices[pair.target];
    if (!lp || !tp) return null;
    return {
      lead_prev_close: lp.prev_close,
      lead_open: lp.open,
      target_prev_close: tp.prev_close,
      target_open: tp.open,
    };
  };

  const day = now.getDay(),
    h = now.getHours(),
    m = now.getMinutes();
  const isOpen = day >= 1 && day <= 5 && h * 60 + m >= 570 && h * 60 + m < 960;
  const pad = (n) => String(n).padStart(2, "0");
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const pendingCount = logEntries.filter((e) => e.outcome === "pending").length;
  const TABS = [
    { key: "signals", label: "Signals" },
    { key: "log", label: "Log", badge: pendingCount > 0 ? pendingCount : null },
    { key: "research", label: "Research" },
  ];
  const countdown = isOpen ? null : getNextMarketOpen(now);
  const signalCount = livePrices
    ? PAIRS.reduce((c, p) => {
        const ld = getLiveData(p);
        if (!ld) return c;
        const r = calcSig(
          p,
          ld.lead_prev_close,
          ld.lead_open,
          ld.target_prev_close,
          ld.target_open
        );
        return c + (r.dir ? 1 : 0);
      }, 0)
    : null;
  const dismissOnboarding = () => {
    setOnboarded(true);
    try {
      window.storage.set("quantile-onboarded", "true");
    } catch {}
  };
  const ageMin = liveLoadTs ? Math.floor((now - liveLoadTs) / 60000) : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.white,
        fontFamily: C.font,
        maxWidth: 430,
        margin: "0 auto",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;}
        input[type=number]{-moz-appearance:textfield;}
        textarea{-webkit-appearance:none;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes charReveal{from{opacity:0;transform:translateY(5px);filter:blur(2px)}to{opacity:1;transform:translateY(0);filter:blur(0)}}
        button{transition:opacity 0.1s,transform 0.1s;}
        button:active{opacity:0.65;transform:scale(0.98);}
        a{-webkit-tap-highlight-color:transparent;}
      `}</style>

      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(0,0,0,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: `1px solid ${C.border}`,
          padding: "0 20px",
          height: 60,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SignalMark size={28} />
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: C.white,
                lineHeight: 1.15,
              }}
            >
              Quantile
            </div>
            <div
              style={{
                fontSize: 8,
                color: C.dimmer,
                letterSpacing: "0.16em",
                fontWeight: 600,
                marginTop: 1,
              }}
            >
              PAIRS TRADING
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {livePriceTime && <LiveBadge time={livePriceTime} />}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isOpen ? C.green : "rgba(255,255,255,0.15)",
                boxShadow: isOpen ? `0 0 8px ${C.green}60` : "none",
                animation: isOpen ? "pulse 2s infinite" : "none",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: isOpen ? C.green : C.dimmer,
                letterSpacing: "0.08em",
              }}
            >
              {isOpen ? "OPEN" : "CLOSED"}
            </span>
          </div>
          <span
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.15)",
              fontFamily: C.font,
            }}
          >
            {DAYS[day]} {pad(h)}:{pad(m)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${C.border}`,
          padding: "0 20px",
          background: C.bg,
        }}
      >
        {TABS.map(({ key, label, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "14px 0",
              marginRight: 24,
              fontSize: 13,
              fontWeight: tab === key ? 700 : 400,
              color: tab === key ? C.white : C.dimmer,
              borderBottom: `2px solid ${
                tab === key ? C.accent : "transparent"
              }`,
              letterSpacing: "-0.01em",
              transition: "color 0.15s,border-color 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {label}
            {badge && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  background: C.yellow,
                  color: "#000",
                  borderRadius: 20,
                  padding: "1px 6px",
                  letterSpacing: "0.02em",
                  lineHeight: "16px",
                }}
              >
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Signals */}
      {tab === "signals" && (
        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                marginBottom: 4,
                color: C.white,
                display: "flex",
                gap: "0.3em",
              }}
            >
              {"Today's Signals".split(" ").map((w, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    animation: `charReveal 0.4s ease ${i * 0.1}s both`,
                  }}
                >
                  {w}
                </span>
              ))}
            </h1>
            <p style={{ fontSize: 12, color: C.dimmer }}>
              {livePriceTime
                ? `Prices auto-loaded \u00b7 ${livePriceTime} ET${
                    ageMin !== null
                      ? ` \u00b7 ${ageMin < 1 ? "just now" : `${ageMin}m ago`}`
                      : ""
                  }`
                : isOpen
                ? "Market open \u2014 enter prices to generate signals"
                : "Market closed \u2014 opens 9:30 AM ET weekdays"}
            </p>
          </div>

          {!onboarded && (
            <div
              style={{
                background: C.accentDim,
                border: `1px solid ${C.accentBorder}`,
                borderRadius: 14,
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <p
                style={{ fontSize: 12, color: C.dim, lineHeight: 1.5, flex: 1 }}
              >
                Enter yesterday's close and today's open for each pair. A signal
                fires when the shock hits the threshold.
              </p>
              <button
                onClick={dismissOnboarding}
                style={{
                  background: C.accent,
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                Got it
              </button>
            </div>
          )}

          {!isOpen && !livePrices && countdown && (
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.15)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      color: C.dimmer,
                      letterSpacing: "0.10em",
                      fontWeight: 600,
                    }}
                  >
                    MARKET CLOSED
                  </span>
                </div>
                <span
                  style={{ fontSize: 10, color: C.dimmest, fontFamily: C.font }}
                >
                  {DAYS[day]} {pad(h)}:{pad(m)}:{pad(now.getSeconds())} ET
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                }}
              >
                {[
                  { label: "HOURS", val: String(countdown.h) },
                  { label: "MINUTES", val: pad(countdown.m) },
                  { label: "SECONDS", val: pad(countdown.s) },
                ].map(({ label, val }) => (
                  <div
                    key={label}
                    style={{
                      background: C.accentDim,
                      border: `1px solid ${C.accentBorder}`,
                      borderRadius: 10,
                      padding: "10px 8px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: C.dimmer,
                        letterSpacing: "0.08em",
                        fontWeight: 600,
                        marginBottom: 5,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: C.accent,
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {signalCount !== null && (
            <div
              style={{
                height: 36,
                display: "flex",
                alignItems: "center",
                paddingLeft: 4,
                borderBottom: `1px solid ${C.border}`,
                background: C.surface,
                borderRadius: 0,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  color: signalCount > 0 ? C.green : C.dimmer,
                }}
              >
                {signalCount > 0
                  ? `${signalCount} / ${PAIRS.length} SIGNALS ACTIVE`
                  : "NO SIGNALS TODAY"}
              </span>
            </div>
          )}

          {PAIRS.map((pair, i) => (
            <div
              key={pair.lead}
              style={{ animation: `fadeUp 0.22s ease ${i * 0.05}s both` }}
            >
              <PairAccordion
                pair={pair}
                open={openSet.has(i)}
                onToggle={() => toggle(i)}
                onLogTrade={addLogEntry}
                liveData={getLiveData(pair)}
              />
            </div>
          ))}
        </div>
      )}

      {tab === "log" && (
        <TradeLogPage
          entries={logEntries}
          onUpdate={updateLogEntry}
          onDelete={deleteLogEntry}
        />
      )}
      {tab === "research" && <ResearchPage />}

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 430,
          height: 64,
          background: `linear-gradient(to top,${C.bg} 50%,transparent)`,
          zIndex: 50,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
