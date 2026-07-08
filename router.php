<?php
// Local dev router – simulates .htaccess clean URLs
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Serve existing files directly
if ($path !== '/' && file_exists(__DIR__ . $path)) {
    return false;
}

// Try appending .html
$htmlFile = __DIR__ . rtrim($path, '/') . '.html';
if (file_exists($htmlFile)) {
    include $htmlFile;
    exit;
}

// Fallback: index.html
include __DIR__ . '/index.html';
