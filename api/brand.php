<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class Brand {
function getAllBrands(){
    include "connection-pdo.php";

    $sql = "SELECT 
                b.brand_id, 
                b.brand_name, 
                b.supplier_id, 
                s.supplier_first_name, 
                s.supplier_last_name
            FROM brand b
            LEFT JOIN supplier s 
                ON b.supplier_id = s.supplier_id
            ORDER BY b.brand_name";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($rs);
}
    function insertBrand($json){
        include "connection-pdo.php";

        $json = json_decode($json, true);
        $sql = "INSERT INTO brand(brand_name, supplier_id) VALUES(:brand_name, :supplier_id)";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":brand_name", $json['brand_name']);
        $stmt->bindParam(":supplier_id", $json['supplier_id']);
        $stmt->execute();

        $returnValue = 0;
        if($stmt->rowCount() > 0){
            $returnValue = 1;
        }

        echo json_encode($returnValue);
    }

function getBrand($json){
    include "connection-pdo.php";
    $json = json_decode($json, true);

    $sql = "SELECT 
                b.brand_id, 
                b.brand_name, 
                b.supplier_id,
                s.supplier_first_name,
                s.supplier_last_name
            FROM brand b
            LEFT JOIN supplier s 
                ON b.supplier_id = s.supplier_id
            WHERE b.brand_id = :brandId";
    
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(":brandId", $json['brand_id']);
    $stmt->execute();
    $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($rs);
}

    function updateBrand($json){
        include "connection-pdo.php";

        $json = json_decode($json, true);
        $sql = "UPDATE brand SET brand_name = :brand_name, supplier_id = :supplier_id WHERE brand_id = :brandId";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":brand_name", $json['brand_name']);
        $stmt->bindParam(":supplier_id", $json['supplier_id']);
        $stmt->bindParam(":brandId", $json['brand_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    function deleteBrand($json){
        include "connection-pdo.php";
        $json = json_decode($json, true);

        $sql = "DELETE FROM brand WHERE brand_id = :brandId";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":brandId", $json['brand_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }
}

if ($_SERVER['REQUEST_METHOD'] == 'GET'){
    $operation = $_GET['operation'];
    $json = isset($_GET['json']) ? $_GET['json'] : "";
}else if($_SERVER['REQUEST_METHOD'] == 'POST'){
    $operation = $_POST['operation'];
    $json = isset($_POST['json']) ? $_POST['json'] : "";
}

$brand = new Brand();
switch($operation){
    case "getAllBrands":
        $brand->getAllBrands();
        break;
    case "insertBrand":
        $brand->insertBrand($json);
        break;
    case "getBrand":
        $brand->getBrand($json);
        break;
    case "updateBrand":
        $brand->updateBrand($json);
        break;
    case "deleteBrand":
        $brand->deleteBrand($json);
        break;
}
?>
