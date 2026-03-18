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

  <?php /* ── Legend panel (bottom-left, HTML so it moves with the map like the doxa panel) ── */ ?>
  <div id="legendPanel">
    <p class="legend-title">Poles of Being in Common</p>
    <div class="legend-cols">
      <div class="legend-col">
        <div class="legend-item">
          <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true"><circle r="6" fill="rgba(255,255,255,0.75)"/></svg>
          <span>Rapture</span>
        </div>
        <div class="legend-item">
          <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true"><circle r="6" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="1.5"/></svg>
          <span>Rupture</span>
        </div>
      </div>
      <div class="legend-col">
        <div class="legend-item">
          <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true"><path d="M 6,0 A 6,6 0 1,0 -6,0 A 6,6 0 1,0 6,0 Z M -1,-4 L 1,-4 L 1,-1 L 4,-1 L 4,1 L 1,1 L 1,4 L -1,4 L -1,1 L -4,1 L -4,-1 L -1,-1 Z" fill="rgba(255,255,255,0.75)" fill-rule="evenodd"/></svg>
          <span>Harmony</span>
        </div>
        <div class="legend-item">
          <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true"><path d="M 6,0 A 6,6 0 1,0 -6,0 A 6,6 0 1,0 6,0 Z M -4,-1 L 4,-1 L 4,1 L -4,1 Z" fill="rgba(255,255,255,0.75)" fill-rule="evenodd"/></svg>
          <span>Dissonance</span>
        </div>
      </div>
    </div>
  </div>

  <?php /* ── Doxa panel: ConceptNet overlay, opened by clicking amber-ring nodes ── */ ?>
  <div id="doxaPanel" hidden>
    <button id="doxaPanelClose" aria-label="Close doxa panel">×</button>
    <p id="doxaPanelTerm" class="doxa-panel-term"></p>
    <div id="doxaPanelBody">
      <p class="doxa-panel-loading">Loading…</p>
    </div>
  </div>

</main>

<div id="mapTooltip"></div>

<?php /* ── Book detail slide-up overlay (mirrors Doings/.info) ──────────────── */ ?>
<div id="bookDetail">
  <button id="bookDetailClose" class="info-close">← Back to Readings/Workshops</button>
  <div id="bookDetailContent"></div>
</div>

<?php /* ── Inject Kirby data for JS ──────────────────────────────────────────── */ ?>
<script>
window.CRG_TERMS          = <?= json_encode($termsData,           JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) ?>;
window.CRG_BOOKS          = <?= json_encode($booksData,           JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) ?>;
window.CRG_WORKSHOP_INTRO = <?= json_encode((string) $workshopIntro, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) ?>;
</script>

<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
<script src="<?= url('assets/js/readings.js') ?>"></script>

<?php snippet('footer') ?>
