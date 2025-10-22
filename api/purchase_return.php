<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");

class PurchaseReturn {
  /* ===========================================================
     Utilities
     =========================================================== */
  private function staffLocationOrThrow($conn, $staff_id) {
    $q = $conn->prepare("SELECT location_id FROM staff WHERE staff_id=:sid");
    $q->execute([":sid" => (int)$staff_id]);
    $r = $q->fetch(PDO::FETCH_ASSOC);
    if (!$r || !$r['location_id']) throw new Exception("Invalid staff or no location.");
    return (int)$r['location_id'];
  }

  /* ===========================================================
     Simple lookups (same style as PO)
     =========================================================== */
  function getSuppliers() {
    include "connection-pdo.php";
    $sql = "SELECT supplier_id, name, company_name 
            FROM supplier 
            WHERE is_active = 1 
            ORDER BY name";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  }

  function getLocations() {
    include "connection-pdo.php";
    $sql = "SELECT location_id, location_name, type 
            FROM location 
            WHERE is_active = 1 
            ORDER BY location_name";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  }

  /* ===========================================================
     Products eligible for RETURN:
     - must belong to supplier
     - must have inventory > 0 at staff warehouse
     =========================================================== */
  function getProductsForReturn($json) {
    include "connection-pdo.php";
    $d = json_decode($json, true);
    $supplier_id = (int)($d['supplier_id'] ?? 0);
    $staff_id    = (int)($d['staff_id'] ?? 0);
    if ($supplier_id<=0 || $staff_id<=0) { echo json_encode([]); return; }

    $loc_id = $this->staffLocationOrThrow($conn, $staff_id);

    $sql = "SELECT p.product_id, p.product_name, p.model, p.cost_price,
                   i.quantity AS available_qty
            FROM product p
            INNER JOIN product_supplier ps ON ps.product_id = p.product_id
            INNER JOIN inventory i ON i.product_id = p.product_id
            WHERE ps.supplier_id = :sid
              AND i.location_id = :loc
              AND i.quantity > 0
            ORDER BY p.product_name";
    $st = $conn->prepare($sql);
    $st->execute([":sid"=>$supplier_id, ":loc"=>$loc_id]);
    echo json_encode($st->fetchAll(PDO::FETCH_ASSOC));
  }

  /* ===========================================================
     List all Purchase Returns (like GRN/PO tables)
     =========================================================== */
 function getAllPR() {
  include "connection-pdo.php";
  $sql = "SELECT
            r.purchase_return_id,
            r.reference_no,
            r.status,
            r.remarks,
            r.return_date,
            s.name AS supplier_name,
            l.location_name
          FROM purchase_return r
          INNER JOIN supplier s ON r.supplier_id = s.supplier_id
          INNER JOIN location l ON r.location_id = l.location_id
          ORDER BY r.return_date DESC";
  $stmt = $conn->prepare($sql);
  $stmt->execute();
  echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}


function getPR($json) {
  include "connection-pdo.php";
  $d = json_decode($json, true);
  $id = (int)($d['pr_id'] ?? $d['purchase_return_id'] ?? 0);

  $h = $conn->prepare("SELECT r.*, s.name AS supplier_name, l.location_name
                       FROM purchase_return r
                       INNER JOIN supplier s ON r.supplier_id = s.supplier_id
                       INNER JOIN location l ON r.location_id = l.location_id
                       WHERE r.purchase_return_id = :id");
  $h->execute([":id"=>$id]);
  $pr = $h->fetch(PDO::FETCH_ASSOC);
  if (!$pr) { echo json_encode(null); return; }

  $it = $conn->prepare("SELECT ri.*, p.product_name
                        FROM purchase_return_items ri
                        INNER JOIN product p ON ri.product_id = p.product_id
                        WHERE ri.purchase_return_id = :id");
  $it->execute([":id"=>$id]);
  $pr['items'] = $it->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode($pr);
}


  /* ===========================================================
     Create DRAFT return (reference_no = NULL)
     items: [{product_id, return_qty, unit_cost, line_note?}]
     =========================================================== */
function createPR($json) {
  include "connection-pdo.php";
  $d = json_decode($json, true);

  if (!$d || empty($d['supplier_id']) || empty($d['created_by']) || empty($d['items']) || !is_array($d['items'])) {
    echo json_encode(["success"=>0, "error"=>"Invalid payload"]); return;
  }

  try {
    $conn->beginTransaction();

    $supplier_id = (int)$d['supplier_id'];
    $staff_id    = (int)$d['created_by'];
    $remarks     = isset($d['remarks']) && $d['remarks'] !== '' ? $d['remarks'] : null;
    $loc_id      = $this->staffLocationOrThrow($conn, $staff_id);

    // status = pending (NOT draft)
    $insH = $conn->prepare("
      INSERT INTO purchase_return (supplier_id, location_id, created_by, status, reference_no, remarks)
      VALUES (:sid, :loc, :by, 'pending', 'PENDING', :rmk)
    ");
    $insH->execute([":sid"=>$supplier_id, ":loc"=>$loc_id, ":by"=>$staff_id, ":rmk"=>$remarks]);
    $pr_id = (int)$conn->lastInsertId();

    $ref_no = sprintf('PR-%04d', $pr_id);
    $conn->prepare("UPDATE purchase_return SET reference_no = :ref WHERE purchase_return_id = :id")
         ->execute([":ref"=>$ref_no, ":id"=>$pr_id]);

    $selAvail = $conn->prepare("SELECT i.quantity FROM inventory i WHERE i.product_id = :pid AND i.location_id = :loc FOR UPDATE");
    $insI = $conn->prepare("
      INSERT INTO purchase_return_items (purchase_return_id, product_id, return_qty, unit_cost, line_note)
      VALUES (:pr, :pid, :qty, :cost, :note)
    ");

    $lines = 0;
    foreach ($d['items'] as $it) {
      $pid  = (int)($it['product_id'] ?? 0);
      $qty  = (int)($it['return_qty'] ?? 0);
      $cost = (float)($it['unit_cost'] ?? 0);
      $note = (isset($it['line_note']) && $it['line_note'] !== '') ? $it['line_note'] : null;
      if ($pid <= 0 || $qty <= 0) continue;

      $selAvail->execute([":pid"=>$pid, ":loc"=>$loc_id]);
      $row   = $selAvail->fetch(PDO::FETCH_ASSOC);
      $avail = (int)($row['quantity'] ?? 0);
      if ($avail <= 0 || $qty > $avail) throw new Exception("Return qty exceeds available for product {$pid}.");

      $insI->execute([":pr"=>$pr_id, ":pid"=>$pid, ":qty"=>$qty, ":cost"=>$cost, ":note"=>$note]);
      $lines++;
    }
    if ($lines === 0) throw new Exception("No valid lines.");

    $conn->commit();
    echo json_encode(["success"=>1, "purchase_return_id"=>$pr_id, "reference_no"=>$ref_no, "status"=>"pending"]);
  } catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(["success"=>0, "error"=>$e->getMessage()]);
  }
}



  /* ===========================================================
     Update DRAFT items (replace lines)
     =========================================================== */
 function updatePRItems($json) {
  include "connection-pdo.php";
  $d = json_decode($json, true);
  $pr_id = (int)($d['pr_id'] ?? $d['purchase_return_id'] ?? 0);
  $items = $d['items'] ?? [];
  $remarks = $d['remarks'] ?? null;

  try {
    $conn->beginTransaction();

    $h = $conn->prepare("SELECT status, location_id FROM purchase_return WHERE purchase_return_id = :id FOR UPDATE");
    $h->execute([":id"=>$pr_id]);
    $r = $h->fetch(PDO::FETCH_ASSOC);
    if (!$r) throw new Exception("Purchase Return not found.");
    if ($r['status'] !== 'pending') throw new Exception("Only pending Purchase Returns can be edited.");

    $loc_id = (int)$r['location_id'];

    $conn->prepare("DELETE FROM purchase_return_items WHERE purchase_return_id = :id")->execute([":id"=>$pr_id]);

    $selAvail = $conn->prepare("SELECT quantity FROM inventory WHERE product_id = :pid AND location_id = :loc FOR UPDATE");
    $insI = $conn->prepare("
      INSERT INTO purchase_return_items (purchase_return_id, product_id, return_qty, unit_cost, line_note)
      VALUES (:pr, :pid, :qty, :cost, :note)
    ");

    $lines = 0;
    foreach ($items as $it) {
      $pid  = (int)($it['product_id'] ?? 0);
      $qty  = (int)($it['return_qty'] ?? 0);
      $cost = (float)($it['unit_cost'] ?? 0);
      $note = (isset($it['line_note']) && $it['line_note'] !== '') ? $it['line_note'] : null;
      if ($pid<=0 || $qty<=0) continue;

      $selAvail->execute([":pid"=>$pid, ":loc"=>$loc_id]);
      $row   = $selAvail->fetch(PDO::FETCH_ASSOC);
      $avail = (int)($row['quantity'] ?? 0);
      if ($avail <= 0 || $qty > $avail) throw new Exception("Return qty exceeds available for product {$pid}.");

      $insI->execute([":pr"=>$pr_id, ":pid"=>$pid, ":qty"=>$qty, ":cost"=>$cost, ":note"=>$note]);
      $lines++;
    }
    if ($lines===0) throw new Exception("No valid lines.");

    $conn->prepare("UPDATE purchase_return SET remarks = :r WHERE purchase_return_id = :id")
         ->execute([":r"=>$remarks, ":id"=>$pr_id]);

    $conn->commit();
    echo json_encode(["success"=>1]);
  } catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(["success"=>0, "error"=>$e->getMessage()]);
  }
}


  /* ===========================================================
     Confirm PR: deduct inventory, set status=confirmed, set reference_no if NULL
     =========================================================== */
function confirmPR($json) {
  include "connection-pdo.php";
  $d = json_decode($json, true);
  $pr_id = (int)($d['pr_id'] ?? $d['purchase_return_id'] ?? 0);

  try {
    $conn->beginTransaction();

    $h = $conn->prepare("SELECT * FROM purchase_return WHERE purchase_return_id = :id FOR UPDATE");
    $h->execute([":id"=>$pr_id]);
    $pr = $h->fetch(PDO::FETCH_ASSOC);
    if (!$pr) throw new Exception("Purchase Return not found.");
    if (strtolower($pr['status']) !== 'pending') throw new Exception("Only pending PR can be confirmed.");

    // ensure reference number exists
    $ref = $pr['reference_no'];
    if (!$ref || $ref==='') {
      $ref = sprintf('PR-%04d', $pr_id);
      $conn->prepare("UPDATE purchase_return SET reference_no = :r WHERE purchase_return_id = :id")
           ->execute([":r"=>$ref, ":id"=>$pr_id]);
    }

    // NOTE: no inventory deduction here anymore
    $conn->prepare("UPDATE purchase_return SET status = 'confirmed' WHERE purchase_return_id = :id")
         ->execute([":id"=>$pr_id]);

    $conn->commit();
    echo json_encode(["success"=>1, "reference_no"=>$ref, "new_status"=>"confirmed"]);
  } catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(["success"=>0, "error"=>$e->getMessage()]);
  }
}
function markReturned($json) {
  include "connection-pdo.php";
  $d = json_decode($json, true);
  $pr_id = (int)($d['pr_id'] ?? $d['purchase_return_id'] ?? 0);

  try {
    $conn->beginTransaction();

    // must be confirmed to proceed
    $h = $conn->prepare("SELECT * FROM purchase_return WHERE purchase_return_id = :id FOR UPDATE");
    $h->execute([":id"=>$pr_id]);
    $pr = $h->fetch(PDO::FETCH_ASSOC);
    if (!$pr) throw new Exception("Purchase Return not found.");

    $status = strtolower($pr['status']);
    if ($status === 'returned') {
      // idempotent: already done; do nothing
      $conn->commit();
      echo json_encode(["success"=>1, "message"=>"Already returned", "new_status"=>"returned"]);
      return;
    }
    if ($status !== 'confirmed') throw new Exception("Only confirmed PR can be marked as returned.");

    $loc_id = (int)$pr['location_id'];

    // must have items
    $it = $conn->prepare("SELECT * FROM purchase_return_items WHERE purchase_return_id = :id");
    $it->execute([":id"=>$pr_id]);
    $items = $it->fetchAll(PDO::FETCH_ASSOC);
    if (!$items) throw new Exception("No items to return.");

    // deduct inventory
    $selInv = $conn->prepare("SELECT inventory_id, quantity FROM inventory WHERE product_id = :pid AND location_id = :loc FOR UPDATE");
    $updInv = $conn->prepare("UPDATE inventory SET quantity = quantity - :qx WHERE inventory_id = :id");

    foreach ($items as $line) {
      $pid = (int)$line['product_id'];
      $qx  = (int)$line['return_qty'];
      if ($pid<=0 || $qx<=0) continue;

      $selInv->execute([":pid"=>$pid, ":loc"=>$loc_id]);
      $inv = $selInv->fetch(PDO::FETCH_ASSOC);
      $avail = (int)($inv['quantity'] ?? 0);
      if (!$inv || $avail < $qx) throw new Exception("Insufficient stock for product {$pid}.");
      $updInv->execute([":qx"=>$qx, ":id"=>$inv['inventory_id']]);
    }

    // set status returned
    $conn->prepare("UPDATE purchase_return SET status = 'returned' WHERE purchase_return_id = :id")
         ->execute([":id"=>$pr_id]);

    $conn->commit();
    echo json_encode(["success"=>1, "new_status"=>"returned"]);
  } catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(["success"=>0, "error"=>$e->getMessage()]);
  }
}


}

/* =============================================================
   Router
   ============================================================= */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $operation = $_GET['operation'] ?? '';
  $json = $_GET['json'] ?? '';
} else {
  $operation = $_POST['operation'] ?? '';
  $json = $_POST['json'] ?? '';
}

$api = new PurchaseReturn();
switch ($operation) {
  case "getSuppliers":          $api->getSuppliers(); break;
  case "getLocations":          $api->getLocations(); break;
  case "getProductsForReturn":  $api->getProductsForReturn($json); break;

  case "getAllPR":              $api->getAllPR(); break;
  case "getPR":                 $api->getPR($json); break;
  case "createPR":              $api->createPR($json); break;
  case "updatePRItems":         $api->updatePRItems($json); break;
  case "confirmPR":             $api->confirmPR($json); break;
  case "markReturned":$api->markReturned($json); break;   // 👈 add this
}
