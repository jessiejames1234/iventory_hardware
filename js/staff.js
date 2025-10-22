import { insertStaffModal} from "./modules/insert_staff.js";
import { requireRole, logout } from "./auth.js";

// 🔐 Admin only
const user = requireRole(["admin"]);
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

let allStaff = [];
let currentPage = 1;
let rowsPerPage = 10;

document.addEventListener("DOMContentLoaded", () => {
  // 👤 Display logged-in user
  document.getElementById("logged-user").textContent = user.name;

  // 🚪 Logout
  document.getElementById("btn-logout")?.addEventListener("click", logout);

  // ➕ Add staff
  document.getElementById("btn-add-staff")?.addEventListener("click", () => {
    insertStaffModal(displayStaff);
  });

  // 📋 Rows per page
  const rowsSelect = document.getElementById("rows-per-page-footer");
  rowsSelect?.addEventListener("change", (e) => {
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderStaffTable();
  });

  // 🔍 Search input
  const searchInput = document.getElementById("table-search");
  searchInput?.addEventListener("input", () => {
    currentPage = 1;
    renderStaffTable();
  });

  // Load staff
  displayStaff();
});

// ✅ Fetch staff list
const displayStaff = async () => {
  const tableDiv = document.getElementById("table-div");
  if (!tableDiv) return;

  tableDiv.innerHTML = `
    <div class="d-flex justify-content-center align-items-center p-5">
      <div class="spinner-border text-primary me-2" role="status"></div>
      <span class="fw-semibold">Loading staff...</span>
    </div>
  `;

  try {
    const res = await axios.get(`${baseApiUrl}/staff.php`, { params: { operation: "getAllStaff" } });
    if (Array.isArray(res.data)) {
      allStaff = res.data;
      renderStaffTable();
    } else {
      tableDiv.innerHTML = `<div class="alert alert-warning m-0">No staff found.</div>`;
    }
  } catch (err) {
    console.error("Display Error:", err);
    tableDiv.innerHTML = `<div class="alert alert-danger m-0">Error loading staff list.</div>`;
  }
};

// ✅ Render table with search & pagination
const renderStaffTable = () => {
  const tableDiv = document.getElementById("table-div");
  const searchValue = document.getElementById("table-search")?.value.toLowerCase() || "";

  const filtered = allStaff.filter(
    s =>
      s.name.toLowerCase().includes(searchValue) ||
      s.email.toLowerCase().includes(searchValue) ||
      s.username.toLowerCase().includes(searchValue) ||
      (s.role && s.role.toLowerCase().includes(searchValue)) ||
      (s.location_name && s.location_name.toLowerCase().includes(searchValue))
  );

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = filtered.slice(start, end);

  if (filtered.length === 0) {
    tableDiv.innerHTML = `<div class="alert alert-secondary text-center m-0">No matching staff found.</div>`;
    document.getElementById("table-info").textContent = "No entries available";
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  const table = document.createElement("table");
  table.className = "table table-striped table-hover table-sm align-middle";
  table.innerHTML = `
    <thead class="table-light">
      <tr>
        <th class="text-center" style="width: 50px;">#</th>
        <th>Name</th>
        <th>Email</th>
        <th>Username</th>
        <th>Role</th>
        <th>Location</th>
        <th>Status</th>
        <th class="text-center">Action</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement("tbody");

  pageData.forEach((staff, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center fw-semibold">${start + index + 1}</td>
      <td>${staff.name}</td>
      <td>${staff.email}</td>
      <td>${staff.username}</td>
      <td><span class="badge bg-info text-dark">${staff.role}</span></td>
      <td>${staff.location_name || "-"}</td>
      <td>
        <span class="badge ${staff.is_active == 1 ? "bg-success" : "bg-danger"}">
          ${staff.is_active == 1 ? "Active" : "Inactive"}
        </span>
      </td>
      <td class="text-center">
        <div class="dropdown">
          <button class="btn btn-sm border-0 bg-transparent" data-bs-toggle="dropdown" style="padding: 4px 8px;">
            <i class="bi bi-three-dots-vertical fs-5 text-secondary"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
            <li><a class="dropdown-item view-staff" href="#"><i class="bi bi-eye text-primary"></i> View</a></li>
            <li><a class="dropdown-item edit-staff" href="#"><i class="bi bi-pencil-square text-warning"></i> Update</a></li>
            <li><a class="dropdown-item delete-staff" href="#"><i class="bi bi-trash text-danger"></i> Delete</a></li>
            <li><a class="dropdown-item toggle-status" href="#"><i class="bi bi-toggle-on text-success"></i> Toggle Status</a></li>
          </ul>
        </div>
      </td>
    `;

    // Event listeners
    tr.querySelector(".view-staff")?.addEventListener("click", () => viewStaffModal(staff.staff_id));
    tr.querySelector(".edit-staff")?.addEventListener("click", () => updateStaffModal(staff.staff_id, displayStaff));
    tr.querySelector(".delete-staff")?.addEventListener("click", () => deleteStaff(staff.staff_id, displayStaff));
    tr.querySelector(".toggle-status")?.addEventListener("click", () =>
      toggleUserStatus(staff.user_id, staff.is_active == 1 ? 0 : 1)
    );

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableDiv.innerHTML = "";
  tableDiv.appendChild(table);

  renderPagination(totalItems);
};

// ✅ Pagination
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

  const createBtn = (label, disabled, cb) => {
    const li = document.createElement("li");
    li.className = `page-item ${disabled ? "disabled" : ""}`;
    li.innerHTML = `<button class="page-link">${label}</button>`;
    if (!disabled) li.addEventListener("click", cb);
    pagination.appendChild(li);
  };

  createBtn("««", currentPage === 1, () => { currentPage = 1; renderStaffTable(); });
  createBtn("‹", currentPage === 1, () => { currentPage--; renderStaffTable(); });

  const li = document.createElement("li");
  li.className = "page-item active";
  li.innerHTML = `<button class="page-link">${currentPage}</button>`;
  pagination.appendChild(li);

  createBtn("›", currentPage === totalPages, () => { currentPage++; renderStaffTable(); });
  createBtn("»»", currentPage === totalPages, () => { currentPage = totalPages; renderStaffTable(); });
};

// ✅ Toggle user status with SweetAlert
const toggleUserStatus = async (userId, newStatus) => {
  const confirm = await Swal.fire({
    title: "Are you sure?",
    text: "This will change the user's active status.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Yes, proceed!"
  });

  if (!confirm.isConfirmed) return;

  try {
    const formData = new FormData();
    formData.append("operation", "updateStatus");
    formData.append("json", JSON.stringify({ user_id: userId, is_active: newStatus }));

    const res = await axios.post(`${baseApiUrl}/staff.php`, formData);

    if (res.data.status === "success") {
      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "User status updated successfully.",
        timer: 1500,
        showConfirmButton: false
      });
      displayStaff();
    } else {
      Swal.fire("Error", res.data.message || "Failed to update status", "error");
    }
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Error updating status", "error");
  }
};
