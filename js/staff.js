import { insertStaffModal } from "../modules/insert_staff.js";

//
import { checkAuth, logout } from "./auth.js";
const user = checkAuth(); // 🔐 Redirects if not logged in
//



const baseApiUrl = "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);



//
window.addEventListener("pageshow", (e) => {
  if (e.persisted) location.reload();
});
//



document.addEventListener("DOMContentLoaded", () => {


//    
  // 👤 Display user name
  document.getElementById("logged-user").textContent = user.name;

  // 🚪 Logout
  document.getElementById("btn-logout")?.addEventListener("click", logout);
//


  // ➕ Insert staff
  document.getElementById("btn-add-staff")?.addEventListener("click", insertStaffModal);

  // Optional: legacy insert handler (if using form elsewhere)
  document.getElementById("btn-submit")?.addEventListener("click", insertStaff);

  // 📋 Show list
  displayStaff();
});

const insertStaff = async () => {
  try {
    const jsonData = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      username: document.getElementById("username").value.trim(),
      password: document.getElementById("password").value.trim(),
      role: document.getElementById("role").value
    };

    const formData = new FormData();
    formData.append("operation", "insertStaff");
    formData.append("json", JSON.stringify(jsonData));

    const response = await axios.post(`${baseApiUrl}/staff.php`, formData);

    if (response.data.status === "success") {
      alert("Staff successfully added.");
      document.getElementById("staffForm")?.reset();
      displayStaff();
    } else {
      alert("Error: " + (response.data.message || "Unknown error"));
    }
  } catch (err) {
    console.error("Insert Error:", err);
    alert("An unexpected error occurred while inserting staff.");
  }
};

const displayStaff = async () => {
  try {
    const response = await axios.get(`${baseApiUrl}/staff.php`, {
      params: { operation: "getAllStaff" }
    });

    if (response.status === 200) {
      renderStaffTable(response.data);
    } else {
      alert("Error loading staff list.");
    }
  } catch (err) {
    console.error("Display Error:", err);
    alert("An unexpected error occurred while loading staff list.");
  }
};

const renderStaffTable = (staffList) => {
  const tableDiv = document.getElementById("table-div");
  tableDiv.innerHTML = "";

  const table = document.createElement("table");
  table.className = "table table-striped table-hover table-sm";

  table.innerHTML = `
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Email</th>
        <th>Username</th>
        <th>Role</th>
        <th>Status</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  staffList.forEach((staff) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${staff.staff_id}</td>
      <td>${staff.name}</td>
      <td>${staff.email}</td>
      <td>${staff.username}</td>
      <td>${staff.role}</td>
      <td>
        <span class="badge ${staff.is_active == 1 ? 'bg-success' : 'bg-danger'}">
          ${staff.is_active == 1 ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-warning btn-toggle">Toggle</button>
      </td>
    `;

    row.querySelector(".btn-toggle").addEventListener("click", () => {
      toggleUserStatus(staff.user_id, staff.is_active == 1 ? 0 : 1);
    });

    table.querySelector("tbody").appendChild(row);
  });

  tableDiv.appendChild(table);
};

const toggleUserStatus = async (userId, newStatus) => {
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
};
