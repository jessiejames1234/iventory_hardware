<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class StockOut {
    
    // Get all stock out records
    function getAllStockOut() {
        include "connection-pdo.php";

        $sql = "SELECT so.stockout_id, p.product_name, so.quantity, 
                       s.name AS removed_by, so.reason, so.date_removed
                FROM stockout so
                INNER JOIN product p ON so.product_id = p.product_id
                LEFT JOIN staff s ON so.removed_by_staff = s.staff_id
                ORDER BY so.date_removed DESC";

        $stmt = $conn->prepare($sql);
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // Insert stock out
    function insertStockOut($json) {
        include "connection-pdo.php";
        $data = json_decode($json, true);

        // Start transaction
        $conn->beginTransaction();

        try {
            // 1. Insert into stockout table
            $sql = "INSERT INTO stockout(product_id, quantity, removed_by_staff, reason)
                    VALUES(:productId, :quantity, :removedBy, :reason)";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(":productId", $data['productId']);
            $stmt->bindParam(":quantity", $data['quantity']);
            $stmt->bindParam(":removedBy", $data['removedByStaff']);
            $stmt->bindParam(":reason", $data['reason']);
            $stmt->execute();

            // 2. Update product quantity
            $updateSql = "UPDATE product SET quantity = quantity - :qty WHERE product_id = :productId";
            $updateStmt = $conn->prepare($updateSql);
            $updateStmt->bindParam(":qty", $data['quantity']);
            $updateStmt->bindParam(":productId", $data['productId']);
            $updateStmt->execute();

            // Commit transaction
            $conn->commit();
            echo json_encode(1);
        } catch (Exception $e) {
            $conn->rollBack();
            echo json_encode(0);
        }
    }
}

// Handle requests
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $operation = $_GET['operation'];
    $json = $_GET['json'] ?? "";
} else {
    $operation = $_POST['operation'];
    $json = $_POST['json'] ?? "";
}

$so = new StockOut();

switch($operation){
    case "getAllStockOut": $so->getAllStockOut(); break;
    case "insertStockOut": $so->insertStockOut($json); break;
}
?>
