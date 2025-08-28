<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

include "connection-pdo.php";

class StockTransfer {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAllTransfers($warehouseId = null, $role = null) {
        $sql = "SELECT st.*, 
                       p.product_name, 
                       fw.warehouse_name AS from_warehouse_name, 
                       s.name AS staff_name
                FROM stock_transfer st
                INNER JOIN product p ON st.product_id = p.product_id
                LEFT JOIN warehouse fw ON st.from_warehouse = fw.warehouse_id
                LEFT JOIN staff s ON st.transferred_by = s.staff_id";

        // Restrict if warehouse_manager
        if ($role === "warehouse_manager" && $warehouseId) {
            $sql .= " WHERE st.from_warehouse = :wid";
        }

        $sql .= " ORDER BY st.transfer_date DESC";
        $stmt = $this->conn->prepare($sql);

        if ($role === "warehouse_manager" && $warehouseId) {
            $stmt->bindParam(":wid", $warehouseId, PDO::PARAM_INT);
        }

        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function insertTransfer($json) {
        $data = json_decode($json, true);

        $sql = "INSERT INTO stock_transfer (product_id, from_warehouse, quantity, transferred_by)
                VALUES (:productId, :warehouseId, :quantity, :staffId)";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(":productId", $data['productId']);
        $stmt->bindParam(":warehouseId", $data['warehouseId']);
        $stmt->bindParam(":quantity", $data['quantity']);
        $stmt->bindParam(":staffId", $data['staffId']);
        $stmt->execute();

        echo json_encode($stmt->rowCount() > 0 ? 1 : 0);
    }

    public function updateStatus($json) {
        $data = json_decode($json, true);

        $transferId = $data['transferId'];
        $status     = $data['status'];

        // First update status
        $sql = "UPDATE stock_transfer SET status = :status WHERE transfer_id = :transferId";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":transferId", $transferId);
        $stmt->execute();

        // If completing transfer, adjust stock
        if ($status === "completed") {
            // Get transfer info
            $sql = "SELECT product_id, from_warehouse, quantity 
                    FROM stock_transfer 
                    WHERE transfer_id = :transferId";
            $stmt2 = $this->conn->prepare($sql);
            $stmt2->bindParam(":transferId", $transferId);
            $stmt2->execute();
            $transfer = $stmt2->fetch(PDO::FETCH_ASSOC);

            if ($transfer) {
                $productId   = $transfer['product_id'];
                $warehouseId = $transfer['from_warehouse'];
                $qty         = $transfer['quantity'];

                // Deduct from warehouse inventory
                $sql = "UPDATE inventory 
                        SET quantity = quantity - :qty 
                        WHERE product_id = :pid AND warehouse_id = :wid";
                $stmt3 = $this->conn->prepare($sql);
                $stmt3->execute([
                    ":qty" => $qty,
                    ":pid" => $productId,
                    ":wid" => $warehouseId
                ]);

                // Add to main product stock
                $sql = "UPDATE product 
                        SET quantity = quantity + :qty 
                        WHERE product_id = :pid";
                $stmt4 = $this->conn->prepare($sql);
                $stmt4->execute([
                    ":qty" => $qty,
                    ":pid" => $productId
                ]);
            }
        }

        echo json_encode(["status" => "success"]);
    }

    public function getWarehouses() {
        $sql = "SELECT warehouse_id, warehouse_name FROM warehouse";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function getProductsByWarehouse($warehouseId) {
        $sql = "SELECT p.product_id, p.product_name, i.quantity
                FROM inventory i
                INNER JOIN product p ON i.product_id = p.product_id
                WHERE i.warehouse_id = :wid AND i.quantity > 0
                ORDER BY p.product_name";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":wid" => $warehouseId]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}

// Entry point
$transfer = new StockTransfer($conn);

$operation = $_POST['operation'] ?? $_GET['operation'] ?? '';
$json      = $_POST['json'] ?? $_GET['json'] ?? '';

switch ($operation) {
    case "getAllTransfers":
        $role = $_POST['role'] ?? $_GET['role'] ?? '';
        $wid  = $_POST['warehouse_id'] ?? $_GET['warehouse_id'] ?? null;
        $transfer->getAllTransfers($wid, $role);
        break;
    case "insertTransfer":  
        $transfer->insertTransfer($json); 
        break;
    case "updateStatus":    
        $transfer->updateStatus($json); 
        break;
    case "getWarehouses":   
        $transfer->getWarehouses(); 
        break;
    case "getProductsByWarehouse":
        $transfer->getProductsByWarehouse($_GET['warehouseId'] ?? 0);
        break;
    default: 
        echo json_encode(["status" => "error", "message" => "Invalid operation", "debug" => $operation]);
}
