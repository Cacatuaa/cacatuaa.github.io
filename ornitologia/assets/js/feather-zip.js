/* Demonstração: o "zíper" das barbas da pena. Puxe para separar; "Alisar" faz a ave arrumar de novo. */
(function () {
  "use strict";
  var host = document.getElementById("zip-svg");
  if (!host) return;
  var slider = document.getElementById("zip-range"), btn = document.getElementById("zip-fix"), note = document.getElementById("zip-note");
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var N = 14, K = 7, W = 560, H = 260, RX = 120;
  function draw(g) {
    var out = [];
    out.push('<line x1="' + RX + '" y1="20" x2="' + RX + '" y2="' + (H - 20) + '" class="z-rachis"/>');
    for (var i = 0; i < N; i++) {
      var y0 = 30 + i * ((H - 60) / (N - 1));
      var shift = i >= K ? g * 34 : 0; // a metade de baixo se afasta
      var x1 = RX, y1 = y0, x2 = RX + 300, y2 = y0 + 34 + shift * 0.9;
      out.push('<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="z-barb"/>');
    }
    // ganchos entre a barba K-1 e a K: aparecem enquanto estão encaixados
    var a = 30 + (K - 1) * ((H - 60) / (N - 1)), b = 30 + K * ((H - 60) / (N - 1));
    for (var t = 0.06; t < 1; t += 0.055) {
      var xa = RX + 300 * t, ya = a + 34 * t, yb = b + (34 + g * 34 * 0.9) * t;
      var gap = yb - ya;
      if (gap < 30) out.push('<line x1="' + xa + '" y1="' + ya + '" x2="' + xa + '" y2="' + yb + '" class="z-hook' + (g < 0.08 ? " on" : "") + '"/>');
    }
    if (g > 0.08) { var mid = (a + b) / 2 + 17 + g * 15; out.push('<text x="' + (RX + 165) + '" y="' + (mid + 4) + '" class="z-gap">fenda</text>'); }
    host.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Barbas de uma pena com uma fenda que pode ser aberta e fechada">' + out.join("") + "</svg>";
  }
  function set(v) {
    slider.value = v; var g = v / 100; draw(g);
    note.textContent = g > 0.08 ? "As barbas se soltaram: entra ar pela fenda e a pena perde a forma de lâmina. A ave precisa arrumá-la." : "As bárbulas estão encaixadas pelos ganchos e a pena forma uma lâmina contínua.";
  }
  slider.addEventListener("input", function () { set(+slider.value); });
  // "Alisar": as barbas voltam a se encaixar em ~0,7 s, devagar no fim (como o bico passando pela pena)
  var anim = 0;
  btn.addEventListener("click", function () {
    var v0 = +slider.value, t0 = performance.now(), D = 250 + v0 * 5;
    cancelAnimationFrame(anim);
    if (reduced || v0 === 0) { set(0); return; }
    (function step(now) {
      var u = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - u, 3);
      set(Math.round(v0 * (1 - e) * 10) / 10);
      if (u < 1) anim = requestAnimationFrame(step);
    })(t0);
  });
  slider.addEventListener("pointerdown", function () { cancelAnimationFrame(anim); });
  set(0);
})();
