import { checkAuth, logout } from "./auth.js";

const user = checkAuth(); // { staff_id, name, role, assigned_warehouse_id }
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logged-user").textContent = user.name;
  document.getElementById("btn-logout").addEventListener("click", logout);

  // Only warehouse_manager can stock-in
  if (user.role !== "warehouse_manager") {
    document.getElementById("btn-add-stockin").style.display = "none";
  }

  displayStockIn();
});

// 🔹 Fetch all stock in
async function displayStockIn() {
  try {
    const res = await axios.get(`${baseApiUrl}/stock_in.php`, {
      params: {
        operation: "getAllStockIn",
        role: user.role,
        warehouse_id: user.assigned_warehouse_id
      }
    });

    if (Array.isArray(res.data) && res.data.length > 0) {
      displayStockInTable(res.data);
    } else {
      document.getElementById("stockin-table-div").innerHTML =
        `<div class="alert alert-info text-center m-3">No Stock In records found</div>`;
    }
  } catch (err) {
    console.error("Error loading stock in:", err);
  }
}

// 🔹 Build stock in table
function displayStockInTable(records) {
  const tableDiv = document.getElementById("stockin-table-div");
  tableDiv.innerHTML = "";

  const table = document.createElement("table");
  table.classList.add("table", "table-hover", "table-striped", "table-sm");

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>ID</th>
      <th>Product</th>
      <th>Warehouse</th>
      <th>Quantity</th>
      <th>Date</th>
      <th>Staff</th>
    </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  records.forEach((r) => {
    let row = document.createElement("tr");
    row.innerHTML = `
      <td>${r.stock_in_id}</td>
      <td>${r.product_name}</td>
      <td>${r.warehouse_name}</td>
      <td>${r.quantity}</td>
<td>${r.date_received}</td>
<td>${r.staff_name || "-"}</td>
    `;
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  tableDiv.appendChild(table);
}

// 🔹 Add stock-in modal
document.getElementById("btn-add-stockin").addEventListener("click", async () => {
  const myModal = new bootstrap.Modal(document.getElementById("blank-modal"));
  document.getElementById("blank-modal-title").innerText = "Add Stock In";

  // fetch all products
  const products = await getList("getProducts");



  let myHtml = `
    <table class="table table-sm">
      <tr>
        <td>Product</td>
        <td>
          <select id="stockin-product" class="form-select">
            <option value="">-- Select Product --</option>
        ${products.map(p => `<option value="${p.product_id}">${p.name}</option>`).join("")}
          </select>
        </td>
      </tr>
      <tr>
        <td>Supplier</td>
        <td>
          <select id="stockin-supplier" class="form-select" disabled>
            <option value="">-- Select Supplier --</option>
          </select>
        </td>
      </tr>
      <tr>
        <td>Quantity</td>
        <td><input id="stockin-qty" type="number" class="form-control" min="1" /></td>
      </tr>
    </table>`;

  document.getElementById("blank-main-div").innerHTML = myHtml;

  document.getElementById("blank-modal-footer").innerHTML = `
    <button class="btn btn-primary btn-sm w-100" id="btn-save-stockin">Save</button>
    <button class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
  `;

  // ✅ When product changes → fetch suppliers
  document.getElementById("stockin-product").addEventListener("change", async (e) => {
    const pid = e.target.value;
    const supplierSelect = document.getElementById("stockin-supplier");

    if (!pid) {
      supplierSelect.innerHTML = `<option value="">-- Select Supplier --</option>`;
      supplierSelect.disabled = true;
      return;
    }

    const suppliers = await getSuppliersByProduct(pid);

    let supplierOptions = suppliers.map(
      s => `<option value="${s.supplier_id}">${s.supplier_name}</option>`
    ).join("");

    supplierSelect.innerHTML = `<option value="">-- Select Supplier --</option>` + supplierOptions;
    supplierSelect.disabled = false;
  });

  // ✅ Save stock-in
  document.getElementById("btn-save-stockin").addEventListener("click", async () => {
    const jsonData = {
      productId: document.getElementById("stockin-product").value,
      supplierId: document.getElementById("stockin-supplier").value,
      quantity: document.getElementById("stockin-qty").value,
      staffId: user.staff_id
    };

    const formData = new FormData();
    formData.append("operation", "insertStockIn");
    formData.append("role", user.role);
    formData.append("assigned_warehouse_id", user.assigned_warehouse_id);
    formData.append("json", JSON.stringify(jsonData));

    const response = await axios.post(`${baseApiUrl}/stock_in.php`, formData);
    if (response.data.status === "success") {
      displayStockIn();
      myModal.hide();
      alert("Stock In added!");
    } else {
      alert(response.data.message || "Error saving stock in");
    }
  });

  myModal.show();
});

// 🔹 fetch suppliers by product
async function getSuppliersByProduct(productId) {
  const response = await axios.get(`${baseApiUrl}/stock_in.php`, {
    params: { operation: "getSuppliersByProduct", product_id: productId }
  });
  return response.data;
}

async function getProducts() {
  const response = await axios.get(`${baseApiUrl}/stock_in.php`, {
    params: { operation: "getAllProducts" }
  });
  return response.data;
}

const getList = async (operation) => {
  try {
    const res = await axios.get(`${baseApiUrl}/product.php`, { params: { operation } });
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
};