import { requireRole, logout } from "./auth.js";

// 🔐 Admin only
const user = requireRole(["admin"]);

const baseApiUrl = "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

let allShifts = [];
let currentPage = 1;
let rowsPerPage = 10;

window.addEventListener("pageshow", (e) => {
  if (e.persisted) location.reload();
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logged-user").textContent = user.name;
  document.getElementById("btn-logout")?.addEventListener("click", logout);

  // ➕ Date filter
  const dateInput = document.getElementById("shift-date-filter");
  dateInput?.addEventListener("change", () => {
    currentPage = 1;
    displayShifts(dateInput.value);
  });

  // ➕ Rows per page
  const rowsSelect = document.getElementById("rows-per-page-footer");
  rowsSelect?.addEventListener("change", (e) => {
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderShiftTable();
  });

  // ➕ Search
  const searchInput = document.getElementById("table-search");
  searchInput?.addEventListener("input", () => {
    currentPage = 1;
    renderShiftTable();
  });

  displayShifts(); // initial load
});

const displayShifts = async (filterDate = "") => {
  const div = document.getElementById("table-div");
  div.innerHTML = `
    <div class="d-flex justify-content-center align-items-center p-5 gap-2">
      <div class="spinner-border text-primary" role="status"></div>
      <span class="fw-semibold">Loading shifts...</span>
    </div>
  `;

  try {
    const res = await axios.get(`${baseApiUrl}/shift.php`, {
      params: { operation: "getAllShifts", date: filterDate },
    });

    if (Array.isArray(res.data)) {
      allShifts = res.data;
      renderShiftTable();
    } else {
      div.innerHTML = `<div class="alert alert-warning m-0">No shift data found.</div>`;
    }
  } catch (err) {
    console.error("Shift Display Error:", err);
    div.innerHTML = `<div class="alert alert-danger">An unexpected error occurred while loading shifts.</div>`;
  }
};

const renderShiftTable = () => {
  const div = document.getElementById("table-div");
  const searchValue = document.getElementById("table-search")?.value.toLowerCase() || "";

  const filtered = allShifts.filter(
    s =>
      s.name.toLowerCase().includes(searchValue) ||
      s.start_time.toLowerCase().includes(searchValue) ||
      s.end_time.toLowerCase().includes(searchValue)
  );

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = filtered.slice(start, end);

  if (filtered.length === 0) {
    div.innerHTML = `<div class="alert alert-secondary text-center m-0">No matching shifts found.</div>`;
    document.getElementById("table-info").textContent = "No entries available";
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  const table = document.createElement("table");
  table.className = "table table-bordered table-hover table-sm";
  table.innerHTML = `
    <thead class="table-light">
      <tr>
        <th class="text-center" style="width:50px;">#</th>
        <th>Staff</th>
        <th>Start Time</th>
        <th>End Time</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement("tbody");
  pageData.forEach((s, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center">${start + i + 1}</td>
      <td>${s.name}</td>
      <td>${s.start_time}</td>
      <td>${s.end_time}</td>
    `;
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

  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalItems);
  tableInfo.textContent = `Showing ${startItem} to ${endItem} of ${totalItems} entries`;

  const createBtn = (label, disabled, cb) => {
    const li = document.createElement("li");
    li.className = `page-item ${disabled ? "disabled" : ""}`;
    li.innerHTML = `<button class="page-link">${label}</button>`;
    if (!disabled) li.addEventListener("click", cb);
    pagination.appendChild(li);
  };

  createBtn("««", currentPage === 1, () => { currentPage = 1; renderShiftTable(); });
  createBtn("‹", currentPage === 1, () => { currentPage--; renderShiftTable(); });

  const li = document.createElement("li");
  li.className = "page-item active";
  li.innerHTML = `<button class="page-link">${currentPage}</button>`;
  pagination.appendChild(li);

  createBtn("›", currentPage === totalPages, () => { currentPage++; renderShiftTable(); });
  createBtn("»»", currentPage === totalPages, () => { currentPage = totalPages; renderShiftTable(); });
};
