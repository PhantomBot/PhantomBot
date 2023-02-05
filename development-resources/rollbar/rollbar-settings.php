<?php

//require_once('rollbar-log.php');
$rollbar_url = 'https://api.rollbar.com/api/1/item/'; //URL to POST reprots to if they pass filtering
$rollbar_token = ''; //API Token for Rollbar
$client_token = ''; //Access Token for clients to submit to this script
$reverse = false; //If true, the stack trace order is reversed before filtering and submitting

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
            'message' => 'regex:/(400 Bad Request|401 Unauthorized|403 Forbidden|404 Not Found)/'
        )
    ),
    array(
        'exception' => array(
            'class' => 'com.mysql.jdbc.exceptions.jdbc4.MySQLQueryInterruptedException'
        )
    ),
    array(
        'exception' => array(
            'class' => 'com.mysql.jdbc.exceptions.jdbc4.MySQLNonTransientConnectionException'
        )
    ),
    array(
        'exception' => array(
            'message' => '*Timeout while waiting for a free database connection*'
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
            'message' => 'regex:/SQLITE_(BUSY|CORRUPT|READONLY|CONSTRAINT|CANTOPEN|PROTOCOL|IOERR|NOTADB)/'
        )
    ),
    array(
        'exception' => array(
            'message' => '*Incorrect string value: \'\\xF0*'
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
            'class' => 'java.io.FileNotFoundException'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.nio.file.NoSuchFileException'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.nio.file.InvalidPathException'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.nio.file.AccessDeniedException'
        )
    ),
    array(
        'exception' => array(
            'message' => '*java.io.FileNotFoundException*'
        )
    ),
    array(
        'exception' => array(
            'message' => '*java.nio.file.NoSuchFileException*'
        )
    ),
    array(
        'exception' => array(
            'message' => '*java.nio.file.InvalidPathException*'
        )
    ),
    array(
        'exception' => array(
            'message' => '*java.nio.file.AccessDeniedException*'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.net.SocketException',
            'message' => 'Operation not permitted'
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
    ),
    array(
        'exception' => array(
            'class' => 'javax.net.ssl.SSLHandshakeException'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.io.IOException',
            'message' => 'Input/output error'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.io.IOException',
            'message' => 'Stream closed'
        )
    ),
    array(
        'exception' => array(
            'message' => '*Address already in use*'
        )
    ),
    array(
        'exception' => array(
            'class' => 'com.mysql.jdbc.MysqlDataTruncation'
        )
    ),
    array(
        'exception' => array(
            'message' => '*Connection reset*'
        )
    ),
    array(
        'exception' => array(
            'message' => '*Socket closed*'
        )
    ),
    array(
        'exception' => array(
            'message' => '*Connection timed out*'
        )
    ),
    array(
        'exception' => array(
            'message' => '*connection failing*'
        )
    ),
    array(
        'exception' => array(
            'message' => '*apioauth is required*'
        )
    ),
    array(
        'exception' => array(
            'message' => '*getCommunities*'
        )
    ),
    array(
        'exception' => array(
            'message' => '[TimeoutException]'
        )
    ),
    array(
        'exception' => array(
            'message' => '*Network is unreachable*'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.net.SocketException',
            'message' => 'Software caused connection abort: recv failed'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.net.SocketException',
            'message' => 'Connection timed out (Read failed)'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.net.SocketException',
            'message' => 'Unexpected end of file from server'
        )
    ),
    array(
        'exception' => array(
            'message' => '*Too many open files'
        )
    ),
    array(
        'exception' => array(
            'message' => '*UnknownHostException*'
        )
    ),
    array(
        'exception' => array(
            'message' => '*Host unreachable*'
        )
    ),
    array(
        'exception' => array(
            'message' => '*An existing connection was forcibly closed by the remote host'
        )
    ),
    array(
        'exception' => array(
            'message' => '*Received close_notify during handshake'
        )
    ),
    array(
        'exception' => array(
            'message' => 'regex:/Failed to get donations.*404.*Not found/'
        )
    ),
    array(
        'exception' => array(
            'class' => 'java.lang.IllegalArgumentException',
            'message' => 'Invalid token*'
        )
    ),
    array(
        'exception' => array(
            'message' => '*java.base does not export sun.security.x509*'
        )
    )
);

// Only environment values below will be allowed
$allowed_environments = array(
    'stable',
    'stable_docker',
    'nightly_build',
    'nightly_build_docker',
    'edge_build'
);

//Packages to use for the fingerprint
$packages = array(
    'tv.phantombot',
    'com.gmt2001',
    'com.illusionaryone',
    'com.scaniatv'
);

//Files to use for the fingerprint
$files = array(
    '*.js'
);

//Put custom filters in rollbar-settings-extra.php in the provided array_push
@include_once('rollbar-settings-extra.php');

?>
