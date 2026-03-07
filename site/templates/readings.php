<?php snippet('nav') ?>

<?php /* ── Book list panel (grid col 1, row 2) ──────────────────────────────── */ ?>
<div id="bookListPanel">
  <div class="book-tabs">
    <button class="book-tab-btn active" data-tab="readings">Readings</button>
    <button class="book-tab-btn" data-tab="workshops">Workshops</button>
  </div>
  <div id="bookScroll">
    <div id="workshopIntro" hidden></div>
    <h2 id="bookListSubhead" hidden></h2>
    <ul id="bookList"></ul>
  </div>
</div>

<?php /* ── Main area: semantic map ─────────────────────────────────────────── */ ?>
<main class="readings triptych">

  <div id="mapView">
    <div class="map-wrap">
      <svg id="wordMap" role="img" aria-label="CRG semantic network"></svg>
    </div>
  </div>

</main>

<div id="mapTooltip"></div>

<?php /* ── Book detail slide-up overlay (mirrors Doings/.info) ──────────────── */ ?>
<div id="bookDetail">
  <button id="bookDetailClose" class="info-close">Close ↓</button>
  <div id="bookDetailContent"></div>
</div>

<?php /* ── Inject Kirby data for JS ──────────────────────────────────────────── */ ?>
<script>
window.CRG_TERMS         = <?= json_encode($termsData,     JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?>;
window.CRG_BOOKS         = <?= json_encode($booksData,     JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?>;
window.CRG_WORKSHOP_INTRO = <?= json_encode((string) $workshopIntro, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?>;
</script>

<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
<script src="<?= url('assets/js/readings.js') ?>"></script>

<?php snippet('footer') ?>
