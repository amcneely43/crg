<?php

return [
  'panel' =>[
    'install' => true
  ],
  'debug'       => true,
  'smartypants' => true,
  'routes' => [
    [
      'pattern' => 'conceptnet-proxy',
      'action'  => function () {
        $term = trim(get('term', ''));

        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');

        if (!$term || !preg_match('/^[a-zA-Z0-9\- ]+$/', $term)) {
          http_response_code(400);
          die(json_encode(['error' => 'Invalid term']));
        }

        if (!function_exists('curl_init')) {
          http_response_code(500);
          die(json_encode(['error' => 'curl not available']));
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
          http_response_code(502);
          die(json_encode(['error' => 'Could not reach ConceptNet', 'detail' => $error]));
        }

        http_response_code($status ?: 502);
        die($body);
      }
    ]
  ],
];
