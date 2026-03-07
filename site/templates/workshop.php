<?php snippet('nav') ?>

<?php /* ── Persistent book list sidebar (grid col 1, row 2) ─────────────────── */ ?>
<div id="bookListPanel">
  <div class="book-tabs">
    <button class="book-tab-btn" data-tab="readings">Readings</button>
    <button class="book-tab-btn active" data-tab="workshops">Workshops</button>
  </div>
  <ul id="bookList">
    <?php foreach ($allSiblings as $sibling): ?>
      <?php $isWorkshop = $sibling->intendedTemplate()->name() === 'workshop' ?>
      <li class="book-item<?= $sibling->is($page) ? ' book-item--active' : '' ?>"
          data-type="<?= $isWorkshop ? 'workshop' : 'reading' ?>">
        <a href="<?= $sibling->url() ?>">
          <?php if ($sibling->date()->isNotEmpty()): ?>
            <span class="book-date"><?= strtoupper($sibling->date()->toDate('F Y')) ?></span>
          <?php endif ?>
          <span class="book-title"><?= $sibling->title()->html() ?></span>
          <span class="book-author"><?= $sibling->author()->html() ?></span>
          <?php if ($isWorkshop && $sibling->contributor()->isNotEmpty()): ?>
            <span class="book-contributor"><?= $sibling->contributor()->html() ?></span>
          <?php endif ?>
        </a>
      </li>
    <?php endforeach ?>
  </ul>
</div>

<?php /* ── Workshop detail (grid col 2, rows 1–2) ──────────────────────────── */ ?>
<main class="reading-detail triptych">
  <div id="readingContent">

    <a href="<?= $page->parent()->url() ?>" class="back-link uppercase">← Back to Readings</a>

    <h2 class="detail-title"><?= $page->title()->html() ?></h2>
    <p class="detail-author"><?= $page->author()->html() ?></p>

    <?php if ($page->contributor()->isNotEmpty()): ?>
      <p class="detail-author"><?= $page->contributor()->html() ?></p>
    <?php endif ?>

    <?php if ($page->date()->isNotEmpty()): ?>
      <?php
        $meta = $page->date()->toDate('F j, Y');
        if ($page->customTime()->isNotEmpty()) $meta .= ' · ' . $page->customTime()->html();
        if ($page->location()->isNotEmpty())   $meta .= ' · ' . $page->location()->html();
      ?>
      <p class="detail-meta"><?= $meta ?></p>
    <?php endif ?>

    <hr class="dotted-divider">

    <?php if ($page->note()->isNotEmpty()): ?>
      <div class="detail-note"><?= $page->note()->kirbytext() ?></div>
    <?php endif ?>

    <?php if ($page->blurb()->isNotEmpty()): ?>
      <hr class="dotted-divider">
      <p class="detail-section-label">Opening Remarks</p>
      <div class="detail-blurb"><?= $page->blurb()->kirbytext() ?></div>
    <?php endif ?>

    <?php if ($page->download_reading()->isNotEmpty()): ?>
      <div class="detail-annotations">
        <a href="<?= $page->download_reading() ?>" target="_blank" rel="noopener" class="button-outline">Workshop Materials →</a>
      </div>
    <?php endif ?>

    <?php if ($page->links()->isNotEmpty()): ?>
      <div class="detail-links">
        <hr class="dotted-divider">
        <p class="detail-section-label">Supplementary Resources</p>
        <ul>
          <?php foreach ($page->links()->toStructure() as $link): ?>
            <li><a href="<?= $link->url() ?>" target="_blank" rel="noopener"><?= $link->description()->html() ?></a></li>
          <?php endforeach ?>
        </ul>
      </div>
    <?php endif ?>

  </div>
</main>

<?php /* ── Tab-switching JS (show workshops by default) ──────────────────────── */ ?>
<script>
(function () {
  var tabs    = document.querySelectorAll('.book-tab-btn');
  var items   = document.querySelectorAll('#bookList .book-item');

  function applyTab(tab) {
    items.forEach(function (item) {
      item.style.display = (tab === 'workshops')
        ? (item.dataset.type === 'workshop' ? '' : 'none')
        : (item.dataset.type === 'reading'  ? '' : 'none');
    });
  }

  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabs.forEach(function (b) { b.classList.toggle('active', b === btn); });
      applyTab(btn.dataset.tab);
    });
  });

  /* Default: show workshops only */
  applyTab('workshops');

  /* Scroll active item into view */
  var active = document.querySelector('.book-item--active');
  if (active) active.scrollIntoView({ block: 'nearest' });
})();
</script>

<?php snippet('footer') ?>
