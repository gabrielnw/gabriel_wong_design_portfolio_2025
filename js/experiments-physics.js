(function () {
  var container = document.querySelector(".experiment-cards");
  if (!container) return;

  var cards = Array.from(container.querySelectorAll(".experiment-card"));
  var count = cards.length;

  function scatter() {
    var containerW = container.offsetWidth;
    var cardW = cards[0].offsetWidth || 220;
    var cardH = 240;
    var padding = 20;

    var cols = Math.max(2, Math.floor(containerW / (cardW + 40)));
    var slotW = containerW / cols;
    var slotH = cardH + 60;

    var totalRows = Math.ceil(count / cols);
    container.style.minHeight = (totalRows * slotH + padding * 2) + "px";

    cards.forEach(function (card, i) {
      var col = i % cols;
      var row = Math.floor(i / cols);

      var baseX = col * slotW + (slotW - cardW) / 2;
      var baseY = row * slotH + padding;

      var offsetX = (Math.random() - 0.5) * (slotW - cardW) * 0.6;
      var offsetY = (Math.random() - 0.5) * 40;
      var rotation = (Math.random() - 0.5) * 12;

      var x = Math.max(padding, Math.min(containerW - cardW - padding, baseX + offsetX));
      var y = Math.max(padding, baseY + offsetY);

      card.style.left = x + "px";
      card.style.top = y + "px";
      card.style.transform = "rotate(" + rotation + "deg)";
    });
  }

  scatter();

  // Enable hover transitions only after initial placement
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      cards.forEach(function (card) {
        card.style.transition = "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease";
      });
    });
  });

  window.addEventListener("resize", scatter);
})();
