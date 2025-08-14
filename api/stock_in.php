<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class StockIn {
    
    // Get all stock records
    function getAllStock() {
        include "connection-pdo.php";
        $sql = "SELECT si.stockin_id, p.product_name, s.name AS supplier_name, 
                       si.quantity, si.remarks, si.date_received, st.name AS added_by
                FROM stockin si
                INNER JOIN product_supplier ps ON si.product_supplier_id = ps.product_supplier_id
                INNER JOIN product p ON ps.product_id = p.product_id
                INNER JOIN supplier s ON ps.supplier_id = s.supplier_id
                LEFT JOIN staff st ON si.added_by_staff = st.staff_id
                ORDER BY si.date_received DESC";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // Insert new stock
function insertStock($json) {
    include "connection-pdo.php";
    $data = json_decode($json, true);

    try {
        $conn->beginTransaction();

        // Insert into stockin
        $sql = "INSERT INTO stockin(product_supplier_id, quantity, remarks, added_by_staff)
                VALUES(:productSupplierId, :quantity, :remarks, :addedByStaff)";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":productSupplierId", $data['productSupplierId']);
        $stmt->bindParam(":quantity", $data['quantity']);
        $stmt->bindParam(":remarks", $data['remarks']);
        $stmt->bindParam(":addedByStaff", $data['addedByStaff']);
        $stmt->execute();

        // Get the product_id from product_supplier
        $sql2 = "SELECT product_id FROM product_supplier WHERE product_supplier_id = :psId";
        $stmt2 = $conn->prepare($sql2);
        $stmt2->bindParam(":psId", $data['productSupplierId']);
        $stmt2->execute();
        $product = $stmt2->fetch(PDO::FETCH_ASSOC);

        if ($product) {
            // Update product quantity
            $sql3 = "UPDATE product SET quantity = quantity + :qty WHERE product_id = :productId";
            $stmt3 = $conn->prepare($sql3);
            $stmt3->bindParam(":qty", $data['quantity']);
            $stmt3->bindParam(":productId", $product['product_id']);
            $stmt3->execute();
        }

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
    $operation = $_GET['operation'] ?? "";
    $json = $_GET['json'] ?? "";
} else {
    $operation = $_POST['operation'] ?? "";
    $json = $_POST['json'] ?? "";
}

$stock = new StockIn();

switch($operation) {
    case "getAllStock":
        $stock->getAllStock();
        break;
    case "insertStock":
        $stock->insertStock($json);
        break;
    default:
        echo json_encode(["error" => "Invalid operation"]);
        break;
}
?>
