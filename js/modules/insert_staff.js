
const baseApiUrl = sessionStorage.getItem("baseAPIUrl");

export function insertStaffModal(refreshCallback) {
  const modalContainer = document.createElement("div");
  modalContainer.innerHTML = `
    <div class="modal fade show" id="insertStaffModal" tabindex="-1" style="display:block; background: rgba(0,0,0,.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <form id="staffForm">
            <div class="modal-header">
              <h5 class="modal-title">Add Staff</h5>
              <button type="button" class="btn-close" id="closeModal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label>Name</label>
                <input type="text" id="name" class="form-control" required>
              </div>
              <div class="mb-3">
                <label>Email</label>
                <input type="email" id="email" class="form-control" required>
              </div>
              <div class="mb-3">
                <label>Username</label>
                <input type="text" id="username" class="form-control" required>
              </div>
              <div class="mb-3">
                <label>Password</label>
                <input type="password" id="password" class="form-control" required>
              </div>
              <div class="mb-3">
                <label>Role</label>
                <select id="role" class="form-select" required>
                  <option value="">-- Select Role --</option>
                  <option value="admin">Admin</option>
                  <option value="cashier">Cashier</option>
                  <option value="warehouse_manager">Warehouse Manager</option>
                </select>
              </div>
              <div class="mb-3" id="warehouseRow" style="display:none;">
                <label>Assign Warehouse</label>
                <select id="warehouse_id" class="form-select">
                  <option value="">-- Select Warehouse --</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-primary">Save</button>
              <button type="button" class="btn btn-secondary" id="cancelModal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalContainer);

  const modal = document.getElementById("insertStaffModal");
  const close = () => modal.remove();
  document.getElementById("closeModal").addEventListener("click", close);
  document.getElementById("cancelModal").addEventListener("click", close);

  // 🔄 Role change event
  document.getElementById("role").addEventListener("change", async (e) => {
    const warehouseRow = document.getElementById("warehouseRow");
    const warehouseSelect = document.getElementById("warehouse_id");

    if (e.target.value === "warehouse_manager") {
      warehouseRow.style.display = "block";

      if (warehouseSelect.options.length <= 1) {
        try {
          const res = await axios.get(`${baseApiUrl}/warehouse.php`, {
            params: { operation: "getWarehouses"}
          });

if (Array.isArray(res.data)) {
  res.data.forEach(w => {
    const opt = document.createElement("option");
    opt.value = w.id;   // ✅ use "id"
    opt.textContent = w.name; // ✅ use "name"
    warehouseSelect.appendChild(opt);
  });
}

        } catch (err) {
          console.error("Error loading warehouses", err);
        }
      }
    } else {
      warehouseRow.style.display = "none";
      warehouseSelect.value = "";
    }
  });

  // 📝 Submit form
  document.getElementById("staffForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const role = document.getElementById("role").value;

      const jsonData = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        username: document.getElementById("username").value.trim(),
        password: document.getElementById("password").value.trim(),
        role: role,
        warehouse_id: role === "warehouse_manager"
          ? document.getElementById("warehouse_id").value
          : null
      };

      const formData = new FormData();
      formData.append("operation", "insertStaff");
      formData.append("json", JSON.stringify(jsonData));

      const response = await axios.post(`${baseApiUrl}/staff.php`, formData);

      if (response.data.status === "success") {
        alert("Staff successfully added.");
        close();
        if (refreshCallback) refreshCallback();
      } else {
        alert("Error: " + (response.data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Insert Error:", err);
      alert("An unexpected error occurred while inserting staff.");
    }
  });
}
