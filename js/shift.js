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
  const res = await axios.get(`${baseApiUrl}/shift.php`, {
    params: { operation: "getAllShifts" },
  });

  if (res.status === 200) {
    renderShiftTable(res.data);
  } else {
    alert("Failed to load shift records.");
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
