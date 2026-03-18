<?php snippet('nav') ?>
<main class="mast triptych">
  <?php snippet('weaving_header', ['weaving' => $page->parent(), 'mast' => true]) ?>
  <div class="content"> 
      <h4 class="uppercase">About</h4></br>
      <?= $page -> mission() -> markdown() ?>
      <p class="right">— <?= $page -> editor()?></p>
  </div>
</main>
<?php snippet('aside', ['class' => '', 'image' => '']); snippet('footer'); ?>