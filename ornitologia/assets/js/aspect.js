/* Razão de aspecto: desenha uma asa esquemática (vista de cima) e mostra o que se ganha e o que se perde. Modelo didático. */
(function () {
  "use strict";
  var host = document.getElementById("ar-svg"); if (!host) return;
  var range = document.getElementById("ar-range"), out = document.getElementById("ar-out"), txt = document.getElementById("ar-text");
  var eco = document.getElementById("ar-eco"), man = document.getElementById("ar-man");
  var C = 56;
  function draw(ar) {
    var s = Math.min(560, ar * C / 2 * 1.0), x0 = 24, y = 110, c = C * 0.55;
    var tip = x0 + s;
    var d = "M " + x0 + " " + (y - C / 2) + " L " + (tip - c) + " " + (y - C / 2 + 4) + " Q " + (tip + 6) + " " + y + " " + (tip - c) + " " + (y + C / 2 - 4) + " L " + x0 + " " + (y + C / 2) + " Z";
    host.innerHTML = '<svg viewBox="0 0 620 220" role="img" aria-label="Asa esquemática vista de cima, com comprimento que muda com a razão de aspecto">' +
      '<rect x="0" y="0" width="' + x0 + '" height="220" fill="var(--surface-2)"/><text x="4" y="118" class="sub" style="font-size:11px">corpo</text>' +
      '<path d="' + d + '" class="wing-shape"/>' +
      '<line x1="' + (x0 + 4) + '" y1="' + (y + C / 2 + 24) + '" x2="' + (tip) + '" y2="' + (y + C / 2 + 24) + '" class="dim"/><text x="' + ((x0 + tip) / 2) + '" y="' + (y + C / 2 + 44) + '" text-anchor="middle" class="sub">comprimento da asa</text>' +
      '<line x1="' + (x0 + s * 0.5) + '" y1="' + (y - C / 2) + '" x2="' + (x0 + s * 0.5) + '" y2="' + (y + C / 2) + '" class="dim"/><text x="' + (x0 + s * 0.5 + 8) + '" y="' + (y + 4) + '" class="sub">largura</text></svg>';
  }
  function update() {
    var ar = +range.value; out.textContent = ar; draw(ar);
    var e = (ar - 2) / 10, m = 1 - (ar - 2) / 10 * 0.9;
    eco.style.transform = "scaleX(" + Math.max(0.05, e).toFixed(2) + ")"; man.style.transform = "scaleX(" + Math.max(0.08, m).toFixed(2) + ")";
    txt.textContent = ar <= 4 ? "Asa curta e larga: manobra bem entre galhos e decola com facilidade, mas cansa mais para cruzar longas distâncias."
      : ar <= 8 ? "Asa intermediária: um meio-termo entre manobrar e economizar energia."
      : "Asa longa e estreita: gasta pouca energia para se manter no ar, mas manobra e decola com mais dificuldade.";
  }
  range.addEventListener("input", update); update();
})();
