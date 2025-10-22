<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class StockTransfer {

  function getLocations(){
    include "connection-pdo.php";
    $sql = "SELECT location_id, location_name FROM location WHERE is_active=1 ORDER BY location_name";
    $stmt=$conn->prepare($sql); $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  }

  // products with stock at FROM
  function getAvailableProducts($json){
    include "connection-pdo.php";
    $data = json_decode($json, true);
    $from = (int)$data['fromLocationId'];

    $sql = "SELECT i.product_id, COALESCE(i.quantity,0) AS available_qty,
                   p.product_name, p.sku, p.model
            FROM inventory i
            INNER JOIN product p ON p.product_id=i.product_id
            WHERE i.location_id=:loc AND i.quantity>0
            ORDER BY p.product_name";
    $stmt=$conn->prepare($sql);
    $stmt->bindParam(":loc",$from,PDO::PARAM_INT);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  }

  // list all transfers (2nd table)
function getAllTransfers($json){
  include "connection-pdo.php";
  $filters = $json? json_decode($json,true):[];
  $where=[]; $params=[];

  if(!empty($filters['fromLocationId'])){$where[]="t.from_location_id=:f"; $params[':f']=$filters['fromLocationId'];}
  if(!empty($filters['toLocationId'])){$where[]="t.to_location_id=:t"; $params[':t']=$filters['toLocationId'];}

  // NEW: restrict to one location (warehouse assignment)
  if (!empty($filters['onlyLocationId'])) {
    $where[]="(t.from_location_id=:ol OR t.to_location_id=:ol)";
    $params[':ol']=$filters['onlyLocationId'];
  }

  $sql = "SELECT t.stock_transfer_id, t.from_location_id, t.to_location_id,
                 t.status, t.transfer_created,
                 fl.location_name AS from_location,
                 fl.type          AS from_type,
                 tl.location_name AS to_location,
                 tl.type          AS to_type,
                 (SELECT COUNT(*) FROM stock_transfer_items x
                   WHERE x.stock_transfer_id=t.stock_transfer_id) AS item_count
          FROM stock_transfer t
          INNER JOIN location fl ON fl.location_id=t.from_location_id
          INNER JOIN location tl ON tl.location_id=t.to_location_id";

  if($where) $sql .= " WHERE ".implode(" AND ",$where);
  $sql .= " ORDER BY t.transfer_created DESC";

  $stmt=$conn->prepare($sql);
  $stmt->execute($params);
  echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}


  function getTransfer($json){
    include "connection-pdo.php";
    $data=json_decode($json,true); $id=(int)$data['stockTransferId'];

    $sqlH="SELECT t.*, fl.location_name AS from_location, tl.location_name AS to_location
           FROM stock_transfer t
           INNER JOIN location fl ON fl.location_id=t.from_location_id
           INNER JOIN location tl ON tl.location_id=t.to_location_id
           WHERE t.stock_transfer_id=:id";
    $h=$conn->prepare($sqlH); $h->execute([":id"=>$id]);
    $header=$h->fetch(PDO::FETCH_ASSOC);

    $sqlI="SELECT i.stock_transfer_item_id, i.product_id, i.quantity,
                  p.product_name, p.sku
           FROM stock_transfer_items i
           INNER JOIN product p ON p.product_id=i.product_id
           WHERE i.stock_transfer_id=:id";
    $d=$conn->prepare($sqlI); $d->execute([":id"=>$id]);
    $items=$d->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["header"=>$header,"items"=>$items]);
  }

  // create header only: status=pendi

// create header only: status = pending (for stock_transfer)
// create header only: status = 'pending' (stock_transfer)
function createDraftTransfer($json){
  include "connection-pdo.php";
  $data = json_decode($json, true);

  $from = (int)($data['fromLocationId'] ?? 0);
  $to   = (int)($data['toLocationId']   ?? 0);
  $req  = (int)($data['requestedBy']    ?? 0);

  if(!$from || !$to){
    echo json_encode(["error"=>1, "message"=>"Missing from/to"]); return;
  }
  if($from === $to){
    echo json_encode(["error"=>1, "message"=>"From and To must be different"]); return;
  }
  if(!$req){
    echo json_encode(["error"=>1, "message"=>"Missing requestedBy"]); return;
  }

  try{
    // validate locations (both exist & active)
    $lv = $conn->prepare("SELECT COUNT(*) FROM location WHERE is_active=1 AND location_id IN (:f,:t)");
    $lv->execute([":f"=>$from, ":t"=>$to]);
    if ((int)$lv->fetchColumn() < 2){
      echo json_encode(["error"=>1,"message"=>"Invalid or inactive locations"]); return;
    }

    // validate staff exists
    $sv = $conn->prepare("SELECT COUNT(*) FROM staff WHERE staff_id=:id");
    $sv->execute([":id"=>$req]);
    if (!(int)$sv->fetchColumn()){
      echo json_encode(["error"=>1,"message"=>"Unknown staff"]); return;
    }

    // IMPORTANT: approved_by is NOT NULL in your schema — set it to requester for "pending"
    // (you can change it later when someone actually approves)
$stmt = $conn->prepare("
  INSERT INTO stock_transfer
    (from_location_id, to_location_id, status, requested_by, approved_by, received_at)
  VALUES
    (:f, :t, 'pending', :rb, :ab, NULL)
");
$stmt->execute([":f"=>$from, ":t"=>$to, ":rb"=>$req, ":ab"=>$req]);

    echo json_encode((int)$conn->lastInsertId());
  } catch(Throwable $e){
    echo json_encode(["error"=>1,"message"=>$e->getMessage()]);
  }
}


  // add lines only (no stock movement)
  function addDraftItems($json){
    include "connection-pdo.php";
    $data=json_decode($json,true);
    $tid=(int)$data['stockTransferId'];
    $items=$data['items']??[];

    $conn->beginTransaction();
    try{
      // ensure pending
      $chk=$conn->prepare("SELECT status FROM stock_transfer WHERE stock_transfer_id=:id FOR UPDATE");
      $chk->execute([":id"=>$tid]);
      $st=$chk->fetch(PDO::FETCH_ASSOC);
      if(!$st || $st['status']!=='pending'){ throw new Exception("Transfer not pending."); }

      $ins=$conn->prepare("INSERT INTO stock_transfer_items (stock_transfer_id, product_id, quantity)
                           VALUES (:tid,:pid,:qty)");
      foreach($items as $ln){
        $pid=(int)$ln['productId']; $qty=max(0,(int)$ln['quantity']);
        if($qty<=0) continue;
        $ins->execute([":tid"=>$tid,":pid"=>$pid,":qty"=>$qty]);
      }
      $conn->commit();
      echo json_encode(1);
    }catch(Throwable $e){
      if($conn->inTransaction()) $conn->rollBack();
      echo json_encode(["error"=>1,"message"=>$e->getMessage()]);
    }
  }

  // transit -> flip status only
  // completed -> move stock (from ↓ / to ↑) atomically
  function updateTransferStatus($json){
    include "connection-pdo.php";
    $data=json_decode($json,true);
    $tid=(int)$data['stockTransferId'];
    $new=$data['status']; // 'transit'|'completed'|'cancelled'

    // fetch header+lines
    $h=$conn->prepare("SELECT * FROM stock_transfer WHERE stock_transfer_id=:id FOR UPDATE");
    $h->execute([":id"=>$tid]); $hdr=$h->fetch(PDO::FETCH_ASSOC);
    if(!$hdr){ echo json_encode(["error"=>1,"message"=>"Not found"]); return; }

if($new==='in_transit'){
  $u=$conn->prepare("UPDATE stock_transfer SET status='in_transit' WHERE stock_transfer_id=:id");
  $u->execute([":id"=>$tid]);
  echo json_encode(1);
  return;
}


    if($new==='completed'){
      $d=$conn->prepare("SELECT product_id, quantity FROM stock_transfer_items WHERE stock_transfer_id=:id");
      $d->execute([":id"=>$tid]); $rows=$d->fetchAll(PDO::FETCH_ASSOC);
      if(!$rows){ echo json_encode(["error"=>1,"message"=>"No items"]); return; }

      $from=(int)$hdr['from_location_id']; $to=(int)$hdr['to_location_id'];

      $conn->beginTransaction();
      try{
        foreach($rows as $r){
          $pid=(int)$r['product_id']; $qty=(int)$r['quantity'];

          // lock source
          $sf=$conn->prepare("SELECT quantity FROM inventory WHERE product_id=:p AND location_id=:l FOR UPDATE");
          $sf->execute([":p"=>$pid,":l"=>$from]);
          $src=$sf->fetch(PDO::FETCH_ASSOC);
          $have=(int)($src['quantity']??0);
          if($have<$qty) throw new Exception("Insufficient stock for product $pid");

          // decrement from
          $dec=$conn->prepare("UPDATE inventory SET quantity=quantity-:q WHERE product_id=:p AND location_id=:l");
          $dec->execute([":q"=>$qty,":p"=>$pid,":l"=>$from]);

          // ensure dest row exists then increment
          $ck=$conn->prepare("SELECT inventory_id FROM inventory WHERE product_id=:p AND location_id=:l FOR UPDATE");
          $ck->execute([":p"=>$pid,":l"=>$to]);
          if(!$ck->fetch(PDO::FETCH_ASSOC)){
            $ins=$conn->prepare("INSERT INTO inventory (product_id, location_id, quantity) VALUES (:p,:l,0)");
            $ins->execute([":p"=>$pid,":l"=>$to]);
          }
          $inc=$conn->prepare("UPDATE inventory SET quantity=quantity+:q WHERE product_id=:p AND location_id=:l");
          $inc->execute([":q"=>$qty,":p"=>$pid,":l"=>$to]);
        }

$u=$conn->prepare("
  UPDATE stock_transfer 
     SET status='completed', received_at=NOW()
   WHERE stock_transfer_id=:id
");
        $u->execute([":id"=>$tid]);
        $conn->commit();
        echo json_encode(1);
      }catch(Throwable $e){
        if($conn->inTransaction()) $conn->rollBack();
        echo json_encode(["error"=>1,"message"=>$e->getMessage()]);
      }
      return;
    }

    // fallback: just set whatever (e.g., cancelled)
    $u=$conn->prepare("UPDATE stock_transfer SET status=:s WHERE stock_transfer_id=:id");
    $u->execute([":s"=>$new,":id"=>$tid]); echo json_encode(1);
  }
}

// router (teacher style)
if($_SERVER['REQUEST_METHOD']=='GET'){
  $operation=$_GET['operation']??''; $json=$_GET['json']??'';
}else if($_SERVER['REQUEST_METHOD']=='POST'){
  $operation=$_POST['operation']??''; $json=$_POST['json']??'';
}

$api=new StockTransfer();
switch($operation){
  case "getLocations": echo $api->getLocations(); break;
  case "getAvailableProducts": echo $api->getAvailableProducts($json); break;
  case "getAllTransfers": echo $api->getAllTransfers($json); break;
  case "getTransfer": echo $api->getTransfer($json); break;
  case "createDraftTransfer": echo $api->createDraftTransfer($json); break;
  case "addDraftItems": echo $api->addDraftItems($json); break;
  case "updateTransferStatus": echo $api->updateTransferStatus($json); break;
  default: echo json_encode(["error"=>"Unknown operation"]);
}
