<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class StockAdjustment {

  private function refNo() {
    return "ADJ-" . date("Ymd-His") . "-" . substr(md5(uniqid("", true)), 0, 4);
  }

  // NEW: resolve a staff's location (admin -> 1, wh_manager -> warehouse_id)
private function resolveLocationForStaff(PDO $conn, int $staffId): int {
  $q = $conn->prepare("SELECT role, location_id FROM staff WHERE staff_id=:id");
  $q->execute([":id"=>$staffId]);
  $u = $q->fetch(PDO::FETCH_ASSOC);
  if(!$u) throw new Exception("Unknown staff");

  $role = strtolower(trim($u['role'] ?? ''));
  $loc  = isset($u['location_id']) ? (int)$u['location_id'] : 0;

  if ($role === 'admin' || $role === 'store_clerk') return 1; // main store
  if (($role === 'warehouse_manager' || $role === 'warehouse_clerk') && $loc > 0) return $loc;

  throw new Exception("Your account has no assigned warehouse");
}


  /* ---------- data for builder ---------- */
  // Products for THIS user's location (no client-picked location)
  function getProductsForLocation($json){
    include "connection-pdo.php";
    $data = json_decode($json, true);
    $staffId = (int)($data['staffId'] ?? 0);
    if(!$staffId){ echo json_encode([]); return; }

    try {
      $loc = $this->resolveLocationForStaff($conn, $staffId);
      $sql = "SELECT p.product_id, p.product_name, p.sku,
                     COALESCE(i.quantity,0) AS old_quantity
              FROM inventory i
              INNER JOIN product p ON p.product_id=i.product_id
              WHERE i.location_id=:loc
              ORDER BY p.product_name";
      $stmt = $conn->prepare($sql);
      $stmt->execute([":loc"=>$loc]);
      echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch(Throwable $e){
      echo json_encode([]); // keep UI quiet; you can also return the error if you prefer
    }
  }

  /* ---------- list / view ---------- */
  function getAllAdjustments($json){
    include "connection-pdo.php";
    $data = $json ? json_decode($json,true) : [];
    $staffId = (int)($data['staffId'] ?? 0);
    if(!$staffId){ echo json_encode([]); return; }

    try {
      $locId = $this->resolveLocationForStaff($conn, $staffId);
      $sql = "SELECT a.adjustment_id, a.reference_no, a.status, a.created_at,
                     l.location_name,
                     COUNT(i.adjustment_item_id) AS item_count
              FROM stock_adjustments a
              INNER JOIN location l ON l.location_id=a.location_id
              LEFT JOIN stock_adjustment_items i ON i.adjustment_id=a.adjustment_id
              WHERE a.location_id = :loc
              GROUP BY a.adjustment_id
              ORDER BY a.created_at DESC";
      $stmt = $conn->prepare($sql);
      $stmt->execute([":loc"=>$locId]);
      echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch(Throwable $e){
      echo json_encode([]);
    }
  }

  function getAdjustment($json){
    include "connection-pdo.php";
    $data = json_decode($json,true);
    $id   = (int)$data['adjustmentId'];

    $h = $conn->prepare("SELECT a.*, l.location_name
                         FROM stock_adjustments a
                         INNER JOIN location l ON l.location_id=a.location_id
                         WHERE a.adjustment_id=:id");
    $h->execute([":id"=>$id]);
    $header = $h->fetch(PDO::FETCH_ASSOC);

    $d = $conn->prepare("SELECT i.adjustment_item_id, i.product_id, i.old_quantity, i.change_quantity, i.new_quantity, i.reason,
                                p.product_name, p.sku
                         FROM stock_adjustment_items i
                         INNER JOIN product p ON p.product_id=i.product_id
                         WHERE i.adjustment_id=:id");
    $d->execute([":id"=>$id]);
    $items = $d->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["header"=>$header, "items"=>$items]);
  }

  /* ---------- create: header then items (pending) ---------- */
function createDraft($json){
  include "connection-pdo.php";
  $data = json_decode($json,true);
  $createdBy = (int)($data['createdBy'] ?? 0);
  if(!$createdBy){ echo json_encode(["error"=>1,"message"=>"Missing createdBy"]); return; }

  try{
    // resolve location from staff
    $loc = $this->resolveLocationForStaff($conn, $createdBy);

    // 1) insert header with temporary reference
    $stmt = $conn->prepare("INSERT INTO stock_adjustments
      (reference_no, location_id, created_by, approve_by, status, created_at)
      VALUES ('PENDING', :loc, :cb, NULL, 'pending', NOW())");
    $stmt->execute([ ':loc'=>$loc, ':cb'=>$createdBy ]);

// after successful INSERT in createDraft()
$id = (int)$conn->lastInsertId();

// ADJ-0001 / ADJ-0012 etc.
$ref = 'ADJ-' . str_pad((string)$id, 4, '0', STR_PAD_LEFT);
$u = $conn->prepare("UPDATE stock_adjustments SET reference_no=:ref WHERE adjustment_id=:id");
$u->execute([":ref"=>$ref, ":id"=>$id]);

echo json_encode($id);

  } catch(Throwable $e){
    echo json_encode(["error"=>1,"message"=>$e->getMessage()]);
  }
}


  function addDraftItems($json){
    include "connection-pdo.php";
    $data  = json_decode($json,true);
    $aid   = (int)$data['adjustmentId'];
    $items = $data['items'] ?? [];

    $conn->beginTransaction();
    try{
      $chk=$conn->prepare("SELECT status, location_id FROM stock_adjustments WHERE adjustment_id=:id FOR UPDATE");
      $chk->execute([":id"=>$aid]);
      $hdr=$chk->fetch(PDO::FETCH_ASSOC);
      if(!$hdr || $hdr['status']!=='pending'){ throw new Exception("Adjustment not pending."); }

      $ins=$conn->prepare("INSERT INTO stock_adjustment_items
          (adjustment_id, product_id, old_quantity, new_quantity, change_quantity, reason)
          VALUES (:aid,:pid,:oldq,:newq,:chg,:reason)");

foreach($items as $ln){
  $pid = (int)$ln['productId'];
  $old = max(0, (int)$ln['oldQty']);      // old is never negative
  $chg = (int)$ln['changeQty'];           // can be negative or positive

  // clamp: new cannot be negative
  if ($chg < -$old) { $chg = -$old; }

  $new = $old + $chg;                     // >= 0 after clamp
  $reason = substr(trim($ln['reason'] ?? ''), 0, 50);
  if(!$pid) continue;

  $ins->execute([
    ":aid"=>$aid, ":pid"=>$pid,
    ":oldq"=>$old, ":newq"=>$new,
    ":chg"=>$chg, ":reason"=>$reason
  ]);
}

      $conn->commit();
      echo json_encode(1);
    }catch(Throwable $e){
      if($conn->inTransaction()) $conn->rollBack();
      echo json_encode(["error"=>1,"message"=>$e->getMessage()]);
    }
  }

function approve($json){
  include "connection-pdo.php";
  $data = json_decode($json,true);
  $aid  = (int)$data['adjustmentId'];
  $approver = (int)($data['approveBy'] ?? 0);

  $conn->beginTransaction();
  try{
    // ✅ role gate: only admin/warehouse_manager can approve
    $r = $conn->prepare("SELECT LOWER(TRIM(role)) AS role FROM staff WHERE staff_id=:id");
    $r->execute([":id"=>$approver]);
    $who = $r->fetch(PDO::FETCH_ASSOC);
    if(!$who) throw new Exception("Approver account not found.");
    if(!in_array($who['role'], ['admin','warehouse_manager'], true)){
      throw new Exception("Only admin or warehouse manager can approve adjustments.");
    }

    $h=$conn->prepare("SELECT * FROM stock_adjustments WHERE adjustment_id=:id FOR UPDATE");
    $h->execute([":id"=>$aid]); $hdr=$h->fetch(PDO::FETCH_ASSOC);
    if(!$hdr) throw new Exception("Adjustment not found.");
    if($hdr['status']!=='pending') throw new Exception("Already processed.");
    $loc = (int)$hdr['location_id'];

    $d=$conn->prepare("SELECT product_id, change_quantity FROM stock_adjustment_items WHERE adjustment_id=:id");
    $d->execute([":id"=>$aid]);
    $items=$d->fetchAll(PDO::FETCH_ASSOC);
    if(!$items) throw new Exception("No items to approve.");

    $selInv=$conn->prepare("SELECT inventory_id, quantity
                            FROM inventory
                            WHERE product_id=:p AND location_id=:l
                            FOR UPDATE");
    $insInv=$conn->prepare("INSERT INTO inventory (product_id, location_id, quantity)
                            VALUES (:p,:l,0)");
    $updInv=$conn->prepare("UPDATE inventory SET quantity=quantity+:q WHERE inventory_id=:id");

    foreach($items as $it){
      $pid=(int)$it['product_id'];
      $chg=(int)$it['change_quantity'];

      $selInv->execute([":p"=>$pid,":l"=>$loc]);
      $inv=$selInv->fetch(PDO::FETCH_ASSOC);
      if(!$inv){
        $insInv->execute([":p"=>$pid,":l"=>$loc]);
        $selInv->execute([":p"=>$pid,":l"=>$loc]);
        $inv=$selInv->fetch(PDO::FETCH_ASSOC);
      }

      $current = (int)$inv['quantity'];
      if ($current + $chg < 0) {
        throw new Exception("Insufficient stock for product $pid at location $loc");
      }
      $updInv->execute([":q"=>$chg, ":id"=>$inv['inventory_id']]);
      // TODO: add movement row if you want audit trail
    }

    $u=$conn->prepare("UPDATE stock_adjustments SET status='approve', approve_by=:ap WHERE adjustment_id=:id");
    $u->execute([":ap"=>$approver, ":id"=>$aid]);

    $conn->commit();
    echo json_encode(1);
  }catch(Throwable $e){
    if($conn->inTransaction()) $conn->rollBack();
    echo json_encode(["error"=>1,"message"=>$e->getMessage()]);
  }
}

}

/* router */
if($_SERVER['REQUEST_METHOD']=='GET'){
  $operation=$_GET['operation']??''; $json=$_GET['json']??'';
}else if($_SERVER['REQUEST_METHOD']=='POST'){
  $operation=$_POST['operation']??''; $json=$_POST['json']??'';
}

$api=new StockAdjustment();
switch($operation){
  case "getProductsForLocation": echo $api->getProductsForLocation($json); break;
  case "getAllAdjustments":      echo $api->getAllAdjustments($json); break;
  case "getAdjustment":          echo $api->getAdjustment($json); break;
  case "createDraft":            echo $api->createDraft($json); break;
  case "addDraftItems":          echo $api->addDraftItems($json); break;
  case "approve":                echo $api->approve($json); break;
  default: echo json_encode(["error"=>"Unknown operation"]);
}
