<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
include "connection-pdo.php";

class PurchaseReturn {

    // Get all return records
    function getAllReturns() {
        include "connection-pdo.php";
        $sql = "SELECT pr.return_id, ps.product_supplier_id, p.product_name, s.name AS supplier_name, 
                       st.name AS returned_by_name, pr.quantity, pr.reason, pr.return_date
                FROM purchasereturn pr
                INNER JOIN product_supplier ps ON pr.product_supplier_id = ps.product_supplier_id
                INNER JOIN product p ON ps.product_id = p.product_id
                INNER JOIN supplier s ON ps.supplier_id = s.supplier_id
                INNER JOIN staff st ON pr.returned_by = st.staff_id
                ORDER BY pr.return_date DESC";

        $stmt = $conn->prepare($sql);
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // Insert a new return
// Insert a new return
function insertReturn($json) {
    include "connection-pdo.php";
    $data = json_decode($json, true);

    // Ensure numeric values
    $psId = (int)($data['productSupplierId'] ?? 0);
    $returnedBy = (int)($data['returnedBy'] ?? 0);
    $qty = (int)($data['quantity'] ?? 0);
    $reason = trim($data['reason'] ?? "");

    if ($psId <= 0 || $returnedBy <= 0 || $qty <= 0) {
        echo json_encode(["success" => 0, "error" => "Invalid input values."]);
        return;
    }

    $conn->beginTransaction();

    try {
        // Check current stock
        $checkSql = "SELECT p.quantity 
                     FROM product p
                     INNER JOIN product_supplier ps ON p.product_id = ps.product_id
                     WHERE ps.product_supplier_id = :psId
                     FOR UPDATE";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bindParam(":psId", $psId);
        $checkStmt->execute();
        $current = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$current) {
            throw new Exception("Product-Supplier not found.");
        }

        if ($current['quantity'] < $qty) {
            throw new Exception("Not enough stock to return.");
        }

        // Insert into purchasereturn
        $sql = "INSERT INTO purchasereturn(product_supplier_id, returned_by, reason, quantity)
                VALUES(:psId, :returnedBy, :reason, :qty)";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":psId", $psId);
        $stmt->bindParam(":returnedBy", $returnedBy);
        $stmt->bindParam(":reason", $reason);
        $stmt->bindParam(":qty", $qty);
        $stmt->execute();

        // Update product quantity (subtract stock)
        $updateSql = "UPDATE product p
                      INNER JOIN product_supplier ps ON p.product_id = ps.product_id
                      SET p.quantity = p.quantity - :qty
                      WHERE ps.product_supplier_id = :psId";
        $updateStmt = $conn->prepare($updateSql);
        $updateStmt->bindParam(":qty", $qty);
        $updateStmt->bindParam(":psId", $psId);
        $updateStmt->execute();

        $conn->commit();
        echo json_encode(["success" => 1]);
    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(["success" => 0, "error" => $e->getMessage()]);
    }
}

}

// Handle requests
$operation = $_POST['operation'] ?? $_GET['operation'] ?? "";
$json = $_POST['json'] ?? $_GET['json'] ?? "";

$pr = new PurchaseReturn();

switch ($operation) {
    case "getAllReturns": $pr->getAllReturns(); break;
    case "insertReturn":  $pr->insertReturn($json); break;
}
?>
