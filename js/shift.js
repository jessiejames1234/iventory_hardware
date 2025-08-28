import { checkAuth, logout } from "./auth.js";
const user = checkAuth();

const baseApiUrl = "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

window.addEventListener("pageshow", (e) => {
  if (e.persisted) location.reload();
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logged-user").textContent = user.name;
  document.getElementById("btn-logout")?.addEventListener("click", logout);
  displayShifts();
});

const displayShifts = async () => {
  const div = document.getElementById("table-div");

  // Show loading state
  div.innerHTML = `
    <div class="d-flex justify-content-center align-items-center p-5 gap-2">
      <div class="spinner-border text-primary" role="status"></div>
      <span class="fw-semibold">Loading shifts...</span>
    </div>
  `;

  try {
    const res = await axios.get(`${baseApiUrl}/shift.php`, {
      params: { operation: "getAllShifts" },
    });

    if (res.status === 200) {
      // Delay to make loading feel smooth
      setTimeout(() => {
        if (Array.isArray(res.data) && res.data.length) {
          renderShiftTable(res.data);
        } else {
          div.innerHTML = `<div class="alert alert-warning m-0">No shift data found.</div>`;
        }
      }, 1000);
    } else {
      div.innerHTML = `<div class="alert alert-danger">Failed to load shift records.</div>`;
    }
  } catch (err) {
    console.error("Shift Display Error:", err);
    div.innerHTML = `<div class="alert alert-danger">An unexpected error occurred while loading shifts.</div>`;
  }
};


const renderShiftTable = (shifts) => {
  const div = document.getElementById("table-div");
  div.innerHTML = "";

  const table = document.createElement("table");
  table.className = "table table-bordered table-hover table-sm";

  table.innerHTML = `
    <thead class="table-light">
      <tr>
        <th>#</th>
        <th>Staff</th>
        <th>Start Time</th>
        <th>End Time</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  shifts.forEach((s, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${s.name}</td>
      <td>${s.start_time}</td>
      <td>${s.end_time}</td>
    `;
    table.querySelector("tbody").appendChild(row);
  });

  div.appendChild(table);
};