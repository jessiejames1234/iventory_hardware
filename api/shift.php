<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

include "connection-pdo.php";

$operation = $_GET['operation'] ?? ($_POST['operation'] ?? '');

if ($operation === "getAllShifts") {
  $sql = "SELECT s.shift_id, st.name, s.start_time, s.end_time
          FROM shift s
          JOIN staff st ON s.staff_id = st.staff_id
          ORDER BY s.start_time DESC";
  $stmt = $conn->prepare($sql);
  $stmt->execute();
  echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} else {
  echo json_encode(["status" => "error", "message" => "Invalid operation"]);
}
