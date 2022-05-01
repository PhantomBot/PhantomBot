<?php

$token = ''; // Authorization token for this endpoint
$maxver = array();
$maxver['stable'] = 1; // Maximum number of stable versions
$maxver['stable_docker'] = 1; // Maximum number of stable docker versions
$maxver['nightly_build'] = 2; // Maximum number of nightly verisons
$maxver['nightly_build_docker'] = 2; // Maximum number of nightly docker verisons


$headers = apache_request_headers();

function dofilter($data) {
    return filter_var($data, FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH | FILTER_FLAG_STRIP_BACKTICK);
}

function doexit($code, $message, $filternm) {
    http_response_code($code);
    echo json_encode(array('err' => 1, 'message' => $message));
    apache_note('RBResp', $filternm);
    exit();
}

if (!array_key_exists('x-access-token', $headers) || dofilter($headers['x-access-token']) != $token) {
    doexit(403, 'access denied', 'token');
}

$data = file_get_contents('php://input');
$item = json_decode($data, true);

if (file_exists('rollbar-allowed-versions.json')) {
    $allowed_versions = json_decode(file_get_contents('rollbar-allowed-versions.json'), true);
} else {
    $allowed_versions = array();
}

foreach($maxver as $k => $v) {
    if (!array_key_exists($k, $allowed_versions)) {
        $allowed_versions[$k] = array();
    }
}

if (!array_key_exists($item['type'], $allowed_versions)) {
    doexit(400, 'environment not allowed', 'env');
}

if (strlen($item['version']) > 0 && !in_array($item['version'], $allowed_versions[$item['type']])) {
    array_push($allowed_versions[$item['type']], $item['version']);
    while (count($allowed_versions[$item['type']]) > $maxver[$item['type']]) {
        array_shift($allowed_versions[$item['type']]);
    }
}

file_put_contents('rollbar-allowed-versions.json', json_encode($allowed_versions));
apache_note('RBResp', 'save');

?>