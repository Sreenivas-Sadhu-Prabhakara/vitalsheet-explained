"use strict";
/* Self-tests: every number the explainer animates is re-derived here. */
const test = require("node:test");
const assert = require("node:assert/strict");
const F = require("../data/facts.js");

test("bpCategory matches the cited 2017 ACC/AHA fixtures (higher category wins)", function () {
  assert.equal(F.bpCategory(118, 79), "Normal");
  assert.equal(F.bpCategory(124, 79), "Elevated");
  assert.equal(F.bpCategory(124, 85), "Hypertension Stage 1");
  assert.equal(F.bpCategory(140, 89), "Hypertension Stage 2");
  assert.equal(F.bpCategory(184, 100), "Hypertensive Crisis");
  assert.equal(F.bpCategory(150, 121), "Hypertensive Crisis"); // and/or: dia alone
  assert.equal(F.bpCategory(180, 120), "Hypertension Stage 2"); // crisis is strictly >
});

test("every classifier output is in the closed label set (never-interpret guard)", function () {
  for (let sys = 70; sys <= 260; sys += 3) {
    for (let dia = 40; dia <= 160; dia += 3) {
      assert.ok(F.BP_LABELS.includes(F.bpCategory(sys, dia)),
        "unexpected label for " + sys + "/" + dia);
    }
  }
  assert.equal(F.BP_LABELS.length, 5);
});

test("avgInt: arithmetic mean, round half up to integer", function () {
  assert.equal(F.avgInt([122, 118, 131]), 124); // 371/3 = 123.67 -> 124
  assert.equal(F.avgInt([78, 82, 85]), 82);     // 245/3 = 81.67 -> 82
  assert.equal(F.avgInt([96, 142, 118]), 119);  // 356/3 = 118.67 -> 119
  assert.equal(F.avgInt([1, 2]), 2);            // 1.5 rounds half UP
  assert.equal(F.avgInt([]), null);
});

test("the animated 7-day average is computed from the demo rows, not typed in", function () {
  const w7 = F.windowAvg(F.DEMO_READINGS, F.DEMO_AS_OF, 7);
  // window start 2026-07-17: rows 07-23, 07-22, 07-20 in; 07-16 and 07-09 out
  assert.equal(w7.n, 3);
  assert.equal(w7.sys, 124);
  assert.equal(w7.dia, 82);
  const w30 = F.windowAvg(F.DEMO_READINGS, F.DEMO_AS_OF, 30);
  assert.equal(w30.n, 5);
  assert.equal(w30.sys, F.avgInt([122, 118, 131, 128, 142]));
  assert.equal(w30.dia, F.avgInt([78, 82, 85, 84, 91]));
});

test("brief fixture: 7-day window excludes readings older than asOf-6d", function () {
  const rows = [
    { date: "2026-07-22", sys: 120, dia: 80 },
    { date: "2026-07-20", sys: 130, dia: 80 },
    { date: "2026-07-15", sys: 160, dia: 80 }
  ];
  const w = F.windowAvg(rows, "2026-07-22", 7);
  assert.equal(w.sys, 125); // (120+130)/2; the 160 on 07-15 is excluded
});

test("windowStart handles month boundaries and leap years", function () {
  assert.equal(F.windowStart("2026-08-03", 7), "2026-07-28");
  assert.equal(F.windowStart("2026-03-04", 7), "2026-02-26");
  assert.equal(F.windowStart("2024-03-01", 7), "2024-02-24"); // leap year
  assert.equal(F.windowStart("2026-01-02", 30), "2025-12-04"); // across new year
});

test("mgdlToMmol uses the cited 18.016 factor, round half up to 1 dp", function () {
  assert.equal(F.mgdlToMmol(200), 11.1); // 11.1013 -> 11.1
  assert.equal(F.mgdlToMmol(126), 7.0);  // 6.9938  -> 7.0
  assert.equal(F.mgdlToMmol(F.DEMO_GLUCOSE_MGDL), 7.0);
  const fact = F.FACTS.find(function (x) { return x.id === "glu-conversion"; });
  assert.equal(fact.factor, 18.016);
});

test("BP category bounds cover the plane with no gaps (corpus invariant)", function () {
  const cats = F.FACTS.filter(function (x) { return x.kind === "bp-category"; });
  assert.equal(cats.length, 5);
  // adjacent systolic cut-points chain: <120, 120-129, 130-139, >=140
  assert.equal(cats[0].sys_hi, cats[1].sys_lo);
  assert.equal(cats[1].sys_hi, cats[2].sys_lo);
  assert.equal(cats[2].sys_hi, cats[3].sys_lo);
  const ids = new Set(F.FACTS.map(function (x) { return x.id; }));
  assert.equal(ids.size, F.FACTS.length, "fact ids must be unique");
});

test("every fact carries provenance: source_title, source_url, verified_on", function () {
  for (const f of F.FACTS) {
    assert.ok(f.source_title && f.source_title.length > 8, f.id);
    assert.match(f.source_url, /^https:\/\//, f.id);
    assert.match(f.verified_on, /^\d{4}-\d{2}-\d{2}$/, f.id);
  }
});

test("no interpretive language in any label or rule (log book, not a diagnosis)", function () {
  for (const f of F.FACTS) {
    const text = (f.label + " " + f.rule).toLowerCase();
    assert.doesNotMatch(text, /improv|worsen|risk score|danger|normal for you|you should see/i, f.id);
  }
});

test("csvRow is RFC-4180: quote fields containing commas, double embedded quotes", function () {
  assert.equal(
    F.csvRow(["2026-07-22 07:10", "bp", "120", "80", "left arm, seated"]),
    '2026-07-22 07:10,bp,120,80,"left arm, seated"'
  );
  assert.equal(F.csvField('he said "hi"'), '"he said ""hi"""');
  const r = F.DEMO_READINGS[0];
  assert.equal(
    F.csvRow([r.date + " " + r.time, "bp", r.sys, r.dia, r.tag]),
    '2026-07-23 07:10,bp,122,78,"left arm, seated"'
  );
});

test("the CSP the page states is the CSP the app ships (enforced, not promised)", function () {
  assert.ok(F.CSP_META.includes("connect-src 'none'"));
  assert.ok(F.CSP_META.includes("default-src 'self'"));
  const fs = require("node:fs");
  const path = require("node:path");
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.ok(html.includes(F.CSP_META), "index.html must ship the exact CSP it explains");
  // and the live-app CSP fact matches the app's actual index.html when present locally
  const appHtml = path.join(__dirname, "..", "..", "vitalsheet", "index.html");
  if (fs.existsSync(appHtml)) {
    assert.ok(fs.readFileSync(appHtml, "utf8").includes("connect-src 'none'"));
  }
});

test("property: windowed average always lies between min and max of its window", function () {
  let seed = 42;
  const rnd = function () { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  for (let iter = 0; iter < 2000; iter++) {
    const n = 1 + Math.floor(rnd() * 8);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const day = 1 + Math.floor(rnd() * 28);
      rows.push({
        date: "2026-07-" + String(day).padStart(2, "0"),
        sys: 90 + Math.floor(rnd() * 100),
        dia: 50 + Math.floor(rnd() * 70)
      });
    }
    const w = F.windowAvg(rows, "2026-07-28", 30);
    const sysAll = rows.map(function (r) { return r.sys; });
    assert.ok(w.sys >= Math.min.apply(null, sysAll) && w.sys <= Math.max.apply(null, sysAll));
  }
});
