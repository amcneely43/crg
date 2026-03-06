<?php snippet('nav') ?>
<main>
  <div class="<?= $page ?> triptych">
    <h3 class="header triptych uppercase"><?= $page->title() ?></h3>
    <div class="content">
      <?= $page->about()->kirbytext() ?>
    </div>
    <?php snippet('bookmark_gallery', ['bookmarks' => $page->children()->listed(), 'bookmark' => '']) ?>
  </div>
</main>
<?php snippet('aside', ['class' => '', 'image' => '']); snippet('footer'); ?>