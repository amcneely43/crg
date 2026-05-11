<?php

return [
  'panel' =>[
    'install' => true
  ],
  'debug'       => true,
  'smartypants' => true,
  'routes' => [
    [
      'pattern' => 'api/concepts',
      'action'  => function () {
        $term = trim(get('term', ''));

        if (!$term || !preg_match('/^[a-zA-Z0-9\- ]+$/', $term)) {
          return new \Kirby\Http\Response(
            json_encode(['error' => 'Invalid term']), 'application/json', 400
          );
        }

        if (!function_exists('curl_init')) {
          return new \Kirby\Http\Response(
            json_encode(['error' => 'curl not available']), 'application/json', 500
          );
        }

        $url = 'https://api.conceptnet.io/c/en/' . urlencode(strtolower($term));
        $ch  = curl_init($url);
        curl_setopt_array($ch, [
          CURLOPT_RETURNTRANSFER => true,
          CURLOPT_TIMEOUT        => 8,
          CURLOPT_HTTPHEADER     => ['Accept: application/json'],
          CURLOPT_FOLLOWLOCATION => true,
          CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $body   = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error  = curl_error($ch);
        curl_close($ch);

        if ($body === false || $error) {
          return new \Kirby\Http\Response(
            json_encode(['error' => 'Could not reach ConceptNet', 'detail' => $error]),
            'application/json', 502
          );
        }

        return new \Kirby\Http\Response($body, 'application/json', $status ?: 502);
      }
    ]
  ],
];
