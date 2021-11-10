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
 *         'message' => 'You did something wrong' //Note that the message match always ignores case
 *     ),
 *     'frame' => array( //Defines a match against the 'at' lines in the stacktrace
 *         'index' => 2, //Optional parameter that indicates which 'at' line in the stacktrace to run the frame match against. Defaults to 0
 *         'class_name' => 'mypackage.MyClass',
 *         'method' => 'myMethod'
 *     )
 * )
 *
 * Wildcards are supported at the beginning and/or end of all string parameters.
 * Regex is supported if the prefix 'regex:' is used.
 * array(
 *     'exception' => array(
 *         'class' => 'mypackage.exceptionpackage.*', //Matches all sub-packages and classes defined under the package 'mypackage.exceptionpackage'
 *         'message' => '*exception' //Matches all messages that end with 'exception'
 *     ),
 *     'frame' => array(
 *         'class_name' => '*.mypackage.*', //Matches all sub-packages and classes containing '.mypackage.' in the name
           'method' => 'regex:/mymethod[0-9]+/' // Matches all methods that pass the regex 'mymethod[0-9]+'
 *     )
 * )
 */

// Main Filter List
// It is recommended to not touch this and to instead add custom filters near the bottom near the "Custom Filters" comment
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
            'class' => 'discord4j.rest.http.client.ClientException',
            'message' => 'regex:/401(.*)Unauthorized/'
        )
    ),
    array(
        'exception' => array(
            'message' => '*setAutoCommit*'
        )
    ),
    array(
        'exception' => array(
            'message' => 'regex:/path to(.*)phantombot.db(.*)not exist/'
        )
    ),
    array(
        'exception' => array(
            'message' => '*attempt to write a readonly database*'
        )
    ),
    array(
        'exception' => array(
            'message' => 'regex:/SQLITE_(BUSY|CORRUPT|READONLY|CONSTRAINT|CANTOPEN|PROTOCOL)/'
        )
    ),
    array(
        'exception' => array(
            'message' => 'opening db*'
        )
    ),
    array(
        'exception' => array(
            'message' => 'regex:/sql(.*)unrecognized token(.*)/'
        )
    ),
    array(
        'exception' => array(
            'message' => 'regex:/sql(.*)no such table(.*)/'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.io.FileNotFoundException',
            'message' => './logs*'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.io.FileNotFoundException',
            'message' => './config*'
        )
    ),
    array(
        'exception' => array(
            'message' => 'regex:/java.io.FileNotFoundException(.*)\/\/addons/'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.io.FileNotFoundException',
            'message' => 'regex:/..web.panel.img/'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.nio.file.NoSuchFileException',
            'message' => 'regex:/..web.panel.js.utils.gamesList.txt/'
        )
    ),
    array(
        'exception' => array(
            'message' => '*Connection reset by peer'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.lang.OutOfMemoryError'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.net.UnknownHostException'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.net.SocketTimeoutException'
        )
    ),
    array(
        'exception' => array(
            'message' => '*Connection pool has been disposed*'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.net.ConnectException',
            'message' => 'Connection refused*'
        )
    )
);

//Custom Filters
array_push($filters,
    array(
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
