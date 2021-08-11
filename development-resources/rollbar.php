<?php

require_once('rollbar-settings.php');

$headers = apache_request_headers();

function dofilter($data) {
    return filter_var($data, FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH | FILTER_FLAG_STRIP_BACKTICK);
}

function doexit($code, $message) {
    http_response_code($code);
    echo json_encode(array('err' => 1, 'message' => $message));
    exit();
}

if (!array_key_exists('x-rollbar-access-token', $headers) || dofilter($headers['x-rollbar-access-token']) != $client_token) {
    doexit(403, 'access denied');
}

$data = file_get_contents('php://input');
$item = json_decode($data, true);

if (!array_key_exists('trace', $item['data']['body']) && !array_key_exists('trace_chain', $item['data']['body'])) {
    doexit(409, 'only trace,trace_chain accepted');
}

if (!in_array($item['data']['environment'], $allowed_environments)) {
    doexit(409, 'environment not allowed');
}

if (array_key_exists('trace_chain', $item['data']['body'])) {
    if ($reverse) {
        $item['data']['body']['trace_chain'] = array_reverse($item['data']['body']['trace_chain']);
    }

    $trace = $item['data']['body']['trace_chain'][0];
} else {
    $trace = $item['data']['body']['trace'];
}

$lastframe = count($trace['frames']) - 1;

foreach ($filters as $filter) {
    $checked = false;
    if (array_key_exists('exception', $filter)) {
        if (array_key_exists('class', $filter['exception'])) {
            $checked = true;
            $tec = $trace['exception']['class'];
            $ec = $filter['exception']['class'];

            if (substr($ec, -2) == '.*') {
                $ec = substr($ec, 0, -2);
                $tec = substr($tec, 0, strlen($ec));
            }

            if ($tec != $ec) {
                continue;
            }
        }

        if (array_key_exists('message', $filter['exception'])) {
            $checked = true;
            $tem = strtolower($trace['exception']['message']);
            $em = strtolower($filter['exception']['message']);

            if (substr($em, -2) == '.*') {
                $em = substr($em, 0, -2);
                $tem = substr($tem, 0, strlen($em));
            }

            if ($tem != $em) {
                continue;
            }
        }
    }

    if (array_key_exists('frame', $filter)) {
        $frameno = $lastframe;

        if (array_key_exists('index', $filter['frame'])) {
            $frameno -= $filter['frame']['index'];
        }

        if ($frameno < 0) {
            if (array_key_exists('class_name', $filter['frame'])) {
                $checked = true;
                $tcn = $trace['frame'][$frameno]['class_name'];
                $cn = $filter['frame']['class_name'];

                if (substr($cn, -2) == '.*') {
                    $cn = substr($cn, 0, -2);
                    $tcn = substr($tcn, 0, strlen($cn));
                }

                if ($tcn != $cn) {
                    continue;
                }
            }

            if (array_key_exists('method', $filter['frame'])) {
                $checked = true;
                if ($trace['frame'][$frameno]['method'] != $filter['frame']['method']) {
                    continue;
                }
            }
        }
    }

    if (!$checked) {
        continue;
    }

    doexit(409, 'filtered');
}

$item['access_token'] = $rollbar_token;

$c = curl_init();

curl_setopt($c, CURLOPT_URL, $rollbar_url);
curl_setopt($c, CURLOPT_POST, true);
curl_setopt($c, CURLOPT_POSTFIELDS, json_encode($item));
curl_setopt($c, CURLOPT_HTTPHEADER, array('Content-Type: application/json; charset=UTF-8', 'Accept: application/json', 'Accept-Charset: UTF-8', 'X-Rollbar-Access-Token: ' . $rollbar_token));
curl_setopt($c, CURLOPT_USERAGENT, $headers['User-Agent']);
curl_setopt($c, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($c);

http_response_code(curl_getinfo($c, CURLINFO_RESPONSE_CODE));
echo $response;

curl_close($c);
?>