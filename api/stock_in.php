<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

include "connection-pdo.php";

class StockIn {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    // 🔹 Get stock-in records (filtered by role/warehouse)
    public function getAllStockIn($warehouseId = null, $role = null) {
$sql = "SELECT si.*, p.product_name, w.warehouse_name, s.name AS staff_name
        FROM stock_in si
        INNER JOIN product p ON si.product_id = p.product_id
        INNER JOIN warehouse w ON si.warehouse_id = w.warehouse_id
        LEFT JOIN staff s ON si.received_by = s.staff_id";


        if ($role === "warehouse_manager" && $warehouseId) {
            $sql .= " WHERE si.warehouse_id = :wid";
        }

$sql .= " ORDER BY si.date_received DESC";
        $stmt = $this->conn->prepare($sql);

        if ($role === "warehouse_manager" && $warehouseId) {
            $stmt->bindParam(":wid", $warehouseId, PDO::PARAM_INT);
        }

        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // 🔹 Insert stock-in (only for assigned warehouse)
    public function insertStockIn($json, $userRole, $assignedWarehouseId) {
        $data = json_decode($json, true);

        if ($userRole !== "warehouse_manager") {
            echo json_encode(["status" => "error", "message" => "Only warehouse managers can stock in"]);
            return;
        }

        // force warehouse_id = assigned_warehouse_id
        $warehouseId = $assignedWarehouseId;

$sql = "INSERT INTO stock_in (product_id, supplier_id, warehouse_id, quantity, received_by, status)
        VALUES (:productId, :supplierId, :warehouseId, :quantity, :staffId, 'delivered')";
$stmt = $this->conn->prepare($sql);
$stmt->execute([
    ":productId" => $data['productId'],
    ":supplierId" => $data['supplierId'],
    ":warehouseId" => $warehouseId, // forced to assigned warehouse
    ":quantity" => $data['quantity'],
    ":staffId" => $data['staffId']
]);


        // ✅ Also update inventory table
        $sql = "INSERT INTO inventory (product_id, warehouse_id, quantity)
                VALUES (:pid, :wid, :qty)
                ON DUPLICATE KEY UPDATE quantity = quantity + :qty";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ":pid" => $data['productId'],
            ":wid" => $warehouseId,
            ":qty" => $data['quantity']
        ]);

        echo json_encode(["status" => "success"]);
    }

    public function getSuppliersByProduct($productId) {
$sql = "SELECT s.supplier_id, s.name AS supplier_name
        FROM product_supplier ps
        INNER JOIN supplier s ON ps.supplier_id = s.supplier_id
        WHERE ps.product_id = :pid";

    $stmt = $this->conn->prepare($sql);
    $stmt->execute([":pid" => $productId]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}
public function updateStatus($json) {
    $data = json_decode($json, true);
    $stockInId = $data['stockInId'];
    $status    = $data['status'];

    // ✅ Update status
    $sql = "UPDATE stock_in SET status = :status WHERE stock_in_id = :sid";
    $stmt = $this->conn->prepare($sql);
    $stmt->execute([":status" => $status, ":sid" => $stockInId]);

    // ✅ If completing, update stock
    if ($status === "completed") {
        $sql = "SELECT product_id, warehouse_id, quantity 
                FROM stock_in 
                WHERE stock_in_id = :sid";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":sid" => $stockInId]);
        $stockIn = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($stockIn) {
            $pid  = $stockIn['product_id'];
            $wid  = $stockIn['warehouse_id'];
            $qty  = $stockIn['quantity'];

            // ✅ update warehouse inventory
            $sql = "INSERT INTO inventory (warehouse_id, product_id, quantity)
                    VALUES (:wid, :pid, :qty)
                    ON DUPLICATE KEY UPDATE quantity = quantity + :qty";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([":wid" => $wid, ":pid" => $pid, ":qty" => $qty]);

            // ✅ update global product stock
            $sql = "UPDATE product 
                    SET quantity = quantity + :qty 
                    WHERE product_id = :pid";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([":qty" => $qty, ":pid" => $pid]);
        }
    }

    echo json_encode(["status" => "success"]);
}
    // 🔹 Get all products
    public function getAllProducts() {
        $sql = "SELECT product_id, product_name FROM product ORDER BY product_name ASC";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}

$stockIn = new StockIn($conn);

$operation = $_POST['operation'] ?? $_GET['operation'] ?? '';
$json      = $_POST['json'] ?? $_GET['json'] ?? '';

switch ($operation) {
    case "getAllStockIn":
        $role = $_POST['role'] ?? $_GET['role'] ?? '';
        $wid  = $_POST['warehouse_id'] ?? $_GET['warehouse_id'] ?? null;
        $stockIn->getAllStockIn($wid, $role);
        break;
    case "insertStockIn":
        $role = $_POST['role'] ?? $_GET['role'] ?? '';
        $assignedWarehouseId = $_POST['assigned_warehouse_id'] ?? $_GET['assigned_warehouse_id'] ?? null;
        $stockIn->insertStockIn($json, $role, $assignedWarehouseId);
        break;
    case "getSuppliersByProduct":
    $pid = $_GET['product_id'] ?? 0;
    $stockIn->getSuppliersByProduct($pid);
    break;
case "updateStatus":
    $stockIn->updateStatus($_POST['json'] ?? $_GET['json'] ?? '');
    break;
    case "getAllProducts":
        $StockIn->getAllProducts();
        break;
    default:
        echo json_encode(["status" => "error", "message" => "Invalid operation"]);
}
