const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
document.addEventListener("DOMContentLoaded", () => {
  displayWarehouses();

  // 🔹 Hook up the New Warehouse button
  const addBtn = document.getElementById("btn-add-warehouse");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      insertWarehouseModal();
    });
  }
});
// 🔹 Display warehouses
const displayWarehouses = async () => {
  const div = document.getElementById("warehouse-table-div");
  div.innerHTML = `<div class="p-5 text-center"><div class="spinner-border text-primary"></div></div>`;

  try {
    const res = await axios.get(`${baseApiUrl}/warehouse.php`, { params: { operation: "getWarehouses" } });
    if (res.data.length) {
      renderWarehouseTable(res.data);
    } else {
      div.innerHTML = `<div class="p-4 text-center text-muted">No warehouses found.</div>`;
    }
  } catch {
    div.innerHTML = `<div class="p-4 text-danger text-center">Error loading warehouses.</div>`;
  }
};

// 🔹 Render warehouses table
const renderWarehouseTable = (data) => {
  const div = document.getElementById("warehouse-table-div");
  let html = `
    <table class="table table-striped align-middle">
      <thead" >
        <tr style="background-color:#2563eb; color:white;">
          <th>Name</th>
          <th>Location</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;
  data.forEach(w => {
    html += `
      <tr>
        <td>${w.name}</td>
        <td>${w.location || "-"}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="viewWarehouseProducts(${w.id}, '${w.name}')">
            <i class="bi bi-eye"></i> View
          </button>
        </td>
      </tr>
    `;
  });
  html += `</tbody></table>`;
  div.innerHTML = html;
};

// 🔹 Modal to add warehouse
export const insertWarehouseModal = () => {
  const modalEl = document.getElementById("blank-modal");
  const modal = new bootstrap.Modal(modalEl);

  document.getElementById("blank-modal-title").innerText = "New Warehouse";
  document.getElementById("blank-main-div").innerHTML = `
    <div class="mb-3">
      <label class="form-label">Warehouse Name</label>
      <input type="text" id="warehouse-name" class="form-control" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Location</label>
      <input type="text" id="warehouse-location" class="form-control">
    </div>
  `;

  document.getElementById("blank-modal-footer").innerHTML = `
    <button class="btn btn-success" id="btn-save-warehouse">Save</button>
  `;

  document.getElementById("btn-save-warehouse").addEventListener("click", async () => {
    const name = document.getElementById("warehouse-name").value.trim();
    const location = document.getElementById("warehouse-location").value.trim();

    if (!name) {
      alert("Please enter a warehouse name.");
      return;
    }

    try {
      const res = await axios.post(`${baseApiUrl}/warehouse.php`, new URLSearchParams({
        operation: "insertWarehouse",
        json: JSON.stringify({ name, location })
      }));
      if (res.data.status === "success") {
        alert("Warehouse created successfully!");
        modal.hide();
        displayWarehouses(); // refresh table
      } else {
        alert(res.data.message || "Error creating warehouse");
      }
    } catch {
      alert("Error creating warehouse");
    }
  });

  modal.show();
};

// 🔹 View products in warehouse
window.viewWarehouseProducts = async (warehouseId, warehouseName) => {
  const modalEl = document.getElementById("blank-modal");
  const modal = new bootstrap.Modal(modalEl);

  document.getElementById("blank-modal-title").innerText = `Products in ${warehouseName}`;
  document.getElementById("blank-main-div").innerHTML = `<div class="p-4 text-center"><div class="spinner-border text-primary"></div></div>`;
  document.getElementById("blank-modal-footer").innerHTML = `
    <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
  `;

  modal.show();

  try {
    const res = await axios.get(`${baseApiUrl}/warehouse.php`, {
      params: { operation: "getProductsByWarehouse", warehouseId }
    });

    if (res.data.length) {
      let html = `
        <table class="table table-bordered align-middle">
          <thead class="table-light">
            <tr>
              <th>Product</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
      `;
      res.data.forEach(p => {
        html += `
          <tr>
            <td>${p.name}</td>
            <td>${p.quantity}</td>
          </tr>
        `;
      });
      html += `</tbody></table>`;
      document.getElementById("blank-main-div").innerHTML = html;
    } else {
      document.getElementById("blank-main-div").innerHTML = `<div class="p-4 text-center text-muted">No products in this warehouse.</div>`;
    }
  } catch {
    document.getElementById("blank-main-div").innerHTML = `<div class="p-4 text-danger text-center">Error loading products.</div>`;
  }
};

// Load warehouses at startup
document.addEventListener("DOMContentLoaded", () => {
  displayWarehouses();
});
