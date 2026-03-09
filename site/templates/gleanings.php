<?php snippet('nav') ?>
<main class="gleanings triptych">
  <div class="gleanings-page">

    <h1 class="gleanings-title-main"><?= $page->title()->html() ?></h1>

    <?php if ($page->intro()->isNotEmpty()): ?>
      <div class="gleanings-intro"><?= $page->intro()->kirbytext() ?></div>
    <?php endif ?>

    <div class="gleanings-index">
      <?php foreach ($page->children()->listed()->sortBy('date', 'desc') as $gleaning): ?>
        <div class="gleanings-index-item">
          <?php if ($gleaning->date()->isNotEmpty()): ?>
            <p class="gleanings-item-meta"><?= $gleaning->date()->toDate('F j, Y') ?></p>
          <?php endif ?>
          <h2 class="gleanings-item-title">
            <a href="<?= $gleaning->url() ?>"><?= $gleaning->title()->html() ?></a>
          </h2>
          <?php if ($gleaning->byline()->isNotEmpty()): ?>
            <p class="gleanings-item-author"><?= $gleaning->byline()->html() ?></p>
          <?php endif ?>
        </div>
      <?php endforeach ?>
    </div>

  </div>
</main>
<aside class="toolkit-page">
  <div class="dotted toolkit-aside">
    <h6 class="toolkit-heading">CRG Toolkit</h6>
    <div class="toolkit-scroll">
      <?php
      $sections = [
        ['field' => 'toolkitEssential',  'label' => 'Essential Resources'],
        ['field' => 'toolkitDatabases',  'label' => 'Useful Databases & Ontologies'],
        ['field' => 'toolkitArchives',   'label' => 'Archives & Libraries'],
        ['field' => 'toolkitIndexes',    'label' => 'Indexes, Bibliographies & Textbooks'],
        ['field' => 'toolkitJournals',   'label' => 'Salient Journals'],
      ];
      foreach ($sections as $s):
        $items = $page->{$s['field']}()->toStructure();
        if (!$items->count()) continue;
      ?>
        <div class="toolkit-section">
          <h6 class="toolkit-section-label"><?= $s['label'] ?></h6>
          <ul class="toolkit-list">
            <?php foreach ($items as $item): ?>
              <li class="toolkit-item">
                <?php if ($item->url()->isNotEmpty()): ?>
                  <a href="<?= $item->url() ?>" target="_blank" rel="noopener"><?= $item->name()->html() ?></a>
                <?php else: ?>
                  <?= $item->name()->html() ?>
                <?php endif ?>
              </li>
            <?php endforeach ?>
          </ul>
        </div>
      <?php endforeach ?>
    </div>
  </div>
</aside>
<?php snippet('footer') ?>
