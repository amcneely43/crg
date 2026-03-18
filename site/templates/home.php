<?php snippet('nav') ?>

<?php
// Gather data once
$reading_list       = page('readings');
$readings           = $reading_list ? $reading_list->children()->listed()->filterBy('intendedTemplate', 'reading') : null;
$currently_readings = $reading_list ? $reading_list->currentlyReading() : null;
?>

<?php if ($readings && $readings->count()): ?>
<main class="<?= $page->template() ?> triptych">
  <div>
    <?php snippet('home_intro', [
      'reading_list'       => $reading_list,
      'currently_readings' => $currently_readings
    ]) ?>

    <h1>
      <?php if ($currently_readings && $currently_readings->count()): ?>
        We’re currently discussing
        <?php
          $cCount = $currently_readings->count();
          $cLast  = $currently_readings->last();

          foreach ($currently_readings as $i => $rdg) {
            $frag = snippet('book_title', ['rdg' => $rdg, 'hover' => true], true);
            $frag = preg_replace('/[.,:;]+\s*$/', '', rtrim($frag));
            echo ' ' . $frag;

            if ($rdg !== $cLast) {
              echo ($i < $cCount - 2) ? ', ' : ' and';
            } else {
              echo '.';
            }
          }
        ?>
      <?php else: ?>
        We’re about to read
        <?php
          $next = $reading_list->children()->listed()->last();
          $frag = snippet('book_title', ['rdg' => $next, 'hover' => true], true);
          $frag = preg_replace('/[.,:;]+\s*$/', '', rtrim($frag));
          echo ' ' . $frag . '.';
        ?>
      <?php endif; ?>

      A few things we’ve read in the past are
      <?php
        $selected = $currently_readings
          ? $readings->not($currently_readings)->shuffle()->limit(3)
          : $readings->shuffle()->limit(3);

        $count = $selected->count();
        $index = 0;

        foreach ($selected as $reading) {
          $index++;
          $frag = snippet('book_title', ['rdg' => $reading, 'hover' => true], true);
          $frag = preg_replace('/[.,:;]+\s*$/', '', rtrim($frag));

          if ($index > 1 && $index < $count) {
            echo ', ';
          } elseif ($index === $count && $count > 1) {
            echo ', and ';
          }

          echo $frag;
        }
      ?>.
    </h1>

    <h1>
      <?= $site->meeting_info()->kirbytextInline() ?>
      <?php if ($site->newsletter_email()->isNotEmpty()): ?>
      To learn more, sign up to our <u><a href="mailto:<?= $site->newsletter_email()->value() ?>">newsletter</a></u>.
      <?php endif ?>
    </h1>
  </div>

  <div class="notice">
    <div>
      <h3>
        Support CRG Programming with a
        <a href="<?= $site->find('bookmarks')->url() ?>" class="triptych-italick highlight">Community Bookmark.</a>
      </h3>
    </div>
    <div>
      <h3>Or <a href="<?= page('doings')->donate()->url() ?>" target="_blank">donate now!</a></h3>
    </div>
  </div>
</main>
<?php endif ?>

<?php snippet('aside', ['class' => '', 'image' => $page->image()]) ?>
<?php snippet('footer') ?>
