<?php
/**
 * ConceptNet proxy — routes browser requests through the server to avoid CORS.
 * Usage: /conceptnet-proxy.php?term=freedom
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$term = isset($_GET['term']) ? trim($_GET['term']) : '';

if (!$term || !preg_match('/^[a-zA-Z0-9\- ]+$/', $term)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid term']);
    exit;
}

$url = 'https://api.conceptnet.io/c/en/' . urlencode(strtolower($term));

$ctx = stream_context_create([
    'http' => [
        'timeout'        => 8,
        'ignore_errors'  => true,
        'header'         => "Accept: application/json\r\n",
    ]
]);

$body = @file_get_contents($url, false, $ctx);

if ($body === false) {
    http_response_code(502);
    echo json_encode(['error' => 'Could not reach ConceptNet']);
    exit;
}

// Pass through ConceptNet's status code
$status = 200;
foreach ($http_response_header as $h) {
    if (preg_match('/^HTTP\/\d\.\d (\d{3})/', $h, $m)) {
        $status = (int) $m[1];
    }
}

http_response_code($status);
echo $body;
