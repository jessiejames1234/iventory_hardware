<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");

class Dashboard {
  private $conn;
  function __construct() {
    include "connection-pdo.php";
    $this->conn = $conn;
    // Optional: tighten PDO error mode
    $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  }

  private function q($sql, $params = []) {
    $stmt = $this->conn->prepare($sql);
    foreach ($params as $k => $v) $stmt->bindValue($k, $v);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
  }

  private function one($sql, $params = []) {
    $r = $this->q($sql, $params);
    return $r ? array_values($r[0])[0] : 0;
  }
private function tableExists($table) {
  $sql = "SELECT COUNT(*) FROM information_schema.TABLES 
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t";
  return (int)$this->one($sql, [":t" => $table]) > 0;
}

private function columnExists($table, $col) {
  $sql = "SELECT COUNT(*) FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t AND COLUMN_NAME = :c";
  return (int)$this->one($sql, [":t" => $table, ":c" => $col]) > 0;
}

  function get() {
    // ---- Inventory ----
    $total_skus    = (int)$this->one("SELECT COUNT(*) FROM product");
    $active_skus   = (int)$this->one("SELECT COUNT(*) FROM product WHERE is_active=1");
    $inactive_skus = $total_skus - $active_skus;

    $stock_by_loc = $this->q("
      SELECT l.location_id, l.location_name, l.type, COALESCE(SUM(i.quantity),0) AS qty
      FROM location l
      LEFT JOIN inventory i ON i.location_id = l.location_id
      GROUP BY l.location_id, l.location_name, l.type
      ORDER BY l.location_name
    ");

    $stock_value_by_loc = $this->q("
      SELECT l.location_id, l.location_name,
             COALESCE(SUM(i.quantity * p.cost_price),0) AS value_cost
      FROM location l
      LEFT JOIN inventory i ON i.location_id = l.location_id
      LEFT JOIN product  p ON p.product_id = i.product_id
      GROUP BY l.location_id, l.location_name
      ORDER BY l.location_name
    ");

    $zero_stock_by_loc = $this->q("
      SELECT l.location_id, l.location_name, COUNT(*) AS zero_count
      FROM location l
      LEFT JOIN inventory i ON i.location_id = l.location_id
      LEFT JOIN product  p ON p.product_id = i.product_id
      WHERE COALESCE(i.quantity,0)=0
      GROUP BY l.location_id, l.location_name
    ");

    $low_stock = $this->q("
      SELECT l.location_name, p.product_id, p.product_name, p.reorder_level,
             COALESCE(i.quantity,0) AS qty
      FROM product p
      JOIN inventory i ON i.product_id = p.product_id
      JOIN location  l ON l.location_id = i.location_id
      WHERE COALESCE(i.quantity,0) <= p.reorder_level
      ORDER BY l.location_name, (p.reorder_level - COALESCE(i.quantity,0)) DESC, p.product_name
    ");

    // ---- Purchasing / GRN ----
    $po_by_status = $this->q("SELECT status, COUNT(*) AS cnt FROM purchase_order GROUP BY status");

    $po_value_row = $this->q("
      SELECT
        COALESCE(SUM(poi.ordered_qty * poi.unit_cost),0) AS ordered_value,
        COALESCE(SUM(GREATEST(poi.ordered_qty - poi.received_qty,0) * poi.unit_cost),0) AS remaining_value
      FROM purchase_order_items poi
    ");
    $po_value = $po_value_row ? $po_value_row[0] : ['ordered_value'=>0,'remaining_value'=>0];

    $grn_by_status = $this->q("SELECT status, COUNT(*) AS cnt FROM goods_received_notes GROUP BY status");

    $grn_7d = $this->q("
      SELECT DATE(received_date) AS d,
             SUM(gri.received_qty * gri.unit_cost) AS received_value
      FROM goods_received_notes grn
      JOIN goods_received_items gri ON gri.grn_id = grn.grn_id
      WHERE received_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(received_date)
      ORDER BY d
    ");

    // ---- Sales ----
    $sales_all   = (float)$this->one("SELECT COALESCE(SUM(total),0) FROM salestransaction");
    $sales_today = (float)$this->one("SELECT COALESCE(SUM(total),0) FROM salestransaction WHERE DATE(`date`)=CURDATE()");
    $sales_week  = (float)$this->one("SELECT COALESCE(SUM(total),0) FROM salestransaction WHERE YEARWEEK(`date`,1)=YEARWEEK(CURDATE(),1)");
    $sales_month = (float)$this->one("SELECT COALESCE(SUM(total),0) FROM salestransaction WHERE YEAR(`date`)=YEAR(CURDATE()) AND MONTH(`date`)=MONTH(CURDATE())");
    $tx_count    = (int)$this->one("SELECT COUNT(*) FROM salestransaction");
    $avg_ticket  = $tx_count ? round($sales_all / $tx_count, 2) : 0.00;

    $sales_7d = $this->q("
      SELECT DATE(`date`) AS d, SUM(total) AS sales
      FROM salestransaction
      WHERE `date` >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(`date`)
      ORDER BY d
    ");

    $sales_by_terminal = $this->q("
      SELECT t.terminal_id, COALESCE(pt.terminal_name, CONCAT('T', t.terminal_id)) AS terminal_name,
             SUM(t.total) AS sales
      FROM salestransaction t
      LEFT JOIN pos_terminal pt ON pt.terminal_id = t.terminal_id
      GROUP BY t.terminal_id, pt.terminal_name
      ORDER BY sales DESC
    ");

// --- Top products by quantity (transactionitem.*) ---
// Top products by qty
$top_products = $this->q("
  SELECT ti.product_id, p.product_name, SUM(ti.quantity) AS qty
  FROM transactionitem ti
  JOIN product p ON p.product_id = ti.product_id
  GROUP BY ti.product_id, p.product_name
  ORDER BY qty DESC
  LIMIT 10
");


    $sales_returns     = (int)$this->one("SELECT COUNT(*) FROM sales_return");
    $purchase_returns  = (int)$this->one("SELECT COUNT(*) FROM purchase_return");

    // ---- Operations ----
    $locations = $this->q("SELECT type, COUNT(*) AS cnt FROM location GROUP BY type");
    $active_terminals = (int)$this->one("SELECT COUNT(*) FROM pos_terminal WHERE status=1");
    $open_shifts      = (int)$this->one("SELECT COUNT(*) FROM shift WHERE end_time IS NULL");

    return [
      "inventory" => [
        "total_skus" => $total_skus,
        "active_skus" => $active_skus,
        "inactive_skus" => $inactive_skus,
        "stock_by_location" => $stock_by_loc,
        "stock_value_by_location" => $stock_value_by_loc,
        "zero_stock_by_location" => $zero_stock_by_loc,
        "low_stock" => $low_stock
      ],
      "purchasing" => [
        "po_by_status" => $po_by_status,
        "po_value" => $po_value,
        "grn_by_status" => $grn_by_status,
        "grn_last_7_days" => $grn_7d
      ],
      "sales" => [
        "totals" => [
          "all_time" => $sales_all,
          "today"    => $sales_today,
          "this_week"=> $sales_week,
          "this_month"=> $sales_month,
          "transactions" => $tx_count,
          "avg_ticket"   => $avg_ticket
        ],
        "by_terminal" => $sales_by_terminal,
        "by_day_7d"   => $sales_7d,
        "top_products_qty" => $top_products,
        "sales_returns" => $sales_returns
      ],
      "operations" => [
        "locations" => $locations,
        "active_terminals" => $active_terminals,
        "open_shifts" => $open_shifts,
        "purchase_returns" => $purchase_returns
      ]
    ];
  }
}

try {
  $operation = $_GET['operation'] ?? ($_POST['operation'] ?? 'getDashboard');
  $d = new Dashboard();

  if ($operation === 'health') {
    echo json_encode(["ok" => true]); exit;
  }

  echo json_encode($d->get(), JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    "error" => true,
    "message" => $e->getMessage()
  ], JSON_UNESCAPED_UNICODE);
}
