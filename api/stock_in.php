<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

include "connection-pdo.php";

class StockIn {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    // ---------------------------
    // Get grouped stock-in (by date_created + supplier)
    // ---------------------------
public function getAllStockIn($warehouseId = null, $role = null) {
    $sql = "SELECT 
              po.date_created,
              s.supplier_id,
              s.name AS supplier_name,
              COUNT(DISTINCT poi.product_id) AS total_items,
              COALESCE(SUM(poi.ordered_qty),0) AS total_quantity,
              po.status
            FROM purchase_order po
            JOIN supplier s ON s.supplier_id = po.supplier_id
            LEFT JOIN purchase_order_items poi ON poi.po_id = po.po_id
            WHERE 1=1";
    $p = [];
    if ($role === 'warehouse_manager' && $warehouseId) {
        $sql .= " AND po.location_id = :loc";
        $p[":loc"] = (int)$warehouseId; // manager's location
    }
    $sql .= " GROUP BY po.date_created, s.supplier_id, s.name, po.status
              ORDER BY po.date_created DESC";
    $st = $this->conn->prepare($sql); $st->execute($p);
    echo json_encode($st->fetchAll(PDO::FETCH_ASSOC));
}


    // ---------------------------
    // Insert single stock_in (keeps date_created to DB default)
    // ---------------------------
    public function insertStockIn($json, $userRole, $assignedWarehouseId) {
        $data = json_decode($json, true);

        if ($userRole !== "warehouse_manager") {
            echo json_encode(["status" => "error", "message" => "Only warehouse managers can stock in"]);
            return;
        }

        $warehouseId = (int)$assignedWarehouseId;

        $sql = "INSERT INTO stock_in (product_id, supplier_id, warehouse_id, quantity, received_by, status)
                VALUES (:productId, :supplierId, :warehouseId, :quantity, :staffId, 'pending')";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ":productId"   => (int)$data['productId'],
            ":supplierId"  => (int)$data['supplierId'],
            ":warehouseId" => $warehouseId,
            ":quantity"    => (int)$data['quantity'],
            ":staffId"     => (int)$data['staffId']
        ]);

        echo json_encode(["status" => "success"]);
    }

    // ---------------------------
    // Get suppliers that supply a product
    // ---------------------------
    public function getSuppliersByProduct($productId) {
        $sql = "SELECT s.supplier_id, s.name AS supplier_name
                FROM product_supplier ps
                INNER JOIN supplier s ON ps.supplier_id = s.supplier_id
                WHERE ps.product_id = :pid";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":pid" => (int)$productId]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // ---------------------------
    // Update single stock_in status (existing behaviour)
    // If status == 'delivered', set date_received (if null) and update inventory & product
    // ---------------------------
    public function updateStatus($json) {
        $data = json_decode($json, true);
        $stockInId = (int)$data['stockInId'];
        $status    = $data['status'];

        if ($status === "delivered") {
            // update status + set date_received = NOW() if null
            $sql = "UPDATE stock_in 
                    SET status = :status, 
                        date_received = CASE WHEN date_received IS NULL THEN NOW() ELSE date_received END
                    WHERE stock_in_id = :sid";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([":status" => $status, ":sid" => $stockInId]);
        } else {
            // just update status
            $sql = "UPDATE stock_in SET status = :status WHERE stock_in_id = :sid";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([":status" => $status, ":sid" => $stockInId]);
        }

        // If delivered, update inventory & product.quantity for that single row
        if ($status === "delivered") {
            $sql = "SELECT product_id, warehouse_id, quantity 
                    FROM stock_in 
                    WHERE stock_in_id = :sid";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([":sid" => $stockInId]);
            $stockIn = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($stockIn) {
                $pid = (int)$stockIn['product_id'];
                $wid = (int)$stockIn['warehouse_id'];
                $qty = (int)$stockIn['quantity'];

                // update warehouse inventory
                $sql = "INSERT INTO inventory (warehouse_id, product_id, quantity)
                        VALUES (:wid, :pid, :qty)
                        ON DUPLICATE KEY UPDATE quantity = quantity + :qty";
                $stmt = $this->conn->prepare($sql);
                $stmt->execute([":wid" => $wid, ":pid" => $pid, ":qty" => $qty]);

                // update global product stock
                $sql = "UPDATE product 
                        SET quantity = quantity + :qty 
                        WHERE product_id = :pid";
                $stmt = $this->conn->prepare($sql);
                $stmt->execute([":qty" => $qty, ":pid" => $pid]);
            }
        }

        echo json_encode(["status" => "success"]);
    }

    // ---------------------------
    // Get all products (id + name)
    // ---------------------------
    public function getAllProducts() {
        $sql = "SELECT product_id, product_name FROM product ORDER BY product_name ASC";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // ---------------------------
    // Get all suppliers
    // ---------------------------
    public function getAllSuppliers() {
        $sql = "SELECT supplier_id, name AS supplier_name 
                FROM supplier 
                ORDER BY name";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // ---------------------------
    // Get products by supplier (includes cost_price)
    // ---------------------------
    public function getProductsBySupplier($supplierId) {
        $sql = "SELECT p.product_id, p.product_name, p.cost_price
                FROM product_supplier ps
                INNER JOIN product p ON p.product_id = ps.product_id
                WHERE ps.supplier_id = :sid
                ORDER BY p.product_name";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([":sid" => (int)$supplierId]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // ---------------------------
    // Batch insert stock_in rows (pending). date_created is DB default.
    // ---------------------------
    public function insertStockInBatch($json, $userRole, $assignedWarehouseId, $staffId) {
    if ($userRole !== "warehouse_manager") {
        echo json_encode(["status"=>"error","message"=>"Only warehouse managers can stock in"]); return;
    }
    $data = json_decode($json, true);
    if (!$data || empty($data['supplierId']) || !is_array($data['items'])) {
        echo json_encode(["status"=>"error","message"=>"Invalid payload"]); return;
    }

    $supplierId = (int)$data['supplierId'];
    $locationId = (int)$assignedWarehouseId; // map your manager's warehouse to new location_id
    $createdBy  = (int)$staffId;

    try {
        $this->conn->beginTransaction();

        // PO header
        $poNumber = "PO-" . date("Ymd") . "-" . strtoupper(substr(md5(uniqid("", true)), 0, 6));
        $sql = "INSERT INTO purchase_order (supplier_id, location_id, po_number, status, created_by)
                VALUES (:sid, :loc, :po, 'draft', :cb)";
        $st = $this->conn->prepare($sql);
        $st->execute([":sid"=>$supplierId, ":loc"=>$locationId, ":po"=>$poNumber, ":cb"=>$createdBy]);
        $poId = (int)$this->conn->lastInsertId();

        // PO items
        $sql = "INSERT INTO purchase_order_items (po_id, product_id, ordered_qty, unit_cost, received_qty)
                VALUES (:po,:pid,:qty,:cost,0)";
        $sti = $this->conn->prepare($sql);

        foreach ($data['items'] as $it) {
            $pid  = (int)($it['productId'] ?? 0);
            $qty  = max(0,(int)($it['qty'] ?? 0));
            $cost = (float)($it['cost'] ?? 0);
            if ($pid<=0 || $qty<=0) continue;
            $sti->execute([":po"=>$poId, ":pid"=>$pid, ":qty"=>$qty, ":cost"=>$cost]);
        }

        $this->conn->commit();
        echo json_encode(["status"=>"success","po_id"=>$poId,"po_number"=>$poNumber]);
    } catch (Exception $e) {
        if ($this->conn->inTransaction()) $this->conn->rollBack();
        echo json_encode(["status"=>"error","message"=>"PO create failed","error"=>$e->getMessage()]);
    }
}


    // ---------------------------
    // Update whole batch status by date_created + supplier
    // When marking as delivered, update date_received and also update inventory/product for every row in the batch.
    // ---------------------------
public function updateBatchStatus($json) {
    $d = json_decode($json, true);
    $dateCreated = $d['dateCreated'] ?? '';
    $supplierId  = (int)($d['supplierId'] ?? 0);
    $status      = $d['status'] ?? '';

    if (!$dateCreated || $supplierId<=0) { echo json_encode(["status"=>"error","message"=>"Invalid data"]); return; }

    try {
        $this->conn->beginTransaction();

        // Find the PO for that group
        $sql = "SELECT po_id, location_id FROM purchase_order
                WHERE supplier_id=:sid AND DATE(date_created)=DATE(:dc)
                ORDER BY po_id DESC LIMIT 1";
        $st = $this->conn->prepare($sql);
        $st->execute([":sid"=>$supplierId, ":dc"=>$dateCreated]);
        $po = $st->fetch(PDO::FETCH_ASSOC);
        if (!$po) { throw new Exception("PO not found for batch"); }
        $poId = (int)$po['po_id']; $locId = (int)$po['location_id'];

        if ($status === "delivered") {
            // 1) Create GRN (draft→confirmed)
            $ref = "GRN-" . date("Ymd") . "-" . strtoupper(substr(md5(uniqid("", true)), 0, 6));
            $sql = "INSERT INTO goods_received_notes (po_id, supplier_id, location_id, received_by, status, reference_no)
                    VALUES (:po,:sid,:loc,:rb,'confirmed',:ref)";
            $ins = $this->conn->prepare($sql);
            $ins->execute([":po"=>$poId, ":sid"=>$supplierId, ":loc"=>$locId, ":rb"=>1, ":ref"=>$ref]); // TODO: map to real staff

            $grnId = (int)$this->conn->lastInsertId();

            // 2) Copy PO lines into GRN items and bump inventory
            $sql = "SELECT product_id, ordered_qty, unit_cost FROM purchase_order_items WHERE po_id=:po";
            $li  = $this->conn->prepare($sql); $li->execute([":po"=>$poId]);
            $rows = $li->fetchAll(PDO::FETCH_ASSOC);

            $insItem = $this->conn->prepare(
                "INSERT INTO goods_received_items (grn_id, product_id, received_qty, unit_cost)
                 VALUES (:grn,:pid,:qty,:cost)"
            );

            foreach ($rows as $r) {
                $pid  = (int)$r['product_id'];
                $qty  = (int)$r['ordered_qty'];
                $cost = (float)$r['unit_cost'];
                if ($qty <= 0) continue;

                // insert GRN item
                $insItem->execute([":grn"=>$grnId, ":pid"=>$pid, ":qty"=>$qty, ":cost"=>$cost]);

                // update inventory(location_id) and (optionally) product.quantity
                $sql = "INSERT INTO inventory (location_id, product_id, quantity)
                        VALUES (:loc,:pid,:qty)
                        ON DUPLICATE KEY UPDATE quantity = quantity + :qty";
                $u = $this->conn->prepare($sql);
                $u->execute([":loc"=>$locId, ":pid"=>$pid, ":qty"=>$qty]);

                $sql = "UPDATE product SET quantity = quantity + :qty WHERE product_id = :pid";
                $u2 = $this->conn->prepare($sql);
                $u2->execute([":qty"=>$qty, ":pid"=>$pid]);
            }

            // 3) Update PO status
            $this->conn->prepare("UPDATE purchase_order SET status='received' WHERE po_id=:po")
                       ->execute([":po"=>$poId]);
        } else {
            // other statuses map directly to PO status
            $this->conn->prepare("UPDATE purchase_order SET status=:st WHERE po_id=:po")
                       ->execute([":st"=>$status, ":po"=>$poId]);
        }

        $this->conn->commit();
        echo json_encode(["status"=>"success"]);
    } catch (Exception $e) {
        if ($this->conn->inTransaction()) $this->conn->rollBack();
        echo json_encode(["status"=>"error","message"=>"Batch update failed","error"=>$e->getMessage()]);
    }
}


    // ---------------------------
    // Get details for a specific batch (date_created + supplier)
    // ---------------------------
public function getBatchDetails($dateCreated, $supplierId, $warehouseId = null) {
    $sql = "SELECT poi.po_item_id,
                   p.product_name,
                   poi.ordered_qty AS quantity,
                   poi.unit_cost   AS cost_price,
                   po.status
            FROM purchase_order po
            JOIN purchase_order_items poi ON poi.po_id = po.po_id
            JOIN product p ON p.product_id = poi.product_id
            WHERE po.supplier_id = :sid AND DATE(po.date_created) = DATE(:dc)";
    $p = [":sid" => (int)$supplierId, ":dc" => $dateCreated];
    if ($warehouseId) { $sql .= " AND po.location_id = :loc"; $p[":loc"]=(int)$warehouseId; }

    $sql .= " ORDER BY poi.po_item_id ASC";
    $st = $this->conn->prepare($sql); $st->execute($p);
    echo json_encode($st->fetchAll(PDO::FETCH_ASSOC));
}


// ------------------ API Router ------------------
$stockIn = new StockIn($conn);

$operation = $_POST['operation'] ?? $_GET['operation'] ?? '';
$json      = $_POST['json'] ?? $_GET['json'] ?? '';

switch ($operation) {
    case "getAllStockIn":
        $role = $_POST['role'] ?? $_GET['role'] ?? '';
        $wid  = $_POST['warehouse_id'] ?? $_GET['warehouse_id'] ?? null;
        $stockIn->getAllStockIn($wid, $role);
        break;

    case "insertStockIn":
        $role = $_POST['role'] ?? $_GET['role'] ?? '';
        $assignedWarehouseId = $_POST['assigned_warehouse_id'] ?? $_GET['assigned_warehouse_id'] ?? null;
        $stockIn->insertStockIn($json, $role, $assignedWarehouseId);
        break;

    case "getSuppliersByProduct":
        $pid = $_GET['product_id'] ?? 0;
        $stockIn->getSuppliersByProduct($pid);
        break;

    case "updateStatus":
        $stockIn->updateStatus($_POST['json'] ?? $_GET['json'] ?? '');
        break;

    case "getAllProducts":
        $stockIn->getAllProducts();
        break;

    case "getAllSuppliers":
        $stockIn->getAllSuppliers();
        break;

    case "getProductsBySupplier":
        $sid = $_GET['supplier_id'] ?? 0;
        $stockIn->getProductsBySupplier((int)$sid);
        break;

    case "insertStockInBatch":
        $role = $_POST['role'] ?? $_GET['role'] ?? '';
        $assignedWarehouseId = $_POST['assigned_warehouse_id'] ?? $_GET['assigned_warehouse_id'] ?? null;
        $staffId = $_POST['staff_id'] ?? $_GET['staff_id'] ?? null;
        $stockIn->insertStockInBatch($json, $role, $assignedWarehouseId, $staffId);
        break;

    case "updateBatchStatus":
        $stockIn->updateBatchStatus($_POST['json'] ?? $_GET['json'] ?? '');
        break;

    case "getBatchDetails":
        $date = $_GET['date_created'] ?? '';
        $sid  = $_GET['supplier_id'] ?? 0;
        $wid  = $_GET['warehouse_id'] ?? null;
        $stockIn->getBatchDetails($date, (int)$sid, $wid);
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Invalid operation"]);
}
