/* Componentes extras das aulas: camadas (chips) e "encontre a parte". */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  $$(".layers").forEach(function (box) {
    var target = document.getElementById(box.dataset.target);
    var note = box.parentElement.querySelector(".diagram-note");
    $$(".chip", box).forEach(function (chip) {
      chip.setAttribute("aria-pressed", "false");
      chip.addEventListener("click", function () {
        if (box.hasAttribute("data-player")) return; // botões ligados a uma animação: motion.js cuida deles
        var on = chip.getAttribute("aria-pressed") === "true";
        $$(".chip", box).forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        if (on) { delete target.dataset.on; if (note) note.textContent = box.dataset.idle || ""; return; }
        chip.setAttribute("aria-pressed", "true");
        target.dataset.on = chip.dataset.k;
        if (note) note.textContent = chip.dataset.text || "";
      });
    });
  });

  $$(".hs.find").forEach(function (box) {
    var dots = $$(".hs-dot", box), panel = box.parentElement.querySelector(".hs-panel"), order = [], cur = null, hits = 0;
    function say(title, text) {
      panel.innerHTML = "<h3></h3><p></p>";
      $("h3", panel).textContent = title; $("p", panel).textContent = text;
      panel.classList.remove("swap"); void panel.offsetWidth; panel.classList.add("swap");
    }
    function next() {
      var left = dots.filter(function (d) { return !d.classList.contains("ok"); });
      if (!left.length) { say("Você achou todas as partes", "Volte ao mapa acima e revise as que foram mais difíceis."); return; }
      cur = left[Math.floor(Math.random() * left.length)];
      say("Onde fica: " + cur.dataset.name + "?", "Toque na foto, no ponto certo.");
    }
    dots.forEach(function (d) {
      d.addEventListener("click", function () {
        if (!cur || d.classList.contains("ok")) return;
        if (d === cur) {
          hits++; d.classList.add("ok"); d.setAttribute("aria-pressed", "true");
          say("Certo: " + d.dataset.name, d.dataset.text + " (" + hits + " de " + dots.length + ")");
          setTimeout(next, 2600);
        } else {
          say("Ainda não", "Esse ponto é " + d.dataset.name.toLowerCase() + ". Procure: " + cur.dataset.name + ".");
        }
      });
    });
    next();
  });
})();

/* Abas (tabs): botões que mostram um painel de cada vez. */
(function () {
  "use strict";
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  $$(".tabs").forEach(function (t) {
    var chips = $$(".tabs-nav .chip", t), panels = $$(".tabpanel", t);
    function sel(k, focus) {
      chips.forEach(function (c) { var on = c.dataset.k === k; c.setAttribute("aria-selected", on); c.setAttribute("aria-pressed", on); c.tabIndex = on ? 0 : -1; if (on && focus) c.focus(); });
      panels.forEach(function (p) { var on = p.dataset.k === k; p.hidden = !on; if (on) { p.classList.remove("swap"); void p.offsetWidth; p.classList.add("swap"); } });
    }
    chips.forEach(function (c, i) {
      c.addEventListener("click", function () { sel(c.dataset.k); });
      c.addEventListener("keydown", function (e) {
        var n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!n) return;
        e.preventDefault(); sel(chips[(i + n + chips.length) % chips.length].dataset.k, true);
      });
    });
    sel(chips[0].dataset.k);
  });
})();
