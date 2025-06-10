<?php
// Test timezone settings
include_once 'config/config.php';

echo "=== KIỂM TRA TIMEZONE ===\n";
echo "PHP Default Timezone: " . date_default_timezone_get() . "\n";
echo "Current PHP Time: " . date('Y-m-d H:i:s') . "\n";
echo "Current PHP Day: " . date('l') . "\n";

// Test MySQL timezone
$result = $conn->query("SELECT NOW() as mysql_time, @@session.time_zone as mysql_timezone");
if ($result) {
    $row = $result->fetch_assoc();
    echo "MySQL Time: " . $row['mysql_time'] . "\n";
    echo "MySQL Timezone: " . $row['mysql_timezone'] . "\n";
}

echo "\n=== THÔNG TIN HỆ THỐNG ===\n";
echo "Server Time: " . exec('date') . "\n";
echo "PHP Version: " . phpversion() . "\n";
?>
