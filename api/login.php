<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

include "connection-pdo.php";

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);
$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');

if ($username === '' || $password === '') {
    echo json_encode(["status" => "error", "message" => "Missing credentials"]);
    exit;
}

// Fetch user by username
$sql = "SELECT ul.user_id, ul.username, ul.password_hash, ul.is_active,
               s.staff_id, s.name, s.role, s.warehouse_id
        FROM userlogin ul
        JOIN staff s ON ul.staff_id = s.staff_id
        WHERE ul.username = :username
        LIMIT 1";

$stmt = $conn->prepare($sql);
$stmt->bindParam(":username", $username);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
    exit;
}

// Check account status
if ((int)$user['is_active'] === 0) {
    echo json_encode(["status" => "error", "message" => "Account is inactive."]);
    exit;
}

// Verify password
if (!password_verify($password, $user['password_hash'])) {
    echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
    exit;
}

// ✅ Insert shift start record only if no active shift exists
$checkShift = $conn->prepare("SELECT shift_id FROM shift WHERE staff_id = :staff_id AND end_time IS NULL LIMIT 1");
$checkShift->execute([":staff_id" => $user['staff_id']]);
if (!$checkShift->fetch()) {
    $shiftStmt = $conn->prepare("INSERT INTO shift (staff_id, start_time) VALUES (:staff_id, NOW())");
    $shiftStmt->execute([":staff_id" => $user['staff_id']]);
}

// Return success with user info
echo json_encode([
    "status" => "success",
    "user_id" => (int)$user['user_id'],
    "staff_id" => (int)$user['staff_id'],
    "name" => $user['name'],
    "role" => strtolower($user['role']), // normalize roles
    "assigned_warehouse_id" => $user['warehouse_id'] ?? null
]);
