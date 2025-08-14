export const viewSupplierModal = async (supplierId) => {
  const myModal = new bootstrap.Modal(document.getElementById("blank-modal"), {
    keyboard: true,
    backdrop: "static",
  });

  document.getElementById("blank-modal-title").innerText = "View Supplier Details";

  const supplier = await getSupplierDetails(supplierId);

  let myHtml = `
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
  document.getElementById("blank-main-div").innerHTML = myHtml;
  document.getElementById("blank-modal-footer").innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
  `;

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
