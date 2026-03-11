<?php snippet('nav') ?>

<?php $backurl = $page->parent()->url() ?>
<main>
  <div class="bookmark triptych">
    <h3 class="header triptych uppercase">
      <a href="<?= $backurl ?>">
        <?= $page->parent()->title()->html() ?>
      </a>
      <div class="back-button dotted m-hide">
        <h6><a href="<?= $backurl ?>">⟵ Back </a></h6>
      </div>
    </h3>
    <?php snippet('bookmark_gallery', ['bookmarks' => $page->siblings()->listed(), 'bookmark' => $page]) ?>
    <div class="content flex">
      <div class="w25">
        <h1>$<?= $page->price() ?></h1>
        <h4 class="uppercase">Minimum Donation</h4>
      </div>
      <div class="w75">
        <h1>&nbsp;</h1>
        <?= $page->description()->kirbytext() ?>
        <?php if ($page->soldout()->bool()): ?>
          <p class="label subheader">Sold Out</p>
        <?php else: ?>
          <ul class="pay">
            <?php foreach ($page->payment()->toStructure() as $payment): ?>
              <li class="flex">
                <span><?= $payment->method()->html() ?></span>
                <span>
                  <a href="<?= $payment->url() ? $payment->url() : '#' ?>">
                    <?= $payment->handle()->html() ?>
                  </a>
                </span>
              </li>
            <?php endforeach ?>
          </ul>
          <?= $page->footnotes()->kirbytext() ?>
        <?php endif ?>

      </div>
    </div>
    <div class="content bio flex">
      <div class="w25"></div>
      <div class="w75">
        <h4 class="uppercase">About the Artist</h4>
        <br>
        <?= $page->bio()->kirbytext() ?>
      </div>
    </div>
  </div>
</main>
<?php snippet('aside', ['class' => '', 'image' => '']); snippet('footer'); ?>
