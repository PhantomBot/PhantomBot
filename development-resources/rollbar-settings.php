<?php

//require_once('rollbar-log.php');
$rollbar_url = 'https://api.rollbar.com/api/1/item/';
$rollbar_token = ''; //API Token for Rollbar
$client_token = ''; //Access Token for clients to submit to this script
$reverse = false;

$filters = array(
    array(
        'exception' => array(
            'class' => 'java.lang.Exception',
            'message' => 'ChannelOperation terminal stack'
        ),
        'frame' => array(
            'class_name' => 'reactor.netty.channel.ChannelOperations',
            'method' => 'terminate'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.io.IOException',
            'message' => 'An established connection was aborted by the software in your host machine'
        ),
        'frame' => array(
            'class_name' => 'java.base/sun.nio.ch.SocketDispatcher',
            'method' => 'read0'
        )
    ),
    array(
        'exception' => array(
            'class' => 'org.mozilla.javascript.*'
        )
    ),
    array(
        'frame' => array(
            'index' => 4,
            'class_name' => 'org.mozilla.javascript.*'
        )
    ),
    array(
        'frame' => array(
            'class_name' => 'reactor.core.publisher.*'
        )
    )
);

$allowed_environments = array(
    'stable',
    'stable_docker',
    'nightly',
    'nightly_docker',
    'edge'
);

?>