<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

include "connection-pdo.php";

class Inventory {

    function getAllProducts() {
        include "connection-pdo.php";

        $sql = "SELECT 
                    p.product_id,
                    p.product_name,
                    p.model,
                    p.quantity,
                    c.name AS category,
                    b.name AS brand,
                    u.name AS unit
                FROM product p
                LEFT JOIN category c ON p.category_id = c.category_id
                LEFT JOIN brand b    ON p.brand_id    = b.brand_id
                LEFT JOIN unit_tbl u ON p.unit_id     = u.unit_id
                ORDER BY p.product_name";

        $stmt = $conn->prepare($sql);
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}

$operation = $_GET['operation'] ?? '';
$inv = new Inventory();

switch($operation){
    case "getAllProducts": $inv->getAllProducts(); break;
    default: echo json_encode(["status"=>"error","message"=>"Invalid operation"]);
}
?>
