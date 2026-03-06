<?php

return function ($page) {

  // Number of items per page
  $limit = 8;

  // Build the same past_readings collection as the HTML controller
  $past_readings = $page->children()
    ->listed()
    ->flip()
    ->filter(function($rdg) {
      return (
        ($rdg->date()->toDate() < time() && !$rdg->current()->bool()) ||
        $rdg->date()->isEmpty()
      );
    })
    ->paginate($limit);

  // Pagination object
  $pagination = $past_readings->pagination();

  // Whether there is a next page for AJAX load-more
  $more = $pagination->hasNextPage();

  // Controller returns ONLY the variables the JSON template uses
  return [
    'past_readings' => $past_readings,
    'more'          => $more,
  ];
};
