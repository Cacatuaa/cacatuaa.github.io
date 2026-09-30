/* Ciclo respiratório comparado (aula 6): partículas de ar percorrem as setas de cada esquema, uma fase (inspirar/expirar) por vez.
   Na ave, as duas setas de cada fase acontecem ao mesmo tempo. Cada fase: as partículas andam, chegam e somem aos poucos,
   para dar tempo de ver onde o ar parou. Modelo didático. */
(function () {
  "use strict";
  var cards = Array.prototype.slice.call(document.querySelectorAll(".flow-card"));
  if (!cards.length) return;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg", UI = window.ORN_UI;
  var MOVE = 2200, HOLD = 900, DUR = MOVE + HOLD, LAG = 110; // ms andando, ms parado, atraso entre partículas
  function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  // na ave, as setas 2 e 3 são curtas (só a folga entre as caixas): as partículas usam um trajeto que atravessa as caixas
  var ROUTES = { 1: { 1: "M 66 146 L 182 146", 2: "M 188 146 L 299 146" } };

  var machines = cards.map(function (card, idx) {
    var svg = card.querySelector("svg.flow"), arrows = Array.prototype.slice.call(svg.querySelectorAll(".fl-in, .fl-out"));
    var steps = Array.prototype.slice.call(card.querySelectorAll(".flow-steps li"));
    var phases = idx === 0 ? [[0], [1]] : [[0, 2], [1, 3]]; // caminhos que se movem juntos em cada fase
    var routes = arrows.map(function (p, i) {
      var d = ROUTES[idx] && ROUTES[idx][i]; if (!d) return p;
      var h = document.createElementNS(NS, "path"); h.setAttribute("d", d); h.setAttribute("fill", "none"); h.setAttribute("stroke", "none"); svg.appendChild(h); return h;
    });
    var lens = routes.map(function (p) { return p.getTotalLength(); });
    var pts = arrows.map(function (p) {
      var arr = [], inn = p.classList.contains("fl-in");
      for (var k = 0; k < 4; k++) { var c = document.createElementNS(NS, "circle"); c.setAttribute("r", 9 - k * 2); c.setAttribute("class", "air-pt" + (inn ? "" : " out")); c.style.opacity = 0; svg.appendChild(c); arr.push(c); }
      return arr;
    });
    var lung = idx === 0 ? svg.querySelector("ellipse") : null;
    if (lung) { lung.style.transformBox = "fill-box"; lung.style.transformOrigin = "50% 50%"; }
    return { arrows: arrows, routes: routes, steps: steps, phases: phases, lens: lens, pts: pts, lung: lung, ph: 0, t: 0 };
  });

  function place(m) {
    var active = m.phases[m.ph], fade = 1 - clamp((m.t - MOVE) / HOLD);
    m.arrows.forEach(function (p, i) {
      var on = active.indexOf(i) > -1;
      p.style.opacity = on ? 1 : 0.25;
      m.pts[i].forEach(function (c, k) {
        if (!on) { c.style.opacity = 0; return; }
        var u = ease(clamp((m.t - k * LAG) / (MOVE - 3 * LAG))), pt = m.routes[i].getPointAtLength(u * m.lens[i]);
        c.setAttribute("cx", pt.x.toFixed(1)); c.setAttribute("cy", pt.y.toFixed(1));
        c.style.opacity = ((1 - k * 0.22) * fade * clamp((m.t - k * LAG) / 150)).toFixed(3);
      });
    });
    m.steps.forEach(function (li, i) { li.classList.toggle("on", i === m.ph); });
    if (m.lung) { // o pulmão do mamífero enche ao inspirar e esvazia ao expirar
      var u = ease(clamp(m.t / MOVE)), s = m.ph === 0 ? 1 + 0.08 * u : 1.08 - 0.08 * u;
      m.lung.style.transform = "scale(" + s.toFixed(3) + ")";
    }
  }

  var mode = "stop", visible = true, last = 0, raf = 0; // mode: play (contínuo), once (uma fase e para), stop
  function frame(now) {
    raf = 0; if (mode === "stop" || !visible) return;
    var dt = Math.min(64, now - last), ended = false; last = now;
    machines.forEach(function (m) {
      m.t += dt;
      if (mode === "once" && m.t >= MOVE) { m.t = MOVE; ended = true; } // para com as partículas no destino
      else if (m.t >= DUR) { m.t -= DUR; m.ph = (m.ph + 1) % m.phases.length; }
      place(m);
    });
    if (ended) { setMode("stop"); return; }
    raf = requestAnimationFrame(frame);
  }
  var play = document.getElementById("flow-play"), stepBtn = document.getElementById("flow-step");
  function setMode(m) {
    mode = m;
    if (play) UI ? UI.playLabel(play, m === "play", "a comparação") : (play.textContent = m === "play" ? "Pausar" : "Reproduzir");
    if (mode !== "stop" && visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  if (play) play.addEventListener("click", function () { setMode(mode === "play" ? "stop" : "play"); });
  if (stepBtn) {
    if (UI) { stepBtn.classList.add("has-icon"); stepBtn.innerHTML = "<span>Próxima fase</span>" + UI.icon("next"); }
    stepBtn.addEventListener("click", function () {
      machines.forEach(function (m) { if (m.t > 0) m.ph = (m.ph + 1) % m.phases.length; m.t = 0; place(m); });
      setMode("once");
    });
  }
  machines.forEach(function (m) { m.ph = 0; m.t = reduced ? MOVE * 0.55 : 0; place(m); });
  if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; setMode(mode); }).observe(cards[0].parentElement);
  setMode(reduced ? "stop" : "play");
})();
