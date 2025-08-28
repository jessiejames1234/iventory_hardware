<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

include "connection-pdo.php";

$data = json_decode(file_get_contents("php://input"), true);
$staffId = $data['staff_id'] ?? 0;

if (!$staffId) {
    echo json_encode(["status" => "error", "message" => "Missing staff_id"]);
    exit;
}

// ✅ Update only the latest open shift
$sql = "UPDATE shift 
        SET end_time = NOW() 
        WHERE shift_id = (
            SELECT s.shift_id 
            FROM shift s
            WHERE s.staff_id = :id AND s.end_time IS NULL
            ORDER BY s.shift_id DESC
            LIMIT 1
        )";

$stmt = $conn->prepare($sql);
$success = $stmt->execute([":id" => $staffId]);

if ($success) {
    echo json_encode(["status" => "logged_out"]);
} else {
    echo json_encode(["status" => "error", "message" => "Logout failed"]);
}
