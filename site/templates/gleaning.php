<?php snippet('nav') ?>
<main class="gleanings triptych">
  <div class="gleaning-article">

    <a class="gleaning-back" href="<?= $page->parent()->url() ?>">← Back to Gleanings</a>

    <?php if ($page->date()->isNotEmpty()): ?>
      <p class="gleaning-meta"><?= $page->date()->toDate('F j, Y') ?></p>
    <?php endif ?>

    <h1 class="gleaning-title"><?= $page->title()->html() ?></h1>

    <?php if ($page->byline()->isNotEmpty()): ?>
      <p class="gleaning-author"><?= $page->byline()->html() ?></p>
    <?php endif ?>

    <?php if ($page->subtitle()->isNotEmpty()): ?>
      <div class="gleaning-subtitle"><?= $page->subtitle()->kirbytext() ?></div>
    <?php endif ?>

    <?php if ($page->epigraph()->isNotEmpty()): ?>
      <div class="gleaning-epigraph">
        <blockquote><?= $page->epigraph()->kirbytext() ?></blockquote>
        <?php if ($page->epigraphSource()->isNotEmpty()): ?>
          <cite class="gleaning-epigraph-source"><?= $page->epigraphSource()->html() ?></cite>
        <?php endif ?>
      </div>
    <?php endif ?>

    <?php if ($page->body()->isNotEmpty()): ?>
      <div class="gleaning-body"><?= $page->body() ?></div>
    <?php endif ?>

    <?php if ($page->images()->isNotEmpty()): ?>
      <div class="gleaning-images">
        <?php foreach ($page->images() as $image): ?>
          <figure>
            <img src="<?= $image->url() ?>" alt="<?= $image->alt()->html() ?>">
            <?php if ($image->caption()->isNotEmpty()): ?>
              <figcaption><?= $image->caption()->html() ?></figcaption>
            <?php endif ?>
          </figure>
        <?php endforeach ?>
      </div>
    <?php endif ?>

    <?php if ($page->authorNote()->isNotEmpty()): ?>
      <div class="gleaning-bio">
        <?= $page->authorNote()->kirbytext() ?>
      </div>
    <?php endif ?>

  </div>
</main>
<?php snippet('footer') ?>
