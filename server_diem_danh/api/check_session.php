<?php
// api/check_session.php
require_once __DIR__ . '/../modules/Session.php';
require_once __DIR__ . '/../modules/Response.php';
require_once __DIR__ . '/../modules/CSRF.php';

// Start the session
Session::start();

// Check if user is logged in
if (!isset($_SESSION['user_id']) || !isset($_SESSION['username']) || !isset($_SESSION['role'])) {
    Response::json([
        "logged_in" => false,
        "message" => "No valid session found",
        "csrf_token" => CSRF::generate()
    ]);
    exit;
}

// Check if roles are properly set for student, teacher, or parent
if (($_SESSION['role'] === 'student' && !isset($_SESSION['student_id'])) ||
    ($_SESSION['role'] === 'teacher' && !isset($_SESSION['teacher_id'])) ||
    ($_SESSION['role'] === 'parent' && !isset($_SESSION['student_id']))) {
    Response::json([
        "logged_in" => false,
        "message" => "Invalid session data for role {$_SESSION['role']}",
        "csrf_token" => CSRF::generate()
    ]);
    exit;
}

// User is logged in - return data based on role
$sessionData = [
    "logged_in" => true,
    "user_id" => $_SESSION['user_id'],
    "username" => $_SESSION['username'],
    "role" => $_SESSION['role'],
    "csrf_token" => CSRF::generate()
];

// Add role-specific data
if ($_SESSION['role'] === 'student') {
    $sessionData['student_id'] = $_SESSION['student_id'];
} elseif ($_SESSION['role'] === 'teacher') {
    $sessionData['teacher_id'] = $_SESSION['teacher_id'];
} elseif ($_SESSION['role'] === 'parent') {
    $sessionData['student_id'] = $_SESSION['student_id'];
    $sessionData['student_name'] = $_SESSION['student_name'] ?? '';
    $sessionData['is_parent'] = true;
}

Response::json($sessionData);
?>