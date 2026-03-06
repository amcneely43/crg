<?php

header('Content-Type: application/json; charset=utf-8');

$pageNum = (int)get('page');
if ($pageNum < 1) $pageNum = 1;

// Rebuild the same paginated set, but force the page number from the query string
$limit = 8;
$readings = $page->children()->listed();

$past_readings = $readings->flip()->filter(function($rdg) {
  return (($rdg->date()->toDate() < time()) && !$rdg->current()->bool()) || $rdg->date()->isEmpty();
})->paginate($limit, ['page' => $pageNum]);

$pagination = $past_readings->pagination();

$html = '';
foreach ($past_readings as $rdg) {
  // IMPORTANT: match your snippet location + variable name
  $html .= snippet('templates/past_readings', ['reading' => $rdg], true);
}

echo json_encode([
  'html' => $html,
  'more' => $pagination->hasNextPage()
]);
