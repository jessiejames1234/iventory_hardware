<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
include "connection-pdo.php";

class Inventory {
  private $conn;

  function __construct() {
    include "connection-pdo.php";
    $this->conn = $conn;
    $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  }

  // 🏪 Get main store ID
  private function mainStoreId() {
    $sql = "SELECT location_id
            FROM location
            WHERE LOWER(location_name) IN ('main_store','main store')
            ORDER BY is_active DESC, location_id
            LIMIT 1";
    $stmt = $this->conn->prepare($sql);
    $stmt->execute();
    $id = $stmt->fetchColumn();
    return $id ? (int)$id : 1; // fallback to ID 1
  }

  // 📦 Get all products + quantity + reorder_level
  function getAllProductsWithQty() {
    $locId = $this->mainStoreId();

    $sql = "SELECT 
              p.product_id,
              p.product_name,
              p.model,
              p.sku,
              p.reorder_level,
              COALESCE(c.name, '') AS category,
              COALESCE(b.name, '') AS brand,
              COALESCE(u.name, '') AS unit,
              IFNULL(i.quantity, 0) AS quantity
            FROM product p
            LEFT JOIN category c ON c.category_id = p.category_id
            LEFT JOIN brand b ON b.brand_id = p.brand_id
            LEFT JOIN unit_tbl u ON u.unit_id = p.unit_id
            LEFT JOIN inventory i 
              ON i.product_id = p.product_id 
             AND i.location_id = :loc
            ORDER BY p.product_name ASC";

    $stmt = $this->conn->prepare($sql);
    $stmt->bindValue(":loc", $locId, PDO::PARAM_INT);
    $stmt->execute();

    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  }

  // 🧩 Get filter options
  function getFilters() {
    $data = [
      "categories" => $this->fetchTable("category"),
      "brands"     => $this->fetchTable("brand"),
      "units"      => $this->fetchTable("unit_tbl")
    ];
    echo json_encode($data);
  }

  private function fetchTable($table) {
    $stmt = $this->conn->prepare("SELECT * FROM $table ORDER BY name");
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
  }
}

$operation = $_GET['operation'] ?? '';
$inv = new Inventory();

switch($operation) {
  case "getAllProductsWithQty":
    $inv->getAllProductsWithQty();
    break;

  case "getFilters":
    $inv->getFilters();
    break;

  default:
    echo json_encode(["status" => "error", "message" => "Invalid operation"]);
}
?>
