<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

include "connection-pdo.php";

class Product {
  private $conn;

  public function __construct($db) {
    $this->conn = $db;
  }

  public function getProducts() {
    $sql = "SELECT p.product_id, p.name, p.price, c.name AS category, b.name AS brand,
                   p.category_id, p.brand_id
            FROM product p
            INNER JOIN category c ON p.category_id = c.category_id
            INNER JOIN brand b ON p.brand_id = b.brand_id
            ORDER BY p.product_id DESC";
    $stmt = $this->conn->prepare($sql);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  }

  public function getProduct($json) {
    $data = json_decode($json, true);
    $sql = "SELECT * FROM product WHERE product_id = :id";
    $stmt = $this->conn->prepare($sql);
    $stmt->bindParam(":id", $data['id']);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  }

  public function insertProduct($json) {
    $data = json_decode($json, true);
    $sql = "INSERT INTO product (name, price, category_id, brand_id, supplier_id, created_by)
            VALUES (:name, :price, :category_id, :brand_id, 1, 'admin')";
    $stmt = $this->conn->prepare($sql);
    $stmt->bindParam(":name", $data['name']);
    $stmt->bindParam(":price", $data['price']);
    $stmt->bindParam(":category_id", $data['categoryId']);
    $stmt->bindParam(":brand_id", $data['brandId']);
    $stmt->execute();
    echo json_encode($stmt->rowCount() > 0 ? 1 : 0);
  }

  public function updateProduct($json) {
    $data = json_decode($json, true);
    $sql = "UPDATE product SET name = :name, price = :price, category_id = :category_id,
            brand_id = :brand_id WHERE product_id = :id";
    $stmt = $this->conn->prepare($sql);
    $stmt->bindParam(":name", $data['name']);
    $stmt->bindParam(":price", $data['price']);
    $stmt->bindParam(":category_id", $data['categoryId']);
    $stmt->bindParam(":brand_id", $data['brandId']);
    $stmt->bindParam(":id", $data['id']);
    $stmt->execute();
    echo json_encode($stmt->rowCount() > 0 ? 1 : 0);
  }

  public function getCategories() {
    $sql = "SELECT category_id AS id, name FROM category ORDER BY name";
    $stmt = $this->conn->prepare($sql);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  }

  public function getBrands() {
    $sql = "SELECT brand_id AS id, name FROM brand ORDER BY name";
    $stmt = $this->conn->prepare($sql);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  }

  public function insertCategory($json) {
    $data = json_decode($json, true);
    $sql = "INSERT INTO category (name) VALUES (:name)";
    $stmt = $this->conn->prepare($sql);
    $stmt->bindParam(":name", $data['name']);
    $stmt->execute();
    echo json_encode($stmt->rowCount() > 0 ? 1 : 0);
  }

  public function insertBrand($json) {
    $data = json_decode($json, true);
    $sql = "INSERT INTO brand (name) VALUES (:name)";
    $stmt = $this->conn->prepare($sql);
    $stmt->bindParam(":name", $data['name']);
    $stmt->execute();
    echo json_encode($stmt->rowCount() > 0 ? 1 : 0);
  }
}

// Entry point
$product = new Product($conn);

$operation = $_SERVER['REQUEST_METHOD'] === 'GET' ? $_GET['operation'] : $_POST['operation'];
$json = $_GET['json'] ?? ($_POST['json'] ?? '');

switch ($operation) {
  case "getProducts": $product->getProducts(); break;
  case "getProduct": $product->getProduct($json); break;
  case "insertProduct": $product->insertProduct($json); break;
  case "updateProduct": $product->updateProduct($json); break;
  case "getCategories": $product->getCategories(); break;
  case "getBrands": $product->getBrands(); break;
  case "insertCategory": $product->insertCategory($json); break;
  case "insertBrand": $product->insertBrand($json); break;
  default: echo json_encode(["error" => "Invalid operation"]);
}
?>
