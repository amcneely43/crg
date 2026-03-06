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
<?php snippet('footer') ?>
