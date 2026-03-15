<?php snippet('nav') ?>

<?php /* ── Persistent book list sidebar (grid col 1, row 2) ─────────────────── */ ?>
<div id="bookListPanel">
  <div class="book-tabs">
    <button class="book-tab-btn active" data-tab="readings">Readings</button>
    <button class="book-tab-btn" data-tab="workshops">Workshops</button>
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

<?php /* ── Reading detail (grid col 2, rows 1–2) ───────────────────────────── */ ?>
<main class="reading-detail triptych">
  <div id="readingContent">

    <a href="<?= $page->parent()->url() ?>" class="back-link uppercase">← Back to Readings</a>

    <h2 class="detail-title"><?= $page->title()->html() ?><?php if ($page->subtitle()->isNotEmpty()): ?>: <?= $page->subtitle()->html() ?><?php endif ?></h2>
    <p class="detail-author"><?= $page->author()->html() ?></p>

    <?php if ($page->date()->isNotEmpty()): ?>
      <p class="detail-meta">Reading began <?= $page->date()->toDate('F Y') ?></p>
    <?php endif ?>

    <hr class="dotted-divider">

    <div class="detail-top-cols">
      <div class="detail-note">
        <?php if ($page->note()->isNotEmpty()): ?>
          <?= $page->note()->kirbytext() ?>
        <?php endif ?>
      </div>
      <div class="detail-flyer">
        <?php $flyer = $page->images()->filterBy('template', 'flyer')->first() ?>
        <?php if ($flyer): ?>
          <img src="<?= $flyer->url() ?>" alt="<?= $page->title()->html() ?> flyer">
        <?php else: ?>
          <div class="detail-flyer-placeholder">Flyer Pending</div>
        <?php endif ?>
        <?php if ($page->flyerBy()->isNotEmpty()): ?>
          <p class="detail-flyer-by">Design by <?= $page->flyerBy()->html() ?></p>
        <?php endif ?>
      </div>
    </div>

    <?php if ($page->blurb()->isNotEmpty()): ?>
      <hr class="dotted-divider">
      <p class="detail-section-label">Opening Remarks</p>
      <div class="detail-blurb"><?= $page->blurb()->kirbytext() ?></div>
      <?php if ($page->nominatedBy()->isNotEmpty()): ?>
        <p class="detail-section-credit">— <?= $page->nominatedBy()->html() ?></p>
      <?php endif ?>
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

    <?php if ($page->interlocutors()->isNotEmpty()): ?>
      <div class="detail-interlocutors">
        <hr class="dotted-divider">
        <p class="detail-section-label">Interlocutors</p>
        <ul>
          <?php foreach ($page->interlocutors()->toStructure() as $intl): ?>
            <li>
              <?php if ($intl->stanford_url()->isNotEmpty()): ?>
                <a href="<?= $intl->stanford_url() ?>" target="_blank" rel="noopener"><?= $intl->name()->html() ?></a>
              <?php else: ?>
                <?= $intl->name()->html() ?>
              <?php endif ?>
            </li>
          <?php endforeach ?>
        </ul>
      </div>
    <?php endif ?>

    <div class="detail-annotations">
      <?php if ($page->bookstackUrl()->isNotEmpty()): ?>
        <a href="<?= $page->bookstackUrl() ?>" target="_blank" rel="noopener" class="button-outline">View Annotations →</a>
      <?php else: ?>
        <span class="button-outline button-outline--disabled">View Annotations →</span>
      <?php endif ?>
    </div>

  </div>
</main>

<?php /* ── Tab-switching JS (show readings by default, hide workshops) ─────── */ ?>
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

  /* Default: show readings only */
  applyTab('readings');

  /* Scroll active item into view */
  var active = document.querySelector('.book-item--active');
  if (active) active.scrollIntoView({ block: 'nearest' });
})();
</script>

<?php snippet('footer') ?>
