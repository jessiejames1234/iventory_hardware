<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

include "connection-pdo.php";

$operation = $_POST['operation'] ?? $_GET['operation'] ?? "";
$json = $_POST['json'] ?? "";

switch($operation) {
    case "getUnits":
        $stmt = $conn->query("SELECT * FROM unit_tbl ORDER BY name");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;
    case "getBrands":
        $stmt = $conn->query("SELECT * FROM brand ORDER BY name");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;
    case "getCategories":
        $stmt = $conn->query("SELECT * FROM category ORDER BY name");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;
    case "insertUnit":
        insertRow("unit_tbl", $json, $conn);
        break;
    case "insertBrand":
        insertRow("brand", $json, $conn);
        break;
    case "insertCategory":
        insertRow("category", $json, $conn);
        break;
}

function insertRow($table, $json, $conn) {
    $data = json_decode($json, true);
    $stmt = $conn->prepare("INSERT INTO $table(name) VALUES(:name)");
    $stmt->bindValue(":name", $data['name']);
    echo json_encode(["status" => $stmt->execute() ? "success" : "error"]);
}
