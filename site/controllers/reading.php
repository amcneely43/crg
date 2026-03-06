<?php

return function ($page) {

  // All sibling readings + workshops, newest first — for the persistent sidebar
  $allSiblings = $page->parent()->children()->listed()->sortBy('date', 'desc');

  return [
    'allSiblings' => $allSiblings,
  ];
};
