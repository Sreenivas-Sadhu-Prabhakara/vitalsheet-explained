/* ============================================================
   vitalsheet-explained — the facts this explainer states, plus
   the same core formulas the vitalsheet app uses, so every
   number shown in the animated demos is COMPUTED, not typed in.

   Every fact carries provenance (source_title, source_url,
   verified_on). Band wording and cut-points mirror the app's
   hand-verified corpus (vitalsheet data/bands.js, verified
   2026-07-23) and its primary sources. Nothing is fabricated.

   Dual export: browser global + Node (for test/*.test.js).
   ============================================================ */

const CSP_META =
  "default-src 'self'; connect-src 'none'; img-src 'self' data:; " +
  "base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'";

const APP_URL = "https://sreenivas-sadhu-prabhakara.github.io/vitalsheet/";

/* ---- cited facts the page states ---------------------------- */

const FACTS = [
  {
    id: "bp-normal", kind: "bp-category", label: "Normal",
    sys_lo: null, sys_hi: 120, cmp: "and", dia_lo: null, dia_hi: 80,
    rule: "Systolic LESS THAN 120 mm Hg AND diastolic LESS THAN 80 mm Hg.",
    source_title: "American Heart Association — Understanding Blood Pressure Readings (2017 ACC/AHA categories)",
    source_url: "https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings",
    verified_on: "2026-07-23"
  },
  {
    id: "bp-elevated", kind: "bp-category", label: "Elevated",
    sys_lo: 120, sys_hi: 130, cmp: "and", dia_lo: null, dia_hi: 80,
    rule: "Systolic 120–129 mm Hg AND diastolic LESS THAN 80 mm Hg.",
    source_title: "American Heart Association — Understanding Blood Pressure Readings (2017 ACC/AHA categories)",
    source_url: "https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings",
    verified_on: "2026-07-23"
  },
  {
    id: "bp-stage1", kind: "bp-category", label: "Hypertension Stage 1",
    sys_lo: 130, sys_hi: 140, cmp: "or", dia_lo: 80, dia_hi: 90,
    rule: "Systolic 130–139 mm Hg OR diastolic 80–89 mm Hg.",
    source_title: "American Heart Association — Understanding Blood Pressure Readings (2017 ACC/AHA categories)",
    source_url: "https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings",
    verified_on: "2026-07-23"
  },
  {
    id: "bp-stage2", kind: "bp-category", label: "Hypertension Stage 2",
    sys_lo: 140, sys_hi: null, cmp: "or", dia_lo: 90, dia_hi: null,
    rule: "Systolic 140 mm Hg or higher OR diastolic 90 mm Hg or higher.",
    source_title: "American Heart Association — Understanding Blood Pressure Readings (2017 ACC/AHA categories)",
    source_url: "https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings",
    verified_on: "2026-07-23"
  },
  {
    id: "bp-crisis", kind: "bp-category", label: "Hypertensive Crisis",
    sys_lo: 180, sys_hi: null, cmp: "and/or", dia_lo: 120, dia_hi: null, exclusive_lo: true,
    rule: "Systolic HIGHER THAN 180 mm Hg and/or diastolic HIGHER THAN 120 mm Hg.",
    source_title: "American Heart Association — Understanding Blood Pressure Readings (2017 ACC/AHA categories)",
    source_url: "https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings",
    verified_on: "2026-07-23"
  },
  {
    id: "bp-higher-wins", kind: "bp-rule", label: "Higher category applies",
    rule: "Individuals with systolic and diastolic in 2 categories should be designated to the higher blood pressure category.",
    source_title: "Whelton et al., 2017 ACC/AHA High Blood Pressure Guideline (Hypertension. 2018;71:e13–e115)",
    source_url: "https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065",
    verified_on: "2026-07-23"
  },
  {
    id: "glu-individualized", kind: "caveat", label: "targets are individualized",
    rule: "More or less stringent glycemic goals may be appropriate for individuals. Goals should be individualized.",
    source_title: "ADA — Glycemic Goals and Hypoglycemia, Standards of Care in Diabetes (Table 6.2 footnotes)",
    source_url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10725808/",
    verified_on: "2026-07-23"
  },
  {
    id: "glu-conversion", kind: "unit", label: "mg/dL → mmol/L", factor: 18.016,
    rule: "Divide mg/dL by 18.016 to obtain mmol/L (glucose molar mass ≈ 180.16 g/mol).",
    source_title: "Diabetes in America (NIH/NIDDK), glucose unit-conversion table",
    source_url: "https://www.ncbi.nlm.nih.gov/books/NBK567981/table/app1.tab2/",
    verified_on: "2026-07-23"
  },
  {
    id: "app-csp", kind: "app-fact", label: "connect-src 'none'",
    rule: "The vitalsheet page ships a Content-Security-Policy meta with connect-src 'none': the browser refuses every fetch, XHR and WebSocket the page could attempt.",
    source_title: "vitalsheet index.html <head> (the live app's own CSP meta)",
    source_url: APP_URL,
    verified_on: "2026-07-23"
  }
];

/* ---- the demo readings the animation logs ------------------- */

const DEMO_READINGS = [
  { date: "2026-07-23", time: "07:10", sys: 122, dia: 78, tag: "left arm, seated" },
  { date: "2026-07-22", time: "07:05", sys: 118, dia: 82, tag: "left arm, seated" },
  { date: "2026-07-20", time: "21:40", sys: 131, dia: 85, tag: "left arm, seated" },
  { date: "2026-07-16", time: "07:15", sys: 128, dia: 84, tag: "left arm, seated" },
  { date: "2026-07-09", time: "07:00", sys: 142, dia: 91, tag: "right arm, seated" }
];
const DEMO_AS_OF = "2026-07-23";
const DEMO_GLUCOSE_MGDL = 126;

/* ---- the same core formulas the app uses -------------------- */

/** Round half up to an integer (371/3 = 123.67 → 124). */
function roundHalfUpInt(x) { return Math.floor(x + 0.5); }

/** Round half up to 1 decimal place (6.9938 → 7.0). */
function roundHalfUp1(x) { return Math.floor(x * 10 + 0.5) / 10; }

/** Plain arithmetic mean of integers, rounded half up to an integer. */
function avgInt(nums) {
  if (!nums.length) return null;
  return roundHalfUpInt(nums.reduce(function (a, b) { return a + b; }, 0) / nums.length);
}

/** mg/dL → mmol/L using the cited 18.016 factor, 1 dp. */
function mgdlToMmol(mgdl) {
  const f = FACTS.find(function (x) { return x.id === "glu-conversion"; }).factor;
  return roundHalfUp1(mgdl / f);
}

/** ISO date minus (n-1) days → the earliest date INSIDE an n-day window. */
function windowStart(asOfIso, days) {
  const d = new Date(asOfIso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

/** n-day windowed average of {sys,dia} readings (dates >= window start). */
function windowAvg(readings, asOfIso, days) {
  const start = windowStart(asOfIso, days);
  const inWin = readings.filter(function (r) { return r.date >= start && r.date <= asOfIso; });
  return {
    n: inWin.length,
    sys: avgInt(inWin.map(function (r) { return r.sys; })),
    dia: avgInt(inWin.map(function (r) { return r.dia; }))
  };
}

/** 2017 ACC/AHA category — higher category wins; crisis when sys>180 and/or dia>120. */
function bpCategory(sys, dia) {
  if (sys > 180 || dia > 120) return "Hypertensive Crisis";
  if (sys >= 140 || dia >= 90) return "Hypertension Stage 2";
  if (sys >= 130 || dia >= 80) return "Hypertension Stage 1";
  if (sys >= 120) return "Elevated";
  return "Normal";
}

const BP_LABELS = FACTS
  .filter(function (x) { return x.kind === "bp-category"; })
  .map(function (x) { return x.label; });

/* ---- RFC-4180 CSV (as the app exports) ---------------------- */

function csvField(v) {
  const s = String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csvRow(fields) { return fields.map(csvField).join(","); }

if (typeof module !== "undefined") {
  module.exports = {
    CSP_META, APP_URL, FACTS, DEMO_READINGS, DEMO_AS_OF, DEMO_GLUCOSE_MGDL,
    roundHalfUpInt, roundHalfUp1, avgInt, mgdlToMmol,
    windowStart, windowAvg, bpCategory, BP_LABELS, csvField, csvRow
  };
}
