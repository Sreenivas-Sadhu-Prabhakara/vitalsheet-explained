/* vitalsheet-explained — wiring only. Every number in the demos is
   COMPUTED here with the same formulas the app uses (data/facts.js);
   no demo value is hard-coded in markup. No network, no storage. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- populate the trend demo from the shared facts module ---- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function renderTrend() {
    var tbody = document.getElementById("trend-rows");
    if (!tbody || typeof DEMO_READINGS === "undefined") return;
    var start7 = windowStart(DEMO_AS_OF, 7);
    tbody.textContent = "";
    DEMO_READINGS.forEach(function (r) {
      var tr = el("tr");
      var inWin = r.date >= start7 && r.date <= DEMO_AS_OF;
      if (inWin) tr.className = "is-win";
      tr.appendChild(el("td", "num", r.date + " " + r.time));
      tr.appendChild(el("td", "num", r.sys + " / " + r.dia));
      tr.appendChild(el("td", "band-cell", bpCategory(r.sys, r.dia)));
      tr.appendChild(el("td", "win-cell", inWin ? "in 7-day window" : "—"));
      tbody.appendChild(tr);
    });

    var w7 = windowAvg(DEMO_READINGS, DEMO_AS_OF, 7);
    var w30 = windowAvg(DEMO_READINGS, DEMO_AS_OF, 30);
    setText("avg7", w7.sys + " / " + w7.dia);
    setText("avg7-n", "(" + w7.n + " readings)");
    setText("avg30", w30.sys + " / " + w30.dia);
    setText("avg30-n", "(" + w30.n + " readings)");
    setText("win-start", start7);
    setText("mmol", mgdlToMmol(DEMO_GLUCOSE_MGDL).toFixed(1));

    var r0 = DEMO_READINGS[0];
    setText("csv-line", csvRow([r0.date + " " + r0.time, "bp", r0.sys, r0.dia, r0.tag]));
  }

  function setText(id, text) {
    var n = document.getElementById(id);
    if (n) n.textContent = text;
  }

  /* ---- scroll-triggered reveals (CSS does the animating) ---- */
  function armObserver() {
    var sections = document.querySelectorAll("[data-animate]");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      sections.forEach(function (s) { s.classList.add("play"); });
      startTrend();
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("play");
          if (entry.target.querySelector(".trend-demo")) startTrend();
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    sections.forEach(function (s) { io.observe(s); });
  }

  function startTrend() {
    var demo = document.querySelector(".trend-demo");
    if (demo) demo.classList.add("playing");
  }

  /* ---- replay button (keyboard-operable review of the animation) ---- */
  function wireReplay() {
    var btn = document.getElementById("replay-trend");
    var demo = document.querySelector(".trend-demo");
    if (!btn || !demo) return;
    btn.addEventListener("click", function () {
      demo.classList.remove("playing");
      // force a reflow so the CSS animations restart
      void demo.offsetWidth;
      demo.classList.add("playing");
    });
  }

  renderTrend();
  armObserver();
  wireReplay();
})();
