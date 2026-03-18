<!DOCTYPE html>
<html lang="en">

<head>
	<title><?= $site->title()?> | <?= $page->title() ?></title>
	<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="shortcut icon" href="<?= asset('crg.ico')->url() ?>" type="image/x-icon">

  <?php
    $root = kirby()->root('index');
    $cssFiles = ['assets/css/global.css', 'assets/type/typography.css', 'assets/css/mobile.css'];
    foreach ($cssFiles as $file):
      $v = filemtime($root . '/' . $file);
      echo '<link rel="stylesheet" href="' . url($file) . '?v=' . $v . '">' . "\n  ";
    endforeach;
    // @auto per-template stylesheet
    $tpl = $page->template()->name();
    $autoFile = 'assets/css/templates/' . $tpl . '.css';
    if (file_exists($root . '/' . $autoFile)):
      $v = filemtime($root . '/' . $autoFile);
      echo '<link rel="stylesheet" href="' . url($autoFile) . '?v=' . $v . '">' . "\n  ";
    endif;
  ?>
</head>

<body class="grid">
	<nav>
		<div class="dotted">
			<div class="triptych-italick title">
				<a href="<?= $site->url() ?>"><?= $site->title() ?></a>
			</div>
			<div class="m-nav">
				<?php foreach ($site->children()->listed() as $item): ?>
                    <?php if($item == page('words')): ?>
                        <?php /* Words/Map is embedded in Readings — skip from nav */ ?>
                    <?php elseif($item == page('doings')): ?>
                        <div class="triptych uppercase" id='info'><?=$item->title()?></div>
                    <?php else: ?>
                        <div class="triptych uppercase">
              <?php $prefix = $item->slug() === 'reviews' ? '& ' : '' ?>
              <a <?php e($item->isOpen(), 'class="active"') ?> href="<?= $item->url() ?>"><?= $prefix . $item->title()->html() ?></a>
            </div>
                    <?php endif ?>
                <?php endforeach ?>
			</div>

      <div class="m-show">
        <a href="#" id="nav_arrow" aria-label="Toggle navigation">
          <img src="<?= asset('assets/icons/arrow-down.svg')->url() ?>" class="slide-close" alt="">
        </a>
      </div>
		</div>
	</nav>