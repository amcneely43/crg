<?php snippet('nav') ?>
<main class="weavings triptych">
  <div class="gleaning-article">

    <a class="gleaning-back" href="<?= $page->parent()->url() ?>">← Back to Weavings</a>

    <?php if ($page->date()->isNotEmpty()): ?>
      <p class="gleaning-meta"><?= $page->date()->toDate('F j, Y') ?></p>
    <?php endif ?>

    <h1 class="gleaning-title"><?= $page->title()->html() ?></h1>

    <?php if ($page->author()->isNotEmpty()): ?>
      <p class="gleaning-author"><?= $page->author()->html() ?></p>
    <?php endif ?>

    <?php if ($page->subtitle()->isNotEmpty()): ?>
      <div class="gleaning-subtitle"><?= $page->subtitle()->kirbytext() ?></div>
    <?php endif ?>

    <div class="gleaning-body">
      <?php foreach ($page->article()->toBlocks() as $block): ?>
        <div id="<?= $block->id() ?>" class="block block-type-<?= $block->type() ?>">
          <?= $block ?>
        </div>
      <?php endforeach ?>
    </div>

    <?php if ($page->endnotes()->isNotEmpty()): ?>
      <div class="gleaning-endnotes">
        <h4>Endnotes</h4>
        <?= $page->endnotes()->kirbytext() ?>
      </div>
    <?php endif ?>

    <?php if ($page->bio()->isNotEmpty()): ?>
      <div class="gleaning-bio">
        <?= $page->bio()->kirbytext() ?>
      </div>
    <?php endif ?>

  </div>
</main>
<?php snippet('aside', ['image' => null]) ?>
<?php snippet('footer') ?>
