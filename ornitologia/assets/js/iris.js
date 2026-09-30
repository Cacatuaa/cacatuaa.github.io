/* Iridescência: a cor de uma pena estrutural muda com o ângulo. Modelo didático (a curva é ilustrativa, não medida). */
(function () {
  "use strict";
  var range = document.getElementById("iris-range"), out = document.getElementById("iris-out"), sw = document.getElementById("iris-swatch"), txt = document.getElementById("iris-text");
  var pig = document.getElementById("pig-swatch");
  if (!range) return;
  function hueFor(a) { return 300 - (a / 80) * 190; } // 300 (magenta) -> 110 (verde), só ilustrativo
  function update() {
    var a = +range.value; out.textContent = a + "°";
    var h = hueFor(a);
    sw.style.background = "linear-gradient(135deg, hsl(" + (h - 14) + " 78% 40%), hsl(" + h + " 85% 55%) 55%, hsl(" + (h + 16) + " 80% 68%))";
    txt.textContent = a < 20 ? "Vendo de frente, a pena aparece em uma cor."
      : a < 50 ? "Inclinando, a mesma pena muda de cor."
      : "Bem inclinada, a cor muda de novo. Se a luz não chega, a pena pode parecer quase escura.";
  }
  range.addEventListener("input", update); update();
})();
