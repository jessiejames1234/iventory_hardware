<?php
// Set the content type to JSON and allow cross-origin requests
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

/**
 * Handles all database operations for the 'transactionitem' table.
 */
class TransactionItem {

    /**
     * Retrieves all transaction items from the database.
     */
    function getAllTransactionItems(){
        include "connection-pdo.php";

        $sql = "SELECT * FROM transactionitem ORDER BY order_id DESC";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    /**
     * Inserts a new transaction item into the database.
     * @param string $json A JSON string containing the new transaction item data.
     */
    function insertTransactionItem($json){
        include "connection-pdo.php";
        $json = json_decode($json, true);

        $sql = "INSERT INTO transactionitem(transaction_id, product_id, quantity, price) 
                VALUES(:transaction_id, :product_id, :quantity, :price)";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":transaction_id", $json['transaction_id']);
        $stmt->bindParam(":product_id", $json['product_id']);
        $stmt->bindParam(":quantity", $json['quantity']);
        $stmt->bindParam(":price", $json['price']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    /**
     * Retrieves a single transaction item based on order_id.
     * @param string $json A JSON string containing the order_id.
     */
    function getTransactionItem($json){
        include "connection-pdo.php";
        $json = json_decode($json, true);

        $sql = "SELECT * FROM transactionitem WHERE order_id = :order_id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":order_id", $json['order_id']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    /**
     * Updates an existing transaction item.
     * @param string $json A JSON string containing the updated data and order_id.
     */
    function updateTransactionItem($json){
        include "connection-pdo.php";
        $json = json_decode($json, true);

        $sql = "UPDATE transactionitem 
                SET transaction_id = :transaction_id, 
                    product_id = :product_id, 
                    quantity = :quantity, 
                    price = :price
                WHERE order_id = :order_id";

        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":transaction_id", $json['transaction_id']);
        $stmt->bindParam(":product_id", $json['product_id']);
        $stmt->bindParam(":quantity", $json['quantity']);
        $stmt->bindParam(":price", $json['price']);
        $stmt->bindParam(":order_id", $json['order_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    /**
     * Deletes a transaction item from the database.
     * @param string $json A JSON string containing the order_id.
     */
    function deleteTransactionItem($json){
        include "connection-pdo.php";
        $json = json_decode($json, true);

        $sql = "DELETE FROM transactionitem WHERE order_id = :order_id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":order_id", $json['order_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }
}

// Check the request method (GET or POST) and get the operation and JSON data
$operation = '';
$json = '';
if ($_SERVER['REQUEST_METHOD'] == 'GET'){
    $operation = isset($_GET['operation']) ? $_GET['operation'] : '';
    $json = isset($_GET['json']) ? $_GET['json'] : "";
} else if($_SERVER['REQUEST_METHOD'] == 'POST'){
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : "";
}

// Create a new TransactionItem object and call the appropriate method
$transactionItem = new TransactionItem();
switch($operation){
    case "getAllTransactionItems":
        $transactionItem->getAllTransactionItems();
        break;
    case "insertTransactionItem":
        $transactionItem->insertTransactionItem($json);
        break;
    case "getTransactionItem":
        $transactionItem->getTransactionItem($json);
        break;
    case "updateTransactionItem":
        $transactionItem->updateTransactionItem($json);
        break;
    case "deleteTransactionItem":
        $transactionItem->deleteTransactionItem($json);
        break;
    default:
        echo json_encode(["error" => "Invalid operation"]);
        break;
}
?>
