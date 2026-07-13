<?php
$path = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$file = __DIR__ . $path;

if (is_file($file)) { return false; }

if (is_file($file . '.html')) {
    include $file . '.html';
    exit;
}

include __DIR__ . '/index.html';
