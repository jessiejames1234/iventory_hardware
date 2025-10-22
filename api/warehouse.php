<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

class Warehouse {
  private $conn;
  function __construct(){
    include "connection-pdo.php";
    $this->conn = $conn;
    $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  }

  // 🔹 List all warehouses (from location table)
  function getWarehouses(){
    $sql = "SELECT location_id AS id,
                   location_name AS name,
                   address AS location
            FROM location
            WHERE is_active=1 AND LOWER(type)='warehouse'
            ORDER BY location_name";
    $stmt = $this->conn->query($sql);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  }

  // 🔹 Insert new warehouse (into location table)
  function insertWarehouse($json){
    $d = json_decode($json, true);
    $name = trim($d['name'] ?? '');
    $addr = trim($d['location'] ?? '');

    if ($name === ''){
      echo json_encode(["status"=>"error","message"=>"Warehouse name is required"]);
      return;
    }
    try{
      $sql = "INSERT INTO location (location_name, type, address, is_active)
              VALUES (:n, 'warehouse', :a, 1)";
      $stmt = $this->conn->prepare($sql);
      $ok = $stmt->execute([":n"=>$name, ":a"=>$addr]);
      echo json_encode(["status"=>$ok ? "success" : "error"]);
    } catch(Exception $e){
      echo json_encode(["status"=>"error","message"=>$e->getMessage()]);
    }
  }

  // 🔹 Products by warehouse (join by location_id, not warehouse_id)
  // 🔹 Products by warehouse (join by location_id)
  function getProductsByWarehouse($warehouseId){
    $warehouseId = (int)$warehouseId;
    if($warehouseId <= 0){ echo json_encode([]); return; }

    $sql = "SELECT 
              p.product_id AS id,
              p.product_name AS name,
              b.name AS brand,
              c.name AS category,
              u.name AS unit,
              COALESCE(i.quantity, 0) AS quantity,
              CASE 
                WHEN COALESCE(i.quantity, 0) = 0 THEN 'Out of Stock'
                WHEN COALESCE(i.quantity, 0) <= p.reorder_level THEN 'Low'
                WHEN COALESCE(i.quantity, 0) > p.reorder_level * 3 THEN 'High'
                ELSE 'Normal'
              END AS stock_status
            FROM inventory i
            JOIN product p ON p.product_id = i.product_id
            LEFT JOIN brand b ON b.brand_id = p.brand_id
            LEFT JOIN category c ON c.category_id = p.category_id
            LEFT JOIN unit_tbl u ON u.unit_id = p.unit_id
            WHERE i.location_id = :loc
            ORDER BY p.product_name ASC";

    $stmt = $this->conn->prepare($sql);
    $stmt->execute([":loc" => $warehouseId]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  }



  // 🔹 Products for the logged-in warehouse manager
  function getMyWarehouseProducts($userId){
    $userId = (int)$userId;
    $q = "SELECT assigned_warehouse_id
          FROM users
          WHERE user_id=:u AND role='warehouse_manager'";
    $stmt = $this->conn->prepare($q);
    $stmt->execute([":u"=>$userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if(!$row || !$row['assigned_warehouse_id']){
      echo json_encode(["status"=>"error","message"=>"No warehouse assigned"]);
      return;
    }
    $this->getProductsByWarehouse((int)$row['assigned_warehouse_id']);
  }
}

$op   = $_POST['operation'] ?? $_GET['operation'] ?? '';
$json = $_POST['json'] ?? $_GET['json'] ?? '';
$api  = new Warehouse();

switch($op){
  case "getWarehouses":           $api->getWarehouses(); break;
  case "insertWarehouse":         $api->insertWarehouse($json); break;
  case "getProductsByWarehouse":  $api->getProductsByWarehouse($_GET['warehouseId'] ?? 0); break;
  case "getMyWarehouseProducts":  $api->getMyWarehouseProducts($_GET['userId'] ?? 0); break;
  default: echo json_encode(["status"=>"error","message"=>"Invalid operation"]);
}
