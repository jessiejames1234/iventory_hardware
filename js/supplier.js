  import { insertSupplierModal,viewSupplierModal,updateSupplierModal } from "./modules/model_supplier.js";

  import { checkAuth, logout } from "./auth.js";

  const user = checkAuth(); // 🔐 Redirects if not logged in
  const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
  sessionStorage.setItem("baseAPIUrl", baseApiUrl);

  document.addEventListener("DOMContentLoaded", () => {
      // 👤 Display logged-in user
      document.getElementById("logged-user").textContent = user.name;
    
      // 🚪 Logout
      document.getElementById("btn-logout").addEventListener("click", logout);
    
    displaySuppliers();

    const addBtn = document.getElementById("btn-add-supplier");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        insertSupplierModal(displaySuppliers);
      });
    }
  });

const displaySuppliers = async () => {
  const tableDiv = document.getElementById("supplier-table-div");
  if (!tableDiv) return;

  // 🔄 Show loading spinner
  tableDiv.innerHTML = `
    <div class="d-flex justify-content-center align-items-center p-5">
      <div class="spinner-border text-primary me-2" role="status"></div>
      <span class="fw-semibold">Loading suppliers...</span>
    </div>
  `;

  try {
    const response = await axios.get(`${baseApiUrl}/suppliers.php`, {
      params: { operation: "getAllSuppliers" },
    });

    setTimeout(() => {
      if (response.status === 200 && Array.isArray(response.data) && response.data.length) {
        displaySuppliersTable(response.data);
      } else {
        tableDiv.innerHTML = `
          <div class="alert alert-warning m-0">
            No supplier data found.
          </div>
        `;
      }
    }, 1000); // smooth delay for transition

  } catch (err) {
    console.error(err);
    tableDiv.innerHTML = `
      <div class="alert alert-danger m-0">
        Error loading suppliers!
      </div>
    `;
  }
};

const displaySuppliersTable = (suppliers) => {
  const tableDiv = document.getElementById("supplier-table-div");
  tableDiv.innerHTML = "";

  const table = document.createElement("table");
  table.classList.add("table", "table-hover", "table-striped", "table-sm");

  table.innerHTML = `
    <thead>
      <tr>
        <th>ID</th>
        <th>NAME</th>
        <th>COMPANY</th>
        <th>CONTACT</th>
        <th>EMAIL</th>
        <th>ADDRESS</th>
        <th>NOTES</th>
        <th>STATUS</th>
        <th>ACTION</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement("tbody");

  suppliers.forEach((supplier) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${supplier.supplier_id}</td>
      <td>${supplier.name}</td>
      <td>${supplier.company_name}</td>
      <td>${supplier.contact_info}</td>
      <td>${supplier.email}</td>
      <td>${supplier.address}</td>
      <td>${supplier.notes}</td>
      <td>${supplier.is_active == 1 ? "Active" : "Inactive"}</td>
      <td>
        <button type='button' class='btn btn-primary btn-sm btn-view'>View</button>
        <button type='button' class='btn btn-success btn-sm btn-update'>Update</button>
        <button type='button' class='btn btn-danger btn-sm btn-delete'>Delete</button>
      </td>
    `;

    // View
    row.querySelector(".btn-view").addEventListener("click", () => {
      viewSupplierModal(supplier.supplier_id);
    });

    // Update
    row.querySelector(".btn-update").addEventListener("click", () => {
      updateSupplierModal(supplier.supplier_id, displaySuppliers);
    });

    // Delete
    row.querySelector(".btn-delete").addEventListener("click", () => {
      deleteSupplier(supplier.supplier_id);
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  tableDiv.appendChild(table);
};

const deleteSupplier = async (supplierId) => {
  if (!confirm("Are you sure you want to delete this supplier?")) return;

  const formData = new FormData();
  formData.append("operation", "deleteSupplier");
  formData.append("json", JSON.stringify({ supplierId }));

  try {
    const response = await axios.post(`${baseApiUrl}/suppliers.php`, formData);
    if (response.data == 1) {
      displaySuppliers();
      alert("Supplier deleted successfully!");
    } else {
      alert("Error deleting supplier!");
    }
  } catch (err) {
    console.error(err);
    alert("Error deleting supplier!");
  }
};