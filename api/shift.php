<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

include "connection-pdo.php";

$operation = $_GET['operation'] ?? ($_POST['operation'] ?? '');

if ($operation === "getAllShifts") {
    $date = $_GET['date'] ?? '';

    $sql = "SELECT s.shift_id, st.name, s.start_time, s.end_time
            FROM shift s
            JOIN staff st ON s.staff_id = st.staff_id";

    // Filter by date if provided
    if (!empty($date)) {
        $sql .= " WHERE DATE(s.start_time) = :date";
    }

    $sql .= " ORDER BY s.start_time DESC";

    $stmt = $conn->prepare($sql);

    if (!empty($date)) {
        $stmt->bindParam(':date', $date);
    }

    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} else {
    echo json_encode(["status" => "error", "message" => "Invalid operation"]);
}
