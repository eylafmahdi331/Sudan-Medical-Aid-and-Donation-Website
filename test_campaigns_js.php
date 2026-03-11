<?php
// Simple test to verify campaigns.js has been updated
$file = '../js/campaigns.js';
$content = file_get_contents($file);

// Check for old global variables at top
if (preg_match('/^const searchInput = document\.getElementById/m', $content)) {
    echo "ERROR: Old global DOM queries still present at top of file!";
} else {
    echo "OK: Global DOM queries have been removed";
}

// Check for setupEventListeners with null checks
if (preg_match('/const searchInput = document\.getElementById\([\'"]search-input[\'"][)\];\s*if \(searchInput\)/s', $content)) {
    echo "<br>OK: searchInput has proper null check";
} else {
    echo "<br>WARNING: searchInput might not have proper null check";
}

// Check for references to otherCampaignsGrid without null check
if (preg_match('/[^\.](otherCampaignsGrid|noResults|featuredCampaignCard)\.(?!addEventListener)/m', $content)) {
    // Do a more detailed check
    $lines = explode("\n", $content);
    foreach ($lines as $num => $line) {
        if (preg_match('/(otherCampaignsGrid|noResults|featuredCampaignCard)\.(?!addEventListener)/', $line)) {
            // Check if it's inside a null check
            if (!preg_match('/if \(.*\)/', $lines[$num - 1] ?? '')) {
                echo "<br>WARNING: Line " . ($num + 1) . " might have unsafe reference: " . trim($line);
            }
        }
    }
}

echo "<br><br>File size: " . strlen($content) . " bytes";
echo "<br>Last modified: " . date('Y-m-d H:i:s', filemtime($file));
?>
