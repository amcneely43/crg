<li data-src="<?= $reading-> cover() ? $reading-> cover()-> url() : '' ?>">
    <div class="head-line">
      <h3>
        <?php $reading->show_date()->bool() ? $date = $reading->date()->toDate('F d, Y') : $date = $reading->date() ->toDate('F Y') ?>
        <?= $date?>
        <?php if ($reading->current()->bool()) :?>
          <span class="label subheader">currently reading</span>
        <?php endif ?>
      </h3>
    </div>
    <div class="image">
      <?php if ($meme = $reading->meme()): ?>
        <figure>
          <a href="<?= $reading->url() ?>"><?= $meme ?></a>
        </figure>
      <?php endif ?>
    </div>
    <div class="event-line">
      <div>
        <?php if ($reading->category()->isNotEmpty()) :?>
          <span class="subheader"><?=$reading->category()?></span>
        <?php endif ?>
        <h2> 
          <a href="<?= $reading-> url() ?>"><?= $reading-> fullTitle() ?>,</a>
          <span class="triptych-italick"><?= $reading-> author()?></span>  
        </h2>
      </div>
      <!-- <p class="location">
        On <?= $reading->location()->isNotEmpty() ?  $reading->location()->html() : ''?>, 
        <span class="tint"><?= Html::email(page('doings')->email(), 'Email to Join') ?></span> 
      </p> -->
    </div>
    
</li>
