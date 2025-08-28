
// ====================== INSERT SUPPLIER MODAL ======================
export const insertSupplierModal = (refreshDisplay) => {
  const myModal = new bootstrap.Modal(document.getElementById("blank-modal"), {
    keyboard: true,
    backdrop: "static",
  });

  document.getElementById("blank-modal-title").innerText = "Add New Supplier";

  document.getElementById("blank-main-div").innerHTML = `
    <table class="table table-sm">
      <tr><td>Name</td><td><input type="text" id="insert-name" class="form-control" /></td></tr>
      <tr><td>Company Name</td><td><input type="text" id="insert-company-name" class="form-control" /></td></tr>
      <tr><td>Contact Info</td><td><input type="text" id="insert-contact-info" class="form-control" /></td></tr>
      <tr><td>Email</td><td><input type="email" id="insert-email" class="form-control" /></td></tr>
      <tr><td>Address</td><td><input type="text" id="insert-address" class="form-control" /></td></tr>
      <tr><td>Notes</td><td><textarea id="insert-notes" class="form-control"></textarea></td></tr>
      <tr><td>Status</td><td>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="insert-is-active" checked>
          <label class="form-check-label" for="insert-is-active">Active</label>
        </div>
      </td></tr>
    </table>
  `;

  document.getElementById("blank-modal-footer").innerHTML = `
    <button type="button" class="btn btn-primary btn-sm w-100 btn-insert">SAVE</button>
    <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
  `;

  document.querySelector("#blank-modal-footer .btn-insert").addEventListener("click", async () => {
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

  const response = await axios.post(`${sessionStorage.baseAPIUrl}/suppliers.php`, formData);
  return response.data;
};

// ====================== UPDATE SUPPLIER MODAL ======================
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

  document.getElementById("blank-modal-footer").innerHTML = `
    <button type="button" class="btn btn-primary btn-sm w-100 btn-update">Update</button>
    <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
  `;

  document.querySelector("#blank-modal-footer .btn-update").addEventListener("click", async () => {
    const result = await updateSupplier(supplierId);
    console.log("Update API response:", result);

    if (result == 1 || result === "no-change") {
      refreshDisplay();
      alert("Supplier updated successfully!");
      myModal.hide();
    } else {
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
    supplierId: supplierId,
  };

  const formData = new FormData();
  formData.append("operation", "updateSupplier");
  formData.append("json", JSON.stringify(jsonData));

  const response = await axios.post(`${sessionStorage.baseAPIUrl}/suppliers.php`, formData);
  return response.data;
};

// ====================== VIEW SUPPLIER MODAL ======================
export const viewSupplierModal = async (supplierId) => {
  const myModal = new bootstrap.Modal(document.getElementById("blank-modal"), {
    keyboard: true,
    backdrop: "static",
  });

  document.getElementById("blank-modal-title").innerText = "View Supplier Details";
  const supplier = await getSupplierDetails(supplierId);

  document.getElementById("blank-main-div").innerHTML = `
    <table class="table table-sm">
      <tr><td><b>Name</b></td><td>${supplier[0].name}</td></tr>
      <tr><td><b>Company</b></td><td>${supplier[0].company_name}</td></tr>
      <tr><td><b>Contact</b></td><td>${supplier[0].contact_info}</td></tr>
      <tr><td><b>Email</b></td><td>${supplier[0].email}</td></tr>
      <tr><td><b>Address</b></td><td>${supplier[0].address}</td></tr>
      <tr><td><b>Notes</b></td><td>${supplier[0].notes}</td></tr>
      <tr><td><b>Status</b></td><td>${supplier[0].is_active == 1 ? "Active" : "Inactive"}</td></tr>
    </table>
  `;

  document.getElementById("blank-modal-footer").innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
  `;

  myModal.show();
};

// ====================== PRODUCT-SUPPLIER ASSIGNMENT MODAL ======================
export const updateModal = async (id, refreshDisplay) => {
  const myModal = new bootstrap.Modal(document.getElementById("blank-modal"));

  let productSupplier = id ? await getAssignment(id) : { product_id: "", supplier_id: "" };
  let products = await getProducts();
  let suppliers = await getSuppliers();

  document.getElementById("blank-modal-title").innerText = id ? "Update Assignment" : "New Assignment";

  document.getElementById("blank-main-div").innerHTML = `
    <div class="mb-3">
      <label>Product</label>
      ${createSelect("product-id", products, "product_id", "name", productSupplier.product_id)}
    </div>
    <div class="mb-3">
      <label>Supplier</label>
      ${createSelect("supplier-id", suppliers, "supplier_id", "name", productSupplier.supplier_id)}
    </div>
  `;

  document.getElementById("blank-modal-footer").innerHTML = `
    <button class="btn btn-primary w-100">${id ? "Update" : "Save"}</button>
    <button type="button" class="btn btn-secondary w-100" data-bs-dismiss="modal">Close</button>
  `;

  document.querySelector("#blank-modal-footer .btn-primary").addEventListener("click", async () => {
    let formData = {
      productId: document.getElementById("product-id").value,
      supplierId: document.getElementById("supplier-id").value
    };
    if (id) formData.id = id;

    const data = new FormData();
    data.append("operation", id ? "updateAssignment" : "insertAssignment");
    data.append("json", JSON.stringify(formData));

    const response = await axios.post(`${sessionStorage.baseAPIUrl}/supplier_ass.php`, data);

    if (response.data == 1) {
      alert(id ? "Updated successfully!" : "Inserted successfully!");
      myModal.hide();
      refreshDisplay();
    } else if (response.data == -1) {
      alert("This product already has this supplier assigned!");
    } else {
      alert("Error saving record!");
    }
  });

  myModal.show();
};

// ====================== HELPER FUNCTIONS ======================
const getAssignment = async (id) => {
  const res = await axios.get(`${sessionStorage.baseAPIUrl}/supplier_ass.php`, {
    params: { operation: "getAssignment", json: JSON.stringify({ id }) }
  });
  return res.data[0] || {};
};

const getProducts = async () => {
  const res = await axios.get(`${sessionStorage.baseAPIUrl}/product.php`, { params: { operation: "getProducts" } });
  return Array.isArray(res.data) ? res.data : [];
};

const getSuppliers = async () => {
  const res = await axios.get(`${sessionStorage.baseAPIUrl}/suppliers.php`, { params: { operation: "getAllSuppliers" } });
  return Array.isArray(res.data) ? res.data.filter(s => s.is_active == 1) : [];
};

const createSelect = (id, data, valueKey, textKey, selectedValue) => {
  let html = `<select id="${id}" class="form-select">`;
  data.forEach(item => {
    let selected = item[valueKey] == selectedValue ? "selected" : "";
    html += `<option value="${item[valueKey]}" ${selected}>${item[textKey]}</option>`;
  });
  html += "</select>";
  return html;
};
