<?php
header("Content-Type: application/json");
include "connection-pdo.php";

$data = json_decode(file_get_contents("php://input"), true);
$staff_id = $data['staff_id'] ?? null;

if (!$staff_id) {
    echo json_encode(["error" => "Missing staff_id"]);
    exit;
}

// Find the warehouse assigned to this staff
$sql = "SELECT warehouse_id FROM staff WHERE staff_id = ?";
$stmt = $conn->prepare($sql);
$stmt->execute([$staff_id]);
$warehouse_id = $stmt->fetchColumn();

if (!$warehouse_id) {
    echo json_encode([]);
    exit;
}

// Get products for that warehouse
// Fetch products in that warehouse
$sql = "SELECT p.product_id, p.product_name, p.model, p.selling_price, i.quantity, w.warehouse_name
        FROM inventory i
        JOIN product p ON i.product_id = p.product_id
        JOIN warehouse w ON i.warehouse_id = w.warehouse_id
        WHERE i.warehouse_id = ?";
$stmt = $conn->prepare($sql);
$stmt->execute([$warehouse_id]);
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    "warehouse_name" => $products ? $products[0]['warehouse_name'] : null,
    "products" => $products
]);
