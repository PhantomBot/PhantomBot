<?php

//require_once('rollbar-log.php');
$rollbar_url = 'https://api.rollbar.com/api/1/item/';
$rollbar_token = ''; //API Token for Rollbar
$client_token = ''; //Access Token for clients to submit to this script
$reverse = false;

/*
 * Filter format
 * All parts are optional but at least one must be defined
 * Only 1 exception and frame may be defined per filter
 * All parts provided in a filter definition must match for the filter to trigger
 *
 * array(
 *     'exception' => array( //Defines a match against the actual exception thrown and/or it's message
 *         'class' => 'java.lang.Exception',
 *         'message' => 'You did something wrong'
 *     ),
 *     'frame' => array( //Defines a match against the 'at' lines in the stacktrace
 *         'index' => 2, //Optional parameter that indicates which 'at' line in the stacktrace to run the frame match against. Defaults to 0
 *         'class_name' => 'mypackage.MyClass',
 *         'method' => 'myMethod'
 *     )
 * )
 *
 * Wildcards are supported at the end of exception.class, exception.message, and frame.class_name
 * array(
 *     'exception' => array(
 *         'class' => 'mypackage.exceptionpackage.*' //Matches all sub-packages and classes defined under the package 'mypackage.exceptionpackage'
 *         'message' => 'This is a.*' //Matches all messages that start with 'This is a'
 *     ),
 *     'frame' => array(
 *         'class_name' => 'mypackage.*' //Matches all sub-packages and classes defined under the package 'mypackage'
 *     )
 * )
 */

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
        'frame' => array(
            'class_name' => 'reactor.core.publisher.*'
        )
    ),
    array(
        'exception' => array(
            'class' => 'discord4j.common.close.CloseException'
        )
    ),
    array(
        'exception' => array(
            'message' => '[SQLITE_BUSY].*'
        )
    ),
    array(
        'exception' => array(
            'message' => '[SQLITE_CORRUPT].*'
        )
    ),
    array(
        'exception' => array(
            'message' => '[SQLITE_READONLY].*'
        )
    ),
    array(
        'exception' => array(
            'message' => '[SQLITE_CONSTRAINT].*'
        )
    ),
    array(
        'exception' => array(
            'message' => 'opening db.*'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.io.FileNotFoundException',
            'message' => './logs.*'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.io.FileNotFoundException',
            'message' => './config.*'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.nio.file.NoSuchFileException',
            'message' => './web/panel/js/utils/gamesList.txt'
        )
    ),
    array(
        'exception' => array(
            'message' => 'Connection reset by peer'
        )
    ),
    array(
        'exception' => array(
            'message' => 'java.io.IOException: Connection reset by peer'
        )
    )
);

$allowed_environments = array(
    'stable',
    'stable_docker',
    'nightly_build',
    'nightly_build_docker',
    'edge_build'
);

?>