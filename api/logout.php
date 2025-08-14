<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

include "connection-pdo.php";

$data = json_decode(file_get_contents("php://input"), true);
$staffId = $data['staff_id'] ?? 0;

$sql = "UPDATE shift SET end_time = NOW()
       WHERE staff_id = :id AND end_time IS NULL

        ORDER BY shift_id DESC LIMIT 1";


$stmt = $conn->prepare($sql);
$stmt->execute([":id" => $staffId]);

echo json_encode(["status" => "logged_out"]);
