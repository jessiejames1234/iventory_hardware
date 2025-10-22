import { requireRole, logout } from "./auth.js";

// 🔐 manager only
const user = requireRole(["warehouse_manager"]);
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logged-user").textContent = user.name;
  document.getElementById("btn-logout").addEventListener("click", logout);

  // Only Admins see Add Transfer button
  if (user.role !== "admin") {
    document.getElementById("btn-add-transfer").style.display = "none";
  }

  displayTransfers();
});

// 🔹 Fetch all transfers
async function displayTransfers() {
  try {
    const res = await axios.get(`${baseApiUrl}/stock_transfer.php`, {
      params: {
        operation: "getAllTransfers",
        role: user.role,
        warehouse_id: user.assigned_warehouse_id
      }
    });

    console.log("Transfers response:", res.data);

    if (Array.isArray(res.data)) {
      // ✅ Only ACTIVE transfers
      const activeTransfers = res.data.filter(
        t => t.status !== "completed" && t.status !== "cancelled"
      );
      displayTransfersTable(activeTransfers);
    } else {
      console.error("Expected array, got:", res.data);
    }
  } catch (err) {
    console.error("Error loading transfers:", err);
  }
}


// 🔹 Build transfer table
// 🔹 Build transfer table
const displayTransfersTable = (transfers) => {
  const tableDiv = document.getElementById("transfer-table-div");
  tableDiv.innerHTML = "";

  // ✅ If no transfer requests
  if (!transfers || transfers.length === 0) {
    tableDiv.innerHTML = `<div class="alert alert-info text-center m-3">No requests found</div>`;
    return;
  }

  const table = document.createElement("table");
  table.classList.add("table", "table-hover", "table-striped", "table-sm");

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Product</th>
      <th>From Warehouse</th>
      <th>Quantity</th>
      <th>Status</th>
      <th>Transferred By</th>
      <th>Action</th>
    </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  transfers.forEach((t) => {
    let row = document.createElement("tr");
    row.innerHTML = `
      <td>${t.product_name}</td>
      <td>${t.from_warehouse_name || "-"}</td>
      <td>${t.quantity}</td>
      <td><span class="badge bg-info">${t.status}</span></td>
      <td>${t.staff_name || "-"}</td>
      <td></td>
    `;

    const actionTd = row.querySelector("td:last-child");

    // ✅ Admin Actions
    if (user.role === "admin") {
      if (t.status === "pending" || t.status === "approved") {
        addActionButton(actionTd, "Cancel", "danger", () =>
          updateStatus(t.transfer_id, "cancelled")
        );
      }
      if (t.status === "in_transit") {
        addActionButton(actionTd, "Receive", "success", () =>
          updateStatus(t.transfer_id, "completed")
        );
      }
    }

    // ✅ Warehouse Manager Actions
    if (user.role === "warehouse_manager") {
      if (t.status === "pending") {
        addActionButton(actionTd, "Approve", "primary", () =>
          updateStatus(t.transfer_id, "approved")
        );
      }
      if (t.status === "approved") {
        addActionButton(actionTd, "Deliver", "warning", () =>
          updateStatus(t.transfer_id, "in_transit")
        );
      }
    }

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  tableDiv.appendChild(table);
};


// 🔹 Reusable action button
const addActionButton = (container, label, color, onClick) => {
  let btn = document.createElement("button");
  btn.classList.add("btn", `btn-${color}`, "btn-sm", "me-1");
  btn.textContent = label;

  btn.addEventListener("click", () => {
    onClick(); // no need to check if (await onClick()), because updateStatus handles refresh
  });

  container.appendChild(btn);
};

// 🔹 Update transfer status
// 🔹 Update transfer status
const updateStatus = async (transferId, status) => {
  try {
    const formData = new FormData();
    formData.append("operation", "updateStatus");
    formData.append("json", JSON.stringify({ transferId, status }));

    const response = await axios.post(`${baseApiUrl}/stock_transfer.php`, formData);

    // Backend might return 1 or {status:"success"}
    if (response.data == 1 || response.data?.status === "success") {
      await displayTransfers(); // 🔄 refresh table
      Swal.fire({
        title: "Success",
        text: `Transfer status updated to "${status}".`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
      return true;
    } else {
      console.error("Update failed:", response.data);
      Swal.fire({
        title: "Failed",
        text: "Could not update transfer status.",
        icon: "error"
      });
      return false;
    }
  } catch (err) {
    console.error("Update error:", err);
    Swal.fire({
      title: "Error",
      text: "An error occurred while updating status.",
      icon: "error"
    });
    return false;
  }
};


// 🔹 Add transfer modal
document.getElementById("btn-add-transfer").addEventListener("click", async () => {
  const myModal = new bootstrap.Modal(document.getElementById("blank-modal"));
  document.getElementById("blank-modal-title").innerText = "Add Stock Transfer";

  // fetch warehouses
  const warehouses = await getWarehouses();

  let warehouseOptions = warehouses
    .map(w => `<option value="${w.warehouse_id}">${w.warehouse_name}</option>`)
    .join("");

  let myHtml = `
    <table class="table table-sm">
      <tr>
        <td>Warehouse</td>
        <td>
          <select id="transfer-warehouse" class="form-select">
            <option value="">-- Select Warehouse --</option>
            ${warehouseOptions}
          </select>
        </td>
      </tr>
      <tr>
        <td>Product</td>
        <td>
          <select id="transfer-product" class="form-select" disabled>
            <option value="">-- Select Product --</option>
          </select>
        </td>
      </tr>
      <tr>
        <td>Quantity</td>
        <td><input id="transfer-qty" type="number" class="form-control" min="1" /></td>
      </tr>
    </table>`;
  
  document.getElementById("blank-main-div").innerHTML = myHtml;

  document.getElementById("blank-modal-footer").innerHTML = `
    <button class="btn btn-primary btn-sm w-100" id="btn-save-transfer">Save</button>
    <button class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
  `;

  // ✅ When warehouse changes → fetch products
  document.getElementById("transfer-warehouse").addEventListener("change", async (e) => {
    const wid = e.target.value;
    const productSelect = document.getElementById("transfer-product");

    if (!wid) {
      productSelect.innerHTML = `<option value="">-- Select Product --</option>`;
      productSelect.disabled = true;
      return;
    }

    const products = await getProductsByWarehouse(wid);

    let productOptions = products.map(
      p => `<option value="${p.product_id}">${p.product_name} (Stock: ${p.quantity})</option>`
    ).join("");

    productSelect.innerHTML = `<option value="">-- Select Product --</option>` + productOptions;
    productSelect.disabled = false;
  });

  // ✅ Save transfer
// ✅ Save transfer
document.getElementById("btn-save-transfer").addEventListener("click", async () => {
  const jsonData = {
    productId: document.getElementById("transfer-product").value,
    warehouseId: document.getElementById("transfer-warehouse").value,
    quantity: document.getElementById("transfer-qty").value,
    staffId: user.staff_id,
  };

  if (!jsonData.productId || !jsonData.warehouseId || !jsonData.quantity) {
    Swal.fire({
      title: "Missing Fields",
      text: "Please select warehouse, product, and quantity.",
      icon: "warning",
      timer: 1500,
      showConfirmButton: false
    });
    return;
  }

  const formData = new FormData();
  formData.append("operation", "insertTransfer");
  formData.append("json", JSON.stringify(jsonData));

  try {
    const response = await axios.post(`${baseApiUrl}/stock_transfer.php`, formData);
    if (response.data == 1 || response.data?.status === "success") {
      Swal.fire({
        title: "Transfer Added",
        text: "Transfer request has been created successfully.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        displayTransfers();
        myModal.hide();
      });
    } else {
      Swal.fire({
        title: "Failed",
        text: response.data?.message || "Could not create transfer.",
        icon: "error"
      });
    }
  } catch (err) {
    Swal.fire({
      title: "Error",
      text: "An error occurred while creating transfer.",
      icon: "error"
    });
  }
});


  myModal.show();
});


// 🔹 Get warehouses
// ✅ fetch warehouses
const getWarehouses = async () => {
  const response = await axios.get(`${baseApiUrl}/stock_transfer.php`, {
    params: { operation: "getWarehouses" },
  });
  return response.data;
};

// ✅ fetch products by warehouse
const getProductsByWarehouse = async (warehouseId) => {
  const response = await axios.get(`${baseApiUrl}/stock_transfer.php`, {
    params: { operation: "getProductsByWarehouse", warehouseId }
  });
  return response.data;
};
