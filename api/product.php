<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
include "connection-pdo.php";

class Product {

    function getProducts() {
        include "connection-pdo.php";
        $sql = "SELECT 
                    p.product_id,
                    p.product_name AS name,
                    p.selling_price AS price,
                    p.quantity,
                    p.is_active,
                    c.name AS category,
                    b.name AS brand
                FROM product p
                LEFT JOIN category c ON p.category_id = c.category_id
                LEFT JOIN brand b    ON p.brand_id    = b.brand_id
                ORDER BY p.product_id DESC";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

function getProduct($id) {
    include "connection-pdo.php";

    $stmt = $conn->prepare("
        SELECT 
            p.product_id,
            p.product_name,
            p.model,
            p.specs,
            p.warranty_period,
            p.selling_price,
            p.cost_price,
            p.reorder_level,
            p.is_active,
            
            -- Category & Brand & Unit names
            c.name AS category_name,
            b.name AS brand_name,
            u.name AS unit_name,
            
            -- Created & Updated info
            p.created_at,
f.name AS created_by_name,
            p.updated_at,
v.name AS updated_by_name
        FROM product p
        LEFT JOIN category c ON p.category_id = c.category_id
        LEFT JOIN brand b ON p.brand_id = b.brand_id
        LEFT JOIN unit_tbl u ON p.unit_id = u.unit_id
LEFT JOIN staff f ON p.created_by = f.staff_id
LEFT JOIN staff v ON p.updated_by = v.staff_id

        WHERE p.product_id = :id
        LIMIT 1
    ");

    $stmt->bindValue(":id", (int)$id, PDO::PARAM_INT);
    $stmt->execute();
    $data = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode($data ?: []);
}





function insertProduct($json) {
    include "connection-pdo.php";
    $data = json_decode($json, true);

    $name    = trim($data['name'] ?? "");
    $model   = trim($data['model'] ?? "");
    $price   = $data['price'] ?? "";
    $cost    = $data['cost_price'] ?? "";
    $reorder = isset($data['reorder_level']) ? (int)$data['reorder_level'] : 0;
    $catId   = $data['categoryId'] ?? "";
    $brandId = $data['brandId'] ?? "";

    $errors = [];
    if ($name === "")  $errors[] = "Name is required.";
    if ($model === "") $errors[] = "Model is required.";
    if (!is_numeric($price) || $price <= 0) $errors[] = "Selling price must be greater than 0.";
    if (!is_numeric($cost)  || $cost  <= 0) $errors[] = "Cost price must be greater than 0.";
    if ($catId === "")   $errors[] = "Category is required.";
    if ($brandId === "") $errors[] = "Brand is required.";

    if (!empty($errors)) {
        echo json_encode(["status"=>"error","message"=>implode(" ", $errors)]);
        return;
    }

    $unitId = isset($data['unitId']) && $data['unitId'] !== "" ? (int)$data['unitId'] : null;
    $specs = trim($data['specs'] ?? "");
    $warranty = trim($data['warranty_period'] ?? "");
    $createdBy = isset($data['createdBy']) && is_numeric($data['createdBy']) ? (int)$data['createdBy'] : null;

    if ($createdBy === null) {
        echo json_encode(["status" => "error", "message" => "User not identified."]);
        return;
    }

    // Check duplicate name
    $dupStmt = $conn->prepare("SELECT COUNT(*) FROM product WHERE LOWER(TRIM(product_name)) = LOWER(TRIM(:pname))");
    $dupStmt->bindValue(":pname", $name, PDO::PARAM_STR);
    $dupStmt->execute();
    if ($dupStmt->fetchColumn() > 0) {
        echo json_encode(["status"=>"error","message"=>"Product name already exists."]);
        return;
    }

    $sql = "INSERT INTO product
            (product_name, model, specs, warranty_period, selling_price, cost_price, reorder_level, quantity, category_id, brand_id, unit_id, img, created_by)
            VALUES
            (:name, :model, :specs, :warranty, :price, :cost_price, :reorder_level, 0, :category_id, :brand_id, :unit_id, '', :created_by)";

    $stmt = $conn->prepare($sql);
    $stmt->bindValue(":name", $name);
    $stmt->bindValue(":model", $model);
    $stmt->bindValue(":specs", $specs);
    $stmt->bindValue(":warranty", $warranty);
    $stmt->bindValue(":price", $price);
    $stmt->bindValue(":cost_price", $cost);
    $stmt->bindValue(":reorder_level", $reorder, PDO::PARAM_INT);
    $stmt->bindValue(":category_id", (int)$catId, PDO::PARAM_INT);
    $stmt->bindValue(":brand_id", (int)$brandId, PDO::PARAM_INT);
    $stmt->bindValue(":unit_id", $unitId, $unitId === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
    $stmt->bindValue(":created_by", $createdBy, PDO::PARAM_INT);

    $ok = $stmt->execute();
    echo json_encode(["status" => $ok ? "success" : "error"]);
}


function updateProduct($json) {
    include "connection-pdo.php";
    $data = json_decode($json, true);

    $id        = isset($data['id']) ? (int)$data['id'] : 0;
    $name      = trim($data['name'] ?? "");
    $updatedBy = isset($data['updatedBy']) && is_numeric($data['updatedBy']) ? (int)$data['updatedBy'] : null;

    // minimal validation
    if ($id <= 0 || $name === "" || $updatedBy === null) {
        echo json_encode(["status" => "error", "message" => "Missing required fields."]);
        return;
    }

    // duplicate name check (exclude current product)
    $dupStmt = $conn->prepare("
        SELECT COUNT(*) 
        FROM product 
        WHERE LOWER(TRIM(product_name)) = LOWER(TRIM(:pname)) 
          AND product_id != :id
    ");
    $dupStmt->bindValue(":pname", $name, PDO::PARAM_STR);
    $dupStmt->bindValue(":id", $id, PDO::PARAM_INT);
    $dupStmt->execute();
    if ($dupStmt->fetchColumn() > 0) {
        echo json_encode(["status" => "error", "message" => "Product name already exists."]);
        return;
    }

    try {
        $sql = "UPDATE product SET
                    product_name    = :name,
                    model           = :model,
                    specs           = :specs,
                    cost_price      = :cost,
                    selling_price   = :price,
                    reorder_level   = :reorder_level,
                    category_id     = :category_id,
                    brand_id        = :brand_id,
                    unit_id         = :unit_id,
                    warranty_period = :warranty,
                    updated_at      = CURRENT_TIMESTAMP,
                    updated_by      = :updated_by
                WHERE product_id = :id";

        $stmt = $conn->prepare($sql);

        $stmt->bindValue(":name", $name, PDO::PARAM_STR);
        $stmt->bindValue(":model", trim($data['model'] ?? ""), PDO::PARAM_STR);
        $stmt->bindValue(":specs", trim($data['specs'] ?? ""), PDO::PARAM_STR);
        $stmt->bindValue(":cost", (float)($data['cost_price'] ?? 0), PDO::PARAM_STR);
        $stmt->bindValue(":price", (float)($data['price'] ?? 0), PDO::PARAM_STR);
        $stmt->bindValue(":reorder_level", isset($data['reorder_level']) ? (int)$data['reorder_level'] : 0, PDO::PARAM_INT);
        $stmt->bindValue(":category_id", (int)($data['categoryId'] ?? 0), PDO::PARAM_INT);
        $stmt->bindValue(":brand_id", (int)($data['brandId'] ?? 0), PDO::PARAM_INT);

        $unit_id = isset($data['unitId']) && $data['unitId'] !== "" ? (int)$data['unitId'] : null;
        $stmt->bindValue(":unit_id", $unit_id, is_null($unit_id) ? PDO::PARAM_NULL : PDO::PARAM_INT);

        $stmt->bindValue(":warranty", trim($data['warranty_period'] ?? ""), PDO::PARAM_STR);
        $stmt->bindValue(":updated_by", $updatedBy, PDO::PARAM_INT);
        $stmt->bindValue(":id", $id, PDO::PARAM_INT);

        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            echo json_encode(["status" => "success", "affected" => $stmt->rowCount()]);
        } else {
            echo json_encode(["status" => "error", "message" => "No changes made or invalid product ID."]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
}



    function toggleProductStatus($json) {
        include "connection-pdo.php";
        $data = json_decode($json, true);
        $sql = "UPDATE product SET is_active = IF(is_active = 1, 0, 1) WHERE product_id = :id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":id", $data['id']);
        $stmt->execute();
        echo json_encode(["status" => $stmt->rowCount() > 0 ? "success" : "error"]);
    }

    function getCategories() {
        include "connection-pdo.php";
        $stmt = $conn->prepare("SELECT category_id AS id, name FROM category ORDER BY name");
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    function getBrands() {
        include "connection-pdo.php";
        $stmt = $conn->prepare("SELECT brand_id AS id, name FROM brand ORDER BY name");
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    function getUnits() {
        include "connection-pdo.php";
        $stmt = $conn->prepare("SELECT unit_id AS id, name FROM unit_tbl ORDER BY name");
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}

$product = new Product();
$operation = $_POST['operation'] ?? $_GET['operation'] ?? '';
$json      = $_POST['json']       ?? $_GET['json']       ?? '';

switch ($operation) {
    case "getProducts":  $product->getProducts(); break;
    case "getProduct":   $product->getProduct($_GET['id'] ?? 0); break;
    case "insertProduct":$product->insertProduct($json); break;
    case "updateProduct":$product->updateProduct($json); break;
    case "toggleProductStatus": $product->toggleProductStatus($json); break;
    case "getCategories":$product->getCategories(); break;
    case "getBrands":    $product->getBrands(); break;
    case "getUnits":     $product->getUnits(); break;
    default: echo json_encode(["status"=>"error","message"=>"Invalid operation"]);
}
?>
