<aside <?= e(is_string($image), 'class="m-hide"') ?>>
  <div class="dotted">
    <!-- Hover layer: always present -->
    <div class="thumb-image hidden <?= isset($class) ? $class : '' ?>">
      <img src="" alt="">
    </div>

    <!-- If you still want to show a static page image in aside,
         render it *outside* the hover layer: -->
    <?php if (!is_string($image) && $image): ?>
      <div class="aside-static-image" aria-hidden="true">
        <img src="<?= $image->url() ?>" alt="">
      </div>
    <?php endif; ?>
  </div>
</aside>
