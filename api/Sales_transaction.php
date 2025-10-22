<?php
// Set the content type to JSON and allow cross-origin requests
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

/**
 * Handles all database operations for the 'salestransaction' table.
 */
class SalesTransaction {

    /**
     * Retrieves all sales transactions.
     */
    function getAllSalesTransactions(){
        include "connection-pdo.php";

        $sql = "SELECT st.transaction_id, st.staff_id, st.terminal_id, st.date, st.total,
                       u.username AS staff_name
                FROM salestransaction st
                LEFT JOIN users u ON st.staff_id = u.user_id
                ORDER BY st.date DESC";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    /**
     * Inserts a new sales transaction.
     * @param string $json JSON string with transaction data.
     */
/**
 * Inserts a new sales transaction.
 * @param string $json JSON string with transaction data.
 */
function insertSalesTransaction($json){
    include "connection-pdo.php";

    // Accept raw JSON bodies too (Axios/fetch)
    if (!$json) {
        $raw = file_get_contents('php://input');
        if ($raw) $json = $raw;
    }

    try {
        $payload = json_decode($json, true);
        if (!is_array($payload)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON body']);
            return;
        }

        $staff_id    = (int)($payload['staff_id'] ?? 0);
        $terminal_id = (int)($payload['terminal_id'] ?? 0);
        $total       = (float)($payload['total'] ?? 0);
        $items       = $payload['items'] ?? [];

        if ($staff_id <= 0 || $terminal_id <= 0 || empty($items)) {
            http_response_code(422);
            echo json_encode(['error' => 'Missing staff_id, terminal_id, or items']);
            return;
        }

        // Always sell from MAIN STORE
        $sale_location_id = 1; // main_store

        $conn->beginTransaction();

        // 1) Lock and validate inventory at main_store
        $selInv = $conn->prepare("
            SELECT inventory_id, quantity
            FROM inventory
            WHERE product_id = :pid AND location_id = :loc
            FOR UPDATE
        ");
        $decInv = $conn->prepare("
            UPDATE inventory
               SET quantity = quantity - :qty
             WHERE inventory_id = :iid
        ");

        foreach ($items as $i => $it) {
            $pid = (int)($it['product_id'] ?? 0);
            $qty = (int)($it['quantity'] ?? 0);
            if ($pid <= 0 || $qty <= 0) {
                throw new Exception("Invalid item at index {$i}");
            }

            // fetch current on-hand @ main_store
            $selInv->execute([':pid' => $pid, ':loc' => $sale_location_id]);
            $inv = $selInv->fetch(PDO::FETCH_ASSOC);

            if (!$inv) {
                throw new Exception("No inventory row at main_store for product_id={$pid}");
            }
            if ((int)$inv['quantity'] < $qty) {
                throw new Exception("Insufficient stock at main_store for product_id={$pid}. On hand={$inv['quantity']}, requested={$qty}");
            }

            // decrement now to reserve
            $ok = $decInv->execute([':qty' => $qty, ':iid' => $inv['inventory_id']]);
            if (!$ok) {
                throw new Exception("Failed to decrement inventory for product_id={$pid}");
            }
        }

        // 2) Insert sales header (keep your NOW())
        $sql = "INSERT INTO salestransaction(staff_id, terminal_id, date, total)
                VALUES(:staff_id, :terminal_id, NOW(), :total)";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":staff_id", $staff_id);
        $stmt->bindParam(":terminal_id", $terminal_id);
        $stmt->bindParam(":total", $total);
        $stmt->execute();

        $transaction_id = (int)$conn->lastInsertId();
        if ($transaction_id <= 0) {
            throw new Exception("Failed to insert salestransaction header");
        }

        // 3) Insert transaction items (same table/columns you already use)
        $itemSql = "INSERT INTO transactionitem(transaction_id, product_id, quantity, price)
                    VALUES(:transaction_id, :product_id, :quantity, :price)";
        $itemStmt = $conn->prepare($itemSql);

        foreach ($items as $it) {
            $pid   = (int)$it['product_id'];
            $qty   = (int)$it['quantity'];
            $price = (float)$it['price'];
            $itemStmt->execute([
                ":transaction_id" => $transaction_id,
                ":product_id"     => $pid,
                ":quantity"       => $qty,
                ":price"          => $price
            ]);
        }

        // ✅ No more product.quantity updates — stock is tracked in inventory
// ✅ No more product.quantity updates — stock is tracked in inventory
$conn->commit();

/* Clean any accidental output from included files, then output JSON and stop */
if (ob_get_length()) { ob_clean(); }
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
  'status' => 1,
  'transaction_id' => $transaction_id
]);
exit; // ← IMPORTANT: prevents any trailing output like that extra "1"


        echo json_encode(1);

    } catch (Exception $e) {
        if ($conn->inTransaction()) $conn->rollBack();
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
    } catch (PDOException $e) {
        if ($conn->inTransaction()) $conn->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}


    /**
     * Retrieves a single sales transaction by ID.
     */
    function getSalesTransaction($json){
        include "connection-pdo.php";
        $json = json_decode($json, true);

        $sql = "SELECT st.transaction_id, st.staff_id, st.terminal_id, st.date, st.total,
                       u.username AS staff_name
                FROM salestransaction st
                LEFT JOIN users u ON st.staff_id = u.user_id
                WHERE st.transaction_id = :transaction_id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":transaction_id", $json['transaction_id']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    /**
     * Updates a sales transaction.
     */
    function updateSalesTransaction($json){
        include "connection-pdo.php";
        $json = json_decode($json, true);

        $sql = "UPDATE salestransaction 
                SET staff_id = :staff_id, terminal_id = :terminal_id, total = :total
                WHERE transaction_id = :transaction_id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":staff_id", $json['staff_id']);
        $stmt->bindParam(":terminal_id", $json['terminal_id']);
        $stmt->bindParam(":total", $json['total']);
        $stmt->bindParam(":transaction_id", $json['transaction_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    /**
     * Deletes a sales transaction.
     */
    function deleteSalesTransaction($json){
        include "connection-pdo.php";
        $json = json_decode($json, true);

        $sql = "DELETE FROM salestransaction WHERE transaction_id = :transaction_id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":transaction_id", $json['transaction_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }


    function deductStock($json) {
    include "connection-pdo.php";
    $data = json_decode($json, true);

    $productId = (int)($data['product_id'] ?? 0);
    $qty = (int)($data['quantity'] ?? 0);
    $storeId = 1; // always main store

    if ($productId <= 0 || $qty <= 0) {
        echo json_encode(["status" => "error", "message" => "Invalid data"]);
        return;
    }

    try {
        $stmt = $conn->prepare("
            UPDATE inventory 
            SET quantity = GREATEST(quantity - :qty, 0) 
            WHERE product_id = :pid AND location_id = :store
        ");
        $stmt->execute([
            ":qty" => $qty,
            ":pid" => $productId,
            ":store" => $storeId
        ]);

        echo json_encode(["status" => "success"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
function getStockForProducts($json){
        include "connection-pdo.php";
        $data = json_decode($json ?: "[]", true);
        $ids  = $data['product_ids'] ?? [];

        // normalize to ints and guard empty
        $ids = array_values(array_unique(array_map('intval', $ids)));
        if (empty($ids)) {
            echo json_encode([]);
            return;
        }

        // always main_store for POS (same assumption as insertSalesTransaction)
        $loc = 1;

        // build placeholders
        $ph = implode(',', array_fill(0, count($ids), '?'));
        $sql = "SELECT product_id, quantity 
                  FROM inventory 
                 WHERE location_id = ? AND product_id IN ($ph)";
        $stmt = $conn->prepare($sql);
        $stmt->execute(array_merge([$loc], $ids));
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // map to { product_id: quantity }
        $out = [];
        foreach ($rows as $r) {
            $out[(int)$r['product_id']] = (int)$r['quantity'];
        }

        // products with no row should be treated as 0
        foreach ($ids as $pid) {
            if (!isset($out[$pid])) $out[$pid] = 0;
        }

        echo json_encode($out);
    }
}

// Get operation and JSON data
$operation = '';
$json = '';
if ($_SERVER['REQUEST_METHOD'] == 'GET'){
    $operation = $_GET['operation'] ?? '';
    $json = $_GET['json'] ?? '';
} else if($_SERVER['REQUEST_METHOD'] == 'POST'){
    $operation = $_POST['operation'] ?? '';
    $json = $_POST['json'] ?? '';
}

// Dispatch operations
$sales = new SalesTransaction();
switch($operation){
    case "getAllSalesTransactions":
        $sales->getAllSalesTransactions();
        break;
    case "insertSalesTransaction":
        $sales->insertSalesTransaction($json);
        break;
    case "getSalesTransaction":
        $sales->getSalesTransaction($json);
        break;
    case "updateSalesTransaction":
        $sales->updateSalesTransaction($json);
        break;
    case "deleteSalesTransaction":
        $sales->deleteSalesTransaction($json);
        break;
    case "deductStock":
        $sales->deductStock($json);
    break;
    case "getStockForProducts":     $sales->getStockForProducts($json); break;   // 👈 new

    default:
        echo json_encode(["error" => "Invalid operation"]);
        break;
}
?>
