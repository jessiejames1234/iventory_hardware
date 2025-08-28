import { checkAuth, logout } from "./auth.js";

const user = checkAuth();
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware22/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logged-user").textContent = user.name;
  document.getElementById("btn-logout").addEventListener("click", logout);

  // 🔒 Hide Add Transfer button on archive page
  document.getElementById("btn-add-transfer").style.display = "none";

  displayArchivedTransfers();
});

async function displayArchivedTransfers() {
  try {
    const res = await axios.get(`${baseApiUrl}/stock_transfer.php`, {
      params: {
        operation: "getAllTransfers",
        role: user.role,
        warehouse_id: user.assigned_warehouse_id
      }
    });

    console.log("Archived transfers response:", res.data);

    if (Array.isArray(res.data)) {
      // ✅ Only archived transfers
      const archivedTransfers = res.data.filter(
        t => t.status === "completed" || t.status === "cancelled"
      );
      displayTransfersTable(archivedTransfers);
    } else {
      console.error("Expected array, got:", res.data);
    }
  } catch (err) {
    console.error("Error loading archived transfers:", err);
  }
}

// 🔹 Reuse the same table builder but without action buttons
function displayTransfersTable(transfers) {
  const tableDiv = document.getElementById("transfer-table-div");
  tableDiv.innerHTML = "";

  if (!transfers.length) {
    tableDiv.innerHTML = `<div class="alert alert-info">No archived transfers.</div>`;
    return;
  }

  const table = document.createElement("table");
  table.classList.add("table", "table-hover", "table-striped", "table-sm");

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>ID</th>
      <th>Product</th>
      <th>From Warehouse</th>
      <th>Quantity</th>
      <th>Status</th>
      <th>Transferred By</th>
    </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  transfers.forEach((t) => {
    let row = document.createElement("tr");
    row.innerHTML = `
      <td>${t.transfer_id}</td>
      <td>${t.product_name}</td>
      <td>${t.from_warehouse_name || "-"}</td>
      <td>${t.quantity}</td>
      <td><span class="badge ${t.status === "completed" ? "bg-success" : "bg-danger"}">${t.status}</span></td>
      <td>${t.staff_name || "-"}</td>
    `;
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  tableDiv.appendChild(table);
}
