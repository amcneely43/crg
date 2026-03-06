<?php
// Build the TERMS array from Kirby content (words/term children)
$terms = [];
foreach (page('words')->children()->listed() as $term) {
  $terms[] = [
    'id'        => $term->slug(),
    'label'     => $term->title()->value(),
    'category'  => $term->category()->value() ?: 'social',
    'temporal'  => $term->temporal()->value() ?: 'neutral',
    'center'    => $term->center()->toBool(),
    'derived'   => $term->derived()->toBool(),
    'valence'   => is_numeric($term->valence()->value()) ? (float) $term->valence()->value() : 0,
    'cohesion'  => is_numeric($term->cohesion()->value()) ? (float) $term->cohesion()->value() : 0,
    'etymology' => $term->etymology()->value() ?: '',
  ];
}
$termsJson = json_encode($terms, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>
<?php snippet('nav') ?>
<main class="words triptych">
  <div class="words-map-wrap">
    <div class="words-map-label">Community Semantic Network — Version 1.0</div>
    <div class="map-wrap">
      <svg id="wordMap"></svg>
      <div id="mapTooltip"></div>
    </div>
  </div>
</main>
<?php snippet('footer') ?>

<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
<script>
  const TERMS = <?= $termsJson ?>;
</script>
<?php echo js('assets/js/words.js') ?>
