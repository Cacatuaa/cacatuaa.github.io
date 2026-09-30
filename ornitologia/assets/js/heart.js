/* Circulação: partículas de sangue percorrem o circuito corpo → coração → pulmões → coração → corpo, todas ao mesmo tempo.
   Modelo didático: azul = pouco oxigênio, laranja = rico em oxigênio. */
(function () {
  "use strict";
  var svg = document.getElementById("heartd"); if (!svg) return;
  var NS = "http://www.w3.org/2000/svg", reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var paths = Array.prototype.slice.call(svg.querySelectorAll("path.arrow"));
  var lens = paths.map(function (p) { return p.getTotalLength(); }), total = lens.reduce(function (a, b) { return a + b; }, 0);
  var groups = paths.map(function (p) { var m = /\ba(\d)\b/.exec(p.getAttribute("class")); return m ? "p" + m[1] : ""; });
  var N = 9, pts = [];
  for (var i = 0; i < N; i++) { var c = document.createElementNS(NS, "circle"); c.setAttribute("r", 6); c.setAttribute("class", "blood-pt"); svg.appendChild(c); pts.push(c); }
  var pos = 0, speed = 90, running = false, visible = true, last = 0, raf = 0;

  function at(d) { // ponto a d unidades do início do circuito
    d = ((d % total) + total) % total;
    for (var k = 0; k < paths.length; k++) { if (d <= lens[k]) return { k: k, pt: paths[k].getPointAtLength(d), edge: Math.min(d, lens[k] - d) }; d -= lens[k]; }
    return { k: 0, pt: paths[0].getPointAtLength(0), edge: 0 };
  }
  function draw() {
    var on = (svg.dataset.on || "").split(/\s+/).filter(Boolean);
    pts.forEach(function (c, i) {
      var r = at(pos + i * total / N), path = paths[r.k];
      c.setAttribute("cx", r.pt.x); c.setAttribute("cy", r.pt.y);
      c.style.fill = path.classList.contains("rich") ? "var(--terra-fill)" : "var(--info)";
      var dim = on.length && on.indexOf(groups[r.k]) < 0;
      c.style.opacity = Math.min(1, r.edge / 12) * (dim ? 0.15 : 1);
    });
  }
  function frame(now) {
    raf = 0; if (!running || !visible) return;
    pos += (Math.min(64, now - last) / 1000) * speed; last = now; draw(); raf = requestAnimationFrame(frame);
  }
  var play = document.getElementById("heart-play");
  function sync() { if (!play) return; if (window.ORN_UI) ORN_UI.playLabel(play, running, "o sangue"); else play.textContent = running ? "Pausar o sangue" : "Reproduzir o sangue"; }
  function start() { if (running) return; running = true; last = performance.now(); if (!raf) raf = requestAnimationFrame(frame); sync(); }
  function stop() { running = false; sync(); }
  if (play) play.addEventListener("click", function () { running ? stop() : start(); });
  draw();
  if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible && running && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }).observe(svg);
  // escolher uma etapa também atualiza as bolinhas na hora (mesmo pausado)
  new MutationObserver(function () { if (!running) draw(); }).observe(svg, { attributes: true, attributeFilter: ["data-on"] });
  if (!reduced) start(); else sync();
})();
