<?php

require_once('rollbar-settings.php');

$headers = apache_request_headers();

function contains($haystack, $needle) {
    if(strpos($needle, 'regex:') === 0) {
        return preg_match(substr($needle, 6), $haystack) === 1;
    } else if (strpos($needle, '*') === 0 || strrpos($needle, '*') === strlen($needle) - 1){
        if (strpos($needle, '*') === 0) {
            $needle = substr($needle, 1);

            if (strrpos($needle, '*') === strlen($needle) - 1) {
                $needle = substr($needle, 0, -1);
                return strpos($haystack, $needle) !== false;
            } else {
                return substr($haystack, -strlen($needle)) === $needle;
            }
        } else {
            $needle = substr($needle, 0, -1);
            return substr($haystack, 0, strlen($needle)) === $needle;
        }
    } else {
        return $haystack === $needle;
    }
}

function str_includes_array_value($needle, $haystack) {
    foreach ($haystack as $v) {
        if (strpos($needle, $v) !== false) {
            return true;
        }
    }
    
    return false;
}

function dofilter($data) {
    return filter_var($data, FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH | FILTER_FLAG_STRIP_BACKTICK);
}

function doexit($code, $message, $filternm) {
    http_response_code($code);
    echo json_encode(array('err' => 1, 'message' => $message));
    apache_note('RBResp', $filternm);
    exit();
}

if (!array_key_exists('x-rollbar-access-token', $headers) || dofilter($headers['x-rollbar-access-token']) != $client_token) {
    doexit(403, 'access denied', 'token');
}

$data = file_get_contents('php://input');
$item = json_decode($data, true);

if (!array_key_exists('trace', $item['data']['body']) && !array_key_exists('trace_chain', $item['data']['body'])) {
    doexit(409, 'only trace,trace_chain accepted', 'not_trace');
}

if (!in_array($item['data']['environment'], $allowed_environments)) {
    doexit(409, 'environment not allowed', 'env');
}

if (file_exists('rollbar-allowed-versions.json')) {
    $allowed_versions = json_decode(file_get_contents('rollbar-allowed-versions.json'), true);
    if (!in_array($item['data']['code_version'], $allowed_versions[$item['data']['environment']])) {
        doexit(409, 'version not allowed', 'ver');
    }
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

foreach ($filters as $i => $filter) {
    $checked = false;
    if (array_key_exists('exception', $filter)) {
        if (array_key_exists('class', $filter['exception'])) {
            $checked = true;
            if (!contains($trace['exception']['class'], $filter['exception']['class'])) {
                continue;
            }
        }

        if (array_key_exists('message', $filter['exception'])) {
            $checked = true;
            if (!contains(strtolower($trace['exception']['message']), strtolower($filter['exception']['message']))) {
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
                if (!contains($trace['frames'][$frameno]['class_name'], $filter['frame']['class_name'])) {
                    continue;
                }
            }

            if (array_key_exists('method', $filter['frame'])) {
                $checked = true;
                if (!contains($trace['frames'][$frameno]['method'], $filter['frame']['method'])) {
                    continue;
                }
            }
        }
    }

    if (!$checked) {
        continue;
    }

    doexit(409, 'filtered', 'filter_' . $i);
}

$ctx = hash_init('sha1');

hash_update($ctx, $item['data']['code_version']);
hash_update($ctx, $item['data']['environment']);
hash_update($ctx, $item['data']['level']);
if (array_key_exists('title', $item['data'])) {
    hash_update($ctx, $item['data']['title']);
}

if (array_key_exists('trace_chain', $item['data']['body'])) {
    foreach($item['data']['body']['trace_chain'] as $v) {
        hash_update($ctx, $v['exception']['class']);
        hash_update($ctx, $v['exception']['description']);
        hash_update($ctx, $v['exception']['message']);

        $last = -1;
        foreach($v['frames'] as $k => $f) {
            if (str_includes_array_value($f['class_name'], $packages)) {
                $last = $k;
            } else {
                foreach ($files as $file) {
                    if (contains($f['filename'], $file)) {
                        $last = $k;
                    }
                }
            }
        }
        
        if ($last >= 0) {
            hash_update($ctx, $v['frames'][$last]['class_name']);
            hash_update($ctx, $v['frames'][$last]['filename']);
            hash_update($ctx, $v['frames'][$last]['lineno']);
            hash_update($ctx, $v['frames'][$last]['method']);
        }
    }
} else {
    hash_update($ctx, $item['data']['body']['trace']['exception']['class']);
    hash_update($ctx, $item['data']['body']['trace']['exception']['description']);
    hash_update($ctx, $item['data']['body']['trace']['exception']['message']);

    $last = -1;
    foreach($item['data']['body']['trace']['frames'] as $k => $f) {
        if (str_includes_array_value($f['class_name'], $packages)) {
            $last = $k;
        } else {
            foreach ($files as $file) {
                if (contains($f['filename'], $file)) {
                    $last = $k;
                }
            }
        }
    }
        
    if ($last >= 0) {
        hash_update($ctx, $item['data']['body']['trace']['frames'][$last]['class_name']);
        hash_update($ctx, $item['data']['body']['trace']['frames'][$last]['filename']);
        hash_update($ctx, $item['data']['body']['trace']['frames'][$last]['lineno']);
        hash_update($ctx, $item['data']['body']['trace']['frames'][$last]['method']);
    }
}

$item['access_token'] = $rollbar_token;
$item['data']['fingerprint'] = hash_final($ctx);

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
apache_note('RBResp', 'rb');

curl_close($c);
?>
