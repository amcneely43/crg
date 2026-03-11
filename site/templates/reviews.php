<?php snippet('nav') ?>

<main class="weavings triptych">
  <div class="weavings-page">

    <h1 class="weavings-title-main"><?= $page->title()->html() ?></h1>
    <hr class="dotted-divider">

    <?php if ($page->intro()->isNotEmpty()): ?>
      <div class="weavings-intro"><?= $page->intro()->kirbytext() ?></div>
      <hr class="dotted-divider">
    <?php endif ?>

    <div class="weavings-list">
      <?php foreach ($page->children()->listed() as $article): ?>
        <div class="weavings-entry">
          <?php if ($article->date()->isNotEmpty()): ?>
            <p class="weavings-date uppercase"><?= strtoupper($article->date()->toDate('F j, Y')) ?></p>
          <?php endif ?>
          <h2 class="weavings-entry-title">
            <a href="<?= $article->url() ?>"><?= $article->title()->html() ?></a>
          </h2>
          <?php if ($article->author()->isNotEmpty()): ?>
            <p class="weavings-author"><?= $article->author()->html() ?></p>
          <?php endif ?>
          <?php if ($article->subtitle()->isNotEmpty()): ?>
            <p class="weavings-excerpt"><?= Str::excerpt($article->subtitle()->value(), 200) ?>…</p>
          <?php endif ?>
        </div>
      <?php endforeach ?>
    </div>

  </div>
</main>
<?php snippet('aside', ['image' => null]) ?>
<?php snippet('footer') ?>
