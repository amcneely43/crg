<footer class="info triptych dotted">
<?php
// Load the Doings page (info overlay content)
$info = page('doings');
?>

<?php if ($info): ?>
  <section class="menu">
    <a href="#" id="item_first"  class="menu-item active"><h4>Mission</h4></a>
    <a href="#" id="item_second" class="menu-item"><h4>History</h4></a>
    <a href="#" id="item_third"  class="menu-item"><h4>Sponsor</h4></a>
    <a href="#" id="item_fourth" class="menu-item"><h4>Follow Us</h4></a>
    <a href="#" id="item_fifth"  class="menu-item"><h4>Governance</h4></a>
    <a href="#" id="item_sixth"  class="menu-item last"><h4>How It Works</h4></a>

    <a href="#" id="slide_close" class="info-close">Close ↓</a>
  </section>

  <section class="content">

    <?php if ($info->mission()->isNotEmpty()): ?>
      <div id="first">
        <h3>Mission</h3>
        <?= $info->mission()->kirbytext() ?>
      </div>
    <?php endif; ?>

    <?php if ($info->history()->isNotEmpty()): ?>
      <div id="second">
        <h3>History</h3>
        <?= $info->history()->kirbytext() ?>
        <?php if ($info->author()->isNotEmpty()): ?>
          <p class="right">– <?= $info->author()->html() ?></p>
        <?php endif; ?>
      </div>
    <?php endif; ?>

    <?php
    $partners = $info->partners()->isNotEmpty() ? $info->partners()->toStructure() : null;
    ?>
    <div id="third">
      <h3>Sponsor</h3>
      <?php if ($partners): ?>
        <?php foreach ($partners as $partner): ?>
          <div class="table">
            <p>
              <?php if ($partner->url()->isNotEmpty()): ?>
                <a href="<?= $partner->url() ?>" target="_blank" rel="noopener"><?= $partner->name() ?></a> ⟶
              <?php else: ?>
                <?= $partner->name() ?> ⟶
              <?php endif; ?>
            </p>
            <p>
              <?= $partner->description() ?>
              <?php if ($info->donate()->isNotEmpty()): ?>
                Donate <strong><a href="<?= $info->donate()->url() ?>" target="_blank" rel="noopener">here</a></strong> to contribute.
              <?php endif; ?>
            </p>
          </div>
        <?php endforeach; ?>
      <?php endif; ?>
    </div>

    <div id="fourth">
      <h3>Follow Us</h3>

      <?php if ($info->email()->isNotEmpty()): ?>
        <div class="table">
          <p>Join the group ⟶</p>
          <p><?= Html::email($info->email()) ?></p>
        </div>
      <?php endif; ?>

      <?php if ($info->location()->isNotEmpty()): ?>
        <div class="table">
          <p>Headquarters ⟶</p>
          <div><?= $info->location() ?></div>
        </div>
      <?php endif; ?>

      <?php
      $links = $info->links()->isNotEmpty() ? $info->links()->toStructure() : null;
      if ($links): ?>
        <?php foreach ($links as $link): ?>
          <div class="table">
            <p><?= $link->name() ?> ⟶</p>
            <p>
              <?php if ($link->url()->isNotEmpty()): ?>
                <a href="<?= $link->url() ?>" target="_blank" rel="noopener"><?= $link->alias()->isNotEmpty() ? $link->alias() : $link->name() ?></a>
              <?php else: ?>
                <?= $link->alias()->isNotEmpty() ? $link->alias() : $link->name() ?>
              <?php endif; ?>
            </p>
          </div>
        <?php endforeach; ?>
      <?php endif; ?>

      <div class="table">
        <p>Discord ⟶</p>
        <p><em>Available to members.</em> To inquire about joining, write to the email above.</p>
      </div>
    </div>

    <?php if ($info->governance()->isNotEmpty() || $info->people()->isNotEmpty() || $info->steward()->isNotEmpty()): ?>
      <div id="fifth">
        <h3>Governance</h3>

        <?php if ($info->governance()->isNotEmpty()): ?>
          <?= $info->governance()->kirbytext() ?>
        <?php endif; ?>

        <?php
        $stewards = $info->steward()->isNotEmpty() ? $info->steward()->toStructure() : null;
        if ($stewards): ?>
          <h3>Current Stewards</h3>
          <p>
          <?php foreach ($stewards as $steward): ?>
            <?php if ($steward->url()->isNotEmpty()): ?>
              <a href="<?= $steward->url() ?>" target="_blank" rel="noopener"><?= $steward->name() ?></a>
            <?php else: ?>
              <?= $steward->name() ?>
            <?php endif; ?>
            <?= $steward->group() ?><?= $steward->isLast() ? '' : '<br>' ?>
          <?php endforeach; ?>
          </p>
        <?php endif; ?>

        <?php
        $people = $info->people()->isNotEmpty() ? $info->people()->toStructure() : null;
        if ($people): ?>
          <h3>Past Stewards</h3>
          <p>
          <?php foreach ($people as $person): ?>
            <?php if ($person->url()->isNotEmpty()): ?>
              <a href="<?= $person->url() ?>" target="_blank" rel="noopener"><?= $person->name() ?></a><?= $person->isLast() ? '' : ',' ?>
            <?php else: ?>
              <?= $person->name() ?><?= $person->isLast() ? '' : ',' ?>
            <?php endif; ?>
          <?php endforeach; ?>
          </p>
        <?php endif; ?>

        <h3>Credits</h3>
        <p>Website design and build &nbsp;⟶&nbsp; <a href="https://joy-jade.com" target="_blank" rel="noopener">JJ</a></p>
      </div>
    <?php endif; ?>

    <?php if ($info->faq()->isNotEmpty()): ?>
      <div id="sixth">
        <h3>How It Works</h3>
        <?= $info->faq()->kirbytext() ?>
        <div style="height: 38vh;"></div>
      </div>
    <?php endif; ?>

  </section>
<?php endif; ?>
</footer>

<?= js(['assets/js/global.js', '@auto'], ['defer' => true]) ?>
</body>
</html>
