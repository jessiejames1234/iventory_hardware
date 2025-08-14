<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class Supplier {

    function getAllSuppliers() {
        include "connection-pdo.php";
        $sql = "SELECT * FROM supplier ORDER BY name";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($rs);
    }

    function insertSupplier($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);

        $sql = "INSERT INTO supplier (name, company_name, contact_info, email, address, notes, is_active)
                VALUES (:name, :companyName, :contactInfo, :email, :address, :notes, :isActive)";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":name", $json['name']);
        $stmt->bindParam(":companyName", $json['companyName']);
        $stmt->bindParam(":contactInfo", $json['contactInfo']);
        $stmt->bindParam(":email", $json['email']);
        $stmt->bindParam(":address", $json['address']);
        $stmt->bindParam(":notes", $json['notes']);
        $stmt->bindParam(":isActive", $json['isActive']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    function getSupplier($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);

        $sql = "SELECT * FROM supplier WHERE supplier_id = :supplierId";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":supplierId", $json['supplierId']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($rs);
    }
function assignProductsToSupplier($json) {
    include "connection-pdo.php";
    $json = json_decode($json, true);
    $supplierId = $json['supplierId'];
    $productIds = $json['productIds'];

    // Delete existing assignments
    $stmt = $conn->prepare("DELETE FROM supplier_products WHERE supplier_id = ?");
    $stmt->execute([$supplierId]);

    // Insert new assignments
    $stmt = $conn->prepare("INSERT INTO supplier_products (supplier_id, product_id) VALUES (?, ?)");
    foreach ($productIds as $pid) {
        $stmt->execute([$supplierId, $pid]);
    }

    echo json_encode(1);
}

function updateSupplier($json) {
    include "connection-pdo.php";
    $json = json_decode($json, true);

    $sql = "UPDATE supplier 
            SET name = :name, company_name = :companyName, contact_info = :contactInfo,
                email = :email, address = :address, notes = :notes, is_active = :isActive
            WHERE supplier_id = :supplierId";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(":name", $json['name']);
    $stmt->bindParam(":companyName", $json['companyName']);
    $stmt->bindParam(":contactInfo", $json['contactInfo']);
    $stmt->bindParam(":email", $json['email']);
    $stmt->bindParam(":address", $json['address']);
    $stmt->bindParam(":notes", $json['notes']);
    $stmt->bindParam(":isActive", $json['isActive']);
    $stmt->bindParam(":supplierId", $json['supplierId']);
    $stmt->execute();

    // Treat as success even if no rows were changed
    $returnValue = $stmt->rowCount() >= 0 ? 1 : 0;

    echo json_encode($returnValue);
}

}

// Handle request
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $operation = $_GET['operation'];
    $json = isset($_GET['json']) ? $_GET['json'] : "";
} else if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $operation = $_POST['operation'];
    $json = isset($_POST['json']) ? $_POST['json'] : "";
}

$supplier = new Supplier();
switch ($operation) {
    case "getAllSuppliers":
        echo $supplier->getAllSuppliers();
        break;
    case "insertSupplier":
        echo $supplier->insertSupplier($json);
        break;
    case "getSupplier":
        echo $supplier->getSupplier($json);
        break;
    case "updateSupplier":
        echo $supplier->updateSupplier($json);
        break;
    case "deleteSupplier":
        echo $supplier->deleteSupplier($json);
        break;
        case "assignProductsToSupplier":
    $supplier->assignProductsToSupplier($json);
    break;
}
?>
