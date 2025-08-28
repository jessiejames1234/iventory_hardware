<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
include "connection-pdo.php";

class PosTerminal {

    // 🔹 Get all terminals
    function getTerminals() {
        include "connection-pdo.php";
        $sql = "SELECT terminal_id AS id, terminal_name AS name, status 
                FROM pos_terminal 
                ORDER BY terminal_id DESC";
        $stmt = $conn->query($sql);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // 🔹 Insert new terminal
function insertTerminal($data) {
    include "connection-pdo.php";

    $name   = trim($data['name'] ?? '');
    $status = isset($data['status']) ? (int)$data['status'] : 1;

    if ($name === '') {
        echo json_encode(["status"=>"error","message"=>"Terminal name is required"]);
        return;
    }

    try {
        $stmt = $conn->prepare("INSERT INTO pos_terminal (terminal_name, status) VALUES (:name, :status)");
        $ok   = $stmt->execute([":name"=>$name, ":status"=>$status]);

        if ($ok) {
            echo json_encode(["status"=>"success"]);
        } else {
            $err = $stmt->errorInfo();
            echo json_encode(["status"=>"error","message"=>"SQL error: ".$err[2]]);
        }
    } catch (Exception $e) {
        echo json_encode(["status"=>"error","message"=>"Exception: ".$e->getMessage()]);
    }
}
// 🔹 Update terminal status
function updateTerminalStatus($id, $status) {
    include "connection-pdo.php";

    try {
        $stmt = $conn->prepare("UPDATE pos_terminal SET status = :status WHERE terminal_id = :id");
        $ok = $stmt->execute([":status"=>$status, ":id"=>$id]);

        if ($ok) {
            echo json_encode(["status"=>"success"]);
        } else {
            $err = $stmt->errorInfo();
            echo json_encode(["status"=>"error","message"=>$err[2]]);
        }
    } catch (Exception $e) {
        echo json_encode(["status"=>"error","message"=>$e->getMessage()]);
    }
}

}

$terminal  = new PosTerminal();
$operation = $_POST['operation'] ?? $_GET['operation'] ?? '';
$json      = $_POST['json'] ?? $_GET['json'] ?? '';

// 🔹 If JSON body was sent (Axios default), decode it
if ($json === '') {
    $raw = file_get_contents("php://input");
    if ($raw) {
        $parsed = json_decode($raw, true);
        if (isset($parsed['operation'])) {
            $operation = $parsed['operation'];
        }
        if ($parsed) {
            $json = json_encode($parsed); // keep as string for compatibility
        }
    }
}

// 🔹 Decide operation
switch ($operation) {
    case "getTerminals":
        $terminal->getTerminals();
        break;

    case "insertTerminal":
        $data = json_decode($json, true);
        $terminal->insertTerminal($data);
        break;
case "updateTerminalStatus":
    $id = $_POST['id'] ?? $_GET['id'] ?? 0;
    $status = $_POST['status'] ?? $_GET['status'] ?? 0;
    $terminal->updateTerminalStatus((int)$id, (int)$status);
    break;

    default:
        echo json_encode(["status"=>"error","message"=>"Invalid operation"]);
}
