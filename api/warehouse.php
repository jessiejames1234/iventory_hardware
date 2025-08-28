<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
include "connection-pdo.php";

class Warehouse {

    // 🔹 Get all warehouses
    function getWarehouses() {
        include "connection-pdo.php";
        $sql = "SELECT warehouse_id AS id, warehouse_name AS name, location 
                FROM warehouse 
                ORDER BY warehouse_name";
        $stmt = $conn->query($sql);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // 🔹 Insert new warehouse
    function insertWarehouse($json) {
        include "connection-pdo.php";
        $data = json_decode($json, true);

        $name = trim($data['name'] ?? '');
        $location = trim($data['location'] ?? '');

        if ($name === '') {
            echo json_encode(["status"=>"error","message"=>"Warehouse name is required"]);
            return;
        }

        try {
            $stmt = $conn->prepare("INSERT INTO warehouse (warehouse_name, location) VALUES (:name, :loc)");
            $ok = $stmt->execute([":name"=>$name, ":loc"=>$location]);

            echo json_encode(["status"=>$ok ? "success" : "error"]);
        } catch (Exception $e) {
            echo json_encode(["status"=>"error","message"=>$e->getMessage()]);
        }
    }

    // 🔹 Get products in warehouse
    function getProductsByWarehouse($warehouseId) {
        include "connection-pdo.php";

        $sql = "SELECT p.product_id AS id, p.product_name AS name, i.quantity
                FROM inventory i
                JOIN product p ON i.product_id = p.product_id
                WHERE i.warehouse_id = :wid
                  AND i.quantity > 0
                ORDER BY p.product_name";
        $stmt = $conn->prepare($sql);
        $stmt->execute([":wid" => $warehouseId]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
    // Get products for the logged-in manager’s warehouse
function getMyWarehouseProducts($userId) {
    include "connection-pdo.php";

    // Get the warehouse assigned to this user
    $stmt = $conn->prepare("SELECT assigned_warehouse_id FROM users WHERE user_id = :uid AND role = 'warehouse_manager'");
    $stmt->execute([":uid" => $userId]);
    $row = $stmt->fetch();

    if (!$row || !$row['assigned_warehouse_id']) {
        echo json_encode(["status"=>"error","message"=>"No warehouse assigned"]);
        return;
    }

    $warehouseId = $row['assigned_warehouse_id'];

    // Fetch products in that warehouse
    $sql = "SELECT p.product_id AS id, p.product_name AS name, i.quantity
            FROM inventory i
            JOIN product p ON i.product_id = p.product_id
            WHERE i.warehouse_id = :wid
            ORDER BY p.product_name";
    $stmt = $conn->prepare($sql);
    $stmt->execute([":wid" => $warehouseId]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

}

$warehouse = new Warehouse();
$operation = $_POST['operation'] ?? $_GET['operation'] ?? '';
$json      = $_POST['json'] ?? $_GET['json'] ?? '';

switch ($operation) {
    case "getWarehouses":
        $warehouse->getWarehouses();
        break;

    case "insertWarehouse":
        $warehouse->insertWarehouse($json);
        break;

    case "getProductsByWarehouse":
        $warehouse->getProductsByWarehouse($_GET['warehouseId'] ?? 0);
        break;
case "getMyWarehouseProducts":
    $userId = $_GET['userId'] ?? 0;
    $warehouse->getMyWarehouseProducts($userId);
    break;

    default:
        echo json_encode(["status"=>"error","message"=>"Invalid operation"]);
}
