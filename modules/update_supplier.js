export const updateSupplierModal = async (supplierId, refreshDisplay) => {
  const myModal = new bootstrap.Modal(document.getElementById("blank-modal"), {
    keyboard: true,
    backdrop: "static",
  });

  document.getElementById("blank-modal-title").innerText = "Update Supplier";
  const supplier = await getSupplierDetails(supplierId);

  document.getElementById("blank-main-div").innerHTML = `
    <table class="table table-sm">
      <tr><td>Name</td><td><input type="text" id="update-name" class="form-control" value="${supplier[0].name}" /></td></tr>
      <tr><td>Company</td><td><input type="text" id="update-company-name" class="form-control" value="${supplier[0].company_name}" /></td></tr>
      <tr><td>Contact</td><td><input type="text" id="update-contact-info" class="form-control" value="${supplier[0].contact_info}" /></td></tr>
      <tr><td>Email</td><td><input type="email" id="update-email" class="form-control" value="${supplier[0].email}" /></td></tr>
      <tr><td>Address</td><td><input type="text" id="update-address" class="form-control" value="${supplier[0].address}" /></td></tr>
      <tr><td>Notes</td><td><textarea id="update-notes" class="form-control">${supplier[0].notes}</textarea></td></tr>
      <tr><td>Status</td><td><input type="checkbox" id="update-is-active" ${supplier[0].is_active == 1 ? "checked" : ""} /> Active</td></tr>
    </table>
  `;

  const footer = document.getElementById("blank-modal-footer");
  footer.innerHTML = `
    <button type="button" class="btn btn-primary btn-sm w-100 btn-update">Update</button>
    <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
  `;

  footer.querySelector(".btn-update").addEventListener("click", async () => {
    const result = await updateSupplier(supplierId);
    console.log("Update API response:", result);

if (result == 1 || result === "no-change") {
  refreshDisplay();
  alert("Supplier updated successfully!");
  myModal.hide();
}
else {
      alert("Error updating supplier!");
    }
  });

  myModal.show();
};

const getSupplierDetails = async (supplierId) => {
  const params = {
    operation: "getSupplier",
    json: JSON.stringify({ supplierId }),
  };
  const response = await axios.get(`${sessionStorage.baseAPIUrl}/suppliers.php`, { params });
  return response.data;
};

const updateSupplier = async (supplierId) => {
const jsonData = {
    name: document.getElementById("update-name").value,
    companyName: document.getElementById("update-company-name").value,
    contactInfo: document.getElementById("update-contact-info").value,
    email: document.getElementById("update-email").value,
    address: document.getElementById("update-address").value,
    notes: document.getElementById("update-notes").value,
    isActive: document.getElementById("update-is-active").checked ? 1 : 0,
    supplierId: supplierId
};


  const formData = new FormData();
  formData.append("operation", "updateSupplier");
  formData.append("json", JSON.stringify(jsonData));

  const response = await axios.post(`${sessionStorage.baseAPIUrl}/suppliers.php`, formData);
  return response.data;
};
