export const updateProductModal = async (productId, refreshDisplay) => {
  const myModal = new bootstrap.Modal(document.getElementById("blank-modal"), {
    keyboard: true,
    backdrop: "static",
  });

  document.getElementById("blank-modal-title").innerText = "Update Product";

  // Fetch product details
  const product = await getProductDetails(productId);

  // Fetch categories, brands, units
  const [categories, brands, units] = await Promise.all([
    getList("getCategories"),
    getList("getBrands"),
    getList("getUnits"),
  ]);

  const categorySelect = buildSelect(categories, "update-category", product.category_id);
  const brandSelect = buildSelect(brands, "update-brand", product.brand_id);
  const unitSelect = buildSelect(units, "update-unit", product.unit_id, true);

  // Build modal body
  const modalBody = `
    <table class="table table-sm">
      <tr><td>Name</td><td><input type="text" id="update-name" class="form-control" value="${product.product_name ?? ''}" /></td></tr>
      <tr><td>Model</td><td><input type="text" id="update-model" class="form-control" value="${product.model ?? ''}" /></td></tr>
      <tr><td>Selling Price</td><td><input type="number" id="update-price" class="form-control" value="${product.selling_price ?? ''}" /></td></tr>
      <tr><td>Cost Price</td><td><input type="number" id="update-cost" class="form-control" value="${product.cost_price ?? ''}" /></td></tr>
      <tr><td>Reorder Level</td><td><input type="number" id="update-reorder" class="form-control" value="${product.reorder_level ?? 0}" /></td></tr>
      <tr><td>Category</td><td>${categorySelect}</td></tr>
      <tr><td>Brand</td><td>${brandSelect}</td></tr>
      <tr><td>Unit</td><td>${unitSelect}</td></tr>
      <tr><td>Specs</td><td><textarea id="update-specs" class="form-control">${product.specs ?? ''}</textarea></td></tr>
      <tr><td>Warranty Period</td><td><input type="text" id="update-warranty" class="form-control" value="${product.warranty_period ?? ''}" /></td></tr>
    </table>
  `;
  document.getElementById("blank-main-div").innerHTML = modalBody;

  // Footer
  const modalFooter = document.getElementById("blank-modal-footer");
  modalFooter.innerHTML = `
    <button type="button" class="btn btn-primary btn-sm w-100 btn-update">UPDATE</button>
    <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
  `;

  modalFooter.querySelector(".btn-update").addEventListener("click", async () => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user || !user.staff_id) { alert("User not authenticated."); return; }

    const jsonData = {
      id: productId,
      name: document.getElementById("update-name").value.trim(),
      model: document.getElementById("update-model").value.trim(),
      price: parseFloat(document.getElementById("update-price").value) || 0,
      cost_price: parseFloat(document.getElementById("update-cost").value) || 0,
      reorder_level: parseInt(document.getElementById("update-reorder").value) || 0,
      categoryId: parseInt(document.getElementById("update-category").value),
      brandId: parseInt(document.getElementById("update-brand").value),
      unitId: document.getElementById("update-unit").value ? parseInt(document.getElementById("update-unit").value) : null,
      specs: document.getElementById("update-specs").value.trim(),
      warranty_period: document.getElementById("update-warranty").value.trim(),
      updatedBy: user.staff_id,
    };

    // Validation
    let errors = [];
    if (!jsonData.name) errors.push("Name is required.");
    if (!jsonData.model) errors.push("Model is required.");
    if (isNaN(jsonData.price) || jsonData.price <= 0) errors.push("Selling price must be > 0.");
    if (isNaN(jsonData.cost_price) || jsonData.cost_price <= 0) errors.push("Cost price must be > 0.");
    if (!jsonData.categoryId) errors.push("Category is required.");
    if (!jsonData.brandId) errors.push("Brand is required.");
    if (errors.length) { alert(errors.join("\n")); return; }

    const formData = new FormData();
    formData.append("operation", "updateProduct");
    formData.append("json", JSON.stringify(jsonData));

    try {
      const response = await axios.post(`${sessionStorage.baseAPIUrl}/product.php`, formData);
      if (response.data.status === "success") {
        alert("Product updated successfully!");
        refreshDisplay();
        myModal.hide();
      } else {
        alert("Error: " + (response.data.message || "Update failed"));
      }
    } catch (error) { console.error(error); alert("Network or server error."); }
  });

  myModal.show();
};

// Helpers
const getProductDetails = async (productId) => {
  const res = await axios.get(`${sessionStorage.baseAPIUrl}/product.php`, { params: { operation: "getProduct", id: productId } });
  return res.data;
};

const getList = async (operation) => {
  const res = await axios.get(`${sessionStorage.baseAPIUrl}/product.php`, { params: { operation } });
  return Array.isArray(res.data) ? res.data : [];
};

const buildSelect = (list, id, selectedId, allowEmpty = false) => {
  let html = `<select id="${id}" class="form-select">`;
  if (allowEmpty) html += `<option value="">-- Select --</option>`;
  list.forEach(item => html += `<option value="${item.id}" ${String(item.id) === String(selectedId) ? "selected" : ""}>${item.name}</option>`);
  html += `</select>`;
  return html;
};
