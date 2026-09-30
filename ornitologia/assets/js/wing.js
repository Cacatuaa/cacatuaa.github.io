/* Desenha o esquema de uma asa aberta (vista de cima) com fileiras de penas. */
(function () {
  "use strict";
  var host = document.getElementById("wing");
  if (!host) return;
  var out = [];
  function lerp(a, b, t) { return a + (b - a) * t; }
  function feather(cls, ox, oy, deg, len, wid) {
    var a = deg * Math.PI / 180, cx = ox + Math.cos(a) * len / 2, cy = oy + Math.sin(a) * len / 2;
    out.push('<ellipse class="f ' + cls + '" cx="0" cy="0" rx="' + (len / 2).toFixed(1) + '" ry="' + wid + '" transform="translate(' + cx.toFixed(1) + " " + cy.toFixed(1) + ") rotate(" + deg + ')"/>');
  }
  var S = [50, 165], E = [205, 105], W = [345, 125], T = [500, 150];
  function arm(t) { // ponto ao longo do braço (ombro -> cotovelo -> pulso)
    return t < 0.5 ? [lerp(S[0], E[0], t * 2), lerp(S[1], E[1], t * 2)] : [lerp(E[0], W[0], (t - 0.5) * 2), lerp(E[1], W[1], (t - 0.5) * 2)];
  }
  var i, p, n;
  n = 12; // secundárias
  for (i = 0; i < n; i++) { p = arm(0.12 + 0.88 * i / (n - 1)); feather("sec", p[0], p[1], 92 - i * 0.6, 100 + i * 4, 13); }
  n = 10; // primárias
  for (i = 0; i < n; i++) {
    var t = i / (n - 1); p = [lerp(W[0], T[0], t), lerp(W[1], T[1], t)];
    feather("prim", p[0], p[1], lerp(100, 22, Math.pow(t, 0.8)), 150 + Math.sin(t * Math.PI) * 60 - t * 20, 11);
  }
  n = 12; // coberteiras (fileira grande e fileira média)
  for (i = 0; i < n; i++) { p = arm(0.12 + 0.88 * i / (n - 1)); feather("cov", p[0], p[1] - 4, 92 - i * 0.6, 62, 11); }
  for (i = 0; i < n; i++) { p = arm(0.1 + 0.9 * i / (n - 1)); feather("cov", p[0], p[1] - 6, 90 - i * 0.5, 34, 9); }
  for (i = 0; i < 8; i++) { t = i / 7; p = [lerp(W[0], T[0] - 40, t), lerp(W[1], T[1] - 22, t)]; feather("cov", p[0], p[1] - 4, lerp(100, 24, Math.pow(t, 0.8)), 58, 9); }
  for (i = 0; i < 3; i++) feather("alula", W[0] - 8, W[1] - 8 - i * 3, -38 - i * 12, 44 - i * 4, 7);
  out.push('<polyline class="arm" points="' + [S, E, W, T].map(function (q) { return q.join(","); }).join(" ") + '"/>');
  out.push('<text class="lab" x="24" y="148">ombro</text><text class="lab" x="176" y="86">cotovelo</text><text class="lab" x="276" y="106">pulso</text>');
  host.innerHTML = '<svg viewBox="20 62 620 280" role="img" aria-label="Esquema de uma asa aberta vista de cima, com fileiras de penas">' + out.join("") + "</svg>";
})();
