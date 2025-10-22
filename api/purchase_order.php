  <?php
  header('Content-Type: application/json');
  header("Access-Control-Allow-Origin: *");

  class PurchaseOrder {
private function mergeItemsByProduct(array $items): array {
  $acc = [];
  foreach ($items as $it) {
    $pid = (int)($it['product_id'] ?? 0);
    $qty = (int)($it['ordered_qty'] ?? 0);
    $cost = (float)($it['unit_cost'] ?? 0);
    if ($pid <= 0 || $qty <= 0) continue;
    if (!isset($acc[$pid])) {
      $acc[$pid] = ['product_id'=>$pid, 'ordered_qty'=>$qty, 'unit_cost'=>$cost];
    } else {
      // merge rule: sum qty, keep most-recent cost
      $acc[$pid]['ordered_qty'] += $qty;
      $acc[$pid]['unit_cost'] = $cost;
    }
  }
  return array_values($acc);
}


    
  function getAllPO() {
    include "connection-pdo.php";
    $sql = "SELECT po.*, s.name AS supplier_name, s.company_name, l.location_name,
                  st.name AS created_by_name
            FROM purchase_order po
            INNER JOIN supplier s ON po.supplier_id = s.supplier_id
            INNER JOIN location l ON po.location_id = l.location_id
            LEFT JOIN staff st ON po.created_by = st.staff_id
            ORDER BY po.date_created DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  }






  // 2) insertPO: force status=pending, auto-PO number = PO-#### (uses new ID)
  function insertPO($json) {
    include "connection-pdo.php";
    $data = json_decode($json, true);

    try {
      $conn->beginTransaction();

      // get manager's warehouse
  // get manager's warehouse
  $staff_id = (int)$data['created_by'];

  $q = $conn->prepare("SELECT location_id FROM staff WHERE staff_id=:sid");
  $q->execute([":sid" => $staff_id]);
  $st = $q->fetch(PDO::FETCH_ASSOC);
  if (!$st || !$st['location_id']) throw new Exception("Invalid staff or no location.");


      // insert header with placeholder number + pending status
      $ins = $conn->prepare("
        INSERT INTO purchase_order (supplier_id, location_id, po_number, status, created_by)
        VALUES (:supplier_id, :location_id, 'PENDING', 'pending', :created_by)
      ");
      $ins->execute([
        ":supplier_id" => (int)$data['supplier_id'],
        ":location_id" => (int)$st['location_id'],
        ":created_by"  => $staff_id
      ]);
      $po_id = (int)$conn->lastInsertId();

      // set final PO number = PO-#### using new id
      $po_number = "PO-".str_pad($po_id, 4, "0", STR_PAD_LEFT);
      $upNum = $conn->prepare("UPDATE purchase_order SET po_number=:no WHERE po_id=:id");
      $upNum->execute([":no"=>$po_number, ":id"=>$po_id]);

      // insert items
      $itm = $conn->prepare("
        INSERT INTO purchase_order_items (po_id, product_id, ordered_qty, unit_cost)
        VALUES (:po_id, :pid, :qty, :cost)
      ");
// ...
// $data = json_decode($json, true);
// ...
$items = is_array($data['items'] ?? null) ? $this->mergeItemsByProduct($data['items']) : [];
// ...
foreach ($items as $it) {
  $itm->execute([
    ":po_id" => $po_id,
    ":pid"   => (int)$it['product_id'],
    ":qty"   => (int)$it['ordered_qty'],
    ":cost"  => (float)$it['unit_cost'],
  ]);
}


      $conn->commit();
      echo json_encode(["success"=>1, "po_id"=>$po_id, "po_number"=>$po_number]);
    } catch (Exception $e) {
      $conn->rollBack();
      echo json_encode(["success"=>0, "error"=>$e->getMessage()]);
    }
  }



  function getPO($json) {
    include "connection-pdo.php";
    $data = json_decode($json, true);

    $sql = "SELECT po.*, s.name AS supplier_name, l.location_name, st.name AS created_by_name
            FROM purchase_order po
            INNER JOIN supplier s ON po.supplier_id = s.supplier_id
            INNER JOIN location l ON po.location_id = l.location_id
            INNER JOIN staff   st ON po.created_by = st.staff_id
            WHERE po.po_id = :po_id";
    $stmt = $conn->prepare($sql);
    $stmt->execute([":po_id" => (int)$data['po_id']]);
    $po = $stmt->fetch(PDO::FETCH_ASSOC);

    $sql2 = "SELECT poi.*, p.product_name
            FROM purchase_order_items poi
            INNER JOIN product p ON poi.product_id = p.product_id
            WHERE poi.po_id = :po_id";
    $stmt2 = $conn->prepare($sql2);
    $stmt2->execute([":po_id" => (int)$data['po_id']]);
    $po['items'] = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($po);
  }



  function updatePOStatus($json) {
    include "connection-pdo.php";
    $data = json_decode($json, true);

    $po_id = isset($data['po_id']) ? (int)$data['po_id'] : 0;
    if ($po_id <= 0) { echo json_encode(["success"=>0, "error"=>"Invalid PO id"]); return; }

    // normalize / migrate old status
    $status = strtolower(trim($data['status'] ?? ''));
    if ($status === 'sent') { $status = 'pending'; }  // 👈 old tabs / cached JS safety

    $allowed = ['pending','approved','partially_received','received','cancelled'];
    if (!in_array($status, $allowed, true)) {
      echo json_encode(["success"=>0, "error"=>"Invalid status"]);
      return;
    }

    try {
      // get current status
      $curStmt = $conn->prepare("SELECT status FROM purchase_order WHERE po_id = :id");
      $curStmt->execute([":id"=>$po_id]);
      $current = $curStmt->fetchColumn();
      if ($current === false) { echo json_encode(["success"=>0, "error"=>"PO not found"]); return; }

      // if nothing to change, still report success
      if ($current === $status) {
        echo json_encode(["success"=>1, "message"=>"Status unchanged", "new_status"=>$status]);
        return;
      }

      // optional: enforce transition rules here if you want

      $upd = $conn->prepare("UPDATE purchase_order SET status = :s WHERE po_id = :id");
      $upd->execute([":s"=>$status, ":id"=>$po_id]);

      // rowCount can be 0 depending on MySQL settings, so just return success if no error thrown
      echo json_encode(["success"=>1, "new_status"=>$status]);
    } catch (Exception $e) {
      echo json_encode(["success"=>0, "error"=>$e->getMessage()]);
    }
  }

    // 🔹 New: fetch suppliers for dropdown
    function getSuppliers() {
      include "connection-pdo.php";
      $sql = "SELECT supplier_id, name, company_name 
              FROM supplier 
              WHERE is_active = 1 
              ORDER BY name";
      $stmt = $conn->prepare($sql);
      $stmt->execute();
      $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
      echo json_encode($rs);
    }

    // 🔹 New: fetch locations for dropdown
    function getLocations() {
      include "connection-pdo.php";
      $sql = "SELECT location_id, location_name, type 
              FROM location 
              WHERE is_active = 1 
              ORDER BY location_name";
      $stmt = $conn->prepare($sql);
      $stmt->execute();
      $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
      echo json_encode($rs);
    }

  function getProductsBySupplier($json) {
      include "connection-pdo.php";
      $json = json_decode($json, true);

      $sql = "SELECT p.product_id, p.product_name, p.model, p.cost_price
              FROM product p
              INNER JOIN product_supplier ps ON p.product_id = ps.product_id
              WHERE ps.supplier_id = :supplier_id
              ORDER BY p.product_name";
      $stmt = $conn->prepare($sql);
      $stmt->execute([":supplier_id" => $json['supplier_id']]);
      $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
      echo json_encode($rs);
  }

  function createGRN($json) {
    include "connection-pdo.php";
    $data = json_decode($json, true);

    if (!$data || empty($data['po_id']) || empty($data['items']) || !is_array($data['items'])) {
      echo json_encode(["success" => 0, "error" => "Invalid payload"]);
      return;
    }
  // Prevent multiple drafts for same PO
  $existing = $conn->prepare("
    SELECT grn_id FROM goods_received_notes
    WHERE po_id = :po_id AND status = 'draft' LIMIT 1
  ");
  $existing->execute([":po_id" => $data['po_id']]);
  if ($existing->fetch(PDO::FETCH_ASSOC)) {
    echo json_encode([
      "success" => 0,
      "error"   => "A draft GRN already exists for this PO. Please edit or confirm it first."
    ]);
    return;
  }

    try {
      $conn->beginTransaction();

      // Lock PO
      $stmt = $conn->prepare("
        SELECT po_id, supplier_id, location_id, status
        FROM purchase_order
        WHERE po_id = :po_id
        FOR UPDATE
      ");
      $stmt->execute([":po_id" => $data['po_id']]);
      $po = $stmt->fetch(PDO::FETCH_ASSOC);
      if (!$po) throw new Exception("PO not found.");
      if (!in_array($po['status'], ['approved','partially_received'])) {
        throw new Exception("PO must be approved/partially_received.");
      }
      if (!empty($data['supplier_id']) && $data['supplier_id'] != $po['supplier_id']) throw new Exception("Supplier mismatch.");
      if (!empty($data['location_id']) && $data['location_id'] != $po['location_id']) throw new Exception("Location mismatch.");

      // 1) Insert GRN header as DRAFT (empty reference_no)
      $stmt = $conn->prepare("
INSERT INTO goods_received_notes
  (po_id, supplier_id, location_id, received_by, status, remarks)
VALUES
  (:po_id, :supplier_id, :location_id, :received_by, 'draft', :remarks)

      ");
      $stmt->execute([
        ":po_id"       => $po['po_id'],
        ":supplier_id" => $po['supplier_id'],
        ":location_id" => $po['location_id'],
        ":received_by" => $data['received_by'],
        ":remarks"     => !empty($data['remarks']) ? $data['remarks'] : null,
      ]);
      $grn_id = (int)$conn->lastInsertId();

      // 2) Insert draft items (validate against remaining)
      $getItem = $conn->prepare("
        SELECT po_item_id, ordered_qty, received_qty, unit_cost
        FROM purchase_order_items
        WHERE po_id = :po_id AND product_id = :product_id
        FOR UPDATE
      ");
      $insGRNItem = $conn->prepare("
        INSERT INTO goods_received_items (grn_id, product_id, received_qty, unit_cost, line_note)
        VALUES (:grn_id, :product_id, :received_qty, :unit_cost, :line_note)
      ");

      $linesSaved = 0;
      foreach ($data['items'] as $line) {
        $product_id   = (int)($line['product_id'] ?? 0);
        $received_now = (int)($line['received_qty'] ?? 0);
        if ($product_id <= 0 || $received_now <= 0) continue;

        $getItem->execute([":po_id" => $po['po_id'], ":product_id" => $product_id]);
        $poi = $getItem->fetch(PDO::FETCH_ASSOC);
        if (!$poi) throw new Exception("Product {$product_id} not found on this PO.");

        $remaining = (int)$poi['ordered_qty'] - (int)$poi['received_qty'];
        if ($received_now > $remaining) throw new Exception("Received > remaining for product {$product_id}.");

        $unit_cost = isset($line['unit_cost']) ? (float)$line['unit_cost'] : (float)$poi['unit_cost'];
        $line_note = isset($line['line_note']) && $line['line_note'] !== '' ? $line['line_note'] : null;

        $insGRNItem->execute([
          ":grn_id"       => $grn_id,
          ":product_id"   => $product_id,
          ":received_qty" => $received_now,
          ":unit_cost"    => $unit_cost,
          ":line_note"    => $line_note
        ]);
        $linesSaved++;
      }
      if ($linesSaved === 0) throw new Exception("No valid lines to save.");

      // 3) Keep status DRAFT; reference_no set on confirm
      $conn->commit();
      echo json_encode(["success" => 1, "grn_id" => $grn_id, "status" => "draft"]);
    } catch (Exception $e) {
      $conn->rollBack();
      echo json_encode(["success" => 0, "error" => $e->getMessage()]);
    }
  }

  // Save (replace) items for a PENDING PO
  // inside class PurchaseOrder
  function savePOItems($json) {
    include "connection-pdo.php";
    $d = json_decode($json, true);

    try {
      $conn->beginTransaction();

      $po_id = (int)($d['po_id'] ?? 0);
      if ($po_id <= 0) throw new Exception("Invalid po_id.");

      // Only allow editing while pending
      $st = $conn->prepare("SELECT status FROM purchase_order WHERE po_id = :id");
      $st->execute([":id" => $po_id]);
      $row = $st->fetch(PDO::FETCH_ASSOC);
      if (!$row) throw new Exception("PO not found.");
      if ($row['status'] !== 'pending') throw new Exception("Only pending POs can be edited.");

      // Clear old items and insert new set
      $conn->prepare("DELETE FROM purchase_order_items WHERE po_id = :id")
          ->execute([":id" => $po_id]);

$merged = is_array($d['items'] ?? null) ? $this->mergeItemsByProduct($d['items']) : [];
if (count($merged) === 0) throw new Exception("No items to save.");

$ins = $conn->prepare("INSERT INTO purchase_order_items (po_id, product_id, ordered_qty, unit_cost)
                       VALUES (:po,:pid,:qty,:cost)");
foreach ($merged as $it) {
  $ins->execute([
    ":po"   => $po_id,
    ":pid"  => (int)$it['product_id'],
    ":qty"  => (int)$it['ordered_qty'],
    ":cost" => (float)$it['unit_cost'],
  ]);
}


      $conn->commit();
      echo json_encode(["success" => 1]);
    } catch (Exception $e) {
      $conn->rollBack();
      echo json_encode(["success" => 0, "error" => $e->getMessage()]);
    }
  }

  function getAllGRN() {
    include "connection-pdo.php";
  $sql = "SELECT g.grn_id, g.po_id, g.reference_no, g.status, g.remarks, g.received_date,
                s.name AS supplier_name, l.location_name, po.po_number
          FROM goods_received_notes g
          INNER JOIN purchase_order po ON g.po_id = po.po_id
          INNER JOIN supplier s ON g.supplier_id = s.supplier_id
          INNER JOIN location l ON g.location_id = l.location_id
          ORDER BY g.received_date DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  }



  function getGRN($json) {
    include "connection-pdo.php";
    $d = json_decode($json, true);
    $id = (int)($d['grn_id'] ?? 0);

    $h = $conn->prepare("SELECT g.*, po.po_number, s.name AS supplier_name, l.location_name
                        FROM goods_received_notes g
                        INNER JOIN purchase_order po ON g.po_id = po.po_id
                        INNER JOIN supplier s ON g.supplier_id = s.supplier_id
                        INNER JOIN location l ON g.location_id = l.location_id
                        WHERE g.grn_id = :id");
    $h->execute([":id"=>$id]);
    $grn = $h->fetch(PDO::FETCH_ASSOC);
    if (!$grn) { echo json_encode(null); return; }

    $it = $conn->prepare("SELECT i.*, p.product_name
                          FROM goods_received_items i
                          INNER JOIN product p ON i.product_id = p.product_id
                          WHERE i.grn_id = :id");
    $it->execute([":id"=>$id]);
    $grn['items'] = $it->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($grn);
  }

  /** Update items on a DRAFT GRN (replace lines) */
  function updateGRNItems($json) {
    include "connection-pdo.php";
    $d = json_decode($json, true);
    $grn_id = (int)($d['grn_id'] ?? 0);
    $items = $d['items'] ?? [];
    $remarks = $d['remarks'] ?? null;

    try {
      $conn->beginTransaction();

      $st = $conn->prepare("SELECT status, po_id FROM goods_received_notes WHERE grn_id = :id FOR UPDATE");
      $st->execute([":id"=>$grn_id]);
      $h = $st->fetch(PDO::FETCH_ASSOC);
      if (!$h) throw new Exception("GRN not found.");
      if ($h['status'] !== 'draft') throw new Exception("Only draft GRN can be edited.");

      // validate vs remaining on PO
      $sumPO = $conn->prepare("SELECT poi.product_id, poi.ordered_qty, poi.received_qty
                              FROM purchase_order_items poi WHERE poi.po_id = :po");
      $sumPO->execute([":po" => $h['po_id']]);
      $poIdx = [];
      foreach ($sumPO->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $poIdx[(int)$r['product_id']] = [(int)$r['ordered_qty'], (int)$r['received_qty']];
      }

      $conn->prepare("DELETE FROM goods_received_items WHERE grn_id = :id")->execute([":id"=>$grn_id]);

      $ins = $conn->prepare("INSERT INTO goods_received_items (grn_id, product_id, received_qty, unit_cost, line_note)
                            VALUES (:g,:p,:q,:c,:n)");

      foreach ($items as $it) {
        $pid = (int)($it['product_id'] ?? 0);
        $q   = (int)($it['received_qty'] ?? 0);
        $c   = (float)($it['unit_cost'] ?? 0);
        $n   = isset($it['line_note']) && $it['line_note'] !== '' ? $it['line_note'] : null;
        if ($pid <= 0 || $q <= 0) continue;

        $remHard = 0;
        if (isset($poIdx[$pid])) {
          [$o,$r] = $poIdx[$pid];
          $remHard = max(0, $o - $r);
        }
        if ($q > $remHard) throw new Exception("Qty exceeds remaining for product {$pid}.");

        $ins->execute([":g"=>$grn_id, ":p"=>$pid, ":q"=>$q, ":c"=>$c, ":n"=>$n]);
      }

      $conn->prepare("UPDATE goods_received_notes SET remarks = :rmk WHERE grn_id = :id")
          ->execute([":rmk"=>$remarks, ":id"=>$grn_id]);

      $conn->commit();
      echo json_encode(["success"=>1]);
    } catch (Exception $e) {
      $conn->rollBack();
      echo json_encode(["success"=>0, "error"=>$e->getMessage()]);
    }
  }

  /** Confirm GRN: apply inventory & PO received totals, set status=confirmed (and reference_no if empty) */
  function confirmGRN($json) {
    include "connection-pdo.php";
    $d = json_decode($json, true);
    $grn_id = (int)($d['grn_id'] ?? 0);

    try {
      $conn->beginTransaction();

      $h = $conn->prepare("SELECT * FROM goods_received_notes WHERE grn_id = :id FOR UPDATE");
      $h->execute([":id"=>$grn_id]);
      $grn = $h->fetch(PDO::FETCH_ASSOC);
      if (!$grn) throw new Exception("GRN not found.");
      if ($grn['status'] !== 'draft') throw new Exception("Only draft GRN can be confirmed.");

      // lock PO
      $poStmt = $conn->prepare("SELECT po_id, supplier_id, location_id FROM purchase_order WHERE po_id = :id FOR UPDATE");
      $poStmt->execute([":id"=>$grn['po_id']]);
      $po = $poStmt->fetch(PDO::FETCH_ASSOC);
      if (!$po) throw new Exception("PO not found.");

      // lines + validations
      $getPOItem = $conn->prepare("
        SELECT po_item_id, ordered_qty, received_qty, unit_cost
        FROM purchase_order_items
        WHERE po_id = :po AND product_id = :pid
        FOR UPDATE
      ");
      $updPOItem = $conn->prepare("
        UPDATE purchase_order_items SET received_qty = received_qty + :rx WHERE po_item_id = :id
      ");

      $selInv = $conn->prepare("
        SELECT inventory_id FROM inventory WHERE product_id = :pid AND location_id = :loc FOR UPDATE
      ");
      $updInv = $conn->prepare("UPDATE inventory SET quantity = quantity + :rx WHERE inventory_id = :id");
      $insInv = $conn->prepare("INSERT INTO inventory (product_id, location_id, quantity) VALUES (:pid, :loc, :rx)");

      $it = $conn->prepare("SELECT * FROM goods_received_items WHERE grn_id = :id");
      $it->execute([":id"=>$grn_id]);
      $items = $it->fetchAll(PDO::FETCH_ASSOC);
      if (!$items) throw new Exception("No items to confirm.");

      foreach ($items as $line) {
        $pid = (int)$line['product_id'];
        $rx  = (int)$line['received_qty'];
        if ($pid <= 0 || $rx <= 0) continue;

        $getPOItem->execute([":po"=>$po['po_id'], ":pid"=>$pid]);
        $poi = $getPOItem->fetch(PDO::FETCH_ASSOC);
        if (!$poi) throw new Exception("Product {$pid} not on PO.");

        $rem = (int)$poi['ordered_qty'] - (int)$poi['received_qty'];
        if ($rx > $rem) throw new Exception("Receiving more than remaining for product {$pid}.");

        // update PO line totals
        $updPOItem->execute([":rx"=>$rx, ":id"=>$poi['po_item_id']]);

        // update inventory
        $selInv->execute([":pid"=>$pid, ":loc"=>$po['location_id']]);
        $inv = $selInv->fetch(PDO::FETCH_ASSOC);
        if ($inv) $updInv->execute([":rx"=>$rx, ":id"=>$inv['inventory_id']]);
        else $insInv->execute([":pid"=>$pid, ":loc"=>$po['location_id'], ":rx"=>$rx]);
      }

      // update PO status aggregate
      $sum = $conn->prepare("SELECT SUM(ordered_qty) o, SUM(received_qty) r FROM purchase_order_items WHERE po_id = :po");
      $sum->execute([":po"=>$po['po_id']]);
      $agg = $sum->fetch(PDO::FETCH_ASSOC);
      $newStatus = ((int)$agg['o'] > 0 && (int)$agg['o'] === (int)$agg['r']) ? 'received' : 'partially_received';
      $conn->prepare("UPDATE purchase_order SET status = :s WHERE po_id = :id")
          ->execute([":s"=>$newStatus, ":id"=>$po['po_id']]);

      // finalize GRN
      $ref = $grn['reference_no'];
      if (!$ref || $ref === '') {
        $ref = sprintf('GRN-%04d', $grn_id);
        $conn->prepare("UPDATE goods_received_notes SET reference_no = :r WHERE grn_id = :id")
            ->execute([":r"=>$ref, ":id"=>$grn_id]);
      }
      $conn->prepare("UPDATE goods_received_notes SET status = 'confirmed' WHERE grn_id = :id")
          ->execute([":id"=>$grn_id]);

      $conn->commit();
      echo json_encode(["success"=>1, "reference_no"=>$ref, "po_status"=>$newStatus]);
    } catch (Exception $e) {
      $conn->rollBack();
      echo json_encode(["success"=>0, "error"=>$e->getMessage()]);
    }
  }
  function hasDraftGRN($json) {
    include "connection-pdo.php";
    $d = json_decode($json, true);
    $po_id = (int)($d['po_id'] ?? 0);
    $st = $conn->prepare("SELECT COUNT(*) FROM goods_received_notes WHERE po_id = :po AND status='draft'");
    $st->execute([":po" => $po_id]);
    echo json_encode(["hasDraft" => (int)$st->fetchColumn() > 0]);
  }
  // Save items + approve (for warehouse_manager)
  function approvePO($json) {
    include "connection-pdo.php";
    $d = json_decode($json, true);

    try {
      $conn->beginTransaction();

      $po_id = (int)($d['po_id'] ?? 0);
      if ($po_id <= 0) throw new Exception("Invalid po_id.");

      // Must be pending
      $st = $conn->prepare("SELECT status FROM purchase_order WHERE po_id = :id");
      $st->execute([":id" => $po_id]);
      $row = $st->fetch(PDO::FETCH_ASSOC);
      if (!$row) throw new Exception("PO not found.");
      if ($row['status'] !== 'pending') throw new Exception("Only pending POs can be approved.");

// ...
$conn->prepare("DELETE FROM purchase_order_items WHERE po_id = :id")
     ->execute([":id" => $po_id]);

$merged = is_array($d['items'] ?? null) ? $this->mergeItemsByProduct($d['items']) : [];
if (count($merged) === 0) throw new Exception("No items to save.");

$ins = $conn->prepare("
  INSERT INTO purchase_order_items (po_id, product_id, ordered_qty, unit_cost)
  VALUES (:po, :pid, :qty, :cost)
");
foreach ($merged as $it) {
  $ins->execute([
    ":po"   => $po_id,
    ":pid"  => (int)$it['product_id'],
    ":qty"  => (int)$it['ordered_qty'],
    ":cost" => (float)$it['unit_cost'],
  ]);
}

// then: UPDATE purchase_order SET status='approved' ...
// ...


      // Update status to approved
      $conn->prepare("UPDATE purchase_order SET status = 'approved' WHERE po_id = :id")
          ->execute([":id" => $po_id]);

      $conn->commit();
      echo json_encode(["success" => 1, "new_status" => "approved"]);
    } catch (Exception $e) {
      $conn->rollBack();
      echo json_encode(["success" => 0, "error" => $e->getMessage()]);
    }
  }

  }

  // Handle request
  if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $operation = $_GET['operation'];
    $json = $_GET['json'] ?? "";
  } else {
    $operation = $_POST['operation'];
    $json = $_POST['json'] ?? "";
  }

  $po = new PurchaseOrder();
  switch ($operation) {
    case "getAllPO": $po->getAllPO(); break;
    case "insertPO": $po->insertPO($json); break;
    case "getPO": $po->getPO($json); break;
    case "updatePOStatus": $po->updatePOStatus($json); break;
      case "getSuppliers": $po->getSuppliers(); break;   // ✅ for dropdown
    case "getLocations": $po->getLocations(); break;   // ✅ for dropdown 
  case "getProductsBySupplier": $po->getProductsBySupplier($json); break;
  case "createGRN":
    $po->createGRN($json);
    break;
  case "savePOItems": $po->savePOItems($json); break;
  case "getAllGRN": $po->getAllGRN(); break;
  case "getGRN": $po->getGRN($json); break;
  case "updateGRNItems": $po->updateGRNItems($json); break;
  case "confirmGRN": $po->confirmGRN($json); break;
  case "hasDraftGRN": $po->hasDraftGRN($json); break;
  case "approvePO": $po->approvePO($json); break;


  }
  ?>
