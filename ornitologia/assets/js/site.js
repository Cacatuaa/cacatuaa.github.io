/* Ornitologia do zero — comportamento compartilhado. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ROOT = document.body.dataset.root || "";
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(pointer: fine)").matches;

  /* ---------- armazenamento (pode falhar em janelas privadas) ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var done = function () { return store.get("orn-done", []); };

  /* ---------- ícones (traço 1,75, estilo Lucide) ---------- */
  var ICONS = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    pointer: '<path d="M9 9a3 3 0 0 1 6 0v3l3.5.7a2 2 0 0 1 1.5 2.4L19 20H9l-4-6 1.5-1.5L9 14Z"/>',
    retry: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'
  };
  function icon(n, cls) { return '<svg class="icon ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || "") + "</svg>"; }
  function paintIcons(root) { $$("[data-i]", root).forEach(function (el) { el.outerHTML = icon(el.dataset.i, el.dataset.cls); }); }
  paintIcons();

  /* ---------- tema ---------- */
  var root = document.documentElement;
  function applyTheme(t) { root.dataset.theme = t; store.set("orn-theme", t); syncThemeBtn(); }
  // troca com um fade único da página (quando o navegador permite); sem isso, cada cor mudaria num tempo diferente
  function setTheme(t) {
    if (document.startViewTransition) document.startViewTransition(function () { applyTheme(t); });
    else applyTheme(t);
  }
  function syncThemeBtn() {
    var btn = $("#theme"); if (!btn) return;
    var dark = root.dataset.theme !== "light";
    btn.innerHTML = icon(dark ? "sun" : "moon");
    btn.setAttribute("aria-label", dark ? "Mudar para o tema claro" : "Mudar para o tema escuro");
  }
  var themeBtn = $("#theme");
  if (themeBtn) themeBtn.addEventListener("click", function () { setTheme(root.dataset.theme === "light" ? "dark" : "light"); });
  syncThemeBtn();

  /* ---------- créditos das fotos ---------- */
  $$("[data-credit]").forEach(function (el) {
    var c = (window.CREDITS || {})[el.dataset.credit]; if (!c) return;
    var lbl = c.kind === 'audio' ? 'Áudio' : c.kind === 'map' ? 'Mapa' : 'Foto'; el.innerHTML = lbl + ': ' + c.author + ' · <a href="' + c.page + '" target="_blank" rel="noopener">' + c.license + " · Wikimedia Commons</a>";
  });

  /* ---------- barra do topo: esconde ao descer, volta ao subir ---------- */
  var nav = $(".nav"), lastY = 0, bar = $(".progress");
  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle("hide", y > lastY && y > 120);
    lastY = y;
    if (bar) { var h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, y / h) : 0) + ")"; }
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- menu do celular ---------- */
  var menu = $("#mmenu"), menuBtn = $("#menu-btn"), lastFocus = null;
  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    if (menu.inert !== undefined) menu.inert = !open;
    menuBtn.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open) { lastFocus = document.activeElement; $("#menu-close").focus(); } else if (lastFocus) lastFocus.focus();
  }
  if (menu) {
    setMenu(false);
    menuBtn.addEventListener("click", function () { setMenu(true); });
    $("#menu-close").addEventListener("click", function () { setMenu(false); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) {
      if (!menu.classList.contains("open")) return;
      if (e.key === "Escape") setMenu(false);
      if (e.key === "Tab") { // foco preso dentro do menu
        var f = $$("a, button", menu), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- rolagem suave (só desktop, sem movimento reduzido) ---------- */
  var lenis = null;
  if (window.Lenis && fine && !reduced) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    // links internos (índice, "voltar ao topo", citações): mesma rolagem suave, respeitando a barra do topo
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      var id = a.getAttribute("href").slice(1), el = id && document.getElementById(id); if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: el.id === "conteudo" ? -200 : -84 });
      history.pushState(null, "", "#" + id);
      if (!el.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
    });
  }

  /* ---------- entradas ---------- */
  // títulos: cada palavra sobe de dentro de uma faixa. Sequência de no máximo 6 passos; o resto entra junto com a 6ª.
  $$("[data-split]").forEach(function (el) {
    var i = 0;
    // preserva marcação simples (<em>): separa por espaços fora de tags
    el.innerHTML = el.innerHTML.replace(/(<[^>]+>)|(\S+)/g, function (m, tag, word) {
      if (tag) return tag;
      return '<span class="w"><span style="--i:' + Math.min(5, i++) + '">' + word + "</span></span>";
    });
    el.classList.add("w-anim");
  });
  function reveal(el) {
    el.classList.add("in");
    if (el.classList.contains("rv")) el.addEventListener("transitionend", function end(e) { if (e.target === el) { el.classList.add("done"); el.removeEventListener("transitionend", end); } });
    if (el.classList.contains("hs")) $$(".hs-dot", el).forEach(function (d, k) { d.style.setProperty("--d", Math.min(5, k)); });
    if (el._onReveal) el._onReveal();
  }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }) : null;
  function watch(el) { if (io) io.observe(el); else reveal(el); }
  $$(".rv, .w-anim, .hs").forEach(watch);

  // animações contínuas que só rodam enquanto estão na tela (ex.: corações da aula 7)
  $$(".play-inview").forEach(function (el) {
    if (!("IntersectionObserver" in window)) { el.classList.add("on-screen"); return; }
    new IntersectionObserver(function (es) { el.classList.toggle("on-screen", es[0].isIntersecting); }).observe(el);
  });

  /* ---------- momento uau da home: linhas de voo se desenhando (uma vez, sem biblioteca) ---------- */
  var flight = $(".hero-flight"), paths = $$(".hero-flight path");
  if (flight && paths.length) {
    if (!reduced && paths[0].animate) {
      paths.forEach(function (p, k) {
        var l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l;
        p.animate([{ strokeDashoffset: l }, { strokeDashoffset: 0 }], { duration: 2400, delay: 300 + k * 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" });
      });
    }
    flight.classList.add("ready");
  }

  /* ---------- avisos flutuantes ---------- */
  var toastBox = $(".toasts");
  function toast(msg, undo) {
    if (!toastBox) return;
    var t = document.createElement("div"); t.className = "toast";
    t.innerHTML = icon("check") + "<span></span>"; $("span", t).textContent = msg;
    var timer, remaining = undo ? 6000 : 4000, started;
    function close() { if (t.classList.contains("out")) return; clearTimeout(timer); t.classList.add("out"); t.addEventListener("animationend", function () { t.remove(); }); setTimeout(function () { t.remove(); }, 600); }
    function arm() { started = Date.now(); timer = setTimeout(close, remaining); }
    if (undo) { var u = document.createElement("button"); u.className = "btn-mini"; u.type = "button"; u.textContent = "Desfazer"; u.onclick = function () { undo(); close(); }; t.appendChild(u); }
    var x = document.createElement("button"); x.className = "icon-btn"; x.type = "button"; x.setAttribute("aria-label", "Fechar aviso"); x.innerHTML = icon("x"); x.onclick = close; t.appendChild(x);
    t.addEventListener("mouseenter", function () { clearTimeout(timer); remaining -= Date.now() - started; });
    t.addEventListener("mouseleave", arm);
    toastBox.appendChild(t); arm();
  }

  /* ---------- trilha (home) ---------- */
  var trail = $("#trail");
  if (trail && window.COURSE) {
    var d = done(), total = 0;
    trail.innerHTML = COURSE.map(function (m) {
      var rows = m.lessons.map(function (l) {
        total++;
        var ok = d.indexOf(l.n) > -1;
        var inner = '<span class="num">' + l.n + '</span><span class="name">' + l.title + "</span>" +
          (l.file ? (ok ? '<span class="tag done">' + icon("check") + '<span class="sr-only">Concluída</span></span>' : icon("arrow", "icon-arrow")) : '<span class="tag">Em breve</span>');
        return "<li>" + (l.file ? '<a class="lesson-row" href="aulas/' + l.file + '">' + inner + "</a>" : '<div class="lesson-row soon">' + inner + "</div>") + "</li>";
      }).join("");
      return '<li class="mod rv"><div class="mod-n">' + String(m.n).padStart(2, "0") + "</div><div><h3>" + m.title + '</h3><p class="mod-goal">' + m.goal + '</p></div><ul class="lessons">' + rows + "</ul></li>";
    }).join("");
    $$(".rv", trail).forEach(watch);
    var nDone = d.length;
    var t1 = $("#trail-count"); if (t1) t1.textContent = nDone + " de " + total + " aulas concluídas";
    // a barra se enche quando aparece na tela (e não antes, fora da vista)
    var b = $("#trail-bar"), tp = $(".trail-progress");
    if (b) { var fill = function () { b.style.transform = "scaleX(" + nDone / total + ")"; }; if (tp && io) tp._onReveal = fill; else fill(); }
  }

  /* ---------- pontos clicáveis sobre a foto ---------- */
  $$(".hs").forEach(function (box) {
    if (box.classList.contains("find")) return;
    var panel = box.parentElement.querySelector(".hs-panel");
    $$(".hs-dot", box).forEach(function (dot) {
      dot.addEventListener("click", function () {
        $$(".hs-dot", box).forEach(function (o) { o.setAttribute("aria-pressed", o === dot ? "true" : "false"); });
        panel.innerHTML = "<h3></h3><p></p>";
        $("h3", panel).textContent = dot.dataset.name; $("p", panel).textContent = dot.dataset.text;
        panel.classList.remove("swap"); void panel.offsetWidth; panel.classList.add("swap");
      });
    });
    if (box.hasAttribute("data-list")) { // lista de nomes: alternativa aos pontos, útil no celular
      var list = document.createElement("div"); list.className = "hs-list";
      $$(".hs-dot", box).forEach(function (dot) {
        var c = document.createElement("button"); c.type = "button"; c.className = "chip"; c.textContent = dot.dataset.name;
        c.addEventListener("click", function () { dot.click(); }); list.appendChild(c);
      });
      box.insertAdjacentElement("afterend", list);
    }
  });

  /* ---------- palavras novas: dica e glossário ---------- */
  var tip = document.createElement("div"); tip.className = "tip"; tip.setAttribute("role", "tooltip"); tip.id = "tip"; document.body.appendChild(tip);
  var tipFor = null;
  function showTip(t) {
    tip.innerHTML = "<b></b><span></span>"; $("b", tip).textContent = t.textContent; $("span", tip).textContent = t.dataset.def;
    var r = t.getBoundingClientRect();
    tip.style.left = Math.max(12, Math.min(innerWidth - 300, r.left + scrollX)) + "px";
    tip.style.top = r.bottom + scrollY + 8 + "px";
    tip.classList.add("show"); t.setAttribute("aria-describedby", "tip"); tipFor = t;
  }
  function hideTip() { tip.classList.remove("show"); if (tipFor) tipFor.removeAttribute("aria-describedby"); tipFor = null; }
  $$(".term").forEach(function (t) {
    t.setAttribute("type", "button");
    t.addEventListener("click", function (e) { e.stopPropagation(); tipFor === t ? hideTip() : showTip(t); });
    t.addEventListener("mouseenter", function () { if (fine) showTip(t); });
    t.addEventListener("mouseleave", function () { if (fine) hideTip(); });
    t.addEventListener("focus", function () { showTip(t); });
    t.addEventListener("blur", hideTip);
  });
  document.addEventListener("click", hideTip);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hideTip(); });
  var gl = $("#gloss");
  if (gl) {
    var seen = {};
    $$(".term").forEach(function (t) {
      var k = t.textContent.toLowerCase(); if (seen[k]) return; seen[k] = 1;
      gl.insertAdjacentHTML("beforeend", "<div><dt></dt><dd></dd></div>");
      var last = gl.lastElementChild; $("dt", last).textContent = t.textContent; $("dd", last).textContent = t.dataset.def;
    });
  }

  /* ---------- "é ave ou não é?" e teste rápido ---------- */
  function feedback(box, ok, text) {
    var fb = $(".fb", box);
    fb.className = "fb show " + (ok ? "ok" : "no");
    fb.innerHTML = icon(ok ? "check" : "alert") + "<p></p>";
    $("p", fb).innerHTML = (ok ? "<strong>Certo.</strong> " : "<strong>Ainda não.</strong> ") + text;
  }
  $$(".gcard").forEach(function (card) {
    $$(".chip", card).forEach(function (chip) {
      chip.addEventListener("click", function () {
        var right = chip.dataset.v === card.dataset.answer;
        $$(".chip", card).forEach(function (c) { c.disabled = true; if (c.dataset.v === card.dataset.answer) c.classList.add("ok"); });
        if (!right) chip.classList.add("no");
        feedback(card, right, card.dataset.why);
      });
    });
  });
  $$(".q").forEach(function (q) {
    $$(".chip", q).forEach(function (chip) {
      chip.addEventListener("click", function () {
        var right = chip.dataset.ok === "1";
        $$(".chip", q).forEach(function (c) { c.classList.remove("no"); });
        if (right) { $$(".chip", q).forEach(function (c) { c.disabled = true; }); chip.classList.add("ok"); }
        else chip.classList.add("no");
        feedback(q, right, right ? q.dataset.why : "Releia a pista e tente outra opção. " + (q.dataset.hint || ""));
      });
    });
  });

  /* ---------- índice lateral: destaca a seção atual ---------- */
  var toc = $(".toc");
  if (toc) {
    var det = $("details", toc), wide = matchMedia("(min-width: 1024px)");
    function syncDet() { det.open = wide.matches; } syncDet(); wide.addEventListener("change", syncDet);
    var links = $$("a", toc), secs = links.map(function (a) { return $(a.getAttribute("href")); });
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { links.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id); }); } });
    }, { rootMargin: "-30% 0px -60% 0px" });
    secs.forEach(function (s) { if (s) spy.observe(s); });
    links.forEach(function (a) { a.addEventListener("click", function () { if (!wide.matches) det.open = false; }); });
  }

  /* ---------- concluir aula ---------- */
  var doneBtn = $("#done");
  if (doneBtn) {
    var n = +doneBtn.dataset.lesson;
    function paint() { var on = done().indexOf(n) > -1; doneBtn.setAttribute("aria-pressed", on); doneBtn.innerHTML = icon("check") + (on ? "Aula concluída" : "Marcar como concluída"); }
    paint();
    doneBtn.addEventListener("click", function () {
      var d = done(), i = d.indexOf(n);
      if (i > -1) { d.splice(i, 1); store.set("orn-done", d); paint(); toast("Aula " + n + " desmarcada."); return; }
      d.push(n); store.set("orn-done", d); paint();
      toast("Aula " + n + " concluída.", function () { store.set("orn-done", done().filter(function (x) { return x !== n; })); paint(); });
    });
  }
})();
