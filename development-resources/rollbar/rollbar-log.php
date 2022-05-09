<?php

file_put_contents("request.txt", "\$_SERVER".var_export($_SERVER, true)."\nHeaders".var_export(apache_request_headers(), true)."\n\$_REQUEST".var_export($_REQUEST, true)."\nBody".var_export(json_decode(file_get_contents("php://input"), true), true));

?>