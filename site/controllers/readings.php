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
        'doxa'      => $term->doxa()->toBool(),
        'category'  => $term->category()->value(),
        'temporal'  => $term->temporal()->value(),
        'valence'   => (float) ($term->valence()->or(0)->value()),
        'cohesion'  => (float) ($term->cohesion()->or(0)->value()),
        'core'      => $term->core()->value() ?: 'filled',
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

    $flyerFile  = $isWorkshop ? null : $rdg->images()->filterBy('template', 'flyer')->first();
    $coverFile  = $isWorkshop ? $rdg->images()->filterBy('template', 'cover')->first() : null;

    $links = [];
    foreach ($rdg->links()->toStructure() as $lnk) {
      $links[] = [
        'description' => $lnk->description()->value(),
        'url'         => $lnk->url()->value(),
      ];
    }

    $interlocutors = [];
    foreach ($rdg->interlocutors()->toStructure() as $intl) {
      $interlocutors[] = [
        'name' => $intl->name()->value(),
        'url'  => $intl->stanford_url()->value(),
      ];
    }

    $booksData[] = [
      'id'           => $rdg->slug(),
      'url'          => $rdg->url(),
      'year'         => $rdg->date()->isNotEmpty() ? $rdg->date()->toDate('Y') : '',
      'dateLabel'    => $rdg->date()->isNotEmpty() ? strtoupper($rdg->date()->toDate('F Y')) : '',
      'title'        => $rdg->title()->value(),
      'subtitle'     => $rdg->subtitle()->value(),
      'author'       => $rdg->author()->value(),
      'contributor'  => $isWorkshop ? $rdg->contributor()->value() : '',
      'location'     => $isWorkshop ? $rdg->location()->value() : '',
      'customTime'   => $isWorkshop ? $rdg->custom_time()->value() : '',
      'terms'        => $termSlugs,
      'note'         => (string) $rdg->note()->kirbytext(),
      'blurb'        => (string) $rdg->blurb()->kirbytext(),
      'nominatedBy'  => $rdg->nominatedBy()->value(),
      'coverUrl'     => $coverFile ? $coverFile->url() : '',
      'flyerUrl'     => $flyerFile ? $flyerFile->url() : '',
      'flyerBy'      => $rdg->flyerBy()->value(),
      'bookstackUrl' => $rdg->bookstackUrl()->value(),
      'type'         => $isWorkshop ? 'workshop' : 'reading',
      'link'         => $rdg->download_reading()->isNotEmpty()
                          ? $rdg->download_reading()->value()
                          : '',
      'links'        => $links,
      'interlocutors' => $interlocutors,
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
