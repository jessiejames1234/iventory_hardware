export const insertStaffModal = () => {
  const modal = new bootstrap.Modal(document.getElementById("blank-modal"), {
    keyboard: true,
    backdrop: "static",
  });

  document.getElementById("blank-modal-title").innerText = "Add Staff";

  document.getElementById("blank-main-div").innerHTML = `
    <table class="table table-sm">
      <tr>
        <td>Full Name</td>
        <td><input type="text" id="staff-name" class="form-control" /></td>
      </tr>
      <tr>
        <td>Email</td>
        <td><input type="email" id="staff-email" class="form-control" /></td>
      </tr>
      <tr>
        <td>Username</td>
        <td><input type="text" id="staff-username" class="form-control" /></td>
      </tr>
      <tr>
        <td>Password</td>
        <td><input type="password" id="staff-password" class="form-control" /></td>
      </tr>
      <tr>
        <td>Role</td>
        <td>
          <select id="staff-role" class="form-select">
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
        </td>
      </tr>
    </table>
  `;

  document.getElementById("blank-modal-footer").innerHTML = `
    <button class="btn btn-primary w-100" id="btn-insert-staff">Save</button>
  `;

  document.getElementById("btn-insert-staff").addEventListener("click", async () => {
    const formData = new FormData();
    formData.append("operation", "insertStaff");
    formData.append(
      "json",
      JSON.stringify({
        name: document.getElementById("staff-name").value,
        email: document.getElementById("staff-email").value,
        username: document.getElementById("staff-username").value,
        password: document.getElementById("staff-password").value,
        role: document.getElementById("staff-role").value,
      })
    );

    const res = await axios.post(`${sessionStorage.baseAPIUrl}/staff.php`, formData);
    if (res.data.status === "success") {
      alert("Staff added!");
      modal.hide();
    } else {
      alert("Insert failed: " + (res.data.message || "Unknown error"));
    }
  });

  modal.show();
};
