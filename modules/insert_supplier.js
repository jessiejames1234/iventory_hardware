// modules/insertSupplierModal.js
export const insertSupplierModal = (refreshDisplay) => {
  const myModal = new bootstrap.Modal(document.getElementById("blank-modal"), {
    keyboard: true,
    backdrop: "static",
  });

  // Set modal title
  document.getElementById("blank-modal-title").innerText = "Add New Supplier";

  // Form fields inside modal
  let myHtml = `
    <table class="table table-sm">
      <tr>
        <td>Name</td>
        <td><input type="text" id="insert-name" class="form-control" /></td>
      </tr>
      <tr>
        <td>Company Name</td>
        <td><input type="text" id="insert-company-name" class="form-control" /></td>
      </tr>
      <tr>
        <td>Contact Info</td>
        <td><input type="text" id="insert-contact-info" class="form-control" /></td>
      </tr>
      <tr>
        <td>Email</td>
        <td><input type="email" id="insert-email" class="form-control" /></td>
      </tr>
      <tr>
        <td>Address</td>
        <td><input type="text" id="insert-address" class="form-control" /></td>
      </tr>
      <tr>
        <td>Notes</td>
        <td><textarea id="insert-notes" class="form-control"></textarea></td>
      </tr>
      <tr>
        <td>Status</td>
        <td>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="insert-is-active" checked>
            <label class="form-check-label" for="insert-is-active">Active</label>
          </div>
        </td>
      </tr>
    </table>
  `;
  document.getElementById("blank-main-div").innerHTML = myHtml;

  // Modal footer
  const modalFooter = document.getElementById("blank-modal-footer");
  modalFooter.innerHTML = `
    <button type="button" class="btn btn-primary btn-sm w-100 btn-insert">SAVE</button>
    <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
  `;

  // Save button click event
  modalFooter.querySelector(".btn-insert").addEventListener("click", async () => {
    if (await insertSupplier() == 1) {
      refreshDisplay();
      alert("Supplier successfully saved!");
      myModal.hide();
    } else {
      alert("Error saving supplier!");
    }
  });

  myModal.show();
};

// Insert supplier API call
const insertSupplier = async () => {
  const jsonData = {
    name: document.getElementById("insert-name").value,
    companyName: document.getElementById("insert-company-name").value,
    contactInfo: document.getElementById("insert-contact-info").value,
    email: document.getElementById("insert-email").value,
    address: document.getElementById("insert-address").value,
    notes: document.getElementById("insert-notes").value,
    isActive: document.getElementById("insert-is-active").checked ? 1 : 0,
  };

  const formData = new FormData();
  formData.append("operation", "insertSupplier");
  formData.append("json", JSON.stringify(jsonData));

  const response = await axios.post(
    `${sessionStorage.baseAPIUrl}/suppliers.php`,
    formData
  );
  return response.data;
};
