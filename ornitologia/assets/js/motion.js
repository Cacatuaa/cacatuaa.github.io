/* Animações didáticas de caminho:
   - aula 6: uma porção de ar atravessando o sistema respiratório, etapa por etapa;
   - aula 8: o alimento no sistema digestório;
   - aula 13: as trajetórias de voo;
   - aula 15: a migração do maçarico.
   As aulas 6, 8 e 15 usam o mesmo reprodutor por etapas: o ponto anda até a parte seguinte e para ali o tempo
   de ler a explicação. Os botões de parte do desenho e os controles (Anterior · Reproduzir/Pausar · Próxima)
   comandam a mesma animação, então o destaque, o texto e o ponto nunca ficam em desacordo. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg", reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; } // sai devagar, chega devagar
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function inView(el, cb) { if (!("IntersectionObserver" in window)) { cb(true); return; } new IntersectionObserver(function (e) { cb(e[0].isIntersecting); }).observe(el); }

  /* ---------- botões com ícone (traço 1,75, mesmo estilo do resto do site) ---------- */
  var ICON = { prev: '<path d="m15 18-6-6 6-6"/>', next: '<path d="m9 18 6-6-6-6"/>', play: '<path d="M7 4.5v15l12-7.5Z"/>', pause: '<path d="M8 5v14M16 5v14"/>', again: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>' };
  function icon(n) { return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + ICON[n] + "</svg>"; }
  function button(html, label) { var b = document.createElement("button"); b.type = "button"; b.className = "chip has-icon"; b.innerHTML = html; if (label) b.setAttribute("aria-label", label); return b; }
  // botão de reproduzir/pausar: texto curto visível, nome completo para leitores de tela
  function playLabel(btn, playing, noun, idleWord) {
    btn.removeAttribute("aria-pressed"); btn.classList.add("has-icon");
    var word = playing ? "Pausar" : (idleWord || "Reproduzir");
    btn.innerHTML = icon(playing ? "pause" : idleWord === "Ver de novo" ? "again" : "play") + "<span>" + word + "</span>";
    btn.setAttribute("aria-label", word + " " + noun);
  }
  window.ORN_UI = { icon: icon, playLabel: playLabel }; // usado por flow.js, heart.js e wind.js

  function hiddenPath(d, host) { var p = document.createElementNS(NS, "path"); p.setAttribute("d", d); p.setAttribute("fill", "none"); p.setAttribute("stroke", "none"); host.appendChild(p); return p; }
  // fração do caminho mais próxima de (x, y), procurando a partir de `from` (para caminhos que passam duas vezes no mesmo lugar)
  function nearest(path, L, x, y, from) {
    var best = from || 0, bd = 1e18, N = 800;
    for (var i = Math.round((from || 0) * N); i <= N; i++) { var p = path.getPointAtLength(L * i / N), dx = p.x - x, dy = p.y - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i / N; } }
    return best;
  }

  /* ---------- reprodutor por etapas ----------
     o.stages: [{ a, b (frações do caminho), move (ms andando), hold (ms parado para leitura), name, label(andando?), fadeIn }]
     o.draw(ponto, etapa, t, stage, opacidade) desenha; o.onStage(etapa) sincroniza botões e texto. */
  function Stepper(o) {
    var S = o.stages, n = S.length, L = o.path.getTotalLength();
    var k = 0, t = 0, from = S[0].a, fadeIn = true, mode = "stop", visible = true, raf = 0, last = 0, lastText = "";
    var pips = document.createElement("div"); pips.className = "motion-pips"; pips.setAttribute("aria-hidden", "true");
    pips.innerHTML = S.map(function () { return "<i><b></b></i>"; }).join("");
    var bars = $$("b", pips);
    var wrap = document.createElement("div"); wrap.className = "motion-ctrl";
    var prev = button(icon("prev") + "<span>Anterior</span>", "Etapa anterior");
    var play = button("", "");
    var next = button("<span>Próxima</span>" + icon("next"), "Próxima etapa");
    var state = document.createElement("p"); state.className = "motion-state";
    wrap.appendChild(prev); wrap.appendChild(play); wrap.appendChild(next); wrap.appendChild(state);
    o.after.insertAdjacentElement("afterend", pips); pips.insertAdjacentElement("afterend", wrap);

    function mv(s) { return reduced ? 0 : s.move; } // movimento reduzido: o ponto não desliza, reaparece no lugar
    function len(s) { return mv(s) + s.hold; }
    function frac() { var s = S[k], m = mv(s), u = m ? ease(clamp(t / m)) : 1; return from + (s.b - from) * u; }
    function render() {
      var s = S[k], pt = o.path.getPointAtLength(clamp(frac()) * L);
      o.draw(pt, k, t, s, fadeIn ? clamp(t / 350) : 1);
      var txt = "Etapa " + (k + 1) + " de " + n + " · " + (s.label ? s.label(t < mv(s)) : s.name);
      if (txt !== lastText) { state.textContent = txt; lastText = txt; }
      bars.forEach(function (b, j) { b.style.transform = "scaleX(" + (j < k ? 1 : j > k ? 0 : clamp(t / len(s)).toFixed(3)) + ")"; });
    }
    function enter(j, manual, replay) {
      var cur = frac(), s = S[j];
      if (replay || (manual && j === k && Math.abs(cur - s.b) < 1e-3)) cur = -1; // voltar, ou a mesma etapa já parada: repete o trecho desde o começo
      var back = cur < 0 || (!o.reversible && cur > s.b + 1e-3);    // o alimento não anda para trás: reaparece no começo do trecho
      k = j; t = 0;
      from = manual && !back ? cur : s.a;
      fadeIn = reduced || (manual ? back : !!s.fadeIn);
      o.onStage(j);
      render();
    }
    function kick() { if (!raf && visible && mode !== "stop") { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function setMode(m) {
      mode = m; playLabel(play, m === "play", o.noun);
      if (o.note) o.note.setAttribute("aria-live", m === "play" ? "off" : "polite"); // sem anúncio a cada etapa enquanto toca sozinho
      kick();
    }
    function frame(now) {
      raf = 0; if (mode === "stop" || !visible) return;
      t += Math.min(64, now - last); last = now;
      var s = S[k];
      if (mode === "once" && t >= mv(s) + Math.min(s.hold, 900)) { t = mv(s) + Math.min(s.hold, 900); render(); setMode("stop"); return; } // um passo: anda e para
      if (t >= len(s)) enter(k + 1 < n ? k + 1 : (o.loopTo || 0), false); else render();
      raf = requestAnimationFrame(frame);
    }
    function go(j, replay) { enter(j, true, replay); setMode("once"); }
    play.addEventListener("click", function () { setMode(mode === "play" ? "stop" : "play"); });
    prev.addEventListener("click", function () { go((k - 1 + n) % n, true); });
    next.addEventListener("click", function () { go((k + 1) % n); });
    inView(o.host, function (v) { visible = v; kick(); });
    enter(0, false);
    setMode(o.autoplay && !reduced ? "play" : "stop");
    return { go: go, stage: function () { return k; } };
  }

  // botões de parte do desenho (.layers) passam a comandar o reprodutor
  function bindChips(box, player, stageFor) {
    if (!box) return;
    box.setAttribute("data-player", ""); // extras.js deixa estes botões para cá
    $$(".chip", box).forEach(function (c, i) { c.addEventListener("click", function () { player.go(stageFor(i, c)); }); });
  }
  function showChip(box, target, note, chip) {
    if (!box) return;
    $$(".chip", box).forEach(function (x) { x.setAttribute("aria-pressed", x === chip ? "true" : "false"); });
    if (chip) { target.dataset.on = chip.dataset.k; if (note) note.textContent = chip.dataset.text || ""; }
  }

  /* ---------- aula 6: uma porção de ar, em duas respirações ---------- */
  var air = document.getElementById("air2");
  if (air) (function () {
    var box = document.querySelector('.layers[data-target="air2"]'), note = air.parentElement.querySelector(".diagram-note");
    // entra pela traqueia → sacos de trás → volta ao pulmão → sacos da frente → sai pela traqueia
    var path = hiddenPath("M 16 98 L 60 102 C 110 112, 180 132, 252 140 L 292 142 C 320 152, 360 160, 386 158 L 424 168 Q 432 164 438 160 L 424 168 L 386 158 C 366 146, 350 124, 335 116 C 316 120, 304 140, 300 160 L 268 178 Q 258 178 248 176 L 262 152 L 252 140 C 180 132, 110 112, 60 102 L 16 98", air);
    var L = path.getTotalLength(), f = [], p = 0;
    [[438, 160], [335, 116], [248, 176], [16, 98]].forEach(function (r) { p = nearest(path, L, r[0], r[1], p + 0.01); f.push(p); });
    var chips = box ? $$(".chip", box) : [];
    var stages = f.map(function (b, i) { return { a: i ? f[i - 1] : 0, b: b, move: 2200, hold: 3400, name: chips[i] ? chips[i].textContent : "", fadeIn: i === 0 }; });
    var dot = document.createElementNS(NS, "circle"); dot.setAttribute("r", 8); dot.setAttribute("class", "air-parcel"); air.appendChild(dot);
    var player = Stepper({
      host: air, after: air, path: path, stages: stages, noun: "o caminho do ar", note: note, autoplay: true,
      draw: function (pt, k, t, s, alpha) {
        if (k === 3) alpha *= 1 - clamp((t - (reduced ? 0 : s.move) - s.hold + 600) / 600); // a porção sai pelo bico e some
        dot.setAttribute("cx", pt.x.toFixed(1)); dot.setAttribute("cy", pt.y.toFixed(1)); dot.style.opacity = alpha;
        dot.classList.toggle("out", k % 2 === 1); // verde ao inspirar, laranja ao expirar (as mesmas cores da comparação abaixo)
      },
      onStage: function (k) { showChip(box, air, note, chips[k]); }
    });
    bindChips(box, player, function (i) { return i; });
  })();

  /* ---------- aula 8: caminho do alimento ---------- */
  var gut = document.getElementById("gut");
  if (gut) (function () {
    var box = document.querySelector('.layers[data-target="gut"]'), note = gut.parentElement.querySelector(".diagram-note");
    // na moela o trajeto passa acima do rótulo, para o ponto não cobrir a palavra enquanto está parado
    var path = hiddenPath("M 40 106 L 62 106 C 100 120, 128 140, 158 178 C 176 194, 214 210, 250 210 L 270 208 C 300 206, 318 194, 346 194 C 372 194, 388 204, 394 214 C 440 196, 470 224, 452 248 C 434 268, 480 274, 520 248 C 552 228, 540 212, 566 204", gut);
    var L = path.getTotalLength(), f = [], p = 0;
    // onde o alimento para em cada parte (acima dos rótulos "papo" e "moela")
    [[40, 106], [150, 166], [270, 208], [346, 194], [452, 248], [566, 204]].forEach(function (r, i) { p = i ? nearest(path, L, r[0], r[1], p + 0.01) : 0; f.push(p); });
    var chips = box ? $$(".chip", box) : [];
    var stages = f.map(function (b, i) { return { a: i ? f[i - 1] : 0, b: b, move: i ? 1600 : 0, hold: i === 5 ? 2800 : 3800, name: chips[i] ? chips[i].textContent : "", fadeIn: i === 0 }; });
    var dot = document.createElementNS(NS, "circle"); dot.setAttribute("class", "food-pt"); gut.appendChild(dot);
    var player = Stepper({
      host: gut, after: gut, path: path, stages: stages, noun: "o caminho do alimento", note: note, autoplay: true,
      draw: function (pt, k, t, s, alpha) {
        var m = reduced ? 0 : s.move, h = clamp((t - m) / s.hold), r = 7, x = pt.x, y = pt.y;
        if (k === 3) { // moela: o alimento é triturado (treme e diminui)
          r = 7 - 2 * h;
          if (!reduced && t > m) { x += Math.sin(t / 45) * 2.2 * (1 - h * 0.5); y += Math.cos(t / 60) * 1.6 * (1 - h * 0.5); }
        } else if (k === 4) r = 5 - 1.5 * (m ? clamp(t / m) : 1); // intestino: os nutrientes passam para o sangue
        else if (k === 5) { r = 3.5; alpha *= 1 - clamp((t - m - s.hold + 600) / 600); } // cloaca: os restos saem
        dot.setAttribute("cx", x.toFixed(1)); dot.setAttribute("cy", y.toFixed(1)); dot.setAttribute("r", r.toFixed(2)); dot.style.opacity = alpha;
      },
      onStage: function (k) { showChip(box, gut, note, chips[k]); }
    });
    bindChips(box, player, function (i) { return i; });
  })();

  /* ---------- aula 15: migração do maçarico ---------- */
  var map = document.getElementById("map");
  if (map && map.querySelector(".route")) (function () {
    var path = map.querySelector(".route"), L = path.getTotalLength();
    var box = document.querySelector('.layers[data-target="map"]'), note = map.parentElement.querySelector(".diagram-note");
    var keys = ["p5", "p4", "p3", "p2", "p1"]; // do sul para o norte
    var names = ["Terra do Fogo", "Lagoa do Peixe (RS)", "Maranhão", "Baía de Delaware", "Ártico canadense"];
    var f = keys.map(function (key) { var w = map.querySelector(".wp." + key); return nearest(path, L, +w.getAttribute("cx"), +w.getAttribute("cy"), 0); });
    var order = [0, 1, 2, 3, 4, 3, 2, 1, 0]; // ida na primavera, volta depois da reprodução
    var stages = order.map(function (to, i) {
      var fromI = i ? order[i - 1] : 0, north = i <= 4;
      return { a: f[fromI], b: f[to], to: to, move: i ? 2400 : 0, hold: i === 4 ? 3000 : 2200, fadeIn: i === 0,
        label: function (moving) {
          if (moving) return (north ? "Rumo ao norte, na primavera: " : "Rumo ao sul, depois da reprodução: ") + names[fromI] + " → " + names[to];
          return i === 0 ? "Invernada em " + names[0] : i === 4 ? "Reprodução no " + names[4] : i === 8 ? "De volta à invernada em " + names[0] : "Parada em " + names[to];
        } };
    });
    var chipFor = function (idx) { return box ? box.querySelector('.chip[data-k="' + keys[idx] + '"]') : null; };
    var bird = document.createElementNS(NS, "circle"); bird.setAttribute("r", 9); bird.setAttribute("class", "bird-pt"); map.appendChild(bird);
    var player = Stepper({
      host: map, after: map, path: path, stages: stages, noun: "a migração", note: note, autoplay: true, reversible: true, loopTo: 1,
      draw: function (pt, k, t, s, alpha) { bird.setAttribute("cx", pt.x.toFixed(1)); bird.setAttribute("cy", pt.y.toFixed(1)); bird.style.opacity = alpha; },
      onStage: function (k) { showChip(box, map, note, chipFor(stages[k].to)); }
    });
    // tocar num ponto: a ave voa até ele pela rota, seguindo o sentido atual da viagem
    bindChips(box, player, function (i, chip) {
      var idx = keys.indexOf(chip.dataset.k), cur = player.stage();
      if (stages[cur].to === idx) return cur;
      for (var d = 1; d <= stages.length; d++) { var j = (cur + d) % stages.length; if (j && stages[j].to === idx) return j; }
      return 0;
    });
  })();

  /* ---------- aula 13: trajetórias de voo ----------
     O traço se desenha quando aparece; depois o ponto percorre o trajeto duas vezes e para no fim.
     O ritmo muda com o tipo de voo (no mergulho, o ponto acelera). */
  $$("svg.fly").forEach(function (svg) {
    var path = svg.querySelector(".trace"), dot = svg.querySelector(".dot"); if (!path || !dot) return;
    var kind = svg.getAttribute("data-move") || "even", dur = +svg.getAttribute("data-dur") || 3600, RUNS = 2;
    var L = 0, drawn = false, visible = false, playing = false, runs = 0, t = 0, raf = 0, last = 0;
    var wrap = document.createElement("div"); wrap.className = "motion-ctrl";
    var btn = button("", ""); wrap.appendChild(btn); svg.insertAdjacentElement("afterend", wrap);
    function prof(u) { return kind === "accel" ? u * u * u : u; }
    function place() {
      var pt = path.getPointAtLength(prof(clamp(t / dur)) * L);
      dot.setAttribute("cx", pt.x.toFixed(1)); dot.setAttribute("cy", pt.y.toFixed(1));
      dot.style.opacity = runs >= RUNS ? 1 : Math.min(clamp(t / 250), 1 - clamp((t - dur - 350) / 250));
    }
    function sync() { playLabel(btn, playing, "o percurso", runs >= RUNS ? "Ver de novo" : t > 0 ? "Continuar" : "Reproduzir"); }
    function frame(now) {
      raf = 0; if (!playing || !visible) return;
      t += Math.min(64, now - last); last = now;
      if (t >= dur + 600) { runs++; if (runs >= RUNS) { playing = false; t = dur; place(); sync(); return; } t = 0; }
      place(); raf = requestAnimationFrame(frame);
    }
    function kick() { if (playing && visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function start() { if (!L) L = path.getTotalLength(); runs = 0; t = 0; playing = true; place(); sync(); kick(); }
    btn.addEventListener("click", function () {
      if (playing) { playing = false; sync(); return; }
      if (runs >= RUNS || !drawn) { drawn = true; start(); } else { playing = true; sync(); kick(); }
    });
    function reveal() { // desenha o traço uma única vez; o ponto só sai depois
      if (drawn) return; drawn = true; L = path.getTotalLength();
      if (reduced || !path.animate) { runs = RUNS; t = dur; place(); sync(); return; }
      path.style.strokeDasharray = L; path.style.strokeDashoffset = L;
      var an = path.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 1100, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" });
      an.onfinish = function () { path.style.strokeDashoffset = 0; path.style.strokeDasharray = "none"; an.cancel(); start(); };
    }
    dot.style.opacity = reduced ? 1 : 0; sync();
    // rolar de volta não repete; voltar a esta aba (o desenho estava escondido) mostra o percurso de novo
    var wasHidden = false;
    inView(svg, function (v) {
      if (!v) { if (!svg.getClientRects().length) wasHidden = true; visible = false; return; }
      visible = true;
      if (!drawn) reveal(); else if (wasHidden && runs >= RUNS && !reduced) start();
      wasHidden = false; kick();
    });
  });
})();
