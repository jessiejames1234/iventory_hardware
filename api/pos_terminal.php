<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once 'connection-pdo.php';

class PosTerminal {

  // Get all terminals
  public function getTerminals(PDO $conn) {
    $sql = "SELECT terminal_id AS id, terminal_name AS name, status
            FROM pos_terminal
            ORDER BY terminal_id DESC";
    $stmt = $conn->query($sql);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
  }

  // Insert new terminal
  public function insertTerminal(PDO $conn, array $data) {
    $name   = trim($data['name'] ?? '');
    $status = isset($data['status']) ? (int)$data['status'] : 1;

    if ($name === '') {
      echo json_encode(["status" => "error", "message" => "Terminal name is required"]);
      exit;
    }

    try {
      $stmt = $conn->prepare("INSERT INTO pos_terminal (terminal_name, status) VALUES (:name, :status)");
      $ok   = $stmt->execute([":name" => $name, ":status" => $status]);
      echo json_encode($ok ? ["status" => "success"]
                           : ["status" => "error", "message" => ($stmt->errorInfo()[2] ?? 'Unknown error')]);
    } catch (Exception $e) {
      echo json_encode(["status" => "error", "message" => "Exception: ".$e->getMessage()]);
    }
    exit;
  }

  // Update status
  public function updateTerminalStatus(PDO $conn, int $id, int $status) {
    try {
      $stmt = $conn->prepare("UPDATE pos_terminal SET status = :status WHERE terminal_id = :id");
      $ok = $stmt->execute([":status" => $status, ":id" => $id]);
      echo json_encode($ok ? ["status" => "success"]
                           : ["status" => "error", "message" => ($stmt->errorInfo()[2] ?? 'Unknown error')]);
    } catch (Exception $e) {
      echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
  }

  // Get only active terminals
  public function getActiveTerminals(PDO $conn) {
    $sql = "SELECT terminal_id, terminal_name, status
            FROM pos_terminal
            WHERE status = 1
            ORDER BY terminal_id ASC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
  }
}

$terminal  = new PosTerminal();
$operation = $_POST['operation'] ?? $_GET['operation'] ?? '';
$jsonStr   = $_POST['json'] ?? $_GET['json'] ?? '';

// Accept raw JSON bodies too
if ($jsonStr === '') {
  $raw = file_get_contents('php://input');
  if ($raw) {
    $parsed = json_decode($raw, true);
    if (json_last_error() === JSON_ERROR_NONE) {
      $operation = $parsed['operation'] ?? $operation;
      $jsonStr   = $raw; // keep original JSON
    }
  }
}

switch ($operation) {
  case 'getTerminals':
    $terminal->getTerminals($conn);
    break;

  case 'insertTerminal':
    $terminal->insertTerminal($conn, json_decode($jsonStr, true) ?? []);
    break;

  case 'updateTerminalStatus':
    $id     = (int)($_POST['id'] ?? $_GET['id'] ?? 0);
    $status = (int)($_POST['status'] ?? $_GET['status'] ?? 0);
    $terminal->updateTerminalStatus($conn, $id, $status);
    break;

  case 'getActiveTerminals':
    $terminal->getActiveTerminals($conn);   // ✅ fixed ($pt → $terminal)
    break;

  default:
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid operation"]);
    exit;
}
