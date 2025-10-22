
const baseApiUrl = sessionStorage.getItem("baseAPIUrl") || "http://localhost/hardware/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);
const user = JSON.parse(sessionStorage.getItem("user")) || {};









// --------------------
// GET LIST FUNCTION
// --------------------
const getList = async (operation) => {
  try {
    const res = await axios.get(`${baseApiUrl}/product.php`, { params: { operation } });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error(err);
    return [];
  }
};

// --------------------
// GET PRODUCT DETAILS
// --------------------
const getProductDetails = async (productId) => {
  try {
    const res = await axios.get(`${baseApiUrl}/product.php`, { params: { operation: "getProduct", id: productId } });
    return res.data;
  } catch (err) {
    console.error(err);
    return null;
  }
};

// --------------------
// BUILD SELECT FUNCTION
// --------------------
const buildSelect = (list, id, selectedId = null, allowEmpty = false) => {
  let html = `<select id="${id}" class="form-select">`;
  if (allowEmpty) html += `<option value="">-- Select --</option>`;
  list.forEach(item => {
    html += `<option value="${item.id}" ${String(item.id) === String(selectedId) ? "selected" : ""}>${item.name}</option>`;
  });
  html += `</select>`;
  return html;
};

// --------------------
// INSERT PRODUCT MODAL
// --------------------
export const insertProductModal = async (user) => {
  const modalEl = document.getElementById("blank-modal");
  const modal = new bootstrap.Modal(modalEl, { keyboard: true, backdrop: "static" });

  const [categories, brands, sizes, colors, units] = await Promise.all([
    getList("getCategories"),
    getList("getBrands"),
    getList("getSizes"),
    getList("getColors"),
    getList("getUnits"),
  ]);

  document.getElementById("blank-modal-title").innerText = "Add New Product";

  document.getElementById("blank-main-div").innerHTML = `
  <div class="card shadow-lg border-0 rounded-3">
    <div class="card-header bg-primary text-white fw-bold fs-5">
      <i class="bi bi-box-seam me-2"></i> Product Details
    </div>
    <div class="card-body p-4">
      <div class="row g-3">

        <div class="col-md-6">
          <label class="form-label fw-semibold">Name <span class="text-danger">*</span></label>
          <div class="input-group shadow-sm rounded">
            <span class="input-group-text bg-light"><i class="bi bi-card-text"></i></span>
            <input type="text" id="product-name" class="form-control" placeholder="Product Name">
          </div>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold">Model</label>
          <div class="input-group shadow-sm rounded">
            <span class="input-group-text bg-light"><i class="bi bi-sliders"></i></span>
            <input type="text" id="product-model" class="form-control" placeholder="Model">
          </div>
        </div>

        <div class="col-md-6">
          <label class="form-label fw-semibold">Specifications</label>
          <textarea id="product-specs" class="form-control shadow-sm" rows="3" placeholder="Detailed specs"></textarea>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold">Warranty Period</label>
          <div class="input-group shadow-sm rounded">
            <span class="input-group-text bg-light"><i class="bi bi-clock-history"></i></span>
            <input type="text" id="product-warranty" class="form-control" placeholder="e.g., 1 Year">
          </div>
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Selling Price <span class="text-danger">*</span></label>
          <div class="input-group shadow-sm rounded">
            <span class="input-group-text bg-light">₱</span>
            <input type="number" id="product-price" class="form-control" placeholder="0.00">
          </div>
        </div>
        <div class="col-md-4">
          <label class="form-label fw-semibold">Cost Price <span class="text-danger">*</span></label>
          <div class="input-group shadow-sm rounded">
            <span class="input-group-text bg-light">₱</span>
            <input type="number" id="product-cost" class="form-control" placeholder="0.00">
          </div>
        </div>
        <div class="col-md-4">
          <label class="form-label fw-semibold">Reorder Level</label>
          <input type="number" id="product-reorder" class="form-control shadow-sm" placeholder="0">
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Category <span class="text-danger">*</span></label>
          ${buildSelect(categories, 'product-category')}
        </div>
        <div class="col-md-4">
          <label class="form-label fw-semibold">Brand <span class="text-danger">*</span></label>
          ${buildSelect(brands, 'product-brand')}
        </div>
        <div class="col-md-4">
          <label class="form-label fw-semibold">Unit</label>
          ${buildSelect(units, 'product-unit', null, true)}
        </div>

      </div>
    </div>

    <div class="card-footer d-flex justify-content-end bg-light">
      <button class="btn btn-success fw-semibold shadow-sm" id="btn-save-product">
        <i class="bi bi-check-circle me-1"></i> Save Product
      </button>
    </div>
  </div>
  `;

  document.getElementById("btn-save-product").addEventListener("click", async () => {
    const name = document.getElementById("product-name").value.trim();
    const price = parseFloat(document.getElementById("product-price").value);
    const cost = parseFloat(document.getElementById("product-cost").value);
    const catId = document.getElementById("product-category").value;
    const brandId = document.getElementById("product-brand").value;
    const reorderNum = Number(document.getElementById("product-reorder").value || 0);

    const errs = [];
    if (!name) errs.push("Name is required.");
    if (!catId) errs.push("Category is required.");
    if (!brandId) errs.push("Brand is required.");
    if (!(price > 0)) errs.push("Selling price must be greater than 0.");
    if (!(cost > 0)) errs.push("Cost price must be greater than 0.");
    if (reorderNum < 0) errs.push("Reorder must be 0 or positive.");
    if (errs.length) { alert(errs.join("\n")); return; }

    const payload = {
      name,
      model: document.getElementById("product-model").value.trim(),
      specs: document.getElementById("product-specs").value.trim(),
      warranty_period: document.getElementById("product-warranty").value.trim(),
      price,
      cost_price: cost,
      reorder_level: reorderNum,
      categoryId: catId,
      brandId: brandId,
      unitId: document.getElementById("product-unit").value || null,
      createdBy: user.staff_id
    };

    const formData = new FormData();
    formData.append("operation", "insertProduct");
    formData.append("json", JSON.stringify(payload));

if (errs.length) {
  Swal.fire({
    title: "Validation Error",
    html: errs.join("<br>"),
    icon: "warning",
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
              scrollbarPadding: false

  });
  return;
}

try {
  const res = await axios.post(`${baseApiUrl}/product.php`, formData);
if (res.data.status === "success") {
  Swal.fire({
    title: "Product Added",
    text: "The product has been successfully added.",
    icon: "success",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
              scrollbarPadding: false

  }).then(() => {
    modal.hide();
    location.reload(); // reload AFTER Swal closes
  });
}
 else {
    Swal.fire({
      title: "Failed",
      text: res.data.message || "Insert failed.",
      icon: "error",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
                scrollbarPadding: false

    });
  }
} catch (err) {
  console.error(err);
  Swal.fire({
    title: "Error",
    text: "Error connecting to server.",
    icon: "error",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
              scrollbarPadding: false

  });
}

  });

  modal.show();
};

// --------------------
// UPDATE PRODUCT MODAL
// --------------------
export const updateProductModal = async (productId, refreshDisplay) => {
  const modalEl = document.getElementById("blank-modal");
  const modal = new bootstrap.Modal(modalEl, { keyboard: true, backdrop: "static" });

  document.getElementById("blank-modal-title").innerText = "Update Product";

  const product = await getProductDetails(productId);
  if (!product) return alert("Failed to fetch product.");

  const [categories, brands, units] = await Promise.all([
    getList("getCategories"),
    getList("getBrands"),
    getList("getUnits"),
  ]);

const modalBody = `
  <div class="card shadow-lg border-0 rounded-3">
    <div class="card-header bg-primary text-white fw-bold fs-5">
      <i class="bi bi-pencil-square me-2"></i> Update Product
    </div>
    <div class="card-body p-4">
      <div class="row g-3">

        <div class="col-md-6">
          <label class="form-label fw-semibold">Name <span class="text-danger">*</span></label>
          <div class="input-group shadow-sm rounded">
            <span class="input-group-text bg-light"><i class="bi bi-card-text"></i></span>
            <input type="text" id="update-name" class="form-control" value="${product.product_name ?? ''}" placeholder="Product Name">
          </div>
        </div>

        <div class="col-md-6">
          <label class="form-label fw-semibold">Model <span class="text-danger">*</span></label>
          <div class="input-group shadow-sm rounded">
            <span class="input-group-text bg-light"><i class="bi bi-sliders"></i></span>
            <input type="text" id="update-model" class="form-control" value="${product.model ?? ''}" placeholder="Model">
          </div>
        </div>

        <div class="col-md-6">
          <label class="form-label fw-semibold">Specifications</label>
          <textarea id="update-specs" class="form-control shadow-sm" rows="3" placeholder="Detailed specs">${product.specs ?? ''}</textarea>
        </div>

        <div class="col-md-6">
          <label class="form-label fw-semibold">Warranty Period</label>
          <div class="input-group shadow-sm rounded">
            <span class="input-group-text bg-light"><i class="bi bi-clock-history"></i></span>
            <input type="text" id="update-warranty" class="form-control" value="${product.warranty_period ?? ''}" placeholder="e.g., 1 Year">
          </div>
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Selling Price <span class="text-danger">*</span></label>
          <div class="input-group shadow-sm rounded">
            <span class="input-group-text bg-light">₱</span>
            <input type="number" id="update-price" class="form-control" value="${product.selling_price ?? ''}" placeholder="0.00">
          </div>
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Cost Price <span class="text-danger">*</span></label>
          <div class="input-group shadow-sm rounded">
            <span class="input-group-text bg-light">₱</span>
            <input type="number" id="update-cost" class="form-control" value="${product.cost_price ?? ''}" placeholder="0.00">
          </div>
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Reorder Level</label>
          <input type="number" id="update-reorder" class="form-control shadow-sm" value="${product.reorder_level ?? 0}" placeholder="0">
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Category <span class="text-danger">*</span></label>
          ${buildSelect(categories, "update-category", product.category_id)}
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Brand <span class="text-danger">*</span></label>
          ${buildSelect(brands, "update-brand", product.brand_id)}
        </div>

        <div class="col-md-4">
          <label class="form-label fw-semibold">Unit</label>
          ${buildSelect(units, "update-unit", product.unit_id, true)}
        </div>

      </div>
    </div>

    <div class="card-footer d-flex justify-content-end gap-2 bg-light">
      <button type="button" class="btn btn-primary fw-semibold shadow-sm btn-update">
        <i class="bi bi-check-circle me-1"></i> Update Product
      </button>
      <button type="button" class="btn btn-secondary fw-semibold shadow-sm" data-bs-dismiss="modal">
        <i class="bi bi-x-circle me-1"></i> Close
      </button>
    </div>
  </div>
`;


  document.getElementById("blank-main-div").innerHTML = modalBody;



  document.querySelector(".btn-update").addEventListener("click", async () => {
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

    const errors = [];
    if (!jsonData.name) errors.push("Name is required.");
    if (!jsonData.model) errors.push("Model is required.");
    if (!(jsonData.price > 0)) errors.push("Selling price must be > 0.");
    if (!(jsonData.cost_price > 0)) errors.push("Cost price must be > 0.");
    if (!jsonData.categoryId) errors.push("Category is required.");
    if (!jsonData.brandId) errors.push("Brand is required.");
    if (errors.length) return alert(errors.join("\n"));

    const formData = new FormData();
    formData.append("operation", "updateProduct");
    formData.append("json", JSON.stringify(jsonData));
if (errors.length) {
  Swal.fire({
    title: "Validation Error",
    html: errors.join("<br>"),
    icon: "warning",
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
              scrollbarPadding: false

  });
  return;
}

try {
  const res = await axios.post(`${baseApiUrl}/product.php`, formData);

  // 🧠 Handle malformed JSON or string responses gracefully
  let data = res.data;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = { status: "error", message: "Invalid JSON from server" };
    }
  }

if (data.status === "success") {
  await Swal.fire({
    title: "Updated",
    text: data.message || "Product updated successfully!",
    icon: "success",
    showConfirmButton: false,
    timer: 1000,
    timerProgressBar: true,
    scrollbarPadding: false
  });

  modal.hide();

  // ✅ Works across files: call global reload once modal is closed
  const modalEl = document.getElementById("blank-modal");
  modalEl.addEventListener(
    "hidden.bs.modal",
    async () => {
      if (window.refreshProductsTable) {
        await window.refreshProductsTable();
      }
    },
    { once: true }
  );
}else {
    Swal.fire({
      title: "Failed",
      text: data.message || "Update failed.",
      icon: "error",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      scrollbarPadding: false
    });
  }

} catch (err) {
  console.error("⚠️ Update request failed:", err);

  let message = "Network or server error.";
  if (err.response) {
    // Server returned a response but with error status
    message = err.response.data?.message || `Server error: ${err.response.status}`;
  } else if (err.request) {
    // No response received
    message = "No response from the server.";
  }

  Swal.fire({
    title: "Error",
    text: message,
    icon: "error",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    scrollbarPadding: false
  });
}


  });

  modal.show();
};

// --------------------
// VIEW PRODUCT MODAL
// --------------------
export const viewProductModal = async (productId) => {
  const product = await getProductDetails(productId);
  if (!product) return alert("Failed to load product details.");

  const modalEl = document.getElementById("blank-modal");
  const modal = new bootstrap.Modal(modalEl, { keyboard: true, backdrop: "static" });

  // HEADER
  const statusBadge = `
    <span class="badge ${product.is_active == 1 ? "bg-success" : "bg-danger"} px-3 py-2">
      ${product.is_active == 1 ? "Active" : "Inactive"}
    </span>
  `;

  document.getElementById("blank-modal-title").innerHTML = `
    <div class="d-flex align-items-center gap-3">
      <div class="bg-light rounded p-2 shadow-sm">
        <i class="bi bi-box-seam text-primary fs-4"></i>
      </div>
      <div>
        <h5 class="mb-0 fw-bold">${product.product_name} ${statusBadge}</h5>
        <small class="text-muted">${product.model || "No Model"}</small>
      </div>
    </div>
  `;

  // BODY
  document.getElementById("blank-main-div").innerHTML = `
    <!-- Metrics -->
    <div class="row text-center g-3 mb-4">
      <div class="col">
        <div class="p-3 border rounded shadow-sm bg-white">
          <div class="fw-bold text-muted small">Selling Price</div>
          <div class="text-success fs-5 fw-bold">₱${parseFloat(product.selling_price).toFixed(2)}</div>
        </div>
      </div>
      <div class="col">
        <div class="p-3 border rounded shadow-sm bg-white">
          <div class="fw-bold text-muted small">Cost Price</div>
          <div class="text-danger fs-5 fw-bold">₱${parseFloat(product.cost_price).toFixed(2)}</div>
        </div>
      </div>
      <div class="col">
        <div class="p-3 border rounded shadow-sm bg-white">
          <div class="fw-bold text-muted small">Reorder Level</div>
          <div class="fs-5 fw-bold">${product.reorder_level}</div>
        </div>
      </div>
    </div>

    <!-- Details Grid -->
    <div class="row g-3">
      <div class="col-md-6">
        <div class="p-3 border rounded shadow-sm h-100">
          <h6 class="fw-bold text-primary mb-3">Product Info</h6>
          <p><strong>Specs:</strong> ${product.specs || "-"}</p>
          <p><strong>Warranty:</strong> ${product.warranty_period || "-"}</p>
          <p><strong>Unit:</strong> ${product.unit_name || "-"}</p>
          <p><strong>Category:</strong> ${product.category_name}</p>
          <p><strong>Brand:</strong> ${product.brand_name}</p>
        </div>
      </div>
      <div class="col-md-6">
        <div class="p-3 border rounded shadow-sm h-100">
          <h6 class="fw-bold text-primary mb-3">Audit Trail</h6>
          <ul class="list-unstyled mb-0">
            <li><i class="bi bi-plus-circle text-success me-2"></i> Created: ${product.created_at ?? "-"} by ${product.created_by_name ?? "-"}</li>
            <li><i class="bi bi-pencil-square text-primary me-2"></i> Updated: ${product.updated_at ?? "-"} by ${product.updated_by_name ?? "-"}</li>
          </ul>
        </div>
      </div>
    </div>
  `;



  modal.show();
};
