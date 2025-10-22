const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
import { requireRole, logout } from "./auth.js";

// 🔐 Admin only
const user = requireRole(["admin"]);

// 🔹 Hook up button + load data on page load
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logged-user").textContent = user.name;
  document.getElementById("btn-logout").addEventListener("click", logout);
  displayTerminals();

  const addBtn = document.getElementById("btn-add-terminal");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      insertTerminalModal();
    });
  }
});

const displayTerminals = async () => {
  const div = document.getElementById("terminal-table-div");
  div.innerHTML = `<div class="p-5 text-center"><div class="spinner-border text-primary"></div></div>`;

  try {
    const res = await axios.get(`${baseApiUrl}/pos_terminal.php`, { params: { operation: "getTerminals" } });
    if (res.data.length) {
      renderTerminalTable(res.data);
    } else {
      div.innerHTML = `<div class="p-4 text-center text-muted">No POS terminals found.</div>`;
    }
  } catch {
    div.innerHTML = `<div class="p-4 text-danger text-center">Error loading terminals.</div>`;
  }
};
const start = 0;
// 🔹 Render table
const renderTerminalTable = (data) => {
  const div = document.getElementById("terminal-table-div");
  let html = `
    <table class="table table-striped align-middle">
      <thead>
        <tr style="background-color:#2563eb; color:white;">
          <th>#</th>
          <th>Terminal Name</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.forEach((t, idx) => {  // <-- fixed syntax
    const isActive = t.status == 1;
    const statusLabel = isActive
      ? `<span class="badge bg-success">Active</span>`
      : `<span class="badge bg-secondary">Inactive</span>`;

    html += `
      <tr>
        <td>${start + idx + 1}</td>
        <td>${t.name}</td>
        <td>${statusLabel}</td>
        <td>
          <button class="btn btn-sm ${isActive ? "btn-warning" : "btn-success"} ms-2"
                  onclick="toggleTerminalStatus(${t.id}, ${isActive ? 0 : 1})">
            ${isActive ? "Deactivate" : "Activate"}
          </button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  div.innerHTML = html;
};


// 🔹 Modal to add new terminal
const insertTerminalModal = () => {
  const modalEl = document.getElementById("blank-modal");
  const modal = new bootstrap.Modal(modalEl);

  document.getElementById("blank-modal-title").innerText = "New POS Terminal";
  document.getElementById("blank-main-div").innerHTML = `
    <div class="mb-3">
      <label class="form-label">Terminal Name</label>
      <input type="text" id="terminal-name" class="form-control" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Status</label>
      <select id="terminal-status" class="form-select">
        <option value="1" selected>Active</option>
        <option value="0">Inactive</option>
      </select>
    </div>
  `;

  document.getElementById("blank-modal-footer").innerHTML = `
    <button class="btn btn-success" id="btn-save-terminal">Save</button>
  `;

  document.getElementById("btn-save-terminal").addEventListener("click", async () => {
    const name = document.getElementById("terminal-name").value.trim();
    const status = document.getElementById("terminal-status").value;

    if (!name) {
      Swal.fire({
        icon: "warning",
        title: "Missing Input",
        text: "Please enter a terminal name.",
        timer: 2000,
        showConfirmButton: false,
        scrollbarPadding: false
      });
      return;
    }

    try {
      const res = await axios.post(`${baseApiUrl}/pos_terminal.php`, new URLSearchParams({
        operation: "insertTerminal",
        json: JSON.stringify({ name, status })
      }));

      if (res.data.status === "success") {
        Swal.fire({
          icon: "success",
          title: "Created!",
          text: "POS Terminal created successfully.",
          timer: 2000,
          showConfirmButton: false,
          scrollbarPadding: false
        });
        modal.hide();
        displayTerminals();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res.data.message || "Error creating terminal.",
          timer: 2500,
          showConfirmButton: false,
          scrollbarPadding: false
        });
      }
    } catch (err) {
      console.error("Insert error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error creating terminal (check console).",
        timer: 2500,
        showConfirmButton: false,
        scrollbarPadding: false
      });
    }
  });

  modal.show();
};

// 🔹 Toggle status
window.toggleTerminalStatus = async (id, newStatus) => {
  try {
    const res = await axios.post(`${baseApiUrl}/pos_terminal.php`, new URLSearchParams({
      operation: "updateTerminalStatus",
      id,
      status: newStatus
    }));

    if (res.data.status === "success") {
      Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Terminal status updated successfully.",
        timer: 2000,
        showConfirmButton: false,
        scrollbarPadding: false
      });
      displayTerminals();
    } else {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: res.data.message || "Error updating status.",
        timer: 2500,
        showConfirmButton: false,
        scrollbarPadding: false
      });
    }
  } catch {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Error updating status.",
      timer: 2500,
      showConfirmButton: false,
      scrollbarPadding: false
    });
  }
};
