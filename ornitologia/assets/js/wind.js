/* Túnel de vento didático: linhas de ar em torno de uma asa em corte.
   É um modelo ilustrativo, não uma simulação física exata.
   O desenho acompanha os controles com uma transição curta (a asa gira e as linhas se ajustam juntas)
   e o fluxo de ar corre numa velocidade que muda sem saltos. */
(function () {
  "use strict";
  var stage = document.getElementById("wind");
  if (!stage) return;
  var $ = function (s) { return stage.querySelector(s); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var streams = $("#streams"), foil = $("#foil"), liftArrow = $("#lift-arrow"), liftTag = $("#lift-tag");
  var alpha = $("#alpha"), speed = $("#speed"), aOut = $("#alpha-out"), sOut = $("#speed-out");
  var meter = $("#lift-meter"), meterBox = $("#lift-box"), status = $("#status"), statusText = $("#status-text"), statusIcon = $("#status-icon");
  var pauseBtn = $("#pause");
  var STALL = 15, WEIGHT = 0.3, YS = [50, 88, 126, 160, 186, 236, 262, 296, 334, 372];
  var seeds = YS.map(function (_, i) { return i * 1.7 + 0.5; });

  function cl(a) { return a <= STALL ? 0.18 + 0.77 * (a / STALL) : Math.max(0.05, 0.95 - (a - STALL) * 0.11); }
  function lift(a, v) { return cl(a) * Math.pow(v / 20, 2); }
  function sig(x) { return 1 / (1 + Math.exp(-x)); }

  function line(y0, a) {
    var d = y0 - 210, up = d < 0, pts = [], turb = up && a > STALL && Math.abs(d) < 120, near = Math.exp(-Math.abs(d) / 60);
    var far = Math.exp(-Math.abs(d) / 140), x, y, bump, wash, shiftAt, t;
    function shift(x) {
      bump = Math.exp(-Math.pow((x - 400) / 120, 2));
      var k = up ? -36 * (1 + a / 22) * near : 15 * near;
      wash = -a * 0.7 * (1 - sig((x - 385) / 40)) + a * 2.4 * sig((x - 450) / 55) * Math.exp(-Math.max(0, x - 450) / 320);
      return k * bump + wash * far;
    }
    shiftAt = shift(440);
    for (x = -10; x <= 810; x += 10) {
      y = y0 + shift(x);
      if (turb && x > 440) {
        t = (x - 440) * (0.1 + (a - STALL) * 0.02);
        y = y0 + shiftAt * Math.exp(-(x - 440) / 200) + Math.sin(x * 0.09 + seeds[YS.indexOf(y0)]) * t + Math.sin(x * 0.23 + 2) * t * 0.4;
      }
      pts.push((x < 0 ? 0 : x) + " " + y.toFixed(1));
    }
    return { pts: pts.join(" "), turb: turb };
  }

  // as linhas são criadas uma vez e só mudam de forma (assim o fluxo não reinicia a cada ajuste)
  var lines = YS.map(function () {
    var p = document.createElementNS("http://www.w3.org/2000/svg", "polyline"); p.setAttribute("class", "stream"); streams.appendChild(p); return p;
  });

  // valores mostrados no desenho (seguem os controles com suavidade)
  var shownA = +alpha.value, shownV = +speed.value;
  function drawGeometry(a, v) {
    YS.forEach(function (y, i) { var r = line(y, a); lines[i].setAttribute("points", r.pts); lines[i].classList.toggle("turb", r.turb); });
    foil.setAttribute("transform", "translate(400 210) rotate(" + a.toFixed(2) + ")");
    var len = Math.min(170, lift(a, v) * 260);
    liftArrow.setAttribute("y2", (210 - 30 - len).toFixed(1));
    liftArrow.style.opacity = len < 6 ? 0 : 1;
    liftTag.setAttribute("y", (210 - 40 - len).toFixed(1));
  }
  // números, medidor e aviso respondem na hora
  function updateReadout() {
    var a = +alpha.value, v = +speed.value, L = lift(a, v);
    aOut.textContent = a + "°"; sOut.textContent = v + " m/s";
    meter.style.transform = "scaleX(" + Math.min(1, L / 0.9).toFixed(3) + ")";
    var stalled = a > STALL;
    meterBox.classList.toggle("warn", stalled);
    var msg, warn = false, ic = "info";
    if (stalled) { msg = "Estol: o ar se solta da parte de cima da asa e a sustentação cai de repente. A ave perde altura."; warn = true; ic = "alert"; }
    else if (L >= WEIGHT) { msg = "A sustentação supera o peso: a ave se mantém no ar, ou sobe."; }
    else { msg = "A sustentação é menor que o peso: a ave perde altura. Aumente a velocidade ou incline a asa (até certo ponto)."; warn = true; ic = "alert"; }
    status.classList.toggle("warn", warn);
    if (statusText.textContent !== msg) statusText.textContent = msg;
    statusIcon.innerHTML = ic === "alert" ? '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>' : '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>';
  }

  // um só relógio: move o fluxo e aproxima o desenho dos controles
  var userPaused = reduced, visible = true, raf = 0, last = 0, offset = 0;
  function settling() { return Math.abs(shownA - alpha.value) > 0.01 || Math.abs(shownV - speed.value) > 0.01; }
  function frame(now) {
    raf = 0; if (!visible) return;
    var dt = Math.min(64, now - last); last = now;
    if (settling()) {
      var k = reduced ? 1 : 1 - Math.exp(-dt / 90); // ~300 ms para chegar ao valor novo
      shownA += (+alpha.value - shownA) * k; shownV += (+speed.value - shownV) * k;
      if (!settling()) { shownA = +alpha.value; shownV = +speed.value; }
      drawGeometry(shownA, shownV);
    }
    if (!userPaused) { // traços de 8 + 14 = 22 unidades; mais velocidade, fluxo mais rápido
      offset = (offset - dt * 0.0275 * (0.5 + shownV / 14)) % 44;
      streams.style.setProperty("--off", offset.toFixed(2));
    }
    if (!userPaused || settling()) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function onInput() { updateReadout(); kick(); }
  alpha.addEventListener("input", onInput); speed.addEventListener("input", onInput);
  drawGeometry(shownA, shownV); updateReadout();

  function sync() {
    stage.classList.toggle("paused", userPaused);
    if (window.ORN_UI) ORN_UI.playLabel(pauseBtn, !userPaused, "o fluxo de ar");
    else pauseBtn.textContent = userPaused ? "Reproduzir o fluxo de ar" : "Pausar o fluxo de ar";
  }
  pauseBtn.addEventListener("click", function () { userPaused = !userPaused; sync(); kick(); });
  if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; kick(); }).observe(stage);
  sync(); kick();
})();
