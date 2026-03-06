<?php

return function ($page, $site) {

  // ── Readings ──────────────────────────────────────────────────────────────
  $limit       = 8;
  $allReadings = $page->children()->listed();

  $past_readings = $allReadings->flip()->filter(function ($rdg) {
    return ($rdg->date()->toDate() < time() && !$rdg->current()->bool())
        || $rdg->date()->isEmpty();
  })->paginate($limit);

  $upcoming_readings = $allReadings->filter(function ($rdg) {
    return $rdg->date()->toDate() > time() || $rdg->current()->bool();
  });

  // ── Terms data (for word map) ─────────────────────────────────────────────
  $wordsPage = page('words');
  $termsData = [];

  if ($wordsPage) {
    foreach ($wordsPage->children()->listed() as $term) {
      $termsData[] = [
        'id'        => $term->slug(),
        'label'     => $term->title()->value(),
        'center'    => $term->center()->toBool(),
        'derived'   => $term->derived()->toBool(),
        'category'  => $term->category()->value(),
        'temporal'  => $term->temporal()->value(),
        'valence'   => (float) ($term->valence()->or(0)->value()),
        'cohesion'  => (float) ($term->cohesion()->or(0)->value()),
        'etymology' => $term->etymology()->value(),
      ];
    }
  }

  // ── Books data (all readings + workshops, for book list) ──────────────────
  $booksData = [];

  foreach ($allReadings->sortBy('date', 'desc') as $rdg) {
    $isWorkshop = $rdg->intendedTemplate()->name() === 'workshop';

    // Collect term slugs connected to this reading
    $termSlugs = [];
    foreach ($rdg->terms()->toPages() as $termPage) {
      $termSlugs[] = $termPage->slug();
    }

    $booksData[] = [
      'id'           => $rdg->slug(),
      'url'          => $rdg->url(),
      'year'         => $rdg->date()->isNotEmpty() ? $rdg->date()->toDate('Y') : '',
      'dateLabel'    => $rdg->date()->isNotEmpty() ? strtoupper($rdg->date()->toDate('F Y')) : '',
      'title'        => $rdg->title()->value(),
      'author'       => $isWorkshop
                          ? $rdg->presenter()->value()
                          : $rdg->author()->value(),
      'terms'        => $termSlugs,
      'note'         => $rdg->note()->value(),
      'blurb'        => $rdg->blurb()->value(),
      'bookstackUrl' => $rdg->bookstackUrl()->value(),
      'type'         => $isWorkshop ? 'workshop' : 'reading',
      'link'         => $rdg->download_reading()->isNotEmpty()
                          ? $rdg->download_reading()->value()
                          : '',
    ];
  }

  return [
    'limit'             => $limit,
    'past_readings'     => $past_readings,
    'pagination'        => $past_readings->pagination(),
    'upcoming_readings' => $upcoming_readings,
    'termsData'         => $termsData,
    'booksData'         => $booksData,
    'workshopIntro'     => $site->workshopIntro()->kirbytext(),
  ];
};
