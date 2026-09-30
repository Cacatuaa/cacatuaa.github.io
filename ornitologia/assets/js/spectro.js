/* Espectrograma de um áudio local: desenha frequência (vertical) x tempo (horizontal) usando a Web Audio API. */
(function () {
  "use strict";
  var cards = Array.prototype.slice.call(document.querySelectorAll(".audio-card[data-src]"));
  if (!cards.length) return;
  var AC = window.AudioContext || window.webkitAudioContext;
  cards.forEach(function (card) {
    var btn = card.querySelector(".spec-btn"), cv = card.querySelector("canvas"), st = card.querySelector(".spec-status");
    if (!btn || !cv) return;
    if (!AC) { btn.hidden = true; return; }
    // linha que acompanha o áudio sobre o espectrograma: liga o som ao desenho
    var audio = card.querySelector("audio"), wrap = document.createElement("div"), head = document.createElement("div");
    wrap.className = "spec-wrap"; head.className = "spec-head"; head.setAttribute("aria-hidden", "true");
    cv.parentNode.insertBefore(wrap, cv); wrap.appendChild(cv); wrap.appendChild(head);
    var raf = 0;
    function follow() {
      raf = 0; if (!audio || !audio.duration) return;
      head.style.transform = "translateX(" + (100 * audio.currentTime / audio.duration).toFixed(2) + "%)";
      if (!audio.paused) raf = requestAnimationFrame(follow);
    }
    if (audio) {
      ["play", "seeked", "timeupdate"].forEach(function (ev) { audio.addEventListener(ev, function () { if (wrap.classList.contains("drawn")) { wrap.classList.add("live"); if (!raf) raf = requestAnimationFrame(follow); } }); });
      audio.addEventListener("ended", function () { wrap.classList.remove("live"); });
    }
    btn.addEventListener("click", function () {
      btn.disabled = true; st.textContent = "Carregando a gravação…";
      fetch(card.dataset.src).then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.arrayBuffer(); })
        .then(function (buf) { st.textContent = "Desenhando o espectrograma…"; var ctx = new AC(); return new Promise(function (res, rej) { ctx.decodeAudioData(buf, res, rej); }); })
        .then(function (ab) { return new Promise(function (res) { setTimeout(function () { res(ab); }, 30); }); }) // deixa o aviso aparecer antes do cálculo
        .then(function (ab) {
          draw(ab, cv); btn.hidden = true; wrap.classList.add("drawn");
          st.textContent = audio ? "Dê o play no áudio acima: a linha clara mostra o trecho que está tocando." : "";
          if (audio && !audio.paused) { wrap.classList.add("live"); follow(); }
        })
        .catch(function () { st.innerHTML = "Não conseguimos desenhar o espectrograma. <button class=\"link-btn\" type=\"button\">Tentar novamente</button>"; btn.disabled = false;
          var again = st.querySelector("button"); if (again) again.onclick = function () { btn.click(); }; });
    });
  });
  function draw(ab, cv) {
    var data = ab.getChannelData(0), sr = ab.sampleRate, N = 1024, hop = Math.max(256, Math.floor(data.length / 900));
    var frames = Math.min(900, Math.floor((data.length - N) / hop)), bins = 128, W = frames, H = bins;
    cv.width = W; cv.height = H; var g = cv.getContext("2d"), img = g.createImageData(W, H);
    var win = new Float32Array(N); for (var i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));
    var maxHz = Math.min(10000, sr / 2), maxBin = Math.floor(maxHz / (sr / N));
    var mags = new Float32Array(W * H), peak = 1e-9;
    for (var f = 0; f < frames; f++) {
      var off = f * hop, re = new Float32Array(N), im = new Float32Array(N);
      for (var k = 0; k < N; k++) re[k] = data[off + k] * win[k];
      fft(re, im);
      for (var b = 0; b < H; b++) {
        var bi = Math.floor(b * maxBin / H), m = Math.sqrt(re[bi] * re[bi] + im[bi] * im[bi]);
        mags[f * H + b] = m; if (m > peak) peak = m;
      }
    }
    for (var x = 0; x < W; x++) for (var y = 0; y < H; y++) {
      var v = Math.min(1, Math.log10(1 + 60 * Math.min(1, mags[x * H + (H - 1 - y)] / (peak * 0.12))) / Math.log10(61)), p = (y * W + x) * 4;
      var c = 255 * Math.pow(v, 1.15);
      img.data[p] = 18 + c * 0.78; img.data[p + 1] = 34 + c * 0.96; img.data[p + 2] = 26 + c * 0.7; img.data[p + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  function fft(re, im) { // radix-2 in place
    var n = re.length, j = 0, i, k, t;
    for (i = 1; i < n; i++) { var bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (var len = 2; len <= n; len <<= 1) {
      var ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (i = 0; i < n; i += len) { var cr = 1, ci = 0;
        for (k = 0; k < len / 2; k++) {
          var ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
          re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
          var nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } } }
  }
})();
