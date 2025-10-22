import { insertSupplierModal, viewSupplierModal, updateSupplierModal } from "./modules/model_supplier.js";
import { requireRole, logout } from "./auth.js";

// 🔐 Admin only
const user = requireRole(["admin"]);
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

let allSuppliers = [];
let currentPage = 1;
let rowsPerPage = 10;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logged-user").textContent = user.name;
  document.getElementById("btn-logout").addEventListener("click", logout);

  displaySuppliers();

  // ➕ Add Supplier
  const addBtn = document.getElementById("btn-add-supplier");
  if (addBtn) {
    addBtn.addEventListener("click", () => insertSupplierModal(displaySuppliers));
  }

  // 🔍 Search
  const searchInput = document.getElementById("table-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => renderSupplierTable());
  }

  // 📄 Rows per page
  const rowsSelect = document.getElementById("rows-per-page-footer");
  if (rowsSelect) {
    rowsSelect.addEventListener("change", (e) => {
      rowsPerPage = parseInt(e.target.value);
      currentPage = 1;
      renderSupplierTable();
    });
  }
});

const displaySuppliers = async () => {
  const tableDiv = document.getElementById("supplier-table-div");
  tableDiv.innerHTML = `
    <div class="d-flex justify-content-center align-items-center p-5">
      <div class="spinner-border text-primary me-2" role="status"></div>
      <span class="fw-semibold">Loading suppliers...</span>
    </div>
  `;

  try {
    const res = await axios.get(`${baseApiUrl}/suppliers.php`, {
      params: { operation: "getAllSuppliers" },
    });

    if (res.status === 200 && Array.isArray(res.data)) {
      allSuppliers = res.data;
      renderSupplierTable();
    } else {
      tableDiv.innerHTML = `<div class="alert alert-warning m-0">No supplier data found.</div>`;
    }
  } catch (err) {
    console.error(err);
    tableDiv.innerHTML = `<div class="alert alert-danger m-0">Error loading suppliers!</div>`;
  }
};

const renderSupplierTable = () => {
  const div = document.getElementById("supplier-table-div");
  const searchValue = document.getElementById("table-search").value.toLowerCase();

  const filtered = allSuppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchValue) ||
      s.company_name.toLowerCase().includes(searchValue) ||
      s.contact_info.toLowerCase().includes(searchValue)
  );

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = filtered.slice(start, end);

  if (filtered.length === 0) {
    div.innerHTML = `<div class="alert alert-secondary text-center m-0">No matching suppliers found.</div>`;
    document.getElementById("table-info").textContent = "No entries available";
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  const table = document.createElement("table");
  table.classList.add("table", "table-hover", "align-middle", "mb-0");

  table.innerHTML = `
    <thead class="bg-light text-secondary">
      <tr>
        <th class="text-center" style="width: 60px;">#</th>
        <th>NAME</th>
        <th>COMPANY</th>
        <th>CONTACT</th>
        <th>EMAIL</th>
        <th>ADDRESS</th>
        <th>NOTES</th>
        <th>STATUS</th>
        <th class="text-center">ACTIONS</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement("tbody");
  pageData.forEach((supplier, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center fw-semibold">${start + index + 1}</td>
      <td>${supplier.name}</td>
      <td>${supplier.company_name}</td>
      <td>${supplier.contact_info}</td>
      <td>${supplier.email}</td>
      <td>${supplier.address}</td>
      <td>${supplier.notes || "-"}</td>
      <td>${supplier.is_active == 1
        ? '<span class="badge bg-success-subtle text-success">Active</span>'
        : '<span class="badge bg-danger-subtle text-danger">Inactive</span>'}
      </td>
      <td class="text-center">
        <div class="dropdown">
          <button class="btn btn-sm border-0 bg-transparent" data-bs-toggle="dropdown" style="padding: 4px 8px;">
            <i class="bi bi-three-dots-vertical fs-5 text-secondary"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
            <li><a class="dropdown-item view-supplier" href="#"><i class="bi bi-eye text-primary"></i> View</a></li>
            <li><a class="dropdown-item edit-supplier" href="#"><i class="bi bi-pencil-square text-warning"></i> Update</a></li>
            <li><a class="dropdown-item delete-supplier" href="#"><i class="bi bi-trash text-danger"></i> Delete</a></li>
          </ul>
        </div>
      </td>
    `;

    // Event listeners
    tr.querySelector(".view-supplier").addEventListener("click", () =>
      viewSupplierModal(supplier.supplier_id)
    );

    tr.querySelector(".edit-supplier").addEventListener("click", () =>
      updateSupplierModal(supplier.supplier_id, displaySuppliers)
    );

    tr.querySelector(".delete-supplier").addEventListener("click", () =>
      deleteSupplier(supplier.supplier_id)
    );

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  div.innerHTML = "";
  div.appendChild(table);

  renderPagination(totalItems);
};

const renderPagination = (totalItems) => {
  const pagination = document.getElementById("pagination");
  const tableInfo = document.getElementById("table-info");
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  pagination.innerHTML = "";
  if (totalPages <= 0) {
    tableInfo.textContent = "No entries available";
    return;
  }

  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalItems);
  tableInfo.textContent = `Showing ${start} to ${end} of ${totalItems} entries`;

  const createPageBtn = (label, disabled, callback) => {
    const li = document.createElement("li");
    li.className = `page-item ${disabled ? "disabled" : ""}`;
    li.innerHTML = `<button class="page-link">${label}</button>`;
    if (!disabled) li.addEventListener("click", callback);
    pagination.appendChild(li);
  };

  createPageBtn("««", currentPage === 1, () => {
    currentPage = 1;
    renderSupplierTable();
  });
  createPageBtn("‹", currentPage === 1, () => {
    currentPage--;
    renderSupplierTable();
  });

  const pageLi = document.createElement("li");
  pageLi.className = "page-item active";
  pageLi.innerHTML = `<button class="page-link">${currentPage}</button>`;
  pagination.appendChild(pageLi);

  createPageBtn("›", currentPage === totalPages, () => {
    currentPage++;
    renderSupplierTable();
  });
  createPageBtn("»»", currentPage === totalPages, () => {
    currentPage = totalPages;
    renderSupplierTable();
  });
};

// 🗑️ Delete with SweetAlert
const deleteSupplier = async (supplierId) => {
  const confirm = await Swal.fire({
    title: "Are you sure?",
    text: "This supplier will be permanently deleted.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Yes, delete it!",
  });

  if (confirm.isConfirmed) {
    try {
      const formData = new FormData();
      formData.append("operation", "deleteSupplier");
      formData.append("json", JSON.stringify({ supplierId }));

      const res = await axios.post(`${baseApiUrl}/suppliers.php`, formData);
      if (res.data == 1) {
        Swal.fire("Deleted!", "Supplier deleted successfully.", "success");
        displaySuppliers();
      } else {
        Swal.fire("Error", "Failed to delete supplier.", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Error deleting supplier.", "error");
    }
  }
};
