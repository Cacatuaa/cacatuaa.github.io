/* Cauda como leme e freio: o controle abre e fecha a cauda de uma ave esquemática vista de cima. Modelo didático. */
(function () {
  "use strict";
  var host = document.getElementById("tail-svg"); if (!host) return;
  var range = document.getElementById("tail-range"), out = document.getElementById("tail-out"), txt = document.getElementById("tail-text");
  var drag = document.getElementById("tail-drag"), speed = document.getElementById("tail-speed");
  var cx = 200, base = 214, L = 92;
  function pt(a, r) { return [cx + r * Math.sin(a * Math.PI / 180), base + r * Math.cos(a * Math.PI / 180)]; }
  function draw(deg) {
    var h = deg / 2, pl = pt(-h, L), pr = pt(h, L), mid = pt(0, L + 6);
    var tail = "M " + cx + " " + base + " L " + pl[0].toFixed(1) + " " + pl[1].toFixed(1) + " Q " + mid[0].toFixed(1) + " " + (mid[1] + 8).toFixed(1) + " " + pr[0].toFixed(1) + " " + pr[1].toFixed(1) + " Z";
    host.innerHTML = '<svg viewBox="0 0 400 330" role="img" aria-label="Ave esquemática vista de cima, com a cauda mais fechada ou mais aberta">' +
      '<path d="M 200 130 C 120 110, 60 116, 16 150 C 60 156, 130 158, 190 166 Z" class="bird"/>' +
      '<path d="M 200 130 C 280 110, 340 116, 384 150 C 340 156, 270 158, 210 166 Z" class="bird"/>' +
      '<ellipse cx="200" cy="170" rx="24" ry="52" class="bird"/><circle cx="200" cy="112" r="16" class="bird"/><path d="M 200 92 l -5 -12 h 10 Z" class="bird" style="fill:var(--terra-fill);stroke:none"/>' +
      '<path d="' + tail + '" class="tail"/></svg>';
  }
  function update() {
    var d = +range.value; out.textContent = d + "°"; draw(d);
    drag.style.transform = "scaleX(" + Math.max(0.06, d / 120).toFixed(2) + ")"; speed.style.transform = "scaleX(" + Math.max(0.1, 1 - d / 150).toFixed(2) + ")";
    txt.textContent = d < 25 ? "Cauda fechada: a ave corta o ar com pouco arrasto, ideal para ir depressa em linha reta."
      : d < 80 ? "Cauda meio aberta: um equilíbrio. Os movimentos da cauda ajudam a guiar a subida, a descida e as curvas."
      : "Cauda bem aberta: mais superfície contra o ar. Serve de freio e ajuda a controlar a ave em voos lentos, como na hora de pousar.";
  }
  range.addEventListener("input", update); update();
})();
