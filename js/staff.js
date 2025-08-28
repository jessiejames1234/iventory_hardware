import { insertStaffModal } from "./modules/insert_staff.js";
import { checkAuth, logout } from "./auth.js";

const user = checkAuth(); // 🔐 Redirects if not logged in

const baseApiUrl = "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

// 🔄 Handle browser back/forward
window.addEventListener("pageshow", (e) => {
  if (e.persisted) location.reload();
});

document.addEventListener("DOMContentLoaded", () => {
  // 👤 Display logged user
  document.getElementById("logged-user").textContent = user.name;

  // 🚪 Logout
  document.getElementById("btn-logout")?.addEventListener("click", logout);

  // ➕ Insert staff via modal
  document.getElementById("btn-add-staff")?.addEventListener("click", () => {
    insertStaffModal(displayStaff); // pass refresh callback
  });

  // 📋 Show staff table
  displayStaff();
});

// ✅ Fetch and display staff list
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
    const res = await axios.get(`${baseApiUrl}/staff.php`, {
      params: { operation: "getAllStaff" }
    });

    setTimeout(() => {
      if (Array.isArray(res.data) && res.data.length) {
        renderStaffTable(res.data);
      } else {
        tableDiv.innerHTML = `<div class="alert alert-warning m-0">No staff found.</div>`;
      }
    }, 800);

  } catch (err) {
    console.error("Display Error:", err);
    tableDiv.innerHTML = `<div class="alert alert-danger m-0">Error loading staff list.</div>`;
  }
};

// ✅ Render staff table
// ✅ Render staff table
const renderStaffTable = (staffList) => {
  const tableDiv = document.getElementById("table-div");
  tableDiv.innerHTML = "";

  const table = document.createElement("table");
  table.className = "table table-striped table-hover table-sm align-middle";

  table.innerHTML = `
    <thead class="table-light">
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Email</th>
        <th>Username</th>
        <th>Role</th>
        <th>Warehouse</th>   <!-- 👈 added -->
        <th>Status</th>
        <th>Action</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement("tbody");

  staffList.forEach((staff) => {
    // If staff has multiple warehouses, join them by comma
    const warehouseNames = Array.isArray(staff.warehouses)
      ? staff.warehouses.map(w => w.name).join(", ")
      : (staff.warehouse_name || "-");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${staff.staff_id}</td>
      <td>${staff.name}</td>
      <td>${staff.email}</td>
      <td>${staff.username}</td>
      <td>
        <span class="badge bg-info text-dark">${staff.role}</span>
      </td>
      <td>${warehouseNames}</td> <!-- 👈 show warehouse -->
      <td>
        <span class="badge ${staff.is_active == 1 ? 'bg-success' : 'bg-danger'}">
          ${staff.is_active == 1 ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <button class="btn btn-warning btn-sm btn-toggle">Toggle</button>
      </td>
    `;

    tr.querySelector(".btn-toggle").addEventListener("click", () => {
      toggleUserStatus(staff.user_id, staff.is_active == 1 ? 0 : 1);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableDiv.appendChild(table);
};


// ✅ Toggle user active/inactive
const toggleUserStatus = async (userId, newStatus) => {
  try {
    const formData = new FormData();
    formData.append("operation", "updateStatus");
    formData.append("json", JSON.stringify({
      user_id: userId,
      is_active: newStatus
    }));

    const res = await axios.post(`${baseApiUrl}/staff.php`, formData);

    if (res.data.status === "success") {
      displayStaff();
    } else {
      alert("Failed to update status");
    }
  } catch (err) {
    console.error("Status Update Error:", err);
    alert("Error updating status");
  }
};
