<?php
// /api/getProductsByLocation.php
header("Content-Type: application/json; charset=utf-8");
require_once "connection-pdo.php";

try {
    $data = json_decode(file_get_contents("php://input"), true);
    $staff_id = isset($data['staff_id']) ? (int)$data['staff_id'] : 0;

    if ($staff_id <= 0) {
        http_response_code(400);
        echo json_encode(["error" => "Missing or invalid staff_id", "code" => "BAD_REQUEST"]);
        exit;
    }

    // 1) Find staff role and assigned location
    $sql = "SELECT role, location_id FROM staff WHERE staff_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$staff_id]);
    $staff = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$staff) {
        http_response_code(404);
        echo json_encode(["error" => "Staff not found", "code" => "NOT_FOUND"]);
        exit;
    }

    // Only these roles are allowed to query this endpoint
    if (!in_array($staff['role'], ['warehouse_manager','warehouse_clerk'], true)) {
        http_response_code(403);
        echo json_encode(["error" => "Access denied. Role not permitted.", "code" => "FORBIDDEN"]);
        exit;
    }

    // Staff must have an assigned location
    $location_id = (int)($staff['location_id'] ?? 0);
    if ($location_id <= 0) {
        http_response_code(403);
        echo json_encode([
            "error" => "Your account has no assigned location. Contact an admin.",
            "code" => "NO_LOCATION"
        ]);
        exit;
    }

    // 2) Fetch only products in the staff's assigned location
$sql = "
  SELECT 
      p.product_id,
      p.product_name,
      p.model,
      p.selling_price,
      COALESCE(i.quantity,0) as quantity,
      l.location_name AS warehouse_name   -- 👈 alias for your frontend
  FROM inventory i
  INNER JOIN product  p ON p.product_id  = i.product_id
  INNER JOIN location l ON l.location_id = i.location_id
  WHERE i.location_id = :loc
  ORDER BY p.product_name ASC
";

    $stmt = $conn->prepare($sql);
    $stmt->bindValue(":loc", $location_id, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 3) Return payload
echo json_encode([
  "warehouse_name" => $rows ? $rows[0]['warehouse_name'] : null,  // 👈 use alias
  "products"       => $rows
]);


} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["error" => "Server error: ".$e->getMessage(), "code" => "SERVER_ERROR"]);
}
