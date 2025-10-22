<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

class Staff {
  function insertStaff($json) {
    include "connection-pdo.php";
    $data = json_decode($json, true);

    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    $role = $data['role'] ?? '';
    $location_id = $data['location_id'] ?? null;

    if (!$name || !$email || !$username || !$password || !$role) {
      echo json_encode(["status" => "error", "message" => "Missing fields"]);
      return;
    }

    try {
      $conn->beginTransaction();

      // Only assign location for warehouse_manager or warehouse_clerk
      if (!in_array($role, ["warehouse_manager", "warehouse_clerk"])) {
        $location_id = null;
      }

      $stmt = $conn->prepare("INSERT INTO staff (name, email, role, location_id) 
                              VALUES (:name, :email, :role, :location_id)");
      $stmt->execute([
        ":name" => $name,
        ":email" => $email,
        ":role" => $role,
        ":location_id" => $location_id
      ]);
      $staff_id = $conn->lastInsertId();

      $hashed = password_hash($password, PASSWORD_DEFAULT);
      $stmt = $conn->prepare("INSERT INTO userlogin (staff_id, username, password_hash, is_active) 
                              VALUES (:staff_id, :username, :password_hash, 1)");
      $stmt->execute([
        ":staff_id" => $staff_id,
        ":username" => $username,
        ":password_hash" => $hashed
      ]);

      $conn->commit();
      echo json_encode(["status" => "success"]);
    } catch (Exception $e) {
      $conn->rollBack();
      echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
  }

  function getAllStaff() {
    include "connection-pdo.php";
$sql = "SELECT 
          s.staff_id, 
          s.name, 
          s.email, 
          s.role, 
          s.location_id,
          l.location_name,
          u.username, 
          u.is_active, 
          u.user_id
        FROM staff s
        LEFT JOIN userlogin u ON s.staff_id = u.staff_id
        LEFT JOIN location l ON s.location_id = l.location_id
        ORDER BY s.staff_id DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  }

  function updateStatus($json) {
    include "connection-pdo.php";
    $data = json_decode($json, true);

    $userId = $data['user_id'] ?? 0;
    $newStatus = $data['is_active'] ?? 0;

    $sql = "UPDATE userlogin SET is_active = :status WHERE user_id = :id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(":status", $newStatus);
    $stmt->bindParam(":id", $userId);
    $stmt->execute();

    echo json_encode(["status" => "success"]);
  }

  // ✅ New: fetch locations except main_store (id = 1)
  function getLocations() {
    include "connection-pdo.php";
    $sql = "SELECT location_id AS id, location_name AS name 
            FROM location 
            WHERE location_id != 1 AND is_active = 1
            ORDER BY location_name ASC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  }
}

// Dispatcher
$operation = $_SERVER['REQUEST_METHOD'] === 'GET' ? $_GET['operation'] : $_POST['operation'];
$json = $_GET['json'] ?? ($_POST['json'] ?? '');

$staff = new Staff();

switch ($operation) {
  case "insertStaff": $staff->insertStaff($json); break;
  case "getAllStaff": $staff->getAllStaff(); break;
  case "updateStatus": $staff->updateStatus($json); break;
  case "getLocations": $staff->getLocations(); break; // ✅ Added here
  default:
    echo json_encode(["status" => "error", "message" => "Invalid operation"]);
}
