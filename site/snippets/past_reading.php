<li data-src="<?= $reading-> cover() ? $reading-> cover()-> url() : '' ?>">
  <div>
    <time><?= $reading->date()->toDate('F Y') ?></time>
  </div>
  <div class="event-line">
    <div class="event-line">
      <div>
        <a href="<?=$reading-> url()?>"><?= $reading-> title() ?></a>
        ⟶ <?=$reading-> author()?>
      </div>
    </div>
    <div class="image">
      <?php if ($image = $reading->meme()): ?>
        <figure>
          <a href="<?= $reading->url() ?>"><?= $reading->meme() ?></a>
        </figure>
      <?php endif ?>
    </div>
</li>