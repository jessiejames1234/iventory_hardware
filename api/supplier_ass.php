<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class ProductSupplier {

    // Get all product-supplier assignments
    function getAllAssignments() {
        include "connection-pdo.php";
        $sql = "SELECT ps.product_supplier_id, p.product_name, s.name AS supplier_name
                FROM product_supplier ps
                INNER JOIN product p ON ps.product_id = p.product_id
                INNER JOIN supplier s ON ps.supplier_id = s.supplier_id
                ORDER BY p.product_name";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // Insert a new assignment
function insertAssignment($json) {
    include "connection-pdo.php";
    $json = json_decode($json, true);

    // Check if the same product-supplier pair already exists
    $check = $conn->prepare("
        SELECT 1 FROM product_supplier 
        WHERE product_id = :productId AND supplier_id = :supplierId
        LIMIT 1
    ");
    $check->bindParam(":productId", $json['productId']);
    $check->bindParam(":supplierId", $json['supplierId']);
    $check->execute();

    if ($check->fetch()) {
        echo json_encode(-1); // -1 means duplicate
        return;
    }

    $sql = "INSERT INTO product_supplier(product_id, supplier_id) 
            VALUES(:productId, :supplierId)";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(":productId", $json['productId']);
    $stmt->bindParam(":supplierId", $json['supplierId']);
    $stmt->execute();

    echo json_encode($stmt->rowCount() > 0 ? 1 : 0);
}
    
    // Get a specific assignment
    function getAssignment($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);

        $sql = "SELECT * FROM product_supplier WHERE product_supplier_id = :id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":id", $json['id']);
        $stmt->execute();

        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // Update assignment
    function updateAssignment($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);

        $sql = "UPDATE product_supplier 
                SET product_id = :productId, supplier_id = :supplierId
                WHERE product_supplier_id = :id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":productId", $json['productId']);
        $stmt->bindParam(":supplierId", $json['supplierId']);
        $stmt->bindParam(":id", $json['id']);
        $stmt->execute();

        echo json_encode($stmt->rowCount() > 0 ? 1 : 0);
    }

    // Delete assignment
    function deleteAssignment($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);

        $sql = "DELETE FROM product_supplier WHERE product_supplier_id = :id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":id", $json['id']);
        $stmt->execute();

        echo json_encode($stmt->rowCount() > 0 ? 1 : 0);
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

$ps = new ProductSupplier();

switch ($operation) {
    case "getAllAssignments": $ps->getAllAssignments(); break;
    case "insertAssignment": $ps->insertAssignment($json); break;
    case "getAssignment": $ps->getAssignment($json); break;
    case "updateAssignment": $ps->updateAssignment($json); break;
    case "deleteAssignment": $ps->deleteAssignment($json); break;
}
?>
