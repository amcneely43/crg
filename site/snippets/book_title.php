<?php
/** @var \Kirby\Cms\Page $rdg */
/** @var bool|null $hover */

$hoverEnabled = ($hover ?? true) === true;

/**
 * book_title.php
 * Render a reading title (and optional author).
 * If hoverEnabled=true, computes a cover URL and outputs data-src for hover reveal.
 */

$coverUrl = null;

if ($hoverEnabled) {
  /**
   * Resolve a source file for the hover cover image.
   * Priority:
   *   a) First image with template "cover"
   *   b) Literal file named cover.* (jpg/jpeg/png/webp)
   *   c) First non-meme image (template != meme, and filename not meme-like)
   */
  $coverFile = null;

  // a) Preferred: image with template "cover"
  $coverFile = $rdg->images()->filterBy('template', 'cover')->first();

  // b) Fallback: literal cover.* image
  if (!$coverFile) {
    foreach (['jpg','jpeg','png','webp','JPG','JPEG','PNG','WEBP'] as $ext) {
      if ($file = $rdg->file('cover.' . $ext)) {
        $coverFile = $file;
        break;
      }
    }
  }

  // c) Fallback: first non-meme image
  if (!$coverFile) {
    $coverFile = $rdg->images()
      ->filter(function ($img) {
        $tpl  = (string)$img->template();
        $name = strtolower($img->filename());

        if ($tpl === 'meme') return false;
        if (str_contains($name, 'meme')) return false;

        return true;
      })
      ->sortBy('sort', 'asc')
      ->first();
  }

  /**
   * Build cover URL
   * Prefer thumbs; otherwise copy original into /assets/covers
   */
  if ($coverFile) {
    $thumb = $coverFile->resize(600);

    if ($thumb && $thumb->exists()) {
      $coverUrl = $thumb->url();
    } else {
      $uid = $rdg->uid();
      $ext = strtolower($coverFile->extension() ?: 'jpg');
      if ($ext === 'jpeg') $ext = 'jpg';

      $relDir  = 'assets/covers';
      $relPath = $relDir . '/' . $uid . '.' . $ext;
      $absDir  = kirby()->root('index') . '/' . $relDir;
      $absPath = kirby()->root('index') . '/' . $relPath;

      if (!is_dir($absDir)) {
        @mkdir($absDir, 0777, true);
      }

      if (!is_file($absPath)) {
        try {
          $bytes = $coverFile->read();
          if ($bytes !== null && $bytes !== false) {
            @file_put_contents($absPath, $bytes);
          }
        } catch (Throwable $e) {
          // ignore
        }
      }

      if (is_file($absPath)) {
        $coverUrl = url('/' . $relPath);
      }
    }
  }
}

// Render
$titleHtml = $rdg->title()->link();
$author    = rtrim(trim((string)$rdg->author()->value()), " .,:;");
?>

<span class="triptych-italick book-title highlight"
  <?php if ($hoverEnabled && $coverUrl): ?>data-src="<?= $coverUrl ?>"<?php endif; ?>>
  <?= $titleHtml ?>
</span>

<?php if ($author !== ''): ?>
  <span class="book-author"> by <?= esc($author) ?></span>
<?php endif; ?>
