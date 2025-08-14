<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

include "connection-pdo.php";

$data = json_decode(file_get_contents("php://input"), true);
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

if (!$username || !$password) {
  echo json_encode(["status" => "error", "message" => "Missing credentials"]);
  exit;
}

$sql = "SELECT ul.user_id, ul.username, ul.password_hash, ul.is_active,
               s.staff_id, s.name, s.role
        FROM userlogin ul
        JOIN staff s ON ul.staff_id = s.staff_id
        WHERE ul.username = :username";

$stmt = $conn->prepare($sql);
$stmt->bindParam(":username", $username);
$stmt->execute();

$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Use SHA-256 comparison
if ($user) {
  if ($user['is_active'] == 0) {
    echo json_encode(["status" => "error", "message" => "Account is inactive."]);
  } elseif (hash('sha256', $password) === $user['password_hash']) {
    // ✅ Insert shift start record
$shiftStmt = $conn->prepare("INSERT INTO shift (staff_id, start_time, end_time) VALUES (:staff_id, NOW(), NULL)");
$shiftStmt->execute([":staff_id" => $user['staff_id']]);


    echo json_encode([
      "status" => "success",
      "user_id" => $user['user_id'],
      "staff_id" => $user['staff_id'],
      "name" => $user['name'],
      "role" => $user['role']
    ]);
  } else {
    echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
  }
} else {
  echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
}
