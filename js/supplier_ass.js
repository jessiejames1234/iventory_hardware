import { updateModal } from "./modules/model_supplier.js";
import { requireRole, logout } from "./auth.js";

// 🔐 Admin only
const user = requireRole(["admin"]);
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

let allAssignments = [];
let currentPage = 1;
let rowsPerPage = 10;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logged-user").textContent = user.name;
  document.getElementById("btn-logout").addEventListener("click", logout);

  // Load assignments
  displayAssignments();

  // Search filter
  const searchInput = document.getElementById("table-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => renderTable());
  }

  // Rows per page
  document.getElementById("rows-per-page-footer").addEventListener("change", (e) => {
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderTable();
  });

  // Assign button
  document.getElementById("btn-assign-supplier").addEventListener("click", () => {
    updateModal();
  });
});

const displayAssignments = async () => {
  const div = document.getElementById("supplier-table-div");
  div.innerHTML = `
    <div class="d-flex justify-content-center align-items-center p-5">
      <div class="spinner-border text-primary me-2" role="status"></div>
      <span class="fw-semibold">Loading assignments...</span>
    </div>
  `;

  try {
    const res = await axios.get(`${baseApiUrl}/supplier_ass.php`, {
      params: { operation: "getAllAssignments" },
    });

    if (res.status === 200) {
      setTimeout(() => {
        allAssignments = res.data || [];
        renderTable();
      }, 1000);
    } else {
      div.innerHTML = `<div class="text-center text-danger p-4 fw-semibold">Error loading assignments</div>`;
    }
  } catch (err) {
    div.innerHTML = `<div class="text-center text-danger p-4 fw-semibold">Error loading assignments</div>`;
    console.error(err);
  }
};

const renderTable = () => {
  const div = document.getElementById("supplier-table-div");
  const searchValue = document.getElementById("table-search").value.toLowerCase();

  const filtered = allAssignments.filter(
    (a) =>
      a.product_name.toLowerCase().includes(searchValue) ||
      a.supplier_name.toLowerCase().includes(searchValue)
  );

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = filtered.slice(start, end);

  if (filtered.length === 0) {
    div.innerHTML = `<div class="alert alert-secondary text-center m-0">No matching records found.</div>`;
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
        <th>Product</th>
        <th>Supplier</th>
        <th class="text-center">Actions</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement("tbody");
  pageData.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center fw-semibold">${start + index + 1}</td>
      <td>${row.product_name}</td>
      <td>${row.supplier_name}</td>
      <td class="text-center">
        <div class="dropdown">
          <button class="btn btn-sm border-0 bg-transparent" data-bs-toggle="dropdown" style="padding: 4px 8px;">
            <i class="bi bi-three-dots-vertical fs-5 text-secondary"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
            <li><a class="dropdown-item d-flex align-items-center gap-2 edit-assignment" href="#"><i class="bi bi-pencil-square text-warning"></i> Update</a></li>
            <li><a class="dropdown-item d-flex align-items-center gap-2 delete-assignment" href="#"><i class="bi bi-trash text-danger"></i> Delete</a></li>
          </ul>
        </div>
      </td>
    `;

    // Event listeners
    tr.querySelector(".edit-assignment").addEventListener("click", () => {
      updateModal(row.product_supplier_id, displayAssignments);
    });
    tr.querySelector(".delete-assignment").addEventListener("click", () => {
      deleteAssignment(row.product_supplier_id);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  div.innerHTML = "";
  div.appendChild(table);

  renderPagination(totalItems);
};

// 🧭 Pagination identical to product.js
const renderPagination = (totalItems) => {
  const pagination = document.getElementById("pagination");
  const tableInfo = document.getElementById("table-info");
  const rowsSelect = document.getElementById("rows-per-page-footer");

  pagination.innerHTML = "";
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  if (totalPages <= 0) {
    tableInfo.textContent = "No entries available";
    return;
  }

  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalItems);
  tableInfo.textContent = `Showing ${start} to ${end} of ${totalItems} entries`;

  // First <<
  const firstLi = document.createElement("li");
  firstLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  firstLi.innerHTML = `<button class="page-link">&laquo;&laquo;</button>`;
  firstLi.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage = 1;
      renderTable();
    }
  });
  pagination.appendChild(firstLi);

  // Previous <
  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  prevLi.innerHTML = `<button class="page-link">&lsaquo;</button>`;
  prevLi.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });
  pagination.appendChild(prevLi);

  // Current page number
  const pageLi = document.createElement("li");
  pageLi.className = "page-item active";
  pageLi.innerHTML = `<button class="page-link">${currentPage}</button>`;
  pagination.appendChild(pageLi);

  // Next >
  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
  nextLi.innerHTML = `<button class="page-link">&rsaquo;</button>`;
  nextLi.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });
  pagination.appendChild(nextLi);

  // Last >>
  const lastLi = document.createElement("li");
  lastLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
  lastLi.innerHTML = `<button class="page-link">&raquo;&raquo;</button>`;
  lastLi.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage = totalPages;
      renderTable();
    }
  });
  pagination.appendChild(lastLi);

  rowsSelect.value = rowsPerPage;
};

// 🗑️ Delete assignment
const deleteAssignment = async (id) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This assignment will be permanently deleted.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Yes, delete it!",
  });

  if (result.isConfirmed) {
    try {
      await axios.post(`${baseApiUrl}/supplier_ass.php`, {
        operation: "deleteAssignment",
        id,
      });
      Swal.fire("Deleted!", "Assignment removed successfully.", "success");
      displayAssignments();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete assignment.", "error");
    }
  }
};
